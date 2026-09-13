# AI Office: member role, activity form, stats, hidden signup, super-admin console

Living record. Read this first before touching `src/aiOffice/` or the AI Office pages.
Approved plan: `C:\Users\Laptop-Academy.com\.claude\plans\lets-build-a-plan-elegant-scroll.md` (2026-09-13).
Branch: `feat/ai-office` in both repos (off `main`). **Nothing committed.**

## Checkpoints

| # | Stage | Status |
|---|---|---|
| 0 | Living doc, branches, form fields confirmed from the Google Form data | done 2026-09-13 |
| 1 | Migration 330 + entity changes (candidates, supervisors, 2 new tables) | done 2026-09-13 (local cycle verified) |
| 2 | Backend module `src/aiOffice/` (member, admin, signup) + wiring | done 2026-09-13 (tsc clean) |
| 3 | Signup integration in `PendingSignupProvider` | done 2026-09-13 (options bag, normal signups unchanged) |
| 4 | Backend verify: tsc, migration cycle on ka-local, E2E, HTTP | done 2026-09-13 (85/85 HTTP checks, twice, clean) |
| 5 | Frontend: types, api, queries, i18n, activity definition | done 2026-09-13 (build clean) |
| 6 | Frontend: hidden signup page | done 2026-09-13 (build clean) |
| 7 | Frontend: member pages + nav + department-less dashboard | done 2026-09-13 (build clean) |
| 8 | Frontend: super-admin users, activities, access requests | done 2026-09-13 (build clean) |
| 9 | Frontend verify: build, browser click-through EN + AR | done 2026-09-13 (local stack; one scroll bug found and fixed) |
| 10 | Docs: API_DOCUMENTATION.md section, CLAUDE.md | done 2026-09-13 |

## Decisions (user, 2026-09-13)

- Unlisted department: typed name in `departmentOther`, `departmentId` NULL for these AI Office accounts only,
  AI-office-only dashboard. Only the super-admin sees them.
- AI Office signups are created unapproved; the super-admin approves. `aiOfficeMember` pre-set by the signup.
- AI Office signup password: at least 8 characters, no other rules.
- v1 includes: members edit their own entries; super-admin view of all activities; signups count against the
  active-users signup cap.
- The form's "Member Name" dropdown is dropped (the signed-in account is the member).

## The Google Form, as read from its own data (2026-09-13)

Source: `FB_PUBLIC_LOAD_DATA_` of the public viewform page (not a summary). **Every question is optional
(`required=false`)**, including the activity type, and every text answer is a paragraph field. So in the app:
only the activity type is required (the form needs it to branch); every other field is optional; titles are
stored as `text`, not a short varchar.

| activityType | Google Form section | title | status options | activityDate | details |
|---|---|---|---|---|---|
| `project_review` | Review of a new project | Project Title | Not started, In progress, Completed | Target Completion Date | description |
| `journal_club` | Preparing AI Journal Club session | Topic / Paper Title | Not started, In progress, Ready | Journal Club Date | presenters |
| `symposium` | Preparing the Quarterly Symposium | (none) | Not started, In progress, Ready | Symposium Date | proposedTopics, roleInPreparation |
| `partner_meeting` | Meeting with an external partner (collaboration) | Partner / Company Name | (none) | Meeting Date | purpose, outcome, followUpNeeded (Yes/No) |
| `qualification` | Personal AI qualification/certification | Qualification / Course Name | Enrolled, In progress, Completed | Expected or Completion Date | provider |
| `project_study` | Working on a project/study | Project/Study Title | Planning, Data collection, Analysis, Writing, Submitted, Published | Expected Completion Date | topicField, yourRole |
| `other_task` | Additional/other task | (none) | Not started, In progress, Completed | Target Date | taskDescription |

Every section also has "Notes / Comments" (stored in `notes`), except the partner meeting section.

## Build log

**Stages 1-3 (2026-09-13).** Migration `1783782610330-CreateAiOffice`: both user tables gain
`aiOfficeMember` + `departmentOther`, `departmentId` drops NOT NULL behind
`CHK_<table>_dept_or_ai_office`; new `ai_office_activities` (one-member CHECK, type CHECK, jsonb object
CHECK, FKs RESTRICT) and `ai_office_access_requests`. Module `src/aiOffice/` (types map, 2 entities,
interface, service, provider, controller, router) + `src/validators/aiOffice.validator.ts`, wired in
container/routes/database/ka-migrations configs. `PendingSignupProvider.startSignup` takes an options
bag `{ aiOffice, departmentOther }`; the created row gets `aiOfficeMember` + `departmentOther`, approval
still false. Backend `tsc` clean (one jsonb typing cast needed in the service). Making `departmentId`
nullable broke nothing else at compile time.

Local migration cycle on `ka-local` (never production): apply OK (3 columns x 2 tables, 5 CHECKs,
2 FKs, both tables); the CHECK rejects `departmentId = NULL` on a normal candidate; revert OK (columns
gone, NOT NULL back); re-apply OK; with a department-less AI Office candidate present, `down()` refuses
with "Cannot revert CreateAiOffice: 1 candidates have no department". Test row removed.

**Test-harness note:** a signup emails an OTP, and with Mailgun unset the signup fails with a 500.
Local signup tests need a fake Mailgun endpoint (the mailer reads its base URL from the env), which also
lets the tests read the codes and the access-request notification.

**Stage 4 (2026-09-13).** Local stack only: backend on :3014 against `ka-local` (restored copy, never
production), a fake Mailgun sink on 127.0.0.1:3099 via `MAILGUN_API_BASE`, `OTP_DEV_LOG=true`,
`DISABLE_RATE_LIMIT=true`, minted HS256 JWTs. The session-scratchpad HTTP script covers 85 checks in
13 groups: signup validation; listed and unlisted department signups verified through the real OTP
email; existing candidate, supervisor and archived emails get 409, a stored request, one notification
to the admin address naming the existing account and the console link, and no second email within
24 h; the signup cap returns 403; phone reuse 409; normal signup unchanged; `/me` and the member guard
(non-member, unapproved); approval through the existing `/cand` and `/supervisor` endpoints; one entry
per form section with invalid status, date and type rejected; edit own vs someone else's (404); stats;
the super-admin users list (filters incl. "No department", search, supervisor flags), the role toggle
incl. the 409 on a department-less account and immediate revocation; all activities, admin stats,
access requests; login of a department-less member (no department claim); both DB CHECKs.
Result **85 passed / 0 failed on two consecutive runs**, 0 rows left.

Two mistakes along the way were in the test, not the backend: (1) one expectation counted
`completed` as 3 when the sample data has 2 (`ready` and `published` are separate statuses; `done`
= 4 was already right); (2) cleanup filtered access requests by a JS `Date`, which is sent with the
machine's +03:00 offset that a naive `timestamp` column ignores, so it deleted nothing and the next
run's notification was correctly suppressed by the 24 h dedupe. Cleanup now takes its start time from
the DB clock. A later run added two checks proving the console can set `canValidate` / `canValClin`
through the existing `PUT /supervisor/:id` on a department-less supervisor: **87 passed / 0 failed**.

**Stages 5-8 (2026-09-13), frontend `F:\WebDev\NeuroLogBookFront`, branch `feat/ai-office`.**

| File | What |
|---|---|
| `src/types/aiOffice.ts` | Mirrors `aiOffice.interface.ts`, plus status/detail-key unions and `AiOfficeApiError` (`code`, `status`) |
| `src/lib/aiOfficeActivities.ts` | The form definition map, field for field with the backend map |
| `src/lib/aiOfficeFormat.ts` | Date/month formatting (DATE values never shifted through the local zone), department label, status tone, entry summary, member paths |
| `src/utils/api.ts` | `_aiOfficeRequest` (unwraps the formatter envelope and the nested error body, maps validation arrays, 429 to `RATE_LIMITED`) + 11 methods |
| `src/queries/aiOfficeQueries.ts` | `me` (60 s, refetch on focus), own entries/stats, save mutation, admin lists/stats/requests (`placeholderData` keeps the table), role / approval / validator mutations (approval and validators reuse the existing endpoints) |
| `dashboard.i18n.ts` | `aiOffice` block EN + AR (member pages, per-section labels, statuses, detail labels, `admin` console); AR-aware titles for all six routes |
| `landingPage.i18n.ts` | `aiOfficeSignup` block EN + AR |
| `src/pages/AiOfficeSignupPage.tsx` | `/ai-office/signup` (not linked anywhere): role toggle, 8-character password hint, department select with a "not listed" checkbox that swaps in a text input, candidate/supervisor fields, `SignupOtpStep`, EMAIL_EXISTS / PHONE_EXISTS / UNKNOWN_DEPARTMENT / SIGNUPS_CLOSED handled by code |
| `src/components/aiOffice/*` | `AiOfficeMemberGate` (live membership, not-member notice, department-less note), `AiOfficeActivityContent` (branching form, own entries, edit), `AiOfficeStatsContent`, hand-rolled charts + pager |
| `src/pages/AiOfficeActivityPage.tsx`, `AiOfficeStatsPage.tsx` | Candidate and supervisor wrappers (inner-Content pattern) |
| `DashboardLayout.tsx`, `SupervisorDashboardLayout.tsx` | Two nav items when `GET /aiOffice/me` says member; department-less members get only AI Office + Profile (bottom tab bar too) and any other dashboard URL redirects to the form |
| `Candidate/SupervisorDashboardSwitcher.tsx` | Only when the user has no `departmentId` claim, ask `/me` and send a department-less member to the form instead of loading a logbook dashboard |
| `SuperAdminAiOfficeUsersPage.tsx` | Supervisors/Candidates, department filter incl. "No department", AI Office + approval filters, debounced search, `?role=&search=` from the admin email, approve / AI Office / validator pills (removal confirmed; locked on department-less accounts), signup-attempts panel with "Find account" |
| `SuperAdminAiOfficeActivitiesPage.tsx` | Filters (type, status, account type, department, registered from/to), stat cards, month/type/status/department/member charts, paged table with expandable details |
| `App.tsx`, `pageTitles.ts`, `SuperAdminLayout.tsx`, `authSlice.ts`, `LoginPage.tsx` | Routes (super-admin ones inside the existing flag gate), titles and back paths, nav entry, `aiOfficeMember` / `departmentOther` on the user |

`npm run build` (tsc + vite) clean; 0 em-dashes in added lines of either repo.

**Stage 9 (2026-09-13), browser click-through, local only.** The frontend was built with
`VITE_API_URL=http://localhost:3014` into the session scratchpad and served on `localhost:3000` (the only
origin the local backend's CORS allows) by a small scratchpad server whose `/__as/<fixture>` route signs
the browser in with a locally minted test token, so no password or token was typed into any page.
Fixtures (scratchpad `aio-ui-fixtures.js`, local DB only, rerunnable, `cleanup` mode): a supervisor who
signed up with a typed department and an NS candidate, both through the real signup and emailed code,
approved in the local DB, 5 sample entries, one signup attempt with an existing email. Verified in Chrome:

- Department-less supervisor: `/dashboard/supervisor` redirects to the form; the nav is AI Office activity,
  stats and Profile only; the note names the typed department.
- The form branches per section (project/study shows title, topic, role, six statuses and the expected
  date; partner meeting shows the yes/no follow-up). Saving shows "Entry saved." and the list updates; the
  DB row holds exactly the typed answers and no keys from other sections.
- Edit prefills every answer including the yes/no; saving changed only the edited answer (DB checked).
- Stats cards and charts match the data. Arabic: stats page, form, super-admin console and signup page
  render right-to-left with Arabic labels and dates.
- NS candidate member: the full logbook nav plus the two AI Office items.
- Super-admin: accounts across departments with the typed-department badge and the AI Office and
  validator pills; "Find account" in the attempts panel switches tab and searches that email; the
  activities page shows stats, charts and expandable answers.
- Hidden signup: the role toggle swaps candidate and supervisor fields; "not listed" swaps the select for
  a text input. Submitting was not clicked in the browser (it needs a typed password); that path is
  covered end to end by the HTTP tests.

Found and fixed: `scrollIntoView` on Edit (and on "Find account") also scrolled the page behind the fixed
shell and hid the header. Replaced by `scrollIntoDashboardView`, which scrolls only the layout's
`[data-scroll-container]`; re-verified (window scroll stays 0, header visible).

Found and fixed (shared component): after switching the language, the Supervisors/Candidates toggle in
the console kept its highlight pill over the other button. `SegmentedToggle` only re-positioned the
pill when the option VALUES changed, and a language switch changes the labels and the direction but no
value. The effect now also depends on the labels. Re-verified in Arabic: pill and active button share
the same left edge and width after the language switch and again after a tab switch. This also fixes
the same glitch on the Active Users and search-usage pages, which use the same component.

Noted, not changed: the signup page shows "Email is required." before anything is typed. The existing
candidate signup page does exactly the same (shared `validateEmail`), so it is kept consistent.

**Stage 10 (2026-09-13).** `API_DOCUMENTATION.md`: new "AI Office" section (signup, member routes, entry
body and section table, console routes), TOC entry, and three rows in the authentication summary.
`CLAUDE.md` "Where we stopped" entry added. Local test stack stopped and fixtures removed afterwards.

**Not done (needs the user's explicit ask):** commit and push both repos; production backup, migration
330 on `ka-institute`, then deploy (migrate before pushing: the entities map the new columns).

**Ship prep, step 1 of 3: production backup (2026-09-13, user-requested).**
`F:\DB_BACKUPS\ka-institute-pre-ai-office-20260913224200.sql.gz` (2,814,135 bytes), taken with
`scripts/backup-ka-prod.sh pre-ai-office` (read-only `pg_dump`, verify-ca TLS). Script checks: gzip OK,
54 CREATE TABLE / 54 COPY, dump row counts equal to live (candidates 113, supervisors 63, submissions
4022, clinical_sub 88, event_attendance 1274, cal_surgs 6183, events 141).

Restore test: the dump was restored into a throwaway `postgres:17` container (`ka-restore-test`,
127.0.0.1:55433) with **0 errors**: 54 tables, 1 view, the same 7 counts, 44 migrations ending at
`CreateJournalEliminator1783782610320`, no AI Office objects.

Rehearsal of migration 330 on that restored copy (gitignored `scripts/tmp-ai-office-migration-rehearsal.ts`,
same `KaMigrationsDataSource` as `db:ka:migrate`, guarded by target host/port and a sentinel table only
the copy has): **12 passed / 0 failed**. Exactly one pending migration (CreateAiOffice); apply took 70 ms;
both user tables gained the columns, `departmentId` became nullable, 2 tables + 2 CHECKs created; row
counts unchanged; nobody became a member or lost a department; the CHECK rejected removing a normal
candidate's department; revert restored NOT NULL and removed everything; re-apply clean. The throwaway
container was removed afterwards.

**Ship prep, step 2 of 3: migration 330 on production (2026-09-13, run by the user).** Verified
read-only afterwards (docker `postgres:17` psql, verify-ca TLS, `default_transaction_read_only=on`):
45 migrations, latest `CreateAiOffice1783782610330`; both user tables have `aiOfficeMember` (NOT NULL,
default false) and `departmentOther`, `departmentId` nullable; `ai_office_activities` and
`ai_office_access_requests` exist with 0 rows; all 9 constraints present (`CHK_candidates_dept_or_ai_office`,
`CHK_supervisors_dept_or_ai_office`, 5 `CHK_aio_*`, 2 `FK_aio_act_*`); 0 AI Office members and 0
department-less accounts; the 7 checked row counts equal the backup. Live API on the OLD code stayed
healthy: `/health`, `/institution`, `/departments`, lecture eliminator state 200, both eliminator
supervisor lists 200 (62 supervisors, reading the altered table), `/journalEliminator/state` 401 (auth
gate alive), `/aiOffice/me` 404 (not deployed yet).

Remaining (only on the user's explicit ask): step 3, commit and push both repos, then poll the live API
until `/aiOffice/me` answers 401 instead of 404.
