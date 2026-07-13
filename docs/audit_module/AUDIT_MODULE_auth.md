# Module Upgrade Audit: auth
**Date**: 2026-07-13 · **Status**: ✅ CONVERTED — no ETL (owns no table)
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
Authentication surface for all roles (login/refresh/register/forgot-reset, JWT issuing incl. the `departmentId` claim). **Owns no table** — it operates over the role entities (candidates/supervisors/institute_admins/super_admins/clerks). Heavily rewritten for the spoke (4 files, 107 ins / 145 del): every tenant touchpoint now resolves to **`getStaticInstitution().id`** (5 login flows), `DataSourceManager.getDataSource()` is the **pinned** static datasource, and the one raw query (`resolveDepartmentId`) is already **PG syntax** (`SELECT "id" FROM "departments" WHERE "id" = $1`). No MySQL idioms. This is also where the **cand/supervisor `departmentId` create-time enforcement** lives (shipped/committed; instituteAdmin fix pending commit).

**Verdict counts:** **all ✅ · 0 🔁 · 1 ❓** (env only).

## 1. Scope & component map
`src/auth/` — controller/service/router + `authToken.service.ts` (JWT, incl. `departmentId` claim), interface, http. Route `/auth`. **No entity.** Endpoints: `/validate`, `/registerCand`, `/registerSupervisor`, `/login` (candidate→supervisor), `/superAdmin/login`, `/instituteAdmin/login`, `/clerk/login`, `/refresh`, `/logout`, `/requestPasswordChangeEmail`, `/changePassword`, `/forgotPassword`, `/resetPassword`, `/resetCandPass`, `/get/all`. Depends on cand/supervisor/instituteAdmin/superAdmin/clerk services + passwordReset + institution (static). **Tables owned:** none.

## 2. Tables affected — none (auth reads the role tables, owns none).

## 3. Variables & env keys
JWT secrets (access/refresh), `INSTITUTION_ID` (via `getStaticInstitution`). JWT claims: **role + id + `departmentId`** (no institution UUID for tenant routing). Must exist in KA env.

## 4. Production reality — N/A (no owned table). Role data covered by cand/supervisor/instituteAdmin/superAdmin/clerk audits.

## 5. New-system state
- Login: 5 role-segregated flows, each stamps `institutionId = getStaticInstitution().id` into the token. Candidate/supervisor share `/auth/login` (candidate-first).
- `DataSourceManager.getInstance().getDataSource()` (no arg) → pinned static `AppDataSource`.
- `resolveDepartmentId` uses PG-native SQL (portable).
- Registration enforces `departmentId` for cand/supervisor (NOT NULL tables); optional for institute admins.

## 6. Gap analysis
1. **Schema** — n/a (no table).
2. **Tenancy removal** — ✅ **done** — static institution id everywhere; pinned datasource manager; no per-tenant routing.
3. **Department scoping** — ✅ JWT carries `departmentId`; registration validates/sets it (cand/supervisor required; instituteAdmin optional/nullable).
4. **Reference boundary** — reads mirror `departments` (for `resolveDepartmentId`). ✅
5. **In-workspace services** — mailer (reset/change-email) stays local.
6. **PG-portability** — ✅ the single raw query is PG syntax; no MySQL idioms. (The `getXByEmail` `SUBSTRING_INDEX` bugs live in the role providers, fixed separately.)
7. **ETL** — none (no table).
8. **API contract** — ✅ endpoints/paths unchanged; **one deliberate change**: registration now requires `departmentId` for candidate/supervisor (from the NOT-NULL decision) — the frontend must send it.

## 7. Upgrade plan
**Nothing new to implement here.** Operational: ensure JWT secrets + `INSTITUTION_ID` in KA env. The registration `departmentId` enforcement is already implemented (cand/supervisor committed; instituteAdmin email-fix pending commit).

## 8. Risks & mitigations
- Missing JWT/`INSTITUTION_ID` env → boot/login failure; verify.
- Cross-role first-match quirk in forgot-password (documented in the supervisor audit) — pre-existing, out of scope.

## 9. Open questions
1. Confirm KA env has JWT secrets + `INSTITUTION_ID` (historical value).

## 10. Approval checklist
- [x] Scope confirmed (no table)
- [x] Tenancy removal verified (static institution + pinned DS)
- [ ] KA env (JWT + INSTITUTION_ID) confirmed
- [x] API contract reviewed (registration departmentId requirement noted)
