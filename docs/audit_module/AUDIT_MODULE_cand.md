# Module Upgrade Audit: cand
**Date**: 2026-07-12 · **Status**: ✅ IMPLEMENTED (staging) — 2026-07-12
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY)
**New side**: migration/mysql-to-postgres @ `92a4b49` + PG `ka-institute`

## ✅ Implementation record (2026-07-12)
All approved items applied to the `migration/mysql-to-postgres` branch + `ka-institute` staging DB. Production MySQL untouched (read-only).

| # | Item | Where | Status |
|---|---|---|---|
| A | Code fix `getCandByEmail`: MySQL `SUBSTRING_INDEX` → PG `split_part` | `src/cand/cand.service.ts:110-118` | ✅ done, tsc clean |
| B | Code fix `getCandByPhoneDigits`: added `'g'` flag to `REGEXP_REPLACE` | `src/cand/cand.service.ts:93-97` | ✅ done, tsc clean |
| C | Restore `phoneNum` UNIQUE — entity `unique:true` + migration | `cand.mDbSchema.ts:25`, `src/migrations-ka/1783782609940-AddCandidatesPhoneUnique.ts` | ✅ migrated; `UQ_candidates_phoneNum` live & UNIQUE |
| D | Purge 4 stray `@example.com` test rows | `ka-institute.candidates` | ✅ 4 purged (in ETL) |
| E | ETL 110 prod candidates → NS (`departmentId` stamped) | `scripts/etl-candidates-prod-to-ka.cjs` | ✅ 110 loaded |
| F | `departmentId` NOT NULL (parity with supervisors; user decision 2026-07-12) | `cand.mDbSchema.ts` (entity flip) + `src/migrations-ka/1783782609970-CandidateDepartmentNotNull.ts` | ✅ migrated; `is_nullable = NO` |
| G | Enforce departmentId at candidate **creation** (consequence of NOT NULL) | `auth.controller.ts` registerCand throws if none + `validators/createCand.validator.ts` (departmentId required, isUUID) | ✅ done, tsc clean |

**ETL verification (counts-only, no PII):** total **110** ✅ · `departmentId=NS` **110** · `departmentId NULL` **0** ✅ · dup phoneNum **0** ✅ · dup email **0** ✅ · emails matching prod **110/110** ✅. NS dept id = `65bda505-b6e4-4a48-9a1e-6cc0a80b49f6`. Unique index created *after* the dup-free load, so it took cleanly. `departmentId` NOT NULL added later the same day (parity with `supervisors`); 110/110 rows already NS so it took cleanly.

**⚠️ API behavior change (from the NOT NULL decision):** registering a candidate now **requires** a valid `departmentId` — `/auth/registerCand` validator rejects a missing/invalid one (400) and the controller throws if none resolves. **The frontend must send `departmentId` on candidate registration.** (The bulk `/createCandsFromExternal` path is already disabled — 410 — so no impact there.)

**Not done (out of scope / deferred):** the canonical-email normalization redesign (open Q4 — left as fixed in-SQL); the forgot-password/WA-bot first-match-wins cross-role quirk (faithful to prod — separate product task).

## 0. Decisions locked (user, 2026-07-12)
1. **`phoneNum` UNIQUE — KEEP.** Restore the unique constraint in the consolidated DB (matches prod; protects the WA-bot single-match `.getOne()` lookup).
2. **Department backfill — NS only.** Every migrated prod candidate gets `departmentId` = the NS department id.
3. **prod-cts candidate — EXCLUDED.** The single `kasr-el-ainy-cts` candidate is not real data → not migrated; no cross-DB dedupe needed.
4. **Plan-only for now** — no code / migration / ETL execution until explicitly approved.

---

## 1. Scope & component map

Module dir: `src/cand/` — exists on **both** main and branch. Registration lives in `src/auth/` (`/auth/registerCand`), NOT here; `/cand` is management/read/update only.

| Component | Old (main) | New (branch) | Change |
|---|---|---|---|
| Entity | `cand.mDbSchema.ts` → `@Entity("candidates")` | same | **only file changed**: MySQL→PG types + `departmentId` added |
| Router | `cand.router.ts` @ `/cand` | identical | none |
| Controller | `cand.controller.ts` | identical | none |
| Service | `cand.service.ts` | identical | none (⚠ carries 2 MySQL-only SQL idioms) |
| Provider | `cand.provider.ts` (external import) | identical | none |
| Interface | `cand.interface.ts` (Rank, RegDegree, ICand*) | identical | none |
| DI bindings | `container.config.ts` binds Controller/Service/Router/Provider | identical | none |
| Route mount | `routes.config.ts` → `app.use("/cand", …)` | identical | none |

**Routes** (all `extractJWT` → `institutionResolver` → rate-limit → role guard): `GET /` (all roles; censored for clerk/supervisor/candidate), `GET /:id` (same), `PUT /:id/approved` (superAdmin/instituteAdmin), `PUT /:id` (superAdmin/instituteAdmin/candidate-self), `PATCH /:id/resetPassword` (superAdmin), `DELETE /:id` (superAdmin), `POST /createCandsFromExternal` → **DISABLED (410 Gone)**.

**Cross-module dependents** (the reason `candidates` is central): `auth` (login `findUserByEmail`, registration, `resetAllCandidatePasswords`), `sub` (FK `candidate` RESTRICT, `getCandsByIds`), `clinicalSub` (FK RESTRICT), `event`/`eventAttendance` (FK CASCADE, `getCandsByIds`), `passwordReset` (`getCandByEmail`), `waBot` (`getCandByPhoneDigits`), `instituteAdmin` (4 repo reads), `reports`, `supervisor`, `utils/censored.mapper`, `validators/updateCand`. Registered as an entity in `database.config.ts` + `ka-migrations.config.ts`.

**In-workspace service deps** (stay local, per architecture): `UtilService`, `ExternalService` (used by the provider's Google-Sheet import).

**Tables owned:** `candidates` (one table).

---

## 2. Tables affected

| Table | In prod MySQL | Rows (prod) | Rows (prod-cts) | In ka-institute | Rows (ka) | Verdict |
|---|---|---|---|---|---|---|
| `candidates` | ✅ | 110 | 1 (**excluded — not real**) | ✅ (entity + `InitKaSchema` + `AddDepartmentScoping`) | 4 (stray test rows → purge) | 🔁 schema converted; needs **ETL (110 → NS)** + 2 code fixes + restore `phoneNum` UNIQUE |

---

## 3. Variables & env keys affected

| Kind | Old | New | Note |
|---|---|---|---|
| DB env | `SQL_*_DEFAULT` + `SQL_DB_DEF_NAME_KA` (per-tenant MySQL) | `PSQL_*` (`ka-institute`) | handled globally by the spoke conversion; module code takes a `DataSource`, not env |
| Module env | `GETTER_API_ENDPOINT` (external import), `BASE_CAND_PASSWORD` (reset) | same | **must exist in the KA deployment env**; neither is tenancy-related |
| JWT claims | institution UUID (tenant routing) + role/id | role/id + **`departmentId`** claim; no institution UUID for tenant routing | cand code reads no claim directly except via `res.locals.jwt.role` for censoring |
| DI tokens | CandController/Service/Router/Provider | identical | none |

---

## 4. Production reality (read-only findings — `kasr-el-ainy`)

**`candidates` — 16 columns**, `id char(36)` PK (utf8mb4), no outgoing FKs (root table). Indexes: PRIMARY(id), **UNIQUE(email)**, **UNIQUE(phoneNum)**.

| Col | MySQL type | Null | Default / Extra | Charset |
|---|---|---|---|---|
| id | char(36) | NO | PRI | utf8mb4 |
| timeStamp | datetime | YES | | |
| email | varchar(255) | NO | UNIQUE | utf8mb4 |
| password | varchar(255) | NO | | utf8mb4 |
| fullName | varchar(255) | NO | | utf8mb4 |
| regNum | varchar(50) | NO | | utf8mb4 |
| phoneNum | varchar(50) | NO | **UNIQUE** | utf8mb4 |
| nationality | varchar(100) | NO | | utf8mb4 |
| rank | enum(**8**: professor, assistant professor, lecturer, assistant lecturer, resident, guest, other, none) | NO | | latin1 |
| regDeg | enum(5: msc, doctor of medicine (md), egyptian fellowship, self registration, other) | YES | | latin1 |
| google_uid | varchar(255) | YES | | latin1 |
| approved | tinyint(1) | NO | 0 | |
| role | enum(**4**: superAdmin, instituteAdmin, supervisor, candidate) | NO | candidate | latin1 |
| termsAcceptedAt | datetime | YES | | |
| createdAt | datetime | NO | CURRENT_TIMESTAMP | |
| updatedAt | datetime | NO | CURRENT_TIMESTAMP on update | |

**Distributions** (110 rows): rank → resident 50, assistant lecturer 36, guest 14, other 8, professor 1, assistant professor 1 (6 of 8 enum values used; **`specialist` not in prod enum**). regDeg → msc 54, md 48, egyptian fellowship 3, other 3, self registration 2. role → **candidate ×110** (no admins/supervisors stored here).

**Data quality — clean**: nullRegDeg 0, nullGoogleUid 27, nullTimeStamp 27, nullTermsAcceptedAt 84, approved 108/110. **Non-ASCII in fullName = 0, in nationality = 0** (no Arabic/mojibake risk). 11 distinct nationalities. email + phoneNum unique (enforced). No zero-dates observed (nullable date cols are genuine NULLs).

**prod-cts (`kasr-el-ainy-cts`)**: `candidates` = **1 row** — the CTS-department clone.

---

## 5. New-system state (`ka-institute` live + entities)

**`candidates` — 17 columns** (entity `cand.mDbSchema.ts`), `id uuid` PK default `uuid_generate_v4()`. Indexes: PK(id), **UNIQUE(email)** — **no phoneNum unique**. FK: **`FK_candidates_department` (`departmentId` → `departments`)** (from `AddDepartmentScoping`). Live rows: **4 (stray test candidates from verification runs)**.

New column vs prod: **`departmentId uuid` NULL** (FK → departments).

**PG enums (verified live):**
- `candidates_rank_enum` = 9 values = prod's 8 **+ `specialist`** → **superset, all prod values present**.
- `candidates_regdeg_enum` = 5 values = **exact match** to prod.
- `candidates_role_enum` = 5 values = prod's 4 **+ `clerk`**, same camelCase spelling → **superset, migration-safe**.

Migrations: `InitKaSchema` creates `candidates` (+ enums); `AddDepartmentScoping` adds `departmentId` + FK. No seed (candidates are tenant data, not reference/mirror).

---

## 6. Gap analysis (old pattern → new pattern)

Component verdicts: **6 ✅ · 2 🔁 · 3 ❓** (below).

**1. Schema translation** — ✅ done, verified live. Column mapping:

| Column | MySQL | PG (live) | Note |
|---|---|---|---|
| id | char(36) utf8mb4 | uuid | values are already UUID strings → direct cast |
| timeStamp / termsAcceptedAt | datetime | timestamp | coerce any `0000-00-00`→NULL (none observed) |
| email/password/fullName/regNum/phoneNum/nationality | varchar(n) utf8mb4 | varchar(n) | charset/collation dropped ✅ |
| rank | enum(8) latin1 | `candidates_rank_enum`(9) | superset (+specialist) ✅ |
| regDeg | enum(5) latin1 | `candidates_regdeg_enum`(5) | exact ✅ |
| google_uid | varchar(255) latin1 | varchar | ✅ |
| approved | tinyint(1) | **boolean** | 0/1 → false/true ✅ |
| role | enum(4) latin1 | `candidates_role_enum`(5) | superset (+clerk) ✅ |
| createdAt/updatedAt | datetime CURRENT_TIMESTAMP | timestamp now() | ✅ |
| **departmentId** | — | uuid NULL, FK→departments | **new** |

Index parity: PK ✅, email-unique ✅, **phoneNum-unique DROPPED → RESTORE** (decided: keep unique — Section 0).

**2. Tenancy removal** — ✅ **nothing to remove.** `src/cand/` has zero `institutionId` / `DataSourceManager` / `getDataSource` references. Every method takes a `DataSource` param; controller uses `(req).institutionDataSource || AppDataSource`, which in the spoke is always the static `AppDataSource`. Free.

**3. Department scoping** — ✅ column + FK live; **backfill migrated rows → NS department id (decided — Section 0).** New registrations already set `departmentId` (the #2 activation work). `candidates` stays tenant-global otherwise (all reads are institution/dept-agnostic; department filtering is a frontend/read concern, not enforced on this table).

**4. Reference boundary** — n/a. `cand` owns no reference data and reads none from the mirror.

**5. In-workspace services** — ✅ `provider` calls `ExternalService` (Google-Sheet import) + `UtilService`; both stay local. Requires `GETTER_API_ENDPOINT` in the KA env.

**6. 🔁 PG-PORTABILITY BUGS in `cand.service.ts` (NOT caught by the Stage-B entity pass):**
   - **`getCandByEmail` (line ~112) uses `SUBSTRING_INDEX(...)`** — a MySQL-only function; **Postgres has no `SUBSTRING_INDEX`** → the query **throws** on PG. **Called by `passwordReset.provider.ts:50`**, i.e. the **forgot-password flow is broken on the KA spoke.** Fix: replace with `split_part(lower(trim(email)),'@',1)` / `split_part(...,'@',2)` (PG). *(Describe-only; implement in a separate task.)*
   - **`getCandByPhoneDigits` (line ~95) uses `REGEXP_REPLACE(phoneNum,'[^0-9]+','')` without the `g` flag** — PG's `regexp_replace` replaces only the **first** match without `'g'`, so multi-group phone strings keep later non-digits → wrong digit key. **Called by `waBot.provider.ts:532`** (WhatsApp candidate matching). Fix: add the `'g'` flag on PG.

**7. API contract compatibility** — ✅ **byte-identical.** All `/cand` routes, roles, censoring (`toCensoredCand`), and response shapes are unchanged main→branch. No frontend changes for `/cand`. (Related but out-of-scope: `/auth/registerCand` now accepts optional `departmentId`.)

**8. State-of-the-art** — module is already idiomatic for this repo (Inversify DI, provider pattern, TypeORM entity + git-tracked migrations, validators, rate-limited router). Minor recommendations: (a) fix the 2 raw-SQL portability issues above; (b) consider replacing the hand-rolled canonical-email SQL with a normalized `emailCanonical` generated column or app-side normalization (removes DB-dialect coupling entirely); (c) revisit `phoneNum` uniqueness (below).

---

## 7. Upgrade plan (✅ IMPLEMENTED 2026-07-12 — see Implementation record up top)

1. ✅ **Code fix A (`cand.service.ts` `getCandByEmail`)** — ported the canonical-email SQL to PG (`split_part`). Restores forgot-password on the spoke.
2. ✅ **Code fix B (`cand.service.ts` `getCandByPhoneDigits`)** — added `'g'` flag to `regexp_replace`. Restores WA-bot phone matching.
3. ✅ **`phoneNum` UNIQUE — restored.** Entity now `unique:true` + migration `1783782609940-AddCandidatesPhoneUnique` (`CREATE UNIQUE INDEX "UQ_candidates_phoneNum" ON candidates("phoneNum")`). Verified 0 dups on the 110-row load *before* creating the index; index confirmed live & UNIQUE.
4. ✅ **Purged the 4 stray test candidates** from `ka-institute` (done inside the ETL, `DELETE … WHERE email LIKE '%@example.com'`).
5. ✅ **ETL — `candidates` (110 prod only; prod-cts EXCLUDED):**
   - **Source (read-only):** `SELECT * FROM candidates` on `prod` **only** (the 1 `prod-cts` row is not real — skipped).
   - **Transform:** keep `id` (char36 → uuid, direct); `approved` 0/1 → bool; datetimes → timestamp (coerce any `0000-*`→NULL); enums pass through (all values in the PG supersets); **stamp `departmentId` = the NS department id for ALL rows** (decided).
   - **No dedupe** (single source).
   - **Load order:** `candidates` **before** `sub` / `clinicalSub` / `eventAttendance` (their FKs → candidates). Run against `ka-institute` staging first.
   - **Verify:** source count `110` = target count; `email` set matches; `SELECT rank, count(*)` matches prod distribution; every migrated row has `departmentId` = NS; spot-check 5 masked rows.
6. **Rollback:** ETL is insert-only into an empty table → rollback = `TRUNCATE candidates CASCADE` on staging (no production impact; production is untouched throughout).

---

## 8. Risks & mitigations
- **Forgot-password + WA-bot silently broken on PG** (the 2 SQL idioms) — *mitigation:* fixes #1–#2 before go-live; add a smoke test for both flows.
- **`phoneNum` UNIQUE restore fails on load** if prod has a dup phone — *mitigation:* run the dup-check on the 110 rows before creating the unique index (prod already enforces uniqueness, so none expected).
- **Stray test rows** contaminating the migration — *mitigation:* purge the 4 `ka-institute` test candidates before ETL (step 4).

## 9. Open questions for the user
1. ~~`phoneNum` unique~~ — **RESOLVED: keep unique** (Section 0).
2. ~~Migrated candidates' `departmentId`~~ — **RESOLVED: backfill all prod rows → NS** (Section 0).
3. ~~prod-cts candidate~~ — **RESOLVED: excluded, not real data** (Section 0).
4. **Canonical-email normalization** — keep the (fixed) in-SQL approach, or move normalization app-side / to a generated column? *(implementation detail — decide at fix time)*

## 10. Approval checklist
- [x] Scope confirmed
- [x] Table/column mapping approved
- [x] ETL rules approved (110 prod → NS; CTS excluded; no dedupe)
- [x] API contract changes (none for `/cand`) approved
- [x] The 2 PG-portability code fixes approved + **implemented** (2026-07-12)
- [x] Approved to implement — **implemented on `migration/mysql-to-postgres` + `ka-institute` staging** (2026-07-12)
- [ ] Commit + push (awaiting explicit user go-ahead)
