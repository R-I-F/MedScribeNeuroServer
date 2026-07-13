# Module Upgrade Audit: conf
**Date**: 2026-07-13 · **Status**: 📋 DRAFT — awaiting user approval
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Conferences `confs` — **2 prod rows**. Only entity changed main→branch; no idioms/tenancy. FK `presenterId`→supervisors (loaded). Parent of `events.confId`. Trivial ETL.
**Verdict:** **7 ✅ · 1 🔁 · 0 ❓**.

## 1. Scope & component map
`src/conf/` (both sides), route `/conf`. Only `conf.mDbSchema.ts` changed (2 lines). FK → supervisors; parent of `events.confId`. **Table owned:** `confs`.

## 2. Tables affected
| Table | prod | Rows | prod-cts | ka | Verdict |
|---|---|---|---|---|---|
| `confs` | ✅ | 2 | 0 | ✅ (0) | 🔁 tiny ETL (after supervisors; before events) |

## 3. Variables & env keys
None module-specific. No `departmentId`.

## 4. Production reality
`confs` — `id char(36)` PK, FK `presenterId`→supervisors. Columns: `confTitle varchar(255)`, `google_uid varchar(255)`, `presenterId char(36)`, `date date`, timestamps. **2 rows.** prod-cts 0.

## 5. New-system state
`InitKaSchema`: uuid ids, `date` preserved, timestamps; FK `presenterId`→supervisors RESTRICT (seen in InitKaSchema). Live rows: **0**.

## 6. Gap analysis
1. Schema — ✅ live (char36→uuid, date, charset dropped). 2. Tenancy — ✅ none. 3. Dept — ✅ n/a. 4. Reference — none. 5. Services — none. 6. PG-portability — ✅ no idioms.
7. **🔁 ETL — `confs` (2):** char36→uuid; date preserved. Load **after supervisors, before events**. Verify count 2, presenterId FK resolves.
8. API — ✅ unchanged.

## 7. Upgrade plan
1. ETL 2 confs (after supervisors; before events). 2. Rollback: `TRUNCATE confs CASCADE`.

## 8. Risks — FK order (supervisors before confs; confs before events).
## 9. Open questions — none (prod-cts empty).
## 10. Approval checklist
- [ ] Scope · [ ] Mapping · [ ] ETL · [ ] Implement
