# Institute Admin Dashboard – Candidates List & Snapshots

This document is a prompt for the **frontend agent**. It describes what the backend already exposes and what the frontend should do from a data/API perspective. It does **not** prescribe UI layout, styling, or caching details.

---

## High-level requirement

Add a **“Candidates” entry** to the **Institute Admin dashboard** that:

1. When clicked, navigates to a **Candidates page** showing a **searchable list of candidates** for the current institution.
2. Each row in the list shows a **brief summary** per candidate based on the backend data.
3. When a **single candidate is clicked**, navigate to a **candidate-specific dashboard snapshot view** for that candidate, using the existing backend semantics.

All requests must be made **as the Institute Admin** for the currently selected institution, using the same auth mechanism and institution scoping as the rest of the dashboard.

---

## Backend endpoints you should use

### 1. Paginated candidate dashboards (list view)

- **Method:** `GET`  
- **URL:** `${API_BASE}/instituteAdmin/candidates/dashboard`
- **Auth:** Institute Admin (JWT / cookies, plus institution context via JWT or `X-Institution-Id`).
- **Query params:**
  - `page` (optional, integer, default `1`)
  - `pageSize` (optional, integer, default `20`, max `100`)

**What it returns:** A **paginated list of candidate “dashboard snapshots”** for the current institution. Each item includes:

- `candidate`: core candidate info (id, fullName, rank, regDeg, etc.).
- `stats`: submission stats (approved/pending/rejected counts).
- `submissions`: submissions for that candidate (same shape as used in the existing candidate dashboard).
- `cptAnalytics`, `icdAnalytics`, `supervisorAnalytics`: derived analytics from submissions.
- `points`: only present when the institution is **academic** (`institution.isAcademic === true`); contains at least `totalPoints`.
- `clinicalSubCand`: only present when the institution is **clinical** (`institution.isClinical === true`); list of clinical subs for that candidate.

**How to use it in the Candidates page:**

- Use this endpoint as the **primary data source for the Candidates list**.
- For each row in the list, you can build a **brief summary** from:
  - `candidate.fullName`, `candidate.regDeg` / `rank` (identity).
  - `stats.totalApproved`, `stats.totalPending`, etc. (quick performance snapshot).
  - `points.totalPoints` if present (academic summary).
  - Presence/length of `clinicalSubCand` if present (clinical activity hint).
- The list should be **searchable**. Since the backend currently exposes pagination but not explicit text search on this endpoint, the frontend can:
  - Start with **client-side search within the current page** (minimum requirement), and
  - Optionally combine with separate calls (see below) if you later add server-side filters.

> Important: This endpoint is **read-only aggregation**; you do not need to mutate anything here. Just call it with `page` / `pageSize` and render the items.

---

### 2. Existing candidates list (optional support data)

- **Method:** `GET`  
- **URL:** `${API_BASE}/instituteAdmin/candidates`

This returns the **raw candidate list** (no dashboard stats). It can be used if you need a complete candidate directory or want to implement more advanced search/autocomplete over all candidates, but for the **Candidates dashboard page** the primary source should remain:

- `GET /instituteAdmin/candidates/dashboard`

Use this raw list only if you need **extra fields** not present in the snapshot, or if you later introduce server-side search endpoints.

---

### 3. Candidate-specific dashboard snapshot (detail view)

There are **two options** for the institute admin to view a **single candidate’s dashboard snapshot** once they click a row in the list:

1. **Reuse the data from the list call**  
   - From `GET /instituteAdmin/candidates/dashboard`, you already have a full dashboard snapshot for each candidate in `items[]`.
   - For the candidate the user clicked, you can **route to a detail page** and pass the snapshot via state/URL or a client-side store.  
   - This avoids an extra backend call and keeps the backend unchanged.

2. **Or, call the existing candidate dashboard endpoint in “impersonation” mode** (if/when allowed by product decisions)  
   - There is an existing **candidate self-dashboard**:
     - `GET /candidate/dashboard` (behind candidate auth).
   - If the product later supports an “admin view as candidate” mode, the frontend could be wired to:
     - Switch the auth context to that candidate; or
     - Use a future admin-only endpoint that behaves like `/candidate/dashboard` but is scoped by a candidateId passed by admin.  
   - **Right now**, there is no dedicated admin “dashboard by candidateId” endpoint; the recommended approach is to **use the snapshot already returned by the admin bundler** (`/instituteAdmin/candidates/dashboard`) for the detailed view.

For this task, assume **Option 1**: the per-candidate dashboard page is just a different **view over the snapshot data** that the list endpoint already returned.

---

## Required frontend behaviors (from backend perspective)

1. **Add “Candidates” navigation entry** under the Institute Admin dashboard that routes to the **Candidates page**.
2. On the Candidates page:
   - Call `GET /instituteAdmin/candidates/dashboard?page=1&pageSize=<N>` to fetch the first page.
   - Render each item as a row with:
     - Candidate identification from `candidate` object.
     - Key stats from `stats` (e.g. approved / pending counts).
     - If present, academic points (`points.totalPoints`) and/or indication that clinical entries exist (`clinicalSubCand.length > 0`).
   - Provide a **search box** that at minimum filters **client-side** within the loaded items by fields such as `candidate.fullName`, `regDeg`, `rank`, etc.
3. When a candidate row is clicked:
   - Navigate to a **candidate dashboard snapshot view** (new route/screen).
   - Use the already-fetched snapshot (from `items[]`) as the data source for that view.
   - Do **not** assume any new backend endpoints; rely on the admin bundler and existing candidate dashboard semantics.

No additional backend changes are required beyond the existing endpoints documented in `API_DOCUMENTATION.md` (see `GET /instituteAdmin/candidates/dashboard` and `GET /instituteAdmin/candidates`).

---

## E-Certificate PDF download – do not override the filename

When the user downloads the **candidate report PDF** (E-Certificate), the backend returns the file with a **specific filename** in the `Content-Disposition` header. That filename is:

**`CandidateName - Ecertificate - InstitutionName - DepartmentName.pdf`**

(all in PascalCase, e.g. `YoussefAymanYoussefRagheb - Ecertificate - KasrElAinyCairoUniversity - Neurosurgery.pdf`).

**Frontend requirement:**  
**Do not change or override this name.** Do not use a hardcoded pattern like `LIBELUSpro_candidate_report_<candidateId>.pdf` or derive the filename from the URL. Use the filename provided by the server.

**How to do it:**

- When triggering the download (e.g. from a “Download PDF” / “E-Certificate” button), either:
  1. **Use a direct link** with `download` attribute pointing at the report URL (e.g. `<a href="${reportUrl}" download>Download</a>`). Many browsers will then use the filename from the response `Content-Disposition` header. Do **not** set a custom `download="..."` value that overrides the server filename.
  2. **Or**, if you use `fetch()` and then save the file programmatically (e.g. with a file-saver library):
     - Read the filename from the response header:  
       `Content-Disposition` (prefer the `filename*=UTF-8''...` part if present, then fall back to `filename="..."`).
     - Use that value as the saved file name. Do **not** pass a custom name built from `candidateId` or any other client-side pattern.

**Summary:** The backend sends the correct download name. The frontend must use it and must not replace it with a different name.

