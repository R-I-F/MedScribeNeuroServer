# Frontend: Candidate Dashboard for Practical-Only Institutions

**Audience:** Frontend app / frontend agent  
**Date:** 2026-02-13  
**Summary:** For institutions with **practical training only** (`isPractical: true`, `isAcademic: false`), **GET /candidate/dashboard** returns a **seven-key** bundle (no event points or academic ranking). This document explains how to use the same endpoint and how to handle the response shape.

**Related:** For the full (nine-key) dashboard used in academic-and-practical institutions, see [FRONTEND_CANDIDATE_DASHBOARD_UPDATE.md](FRONTEND_CANDIDATE_DASHBOARD_UPDATE.md). For reference data, see [FRONTEND_REFERENCES_UPDATE.md](FRONTEND_REFERENCES_UPDATE.md).

---

## Institution Types and Dashboard Shape

The API uses two institution flags:

- **isAcademic** – institution has academic (e.g. journal/event) training.
- **isPractical** – institution has practical (e.g. surgical submission) training.

**GET /candidate/dashboard** is available for any institution where **isPractical is true**. The **response shape** depends on the institution:

| Institution type              | Response keys |
|------------------------------|----------------|
| Academic + practical          | 9 keys: stats, points, submissions, cptAnalytics, icdAnalytics, supervisorAnalytics, activityTimeline, submissionRanking, academicRanking |
| **Practical only**            | **7 keys:** stats, submissions, cptAnalytics, icdAnalytics, supervisorAnalytics, activityTimeline, submissionRanking |

For **practical-only** institutions there are **no** `points` or `academicRanking` keys (events/academic ranking are not applicable).

---

## Request (Same for All Institutions)

- **Method:** GET  
- **URL:** `/candidate/dashboard`  
- **Headers:** Same as other authenticated candidate endpoints:
  - `Authorization: Bearer <token>` or `Cookie: auth_token=<token>`
  - `X-Institution-Id: <institutionId>` if not already in JWT

---

## Response (200 OK) – Practical-Only Institutions

When the logged-in candidate belongs to an institution with `isPractical: true` and `isAcademic: false`, the response body is a single JSON object with **seven** keys:

```json
{
  "stats": { ... },
  "submissions": [ ... ],
  "cptAnalytics": [ ... ],
  "icdAnalytics": [ ... ],
  "supervisorAnalytics": [ ... ],
  "activityTimeline": { "items": [ ... ] },
  "submissionRanking": [ ... ]
}
```

- **stats** – Same as `GET /sub/candidate/stats`.
- **submissions** – Same as `GET /sub/candidate/submissions`.
- **cptAnalytics** – Same as `GET /sub/cptAnalytics`.
- **icdAnalytics** – Same as `GET /sub/icdAnalytics`.
- **supervisorAnalytics** – Same as `GET /sub/supervisorAnalytics`.
- **activityTimeline** – Same as `GET /activityTimeline` (object with `items` array).
- **submissionRanking** – Same as `GET /sub/submissionRanking`.

The API returns this object directly (no top-level `status`/`data` wrapper). There are **no** `points` or `academicRanking` keys.

---

## How to Use It on the Front End

### 1. Use the same endpoint

Call **GET /candidate/dashboard** for **all** institutions where the user is a candidate. You do **not** need a separate URL for practical-only institutions.

### 2. Detect response shape by keys

After a successful 200 response, check which keys exist:

- If **`academicRanking`** (or **`points`**) is present → **full bundle** (academic + practical). Use all nine keys.
- If **`academicRanking`** and **`points`** are absent → **practical-only bundle**. Use the seven keys; do not render event points or academic ranking UI (or hide those sections for this institution).

Example (pseudo-code):

```ts
const data = await fetch('/candidate/dashboard', { ... }).then(r => r.json());

if ('academicRanking' in data && 'points' in data) {
  // Full bundle: show stats, points, submissions, analytics, timeline, submission ranking, academic ranking
  setDashboard({ ...data, hasAcademic: true });
} else {
  // Practical-only: show stats, submissions, analytics, timeline, submission ranking only
  setDashboard({ ...data, hasAcademic: false });
}
```

### 3. Optional: use institution metadata

If your app already has the institution object (e.g. from **GET /institutions** or login response), you can derive the dashboard type without parsing the bundle:

- `institution.isAcademic && institution.isPractical` → expect **9 keys** (full bundle).
- `institution.isPractical && !institution.isAcademic` → expect **7 keys** (practical bundle).

You can then type the response or choose which UI sections to show (e.g. hide "Academic ranking" and "Event points" for practical-only).

### 4. Fallback on 403

If **GET /candidate/dashboard** returns **403** with a message that the dashboard is only for institutions with practical training, the institution has `isPractical: false`. In that case, do not use the dashboard bundle; call the individual endpoints (e.g. GET /sub/candidate/stats, GET /sub/candidate/submissions, etc.) as needed.

---

## Summary

| Topic | Detail |
|-------|--------|
| **Endpoint** | Same: **GET /candidate/dashboard** |
| **Practical-only response** | 7 keys: stats, submissions, cptAnalytics, icdAnalytics, supervisorAnalytics, activityTimeline, submissionRanking |
| **No keys for practical-only** | `points`, `academicRanking` |
| **How to detect** | Check for presence of `academicRanking` or `points`, or use institution `isAcademic` / `isPractical` |
| **UI** | For practical-only, do not show event points or academic ranking (or hide those sections). |
