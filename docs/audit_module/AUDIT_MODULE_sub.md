# Module Upgrade Audit: sub
**Date**: 2026-07-14 · **Status**: ✅ IMPLEMENTED (staging) — 3,599 → NS
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY)
**New side**: migration/mysql-to-postgres @ `dda69ef` + PG `ka-institute`

## ✅ Implementation record (2026-07-14)
The core logbook, loaded. Applied to `migration/mysql-to-postgres` + `ka-institute` staging. Prod read-only; PII/Arabic never printed; `main` untouched.

| # | Item | Where | Status |
|---|---|---|---|
| A | Add `departmentId` FK → departments (dept-scoped, nullable) | entity `sub.mDbSchema.ts` + migration `1783782610030-AddSubmissionDepartment` | ✅ `FK_submissions_department` live |
| B | ETL 3,599 submissions → NS (PII + Arabic verbatim) | `scripts/etl-submissions-prod-to-ka.cjs` | ✅ loaded, batched |
| C | **`mainDiagDocId` REMAP** (legacy prod ids → hub-mirror ids) | in ETL, by exact title (NS dept) | ✅ 10/10 categories, deterministic 1:1 |
| D | `departmentId` backfill from candidate → supervisor fallback | in ETL | ✅ all 3,599 = NS, 0 null |

**ETL verification (counts only, no PII):** total **3,599** ✅ · `departmentId=NS` **3,599** / NULL **0** · distribution candidate approved **3002** / pending **551** / rejected **41** / supervisor approved **5** (exact match to prod) ✅ · **FK orphans: mainDiag 0 / proc 0 / supervisor 0 / candidate 0** ✅ · Arabic `surgNotes` **29** preserved. `diagnosisName`/`procedureName` longtext→json; `isItRevSurg` tinyint→boolean.

**Key finding — `mainDiagDocId` needed remapping (like arab_procs):** the 3,599 submissions referenced **prod's 10 legacy main_diag ids**, none of which exist in the KA hub-mirror `main_diags`. Unlike the arab_procs case, the fix was **clean & deterministic** — every legacy category (`cns tumors`, `neuro-vascular diseases`, …) matches exactly one KA (NS) main_diag by title (1:1, verified), so the ETL swapped the ids with no ambiguity/review. (The `procDocId`/`candDocId`/`supervisorDocId` ids were preserved from prod and resolve directly.)

## 🔄 Progress Checkpoint
**Status**: ✅ implemented on staging. ▶ Next: `conf`/`journal` → `events` → `event_attendance`; `clinicalSub`; `additionalQuestions` reconcile. (Follow-on: cal_surgs `arabProcId` display-layer refactor → procCpt.)
### ▶ Next action
User decisions on §9, then (separate task) implement §7: benign `institutionId` cleanup (optional) + the big ETL of 3,599 submissions — **which is blocked on `cal_surgs` (calSurg) being loaded first**.

## 0. TL;DR
The **core logbook** — `submissions`, **3,599 prod rows**. Same conversion pattern: **only the entity changed main→branch**; controller/service/provider(1.7k lines)/router/mapper byte-identical. **No MySQL-only SQL idioms**; the `institutionId` references are **benign** (a `?institutionId=` query-param appended to the supervisor notification email link — not DB tenant routing). The real work is the **big ETL** and its **FK load order**: submissions reference `candidates` (✅ loaded), `supervisors` (✅ loaded), `main_diags` (mirror), and **`cal_surgs` (calSurg — NOT yet loaded)**. Data is clean (0 mojibake risk if read utf8mb4; 29 rows have Arabic `surgNotes`).

**Verdict counts:** **7 ✅ · 2 🔁 · 1 ❓**.

## 1. Scope & component map
Module dir `src/sub/` (both sides). Route mount `/sub`. Only `sub.mDbSchema.ts` changed main→branch (6/6 lines — type conversions). Controller/service/provider/router/`sub.mapper.ts`/interfaces identical.

| Component | Change |
|---|---|
| Entity `submissions` | MySQL→PG types only |
| Router/Controller/Service/Provider(~1.7k lines)/Mapper | none |

**Cross-module:** reads `candidates`, `supervisors` (services), `main_diags`, `cal_surgs`; calls **mailer** (`sendSupervisorNewSubmissionEmail`, background). Depended on by `event`/`instituteAdmin`/`reports`/`supervisor` (`getSubsBySupervisorId`), `clinicalSub` sibling. **Tables owned:** `submissions`.

## 2. Tables affected
| Table | In prod | Rows (prod) | Rows (prod-cts) | In ka | Rows (ka) | Verdict |
|---|---|---|---|---|---|---|
| `submissions` | ✅ | **3,599** | 1 (exclude) | ✅ (`InitKaSchema` + FKs) | 0 | 🔁 schema converted; needs **big ETL** (FK-ordered, after cal_surgs) |

## 3. Variables & env keys
`FRONTEND_URL` (email review link base — must exist in KA env). `institutionId` optional passthrough (email link only). JWT: role/id. No module-specific DB env.

## 4. Production reality (`kasr-el-ainy`)
**`submissions`** — `id char(36)` PK. **FKs:** `candDocId`→candidates, `supervisorDocId`→supervisors, `mainDiagDocId`→main_diags, `procDocId`→**cal_surgs**. Indexes: PK, UNIQUE(`subGoogleUid`), and composites `(candDocId,subStatus,submissionType)` / `(subStatus,submissionType,candDocId)` + `candDocId`.
Notable columns: `timeStamp`, `submissionType` enum(candidate,supervisor), `subStatus` enum(pending,approved,rejected), `roleInSurg`, `isItRevSurg` tinyint, `preOpClinCond`/`surgNotes`/`IntEvents` text, `insUsed`/`consUsed` varchar(1000), `diagnosisName`/`procedureName` **JSON**, six-flag cols `spOrCran/pos/approach/region/clinPres`, `reviewedBy char(36)`, `subGoogleUid`.
**Distributions (3,599):** candidate→approved **3002**, pending **551**, rejected **41**; supervisor→approved **5**.
**Data quality:** `nullTimeStamp` 0; `nullCandDocId` **5** = exactly the 5 supervisor-type subs (candDocId nullable by design → **0 real orphans**; all non-null candDocId ∈ the 110 migrated candidates); `nullSupervisorDocId` 0; `nullMainDiag`/`nullProc` 0; **Arabic in `surgNotes` = 29 rows** (utf8mb4 — must be read/written as UTF-8). **prod-cts:** 1 row (exclude, test).

## 5. New-system state (`ka-institute`)
`submissions` created by `InitKaSchema` with PG-native types: `char(36)`→uuid (candDocId/procDocId/supervisorDocId/mainDiagDocId), `datetime`→timestamp, `tinyint`→boolean (`isItRevSurg`), text/json preserved, enums `submissions_submissiontype_enum` / `submissions_substatus_enum`. FKs live: `supervisorDocId`/`candDocId`/`procDocId`/`mainDiagDocId` (RESTRICT). `reviewedBy` kept `character(36)` (nullable free id — acceptable). **No `departmentId`** on submissions (dept scoping is via the candidate join — see §6.3). Live rows: **0**.

## 6. Gap analysis
1. **Schema translation** — ✅ live (uuid FK shadows, datetime→timestamp, tinyint→boolean, JSON preserved, enums). Coerce any `0000-*` dates → NULL on load (none observed: nullTs 0, no zero-dates seen).
2. **Tenancy removal** — ✅ **effectively none.** `institutionId` is **not** DB routing — it only builds the email review URL (`?institutionId=`). Optional cleanup: drop the param or use the static institution id. Not a blocker.
3. **Department scoping** — ✅ stays **dept-global**; a submission's department is derived from its candidate (`candidates.departmentId`). No column needed on `submissions`. (Future per-dept reporting joins the candidate.)
4. **Reference boundary** — reads `main_diags` (mirror) + `cal_surgs`; owns none. ✅ correct.
5. **In-workspace services** — ✅ `mailer` stays local (`sendSupervisorNewSubmissionEmail`, background/void). Needs `FRONTEND_URL`.
6. **PG-portability** — ✅ **no MySQL idioms** (no SUBSTRING_INDEX/regexp/raw `.query`). All TypeORM.
7. **🔁 ETL — `submissions` (3,599 prod; prod-cts EXCLUDED):**
   - **Source:** `SELECT * FROM submissions` on prod (read-only, utf8mb4).
   - **Transform:** `id`/FK ids char36→uuid direct; `isItRevSurg` 0/1→bool; datetimes→timestamp; JSON cols pass through; enums pass through; preserve Arabic text as UTF-8.
   - **🔁 FK LOAD ORDER (critical):** parents must exist first — `candidates` ✅, `supervisors` ✅, `main_diags` (mirror — ensure synced), **`cal_surgs` (calSurg — MUST be loaded before this)**. Then load `submissions`, then dependents (`event`/`eventAttendance`, clinicalSub are independent).
   - **Verify:** count 3,599; distribution by (submissionType,subStatus) matches; 0 FK violations; spot-check 5 masked Arabic-note rows render correctly (no mojibake).
8. **API contract** — ✅ byte-identical (`sub.mapper.ts` response shapes unchanged).

## 7. Upgrade plan (proposed)
1. **(Optional) `institutionId` cleanup** in `sub.controller.ts:54` / `sub.provider.ts` — drop the param or source the static institution id. Cosmetic; low priority.
2. **ETL 3,599 submissions** — after `cal_surgs` is loaded (calSurg audit/ETL). Idempotent upsert on `id`. Batch (e.g. 500/tx). Verify counts + FK integrity + Arabic rendering.
3. **Rollback:** `TRUNCATE submissions CASCADE` on staging (insert-only; prod untouched).

## 8. Risks & mitigations
- **FK order** — submissions will fail to load if `cal_surgs`/`main_diags` aren't present → sequence the ETLs (calSurg before sub).
- **Arabic mojibake** — read connection must be utf8mb4; verify a sample post-load.
- **Volume** — 3,599 rows; batch inserts, single transaction per batch.

## 9. Open questions
1. **`cal_surgs` migration status** — submissions can't load until `cal_surgs` is populated. Confirm calSurg is audited/loaded first (dependency).
2. **`institutionId` email-link param** — keep (harmless) or strip in the spoke? (cosmetic).
3. **prod-cts submission (1 row)** — exclude as test (recommended, consistent).

## 10. Approval checklist
- [ ] Scope confirmed
- [ ] Table/column mapping approved
- [ ] ETL + FK order approved (cal_surgs → submissions)
- [ ] API contract (unchanged) approved
- [ ] Approved to implement (separate session/task)
