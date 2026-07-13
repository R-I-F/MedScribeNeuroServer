# Module Upgrade Audit: regions
**Date**: 2026-07-13 · **Status**: ✅ SEEDED (router retired) — no prod ETL
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Anatomical-region lookup. **Legacy router removed** (3 files, +2/−204; entity kept). `regions` **seeded by `SeedKaLookups`** — KA **4 rows** = prod **4**. No prod ETL (seeded to parity). No idioms/tenancy.

**Verdict counts:** **all ✅ · 0 🔁 · 0 ❓**.

## 1. Scope & component map
`src/regions/` — entity/service (**router removed**). Enum-like lookup used by the submission six-flags (`region`). **Table owned:** `regions`.

## 2. Tables affected
| Table | prod | ka | Verdict |
|---|---|---|---|
| `regions` | 4 | ✅ **4 (seeded)** | ✅ seeded to parity — no ETL |

## 3. Variables & env keys — none.
## 4. Production reality — 4 stable region values.
## 5. New-system state — `regions` seeded (4) by `SeedKaLookups`. Router retired.
## 6. Gap analysis
1. Schema — ✅. 2. Tenancy — ✅ none. 3. Dept — ✅ n/a. 4. Reference — local seeded lookup. 5. Services — none. 6. PG-portability — ✅. 7. **ETL — ✅ none** (4=4). 8. **API — router retired**.
## 7. Upgrade plan — **nothing to do** (seeded, matches prod).
## 8. Risks — none.
## 9. Open questions — none.
## 10. Approval checklist
- [x] Scope confirmed (seeded, router retired) · [x] 4 = prod 4 · [x] No ETL
