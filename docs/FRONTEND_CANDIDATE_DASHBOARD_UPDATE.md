# Frontend: Use GET /candidate/dashboard Instead of Nine Separate Calls

**Audience:** Frontend app / frontend agent  
**Date:** 2026-02-13  
**Summary:** The API exposes **GET /candidate/dashboard**, which returns in one response the same data as nine candidate dashboard endpoints. It is implemented by the **bundler** module (the same module that serves **GET /references**). Use this when loading the candidate dashboard in **academic and practical** institutions to replace those nine calls with one.

**Related:** For the reference-data bundle (consumables, equipment, approaches, regions, positions), see [FRONTEND_REFERENCES_UPDATE.md](FRONTEND_REFERENCES_UPDATE.md).

---

## What Changed

- **New endpoint:** `GET /candidate/dashboard`
- **Purpose:** Single request that returns all dashboard data for the logged-in candidate: stats, points, submissions, CPT/ICD/supervisor analytics, activity timeline, submission ranking, and academic ranking.
- **Who can call:** **Candidates only.** The endpoint returns **403 Forbidden** for non-candidates or when the institution is not both **academic and practical** (`isAcademic` and `isPractical`). In that case, the front end should keep using the nine individual endpoints.
- **Auth & rate limit:** Requires candidate auth (JWT). 200 requests per 15 minutes per user. Institution from JWT or `X-Institution-Id` header.
- **Caching:** No server-side caching. Data is per-candidate and can change. The front end may cache the response (e.g. refetch every 15 minutes) to reduce load.

---

## Request

- **Method:** GET  
- **URL:** `/candidate/dashboard` (base URL as for the rest of the API)
- **Headers:** Same as other authenticated candidate endpoints:
  - `Authorization: Bearer <token>` or `Cookie: auth_token=<token>`
  - `X-Institution-Id: <institutionId>` if not already in JWT

---

## Response (200 OK)

The response body is a single JSON object with nine keys. Each value has the same shape as the corresponding single endpoint:

```json
{
  "stats": { ... },
  "points": { ... },
  "submissions": [ ... ],
  "cptAnalytics": [ ... ],
  "icdAnalytics": [ ... ],
  "supervisorAnalytics": [ ... ],
  "activityTimeline": { "items": [ ... ] },
  "submissionRanking": [ ... ],
  "academicRanking": [ ... ]
}
```

- **stats** – Same as `GET /sub/candidate/stats`.
- **points** – Same as `GET /event/candidate/points`.
- **submissions** – Same as `GET /sub/candidate/submissions`.
- **cptAnalytics** – Same as `GET /sub/cptAnalytics`.
- **icdAnalytics** – Same as `GET /sub/icdAnalytics`.
- **supervisorAnalytics** – Same as `GET /sub/supervisorAnalytics`.
- **activityTimeline** – Same as `GET /activityTimeline` (object with `items` array).
- **submissionRanking** – Same as `GET /sub/submissionRanking`.
- **academicRanking** – Same as `GET /event/academicRanking`.

The API returns this object directly (no top-level `status`/`data` wrapper).

---

## When to Use This Endpoint

- **Use GET /candidate/dashboard** when:
  - The user is a **candidate**.
  - The institution is **academic and practical** (you can call the endpoint and handle 403 if not).
  - You need the full dashboard payload in one go (e.g. initial dashboard load).

- **Use the nine separate endpoints** when:
  - The user is not a candidate, or you are not sure about institution type (avoid 403 by not calling the bundle).
  - You only need a subset of the data (e.g. only stats or only submissions).
  - You received **403** from GET /candidate/dashboard (institution not academic and practical); in that case fall back to the nine calls.

---

## Migration for the Front End

**Before (nine calls):**
```text
GET /sub/candidate/stats
GET /event/candidate/points
GET /sub/candidate/submissions
GET /sub/cptAnalytics
GET /sub/icdAnalytics
GET /sub/supervisorAnalytics
GET /activityTimeline
GET /sub/submissionRanking
GET /event/academicRanking
```

**After (one call, when allowed):**
```text
GET /candidate/dashboard
```

1. On candidate dashboard load (academic+practical flow), call **GET /candidate/dashboard** first.
2. If the response is **200**, map the keys to your existing state:
   - `response.stats` → candidate stats
   - `response.points` → candidate points
   - `response.submissions` → candidate submissions list
   - `response.cptAnalytics` → CPT analytics
   - `response.icdAnalytics` → ICD analytics
   - `response.supervisorAnalytics` → supervisor analytics
   - `response.activityTimeline` → activity timeline (use `response.activityTimeline.items` if you currently use the `items` array from GET /activityTimeline)
   - `response.submissionRanking` → submission ranking
   - `response.academicRanking` → academic ranking
3. If the response is **403** (e.g. "Dashboard bundle is only available for candidates in academic and practical institutions"), fall back to fetching the nine endpoints individually.
4. Optionally cache the dashboard response on the client (e.g. refetch every 15 minutes) to limit repeated requests.

---

## Error Handling

- **400 Bad Request:** Missing or invalid institution context (e.g. no `institutionId` in JWT and no `X-Institution-Id` header).
- **401 Unauthorized:** Missing or invalid auth token, or user is not a candidate.
- **403 Forbidden:** User is not a candidate, or institution is not active, or institution is not both academic and practical. Use the nine individual endpoints as fallback when appropriate.
- **404 Not Found:** Institution not found for the given `institutionId`.
- **429 Too Many Requests:** User exceeded 200 requests per 15 minutes for this endpoint.
- **500 Internal Server Error:** Server or database error; retry or show a generic error.

---

## Full API Details

See the project root **API_DOCUMENTATION.md**, section **Candidate Dashboard (`/candidate/dashboard`)**, for the full description, rate limits, headers, and error formats.
