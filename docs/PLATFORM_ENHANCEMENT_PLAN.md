# Platform Enhancement Plan: verifiable E-Certificate, fresher dashboards, smart tools, realtime

Status (updated 2026-11-24): **A, A2, B and D are LIVE in production.** C, E, F, G, H and I are not started.
Created 2026-11-20. Repos: backend `MedScribeNeuroServer`, frontend `NeuroLogBookFront`.
Each piece of work gets its own purpose-named branch off `main`. Nothing is committed or pushed without an explicit ask (pushing `main` deploys production).

## Checkpoint table (update after every step)

| # | Stage | Status | Notes |
|---|-------|--------|-------|
| A | Certificate bug fixes (6 items) | **LIVE 2026-11-20** | backend `29ef189` on main; no migration |
| A2 | Full Logbook Record PDF (landscape, every submission, institute admin only) | **LIVE 2026-11-20** | backend `29ef189` + frontend `e6b13df` on main; no migration |
| B | Verifiable certificate: `certificates` table, QR, public verify page, cover page | **LIVE 2026-11-21** | migration 350 applied by the user; backend `42c48f5` + frontend `103154a`; verify link pinned to `https://libeluspro.com` (`5060c37`) |
| C | Candidate self-download of the certificate | **not started** | next in line; B is live, so nothing blocks it |
| D | AI summary cache | **LIVE with B** | reuses `aiSummary` when the snapshot hash matches |
| E | Dashboard freshness via `/me/updates` polling | **not started** | no infra change |
| F | Milestone and gap tracker | **not started** | blocked on a user decision: who supplies the target numbers |
| G | Smart tools (case pre-fill, duplicate flags, supervisor triage, weekly digest, NL analytics) | **not started** | each one gets its own mini-plan |
| H | True realtime push (WebSocket or SSE on an `api.` subdomain) | **not started** | infra decision (Q6) not asked yet |
| I | UI/UX pass (progress hero, quick log, offline drafts, error messages) | **not started** | frontend |
| J | Replace "Other" on procedures/diagnoses with search, then a required description | **built + verified locally 2026-11-24, uncommitted, not deployed** | full plan: `docs/OTHER_FIELD_SEMANTIC_SEARCH_PLAN.md`; certificate/PDF part deferred |

Recommended order: **C and E next (finishing Tier 1)**, then F, then G items one at a time, then H when live seat counts are wanted, I alongside.

### Loose ends from the shipped stages (still open)
- Test certificate `LP-S225-RWEK` was issued before the link fix and carries the old neurologbook.com link: revoke it.
- Railway shared `FRONTEND_URL` was updated to libeluspro.com by the user on 2026-11-22; confirm the redeploy picked it up (CORS header for libeluspro.com).
- Offered, not built: a "superseded" status for older certificates when a newer one is issued.
- The i-admin certificate panel was verified over the API only, never click-tested in a browser.

---

## Findings this plan is based on (verified by reading the code, 2026-11-20)

- Candidate report generator: `InstituteAdminProvider.generateCandidateReportPdf` (`src/instituteAdmin/instituteAdmin.provider.ts:831`), layout in `buildCandidateReportPdfBuffer` (line ~1243). Shared header and footer: `src/pdf/reportLayout.ts`. Route: `GET /instituteAdmin/candidates/:candidateId/report` (institute admin only).
- Footer text reads `"LIBELUSpro - The Inteligent Lofbook ..."` (`reportLayout.ts:19`). It prints on the candidate, supervisor and submission reports.
- The header prints `institution.department`, the single-department-era column that is `'neurosurgery'` for every account. A PEDSURG candidate's certificate therefore reads "Department: Neurosurgery". (The sidebar had the same defect, fixed there on 2026-09-24.)
- `Report generated: ${new Date().toLocaleString()}` runs on Railway (UTC), so it prints UTC in US format.
- The "by year" breakdown uses `sub.timeStamp ?? createdAt` (submission time), not `calSurg.procDate` (operation date). Imported historical logbooks are counted in the import year.
- The clinical section calls `clinicalSubProvider.getMineOrAll(ds, { callerCandidateId: undefined })`, i.e. every clinical submission in the institution, then filters in memory.
- The AI summary is a synchronous Gemini call on every download, never cached.
- The PDF has no issue id, signature, QR or any way for a third party to check that it is genuine.
- Frontend `CandidateECertificatePage.tsx` is a placeholder card ("will be available once you have completed the required milestones"), old gray skin, EN only. Candidates cannot get their own certificate.
- The candidate dashboard fires about 11 requests (`queries/candidateQueries.ts:68`); the global `staleTime` is 15 min (`main.tsx:19`). An approval can take up to 15 min to appear without a reload.
- No WebSocket, SSE or polling endpoint exists. All browser traffic goes Cloudflare -> Netlify `/api/*` proxy -> Railway. The Netlify proxy is not a reliable path for WebSocket upgrades or long-lived SSE, so true push needs a direct origin (Stage H).

---

## Stage A: certificate bug fixes (backend only, no migration)

1. `reportLayout.ts` footer: "The Intelligent Logbook for Medical Practice & Training".
2. Department in the header: take it from the **candidate's** `departmentId` (resolved to the mirror `departments` row, English name). Same for the supervisor report (the supervisor's department) and the all-supervisors report (the admin's scope, or "All departments" when institution-wide). `drawReportHeader` already takes `institution.department` as a plain string, so pass the resolved name in; no signature change is needed.
3. "Report generated": format in `INSTITUTION_TIMEZONE` (default `Africa/Cairo`) with an explicit pattern, e.g. `20 Nov 2026, 14:05 (Cairo)`. Reuse the zone handling style of `src/eliminator/institutionTime.util.ts`.
4. Year breakdown: use `calSurg.procDate` when present, fall back to `timeStamp`/`createdAt`. Rename the section label to "Approved cases by operation year".
5. Clinical: add a candidate-scoped query (`WHERE "candDocId" = $1 AND "subStatus" = 'approved'`) instead of loading the whole institution.
6. Check the other reports for the same `toLocaleString` and department issues and fix them in the same pass.

Verify: generate a candidate report for one NS and one non-NS candidate on a local restored copy (local-preview-from-prod-backup recipe, Mailgun off), rasterize the pages and read them. `tsc` clean, 0 em-dashes.

## Stage A2: Full Logbook Record PDF (institute admin only)

A second, longer document, separate from the E-Certificate. The E-Certificate is the short summary; the Logbook Record is the complete evidence: one row per submission the candidate made.

### Access
- `GET /instituteAdmin/candidates/:candidateId/logbook-record` (institute admin, own department from the DB row; superAdmin institution-wide). **Not available to candidates.**
- Optional query `from` / `to` / `status`: **not built in v1** (the record is always complete).
- Download button on the i-admin candidate snapshot page, next to the existing E-Certificate button. EN + AR button label; the PDF itself is English with Arabic only where the data is Arabic.
- Filename: `<Candidate> - Logbook Record - <Department> - <yyyy-mm-dd>.pdf`.

### Format
- **A4 landscape** throughout, 30 pt margins.
- Fonts: Helvetica for Latin; `Cairo-Regular.ttf` via `src/pdf/arabicText.ts` for any Arabic cell (that recipe, not the arial one).
- Shared header on every page: "Logbook Record", candidate name, department, institution, page "X of Y". Shared footer: document reference (`LR-<short id>`), generated time in Cairo, libeluspro.com.
- Tables: header row repeated on every page, light zebra striping, thin rules, cells clip to their width (no wrapping into the next row), numbers right-aligned, dates `dd MMM yyyy`.

### Structure
1. **Cover page**
   - Candidate identity: name, registration number, degree, rank, department, account created.
   - Record period: first and last operation date.
   - Totals: submissions by status, approved cases by role (operator / assistant / observer), distinct hospitals, distinct supervisors, academic points, approved clinical cases.
   - Short "how to read this document" line (what each column means, how statuses are shown).
2. **Surgical experience** (the core section), chronological by operation date, grouped by year with a subtotal row under each year. Columns:

   | # | Date | Hospital | Patient | Main diagnosis | Diagnosis (ICD-11) | Procedure (CPT) | Role | Supervisor | Status |
   |---|------|----------|---------|----------------|--------------------|-----------------|------|------------|--------|

   - Patient = privacy format already stored (initials), age at operation, sex (decision A2-Q1).
   - Diagnosis shows code + name; procedure shows numCode + title. Multiple codes on one case are listed in the same cell, one per line.
   - A smaller second line under each row carries the case details: approach, position, region and the other additional answers, consumables, equipment. It is left out when empty, so short cases stay one line.
3. **Summary tables** (one page): cases by main diagnosis × role, by procedure (top 30) × role, by hospital, by supervisor, by year.
4. **Academic experience** (academic institutions), same table quality as the surgical section, chronological, grouped by academic year (September to August) with a subtotal row per year:

   | # | Date | Type | Lecture no. | Title | Presenter | Location | Points | Flag |
   |---|------|------|-------------|-------|-----------|----------|--------|------|

   - Type = lecture / journal club / conference. Lecture number shown for lectures only. Location = department / online.
   - A second table, **"Presented by the candidate"**: journal clubs and other events where the candidate was the presenter (date, type, title, attendance count).
   - Summary block: total points, attendance count, flagged count, attendance by type, lectures attended per curriculum topic (count of the topic's lectures attended).
5. **Clinical experience** (clinical institutions), chronological, grouped by year with subtotals:

   | # | Date | Activity type | Description | Supervisor | Status | Reviewed on | Supervisor comment |
   |---|------|---------------|-------------|------------|--------|-------------|--------------------|

   - Fields come straight from `clinical_sub` (`dateCA`, `typeCA`, `description`, `supervisorDocId`, `subStatus`, `reviewedAt`, `review`). Long descriptions and comments get the smaller second line instead of being cut.
   - Summary block: cases by activity type × status, by supervisor.
6. **Closing block**: "Generated from LibelusPro records on <date>. Approved entries were reviewed by the named supervisor." Signature line for the programme director (same person as decision Q1).

### Performance
- One query set per section, all scoped to the candidate (no institution-wide loads). Stream the PDF to the response.
- Expected size: about 18 cases per landscape page, so 300 cases is about 20 pages. Test with the largest real logbook on the local copy.
- No AI call in this document.

### Verify
On a local restored copy: generate it for the candidate with the most submissions and for one with very few, rasterize every page and read them (repeated headers, no clipped or overlapping rows, Arabic renders, page X of Y correct, totals reconcile with the dashboard numbers). HTTP checks: admin of another department 403/404, candidate token 403, superAdmin 200.

### Questions for this stage
- ~~**A2-Q1**~~ **Decided 2026-11-20: initials only (the stored first name is reduced to its initial) + age at operation + sex.**
- ~~**A2-Q2**~~ **Decided 2026-11-20: all statuses, with a Status column.**
- ~~**A2-Q3**~~ **Decided 2026-11-20: chronological by operation date, grouped by year.**
- ~~**A2-Q4** Include the academic and clinical sections?~~ **Decided 2026-11-20: yes, both, with full per-entry tables (sections 4 and 5).**

### Build log (A + A2, 2026-11-20)

**Backend** (`feat/logbook-record-and-cert-fixes`, carries the earlier uncommitted supervisors-report hunk in `instituteAdmin.provider.ts`, which is NOT part of this work):
- `src/pdf/reportLayout.ts`: footer typo fixed; "Report generated" via `formatInstitutionDateTime()`.
- New `src/utils/institutionDateFormat.ts` (Cairo-zone document dates), new `src/pdf/reportRoles.ts` (role labels moved out of the provider so both documents share them).
- `instituteAdmin.provider.ts`: `resolveDepartmentLabel()`; candidate / supervisor / all-supervisors / submission reports print the person's (or the admin scope's) department in the header, filename and AI prompt; `operationYear()` for the by-year breakdowns; candidate clinical section is one scoped query.
- New `src/pdf/logbookRecord/logbookRecord.data.ts` (read-only, candidate-scoped SQL, dates formatted in SQL) and `renderLogbookRecordPdf.ts` (landscape, buffered pages, final pass for header/footer/page X of Y/contents).
- Route `GET /instituteAdmin/candidates/:candidateId/logbook-record` + service + controller. API_DOCUMENTATION.md updated (E-Certificate notes corrected, new section).

**Frontend** (`feat/logbook-record`): `api.getInstituteAdminCandidateLogbookRecord` (download logic shared with the E-Certificate through `downloadAuthedPdf`), second button on `InstituteAdminCandidateSnapshotPage`, `downloadReport` relabelled "Download E-Certificate" and new `downloadLogbookRecord` (EN + AR). tsc + vite build clean.

**Verified** on a throwaway Docker PG17 (`ka-cert`, port 54329) restored from `ka-institute-pre-d-ahmed-r20-import-20261108142325.sql.gz` (4,795 submissions), backend on :3018 with Mailgun and Gemini disabled, minted JWTs: **13/13 HTTP checks** (big and small candidate 200, other-department candidate 404 for an NS admin and 200 for superAdmin, candidate token 403, bad id 400, unknown id 404, E-Certificate / supervisor / supervisors / submission reports 200 with the right department in the filename). Pages rasterized and read: the 237-case candidate renders 26 pages; main-diagnosis cross-tab sums to the 236 approved; academic 22 + 4 + 1 = 27 events and 29 points match the points rule. Backend tsc clean, 0 em-dashes.

**Redesign after user review (same day)**: the first layout (zebra stripes, single clipped lines, a details line running under all columns) was rejected as jumbled. Replaced by a **ruled ledger**: thin vertical and horizontal rules, no striping, cells wrap instead of clipping, codes bold with hanging-indent names, CPT printed without the internal `-NN` suffix, main diagnosis moved into the Diagnosis cell as a small grey label, and case details in a tinted band inside the case's own frame (Diagnosis to Status columns), "none" answers dropped. The band height comes from a word-wrap simulation of the mixed bold/regular text, with a runtime guard that logs `[logbook-record] N details band(s) ran past their frame`. Verified: generated for **all 118 candidates** on the local copy, 0 failures, **0 band overflows**, slowest 0.4 s; the 237-case record is 34 pages (was 26). Design references: table-design guidance favouring thin rules for dense columns over striping (A List Apart, CSE Science Editor, Tufte), ACGME case-log reports grouping cases by category.

**Not done / known**: not click-tested in a browser; the E-Certificate's own layout (mostly empty first page) is left for Stage B; the institute-admin dashboard paths that still load every clinical submission (`getMineOrAll` at three dashboard call sites) were not touched.

## Stage B: verifiable certificate

### Schema (migration `1783782610350-CreateCertificates`)
`certificates`:
- `id` uuid PK
- `code` varchar(12) UNIQUE, short human code (e.g. `LP-7K3Q-9XA2`, Crockford base32, no ambiguous characters)
- `candidateId` uuid FK candidates RESTRICT
- `departmentId` uuid FK departments
- `issuedByRole` varchar, `issuedById` uuid NULL (admin, or the candidate for self-download)
- `kind` varchar CHECK in (`interim`, `final`)
- `periodFrom`, `periodTo` date (first and last operation date covered)
- `summary` jsonb: the headline numbers printed on the cover (approved cases, by role, academic points, clinical count)
- `dataHash` char(64): SHA-256 of the canonical JSON of `summary` + candidate id + period
- `aiSummary` text NULL, `aiSummaryHash` char(64) NULL (Stage D)
- `issuedAt` timestamp default now(), `revokedAt` timestamp NULL, `revokedReason` text NULL

Indexes: `(candidateId, issuedAt DESC)`, UNIQUE `code`. Clean `down()`. Add the migration to the KA migrations list.

The PDF bytes are NOT stored. A re-download regenerates from current data; the verify page shows what was true at issue time, from `summary`.

### PDF changes
- New **cover page**: institution, department, candidate name, registration number, degree, period covered, 3 to 5 headline numbers, issue date, signature line for the programme director (printed name from configuration, no image unless one is supplied), QR code bottom right, the short code under it, "Verify at libeluspro.com/verify/<code>".
- The existing analytics pages follow as "Appendix: logbook analytics", unchanged apart from Stage A.
- The footer on every page carries the certificate code.
- QR generation: new dependency `qrcode` (renders a PNG buffer for `doc.image`). No network call.

### Endpoints
- Issue: the existing admin route keeps working and creates a `certificates` row when called with `?issue=true` (whether an un-issued preview stays available is decision Q3).
- `GET /verify/:code` **public**, rate-limited (`apiRateLimiter` + a dedicated per-IP limiter keyed by `getClientIp`). Returns only: status (valid / revoked / not found), candidate full name, institution, department, degree, kind, period, issue date, headline numbers. **No email, phone, patient data or registration number** (decision Q4).
- `PATCH /instituteAdmin/certificates/:id/revoke` (admin, own department from the DB row; superAdmin institution-wide), with a reason.
- `GET /instituteAdmin/candidates/:candidateId/certificates`: list of issued certificates.

### Frontend
- Public page `/verify/:code` (LoginLayout shell, EN + AR, no login), plus a code entry form at `/verify`.
- Admin candidate snapshot: "Issue certificate" button and a list of issued certificates with revoke.

Verify: migration apply/revert/re-apply on a throwaway PG17; HTTP E2E (issue, verify valid, revoke, verify revoked, unknown code 404, rate limit 429, department scope checks); scan the QR from a rasterized page.

### Stage B build log (2026-11-21)
- Backend: migration `src/migrations-ka/1783782610350-CreateCertificates.ts`; `src/certificates/certificate.service.ts` (issue, cached AI summary, list, revoke, public view; code = "LP-" + 8 Crockford base32 symbols, 40 bits) and `verify.router.ts` (`GET /verify/:code`, public); `src/pdf/certificateCover.ts` (landscape cover, hand-signature fields, QR via the new `qrcode` dependency); `drawReportFooter` gained an optional reference; instituteAdmin list + revoke routes. TypeORM gotcha hit again and fixed: `query()` on `UPDATE ... RETURNING` returns `[rows, count]`.
- Frontend: public `VerifyCertificatePage` (`/verify`, `/verify/:code`, EN + AR), `CandidateCertificatesPanel` on the i-admin candidate page (list, open the public check, revoke with a required reason), API types.
- Verified on the local restore: migration applied; 14/14 HTTP checks (issue with code, filename, list with issuer, public valid, private fields hidden, loose code input, unknown 404, scope 404, revoke validation, revoke, public revoked, second revoke 409, superAdmin issue on an empty logbook); cover rendered and read; verify page click-tested EN and AR (valid and revoked). Backend + frontend tsc and build clean, 0 em-dashes. The admin panel itself was not click-tested (API verified).
- **Deploy order**: verified production backup, user applies migration 350, push backend, then frontend. Check that Railway `FRONTEND_URL` is `https://libeluspro.com` (the QR link uses it).
- **Shipped 2026-11-21** in that order. Railway once failed a build on an expired registry TLS cert; a dashboard Redeploy fixed it. Because `FRONTEND_URL` still held the old domain, the verify link was then hard-coded to `https://libeluspro.com` (`5060c37`).

## Stage C: candidate self-download

- `GET /cand/me/certificate` (candidate only; the candidate is resolved from the JWT then the DB row, never an id from the client; archived candidates refused).
- Issues an `interim` certificate (watermark "Interim record, not a completion certificate"). Once Stage F exists, issues `final` when the milestones are met (decision Q5).
- Per-candidate cap, e.g. 5 issues per day, to bound Gemini cost.
- Replace the placeholder `CandidateECertificatePage` with an Aurora, bilingual page on the inner `*Content` pattern: download button, list of previously issued certificates with their codes and verify links, and (after F) milestone progress.

## Stage D: AI summary cache

- Compute `aiSummaryHash` = SHA-256 of the snapshot text sent to Gemini. If the candidate's latest certificate row has the same hash, reuse its `aiSummary`; otherwise call Gemini and store the result on the new row.
- A Gemini failure keeps today's behaviour (summary section omitted).

## Stage E: dashboard freshness without new infrastructure

- `GET /me/updates` (any signed-in role): small counters and timestamps, e.g. `{ submissions: { approved, pending, rejected, lastChangeAt }, clinical: {...}, events: { lastChangeAt }, rankRequest: { status, updatedAt } }`, built from indexed `MAX("updatedAt")` / `COUNT` queries scoped to the caller. Strong ETag so unchanged responses are 304.
- Frontend hook `useLiveUpdates()` in each dashboard layout: polls every 45 s while the tab is visible, and on window focus. When a section changes, invalidate only that section's React Query keys and show a small toast ("2 cases approved").
- Keep the global 15 min staleTime; the poll is what makes the dashboard feel live.
- Budget: one small request per active tab every 45 s (20 per 15 min), against the per-user global limiter of 400 per 15 min. Confirm this before shipping.

---

## Stage F: milestone and gap tracker (needs decisions first)

- New table `training_targets` (departmentId, regDeg, mainDiagId NULL, procCptId NULL, role, minCount), edited by the institute admin.
- Candidate dashboard "Progress" card: done vs required per target, by role. Feeds the certificate cover and decides `interim` vs `final`.
- **Open question for the department**: who owns the target numbers. They are entered by the admin from the department's own requirements, never invented.

## Stage G: smart tools (each gets its own mini-plan before building)

1. **Submission pre-fill from the calendar**: procedure, hospital, date and patient already exist on `cal_surgs`; suggest the main diagnosis from the `clerk_procs` mapping.
2. **Duplicate and sanity flags** before submit: same patient + date + role, DOB after operation date, role already used on this procedure. Shown inline instead of a 400.
3. **Supervisor triage queue**: pending cases grouped by candidate, bulk approve, AI flags for unusual combinations. Reviewer fields are stamped only on real reviews.
4. **Weekly digest** (email, later WhatsApp via `waBot`): approvals, pending-with-whom, next Thursday's events. Replaces hand-written announcements. Daily Mailgun budget cap, as in `demoRequest`.
5. **Natural-language analytics for admins**: Gemini turns a question into the existing `caseAnalytics` filter object (validated against an allowlist), never into SQL.

## Stage H: true realtime push (infra decision required)

- New origin `api.libeluspro.com` (Cloudflare proxied, to Railway). Cookies scoped to `.libeluspro.com`, CORS updated; `getClientIp` already reads `CF-Connecting-IP`.
- Socket.IO (or SSE) on the existing HTTP server, JWT checked on connect, rooms per user and per department.
- Writers emit after commit; Postgres `LISTEN/NOTIFY` so writes made outside the app (imports, scripts) also push.
- First events: submission reviewed, new pending case (supervisor badge), eliminator and journal seat counts, attendance opened, rank request decided.
- Stage E's poll stays as the fallback when the socket is down.

## Stage I: UI/UX

1. Aurora + bilingual pass on the remaining old-skin pages (the certificate page is done in C).
2. Candidate "My progress" hero: milestone ring, this month's cases, pending with whom, next event.
3. Mobile quick log: 3 taps from today's calendar row.
4. PWA offline draft queue for the submission form.
5. Fix the swallowed backend error message in `NeuroLogBookFront/src/utils/api.ts` (read `data.error.error`) and sweep the other call sites.

---

## Decisions for Stage B onward (user, 2026-11-20). Do not re-litigate.

- **Q1 Signature: signed BY HAND.** The cover prints empty "Programme director", "Signature", "Stamp" and "Date" lines with room for a wet signature and stamp. No printed signatory name, no signature image.
- **Q2 Cover orientation: landscape** (classic certificate look); the analytics appendix stays portrait.
- **Q3 No unrecorded preview:** every download issues a `certificates` row, so any printed copy can be verified.
- **Q4 Public verify page:** candidate full name, institution, department, degree, kind, period, issue date and headline numbers. No email, phone, registration number or patient data.
- **Q5 Candidate self-download allowed** as an "Interim record" until Stage F milestones exist.
- **Q6** (api. subdomain for realtime): not asked yet; only needed for Stage H.

## Safety rules for this work

- `.env` `PSQL_*` is production. Build and test against a restored local copy; production migrations only after a verified backup and the user's go-ahead.
- Apply a migration before pushing entity changes.
- No em-dashes anywhere (code, copy, commits, this doc).
- Update this checkpoint table and CLAUDE.md "Where we stopped" as stages land.
