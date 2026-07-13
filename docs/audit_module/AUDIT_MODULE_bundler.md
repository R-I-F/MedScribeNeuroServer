# Module Upgrade Audit: bundler
**Date**: 2026-07-13 · **Status**: ✅ CONVERTED — no ETL (owns no table)
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Aggregated reference-data bundle for the frontend at `/references` + `/candidate`. **Owns no table.** No MySQL idioms, no raw SQL, no `DataSourceManager`; 19 `institutionId` refs all resolve to the static institution. It bundles reference/lookup reads (from the mirror + local lookups) into one payload — portable and already converted.

**Verdict counts:** **all ✅ · 0 🔁 · 0 ❓**.

## 1. Scope & component map
`src/bundler/` — controller/service/provider/router/interface (**no entity**). Routes `/references`, `/candidate`. Reads reference/lookup data via services / the mirror + `referenceRead`. **Tables owned:** none.

## 2. Tables affected — none (aggregation only).
## 3. Variables & env keys — none module-specific (uses static institution).
## 4. Production reality — N/A.
## 5. New-system state — aggregates the mirror-backed reference reads + local lookups; `institutionId`→static. No entity/migration.
## 6. Gap analysis
1. Schema — n/a. 2. **Tenancy — ✅** `institutionId` resolves to the static institution (no routing). 3. Dept — reference reads are dept-scoped downstream (referenceRead). 4. **Reference boundary — ✅** consumes the mirror/referenceRead, never re-owns reference truth. 5. Services — local. 6. PG-portability — ✅ clean. 7. ETL — none. 8. API — ✅ bundle shape unchanged (frontend-compatible).
## 7. Upgrade plan — **nothing to implement**; works once the mirror + lookups are populated.
## 8. Risks — depends on mirror/lookups being synced/loaded (covered by refApi/referenceRead + lookup audits).
## 9. Open questions — none.
## 10. Approval checklist
- [x] Scope confirmed · [x] No table · [x] Reference boundary respected · [x] No implementation required
