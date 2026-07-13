# Module Upgrade Audit: calSurg
**Date**: 2026-07-14 · **Status**: ✅ IMPLEMENTED (staging) — 5,578 → NS (dept-scoped) + proc_cpts link staged
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY)
**New side**: migration/mysql-to-postgres @ `55d6add` + PG `ka-institute`

## ✅ Implementation record (2026-07-14)
Applied to `migration/mysql-to-postgres` + `ka-institute` staging. Prod read-only; PII never printed; `main` untouched.

| # | Item | Where | Status |
|---|---|---|---|
| A | Add `departmentId` FK → departments (dept-scoped, **nullable**) — 5,578 all NS | entity + `ICalSurg` + migration `1783782610020` | ✅ `FK_cal_surgs_department` live |
| B | Add `procCptId` FK → proc_cpts (**nullable**, modern procedure link) | entity + migration `1783782610020` | ✅ `FK_cal_surgs_proc_cpt` live (all NULL — awaiting mapping backfill) |
| C | Keep legacy `arabProcId` (transitional) | unchanged | ✅ 4,608 rows retain it |
| D | `POST /` accepts optional `departmentId` | `validators/createCalSurg.validator.ts` + controller | ✅ tsc clean |
| E | ETL 5,578 prod surgeries → NS (PII verbatim) | `scripts/etl-calsurgs-prod-to-ka.cjs` | ✅ loaded, batched |

**ETL verification (counts only, no PII):** total **5,578** ✅ · `departmentId=NS` **5,578** · gender **male 3,131 / female 2,447** ✅ · legacy `arabProcId` set **4,608** · `procCptId` set **0** (expected — backfilled later) · **FK orphans: hospital 0 / arabProc 0** ✅. NS dept id = `65bda505-…`.

**Decisions applied (user 2026-07-14):** surgeries are **department-scoped** (nullable — bulk external-import `/postAllFromExternal` would break under NOT NULL), existing 5,578 → NS. `arab_procs` is the **legacy** procedure solution → replaced by `proc_cpts` (bilingual + vector-embedded on the hub). `procCptId` staged nullable; the code/title mapping is NOT reliable (numCode 1/81, title 0/81, alphaCode is a category 1:many).

## ⏭️ Follow-on: arab_procs → proc_cpts semantic remap (NOT done here)
The **73 distinct** legacy procedures used by 4,608 surgeries must be mapped to `proc_cpts` via the **hub's `/v1/procedure-search`** (embeddings), then **user-reviewed** (medical correctness), then `procCptId` backfilled. After that: switch reads to `procCptId`, retire `arabProcId` + `arab_procs`. Tracked separately.

## 🔄 Progress Checkpoint
**Status**: ✅ implemented on staging. ▶ Next: `submissions` (procDocId → cal_surgs now satisfiable); separately, the proc_cpts semantic remap.

## 0. TL;DR
Surgical-case calendar `cal_surgs` — **5,578 prod rows**, the largest table in the logbook and the **parent of `submissions.procDocId`**. Only the entity changed main→branch; no MySQL idioms, no tenancy coupling. Clean data, **0 orphans**. ⚠️ Contains **patient PII** (`patientName`, `patientDob`) — this audit reports counts only, never values. Its own FKs (`hospitalId`→hospitals, `arabProcId`→arab_procs) set the load order.

**Verdict counts:** **7 ✅ · 1 🔁 · 1 ❓** (the 🔁 = the ETL; ❓ = PII handling policy).

## 1. Scope & component map
`src/calSurg/` (both sides), route `/calSurg`. **Only `calSurg.mDbSchema.ts` changed** main→branch (charset drops). Controller/service/provider/router/interfaces identical. **Cross-module:** referenced by `submissions.procDocId` (RESTRICT) and read by `instituteAdmin` dashboards (`/calendarProcedures`). Reads `hospitals`, `arab_procs`. **Table owned:** `cal_surgs`.

## 2. Tables affected
| Table | prod | Rows | prod-cts | ka | Verdict |
|---|---|---|---|---|---|
| `cal_surgs` | ✅ | **5,578** | 1 (exclude) | ✅ (0 rows) | 🔁 ETL (FK-ordered) |

## 3. Variables & env keys
No module-specific env. DB via `DataSource`. No `departmentId` on this table (dept-global; scoping is via procedure/hospital/candidate context elsewhere).

## 4. Production reality (`kasr-el-ainy`)
**`cal_surgs`** — `id char(36)` PK. Columns: `timeStamp datetime`, **`patientName varchar(255)` [PII]**, **`patientDob date` [PII]**, `gender enum(male,female)`, `hospitalId char(36)` FK→hospitals, `arabProcId char(36)` FK→arab_procs (nullable), `procDate date`, `google_uid varchar(255)`, `formLink text`, `createdAt/updatedAt datetime`.
**FKs:** `hospitalId`→hospitals, `arabProcId`→arab_procs. **Distributions:** gender male **3,131** / female **2,447**. **Quality:** nullHospitalId 0, **nullArabProcId 970** (nullable — fine), nullPatientName 0, nullPatientDob 0, nullTimeStamp 0. **Orphans: 0** vs both hospitals and arab_procs. **prod-cts:** 1 row (exclude, test).

## 5. New-system state (`ka-institute`)
`cal_surgs` created by `InitKaSchema`: `char(36)`→uuid (id/hospitalId/arabProcId), `datetime`→timestamp, `date` preserved, `gender` → `cal_surgs_gender_enum(male,female)`, text preserved. FKs live: `hospitalId`/`arabProcId` (nullable) RESTRICT. Live rows: **0**.

## 6. Gap analysis
1. **Schema translation** — ✅ live (uuid FK shadows, datetime→timestamp, date preserved, gender enum, charset dropped).
2. **Tenancy removal** — ✅ none.
3. **Department scoping** — ✅ n/a (no `departmentId`; calendar is institute-wide, contextual scoping via hospital/procedure).
4. **Reference boundary** — reads `arab_procs` (local) + `hospitals` (local); owns none.
5. **In-workspace services** — none called.
6. **PG-portability** — ✅ no MySQL idioms.
7. **🔁 ETL — `cal_surgs` (5,578 prod; prod-cts EXCLUDED):**
   - **Source:** `SELECT * FROM cal_surgs` (read-only, utf8mb4 — patientName may be Arabic).
   - **Transform:** id/FK char36→uuid; datetime→timestamp; date preserved; gender enum passes through; **carry PII as-is** (it is the institution's own operational data, staying in the KA DB) — but never log/print values.
   - **🔁 LOAD ORDER:** after `hospitals` + `arab_procs`; **before `submissions`** (submissions.procDocId → cal_surgs).
   - **Verify:** count 5,578; gender split 3,131/2,447; 0 FK violations; nullArabProcId 970 preserved.
8. **API contract** — ✅ byte-identical.

## 7. Upgrade plan (proposed)
1. **ETL 5,578 `cal_surgs`** — after hospitals + arab_procs loaded; before submissions. Idempotent upsert on `id`, batched. Counts-only verification (no PII in logs).
2. **Rollback:** `TRUNCATE cal_surgs CASCADE` on staging (prod untouched).

## 8. Risks & mitigations
- **PII exposure** — never sample/log patientName/patientDob; ETL prints counts only.
- **FK order** — hospitals + arab_procs before cal_surgs; cal_surgs before submissions.
- **Volume** — 5,578 rows; batch inserts.

## 9. Open questions
1. **PII policy** — confirm patient names/DOBs migrate verbatim into `ka-institute` (they are KA's own operational records). Any masking/retention rule? (Recommend: migrate as-is; it's first-party clinical data.)
2. **prod-cts row** — exclude as test (recommended).

## 10. Approval checklist
- [ ] Scope confirmed
- [ ] Table/column mapping approved
- [ ] ETL + FK order approved (hospitals+arab_procs → cal_surgs → submissions)
- [ ] PII handling approved
- [ ] Approved to implement (separate session/task)
