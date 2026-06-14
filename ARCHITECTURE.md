# Reference architecture (technical)

This document describes the **structural and behavioral patterns** of the backend so you can reproduce the same shape in a new codebase. It is intentionally **domain-agnostic**: it names layers and mechanisms, not product features or folder titles.

---

## 1. System shape

- **Modular monolith**: one deployable HTTP service; functionality is grouped by **vertical feature modules** (each module owns its HTTP surface and internal collaborators).
- **Synchronous request/response API** (REST-style routes on a single process).
- **Optional operational scripts** (CLI/migrations) live beside the app; they are not part of the online request path.

---

## 2. Runtime stack

- **Node.js** + **Express** for HTTP.
- **TypeScript** compiled to JavaScript for production.
- **reflect-metadata** enabled at entry for decorator-based DI.
- **Inversify** (or equivalent) for **constructor injection** and a **composition root** that wires all modules.

---

## 3. Composition root and modules

- A **single IoC container** registers implementations for each feature: routers, controllers, services, shared utilities, and cross-cutting services (auth tokens, mail, external HTTP clients, etc.).
- **Feature modules** are wired explicitly (no magic auto-discovery) so dependency graphs stay traceable.
- If the routes registry imports the container, use **lazy/dynamic imports** for feature routers to avoid **circular dependency** cycles between the container and route modules.

Each feature typically exposes:

| Piece | Responsibility |
|--------|----------------|
| **Router** | Declares paths, HTTP verbs, and the **middleware chain** for that route. Delegates to the controller. |
| **Controller** | Adapts HTTP request/response to application calls; stays thin. |
| **Service** | Core application logic; talks to persistence via ORM/repositories; may call other services. |
| **Provider** (optional) | Orchestration or cross-entity workflows when a single service would become a god-object; may compose multiple services and accept a **tenant-scoped database handle** per call. |
| **Persistence mapping** | ORM entity classes (schema ↔ rows); kept separate from transport DTOs where practical. |
| **Validators** | Per-route input validation (e.g. express-validator) run **before** handlers. |

Interfaces/DTOs separate **API contracts** from **persistence models** where it aids testing and clarity.

---

## 4. HTTP pipeline (global)

Order matters; typical sequence:

1. **Trust proxy** conservatively (single hop) if behind a reverse proxy; drives correct client IP for rate limiting.
2. **Security headers** (e.g. Helmet); relax only what the API needs (e.g. CSP off for JSON-only APIs).
3. **CORS** with explicit origin when using **credentials** (cookies); disallow wildcard origin with credentials.
4. **JSON body parser** with a **size cap**; optionally stash **raw body bytes** on the request for signature-verified webhooks.
5. **Cookie parser** if using HTTP-only session/auth cookies.
6. **Request logging** (structured or prefixed logs).
7. **Response envelope middleware**: wraps `res.json` so successful and error payloads share a **consistent JSON shape** (status, statusCode, message, data/error, optional meta).
8. **Global IP rate limit** as a coarse safety net; **per-route** limiters for sensitive or expensive endpoints.

After routes are registered:

9. **404 handler** that forwards a typed “not found” error.
10. **Global error handler** (four-argument Express middleware): maps thrown/pass-through errors to HTTP status and the same error payload shape; avoids leaking stack traces on common cases (e.g. 404).

---

## 5. Per-route middleware pattern

Routes that require identity typically chain:

1. **JWT extraction**: read token from **HTTP-only cookie first**, then `Authorization: Bearer`. Verify with configurable secret/issuer; attach claims to `res.locals`.
2. **Tenant / context resolver**: derive **which isolated data partition** this request targets (see §6). Reject early if missing or invalid. Allowlisted public paths bypass this.
3. **Authorization**: map roles to numeric levels or explicit sets; support **hierarchical roles** (higher privilege may call endpoints gated to lower roles) where product rules require it.
4. **Rate limiting** keyed by user or IP where abuse is a concern.
5. **Validators** for path/query/body.
6. **Handler** invoking controller/service.

Some endpoints use **stricter** rate limits or **additional** checks (e.g. “must be role X **and** flag Y in database”).

---

## 6. Data layer: registry + tenant isolation

The design uses **two classes** of relational storage:

### 6.1 Registry (“control plane”) database

- Holds **tenant metadata**: identifiers, active flags, and **connection parameters** for each tenant’s primary database.
- Small, stable schema; used at bootstrap and for resolving tenant context.

### 6.2 Tenant (“data plane”) databases

- **One primary relational database per tenant** (or per shard, if you later split further).
- Application code uses an ORM (**TypeORM**-style) with **synchronize: false**; schema changes go through **migrations**.

### 6.3 Connection manager

- A **singleton** owns a **map of ORM `DataSource` instances**, keyed by tenant id.
- **Lazy connect**: first request for a tenant creates and initializes that tenant’s pool; subsequent requests reuse it.
- **In-flight deduplication**: concurrent first requests for the same tenant await one creation promise to avoid duplicate pools.
- **SSL/TLS** options (e.g. CA bundle from env) applied when creating connections.

### 6.4 Resolving tenant context on each request

Priority order (conceptually):

1. **JWT claim** for tenant id (after login / institution selection).
2. Fallback: **header** (e.g. `X-Institution-Id`-style).
3. Fallback: **query parameter** for flows that cannot send headers yet.

Then validate tenant exists and is **active** via the registry DB before attaching the resolved **tenant id** and **data source** (or equivalent) to the request context for downstream handlers.

### 6.5 Default / fallback tenant connection

When no tenant is in context (e.g. legacy paths, seeds, or bootstrap), a **configured default** tenant connection may be used—document this carefully to avoid accidental cross-tenant writes.

---

## 7. Persistence and transactions

- Services receive a **tenant-scoped `DataSource`** (or repositories derived from it) for CRUD.
- **Provider**-style classes accept `DataSource` as a parameter when they orchestrate writes that must stay in one tenant boundary.
- Prefer explicit **transactions** for multi-step invariants; avoid long-held transactions across external HTTP calls.

---

## 8. Cross-cutting services

- **Auth token service**: issue/refresh/validate JWT; set/clear cookies consistently.
- **Email / notifications**: isolated service; templates and secrets from env.
- **External integrations**: dedicated client modules with timeouts and typed responses; no raw HTTP sprinkled in controllers.
- **Reporting/export**: may use HTML templates or PDF rendering as a separate internal pipeline feeding HTTP responses or jobs.

---

## 9. Validation and errors

- **express-validator** (or similar) per route; check `validationResult` before controller logic.
- Controllers/services throw or call `next(err)` with **status-bearing** errors for HTTP mapping.
- Global handler normalizes client-visible errors; logs **warn** for benign noise (e.g. scanner 404s) and **error** for real failures.

---

## 10. Bootstrap and graceful shutdown

**Startup:**

1. Load environment (e.g. dotenv).
2. **Validate** required DB/env configuration before binding the port.
3. Initialize **registry** DB connection (and optionally default tenant connection).
4. **Warm caches** that reduce latency on first user requests (e.g. list of active tenants).
5. Listen on HTTP.

**Shutdown (SIGTERM/SIGINT):**

1. Stop accepting new connections (`server.close`).
2. Close **all** tenant `DataSource` pools via the connection manager.
3. Close registry (and default) connections.
4. Exit process.

Register **unhandledRejection** / **uncaughtException** handlers if policy is fail-fast under orchestration (Kubernetes, PM2).

---

## 11. Security and operations checklist

- Cookie-based auth: **httpOnly**, **secure** in production, **sameSite** aligned with front-end origin.
- Rate limits at edge (optional) and in app for abuse-prone routes.
- Health check endpoint (`GET /health`) with light rate limit for probes; do not treat unknown paths as success.
- Structured logging without secrets; correlation id if you add tracing later.

---

## 12. Greenfield “starting prompt” (copy-paste)

Use the block below as a **system or project prompt** when scaffolding a new service with the same architecture:

```text
Build a TypeScript Node.js modular monolith: Express API, Inversify DI with a single composition root, TypeORM + MySQL.

Data model: a small registry database holds tenant metadata and connection info; each tenant has its own MySQL database. Implement a singleton DataSource manager that lazily pools one ORM DataSource per tenant, deduplicates concurrent first connects, and closes all pools on graceful shutdown. A default tenant connection may exist for bootstrap-only use—document it.

HTTP: global middleware order — trust proxy (1 hop), Helmet, CORS with credentials and explicit origin, JSON body with size limit and optional raw body capture for signed webhooks, cookie parser, request logging, response envelope wrapper, global IP rate limit. After routes: 404 → global error handler with consistent JSON errors.

Per-route chain where needed: JWT from cookie then Bearer, tenant resolver (JWT claim → header → query), validate tenant active via registry, role-based authorize with hierarchy, per-route rate limits, express-validator, thin controller → service; optional provider layer for multi-step orchestration receiving tenant DataSource.

Bootstrap: validate env, connect registry DB, warm tenant cache, listen. Shutdown: close HTTP server then all data sources.

No synchronize:true in production; migrations only. Feature modules: injectable router registering paths; keep routes registry using lazy imports to avoid circular deps with the container.
```

---

## 13. What to customize per product

- Exact **role model** and authorization matrix.
- Whether **tenant id** is mandatory on every route or only on subsets.
- **Caching** strategy for registry data (TTL, invalidation).
- **Async work** (queues, outbox) if you outgrow synchronous request scope—this template does not mandate them.

This file is a **pattern reference**, not a mandate to copy folder names or domain language from any existing project.
