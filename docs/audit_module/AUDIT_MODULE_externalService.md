# Module Upgrade Audit: externalService
**Date**: 2026-07-13 · **Status**: ✅ CONVERTED — no ETL (owns no table)
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
External-integration endpoints (bulk imports from external systems, e.g. Google Sheets) at `/external`. **Owns no table, no MySQL idioms, no tenancy coupling** (grep = 0). A per-institution in-workspace service that stays local. Writes go through the (already-converted) cand/etc services. Nothing to migrate.

**Verdict counts:** **all ✅ · 0 🔁 · 1 ❓** (env only).

## 1. Scope & component map
`src/externalService/` — controller/service/router/interface (**no entity**). Route `/external`. Consumed by `cand.provider` (`provideCandsFromExternal`) and the disabled `/cand/createCandsFromExternal`. **Tables owned:** none.

## 2. Tables affected — none.
## 3. Variables & env keys
`GETTER_API_ENDPOINT` (external fetch endpoint) — must exist in KA env if external import is used.
## 4. Production reality — N/A.
## 5. New-system state — pure service; writes via cand service (TypeORM). No entity/migration.
## 6. Gap analysis
1. Schema — n/a. 2. Tenancy — ✅ none. 3. Dept — n/a. 4. Reference — n/a. 5. **Services — ✅ stays local** (per-institution). 6. PG-portability — ✅ clean. 7. ETL — none. 8. API — ✅ unchanged (note: the cand bulk-import route is disabled 410).
## 7. Upgrade plan — **nothing to implement**; ensure `GETTER_API_ENDPOINT` present if used.
## 8. Risks — external endpoint/env missing → import fails; verify if used.
## 9. Open questions
1. Is external bulk import still used in the KA spoke, or fully retired (the cand route is 410)? Confirm whether `GETTER_API_ENDPOINT` must be provisioned.
## 10. Approval checklist
- [x] Scope confirmed · [x] No table · [ ] Env (`GETTER_API_ENDPOINT`) decision · [x] No DB implementation
