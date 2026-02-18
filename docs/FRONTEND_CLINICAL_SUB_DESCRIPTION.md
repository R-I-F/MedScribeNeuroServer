# Frontend Update: Clinical Sub Description Field

This document describes the API and data-model change for **clinical submissions (clinical sub)** so the frontend can support the new **description** field.

## Summary

- **What:** Clinical sub now has a **`description`** text field (candidate-provided summary of the clinical activity). It is **non-null** in the database; the API always returns a string (possibly empty `""`).
- **When:** Backend and DB are updated; run the SQL migration on both databases before or with the backend deploy. Frontend can add the field to create/update forms and to display.

---

## 1. API Changes

### Create Clinical Sub — POST `/clinicalSub/`

- **New optional request field:** `description` (string). If omitted, it defaults to `""`.
- **Validation:** Optional; if sent, must be a string (trimmed).
- **Example body:**
  ```json
  {
    "candDocId": "...",
    "supervisorDocId": "...",
    "dateCA": "2025-02-15",
    "typeCA": "clinical round",
    "description": "Observed lumbar puncture and case presentation."
  }
  ```

### Update Clinical Sub — PUT `/clinicalSub/:id`

- **New optional request field:** `description` (string). Send a string to set it; send `""` to clear. Omit to leave unchanged.
- Candidates can update their own submission’s description; supervisors/admins can also set or clear it when editing.

### All GET responses (list and by ID)

- Every clinical sub object includes **`description`**:
  - `description`: `string` — non-null; text describing the activity, or `""` if none.

**Response shape (relevant fields):**
```json
{
  "id": "...",
  "candDocId": "...",
  "supervisorDocId": "...",
  "dateCA": "2025-02-01",
  "typeCA": "clinical round",
  "description": "Observed lumbar puncture and case presentation.",
  "subStatus": "pending",
  "review": null,
  "reviewedAt": null,
  "createdAt": "...",
  "updatedAt": "...",
  "candidate": { ... },
  "supervisor": { ... }
}
```

- **Backward compatibility:** If the backend is updated before the DB migration, the API might omit `description` for a short period. Frontend should treat missing `description` as `""`.

---

## 2. Frontend Checklist

- [ ] **Types / interfaces:** Add `description: string` to the clinical sub type (required in responses; optional in create/update payloads). Treat missing as `""`.
- [ ] **Create form:** Add a “Description” (or “Notes”) text area; send `description` in the POST body (omit or send `""` when empty).
- [ ] **Edit form:** Show current `description` and allow editing; send `description` in the PUT body when the user changes it (send `""` to clear).
- [ ] **List / detail views:** Display `description` where clinical sub is shown. Empty string can be shown as “No description” or hidden.
- [ ] **Dashboard bundle:** If you use `clinicalSubCand` from GET `/candidate/dashboard`, each item includes `description` (string); use the same type and display logic.

---

## 3. Database Migration (Backend / DevOps)

The column must exist in both institution databases before (or when) the new backend is deployed. Run once per environment:

**Script:** `scripts/add_clinical_sub_description_both_databases.sql`

- Adds `description TEXT NOT NULL DEFAULT ''` to `clinical_sub` in **`kasr-el-ainy`** and **`masr-el-dawly`**.
- If the column already exists, the ALTER will fail with a duplicate-column error (safe to ignore on re-run).

---

## 4. References

- **API:** See `API_DOCUMENTATION.md` → “Clinical Submissions (`/clinicalSub`)” for full request/response and error codes.
- **Backend:** `description` is stored as non-null `TEXT` (default `''`); create and update validators accept optional string; provider defaults create to `""` when omitted.
