# Module Upgrade Audit: diagnosis
**Date**: 2026-07-13 · **Status**: ✅ MIRROR-BACKED (router retired) — no prod ETL
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Service-only diagnosis module. The **legacy router was removed** in the spoke (3 files, +2/−229 — entity kept, routes deleted); reads now go through `referenceRead`/the mirror. The `diagnoses` table is **hub-mirrored**: KA has **1,319 rows** (richer than prod's 119 — the hub is the consolidated multi-department reference). **No prod ETL** — reference truth comes from the hub via `refApi`.

**Verdict counts:** **all ✅ · 0 🔁 · 0 ❓**.

## 1. Scope & component map
`src/diagnosis/` — entity/service (**legacy router removed**). Read via `referenceRead` (`GET /diagnosis`), `bundler`, and used by submissions/mainDiag joins. **Table owned (mirror):** `diagnoses`.

## 2. Tables affected
| Table | prod | ka | Verdict |
|---|---|---|---|
| `diagnoses` | 119 (superseded) | ✅ **1,319 (hub-synced)** | ✅ mirror, no prod ETL |

## 3. Variables & env keys — none directly (populated via refApi hub sync).
## 4. Production reality — prod `diagnoses` = 119 rows (per-tenant legacy). **Superseded by the hub's 1,319** — not migrated.
## 5. New-system state — `diagnoses` mirror populated (1,319) from the hub. Legacy router replaced by `referenceRead`.
## 6. Gap analysis
1. Schema — ✅ mirror entity (PG-native, hub ids). 2. Tenancy — ✅ none. 3. Dept — ✅ scoped via referenceRead. 4. **Reference boundary — ✅ owned by hub, mirrored; local write-path retired.** 5. Services — none. 6. PG-portability — ✅. 7. **ETL — ✅ none from prod** (hub-synced). 8. **API — router retired**; reads served by `referenceRead` (`GET /diagnosis`) — frontend-compatible shape.
## 7. Upgrade plan — **nothing to migrate**; mirror live. Keep hub sync running.
## 8. Risks — none (mirror authoritative from hub).
## 9. Open questions — none (prod 119 intentionally superseded by hub 1,319).
## 10. Approval checklist
- [x] Scope confirmed (mirror, router retired) · [x] 1,319 live · [x] No prod ETL · [x] Reads via referenceRead
