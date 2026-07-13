# Module Upgrade Audit: referenceRead
**Date**: 2026-07-13 · **Status**: ✅ NEW MODULE (mirror reads) — no ETL
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
**New module** (3 files, +354 lines; no main counterpart). Serves the **legacy reference read shapes from the local mirror tables**, dept-scoped: public `GET /departments`, plus `GET /mainDiag`, `/mainDiag/:id`, `/diagnosis`, `/procCpt`, `/lecture`, `/lecture/:id`. Department resolves via `?deptCode` → JWT `departmentId` claim → `REF_DEPT_CODE` default. **Owns no table** — reads the mirror populated by `refApi`. No prod ETL, no MySQL idioms.

**Verdict counts:** **all ✅ · 0 🔁 · 1 ❓ (default dept code)**.

## 1. Scope & component map
`src/referenceRead/` — **new on branch**. Root-level GET routes (mounted at `/`). Reads mirror tables (`departments`, `main_diags`, `diagnoses`, `proc_cpts`, `lectures`, `lecture_topics`). Replaces the retired per-tenant reference routers (diagnosis/mainDiag/procCpt/lecture legacy routers). **Tables owned:** none.

## 2. Tables affected — none (reads the mirror).

## 3. Variables & env keys
**`REF_DEPT_CODE`** (default department code when none provided). No DB env.

## 4. Production reality
N/A — new module. The old reference reads came from per-tenant MySQL tables; now served from the mirror.

## 5. New-system state
Dept resolution chain `?deptCode` → JWT `departmentId` → `REF_DEPT_CODE`. Reads the live mirror (departments 15, main_diags 196, diagnoses 1,319, proc_cpts 1,429, lectures 3,237, lecture_topics 141).

## 6. Gap analysis
1. **Schema** — n/a (no owned table). 2. **Tenancy** — ✅ none. 3. **Department scoping** — ✅ **this is the dept-scoping read layer** (deptCode/JWT/default). 4. **Reference boundary** — ✅ reads mirror only, never re-owns truth. 5. **Services** — none. 6. **PG-portability** — ✅ new PG-native. 7. **ETL** — none. 8. **API contract** — provides the legacy read shapes so the frontend's reference calls keep working.

## 7. Upgrade plan
**Nothing to migrate.** Ensure `REF_DEPT_CODE` set (default dept). Works once the mirror is synced (it is).

## 8. Risks — wrong/missing `REF_DEPT_CODE` → unscoped or empty reads; verify default.
## 9. Open questions
1. Confirm `REF_DEPT_CODE` default in the KA env (which department is the fallback — NS?).
## 10. Approval checklist
- [x] Scope confirmed (new, mirror reads) · [x] No table/ETL · [ ] `REF_DEPT_CODE` confirmed · [x] Dept-scoping verified
