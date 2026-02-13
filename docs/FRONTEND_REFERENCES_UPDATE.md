# Frontend: Use GET /references Instead of Five Separate Calls

**Audience:** Frontend app / frontend agent  
**Date:** 2026-02-13  
**Summary:** The API now exposes **GET /references**, which returns in one response the same data as GET /consumables, GET /equipment, GET /approaches, GET /regions, and GET /positions. Use this endpoint to replace those five calls where you need all reference lists (e.g. dashboard, forms, filters).

---

## What Changed

- **New endpoint:** `GET /references`
- **Purpose:** Single request that returns all five reference lists (consumables, equipment, approaches, regions, positions).
- **Auth & rate limit:** Same as the existing reference endpoints: requires auth (Super Admin, Institute Admin, Supervisor, or Candidate), 200 requests per 15 minutes per user. Institution is taken from JWT or `X-Institution-Id` header.
- **Caching:** The server caches the response per institution until the process restarts. No need to cache aggressively on the front end for this endpoint if you prefer a single source of truth from the API.

---

## Request

- **Method:** GET  
- **URL:** `/references` (base URL as for the rest of the API)
- **Headers:** Same as other authenticated endpoints:
  - `Authorization: Bearer <token>` or `Cookie: auth_token=<token>`
  - `X-Institution-Id: <institutionId>` if not already in JWT (e.g. pre-login flows that support it)

---

## Response (200 OK)

The response body is a single JSON object with five keys, each an array of objects:

```json
{
  "consumables": [
    { "id": "<uuid>", "consumables": "<string>" }
  ],
  "equipment": [
    { "id": "<uuid>", "equipment": "<string>" }
  ],
  "approaches": [
    { "id": "<uuid>", "approach": "<string>" }
  ],
  "regions": [
    { "id": "<uuid>", "region": "<string>" }
  ],
  "positions": [
    { "id": "<uuid>", "position": "<string>" }
  ]
}
```

- **consumables:** Same shape as `GET /consumables` response body (array of `{ id, consumables }`).
- **equipment:** Same shape as `GET /equipment` response body (array of `{ id, equipment }`).
- **approaches:** Same shape as `GET /approaches` response body (array of `{ id, approach }`).
- **regions:** Same shape as `GET /regions` response body (array of `{ id, region }`).
- **positions:** Same shape as `GET /positions` response body (array of `{ id, position }`).

Note: Some other API responses wrap lists in a `data` (or similar) envelope. **GET /references** returns the object above directly (no top-level `status`/`data` wrapper).

---

## Migration for the Front End

**Before (five calls):**
```text
GET /consumables
GET /equipment
GET /approaches
GET /regions
GET /positions
```

**After (one call):**
```text
GET /references
```

- Where you currently fetch all five lists (e.g. on dashboard load or a “reference data” store), replace those five requests with a single **GET /references**.
- Map the response to your existing state or types:
  - `response.consumables` → same as previous consumables list
  - `response.equipment` → same as previous equipment list
  - `response.approaches` → same as previous approaches list
  - `response.regions` → same as previous regions list
  - `response.positions` → same as previous positions list
- You can keep calling **GET /consumables/:id**, **GET /equipment/:id**, etc. when you only need a single item by ID; those endpoints are unchanged.
- The individual **GET /consumables**, **GET /equipment**, etc. endpoints remain available if a screen only needs one list.

---

## Error Handling

- **400 Bad Request:** Missing or invalid institution context (e.g. no `institutionId` in JWT and no `X-Institution-Id` header).
- **401 Unauthorized:** Missing or invalid auth token.
- **403 Forbidden:** User role not allowed (must be Super Admin, Institute Admin, Supervisor, or Candidate).
- **429 Too Many Requests:** User exceeded 200 requests per 15 minutes for this endpoint.
- **500 Internal Server Error:** Server or database error; retry or show a generic error.

---

## Full API Details

See **API_DOCUMENTATION.md**, section **References (`/references`)**, for the full description, rate limits, and examples.
