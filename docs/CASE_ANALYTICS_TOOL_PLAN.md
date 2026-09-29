# Case Analytics Tool (department admin) - living plan

**READ THIS FIRST when resuming.** The checkpoint table below is the source of truth for what is done.

## Origin
Request from the head of the Neurosurgery department (2026-09-29, translated):

> I need statistics on the number of surgical procedures performed by Department 26, including
> emergency and pediatric cases, over one or more years. This will help determine how many
> trainees the department can accommodate, given the very large number of trainees currently enrolled.

There is no way to answer this in the app today. The one endpoint that comes close,
`GET /instituteAdmin/calendarProcedures/analysis/hospital`, is **not referenced anywhere in the
frontend** (grep-verified, both repos) and is unusable for this purpose anyway: it loads every
matching row into memory and then returns early on any case without a procCpt, which silently
drops **970 of 6,443 cases**. It is superseded by this module and left untouched.

## What the data actually supports (verified read-only against production `ka-institute`, 2026-09-29)
`cal_surgs` = 6,443 rows. Columns usable as analytics axes: `procDate`, `patientDob`, `gender`,
`hospitalId`, `departmentId`, `procCptId` (which reaches `proc_cpts.alphaCode` / `title` / `arTitle`),
`clerkProcId`, `clerkId`.

- **Department**: NS 6,441, PEDSURG 2. Auto-lock is meaningful.
- **Hospital**: 9 units. Emergency work is identified by the unit, not by any flag:
  Qasr Al Aini 2,709, Emergency 185 2,382, Abou El Reesh Emergency 661,
  Abou El Reesh Fifth Operations 613, Mounira 72, others 5.
- **Age**: `patientDob` is populated on 100% of rows and is real, not placeholders.
  NS distribution: under 1y 373, 1y 149, 2-12 1,080, 13-17 396, 18-39 1,905, 40-59 1,817, 60+ 702.
- **Procedure**: 5,473 of 6,443 carry a procCpt. Only 8 distinct alphaCodes are in use:
  CRAN 2,543, VSHN 996, LAM 709, MNR 577, FUSN 566, PRPH 59, NONE 21,
  **plus 970 cases with no procedure recorded at all**.
- **mainDiag**: reachable only as procCpt to `main_diag_procs` to `main_diags`, and it is
  many-to-many: **44 of the 100 NS-linked procedures belong to 2 or more NS mainDiags**. A craniotomy
  is simultaneously tumors, trauma, vascular and infection.
- **Years**: 2026 YTD 2,500, 2025 3,051, 2024 623, 2023 137, 2022 116, 2021 6.
  Adoption ramped through 2024, so only 2025 onward supports a capacity argument.
- **Dirty rows to handle, never to drop silently**: 7 cases with `procDate` before 2015
  (one reads `0202-07-29`), 16 with `patientDob` after `procDate` (negative age), 3 implying age over 110.

## User decisions (2026-09-29)
1. **mainDiag double-count is accepted.** A procedure belonging to 2 mainDiags shows under both
   filters. The report states this on its face so category totals are never mistaken for the case total.
2. **Filtering by procedure(s)** is in scope, multi-select, alongside the mainDiag filter.
3. **Emergency = hospital filter only.** No `caseType` column is added to `hospitals`. Consequence:
   the hospital filter must be MULTI-select so an admin can select the emergency units together, and
   the PDF cannot print a labelled emergency versus elective split.
4. **Age bands**: under 1, 1-2, 3-12, 13-17, 18-39, 40-59, 60+, plus an explicit
   `unknown` band for the 19 unusable rows. Pediatric (under 18) is also surfaced as a roll-up.
5. **No interim one-off report.** Build the tool; the professor gets his numbers from it.

## Scope
Department-admin-only analytics over CM-registered surgical cases, with Excel and PDF export.
Filters (within a filter = OR, across filters = AND):
department (auto-locked), date from and to, hospital(s), procedure(s), alphaCode families,
mainDiag(s), age band(s), gender.

Out of scope: submissions/logbook analytics (a separate existing surface), any write path,
any change to how the CM registers a surgery.

## Architecture
New module `src/caseAnalytics/` following the established analytics-module idiom
(`src/activeUsers/`, `src/searchAnalytics/`): controller / provider / router / service, raw
parameterised SQL, aggregation **in Postgres** rather than in Node, which is what makes the old
endpoint slow.

**Department scoping** uses the existing convention exactly: read the department from the admin's
**DB row** via `InstituteAdminProvider.getAdminDepartmentScope`, never the JWT claim, which goes
stale after a department switch. A NULL row value or a caller with no admin row (the superAdmin
passes `requireInstituteAdmin` hierarchically) means institution-wide, and only then is an explicit
`?deptCode=` honoured. A department admin cannot widen their own scope.

**One filtered CTE, many breakdowns.** The mainDiag filter is applied with `EXISTS` so it never
fans out rows; every breakdown then reads the same CTE, so only `byMainDiag` can double-count, and
it does so deliberately. Age band and the plausibility guards are computed in SQL:
`patientDob > procDate` or age over 110 yields band `unknown`.

### Endpoints (chain: `extractJWT`, `institutionResolver`, `userBasedRateLimiter`, `requireInstituteAdmin`)
| Method | Path | Purpose |
|---|---|---|
| GET | `/caseAnalytics/filters` | Option lists for the caller's department: hospitals, procedures (id/title/arTitle/alphaCode/numCode), alphaCode families, mainDiags, min and max `procDate`. |
| GET | `/caseAnalytics/summary` | Totals, per-year and per-month series, and breakdowns byHospital, byAgeBand, byAlphaCode, byProcedure, byMainDiag, byGender, plus a `dataQuality` block. |
| GET | `/caseAnalytics/cases` | The underlying rows, paginated, for the on-screen table. |
| GET | `/caseAnalytics/export.xlsx` | Multi-sheet workbook, server-generated. |
| GET | `/caseAnalytics/export.pdf` | Report with charts, server-generated. |

`summary.dataQuality` always reports `casesWithNoProcedureRecorded`, `casesWithUnusableDob`,
`casesOutsidePlausibleDateRange`, and `mainDiagCategorySum` next to `totalCases`, so the
double-count is visible rather than implied.

### Exports
- **Excel** via a new `exceljs` dependency. Sheets: Summary (filters applied plus headline numbers),
  By year and month, By hospital, By age band, By procedure, By alpha family,
  By main diagnosis (carrying the double-count note), Cases (raw rows). Bilingual headers.
  exceljs has no native charts, which is why charts live in the PDF.
- **PDF Arabic finding (2026-09-29, changed the plan):** the recorded pdfkit correction of
  pre-reversing Latin/digit clusters is FONT-SPECIFIC and is wrong for Cairo. Applying it corrupted
  a timestamp into `50:28:17 29-09-2026`. A non-breaking space was also rejected: it fixes spacing
  but reverses digits (18 renders 81). What Cairo actually needs is only a trailing space plus a
  three-space gap at an Arabic to Latin boundary, implemented in `src/pdf/arabicText.ts`. All of
  this was settled by rasterizing probe pages with `PDFParse.getScreenshot` and looking at them.
- **PDF** via `pdfkit`, reusing `src/pdf/reportLayout.ts` (`drawReportHeader` / `drawReportFooter`)
  and the `assets/fonts/Cairo-Regular.ttf` registration pattern from
  `renderSubmissionReportPdfKit.ts`. Charts are hand-drawn bars, matching how the rest of this
  codebase draws charts, so no new charting dependency. Applies the known Arabic-in-pdfkit
  pre-passes for spaces, digits and brackets.
- Both exports print the **exact filter set and the generation timestamp** on their first page, so a
  forwarded file can never be misread as "the whole department".

### Frontend (`NeuroLogBookFront`)
New page `/dashboard/i-admin/case-analytics` plus a sidebar entry, EN and AR, Aurora `ds-*`, RTL-safe.
Built as an inner `*Content` component rendered as the layout's child, because
`useDashboardLanguageCtx()` only resolves under the provider the LAYOUT mounts; a page body
silently reads the EN default. Filter panel, headline cards, hand-rolled charts matching the
existing analytics pages, the case table, and the two download buttons.
`VITE_SUPERADMIN_ENABLED` is not involved; this is an institute-admin surface.

## Checkpoint table
| Stage | What | Status |
|---|---|---|
| 0 | Data reconnaissance plus user decisions | DONE 2026-09-29 |
| A | This plan, approved | DONE 2026-09-29 |
| B | Backend module: filters, summary, cases (SQL aggregation, dept auto-lock) | DONE 2026-09-29, verified over HTTP on :3017 against live data (see Stage B log) |
| C | Excel export (exceljs) | DONE 2026-09-29, 10 sheets, EN and AR, read back and verified |
| D | PDF export (pdfkit plus charts) | DONE 2026-09-29, EN and AR, verified by rasterizing and inspecting every page |
| E | Frontend page, nav, i18n EN and AR | DONE 2026-09-29, tsc + vite build clean, bundle strings verified |
| F | Verification | DONE 2026-09-29: 15/15 HTTP checks, every breakdown reconciles to the total, 0 em-dashes, API doc section + auth rows added. NOT browser click-tested, the Chrome extension would not connect this session |
| G | Commit and push, ONLY on the explicit ask, since pushing main deploys production | NOT DONE, awaiting the ask |

## Guardrails for this work
- Read-only against production throughout. This feature adds **no write path and no migration**.
- No em-dashes anywhere: code, copy, commits, docs, EN and AR alike.
- Nothing committed until explicitly asked. `main` is live production on Railway and Netlify.
