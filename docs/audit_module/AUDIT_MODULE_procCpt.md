# Module Upgrade Audit: procCpt
**Date**: 2026-07-13 · **Status**: ✅ MIRROR-BACKED (router retired) — no prod ETL
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
CPT procedure module. **Legacy router removed** (3 files, +4/−254; entity kept). `proc_cpts` is **hub-mirrored**: KA **1,429 rows** (prod had 94). **No prod ETL** — hub-synced via `refApi`; reads via `referenceRead` (`GET /procCpt`).

**Verdict counts:** **all ✅ · 0 🔁 · 0 ❓**.

## 1. Scope & component map
`src/procCpt/` — entity/service (**router removed**). Read via `referenceRead`; linked from `main_diag_procs`. **Table owned (mirror):** `proc_cpts`.

## 2. Tables affected
| Table | prod | ka | Verdict |
|---|---|---|---|
| `proc_cpts` | 94 (superseded) | ✅ **1,429 (hub-synced)** | ✅ mirror, no prod ETL |

## 3. Variables & env keys — none directly (hub sync).
## 4. Production reality — prod `proc_cpts` = 94 (per-tenant). Superseded by hub's 1,429.
## 5. New-system state — `proc_cpts` (1,429) populated from hub; linked via `main_diag_procs`.
## 6. Gap analysis
1. Schema — ✅ mirror (hub ids, PG-native). 2. Tenancy — ✅ none. 3. Dept — via referenceRead/main_diag links. 4. **Reference boundary — ✅ hub-owned, mirrored; write-path retired.** 5. Services — none. 6. PG-portability — ✅. 7. **ETL — ✅ none from prod** (hub-synced). 8. **API — router retired**; reads via referenceRead.
## 7. Upgrade plan — **nothing to migrate** (1,429 live). Keep hub sync running.
## 8. Risks — none (mirror authoritative).
## 9. Open questions — none (prod 94 superseded by hub 1,429).
## 10. Approval checklist
- [x] Scope confirmed (mirror, router retired) · [x] 1,429 live · [x] No prod ETL · [x] Reads via referenceRead
