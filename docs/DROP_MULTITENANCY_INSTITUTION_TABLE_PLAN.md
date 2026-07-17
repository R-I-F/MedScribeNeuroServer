# Drop Multi-Tenancy → DB-Backed Single Institution — Refactor Plan

**Created:** 2026-07-17
**Backend repo/branch:** `MedScribeNeuroServer` @ `migration/mysql-to-postgres` (a.k.a. mysql-to-postgres)
**Frontend repo/branch:** `NeuroLogBookFront` @ `design-integration`
**Status:** 📋 PLAN — awaiting approval. Nothing implemented yet.

---

## 0. Why this plan exists

The app is now a **single-institution KA spoke** (Kasr Al Ainy / Cairo University). Multi-tenancy is gone,
but the *machinery* of multi-tenancy still permeates both codebases as inert shims:

- `DataSourceManager` — was "one pooled DataSource per institution UUID". Now every call resolves to the
  one `AppDataSource`, and `institutionId` is "accepted and ignored". Pure dead weight.
- `getStaticInstitution()` — pins the single institution from **env vars** (`INSTITUTION_*`), not from data.
- `institutionResolver` middleware — extracts `institutionId` from JWT/header/query, "validates", then hands
  back the same single DataSource every time.
- JWT carries an `institutionId` claim; 5 validators accept it; the frontend sends `X-Institution-Id` on
  ~160 call sites and threads `:institutionId` through its routes — all ignored by the backend now.

**User decision (2026-07-17):**
1. **Rip `institutionId` out completely.** The backend serves exactly ONE institution (KA) and will never
   serve more. No static ids threaded through requests, no per-request "resolution algorithm", no
   `DataSourceManager`.
2. **BUT keep the institution as real data:** create an `institutions` table inside the `ka-institute`
   Postgres DB holding the single Kasr Al Ainy row, so the institution's *variables*
   (`isAcademic`/`isPractical`/`isClinical`, name, code, department) remain a real, documented source of
   truth — this is what feature-gates read, and we must not break those features.

The distinction that makes this safe: **`institutionId` (tenancy routing) is redundant** and gets deleted;
the **institution's flags (feature config)** are NOT redundant — 44 frontend branch points + several backend
paths read them — and they move from scattered env/hardcoded constants into one DB row.

---

## 1. HARD RULES (do not violate)

- **NEVER write to production `SQL_DB_DEF_NAME_KA`** (MySQL kasr-el-ainy). READ-ONLY SELECTs only, and only if
  needed to confirm the institution's real values.
- **NEVER touch `main`** on either repo. Backend work only on `migration/mysql-to-postgres`; frontend work
  only on `design-integration`.
- **Only the `ka-institute` staging Postgres** is a legitimate write target (via `.env.staging` / `PSQL_*`).
- **Never edit `.env`** — only `.env.staging`.
- **Commit only when the user explicitly asks.**
- New backend migrations go in `src/migrations-ka/` (git-tracked) and MUST be added to
  `src/config/ka-migrations.config.ts` or they won't run. Verify with `npm run db:ka:migrate`.

---

## 2. 🔴 CONSTANT DOCUMENTATION IS REQUIRED (non-negotiable working rule)

This refactor is large (see §3 scope counts) and will span multiple work sessions / possible interrupts.
**The implementing agent MUST keep a running worklog so that at any moment it is known what was done and what
was not.** Concretely:

- Maintain a **progress doc** `docs/DROP_MULTITENANCY_PROGRESS.md` with a **checkpoint table**: one row per
  stage below, columns `Stage | Status (⬜/🚧/✅) | Files touched | Verified how | Notes/gotchas | Date`.
- **Update it after every sub-step**, not at the end — the same discipline the `dept-audit` / clerk-procs
  work used. If a session is interrupted, the next session reads this doc first and resumes.
- When a stage changes behavior, record the **before → after** and the **exact verification command/result**.
- Keep this plan (`DROP_MULTITENANCY_INSTITUTION_TABLE_PLAN.md`) as the *design*; keep the progress doc as the
  *ledger*. Do not conflate them.
- Also update the **"Where we stopped"** section of `CLAUDE.md` before any commit (persistent session memory).

---

## 3. Current architecture — grounded scope (verified 2026-07-17)

### Backend (`migration/mysql-to-postgres`)
| Surface | Where | Count |
|---|---|---|
| `req.institutionDataSource` reads (controllers/providers) | 24 files | **133 call sites** |
| `req.institution` / `.institutionId` / `.institutionDepartment` reads | across modules | **~148 sites** |
| `DataSourceManager` importers | auth, index, waBot, waSession, resolver, database.config | 8 files |
| `institution.service` importers (`getStaticInstitution` etc.) | auth, bundler, instituteAdmin, waBot, routes, index | 13 files |
| `institutionResolver` middleware | mounted per-router | ~30 routers + middleware |
| JWT `institutionId` claim | `authToken.service.ts` sign + signRefreshToken | 2 methods |
| Validators accepting `institutionId` | clerkLogin, adminLogin, instituteAdminLogin, createCand, auth.interface | 5 |

Request flow today: `extractJWT → institutionResolver → authorize → rateLimit → handler`. The resolver attaches
`req.institutionDataSource` (= the single `AppDataSource`), `req.institution` (= env-pinned static row),
`req.institutionId`, `req.institutionDepartment`.

### Frontend (`design-integration`)
| Surface | Where | Count |
|---|---|---|
| `selectedInstitution` / `availableInstitutions` reads | pages/components/store | **82 files** |
| Flag reads `isAcademic` / `isPractical` / `isClinical` | dashboards, nav, forms, guards | **44 reads** |
| `X-Institution-Id` header set | `src/utils/api.ts` | **~160 sites** |
| `:institutionId` route param | `src/App.tsx` (i-admin, super-admin, cm dashboards) | many routes |
| `STATIC_INSTITUTION` const | `src/store/slices/authSlice.ts` | 1 (env-fallback hardcoded) |

Today the frontend never fetches an institution from the backend — it pins `STATIC_INSTITUTION` (hardcoded,
`isPractical/isAcademic/isClinical = true`) and threads its `id` through routes/headers that the backend ignores.

---

## 4. Target architecture

**Backend serves exactly one institution, sourced from the DB, with no per-request tenancy resolution.**

1. **`institutions` table in `ka-institute`** — one row (Kasr Al Ainy). Columns mirror `IInstitution` minus the
   per-tenant `database{}` block: `id (uuid pk)`, `code`, `name`, `isActive`, `isAcademic`, `isPractical`,
   `isClinical`, `department`, timestamps. **Seed `id` = current `INSTITUTION_ID` (`550e8400-e29b-41d4-a716-446655440000`)**
   so any historical JWT/reference stays coherent.
2. **`InstitutionEntity` + a tiny `InstitutionService.getInstitution()`** that loads THE single row from
   `AppDataSource` once and caches it. This replaces env-backed `getStaticInstitution()`.
3. **`DataSourceManager` deleted.** Controllers use the one `AppDataSource` directly. `institutionResolver` is
   replaced by a slim `institutionContext` middleware that attaches `req.institution` (the DB row) +
   `req.institutionDataSource = AppDataSource` (kept as an alias to avoid touching 133 call sites in one shot —
   see Stage B3 decision).
4. **`institutionId` removed** from: JWT sign/verify, all 5 validators, headers, query parsing, and request
   attach. Old JWTs that still carry the claim are **ignored, never rejected** (backward compatible).
5. **Frontend** fetches the single institution once from a public `GET /institution` and stores it as
   `institution` (flags preserved). `availableInstitutions` array, `X-Institution-Id` headers, and
   `:institutionId` route params are removed.

**Net effect:** the concept "institution" survives as ONE documented DB row + its feature flags; the concept
"which institution is this request for" is deleted everywhere.

---

## 5. Key decisions (confirm before coding where flagged ❓)

- **D1 — DataSource plumbing.** 133 controller sites read `req.institutionDataSource`. Two options:
  - **(A, recommended) Keep the property name, change its source.** The new slim middleware sets
    `req.institutionDataSource = AppDataSource`. Zero churn at the 133 sites; `DataSourceManager` still dies.
    Rename the property to `req.dataSource` later as an optional cosmetic pass.
  - **(B) Mechanical sweep** replacing every `(req as any).institutionDataSource` with a direct
    `AppDataSource` import and deleting the middleware attach. Cleaner end-state, ~133-site diff, higher
    regression risk.
  - Plan assumes **(A)**. ❓Confirm if you'd rather pay for (B) now.
- **D2 — `req.institution` keep or drop.** ~148 reads. Keep it (now populated from the DB row) — it's the
  legitimate feature-flag carrier. Only `req.institutionId` / `req.institutionDepartment` duplicates get removed
  where they're pure tenancy. (Retain `req.institutionDepartment` only if a handler truly needs it; otherwise
  read `req.institution.department`.)
- **D3 — Frontend flags source.** Replace hardcoded `STATIC_INSTITUTION` with a `GET /institution` fetch at
  bootstrap. ❓Alternative: keep it hardcoded (simpler, but re-introduces the "documentation lives in a constant"
  smell you're trying to remove). Plan assumes the DB-backed fetch.
- **D4 — Do any tenant tables have an `institutionId` FK/column?** Must be verified in Stage B1 discovery. The
  KA spoke was built single-tenant so likely none — but if present, decide keep-as-denormalized-constant vs drop.
- **D5 — `:institutionId` routes.** Collapse `/dashboard/i-admin/:institutionId/...` etc. to param-free paths,
  with redirects from old URLs so bookmarks/in-flight sessions don't 404. ❓Confirm redirects wanted.

---

## 6. Staged implementation

> Each stage: implement → verify on staging/localhost → **update `DROP_MULTITENANCY_PROGRESS.md`**.
> Backend localhost is already up on **:3001**; frontend on **:3000**. Always `netstat` :3001 before verifying
> (zombie ts-node servers have squatted the port before — see CLAUDE.md).

### Backend

**B0 — Scaffolding + discovery**
- Create `docs/DROP_MULTITENANCY_PROGRESS.md` with the checkpoint table (all stages ⬜).
- Discovery (D4): grep entities + `ka-institute` schema for any `institutionId` column/FK on tenant tables.
- Capture the institution's real values READ-ONLY from prod `SQL_DB_DEF_NAME_KA` if an `institutions` table
  exists there, else use the canonical env values. Record findings.

**B1 — `institutions` table (migration + entity + seed)**
- New migration in `src/migrations-ka/` (next timestamp after `...610140`): `CreateInstitutionsTable` +
  seed the single KA row (`id = 550e8400-…`, `code = cairo-university`, `name = Kasr El Ainy / Cairo University`,
  all three flags `true`, `department = neurosurgery`, `isActive = true`). Clean `down()`.
- Add `InstitutionEntity` to entities + to `src/config/ka-migrations.config.ts` entity union.
- Add migration file to the ka-migrations config array. Apply with `npm run db:ka:migrate`; verify row; test
  revert→re-apply cycle; `tsc` clean.

**B2 — DB-backed single-institution service**
- Rewrite `institution.service.ts`: `getInstitution()` loads the single row via `AppDataSource` (cached);
  keep `getStaticInstitution` / `getInstitutionById` / `getInstitutionByCode` / `getAllActiveInstitutions` as
  thin backward-compatible wrappers returning the DB row (so the 13 importers don't all change at once).
- `getInstitutionById`/`ByCode` ignore their argument and return the one row (unchanged contract).
- Verify each caller still compiles; smoke a couple of endpoints that read `req.institution`.

**B3 — Delete `DataSourceManager`, add slim `institutionContext` middleware** (per D1-A)
- New middleware attaches `req.institution = await getInstitution()` and `req.institutionDataSource = AppDataSource`.
- Replace `institutionResolver` mount with `institutionContext` in `routes.config.ts` / routers.
- Delete `datasource.manager.ts`; repoint its non-request callers (`index.ts` shutdown, `waSession`,
  `waBot`, `database.config`) to `AppDataSource` / `closeDatabase()` directly.
- Verify: boot clean on :3001, a read endpoint (e.g. `/calSurg/dashboard`), graceful shutdown closes the conn.

**B4 — Strip `institutionId` from auth + validators + resolver internals**
- `authToken.service.ts`: remove `institutionId` from `sign` / `signRefreshToken` payloads (keep `departmentId`).
- Remove `institutionId` from the 5 validators + `auth.interface.ts`; login/register stop reading it.
- Remove header/query `institutionId` extraction (now handled — deleted — by the slim middleware).
- **Backward-compat:** any inbound JWT still carrying `institutionId` must pass (claim ignored, not rejected).
- Verify: login WITHOUT institutionId → 200; an old token WITH the claim → still authorized; `departmentId`
  claim (procedure-search narrowing) still present and working.

**B5 — Institution endpoint for the frontend**
- Add public `GET /institution` (singular) returning the one row's `{ id?, name, code, isAcademic, isPractical,
  isClinical, department }`. (`/institutions` plural was already retired — do not resurrect it.)
- Verify JSON shape live on :3001.

**B6 — Env cleanup**
- `.env.staging` (NOT `.env`): the `INSTITUTION_*` feature-flag vars become redundant once the DB row is the
  source of truth. Decide: keep as fallback, or remove. Keep `INSTITUTION_ID` only if still referenced. Record.

### Frontend (`design-integration`)

**F1 — Fetch the single institution at bootstrap**
- Add `api.getInstitution()` → `GET /institution`. On app bootstrap, fetch once and store as `institution`
  (with the flags). Replace `STATIC_INSTITUTION` usage; keep a hardcoded fallback only for offline/first-paint.
- `selectedInstitution` selector returns this single `institution` (keeps all 44 flag reads working unchanged).

**F2 — Remove the tenancy array + selectors**
- Drop `availableInstitutions` from state and all readers; collapse to the single `institution`.
- Confirm no institution *selector* UI remains (CM login field already removed 2026-07-17).

**F3 — Remove `X-Institution-Id` headers**
- Delete the ~160 header injections in `src/utils/api.ts` and the `institutionId` params they came from.
- Verify a build + a couple of institute-admin calls still work (backend ignores/omits the header).

**F4 — Collapse `:institutionId` routes**
- Rewrite `/dashboard/i-admin/:institutionId/...`, `/dashboard/super-admin/:institutionId/...`,
  `/dashboard/cm/:institutionId` → param-free paths. Update all `navigate(...)` / `Link` builders.
- Add redirects from the old param URLs (per D5). Verify each dashboard entry route.

**F5 — Remove `institutionId` from user/auth model**
- Drop `institutionId` from the stored user object, login payloads, and JWT-restore logic. Keep `departmentId`.
- `tsc && vite build` clean.

---

## 7. Verification matrix (end-state acceptance)

- Backend boots on :3001 with `DataSourceManager` deleted; no `institutionId` in any JWT it issues.
- `institutions` table in `ka-institute` has exactly 1 row (KA), id `550e8400-…`; revert/re-apply clean.
- `req.institution` still carries the three flags (from DB) everywhere they're read.
- Login (candidate/supervisor/clerk/instituteAdmin/superAdmin) works with `{email,password}` only; old tokens
  with a stale `institutionId` claim still authorize; `departmentId` narrowing intact.
- Frontend `tsc + vite build` clean; dashboards/nav gate correctly on the DB-sourced flags; no `X-Institution-Id`
  sent; no `:institutionId` route param; old dashboard URLs redirect, don't 404.
- E2E smoke: clerk login → calendar → POST /calSurg → dashboard renders (the flag-gated practical flow).
- **Prod `SQL_DB_DEF_NAME_KA` untouched** (read-only if touched at all); `main` untouched on both repos.

---

## 8. Rollback / safety

- All backend schema changes are single migrations with tested `down()`; revert restores the pre-table state.
- D1-A keeps the 133 datasource call sites byte-identical, so the highest-churn risk is deferred/optional.
- Frontend changes are branch-local on `design-integration`; `main` frontend untouched.
- No production DB writes anywhere in this plan.

---

## 9. ▶ Next action

Await user approval of §5 decisions (esp. D1, D3, D5), then start at **B0** (scaffold the progress doc) and
proceed stage by stage, updating `docs/DROP_MULTITENANCY_PROGRESS.md` after every sub-step.
