# Plan: replace "Other" on procedures and diagnoses with search, then describe

Stage **J** of `docs/PLATFORM_ENHANCEMENT_PLAN.md`. Created 2026-11-24. Status: **backend built + verified locally (2026-11-24, 42/42 HTTP checks); frontend in progress. Nothing committed or deployed.**
Repos: backend `MedScribeNeuroServer`, frontend `NeuroLogBookFront`. Own branch off `main` in each (`feat/describe-missing-item`).

## Checkpoint table (update after every step)

| # | Step | Status | Notes |
|---|------|--------|-------|
| J0 | Decisions | **done 2026-11-24** | see "User decisions" |
| J1 | Schema: migration 360 | **built, apply/revert/re-apply clean on local restore** | 2 columns on `submissions`, 1 on `in_app_search_events`, new `catalog_gaps` table |
| J2 | Backend: search "missing" mode + submission validation + gap rows | **built, verified locally** | branch `feat/describe-missing-item` |
| J3 | Frontend: the "Not listed?" flow in the submission form | **built, click-tested (AR) incl. a real submit** | candidate + supervisor forms (shared component) |
| J4 | Show the described text everywhere in the app | **built** (SubmissionDetailView + activity timelines) | detail views, review lists, i-admin views |
| J5 | "Not in catalogue" admin list | **built, click-tested** (i-admin AR; super admin page with dept picker) | i-admin (own dept) + super admin (all) |
| J5b | Record what users type into the semantic search (+ what they got and picked) | **built, click-tested** (super admin Queries page EN + AR, per-user timeline columns) | added by user 2026-11-24; see "Search query log" |
| J6 | PDFs and certificate show the described text | **deferred by user** | do later, not in this round |
| J7 | Verify on a local restore, then ship | **verified locally; ship steps pending** (user go-ahead) | backup, user runs migration, push backend, then frontend |

## The problem (measured on production, read-only, 2026-11-24)

- "Other" is a catalogue row: procedure `other procedure` (`00000-00`, alpha `NONE`) and diagnosis `other` (code `AAAA`).
- **4,914 submissions; 497 picked the Other procedure (393 as their ONLY procedure) and 583 the Other diagnosis (569 as the only one).**
- **Last 90 days: 287 of 1,027 submissions (28%) used Other.** It is not an edge case.
- The Other procedure is linked only to NS (10) and CTS (17) main diagnoses, the Other diagnosis only to NS (10). The other 13 departments have no escape hatch at all today.
- What the case really was lives only in free surgical notes, if anywhere. The certificate prints "other procedure", which looks unprofessional on the field that matters most.

## User decisions (2026-11-24). Do not re-litigate.

1. **Search first, describe second.** "Other" is no longer a tile you can just tap. The user searches; only if nothing fits can they describe it, and the description is required.
2. **PDFs and certificate: later.** This round changes the app screens only (J6 deferred).
3. **Old "Other" rows stay as they are.** No backfill. They keep showing "Other".
4. **Search cap: its own 20 per user per day**, separate from the AI assist's 5.
5. **Yes to an admin list** of what people could not find, so the department can ask for real catalogue items.
6. **Record what users type into the semantic search** (added 2026-11-24). Today `in_app_search_events` stores only who, role, department, type and time, never the text.

## Defaults I chose (say if you disagree, otherwise these stand)

- **One described procedure and one described diagnosis per submission at most.** They can sit next to normal catalogue picks (today 104 submissions mix Other with real procedures).
- **Description length: 3 to 120 characters**, any language (Arabic or English). No word-count rule; long text is the usability problem we are avoiding.
- **Search can never block a submission.** If the cap is used up, Gemini is down, or the network fails, the "Describe it" box opens directly with one short line saying why.
- **Supervisors see the described text clearly marked** when reviewing. They approve or reject as now; editing the text is out of scope.
- **No hub change.** The sentinel rows stay as the code link, so every report and count keeps working.

---

## Layer 1: usability (the rules every screen follows)

The failure to avoid: AI-style walls of text nobody reads. Rules:

1. **One line per message, 8 words or fewer.** No paragraphs, no explanations of how search works.
2. **One obvious next action at every point.** Never two primary buttons.
3. **Results show the name and the code only.** No descriptions, no similarity percentages, no category essays. A different main diagnosis is shown as a small tag, not a sentence.
4. **Never leave the form.** Everything opens inline under the list the user was looking at. No modals, no new page.
5. **Three taps to the end of either path:** tap "Not listed?", type and Enter, tap a result or "None of these".
6. **Same look as today's tiles**, so nothing feels like a new tool.

The complete copy (this is all the text the feature adds):

| Key | English | Arabic |
|-----|---------|--------|
| notListedProc | Not listed? Search | غير موجود؟ ابحث |
| notListedDiag | Not listed? Search | غير موجود؟ ابحث |
| searchPlaceholder | Describe it in a few words | اكتبه في كلمات قليلة |
| searching | Searching... | جارٍ البحث... |
| switchTo | Switch to {category} | الانتقال إلى {category} |
| switchNote | Switching category clears your current picks. | تغيير الفئة يمسح اختياراتك الحالية. |
| noneOfThese | None of these | لا شيء مما سبق |
| describeProc | Procedure name, e.g. Endoscopic cyst fenestration | اسم العملية، مثال: فتح الكيس بالمنظار |
| describeDiag | Diagnosis name, e.g. Arachnoid cyst | اسم التشخيص، مثال: كيس عنكبوتي |
| described | Not in catalogue | غير موجود بالقائمة |
| capReached | Search limit reached today | تم الوصول لحد البحث اليوم |
| searchFailed | Search unavailable right now | البحث غير متاح الآن |
| tooShort | At least 3 characters | ٣ أحرف على الأقل |

## Layer 2: the flow (per list, diagnosis and procedure separately)

```
[ tile ] [ tile ] [ tile ]
[ tile ] [ - - Not listed? Search - - ]      <- replaces the "Other" tile, shown in EVERY department

tap ->
  [ Describe it in a few words        ] [Search]
  ( result: name . code )                         <- in this category: tap = selected in the grid above
  ( result: name . code        [Switch to Spinal trauma ->] ) <- one explicit button switches + selects (user ask 2026-11-24, replaced 'tap again')
  ( None of these )

tap "None of these" ->
  [ Name the procedure                ]  (3-120 chars, required)
  -> becomes a selected chip in the grid:  "endoscopic cyst fenestration . Not in catalogue"  [edit] [x]
```

- "None of these" appears only after at least one search ran, which is the core of the requirement.
- If search is unavailable (cap, error), "Name the procedure" opens directly with `capReached` / `searchFailed` above it.
- The old "other" catalogue tile is hidden from the grid (filtered by code `00000-00` / `AAAA`, not by title).
- Picking a result from another category reuses the existing AI-assist switch logic (`applyAiResult` + `pendingAutoFillRef`), so the known reset-ordering gotcha is already handled.
- Draft autosave includes the open description, so a refresh does not lose it.

## Layer 3: UI (how it looks)

- The "Not listed?" tile: same size as the other tiles, **dashed border**, muted text, search icon. Sits last in the grid.
- The inline panel: one input plus a button on a single row; results reuse the tile component in a single column; "None of these" is a plain text button under the results, not a tile, so the eye goes to real matches first.
- The described chip: selected-tile colours plus a small grey "Not in catalogue" pill; pencil to edit, x to remove (which brings back "Not listed?").
- RTL-safe (`text-start`, `ms-`/`me-`), `dir="auto"` on the input and the chip text, codes pinned LTR in mono like elsewhere.
- Raw Tailwind like the rest of `SubmissionForm.tsx` (it also renders in the supervisor layout, so no `ds-*` classes).
- Mobile first: full-width input, results stack, no hover-only actions.

## Layer 4: frontend changes (`NeuroLogBookFront`)

- `src/components/SubmissionForm.tsx`: new small component `MissingItemPicker` (one instance for diagnosis, one for procedure) holding the search state, results, describe input and chip. The form keeps two new fields, `otherProcedureText` / `otherDiagnosisText`; when set, the matching sentinel is added to the selections automatically and hidden from the grid.
- Validation in the form: a described item needs 3 to 120 characters; the field still counts as answered for "at least one diagnosis / procedure".
- `src/utils/api.ts`: `runInAppSearch` gains `purpose: 'missing'` and `mainDiagId`; create-submission bodies carry the two texts.
- Types: `InAppSearchQueryResult` items gain `inCurrentMainDiag: boolean`; submission types gain the two texts.
- i18n: the 13 keys above in `submissionForm` (EN + AR), no em-dashes.
- Display (J4): `SubmissionDetailView`, supervisor review/submission lists, i-admin candidate submissions: when the text exists, show it with the "Not in catalogue" pill instead of "other procedure" / "other". Old rows (no text) keep showing Other.
- Admin list page (J5): `/dashboard/i-admin/catalog-gaps` + sidebar entry, and a super-admin twin with the department picker. Table: text, kind, category, times seen, last seen, status. Status buttons: Reported, Dismissed.

## Layer 5: backend changes (`MedScribeNeuroServer`)

### Schema, migration `1783782610360-DescribeMissingCatalogItems` (additive)
- `submissions.otherProcedureText varchar(120) NULL`, `submissions.otherDiagnosisText varchar(120) NULL`.
- `in_app_search_events.purpose varchar(16) NOT NULL DEFAULT 'assist'` (`assist` | `missing`), so each cap counts its own rows and Search Usage analytics can split them.
- New `catalog_gaps`: `id`, `departmentId`, `mainDiagId`, `kind` (`procedure`|`diagnosis`), `text`, `normalizedText` (lowercase, trimmed, single spaces), `submissionId` (FK, ON DELETE CASCADE), `searchQuery`, `topResults` jsonb (codes + titles the user saw and rejected), `status` (`open`|`reported`|`dismissed`, default open), `createdAt`. Index on (`departmentId`, `normalizedText`).
- `down()` drops all of it cleanly.

### Search (`src/inAppSearch/`)
- Body gains optional `purpose` (`assist` default) and `mainDiagId` (UUID).
- `missing` purpose: cap from env `IN_APP_MISSING_SEARCH_MAX_PER_DAY` (default 20), counted only on `missing` rows. `assist` behaviour unchanged.
- Each result gets `inCurrentMainDiag`, computed against the mirror link tables for the given `mainDiagId`; results in the current category sort first. Still department-scoped from the DB row / JWT as today.

### Submission create (candidate + supervisor paths in `sub.provider.ts`, validators)
- Validators accept the two texts (trimmed, 3 to 120 chars, strings only).
- Rule, enforced server-side: sentinel picked (by code `00000-00` / `AAAA`) **requires** its text; text without the sentinel is a 400. The sentinel is resolved by code from the mirror, so departments with no linked sentinel still work.
- Old clients that send the sentinel with no text: **400 with a clear message** once the frontend ships (so the description is truly required). Ship order makes this safe: backend accepts the new fields first, frontend next, then the rule is switched on with env flag `REQUIRE_OTHER_DESCRIPTION=true`.
- In the same transaction, write one `catalog_gaps` row per described item.
- Read paths and `sub.mapper` emit the two texts so every screen can show them.
- Reviewer fields are not touched; this changes nothing about approval.

### Admin list (`src/catalogGaps/`)
- `GET /catalogGaps` (institute admin: own department from the DB row; super admin: `?deptCode`), grouped by `normalizedText` + kind + category with counts and last seen.
- `PATCH /catalogGaps/status` `{ normalizedText, kind, mainDiagId, status }` updates the group.
- API_DOCUMENTATION.md section + auth-summary rows.

### Search query log (J5b)
Applies to BOTH in-app searches: the new "Not listed?" search and the existing AI assist above Main Diagnosis.
- Same migration 360 adds to `in_app_search_events`:
  - `query text NULL`: exactly what the user typed (trimmed). NULL on every row recorded before this ships.
  - `mainDiagId uuid NULL`: the category the user was in (missing mode only).
  - `results jsonb NULL`: what came back, in order: `[{kind, code, title, mainDiagTitle, similarity}]`.
  - `outcome varchar(16) NULL`: `picked` | `none` (pressed "None of these") | NULL (left without choosing).
  - `pickedCode varchar(32) NULL`: the numCode / icdCode chosen.
- The search response returns the event `id`. When the user taps a result or "None of these", the frontend sends `POST /inAppSearch/events/:id/outcome` `{ outcome, pickedCode? }` (own events only, checked against the JWT user; fire-and-forget, a failure never affects the form).
- Recording happens in the same insert that already counts the quota, so no extra write on the search path. A failed Gemini call still logs the query with `results` NULL.
- Visible to the **super admin only** (queries can contain clinical detail or a patient name):
  - the existing per-user Search Usage page (`/dashboard/super-admin/search-usage/user`) shows the query, the result count and the outcome on each timeline row;
  - a new "Queries" tab on Search Usage: newest first, filters for department, type, purpose and outcome, so "searched and found nothing" is one click away.
- `catalog_gaps.searchQuery` / `topResults` then point at the same event (`searchEventId` FK) instead of copying the text.
- Not covered: the public `/explore` search (visitors are not users). Can be added the same way if wanted.

### Build log (J1, J2, J5 backend, J5b backend: 2026-11-24)
- Fresh production backup first: `F:\DB_BACKUPS\ka-institute-pre-describe-missing-item-20261124161446.sql.gz` (gzip OK, 58 tables, submissions 4914), restored into Docker `ka-cert` (port 54329).
- Migration `src/migrations-ka/1783782610360-DescribeMissingCatalogItems.ts`. `catalog_gaps` links the search event by FK (`searchEventId`) instead of copying query/results, and has `UNIQUE(submissionId, kind)`.
- `src/inAppSearch/`: `purpose` + `mainDiagId` on `/query`; per-purpose caps; every search logs query + results; response carries `eventId` and `inCurrentMainDiag` (checked against the local mirror, since a procedure can sit in several categories); "other" rows are filtered out of results; new `POST /inAppSearch/events/:id/outcome` (own events only, else 404).
- `src/sub/sub.provider.ts`: `applyDescribedItems` + `recordCatalogGaps` on both create paths. **Change from the plan:** text without the sentinel is NOT a 400; the text itself adds the "other" link (by code), which is what lets the 13 departments without a linked "other" row describe items too. `REQUIRE_OTHER_DESCRIPTION=true` refuses "other" without text. `catalog_gaps` is written right after the save (same pattern as `writeAnswers`); a failure there is logged and never fails the submission.
- `src/validators/describedItem.fields.ts` shared by both create validators.
- `src/catalogGaps/` (provider/controller/router), mounted at `/catalogGaps`, scope copied from case analytics.
- `src/searchAnalytics/`: `GET /searchAnalytics/queries` (super admin) + query/purpose/outcome/resultCount on the per-user timeline.
- Local HTTP test (`scratchpad/j-e2e.cjs`, backend :3018, mail off, flag on): **42 passed / 0 failed**, test rows cleaned up.

### Build log (J3, J4, J5, J5b frontend + J7 local verification: 2026-11-24)
- Frontend branch `feat/describe-missing-item` (NeuroLogBookFront). New `src/components/MissingItemPicker.tsx` (dashed tile, inline panel, results with code + "Under" tag, two-tap category switch, "None of these", name input opens EMPTY with an example placeholder (user decision 2026-11-24: a search phrase is a description, not a name; prefilling it invited unedited search phrases into the catalogue list), described tile with edit/remove). `SubmissionForm.tsx`: "other" rows hidden from both grids (by code), 4 new state fields in draft + payload, validation counts a described item, sentinel names never sent by name. `SubmissionDetailView` shows the text with a "Not in catalogue" pill and hides the sentinel code; both activity timelines use the text.
- Admin: `CatalogGapsContent` shared by `/dashboard/i-admin/catalog-gaps` and `/dashboard/super-admin/catalog-gaps` (sidebar entries in both layouts); `/dashboard/super-admin/search-usage/queries` + a link on AI Search Usage; per-user search timeline gained Query + Outcome columns. Copy: `submissionForm.missing`, top-level `catalogGaps` + `searchQueries` (EN + AR). `API_DOCUMENTATION.md` updated.
- Verified: backend tsc, frontend tsc + vite build, 0 em-dashes added in either repo. Rule-off check: a bare "Other" still returns 201 with text NULL (old open forms keep working). Chrome click-through on a static build against the local backend: search, pick in category (selected in grid), "None of these" + describe, real submit (text stored, sentinel + real code linked, gap row linked to the search), detail page, i-admin list + "Mark reported", super-admin Queries in EN and AR. Test rows removed from the local copy; local servers stopped.
- Not click-tested: the supervisor form variant (same component; its HTTP path is covered), the category-switch result, the cap-reached message (HTTP covered).

### Follow-up (2026-11-24, user ask): supervisor email + where the text shows
- **Supervisor "new submission" email** (`sub.provider.ts` HTML + text) gains "Procedures chosen" and "Diagnoses chosen" lines: the candidate's own picks, with a described item as its text plus "(not in catalogue)". The "Procedure" line (the calendar booking's procedure) now falls back to the described text instead of "other procedure" when the booking has none. User text is HTML-escaped. Rendered locally for 3 cases (mixed, described-only, old bare Other); nothing sent. Also removed the em-dash from the text email's first line.
- **Where a reopened submission shows the text**: all four detail pages (candidate, supervisor own entry, supervisor review, i-admin) share `SubmissionDetailView`, so all show it with the pill (supervisor review page click-tested in EN). The promoted supervisor's "previous logbook" list now swaps the text in too. The list pages for candidates and supervisors show the calendar procedure / main diagnosis, not the picks, so they are unchanged.

### Ship steps (each needs the user's go-ahead)
1. Fresh verified production backup (the 2026-11-24 one predates any further traffic).
2. User applies migration 360 on production (`npm run db:ka:migrate`), then a read-only check.
3. Commit + push backend `main` (Railway). Leave `REQUIRE_OTHER_DESCRIPTION` unset.
4. Commit + push frontend `main` (Netlify).
5. Set `REQUIRE_OTHER_DESCRIPTION=true` on Railway once the new frontend is live.

## What does not change
- Catalogue data, the hub, the mirror sync, ICD/CPT codes.
- The 5-per-day AI assist above Main Diagnosis.
- Old "Other" submissions (decision 3) and all PDFs / the certificate (decision 2).

## Verification (J7)
- Local restore of a fresh production backup in Docker (port 54329), backend on an alt port against it, Mailgun off.
- Migration 360 apply / revert / re-apply clean.
- Query log: query + results stored on both purposes; outcome endpoint records picked / none and refuses another user's event (404); super-admin Queries tab and per-user timeline show them; non-super-admin roles get 403.
- HTTP checks: missing search caps at 20 and leaves the assist count untouched; `inCurrentMainDiag` correct; sentinel without text 400 (flag on) / 201 (flag off); text without sentinel 400; text too short / too long 400; `catalog_gaps` row written; i-admin list scoped to own department; supervisor path same rules.
- Browser click-through EN + AR, desktop and phone width: both paths (pick a result, describe), switch category, cap reached, search failure, draft restore.
- tsc + build clean both repos, 0 em-dashes.
- Ship: verified backup, user runs migration 360, push backend (flag off), push frontend, then set `REQUIRE_OTHER_DESCRIPTION=true` on Railway.

## Later (not this round)
- J6: PDFs and certificate print the described text (decision 2 says later).
- Turning frequent gaps into real hub catalogue items (hub-side curation, reuses the `/dept-audit` workflow).
