# Frontend: Voice-to-Surgical-Notes in the Submission Form

Implement a **voice input** feature in the submission form so users can record surgical notes and have them transcribed and contextualized by the backend (Gemini). The backend returns generated surgical notes; the frontend should put that text into the surgical notes field so the user can edit and submit as usual.

**Important:** Voice recording is used **while the user is creating the submission** (the submission is not yet saved, so there is no submission id). The backend provides a single endpoint that uses the **calendar surgery (procedure) id** (`calSurgId`), which the frontend already has when the user has selected a procedure.

**AI behavior (backend):** The voice may be in **any language** (e.g. English, Arabic). Gemini is instructed to transcribe/translate to **English** and to output **only** professional surgical notes. The case context (patient, hospital, procedure, team, diagnosis, form data) is sent as **reference only**—to resolve terminology and match the procedure. The AI does **not** re-type or repeat the full calSurg/sub data; it produces surgical notes based on the translated voice and the context.

---

## Backend contract

- **Endpoint:** `POST /sub/calSurg/:calSurgId/generateSurgicalNotesFromVoice`
- **Base URL:** Your API base (e.g. `https://your-api.com` or relative `/sub/...` if same origin). The sub router is mounted at `/sub`, so the full path is `/sub/calSurg/:calSurgId/generateSurgicalNotesFromVoice`.
- **Path param:** `calSurgId` = UUID of the **calendar surgery (procedure)** the user has selected. This id exists as soon as the user picks a procedure; the backend loads that procedure (patient, hospital, procedure name, date, etc.) and uses it as context for the AI. No submission id is required. (Same value as `procDocId` on the submission form.)
- **Auth:** Authenticated users only: **candidates**, **supervisors**, **institute admins**, and **super admins** can call this endpoint. Send the same way as other authenticated requests (e.g. `Authorization: Bearer <token>`). If your app uses institution-scoped requests, include `X-Institution-Id: <institution_uuid>`.
- **Request body:** `multipart/form-data` with a single file field named **`audio`** (the recorded voice file).
- **Allowed audio types:** `audio/webm`, `audio/mp3`, `audio/mpeg`, `audio/wav`, `audio/ogg`, `audio/flac`, `audio/aac`. Max size: **20 MB**.
- **Response (200):** The API uses the standard response wrapper. The generated text is in **`data.surgicalNotes`** (i.e. `response.data.surgicalNotes` if you parse the JSON body). See [API_DOCUMENTATION.md](../API_DOCUMENTATION.md) for the full response format.
- **Errors:** `400` (missing/invalid audio), `404` (CalSurg not found), `500` (AI not configured or failure). Error details are in the `error` field of the standard error wrapper.

---

## What to implement in the submission form

1. **Where:** Next to or above the **surgical notes** text area (the field that maps to `surgNotes` when submitting the form). Enable the voice button once the user has selected a procedure (so you have `calSurgId` or `procDocId`).

2. **UI:**
   - Add a **“Record” / “Voice input”** control (e.g. a button or icon). Optionally a **“Stop”** (or toggle) to end recording.
   - While recording: show a clear “Recording…” state (e.g. disabled “Record” + spinner or pulse, or a “Stop” button).
   - After recording: send the audio to the backend; while the request is in flight show a loading state (e.g. “Generating notes…”).
   - On success: put the returned `surgicalNotes` (from `data.surgicalNotes` in the response) into the surgical notes field. Prefer **replacing** the current value; if your UX prefers **appending**, append with a newline. Let the user **edit** the text before submitting the form.
   - On error: show the API error message (e.g. toast or inline error) and do not clear or overwrite the existing surgical notes.

3. **When to call the API:** User has selected a procedure → you have `calSurgId` (or `procDocId`). Call `POST /sub/calSurg/:calSurgId/generateSurgicalNotesFromVoice` with the recorded audio. Do not require the submission to be saved first.

4. **Recording (browser):**
   - Use **`navigator.mediaDevices.getUserMedia({ audio: true })`** to get a `MediaStream`.
   - Use **`MediaRecorder`** to record that stream. Prefer a format the backend accepts (e.g. `audio/webm` in Chrome; backend accepts the MIME types listed above).
   - On “Stop”, get the recorded blob from the `MediaRecorder`, then send it in the `audio` field of a **`FormData`**.
   - Example:  
     `const formData = new FormData(); formData.append("audio", audioBlob, "recording.webm");`  
     `const res = await fetch(apiBase + "/sub/calSurg/" + calSurgId + "/generateSurgicalNotesFromVoice", { method: "POST", headers: { "Authorization": "Bearer " + token }, body: formData });`  
     `const json = await res.json(); const surgicalNotes = json.data?.surgicalNotes ?? "";`  
   - Do **not** set `Content-Type` manually for `FormData`; the browser will set it with the correct boundary.
   - Handle **CORS** if the frontend is on a different origin (same as for other API calls).

5. **Permissions:** The backend allows **candidates**, **supervisors**, **institute admins**, and **super admins**. Show the voice button to any of these roles when they are on the submission form. Other roles (e.g. clerk) will receive 403.

6. **Accessibility and UX:** Label the control (e.g. “Record surgical notes”). If the user denies the microphone permission, show a short message. After inserting the generated notes, focus or scroll to the surgical notes field so the user can review and edit.

---

## Summary checklist for frontend

- [ ] Add a Record / Voice input control next to the surgical notes field.
- [ ] Once a procedure is selected, use `calSurgId` (or `procDocId`) and call `POST /sub/calSurg/:calSurgId/generateSurgicalNotesFromVoice` with the `audio` file in `FormData`. No submission id needed.
- [ ] Use the same auth and institution headers as for other submission API calls.
- [ ] On 200, set the form’s surgical notes value from `data.surgicalNotes` (replace or append per your UX).
- [ ] Show loading state while recording and while the request is in progress; show errors on failure.
- [ ] Allow the feature for candidates, supervisors, institute admins, and super admins (backend enforces this). Do not store or upload the audio elsewhere; it is only sent for this request and is not persisted.
