# Module Upgrade Audit: arabProc
**Date**: 2026-07-13 · **Status**: 📋 DRAFT — awaiting user approval
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY)
**New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Local lookup `arab_procs` (Arabic procedure names) — **81 prod rows**. Root parent of `cal_surgs.arabProcId`. Only entity changed main→branch (charset drops). No idioms, no tenancy. All titles Arabic (utf8mb4). `alphaCode` has **6 duplicate values** → not a unique key (KA must not add a unique constraint on it). prod-cts has **49** rows (differs from prod's 81).

**Verdict counts:** **7 ✅ · 1 🔁 · 1 ❓**.

## 1. Scope & component map
`src/arabProc/` (both sides), route `/arabProc`. Only `arabProc.mDbSchema.ts` changed (charset drops). Parent of `cal_surgs.arabProcId`; read by `instituteAdmin` (`/arabicProcedures`) + used in submission flows. **Table owned:** `arab_procs`.

## 2. Tables affected
| Table | prod | Rows | prod-cts | ka | Verdict |
|---|---|---|---|---|---|
| `arab_procs` | ✅ | 81 | 49 (differs) | ✅ (0 rows) | 🔁 ETL; CTS merge decision |

## 3. Variables & env keys
None module-specific. No `departmentId` (institute-wide lookup).

## 4. Production reality
**`arab_procs`** — `id char(36)` PK. Columns: `title varchar(100)` (Arabic — all 81 non-ASCII), `alphaCode varchar(10)`, `numCode varchar(255)`, `description text`, `createdAt/updatedAt datetime`. No FKs. **81 rows.** `alphaCode` **dup groups = 6** (not unique). **prod-cts:** **49 rows** (different set/count).

## 5. New-system state
KA `arab_procs` (`InitKaSchema`): `id uuid`, `title`/`alphaCode`/`numCode varchar`, `description text`, timestamps. No unique on `alphaCode` (correct — prod has dups). Live rows: **0**.

## 6. Gap analysis
1. **Schema** — ✅ live (char36→uuid, charset dropped, text preserved). No index parity issues (`alphaCode` intentionally non-unique).
2. **Tenancy** — ✅ none.
3. **Dept scoping** — ✅ n/a.
4. **Reference boundary** — local lookup (not hub); owned here. ✅
5. **Services** — none.
6. **PG-portability** — ✅ no idioms.
7. **🔁 ETL — `arab_procs` (81 prod):** id char36→uuid; Arabic preserved. Load **before `cal_surgs`**. **CTS decision:** prod (81) vs prod-cts (49) differ — recommend **load prod only** (CTS is the excluded test clone), unless CTS holds unique procedures the KA institute needs.
8. **API contract** — ✅ unchanged.

## 7. Upgrade plan
1. ETL 81 arab_procs (before cal_surgs). Verify 81 rows, Arabic intact, `alphaCode` dups preserved (6 groups).
2. Rollback: `TRUNCATE arab_procs CASCADE` on staging.

## 8. Risks
- If a unique index were ever added to `alphaCode` it would fail (6 dup groups) — do not add one.
- CTS/prod divergence — see Q1.

## 9. Open questions
1. **prod-cts 49 vs prod 81** — load prod only (recommended, CTS = test), or merge any CTS-only procedures? Need dedupe key if merging (id? title?).
2. `alphaCode`/`numCode` semantics — confirm they're informational (not keys).

## 10. Approval checklist
- [ ] Scope confirmed
- [ ] Mapping approved (alphaCode non-unique)
- [ ] ETL + CTS decision approved
- [ ] Approved to implement
