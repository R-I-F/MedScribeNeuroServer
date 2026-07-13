# Module Upgrade Audit: clerk
**Date**: 2026-07-13 · **Status**: ✅ IMPLEMENTED (staging) — 2026-07-13
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY)
**New side**: migration/mysql-to-postgres @ `71b51d2` + PG `ka-institute`

## ✅ Implementation record (2026-07-13)
Applied to `migration/mysql-to-postgres` + `ka-institute` staging. Prod MySQL read-only. Follows the **instituteAdmin model** (user decision 2026-07-13: *"clerks are department-scoped by default, but special clerks can be institute-scoped"* → `departmentId` NULLABLE, NULL = institute-scoped).

| # | Item | Where | Status |
|---|---|---|---|
| A | Code fix `getClerkByEmail`: MySQL `SUBSTRING_INDEX` → PG `split_part` | `src/clerk/clerk.provider.ts:62-69` | ✅ done, tsc clean |
| B | ETL 1 prod clerk → **NS** (prod-cts excluded; no purge) | `scripts/etl-clerks-prod-to-ka.cjs` | ✅ 1 loaded |
| C | `POST /clerk` can now set `departmentId` (optional, isUUID) | `src/validators/createClerk.validator.ts` | ✅ done, tsc clean |

**ETL verification (counts only, no PII):** total **1** · `departmentId=NS` **1** · dup email **0** · emails match prod **1/1**. NS dept id = `65bda505-…`.

**Decisions applied:** `departmentId` stays **NULLABLE** (no NOT NULL, no create-time requirement); the 1 existing prod clerk loaded **NS-scoped** (department-scoped default). Create validator now **whitelists `departmentId`** (optional) so admins can dept-assign or leave institute-scoped.
**⚠️ Note for review:** the one prod clerk is the *Masr El Dawly* data-entry account (hospital-affiliated, not obviously NS-specific). I stamped it **NS** per the "default = department-scoped" rule — if it should be **institute-scoped**, flip its `departmentId` to `NULL` (1-row change).
**Not done (deferred):** `updateClerk.validator` departmentId whitelist (optional follow-up); canonical-email redesign (shared Q).

## 🔄 Progress Checkpoint (resumption state — keep this section first; delete when approved)
**Last updated**: 2026-07-13
**Status**: draft complete — awaiting approval

- [x] Phase 1 — component inventory (old + new code surface)
- [x] Phase 2 — production DB reality (tables read: `clerks`, prod-cts `clerks`)
- [x] Phase 3 — new KA-PSQL state (live `ka-institute` schema + counts)
- [x] Phase 4 — gap analysis
- [x] Phase 5 — plan finalized

### ▶ Next action
User review + approval — two decisions in §9 (clerk's departmentId at ETL; add departmentId to create/update validators). Implementation happens in a separate session/task after approval.

---

## 0. TL;DR — one real bug (the missed 4th copy of the SUBSTRING_INDEX bug) + one policy gap

Same shape as the sibling user modules: **only the entity changed main→branch**; router/controller/service/provider/DI byte-identical. Two substantive findings:

1. **`getClerkByEmail` (`clerk.provider.ts:65`) still uses MySQL `SUBSTRING_INDEX`** — the exact canonical-email idiom already ported to `split_part` for cand (`51a02d0`), supervisor (`4998433`) and instituteAdmin (`f115d47`), but **clerk was missed**. It is called by `passwordReset.provider.ts:68` → **clerk forgot-password throws on the KA spoke** until fixed.
2. **`POST /clerk` cannot set `departmentId`** — the column + FK are live and clerk login already embeds the `departmentId` JWT claim when present (`auth.controller.ts:493`), but `createClerkValidator`/`updateClerkValidator` don't whitelist the field (checkSchema + `matchedData` silently drop it). Clerks can only become department-scoped by direct DB write.

Data is tiny and clean: **1 prod clerk** (the Masr-El-Dawly account, created 2026-01-18 via `scripts/create-clerk-masr-el-dawly.ts`); prod-cts holds a **byte-identical copy** (same id) → single-source ETL, no dedupe.

**Verdict counts: 6 ✅ · 2 🔁 · 0 🗑️ · 2 ❓** (§9).

---

## 1. Scope & component map

Module dir: `src/clerk/` — exists on **both** main and branch. `/clerk` is an admin-managed user-CRUD surface (clerks are data-entry accounts provisioned by admins — no self-registration; the one production clerk was created by a script and appears hospital-affiliated [Masr El Dawly], not department-affiliated). Login: `/auth/clerk/login` (no NODE_ENV gate — normal production route, unlike superAdmin's).

| Component | Old (main) | New (branch) | Change |
|---|---|---|---|
| Entity | `clerk.mDbSchema.ts` → `@Entity("clerks")` | same | **only file changed**: charset strip + `termsAcceptedAt` datetime→timestamp + **`departmentId uuid` NULL added** |
| Router | `clerk.router.ts` @ `/clerk` (5 routes) | identical | none |
| Controller | `clerk.controller.ts` (bcryptjs hashing; strict `req.institutionDataSource`) | identical | none |
| Service | `clerk.service.ts` (pass-through) | identical | none |
| Provider | `clerk.provider.ts` | identical | none — ⚠ carries the **`SUBSTRING_INDEX` MySQL idiom** (`:65`) |
| Interface | `clerk.interface.ts` | identical | none |
| DI bindings | `container.config.ts:244-247` | identical | none |
| Route mount | `routes.config.ts:107` → `app.use("/clerk", …)` | identical | none |

**Routes (5, all admin-guarded `authorize(SUPER_ADMIN, INSTITUTE_ADMIN)`):** `POST /` (create — **active**, unlike superAdmin), `GET /`, `GET /:id`, `PUT /:id`, `DELETE /:id`. All behind `extractJWT + institutionResolver + rate limiter`.

**Cross-module dependents:**
- `auth` — `/auth/clerk/login` (`auth.controller.clerkLogin:447`): repository findOne + bcrypt. **Already spoke-converted** (static institution id; inbound institutionId ignored) **and embeds `departmentId` claim** when the clerk has one (`:493`).
- `passwordReset` — clerk **IS included** in forgot-password (`findUserByEmail` → `getClerkByEmail` at `passwordReset.provider.ts:68` — the broken path), plus by-id lookup (`:113`) and password-update (`:329`), both repository-safe.
- `validators` — `clerkLogin`, `createClerk`, `getClerkById`, `updateClerk`, `deleteClerk`. **None accept `departmentId`.**
- Provisioning tooling — npm script `create-clerk-masr-el-dawly` (`scripts/`, gitignored) created the production clerk.
- waBot: **no clerk references** (checked).

**Tenancy coupling (old):** controller strictly requires `(req as any).institutionDataSource`; on the branch `institutionResolver` defaults to the pinned static institution. No `DataSourceManager` inside the module.

**Env consumed by module:** none (`process.env` grep = 0 hits).

**Tables owned:** `clerks` (one table; no outgoing FKs in prod; on ka one outgoing FK → `departments`).

---

## 2. Tables affected

| Table | In prod MySQL | Rows (prod) | Rows (prod-cts) | In ka-institute | Rows (ka) | Verdict |
|---|---|---|---|---|---|---|
| `clerks` | ✅ | **1** | 1 (**identical row** — same id/email/createdAt) | ✅ (entity + `InitKaSchema` + `AddDepartmentScoping`) | **0 (empty)** | 🔁 schema converted + live-verified; needs **ETL (1 row)** + the `split_part` code fix. departmentId value at ETL = ❓ §9 Q1. |

KA table is **empty** → no purge step.

---

## 3. Variables & env keys affected

| Kind | Old | New | Note |
|---|---|---|---|
| DB env | `SQL_*_DEFAULT` + `SQL_DB_DEF_NAME_KA` (per-tenant MySQL) | `PSQL_*` (`ka-institute`) | global spoke conversion; module takes a `DataSource` |
| Module env | **none** | none | nothing module-specific |
| JWT claims | `email`, `role`, `id` + `_id` (compat), `institutionId` (tenant routing) | same shape; `institutionId` = static id; **+ `departmentId` when set** (`auth.controller.ts:493`) | login already converted |
| DI tokens | ClerkController/Router/Service/Provider | identical | none |

---

## 4. Production reality (read-only findings — `kasr-el-ainy`)

**`clerks` — 10 columns**, `id char(36)` PK (utf8mb4), **no FKs**. Indexes: PRIMARY(id), **UNIQUE `IDX_clerk_email`(email)** — no phoneNum unique.

| Col | MySQL type | Null | Default | Charset |
|---|---|---|---|---|
| id | char(36) | NO | PRI | utf8mb4 |
| email | varchar(255) | NO | UNIQUE | utf8mb4 |
| password | varchar(255) | NO | | utf8mb4 |
| fullName | varchar(255) | NO | | utf8mb4 |
| phoneNum | varchar(50) | NO | (not unique) | utf8mb4 |
| approved | tinyint(1) | NO | **0** (differs from admins' 1) | |
| role | enum(**5**: superAdmin, instituteAdmin, supervisor, **clerk**, candidate) | NO | clerk | utf8mb4 |
| termsAcceptedAt | datetime | YES | | |
| createdAt | datetime | NO | CURRENT_TIMESTAMP | |
| updatedAt | datetime | NO | CURRENT_TIMESTAMP on update | |

Note: this table is **newer** than `super_admins`/`institute_admins` — its role enum already contains all 5 values (incl. clerk) and it's utf8mb4 throughout.

**Data (1 row, masked):** id `45eb7fb8-…e472`, email `be…gmail.com`, fullName `Moh…`, phone 11 chars, **approved 1**, role clerk, termsAcceptedAt NULL, created **2026-01-18** — matches the `create-clerk-masr-el-dawly` provisioning script (a hospital-affiliated data-entry account). Clean: no NULLs beyond terms, no zero-dates, no mojibake, no dups.

**prod-cts (`kasr-el-ainy-cts`):** 1 row — **byte-identical to prod** (same id, same masked email, same createdAt). → **Single-source ETL from prod; prod-cts contributes nothing.**

---

## 5. New-system state (`ka-institute` live + entities)

**`clerks` — 11 columns** (entity `clerk.mDbSchema.ts`), `id uuid` PK default `uuid_generate_v4()`. Live-verified: `approved boolean` default **false** (parity with prod's 0), `role clerks_role_enum` default `'clerk'`, `termsAcceptedAt timestamp` NULL, **`departmentId uuid` NULL + `FK_clerks_department` → departments** (from `AddDepartmentScoping`). Indexes: **PK(id) + UNIQUE(email)** — parity with prod. Live rows: **0 (empty)**.

**PG enum (live):** `clerks_role_enum` = `{superAdmin, instituteAdmin, supervisor, clerk, candidate}` — **exactly equal to prod's 5** (first module with zero enum delta).

Migrations: `InitKaSchema` creates `clerks` (+ enum + email-unique); `AddDepartmentScoping` adds `departmentId` + FK. No seed.

---

## 6. Gap analysis (old pattern → new pattern)

Component verdicts: **6 ✅ · 2 🔁 · 0 🗑️ · 2 ❓**.

**1. Schema translation** — ✅ done, live-verified, exact. `char(36)`→uuid, `tinyint(1) def 0`→boolean def false, datetimes→timestamp, enum 1:1, charset dropped, `departmentId` + FK added. Index parity: PK ✅, email-unique ✅. No widening needed.

**2. Tenancy removal** — ✅ complete. `clerkLogin` pins the static institution and ignores inbound institutionId; `institutionResolver` defaults static; zero `DataSourceManager` in the module.

**3. Department scoping** — 🔁 **half-done**:
   - ✅ Column + FK live; **login already emits the `departmentId` claim** when the clerk has one — referenceRead dept resolution then works automatically for clerks.
   - 🔁 **No API path sets the value**: `createClerkValidator` and `updateClerkValidator` don't whitelist `departmentId`, and `matchedData()` silently drops unvalidated fields. Recommend mirroring the cand/supervisor pattern (optional UUID, validated against the mirror `departments` table, unknown id rejected) on **create** (and optionally update — ❓ §9 Q2).
   - ❓ What departmentId should the **existing** prod clerk get at ETL time? The account is *hospital*-affiliated (Masr El Dawly), not department-affiliated — **recommend `NULL`** (institute-scoped; NS default still applies for reference reads via `REF_DEPT_CODE`) unless the user wants NS stamped like the institute admins (§9 Q1).

**4. Reference boundary** — n/a. Owns no reference data. (Clerk JWTs benefit from mirror-backed reads via the claim — no module change.)

**5. In-workspace services** — n/a directly; passwordReset's clerk mail flow uses the local mailer (stays here). No module env keys.

**6. 🔁 PG-PORTABILITY BUG — the missed 4th copy:** `getClerkByEmail` (`clerk.provider.ts:65`) uses `SUBSTRING_INDEX(...)`; Postgres throws. Called by `passwordReset.provider.ts:68` → **clerk forgot-password broken on the KA spoke.** Fix: port to `split_part(...,'@',1)/(...,'@',2)` — byte-same pattern as cand `51a02d0` / supervisor `4998433` / instituteAdmin `f115d47`. (No phone/WA-bot lookup method exists for clerks — nothing else to port.)

**7. 🔁 ETL — `clerks` not yet loaded** (KA empty). See §7 step 2.

**8. API contract compatibility** — ✅ byte-identical today (5 routes unchanged main→branch). Adding optional `departmentId` to create/update is **additive, non-breaking** (absent field behaves exactly as now).

**9. State-of-the-art** — module is idiomatic. Recommendations (recommend, don't build): (a) the `canonicalEmail` + SQL idiom is now copy-pasted across **4 providers** (cand/supervisor/instituteAdmin/clerk) — extract a shared helper (e.g. `utils`) when convenient, single source for the split_part expression; (b) consider whether clerks should eventually carry a **hospital** affiliation column (the real-world scoping suggested by the Masr-El-Dawly account) — out of migration scope, noted only.

**Column-by-column mapping** (all live-verified):

| Prod (MySQL) | KA (PG, live) | Note |
|---|---|---|
| id char(36) PK | uuid PK default uuid_generate_v4() | ETL preserves the UUID |
| email varchar(255) UNIQUE | varchar(255) UNIQUE | |
| password varchar(255) | varchar(255) | bcrypt hash verbatim |
| fullName varchar(255) | varchar(255) | |
| phoneNum varchar(50) | varchar(50) | no unique either side |
| approved tinyint(1) def 0 | boolean def false | 1→true for the existing row |
| role enum(5) def clerk | enum(5) def clerk | **exact 1:1** |
| termsAcceptedAt datetime NULL | timestamp NULL | prod value is NULL |
| createdAt/updatedAt datetime | timestamp | verbatim copy |
| — | **departmentId uuid NULL, FK→departments** | new; value at ETL = §9 Q1 |

---

## 7. Upgrade plan (proposed — requires approval)

1. **Code fix (`clerk.provider.ts` `getClerkByEmail`)** — port the canonical-email SQL to PG `split_part`, byte-same pattern as the three sibling fixes. Restores clerk forgot-password. (tsc + reuse the sibling verification approach.)
2. **ETL — `clerks` (1 prod row only; prod-cts NOT read — identical copy):** keep `id`; `approved` 1→true; datetimes→timestamp; `termsAcceptedAt` NULL; role `clerk` (exists in PG enum); password hash byte-verbatim; **`departmentId` per §9 Q1 decision (recommend NULL)**. Idempotent `INSERT … ON CONFLICT ("id") DO UPDATE` into the empty table (no purge, no FK-order issues — departments already mirrored if NS is chosen). **Verification:** ka count=1; id/email/hash verbatim (no-PII boolean checks); approved=true; role=clerk; then a staging **login smoke test** of `/auth/clerk/login` (wrong-password → "Invalid credentials" proves row+bcrypt; clerk login has **no NODE_ENV gate**, so no env override needed) and, if Q1=NS, confirm the JWT carries the claim.
3. **(If §9 Q2 approved) `departmentId` at the API layer** — add optional `departmentId` to `createClerkValidator` (and `updateClerkValidator` if desired): UUID format + existence check against the mirror `departments` table (mirror the registerCand/registerSupervisor implementation). Additive, non-breaking.
4. **Rollback:** ETL is insert-only into an empty table → `TRUNCATE clerks` on staging (production untouched throughout).

**Execution happens only after approval, against KA-PSQL staging** — not by this skill.

---

## 8. Risks & mitigations

- **Clerk forgot-password silently broken on PG** (the SQL idiom) — *mitigation:* fix #1 before go-live; passwordReset calls it on every clerk email lookup.
- **Hash portability** (clerk IS in forgot-password, so lockout is recoverable — but still copy verbatim) — *mitigation:* verbatim copy + boolean hash-equality check + login smoke test.
- **departmentId semantics for clerks** — the production clerk is hospital-affiliated, not department-affiliated; stamping a department it doesn't have would mis-scope its reference reads — *mitigation:* decide §9 Q1 explicitly; NULL keeps today's behavior (NS default via `REF_DEPT_CODE`).

## 9. Open questions for the user

1. **Existing prod clerk's `departmentId` at ETL — NULL or NS?** Recommend **NULL** (the account is Masr-El-Dawly-hospital-affiliated; NULL keeps reference reads on the NS default exactly as production behaves today). Say NS if you want it stamped like the 3 institute admins.
2. **Add optional `departmentId` to `POST /clerk` (and `PUT /clerk/:id`?)** so admins can department-assign clerks via the API (login + claim already support it)? Recommend **yes on create**; update is optional.

## 10. Approval checklist
- [ ] Scope confirmed
- [ ] Table/column mapping approved (§6 — live-verified, zero deltas)
- [ ] ETL rules approved (1 row, id-preserving, prod-only source; departmentId per Q1)
- [ ] API contract changes: none today; Q2 would be additive only
- [ ] Approved to implement (separate session/task — NOT this skill)
