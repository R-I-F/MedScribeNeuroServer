# Institute Admin Dashboard – Main Diagnosis (Add New & Delete)

The **backend allows Institute Admins** to create and delete main diagnoses (same as Super Admin). The institute admin dashboard UI should expose these actions so i-admins can manage main diagnosis without super admin.

## Required UI

1. **Add New Main Diagnosis** – A button (e.g. "Add main diagnosis" or "New") that opens a form/modal to create a main diagnosis.
2. **Delete Main Diagnosis** – A delete button (per row or on the detail view) that deletes the selected main diagnosis (with confirmation).

Both actions must send requests with the **Institute Admin’s JWT** (and `X-Institution-Id` if needed). The backend will scope all operations to that institution’s database.

---

## API for "Add New"

- **Method:** `POST`
- **URL:** `${API_BASE}/mainDiag`
- **Headers:** `Authorization: Bearer <institute_admin_token>`, `Content-Type: application/json`. Optionally `X-Institution-Id: <institutionId>` if not in JWT.
- **Body:**
  ```json
  {
    "title": "string (required, max 200 chars)",
    "procsArray": ["numCode1", "numCode2"] (optional),
    "diagnosis": ["icdCode1", "icdCode2"] (optional)
  }
  ```
- **Success:** `201 Created` – response body is the created main diagnosis (id, title, procs, diagnosis, etc.).
- **Errors:** `400` (validation), `401`/`403` (auth), `429` (rate limit).

**Note:** `title` is sanitized on the server (lowercase, trim, no commas). `procsArray` and `diagnosis` must reference existing procedure numCodes and diagnosis icdCodes in the same institution.

---

## API for "Delete"

- **Method:** `DELETE`
- **URL:** `${API_BASE}/mainDiag/:id`
- **Headers:** `Authorization: Bearer <institute_admin_token>`. Optionally `X-Institution-Id: <institutionId>`.
- **URL parameter:** `id` = main diagnosis UUID.
- **Success:** `200 OK` – e.g. `{ "message": "MainDiag deleted successfully" }`.
- **Errors:** `400` (invalid UUID), `401`/`403` (auth), `404` (not found), `429` (rate limit).

**Note:** If the main diagnosis is referenced by submissions, the backend may return an error (e.g. RESTRICT). The UI should show a clear message and avoid allowing delete when in use if the API enforces that.

---

## Checklist for frontend

- [ ] **Add New** button on the main diagnosis list (or a dedicated "Main diagnoses" page) for Institute Admin.
- [ ] Create form/modal: title (required), optional procedure codes (procsArray), optional diagnosis codes (diagnosis). Call `POST /mainDiag` on submit; on success, refresh list or navigate to the new item.
- [ ] **Delete** button per main diagnosis (list row or detail page). On confirm, call `DELETE /mainDiag/:id`; on success, remove from list or redirect.
- [ ] Use the same auth token (and institution context) as the rest of the i-admin dashboard. Do not hide or disable Add/Delete for Institute Admin – the backend now allows them.

For full request/response shapes and validation rules, see [Main Diagnosis (`/mainDiag`)](../API_DOCUMENTATION.md#main-diagnosis-maindiag) and [Institute Admin Dashboard – Main Diagnosis](../API_DOCUMENTATION.md#institute-admin-dashboard--main-diagnosis) in `API_DOCUMENTATION.md`.
