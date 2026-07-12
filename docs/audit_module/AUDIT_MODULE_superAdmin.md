# Module Upgrade Audit: superAdmin
**Date**: 2026-07-13 · **Status**: ✅ IMPLEMENTED (staging) — 2026-07-13
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY)
**New side**: migration/mysql-to-postgres @ `f115d47` + PG `ka-institute`

## ✅ Implementation record (2026-07-13, user-approved)
Applied to the `ka-institute` staging DB. Production MySQL untouched (read-only). **Zero code changes, zero migrations — ETL only** (cleanest module of the series).

| # | Item | Where | Status |
|---|---|---|---|
| A | ETL 1 prod super admin (owner account) → ka, id + bcrypt hash verbatim | `scripts/etl-super-admins-prod-to-ka.cjs` (gitignored) | ✅ 1 upserted, all checks passed |
| B | Login smoke test on staging (full route→resolver→repository→bcrypt chain) | `POST /auth/superAdmin/login` | ✅ see below |

**ETL verification (no PII):** ka total **1** ✅ · id preserved ✅ · email matches prod ✅ · **password hash byte-verbatim ✅** (critical — superAdmins have no forgot-password) · bcrypt format `$2x`/60 ✅ · approved=true ✅ · role=superAdmin ✅.

**Smoke test (staging, `npm run start:staging`):** wrong password on the real account → `401 "Invalid credentials"` (row FOUND in PG, bcrypt executed against the copied hash); unknown email → `401 "Super Admin account not found"` (correct negative). Real-password login will therefore succeed.

**⚠️ Two findings discovered during implementation (not in the draft audit):**
1. **`/auth/superAdmin/login` is NODE_ENV-gated** (`auth.router.ts:193-199`): it returns `403 "Super Admin login is disabled in this environment"` unless `NODE_ENV=development`. **Identical on main** → production parity preserved, NOT a spoke regression (staging runs `NODE_ENV: staging`, so the 403 there is expected; the smoke test used a runtime `NODE_ENV=development` override — `.env.staging` was not edited). Consequence: the superAdmin account is a dev-environment tool by design.
2. **The deprecated `adminLogin` controller method is NOT mounted** — no `/auth/admin/login` route exists on either side. Open question 2 resolves itself: it's unrouted dead code (prune opportunistically), nothing to retire at the API surface.

**Rollback (staging only):** `TRUNCATE super_admins` — insert-only ETL into a previously empty table.

## 🔄 Progress Checkpoint (resumption state — keep this section first; delete when approved)
**Last updated**: 2026-07-13
**Status**: ✅ IMPLEMENTED on staging + committed/pushed (2026-07-13)

- [x] Phase 1 — component inventory (old + new code surface)
- [x] Phase 2 — production DB reality (tables read: `super_admins`, prod-cts `super_admins`)
- [x] Phase 3 — new KA-PSQL state (live `ka-institute` schema + counts)
- [x] Phase 4 — gap analysis
- [x] Phase 5 — plan finalized
- [x] IMPLEMENTED — ETL 1 row + login smoke test (see Implementation record)

### ▶ Next action
None — implementation complete and verified on staging; committed & pushed 2026-07-13 (user go-ahead).

---

## 0. TL;DR — cleanest module audited so far, zero code changes needed

Same shape as cand/supervisor/instituteAdmin: **only the entity changed main→branch** (charset/collation strip; everything else byte-identical). But unlike those three, the provider has **NO hand-written SQL at all** — `getSuperAdminByEmail` is plain `LOWER(TRIM())` (no `SUBSTRING_INDEX`, no canonical-email gymnastics) — so there is **no PG-portability bug to fix**. Auth login is already spoke-converted. Schema is already live and index-exact. The **only gap is the ETL of a single row**: the one production super admin (the platform owner's account). Notably, since `POST /superAdmin` is disabled (security hardening), **the ETL is the only supported way the KA spoke gets its super admin** — without it, no superAdmin login and every `requireSuperAdmin` route is unusable.

**Verdict counts: 8 ✅ · 1 🔁 (ETL) · 1 🗑️ · 0 ❓** (one confirmation question, not a blocker).

---

## 1. Scope & component map

Module dir: `src/superAdmin/` — exists on **both** main and branch. `/superAdmin` is a minimal user-management surface for the platform's top role. **Deliberately hardened**: `POST /` (create) is commented out ("TEMPORARILY DISABLED - Security hardening"), `PUT /:id` and `DELETE /:id` were removed entirely — only 2 read routes remain. Login: `/auth/superAdmin/login` (plus a deprecated combined `/auth/admin/login` that tries superAdmin first, then instituteAdmin).

| Component | Old (main) | New (branch) | Change |
|---|---|---|---|
| Entity | `superAdmin.mDbSchema.ts` → `@Entity("super_admins")` | same | **only file changed**: charset/collation stripped (Stage-B). NO departmentId added (deliberate — §6.3) |
| Router | `superAdmin.router.ts` @ `/superAdmin` (2 active routes) | identical | none |
| Controller | `superAdmin.controller.ts` (bcryptjs hashing; strict `req.institutionDataSource`, throws if unresolved) | identical | none |
| Service | `superAdmin.service.ts` (pass-through) | identical | none |
| Provider | `superAdmin.provider.ts` (pure repository/QueryBuilder) | identical | none — **dialect-safe, zero raw-SQL idioms** |
| Interface | `superAdmin.interface.ts` | identical | none |
| DI bindings | `container.config.ts:207-210` | identical | none |
| Route mount | `routes.config.ts:101` → `app.use("/superAdmin", …)` | identical | none |
| Dev tooling | `http/` — 4 `.http` samples | identical | post/put/delete samples reference removed routes (cosmetic only) |

**Routes (2 active):** `GET /`, `GET /:id` — both `extractJWT + institutionResolver + userBasedRateLimiter + requireSuperAdmin`.

**Cross-module dependents:**
- `auth` — `/auth/superAdmin/login` (`auth.controller.superAdminLogin:231`): repository `findOne({where:{email}})` + bcrypt compare. **Already spoke-converted**: inbound `institutionId` accepted-and-ignored, token carries `getStaticInstitution().id`; **no `departmentId` claim** (institution-global role). Deprecated `adminLogin` (`:363`) also queries `SuperAdminEntity` first — same repository pattern, PG-safe.
- `passwordReset` — **forgot-password INTENTIONALLY EXCLUDES superAdmin** (`passwordReset.provider.ts:39`: "forgot/reset password is not offered for superAdmins"); the by-userId reset/lookup switches handle role `superAdmin` via `getSuperAdminById`/`updateSuperAdmin` — repository calls, dialect-safe.
- `validators` — `superAdminLogin`, `createSuperAdmin`, `getSuperAdminById`, `updateSuperAdmin`, `deleteSuperAdmin` (last three back disabled/removed routes; harmless dead weight).
- Many routers import the `requireSuperAdmin` **guard** (event/hospital/arabProc/additionalQuestions/calSurg/cand/supervisor/instituteAdmin/referenceRead) — JWT-role middleware, not a DB dependency on this module. **But every one of those admin surfaces is unreachable until a super admin exists in the KA DB.**

**Tenancy coupling (old):** controller strictly requires `(req as any).institutionDataSource`; on the branch `institutionResolver` defaults to the pinned static institution → always satisfied. No `DataSourceManager` usage inside the module.

**Env consumed by module:** none (`process.env` grep = 0 hits).

**Tables owned:** `super_admins` (one table; **0 FKs in either direction** — root table).

---

## 2. Tables affected

| Table | In prod MySQL | Rows (prod) | Rows (prod-cts) | In ka-institute | Rows (ka) | Verdict |
|---|---|---|---|---|---|---|
| `super_admins` | ✅ | **1** | 1 (**identical row** — same id/email/createdAt) | ✅ (entity + `InitKaSchema`) | **0 (empty)** | 🔁 schema converted + live-verified; needs **ETL (1 row, id-preserving)**. No dedupe complexity: clone row = exact copy. |

KA table is **empty** → no purge step.

---

## 3. Variables & env keys affected

| Kind | Old | New | Note |
|---|---|---|---|
| DB env | `SQL_*_DEFAULT` + `SQL_DB_DEF_NAME_KA` (per-tenant MySQL) | `PSQL_*` (`ka-institute`) | global spoke conversion; module takes a `DataSource` |
| Module env | **none** | none | nothing module-specific |
| JWT claims | `email`, `role`, `id` + `_id` (compat), `institutionId` (tenant routing) | same shape; `institutionId` = static institution id; **no `departmentId` claim** | login already converted; superAdmin deliberately outside the departmentId scheme |
| DI tokens | SuperAdminController/Router/Service/Provider | identical | none |

---

## 4. Production reality (read-only findings — `kasr-el-ainy`)

**`super_admins` — 9 columns** (note: NO `termsAcceptedAt`, unlike `institute_admins`' 10), `id char(36)` PK (utf8mb4), **0 FKs**. Indexes: PRIMARY(id), **UNIQUE(email)** (`UQ_9719b4…`) — **no phoneNum unique**.

| Col | MySQL type | Null | Default | Charset |
|---|---|---|---|---|
| id | char(36) | NO | PRI | utf8mb4 |
| email | varchar(255) | NO | UNIQUE | utf8mb4 |
| password | varchar(255) | NO | | utf8mb4 |
| fullName | varchar(255) | NO | | utf8mb4 |
| phoneNum | varchar(50) | NO | (not unique) | utf8mb4 |
| approved | tinyint(1) | NO | 1 | |
| role | enum(**4**: superAdmin, instituteAdmin, supervisor, candidate) | NO | superAdmin | latin1 |
| createdAt | datetime | NO | CURRENT_TIMESTAMP | |
| updatedAt | datetime | NO | CURRENT_TIMESTAMP on update | |

**Data (1 row, masked):** id `2c25ed6e-…3220`, email `me…gmail.com`, fullName `Ibr…`, phone 11 chars, approved 1, role superAdmin, created 2025-11-26 — **the platform owner's account**. Clean: no NULLs, no zero-dates, no mojibake, valid bcrypt-length password hash implied by app usage.

**prod-cts (`kasr-el-ainy-cts`):** 1 row — **byte-identical to prod** (same id `2c25ed6e-…`, same masked email, same createdAt). The clone simply carries a copy of the same owner account. → **Single-source ETL from prod; prod-cts contributes nothing** (unlike the cand/supervisor/instituteAdmin CTS test accounts, there is nothing distinct to exclude — it IS the same row).

---

## 5. New-system state (`ka-institute` live + entities)

**`super_admins` — 9 columns** (entity `superAdmin.mDbSchema.ts`), `id uuid` PK default `uuid_generate_v4()`. Live-verified (query.js ka): types exactly as the entity — `approved boolean` default true, `role super_admins_role_enum` default `'superAdmin'`, `createdAt/updatedAt timestamp` default `now()`. Indexes (live): **PK(id) + UNIQUE(email)** — **exact parity with prod** (TypeORM even reused the same constraint name `UQ_9719b4228e14e28a8253cb108f2`). Live rows: **0 (empty)**.

**PG enum (live):** `super_admins_role_enum` = `{superAdmin, instituteAdmin, supervisor, clerk, candidate}` = prod's 4 **+ `clerk`** → **superset, migration-safe**.

**Type conversions (live, correct):** `char(36)`→`uuid`; `datetime`→`timestamp`; `approved tinyint(1)`→`boolean` (default true); charset/collation dropped; role→PG enum.

Migrations: `InitKaSchema` creates `super_admins` (+ enum + email-unique) — line 27 of `1783782609882-InitKaSchema.ts`. `AddDepartmentScoping` deliberately does **not** touch `super_admins` (departmentId went only to candidates/supervisors/institute_admins/clerks). No seed.

**No new columns vs prod** — the only user table with zero schema drift beyond type conversion.

---

## 6. Gap analysis (old pattern → new pattern)

Component verdicts: **8 ✅ · 1 🔁 · 1 🗑️ · 0 ❓**.

**1. Schema translation** — ✅ done, live-verified. All conversions per the settled conventions; index parity exact (PK ✅, email-unique ✅, no phoneNum-unique on either side ✅). No widening, no new columns, no FK work (root table).

**2. Tenancy removal** — ✅ **already complete.** `superAdminLogin` pins `getStaticInstitution().id` and ignores inbound institutionId; `institutionResolver` (route chain) defaults to the static institution so the controller's strict `institutionDataSource` check always passes; zero `DataSourceManager` in the module.

**3. Department scoping** — ✅ **n/a by design.** superAdmin is the institution-global (platform) role: no `departmentId` column (AddDepartmentScoping deliberately skipped `super_admins`), no `departmentId` JWT claim. Nothing to do; the plan asserts this stays so.

**4. Reference boundary** — n/a. Owns no reference data, reads none.

**5. In-workspace services** — n/a. The module calls no mailer/waBot/aiAgent/externalService. passwordReset's mail flow explicitly excludes superAdmins.

**6. 🔁 ETL — `super_admins` not yet loaded** (KA table empty). **This is the only gap.** And it is load-bearing: with `POST /superAdmin` disabled, no super admin can be created through the API → until the row is loaded, `/auth/superAdmin/login` cannot succeed and **every `requireSuperAdmin` route in the spoke is unusable**. See §7.

**7. API contract compatibility** — ✅ **byte-identical.** Both routes, guards, response shapes unchanged main→branch. No frontend changes.

**8. State-of-the-art** — module is idiomatic (Inversify DI, provider pattern, repository-only data access, validators, per-user rate limiting, hardened surface). Recommendations (recommend, don't build): (a) 🗑️ the deprecated `/auth/admin/login` combined endpoint still exists — retire once the frontend confirms it only uses the role-specific logins; (b) the `http/` samples and validators for removed routes are dead weight — harmless, prune opportunistically; (c) if create stays disabled long-term, document the DB-direct provisioning path (ETL/manual insert) as the official one.

**Column-by-column mapping** (all live-verified, nothing pending):

| Prod (MySQL) | KA (PG, live) | Note |
|---|---|---|
| id char(36) PK | uuid PK default uuid_generate_v4() | ETL preserves the existing UUID string |
| email varchar(255) UNIQUE | varchar(255) UNIQUE | same constraint name even |
| password varchar(255) | varchar(255) | bcrypt hash copies verbatim (bcryptjs both sides) |
| fullName varchar(255) | varchar(255) | |
| phoneNum varchar(50) | varchar(50) | no unique on either side |
| approved tinyint(1) def 1 | boolean def true | 1→true |
| role enum(4) def superAdmin | enum(5, +clerk) def superAdmin | superset-safe |
| createdAt/updatedAt datetime | timestamp | verbatim copy |

---

## 7. Upgrade plan (proposed — requires approval)

**No code changes. No migrations. One single-row ETL.**

1. **ETL — `super_admins` (1 row, prod → ka-institute)**, mirroring `scripts/etl-institute-admins-prod-to-ka.cjs`:
   - **Source** (read-only): `SELECT id, email, password, fullName, phoneNum, approved, role, createdAt, updatedAt FROM super_admins` on prod `kasr-el-ainy` only. **prod-cts is not read** (verified identical copy of the same row — nothing distinct to merge).
   - **Transform**: id preserved (char36 → uuid); `approved` 1→true; datetimes → timestamps verbatim; `role` value exists in the PG enum; password hash copied verbatim (bcryptjs on both sides — login keeps working).
   - **Load**: single `INSERT … ON CONFLICT ("id") DO UPDATE` (idempotent); target table empty → no purge, no FK ordering (root table).
   - **Verification queries** (counts-only, no PII): ka count = 1; email matches prod (masked compare); `approved = true`; `role = 'superAdmin'`; then a **live login smoke test** of `/auth/superAdmin/login` + one `GET /superAdmin` on staging to prove the requireSuperAdmin chain end-to-end.
2. **No `departmentId` work** — assert `super_admins` stays outside the department-scoping scheme (no column, no claim). Nothing to change; recorded as the settled pattern.
3. **Rollback**: insert-only into an empty table → `TRUNCATE super_admins` on staging (production untouched throughout).

**Execution happens only after approval, against KA-PSQL staging** — not by this skill.

---

## 8. Risks & mitigations

- **Spoke has no usable super admin until the ETL runs** (create route disabled) — every `requireSuperAdmin` surface is dead until then. *Mitigation:* run the 1-row ETL before any staging acceptance testing of admin flows.
- **Password-hash portability** — hash must copy byte-verbatim or the owner is locked out (no forgot-password for superAdmins!). *Mitigation:* verbatim copy + post-ETL login smoke test on staging.
- **Drift between prod and prod-cts copies** at ETL time (currently identical) — *mitigation:* ETL re-verifies identity (or simply reads prod only, which is authoritative).

## 9. Open questions for the user

1. ~~Confirm the single prod super admin is loaded as-is~~ — **RESOLVED: approved + loaded 2026-07-13** (id + hash verbatim, verified).
2. ~~Retire the deprecated `/auth/admin/login`?~~ — **RESOLVED: nothing to retire** — the route is not mounted on either side; `adminLogin` is unrouted dead controller code (prune opportunistically).

## 10. Approval checklist
- [x] Scope confirmed
- [x] Table/column mapping approved (§6 — all live-verified, zero deltas)
- [x] ETL rules approved + **run** (1 row, id-preserving, prod-only source, idempotent upsert)
- [x] API contract changes: **none**
- [x] Approved to implement — **implemented + verified on `ka-institute` staging (2026-07-13)**
- [x] Commit + push (user go-ahead, 2026-07-13)
