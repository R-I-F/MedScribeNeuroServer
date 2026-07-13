# Module Upgrade Audit: reports
**Date**: 2026-07-13 · **Status**: ✅ ALREADY DONE — no action required
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Institute-admin reporting/analytics at `/instituteAdmin/reports`. **Owns no table.** A thin controller/service/provider layer over the existing (already-converted) module services — **no `getRepository`, no raw SQL, no `GROUP BY`, no `getRawMany`, no date-format idioms, no `institutionId`** (grep = 0 hits). Portable and already converted; it works once its underlying data (submissions/events/candidates) is loaded.

**Verdict counts:** **all ✅ · 0 🔁 · 0 ❓**.

## 1. Scope & component map
`src/reports/` — controller/service/provider/router (**no entity**). Route `/instituteAdmin/reports`. Aggregates via other modules' services (instituteAdmin/sub/event). **Tables owned:** none.

## 2. Tables affected — none (derived analytics).
## 3. Variables & env keys — none module-specific.
## 4. Production reality — N/A (no owned table).
## 5. New-system state — pure service layer; no entity, no migration.
## 6. Gap analysis
1. Schema — n/a. 2. Tenancy — ✅ none. 3. Dept — via underlying user/candidate rows. 4. Reference — none. 5. Services — reads other local services. 6. **PG-portability — ✅ clean** (no raw SQL / GROUP BY / getRawMany / date idioms). 7. ETL — n/a. 8. API — ✅ unchanged.

## 7. Upgrade plan — **nothing to implement.** Works once submissions/events/candidates are loaded.
## 8. Risks — depends only on upstream data being present.
## 9. Open questions — none.
## 10. Approval checklist
- [x] Scope confirmed · [x] No table · [x] No implementation required
