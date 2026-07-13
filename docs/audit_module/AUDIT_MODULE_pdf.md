# Module Upgrade Audit: pdf
**Date**: 2026-07-13 · **Status**: ✅ CONVERTED — no ETL (owns no table)
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
PDF generation (submission report layout). **Owns no table** (`reportLayout.ts` + `submissionReport/`; no `*.mDbSchema.ts`). Pure rendering — no DB access, no MySQL idioms, no tenancy. Consumed by the report endpoints (e.g. instituteAdmin `/submissions/:id/report`). Nothing to migrate.

**Verdict counts:** **all ✅ · 0 🔁 · 0 ❓**.

## 1. Scope & component map
`src/pdf/` — `reportLayout.ts`, `submissionReport/` (**no entity, no router**). Invoked by report controllers to render a submission PDF. **Tables owned:** none.

## 2. Tables affected — none (rendering only; reads submission data passed in by callers).
## 3. Variables & env keys — none module-specific (may use Arabic-reshaper/bidi shims from `types`).
## 4. Production reality — N/A (no owned table).
## 5. New-system state — pure layout/render code; no entity/migration.
## 6. Gap analysis
1. Schema — n/a. 2. Tenancy — ✅ none. 3. Dept — n/a. 4. Reference — n/a. 5. Services — local rendering helper. 6. PG-portability — ✅ no DB. 7. ETL — none. 8. API — no router (used by report endpoints).
## 7. Upgrade plan — **nothing to implement.** Works once submission data is available (Arabic rendering relies on the reshaper/bidi shims in `types`).
## 8. Risks — Arabic text shaping depends on the reshaper shims; verify report PDFs render Arabic correctly post-migration (submissions carry Arabic notes).
## 9. Open questions — none.
## 10. Approval checklist
- [x] Scope confirmed (no table, rendering only) · [x] No ETL · [x] No implementation required
