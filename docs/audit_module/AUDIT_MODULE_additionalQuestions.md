# Module Upgrade Audit: additionalQuestions
**Date**: 2026-07-14 · **Status**: 📋 DRAFT — awaiting user approval
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `f5d2c50` + PG `ka-institute`

> **⚠️ This plan SUPERSEDES the earlier draft.** The previous version scoped this module to
> reconciling the legacy six-flag table (196 seeded vs 10 prod rows). That is now **moot**:
> the decision is to **retire the six-flag model entirely** and move KA onto the hub's
> dynamic questions framework (LibelusRefApi owns the correct schema). This audit re-scopes
> accordingly and adds the **submission coupling**, which the old draft never addressed.

## 🔄 Progress Checkpoint (delete when approved)
**Last updated**: 2026-07-14 · **Status**: partially implemented (safe/additive stages done)

### ✅ Implemented (2026-07-14) — additive, reversible, dual-read; frontend untouched
Decisions taken (user-approved): Q1 = normalized `submission_question_answers` table · Q2 = store
optionId when resolvable + raw value always · Q3 = dual-read (legacy columns kept) · Q4 = six-flag
abandoned · Q5 = unmatched choice value → raw · Q6 = authoring stays on hub.
- **Stage A** — 4 question mirror tables (`MirrorRefQuestions1783782610040`) + `RefApiClient`
  `getQuestionsByDept`/`getQuestionsByMainDiag` + `RefMirrorService` sync steps. Verified after a
  full sync: ref_questions **98**, ref_question_options **472**, main_diag_questions **700**
  (match hub active counts); main_diag_question_options 1989 (resolved effective set).
- **Stage B (table)** — `submission_question_answers` (`AddSubmissionQuestionAnswers1783782610050`).
- **Stage C** — backfilled **5,948** answer rows from the 6 legacy columns; per-key counts match
  production column-for-column; choice answers resolved to option ids (only `approach="occipital
  transtentorial"` ×7 kept raw); zero orphans. (`scripts/backfill-submission-question-answers.cjs`)

### ▶ Remaining (deferred — needs frontend coordination)
- **Stage B (contract)** — serve dynamic questions on `/mainDiag` (retire six-flag attach); change
  submission create/read to keyed answers (`sub.interface.ts`); retire `/additionalQuestions` PUT.
- **Stage D** — drop six-flag `additional_questions` + the 6 `submissions` columns (point of no return).
- Repoint analytics SQL off the 6 columns before Stage D.

## 0. TL;DR
Two legacy structures must go, together:
1. **`additional_questions` (six-flag config)** — `mainDiagDocId` + 6 booleans toggling which of
   a *fixed* set of 6 questions show per main-diagnosis. Owned locally; 196 seeded rows in KA.
2. **The 6 inline answer columns on `submissions`** — `spOrCran, pos, approach, region,
   clinPres, IntEvents`. Answers live directly on each submission as strings, and the
   **input contract is hardcoded per diagnosis category** in `sub.interface.ts`
   (`ICnsTumor`, `ISpDegenDis`, … with literal unions e.g. `spOrCran?: "spinal" | "cranial"`).

The hub (LibelusRefApi) now owns the **correct, dynamic** framework — 4 tables, per-department
questions (NS 6, others 4–9), options, and per-main-diag narrowing — served at
`/v1/refAdditionalQuestions/*`. It is **not mirrored** (no mirror tables, no client method, no
sync step). **The good news:** the hub's NS questions are a 1:1 rename of the legacy 6, and the
hub NS option values are the *same vocabulary* the legacy answers use — so the historical answer
migration is **value-preserving**, and all 3,599 KA subs are NS (single-domain).

**Verdict counts: 2 🗑️ · 4 🔁 · 1 ✅ · 6 ❓ (decisions).**

## 1. Scope & component map
| Component | Old (main) | New (branch) | Note |
|---|---|---|---|
| `src/additionalQuestions/` (6 files) | six-flag CRUD | six-flag, tinyint→boolean | 🗑️ to retire |
| entity `additional_questions` | `mainDiagDocId char36` + 6 `tinyint(1)` | + 6 `boolean`, `mainDiagDocId uuid` | 🗑️ replaced by mirror |
| route `/additionalQuestions` (GET/GET/PUT) | present | present, mounted | 🔁 re-point to mirror or retire |
| `src/sub/` answer fields | 6 inline string cols | same 6 cols | 🔁 convert to keyed answers |
| `src/sub/interfaces/sub.interface.ts` | per-category typed inputs, literal enum unions | same | 🔁 replace with generic keyed answers |
| `src/referenceRead/referenceRead.provider.ts` | n/a (old = CRUD) | attaches six-flag to `getMainDiagsByDepartment` | 🔁 attach hub questions instead |
| `src/refApi/` (client, mirror) | n/a | **no** question methods/sync | 🔁 add mirror (4 tables + 2 client methods + sync steps) |
| `src/bundler/` | — | does NOT read questions (equipment/consumables/approaches/regions/positions only) | ✅ no change |
| DI (`container.config.ts`) | 4 six-flag bindings | 4 six-flag bindings | 🔁 adjust on retire |

**Tables owned/affected:** `additional_questions` (six-flag) · `submissions` (6 answer cols) · plus
4 NEW mirror tables to add (see §5).

## 2. Tables affected
| Table | prod MySQL | Rows (prod) | Rows (prod-cts) | ka-institute | Rows (ka) | Verdict |
|---|---|---|---|---|---|---|
| `additional_questions` (six-flag) | ✅ | 10 | 17 | ✅ | 196 (seeded) | 🗑️ **retire** — replaced by mirror |
| `submissions` (6 answer cols) | ✅ | 3,599 | — | ✅ | 3,599 (ETL done) | 🔁 **convert** answer storage |
| `additional_questions` (hub defs) | ❌ | — | — | ❌ | 0 | 🔁 **add mirror table** |
| `question_options` (hub) | ❌ | — | — | ❌ | 0 | 🔁 **add mirror table** |
| `main_diag_questions` (hub) | ❌ | — | — | ❌ | 0 | 🔁 **add mirror table** |
| `main_diag_question_options` (hub) | ❌ | — | — | ❌ | 0 | 🔁 **add mirror table** |

Hub framework sizes (source of truth, per LibelusRefApi): additional_questions 86 · question_options 472 · main_diag_questions 700 · main_diag_question_options 937. Questions/department: NS 6, CTS/GS/PEDSURG/TRS/VASC 6, MFS 7, ENT/OBGYN/ORTHO/UROL 8, SOC 9, HBP/PRS 5, OPHTHAL 4.

## 3. Variables & env keys
None module-specific. Questions are keyed by main-diag/department; no institution UUID. Reads
ride the existing mirror `dataVersion` machinery (`REF_API_URL`/`REF_API_KEY`, HMAC resync webhook).

## 4. Production reality (read-only findings)
- **`additional_questions` (six-flag):** `mainDiagDocId char(36)` FK→main_diags; 6× `tinyint(1)`
  (`spOrCran,pos,approach,region,clinPres,intEvents`). prod **10** rows (sparse per-diagnosis
  overrides), prod-cts **17** (CTS clone). *These become irrelevant once six-flag is retired.*
- **`submissions` (3,599 rows)** — the 6 answer columns are stored **inline as strings**, filled
  sparsely: `spOrCran` 802, `pos` 807, `approach` 807, `region` 530, `clinPres` 74, `IntEvents`
  2,928. Types: `spOrCran/pos/region varchar(50)`, `approach varchar(255)`, `clinPres/IntEvents text`.
- **Choice values are clean, low-cardinality enums** matching the hub option vocabulary exactly:
  `spOrCran` = {cranial 722, spinal 80}; `pos` = {supine 580, prone 180, lateral 26, other 14,
  concorde 7}. (approach/region: spot-check pending — values expected to map to the hub option
  set, with unmatched free-text → `other`/raw. See Q5.)

## 5. New-system (KA) state
- **Six-flag `additional_questions`:** live, `InitKaSchema` + `SeedKaSixFlags`; 6 booleans,
  `mainDiagDocId uuid` FK→main_diags; **196 rows** (one seeded default per mirror main_diag).
- **`submissions`:** 3,599 rows (ETL complete), same 6 answer columns, same fill rates; **all 3,599
  are department NS**.
- **Hub question framework: NOT present.** No mirror tables, `RefApiClient` has no
  `getAdditionalQuestions*`, `RefMirrorService.sync()` only ensures the all-zero six-flag row per
  main_diag. `referenceRead` attaches the six-flag config to main-diag list reads.
- **Precedent to copy:** the equipment/consumables mirror added this session
  (`ExtendEquipmentConsumablesMirror` migration + `RefMirrorService` steps + client methods +
  `department_*` link rebuild) is the exact template for the reference side here.

## 6. Gap analysis (old pattern → new pattern)
1. **Schema translation** — the six-flag PG entity is fine as-is but is **retired**, not converted.
   New mirror tables translate the hub's PG schema verbatim (uuid PKs preserved, same as other
   mirror tables): `additional_questions(id,departmentId,key,label,arLabel,inputType,isRequired,
   sortOrder,isActive)`, `question_options(id,questionId,value,arValue,sortOrder)`,
   `main_diag_questions(mainDiagId,questionId)`, `main_diag_question_options(mainDiagId,questionId,
   optionId)`. (Exact hub column names to be confirmed at build time.)
2. **Tenancy** — ✅ none; questions keyed by department/main-diag, all in the one DB.
3. **Department scoping** — questions carry `departmentId`; the mirror pulls per-department (like
   equipment/consumables). Historical subs are NS-only, so the answer ETL only touches NS keys.
4. **Reference boundary** — 🔁 the question framework is **reference truth owned by the hub**. KA
   must consume it via the mirror, never re-own it. The local six-flag table violated this; retiring
   it fixes the boundary. (Question *authoring* stays on the hub — out of scope for this API.)
5. **In-workspace services** — none involved.
6. **Data migration (ETL plan, not a script):**
   - **Reference side (config):** none — the 4 tables are mirror-synced from the hub, not ETL'd
     from prod. First sync populates them.
   - **Answer side (tenant data):** migrate the 6 inline columns on `submissions` → the new keyed
     answer store, for the filled cells only. Mapping (value-preserving):
     `spOrCran→surgicalDomain`, `pos→position`, `approach→approach`, `region→region`,
     `clinPres→clinicalPresentation`, `IntEvents→intraopEvents`. Choice values map to the mirrored
     `question_options` (resolve option id by value; unmatched → store raw value + flag). Free-text
     (`clinicalPresentation`,`intraopEvents`) copied verbatim. Scope: 3,599 NS subs; ~5,148 filled
     cells total. **Verification:** per-column filled-count(prod col) == answer-rows(mapped key);
     spot-check 10 subs end-to-end; zero orphan answers (every answer's questionId in the mirror).
     Runs against KA staging first, after approval.
7. **API contract compatibility** — 🔁 **breaking, frontend-visible:**
   - `GET /additionalQuestions` (six-flag shape) and the six-flag attach on `GET /mainDiag`
     change to the hub question shape (questions + options per main-diag). Frontend must render
     dynamic questions instead of the 6 hardcoded fields.
   - Submission **create/update** input moves from the per-category typed fields
     (`sub.interface.ts` literal unions) to a generic `answers: [{questionKey, value|optionId}]`.
   - Submission **read** exposes answers as keyed pairs, not 6 named fields. Analytics SQL that
     reads `submissions.spOrCran` etc. must switch to the answer store.
8. **State-of-the-art recommendation** — replace the stringly-typed, per-category-hardcoded fields
   with a normalized `submission_question_answers` table (submissionId FK, questionId FK→mirror,
   optionId FK nullable, value text) — queryable for analytics, idiomatic with the repo's
   TypeORM-entity + provider pattern and git-tracked `migrations-ka`. JSONB is the lighter
   alternative (Q1).

## 7. Upgrade plan (proposed — requires approval)
**Stage A — reference mirror (safe, reversible, no submission impact):**
1. `migrations-ka` migration: create the 4 hub-question mirror tables (uuid PKs, FKs to
   `departments`/`main_diags`, join tables rebuilt each sync — mirror the equipment/consumables shape).
2. `RefApiClient`: add `getAdditionalQuestionsByDept(deptCode)` + `getAdditionalQuestionsByMainDiag(id)`
   (or a single per-department pull that includes options + narrowing).
3. `RefMirrorService.sync()`: pull per department, upsert the 4 tables, rebuild the two link tables;
   extend `RefSyncResult`. Ride the existing `dataVersion`/webhook path.
4. Verify KA mirror counts == hub (86/472/700/937) after a resync.

**Stage B — submission answer store + read/attach:**
5. `migrations-ka` migration: create `submission_question_answers` (or add JSONB `answers` to
   `submissions`) — per Q1.
6. `referenceRead`: attach hub questions (from the mirror) to main-diag reads; retire the six-flag attach.
7. Submission provider/controller/validators + `sub.interface.ts`: accept/return generic keyed
   answers; keep the 6 legacy columns **read-only** during transition (dual-read) — per Q3.

**Stage C — data migration (after A+B in staging):**
8. Backfill `submission_question_answers` from the 6 columns using the §6.6 mapping; verify.
9. Repoint analytics/reporting reads off the 6 columns.

**Stage D — retire legacy:**
10. Drop the six-flag `additional_questions` module + table (and `SeedKaSixFlags` from the active
    chain) and the 6 `submissions` answer columns — only after B/C verified and frontend cut over.

**Rollback:** Stages A/B are additive (drop new tables to revert). Stage C is idempotent re-backfill.
Stage D is the point of no return — do last, after sign-off.

## 8. Risks & mitigations
- **Frontend contract break** (§6.7) — biggest risk. Mitigate: keep legacy columns read-only
  through B/C so old and new can be dual-read; coordinate the frontend cutover before Stage D.
- **approach/region value drift** — some legacy strings may not match a hub option (free-typed).
  Mitigate: pre-scan distinct values (Q5); unmatched → `other`/raw, never dropped.
- **Analytics coupling** — SQL reading `submissions.spOrCran` etc. silently breaks at Stage D.
  Mitigate: grep all readers; convert in Stage C.
- **Non-NS future subs** — dynamic questions for other departments have no historical answers;
  that's expected (they start fresh), not a defect.

## 9. Open questions for the user
1. **Answer store shape** — normalized `submission_question_answers` table (recommended, queryable)
   vs JSONB `answers` column on `submissions` (lighter, less analytics-friendly)?
2. **Choice answers** — store the mirrored `question_options.id` (FK), the raw value string, or both?
   (Recommend both: option id when resolvable, value always.)
3. **Cutover style** — dual-read (keep 6 columns read-only through transition, recommended) vs hard
   cutover at Stage D?
4. **Six-flag reconciliation** — confirm it's abandoned (prod's 10 overrides + 196 seeded rows are
   discarded when six-flag is retired)? The old plan's overlay question is moot under this direction.
5. **approach/region mapping** — OK to map unmatched legacy strings to `other`/raw during backfill?
   (A pre-scan of distinct values will quantify the mismatch before we commit.)
6. **Question authoring** — confirm all question/option authoring stays on the hub (LibelusRefApi),
   and the KA `/additionalQuestions` write endpoint (`PUT`) is retired (read-only mirror)?

## 10. Approval checklist
- [ ] Scope confirmed (retire six-flag + submission answer store, not the old reconciliation)
- [ ] Answer-store shape approved (Q1)
- [ ] Answer mapping + option-resolution rules approved (Q2, Q5)
- [ ] Cutover style approved (Q3)
- [ ] API contract change acknowledged with frontend owner (§6.7)
- [ ] Approved to implement (separate session/task — NOT this skill)
