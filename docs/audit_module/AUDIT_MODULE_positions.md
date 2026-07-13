# Module Upgrade Audit: positions
**Date**: 2026-07-13 · **Status**: ✅ SEEDED (router retired) — no prod ETL
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Patient-position lookup. **Legacy router removed** (3 files, +2/−204; entity kept). `positions` is **seeded by `SeedKaLookups`** — KA **5 rows**, matching prod's **5** exactly. No prod ETL needed (seeded to parity). No idioms, no tenancy.

**Verdict counts:** **all ✅ · 0 🔁 · 0 ❓**.

## 1. Scope & component map
`src/positions/` — entity/service (**router removed**). A stable enum-like lookup used by the submission six-flags (`pos`). **Table owned:** `positions`.

## 2. Tables affected
| Table | prod | ka | Verdict |
|---|---|---|---|
| `positions` | 5 | ✅ **5 (seeded)** | ✅ seeded to parity — no ETL |

## 3. Variables & env keys — none.
## 4. Production reality — 5 stable position values.
## 5. New-system state — `positions` seeded (5) by `SeedKaLookups`. Router retired.
## 6. Gap analysis
1. Schema — ✅ (char36→uuid, charset dropped). 2. Tenancy — ✅ none. 3. Dept — ✅ n/a (global). 4. Reference — local seeded lookup. 5. Services — none. 6. PG-portability — ✅. 7. **ETL — ✅ none** (seeded to parity, 5=5). 8. **API — router retired** (values consumed internally / via bundler).
## 7. Upgrade plan — **nothing to do** (seeded, matches prod). If prod ever gains a value, re-run/extend `SeedKaLookups`.
## 8. Risks — none (stable list, seeded).
## 9. Open questions — none.
## 10. Approval checklist
- [x] Scope confirmed (seeded, router retired) · [x] 5 = prod 5 · [x] No ETL
