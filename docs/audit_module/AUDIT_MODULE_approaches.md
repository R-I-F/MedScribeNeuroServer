# Module Upgrade Audit: approaches
**Date**: 2026-07-13 · **Status**: ✅ SEEDED (router retired) — no prod ETL
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Surgical-approach lookup. **Legacy router removed** (3 files, +2/−204; entity kept). `approaches` **seeded by `SeedKaLookups`** — KA **15 rows** = prod **15**. No prod ETL (seeded to parity). No idioms/tenancy.

**Verdict counts:** **all ✅ · 0 🔁 · 0 ❓**.

## 1. Scope & component map
`src/approaches/` — entity/service (**router removed**). Enum-like lookup used by the submission six-flags (`approach`). **Table owned:** `approaches`.

## 2. Tables affected
| Table | prod | ka | Verdict |
|---|---|---|---|
| `approaches` | 15 | ✅ **15 (seeded)** | ✅ seeded to parity — no ETL |

## 3. Variables & env keys — none.
## 4. Production reality — 15 stable approach values.
## 5. New-system state — `approaches` seeded (15) by `SeedKaLookups`. Router retired.
## 6. Gap analysis
1. Schema — ✅. 2. Tenancy — ✅ none. 3. Dept — ✅ n/a. 4. Reference — local seeded lookup. 5. Services — none. 6. PG-portability — ✅. 7. **ETL — ✅ none** (15=15). 8. **API — router retired**.
## 7. Upgrade plan — **nothing to do** (seeded, matches prod).
## 8. Risks — none.
## 9. Open questions — none.
## 10. Approval checklist
- [x] Scope confirmed (seeded, router retired) · [x] 15 = prod 15 · [x] No ETL
