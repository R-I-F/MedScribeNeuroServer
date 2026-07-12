# Module Upgrade Audit: instituteAdmin
**Date**: 2026-07-12 · **Status**: ✅ IMPLEMENTED (staging) — 2026-07-12
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY)
**New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## ✅ Implementation record (2026-07-12)
Applied to the `migration/mysql-to-postgres` branch + `ka-institute` staging DB. Production MySQL untouched (read-only). Smallest module — 1 fix + ETL, **no migration** (departmentId stays nullable; no phoneNum-unique; enum already superset).

| # | Item | Where | Status |
|---|---|---|---|
| A | Code fix `getInstituteAdminByEmail`: MySQL `SUBSTRING_INDEX` → PG `split_part` | `src/instituteAdmin/instituteAdmin.provider.ts:195-203` | ✅ done, tsc clean |
| B | ETL 3 prod admins → **NS** (prod-cts excluded; no purge; no dedupe) | `scripts/etl-institute-admins-prod-to-ka.cjs` | ✅ 3 loaded |

**ETL verification (counts-only, no PII):** total **3** ✅ · `departmentId=NS` **3** · `departmentId NULL` **0** · dup email **0** ✅ · emails matching prod **3/3** ✅. NS dept id = `65bda505-b6e4-4a48-9a1e-6cc0a80b49f6`.

**Decision applied (§9 Q3):** the 3 existing prod admins were loaded **NS-scoped** (user choice), not NULL. The column **remains nullable** so future institute-scoped special admins can be represented by `departmentId = NULL`. No NOT-NULL migration, no entity change, no create-time enforcement (departmentId stays optional at `POST /instituteAdmin`).

**Not done (out of scope):** per-department dashboard read-filtering for scoped admins (new functionality — later task); canonical-email redesign (Q4).

## 🔄 Progress Checkpoint (resumption state — keep first; delete when approved)
**Last updated**: 2026-07-13 · **Status**: ✅ IMPLEMENTED on staging + committed/pushed (2026-07-13)
- [x] Phase 1 — component inventory (old + new code surface)
- [x] Phase 2 — production DB reality (tables read: `institute_admins`, `prod-cts.institute_admins`)
- [x] Phase 3 — new KA-PSQL state (live `ka-institute` schema + counts)
- [x] Phase 4 — gap analysis
- [x] Phase 5 — plan finalized
- [x] IMPLEMENTED — 1 PG fix + ETL 3 admins → NS (see Implementation record)

### ▶ Next action
None — implementation complete on `migration/mysql-to-postgres` + `ka-institute` staging; committed & pushed 2026-07-13 (user go-ahead).

## Decisions locked (user, 2026-07-12)
1. **`departmentId` — NULLABLE, and meaningful.** Institute admins are **department-scoped by default** (they carry a real `departmentId`), but **special admins are institute-scoped** → represented by `departmentId = NULL`. Therefore **NO NOT-NULL constraint** (that would forbid the institute-scoped admins), and `POST /instituteAdmin` keeps `departmentId` **optional**. This is the deliberate opposite of the cand/supervisor NOT-NULL decision, and it's correct for this role.
2. **prod-cts admin — EXCLUDED** (test account; consistent with the cand/supervisor CTS rows).
3. **The 3 existing prod admins** — **RESOLVED: loaded NS-scoped** (`departmentId = NS`), user choice 2026-07-12. Column stays nullable for future institute-scoped admins.
4. **Plan-only** — no code until explicitly approved.

**Future work (out of migration scope):** department-scoped admins should see only *their* department's data in the `/instituteAdmin` dashboards, while institute-scoped (NULL) admins see everything. The current code shows all data to every admin — adding per-department read filtering is **new functionality for a later task**, not part of the spoke conversion.

---

## 0. TL;DR — smallest module yet, one real bug

Same shape as `cand`/`supervisor`: **only the entity changed main→branch** (`git diff --stat main`); the controller/service/provider/router/wiring are byte-identical. The 96 KB provider is an **admin dashboard/reporting aggregator** — but it is **all TypeORM QueryBuilder / repository (dialect-safe)**: no raw `.query()`, no `GROUP BY`, no `getRawMany`, no boolean/int SQL compares. The **only** hand-written SQL in the whole file is the canonical-email `SUBSTRING_INDEX` — the same latent PG bug as the other user tables. Prod data is tiny (3 admins) and clean.

**Key difference from cand/supervisor:** prod `institute_admins` has **NO `phoneNum` UNIQUE** (only email) → nothing to restore. And `departmentId` is deliberately **kept NULLABLE** (department-scoped by default; NULL = institute-scoped special admin) — the opposite of the cand/supervisor NOT-NULL decision.

**Verdict counts:** **7 ✅ · 2 🔁 · 0 ❓** (dept-scoping policy decided 2026-07-12; only the 3-admin NULL/NS labeling left to confirm).

---

## 1. Scope & component map

Module dir: `src/instituteAdmin/` — exists on **both** main and branch. `/instituteAdmin` is a management **and reporting** surface (admins CRUD + read-only dashboards over candidates/supervisors/submissions/calendar/hospitals). Institute admins are created via `POST /instituteAdmin` (superAdmin) and `/auth/register… ` is **not** used for them (no self-register route). Login: `/auth/instituteAdmin/login`.

| Component | Old (main) | New (branch) | Change |
|---|---|---|---|
| Entity | `instituteAdmin.mDbSchema.ts` → `@Entity("institute_admins")` | same | **only file changed**: MySQL→PG types + `departmentId` added |
| Router | `instituteAdmin.router.ts` @ `/instituteAdmin` (21 routes) | identical | none |
| Controller | `instituteAdmin.controller.ts` (~16 KB) | identical | none |
| Service | `instituteAdmin.service.ts` | identical | none |
| Provider | `instituteAdmin.provider.ts` (**~96 KB** dashboard/report aggregator) | identical | none (⚠ carries 1 MySQL-only SQL idiom) |
| Interface | `instituteAdmin.interface.ts` | identical | none |
| DI bindings | `container.config.ts` binds Controller/Router/Service/Provider (`:212-215`) | identical | none |
| Route mount | `routes.config.ts` → `app.use("/instituteAdmin", …)` (`:102`) | identical | none |

**Routes (21):** CRUD — `GET /`, `POST /` (superAdmin), `GET /:id`, `PUT /:id`, `DELETE /:id` (superAdmin). Reporting/dashboard (read-only, `requireInstituteAdmin`) — `/supervisors`, `/supervisors/:id/report`, `/supervisors/report`, `/supervisors/:id/submissions`, `/candidates`, `/candidates/summary`, `/candidates/dashboard`, `/candidates/:id/dashboard`, `/candidates/:id/report`, `/candidates/:id/submissions`, `/candidates/:id/submissions/:submissionId`, `/calendarProcedures`, `/calendarProcedures/analysis/hospital`, `/hospitals`, `/arabicProcedures`, `/submissions/:id/report`. Guards: **20 × `requireInstituteAdmin`, 3 × `requireSuperAdmin`**.

**Cross-module dependents** (who references `institute_admins`): `passwordReset` (`getInstituteAdminByEmail`), `auth` (`/auth/instituteAdmin/login`). The provider **reads across** many modules' services (event, sub, cand, supervisor, hospital, calSurg, arabProc, pdf, institution, clinicalSub, aiAgent) to build dashboards — all via DI, no raw cross-DB. No other table FK-references `institute_admins` (it is a root table with **0 outgoing FKs** and no inbound FKs).

**Related but OUT of scope:** `src/reports/` mounts at `/instituteAdmin/reports` — a **separate module**, audit it on its own.

**Tables owned:** `institute_admins` (one table).

---

## 2. Tables affected

| Table | In prod MySQL | Rows (prod) | Rows (prod-cts) | In ka-institute | Rows (ka) | Verdict |
|---|---|---|---|---|---|---|
| `institute_admins` | ✅ | 3 | 1 (**test acct — exclude**) | ✅ (entity + `InitKaSchema` + `AddDepartmentScoping`) | **0 (empty)** | 🔁 schema converted; needs **ETL (3 → NS)** + 1 code fix. **No phoneNum-unique work** (prod has none). |

KA table is **empty** → no purge step.

---

## 3. Variables & env keys affected

| Kind | Old | New | Note |
|---|---|---|---|
| DB env | `SQL_*_DEFAULT` + `SQL_DB_DEF_NAME_KA` (per-tenant MySQL) | `PSQL_*` (`ka-institute`) | global spoke conversion; module takes a `DataSource` |
| Module env | **none** (`grep process.env src/instituteAdmin/` = 0 hits) | none | nothing module-specific to carry |
| JWT claims | institution UUID (tenant routing) + role/id | role/id + **`departmentId`** claim; no institution UUID | admin code reads `res.locals.jwt` for role/id only |
| DI tokens | InstituteAdminController/Router/Service/Provider | identical | none |

---

## 4. Production reality (read-only findings — `kasr-el-ainy`)

**`institute_admins` — 10 columns**, `id char(36)` PK (utf8mb4), **no outgoing FKs** (root table). Indexes: PRIMARY(id), **UNIQUE(email)** — **no phoneNum unique** (differs from cand/supervisor).

| Col | MySQL type | Null | Default | Charset |
|---|---|---|---|---|
| id | char(36) | NO | PRI | utf8mb4 |
| email | varchar(255) | NO | UNIQUE | utf8mb4 |
| password | varchar(255) | NO | | utf8mb4 |
| fullName | varchar(255) | NO | | utf8mb4 |
| phoneNum | varchar(50) | NO | (not unique) | utf8mb4 |
| approved | tinyint(1) | NO | 1 | |
| role | enum(**4**: superAdmin, instituteAdmin, supervisor, candidate) | NO | instituteAdmin | latin1 |
| termsAcceptedAt | datetime | YES | | |
| createdAt | datetime | NO | CURRENT_TIMESTAMP | |
| updatedAt | datetime | NO | CURRENT_TIMESTAMP on update | |

**Distributions** (3 rows): role → **instituteAdmin ×3**; approved → **1 ×3**. **Data quality — clean:** nullTermsAcceptedAt 3 (all NULL — nullable, fine), non-ASCII fullName 0, emptyEmail 0, emptyPhone 0, dupEmail 0, dupPhone 0.

**prod-cts (`kasr-el-ainy-cts`)**: `institute_admins` = **1 row** — masked: fullName `Ins…`, email `…ei@gmail.com`, role instituteAdmin, approved 1 → **a test account** (same `…ei@gmail.com` pattern as the excluded cand & supervisor CTS rows). Recommend **exclude**.

---

## 5. New-system state (`ka-institute` live + entities)

**`institute_admins` — 11 columns** (entity `instituteAdmin.mDbSchema.ts`), `id uuid` PK default `uuid_generate_v4()`. Indexes (live): **PK(id), UNIQUE(email)** — matches prod (no phoneNum unique needed). FK: **`FK_institute_admins_department` (`departmentId` → `departments`)** (from `AddDepartmentScoping`). Live rows: **0 (empty)**.

New column vs prod: **`departmentId uuid` NULL** (FK → departments).

**PG enum (live):** `institute_admins_role_enum` = 5 values = prod's 4 **+ `clerk`** → **superset, migration-safe**.

**Type conversions (live, correct):** `char(36)`→`uuid`; `datetime`→`timestamp`; `approved tinyint(1)`→`boolean` (default true); charset/collation dropped; role→PG enum.

Migrations: `InitKaSchema` creates `institute_admins` (+ enum + email-unique); `AddDepartmentScoping` adds `departmentId` + FK. No seed (admins are tenant data).

---

## 6. Gap analysis (old pattern → new pattern)

Component verdicts: **7 ✅ · 2 🔁 · 0 ❓** (dept-scoping decided — §0).

**1. Schema translation** — ✅ done, verified live. `char(36)`→uuid, datetimes→timestamp, `approved`→boolean(default true), role enum superset(+clerk), charset dropped, `departmentId` added. Index parity: PK ✅, email-unique ✅, **no phoneNum-unique on either side ✅ (nothing to do)**.

**2. Tenancy removal** — ✅ **nothing to remove.** Zero `institutionId` / `DataSourceManager` / `getDataSource` in the module. Controller uses `(req).institutionDataSource || AppDataSource` (always static `AppDataSource` in the spoke).

**3. Department scoping** — ✅ **decided: `departmentId` stays NULLABLE with meaning.** Institute admins are department-scoped by default (real `departmentId`); special institute-wide admins are represented by `departmentId = NULL`. So — unlike cand/supervisor — **no NOT NULL** and **no required-at-create** enforcement; the column + FK are already live. *Future (out of scope):* per-department dashboard filtering so scoped admins see only their department.

**4. Reference boundary** — n/a. Owns no reference data. The dashboard reads that touch procedures/diagnoses go through the existing services/mirror; not this module's concern to re-own.

**5. In-workspace services** — ✅ the provider aggregates via other modules' services (event/sub/cand/supervisor/hospital/calSurg/arabProc/pdf/aiAgent/clinicalSub/institution) — all stay local. No module-specific env keys to carry.

**6. 🔁 PG-PORTABILITY BUG (the only one in 96 KB):**
   - **`getInstituteAdminByEmail` (`instituteAdmin.provider.ts:197`) uses `SUBSTRING_INDEX(...)`** — MySQL-only; **Postgres has no `SUBSTRING_INDEX`** → the query **throws** on PG. **Called by `passwordReset.provider.ts:62`** → the **institute-admin forgot-password flow is broken on the KA spoke.** Fix: `split_part(lower(trim(email)),'@',1)` / `split_part(...,'@',2)` — the exact fix already shipped for cand (`51a02d0`) and supervisor (`4998433`). **No phone/WA-bot method exists for admins** (so no `'g'`-flag fix, unlike cand/supervisor).

**7. 🔁 ETL — `institute_admins` not yet loaded** (KA table empty). See §7 step 2.

**8. API contract compatibility** — ✅ **byte-identical.** All 21 `/instituteAdmin` routes, guards, and response shapes unchanged main→branch. The dashboards are portable QueryBuilder — no shape changes. No frontend changes.

**9. State-of-the-art** — module is idiomatic (Inversify DI, provider pattern, TypeORM, validators, rate-limited router). The 96 KB provider is large but dialect-clean. Recommendations (recommend, don't build): (a) the 1 SQL fix above; (b) consider splitting the mega-provider into report-specific providers for maintainability (not a migration blocker); (c) shared canonical-email normalization decision (app-side vs in-SQL) with cand/supervisor.

---

## 7. Upgrade plan (✅ IMPLEMENTED 2026-07-12 — see Implementation record up top)

1. ✅ **Code fix (`instituteAdmin.provider.ts` `getInstituteAdminByEmail`)** — ported canonical-email SQL to PG (`split_part`). Restores institute-admin forgot-password.
2. ✅ **ETL — `institute_admins` (3 prod only; prod-cts EXCLUDED):** kept `id` (char36→uuid); `approved`→bool; datetimes→timestamp (all `termsAcceptedAt` NULL); role in PG superset; **`departmentId = NS`** for the 3 existing admins (user choice §9 Q3). No purge (KA empty), no dedupe, no FK-ordering. Verified 3 total / all NS / dupEmail 0 / 3-3 emails match.
3. ✅ **`departmentId` stays NULLABLE (decided)** — no NOT NULL migration, no entity flip; `POST /instituteAdmin` keeps `departmentId` **optional** (set for department-scoped, omit/NULL for institute-scoped). Nothing changed beyond the ETL.
4. **Rollback:** ETL is insert-only into an empty table → `TRUNCATE institute_admins CASCADE` on staging (production untouched throughout).

---

## 8. Risks & mitigations
- **Institute-admin forgot-password silently broken on PG** (the SQL idiom) — *mitigation:* fix #1 before go-live; smoke-test the reset flow for an admin.
- **Forcing `departmentId` NOT NULL on an institute-wide role** could be semantically wrong and would require every admin-create to pick a department — *mitigation:* decide §9 Q1 before implementing; default recommendation is **keep nullable** for admins.
- **prod-cts test row** contaminating the load — *mitigation:* exclude it (only read `prod`).

## 9. Open questions for the user
1. ~~`departmentId` policy~~ — **RESOLVED: stays NULLABLE.** Department-scoped by default; NULL = institute-scoped special admin (Decisions locked §0).
2. ~~prod-cts admin~~ — **RESOLVED: excluded, test account** (Decisions locked §0).
3. **The 3 existing prod admins — NULL or NS?** Recommend **`departmentId = NULL` (institute-scoped)** since they predate departmentalization and are the KA institute's own admins. Confirm, or stamp NS if they should be NS-department-scoped. *(only open item)*
4. **Canonical-email normalization** — keep the (fixed) in-SQL approach, or move app-side? *(implementation detail — decide at fix time; shared with cand/supervisor.)*

## 10. Approval checklist
- [x] Scope confirmed
- [x] Table/column mapping approved
- [x] `departmentId` policy decided — **NULLABLE** (department-scoped default; NULL = institute-scoped)
- [x] ETL rules approved + **run** (3 prod → **NS**; CTS excluded; no purge; no dedupe)
- [x] API contract changes: **none** (`departmentId` optional at create; dashboards unchanged)
- [x] Approved to implement — **implemented on `migration/mysql-to-postgres` + `ka-institute` staging** (2026-07-12)
- [x] Commit + push (user go-ahead, 2026-07-13)
