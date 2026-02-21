# Frontend: Display submission limit errors (POST /sub/candidate/submissions)

## Context

When the candidate submits the practical submission form (AcademicPracticalSubmissionFormPage → SubmissionForm), the app calls **POST /sub/candidate/submissions**. The backend enforces:

1. **Max 2 submissions per procedure** – same candidate, same `procDocId` (calendar procedure): at most 2 submissions (only pending and approved count; rejected do not).
2. **No duplicate role per procedure** – the two submissions for the same procedure must have different `roleInSurg` values.

When either rule is violated, the API returns **400 Bad Request** with a single `error` string in the body.

## Required behavior

- On **400** from `POST /sub/candidate/submissions`, read the response body.
- If the body has an `error` field that is a **string** (not an array), treat it as a user-facing message and **display it** to the user (e.g. in a toast, alert, or inline error under the form). Do not show a generic “Request failed” without the server message.
- The backend sends exactly these two messages for submission limits; display them as-is (or with minimal wrapping):
  - `"This procedure already has 2 submissions from you. You cannot add more entries for this procedure."`
  - `"You have already submitted an entry for this procedure with this role. Please select a different role (e.g. Assistant, Observer) for this submission."`
- Other 400 responses (e.g. validation errors) may have `error` as an **array** of field errors; handle those with your existing validation UI. Only when `error` is a string should you show it as the single failure message for submission limits / business rules.

## Response shape reference

- **400 – submission limit (max 2):**  
  `{ "error": "This procedure already has 2 submissions from you. You cannot add more entries for this procedure." }`

- **400 – submission limit (duplicate role):**  
  `{ "error": "You have already submitted an entry for this procedure with this role. Please select a different role (e.g. Assistant, Observer) for this submission." }`

- **400 – validation:**  
  `{ "error": [ { "type": "field", "msg": "...", "path": "...", "location": "body" }, ... ] }`  
  (Keep using your existing validation error display for this.)

## Implementation checklist

- [ ] After calling `POST /sub/candidate/submissions`, on non-2xx response, read the JSON body.
- [ ] If `response.status === 400` and `body.error` is a string, display `body.error` to the user (toast/alert/inline).
- [ ] Do not replace or hide this message with a generic “Submission failed” unless you also show the server message.
- [ ] Optional: disable or adjust the “Submit” action when the user has already submitted 2 entries for the current procedure (e.g. by checking existing submissions for the same `procDocId` before submit), to reduce failed requests. The server will still enforce the limit.

See **API_DOCUMENTATION.md** → “Create Submission (Candidate)” for full request/response and error details.
