# Module Upgrade Audit: supervisor
**Date**: 2026-07-12 · **Status**: ✅ IMPLEMENTED (staging) — 2026-07-12
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY)
**New side**: migration/mysql-to-postgres @ `51a02d0` + PG `ka-institute`

## ✅ Implementation record (2026-07-12)
All approved items applied to the `migration/mysql-to-postgres` branch + `ka-institute` staging DB. Production MySQL untouched (read-only).

| # | Item | Where | Status |
|---|---|---|---|
| A | Code fix `getSupervisorByEmail`: MySQL `SUBSTRING_INDEX` → PG `split_part` | `src/supervisor/supervisor.provider.ts:113-121` | ✅ done, tsc clean |
| B | Code fix `getSupervisorByPhoneDigits`: added `'g'` flag to `REGEXP_REPLACE` | `src/supervisor/supervisor.provider.ts:97-101` | ✅ done, tsc clean |
| C | Restore `phoneNum` UNIQUE — entity `unique:true` + migration | `supervisor.mDbSchema.ts:19`, `src/migrations-ka/1783782609950-AddSupervisorsPhoneUnique.ts` | ✅ migrated; `UQ_supervisors_phoneNum` live & UNIQUE |
| D | ETL 56 prod supervisors → NS (`departmentId` stamped; prod-cts excluded; no purge) | `scripts/etl-supervisors-prod-to-ka.cjs` | ✅ 56 loaded |
| E | `departmentId` NOT NULL — entity flip + migration | `supervisor.mDbSchema.ts:51-52`, `src/migrations-ka/1783782609960-SupervisorDepartmentNotNull.ts` | ✅ migrated; `is_nullable = NO` |
| F | Enforce departmentId at supervisor **creation** (consequence of NOT NULL) | `auth.controller.ts:116-120` (register throws if none) + `validators/createSupervisor.validator.ts` (departmentId required, isUUID) | ✅ done, tsc clean |

**ETL verification (counts-only, no PII):** total **56** ✅ · `departmentId=NS` **56** · `departmentId NULL` **0** ✅ · dup phoneNum **0** ✅ · dup email **0** ✅ · emails matching prod **56/56** ✅. NS dept id = `65bda505-b6e4-4a48-9a1e-6cc0a80b49f6`. Both migrations ran **after** the dup-free / fully-stamped load, so unique-index + NOT-NULL took cleanly.

**⚠️ API behavior change (from the NOT NULL decision):** creating a supervisor now **requires** a valid `departmentId` —
`POST /supervisor` validator rejects a missing/invalid one (400), and `/auth/registerSupervisor` throws if none resolves. **The frontend must send `departmentId` when registering/creating supervisors.** (Alternative not taken: silently defaulting new supervisors to NS — left out so multi-department assignment stays explicit. Say the word to switch to default-NS.)

**Not done (out of scope / deferred):** the forgot-password/WA-bot first-match-wins cross-role quirk (faithful to prod — separate product task); canonical-email redesign (open Q4); the same NOT-NULL treatment for `candidates` (open Q5 — not requested yet); no commit/push (awaiting user).

## 🔄 Progress Checkpoint (resumption state — keep first; delete when approved)
**Last updated**: 2026-07-12 · **Status**: ✅ IMPLEMENTED on staging — awaiting commit/push
- [x] Phase 1 — component inventory (old + new code surface)
- [x] Phase 2 — production DB reality (tables read: `candidates`→`supervisors`, `prod-cts.supervisors`)
- [x] Phase 3 — new KA-PSQL state (live `ka-institute` schema + counts)
- [x] Phase 4 — gap analysis
- [x] Phase 5 — plan finalized
- [x] IMPLEMENTED — 2 fixes + phoneNum UNIQUE + ETL 56→NS + departmentId NOT NULL + create-time enforcement (see Implementation record)

### ▶ Next action
Implementation complete on `migration/mysql-to-postgres` + `ka-institute` staging. Awaiting user go-ahead to commit/push.

## Decisions locked (user, 2026-07-12)
1. **prod-cts supervisor — EXCLUDED.** The single `kasr-el-ainy-cts` supervisor (`Tes…@…gmail.com`) is a test account → not migrated. No cross-DB dedupe needed.
2. **Department backfill — NS only.** All 56 migrated prod supervisors get `departmentId` = the NS department id.
3. **`departmentId` NOT NULL after backfill.** Once every migrated row is stamped NS, add a follow-up migration making `supervisors.departmentId` NOT NULL — the DB then rejects any supervisor without a department. (Ordering matters: NOT NULL runs only after the ETL, else it fails on empty/null rows.)
4. **Plan-only for now** — no code / migration / ETL execution until explicitly approved.

---

## 0. TL;DR — near-identical to `cand`

The `supervisor` module came through the spoke conversion the same way `cand` did: **the only file changed main→branch is the entity** (`git diff --stat main`). Controller / service / provider / router / DI wiring are byte-identical. That means it inherits the **same two latent Postgres bugs** `cand` had, plus the **same dropped `phoneNum` UNIQUE**, and needs the **same style of ETL** (56 prod rows → NS). Prod data is clean.

**Verdict counts:** **7 ✅ · 3 🔁 · 0 ❓** (all decisions locked 2026-07-12: CTS excluded, backfill NS, `departmentId` NOT NULL after backfill). Only the shared canonical-email design note remains as an implementation detail.

---

## 1. Scope & component map

Module dir: `src/supervisor/` — exists on **both** main and branch. Registration path: supervisors are created via `POST /supervisor` (superAdmin only) — no self-registration router like auth. `/supervisor` is management/read/update.

| Component | Old (main) | New (branch) | Change |
|---|---|---|---|
| Entity | `supervisor.mDbSchema.ts` → `@Entity("supervisors")` | same | **only file changed**: MySQL→PG types + `departmentId` added |
| Router | `supervisor.router.ts` @ `/supervisor` | identical | none |
| Controller | `supervisor.controller.ts` | identical | none |
| Service | `supervisor.service.ts` (delegates to provider) | identical | none |
| Provider | `supervisor.provider.ts` | identical | none (⚠ carries 2 MySQL-only SQL idioms) |
| Interface | `supervisor.interface.ts` (ISupervisor, censored doc) | identical | none |
| DI bindings | `container.config.ts` binds Controller/Router/Service/Provider (`:185-188`) | identical | none |
| Route mount | `routes.config.ts` → `app.use("/supervisor", …)` (`:97`) | identical | none |
| Censor mapper | `utils/censored.mapper.ts` → `toCensoredSupervisor` | identical | none |

**Routes** (all `extractJWT` → `institutionResolver` → rate-limit → role guard): `POST /` (superAdmin), `GET /` (all roles; censored for clerk/supervisor/candidate), `GET /candidates` (supervisor+; supervised-candidates stats), `GET /:id` (all roles; censored), `PUT /:id/approved` (superAdmin/instituteAdmin), `PUT /:id` (superAdmin/instituteAdmin/supervisor-self — self can only change `phoneNum`+`position`), `DELETE /:id` (superAdmin), `POST /resetPasswords` (superAdmin).

**Cross-module dependents** (why `supervisors` is central — root table, referenced by FKs): `sub` (FK `supervisorDocId` RESTRICT + `getSupervisorsByIds`), `clinicalSub` (FK `supervisorDocId` RESTRICT), `conf` (FK `presenterId` RESTRICT), `passwordReset` (`getSupervisorByEmail`), `waBot` (`getSupervisorByPhoneDigits`), `aiAgent`, `instituteAdmin`, `auth` (login). Registered as an entity in `database.config.ts` + `ka-migrations.config.ts`.

**In-workspace service deps:** provider injects `SubService` (for `getSupervisedCandidates` — reads submissions to build per-candidate stats). Stays local.

**Tables owned:** `supervisors` (one table).

---

## 2. Tables affected

| Table | In prod MySQL | Rows (prod) | Rows (prod-cts) | In ka-institute | Rows (ka) | Verdict |
|---|---|---|---|---|---|---|
| `supervisors` | ✅ | 56 | 1 (**test acct — exclude**) | ✅ (entity + `InitKaSchema` + `AddDepartmentScoping`) | **0 (empty)** | 🔁 schema converted; needs **ETL (56 → NS)** + 2 code fixes + restore `phoneNum` UNIQUE |

Unlike `cand` (which had 4 stray test rows), the KA `supervisors` table is **empty** → no purge step needed.

---

## 3. Variables & env keys affected

| Kind | Old | New | Note |
|---|---|---|---|
| DB env | `SQL_*_DEFAULT` + `SQL_DB_DEF_NAME_KA` (per-tenant MySQL) | `PSQL_*` (`ka-institute`) | handled globally by the spoke conversion; module code takes a `DataSource`, not env |
| Module env | `BASE_SUPER_PASSWORD` (used by `POST /resetPasswords`) | same | **must exist in the KA deployment env**; not tenancy-related |
| JWT claims | institution UUID (tenant routing) + role/id | role/id + **`departmentId`** claim; no institution UUID for tenant routing | supervisor code reads only `res.locals.jwt.role`/`.id` (censoring + self-update guard) |
| DI tokens | SupervisorController/Router/Service/Provider | identical | none |

---

## 4. Production reality (read-only findings — `kasr-el-ainy`)

**`supervisors` — 13 columns**, `id char(36)` PK (utf8mb4), **no outgoing FKs** (root table). Indexes: PRIMARY(id), **UNIQUE(email)**, **UNIQUE(phoneNum)**.

| Col | MySQL type | Null | Default / Extra | Charset |
|---|---|---|---|---|
| id | char(36) | NO | PRI | utf8mb4 |
| email | varchar(255) | NO | UNIQUE | utf8mb4 |
| password | varchar(255) | NO | | utf8mb4 |
| fullName | varchar(255) | NO | | utf8mb4 |
| phoneNum | varchar(50) | NO | **UNIQUE** | utf8mb4 |
| approved | tinyint(1) | NO | 0 | |
| role | enum(**4**: superAdmin, instituteAdmin, supervisor, candidate) | NO | supervisor | latin1 |
| canValidate | tinyint(1) | YES | 1 | |
| position | enum(**6**: Professor, Assistant Professor, Lecturer, Assistant Lecturer, Guest Doctor, unknown) | YES | unknown | latin1 |
| termsAcceptedAt | datetime | YES | | |
| createdAt | datetime | NO | CURRENT_TIMESTAMP | |
| updatedAt | datetime | NO | CURRENT_TIMESTAMP on update | |
| canValClin | tinyint(1) | NO | 0 | |

**Distributions** (56 rows): position → Lecturer 29, Assistant Professor 17, Professor 10 (**only 3 of 6 enum values used**; no unknown / Guest Doctor / Assistant Lecturer). role → **supervisor ×56** (no other roles stored here). Flags → **approved = 1 for all 56**; canValidate true 13 / false 43; canValClin true 3 / false 53.

**Data quality — clean**: nullCanValidate 0, nullPosition 0, nullTermsAcceptedAt **56 (all NULL — nobody accepted ToS; column nullable, fine)**, emptyEmail 0, emptyPhone 0. **Non-ASCII in fullName = 0** (no Arabic/mojibake risk). email + phoneNum unique (enforced). dupPhone 0, dupEmail 0.

**prod-cts (`kasr-el-ainy-cts`)**: `supervisors` = **1 row** — masked sample: fullName `Tes…`, email `…ei@gmail.com`, role supervisor, position Assistant Professor, approved 1 → **a test account** (same shape as the excluded `cand` CTS row). Recommend **exclude**.

---

## 5. New-system state (`ka-institute` live + entities)

**`supervisors` — 14 columns** (entity `supervisor.mDbSchema.ts`), `id uuid` PK default `uuid_generate_v4()`. Indexes (live): **PK(id), UNIQUE(email)** — **no phoneNum unique**. FK: **`FK_supervisors_department` (`departmentId` → `departments`)** (from `AddDepartmentScoping`). Live rows: **0 (empty)**.

New column vs prod: **`departmentId uuid` NULL** (FK → departments).

**PG enums (verified live in `InitKaSchema`):**
- `supervisors_position_enum` = **7** values = prod's 6 **+ `Consultant`** → **superset, all 3 used prod values present** → migration-safe.
- `supervisors_role_enum` = 5 values = prod's 4 **+ `clerk`**, same camelCase → **superset, migration-safe**.

**Type conversions (live, correct):** `char(36)`→`uuid`; `datetime`→`timestamp`; `tinyint(1)` (approved/canValidate/canValClin)→`boolean`; charset/collation dropped; enums→PG enums.

**Referencing FKs into `supervisors`** (load-order parents): `submissions.supervisorDocId` (RESTRICT), `confs.presenterId` (RESTRICT), `clinical_sub.supervisorDocId` (RESTRICT).

Migrations: `InitKaSchema` creates `supervisors` (+ enums + email-unique); `AddDepartmentScoping` adds `departmentId` + FK. No seed (supervisors are tenant data, not reference/mirror).

---

## 6. Gap analysis (old pattern → new pattern)

Component verdicts: **7 ✅ · 3 🔁 · 0 ❓** (decisions locked — §0).

**1. Schema translation** — ✅ done, verified live. Column mapping:

| Column | MySQL | PG (live) | Note |
|---|---|---|---|
| id | char(36) utf8mb4 | uuid | values already UUID strings → direct cast |
| email/password/fullName/phoneNum | varchar(n) utf8mb4 | varchar(n) | charset/collation dropped ✅ |
| approved / canValidate / canValClin | tinyint(1) | **boolean** | 0/1 → false/true ✅ |
| role | enum(4) latin1 | `supervisors_role_enum`(5) | superset (+clerk) ✅ |
| position | enum(6) latin1 | `supervisors_position_enum`(7) | superset (+Consultant) ✅ |
| termsAcceptedAt | datetime | timestamp | all NULL in prod ✅ |
| createdAt/updatedAt | datetime CURRENT_TIMESTAMP | timestamp now() | ✅ |
| **departmentId** | — | uuid NULL, FK→departments | **new** |

Index parity: PK ✅, email-unique ✅, **phoneNum-unique DROPPED → RESTORE** (§7 step 3).

**2. Tenancy removal** — ✅ **nothing to remove.** `src/supervisor/` has zero `institutionId` / `DataSourceManager` / `getDataSource` references. Every method takes a `DataSource`; controller uses `(req).institutionDataSource || AppDataSource`, which in the spoke is always the static `AppDataSource`. Free.

**3. Department scoping** — ✅ column + FK live; **backfill migrated rows → NS department id** (§7). New supervisor creation should set `departmentId` (via `POST /supervisor` / admin flow — same activation work as the other user tables). `supervisors` otherwise stays tenant-global (reads are dept-agnostic).

**4. Reference boundary** — n/a. `supervisor` owns no reference data and reads none from the mirror. (`position` is a local enum, not hub reference data.)

**5. In-workspace services** — ✅ provider injects `SubService` for `getSupervisedCandidates`; stays local. Requires `BASE_SUPER_PASSWORD` in the KA env (for `POST /resetPasswords`).

**6. 🔁 PG-PORTABILITY BUGS in `supervisor.provider.ts` (inherited from main; NOT caught by the entity pass) — identical to the two `cand` bugs:**
   - **`getSupervisorByEmail` (`supervisor.provider.ts:116`) uses `SUBSTRING_INDEX(...)`** — a MySQL-only function; **Postgres has no `SUBSTRING_INDEX`** → the query **throws** on PG. **Called by `passwordReset.provider.ts:56`**, i.e. the **forgot-password flow is broken on the KA spoke for supervisors.** Fix: `split_part(lower(trim(email)),'@',1)` / `split_part(...,'@',2)` (mirror the `cand.service.ts` fix already shipped in `51a02d0`).
   - **`getSupervisorByPhoneDigits` (`supervisor.provider.ts:99`) uses `REGEXP_REPLACE(phoneNum,'[^0-9]+','')` without the `g` flag** — PG's `regexp_replace` replaces only the **first** match without `'g'`, so multi-group phone strings keep later non-digits → wrong digit key. **Called by `waBot.provider.ts:550`** (WhatsApp supervisor matching). Fix: add the `'g'` flag.

**7. 🔁 `phoneNum` UNIQUE dropped** — prod enforces unique `email` AND `phoneNum`; KA `InitKaSchema` carried only email-unique. Restore via entity `unique:true` + a `migrations-ka` migration (§7 step 3). 56 prod rows are dup-free, so it will take cleanly. (Same fix already shipped for `cand` in `51a02d0`.)

**8. 🔁 ETL — `supervisors` not yet loaded** (KA table empty). See §7 step 4.

**9. API contract compatibility** — ✅ **byte-identical.** All `/supervisor` routes, roles, censoring (`toCensoredSupervisor`), self-update restriction (phoneNum+position), and response shapes are unchanged main→branch. No frontend changes.

**10. State-of-the-art** — module is idiomatic (Inversify DI, provider pattern, TypeORM entity + git-tracked migrations, validators, rate-limited router). Minor recommendations (recommend, don't build): (a) the two SQL portability fixes above; (b) `getSupervisedCandidates` (`supervisor.provider.ts:160-213`) still carries **leftover Mongo idioms** — `sub.candDocId as any`, `candidate._id?.toString()`, `submissionType` cast — which work because `SubService` populates the relation, but are stringly-typed; consider typing against the TypeORM `submissions` shape; (c) consider moving canonical-email normalization app-side to drop DB-dialect coupling entirely (shared with the `cand` open question).

---

## 7. Upgrade plan (✅ IMPLEMENTED 2026-07-12 — see Implementation record up top)

Mirrors the `cand` implementation shipped in `51a02d0`.

1. ✅ **Code fix A (`supervisor.provider.ts` `getSupervisorByEmail`)** — ported canonical-email SQL to PG (`split_part`). Restores supervisor forgot-password on the spoke.
2. ✅ **Code fix B (`supervisor.provider.ts` `getSupervisorByPhoneDigits`)** — added `'g'` flag to `regexp_replace`. Restores WA-bot supervisor phone matching.
3. ✅ **`phoneNum` UNIQUE — restored.** Entity `unique:true` + migration `1783782609950-AddSupervisorsPhoneUnique` (`CREATE UNIQUE INDEX "UQ_supervisors_phoneNum"`). Verified 0 dups on the 56-row load first; index confirmed live & UNIQUE.
4. ✅ **ETL — `supervisors` (56 prod only; prod-cts EXCLUDED):**
   - **Source (read-only):** `SELECT * FROM supervisors` on `prod` only (the 1 `prod-cts` row is a test account → skipped).
   - **Transform:** keep `id` (char36 → uuid, direct); `approved`/`canValidate`/`canValClin` 0/1 → bool; datetimes → timestamp (all `termsAcceptedAt` NULL); enums pass through (all values in the PG supersets); **stamp `departmentId` = NS department id for ALL 56 rows**.
   - **No purge needed** (KA table is empty). **No dedupe** (single source).
   - **Load order:** `supervisors` **before** `sub` / `clinicalSub` / `conf` (their FKs → supervisors). Run against `ka-institute` staging first.
   - **Verify:** target count `56` = source; `email` set matches prod; `SELECT position, count(*)` matches prod distribution (Lecturer 29 / Assistant Professor 17 / Professor 10); every row `departmentId = NS`; dupPhone 0 / dupEmail 0.
5. **`departmentId` NOT NULL (decided).** After the ETL confirms **0 NULL `departmentId`** rows, add a migration `src/migrations-ka/<ts>-SupervisorDepartmentNotNull.ts` → `ALTER TABLE "supervisors" ALTER COLUMN "departmentId" SET NOT NULL`. Also update the entity: `departmentId!` → non-nullable (`@Column({ type: "uuid" })`). **Order:** must run *after* the ETL (fails otherwise). Down migration drops NOT NULL. New supervisor creation (`POST /supervisor`) must supply `departmentId` from then on — confirm the create validator/flow sets it (activation item; flag if not).
6. **Rollback:** ETL is insert-only into an empty table → rollback = `TRUNCATE supervisors CASCADE` on staging (no production impact; production untouched throughout).

---

## 8. Risks & mitigations
- **Forgot-password + WA-bot silently broken on PG** (the 2 SQL idioms) — *mitigation:* fixes #1–#2 before go-live; smoke-test both flows for a supervisor account.
- **`phoneNum` UNIQUE restore fails on load** if a dup slipped in — *mitigation:* dup-check the 56 rows before creating the index (prod enforces uniqueness → none expected).
- **FK load order** — `submissions` / `clinical_sub` / `confs` reference `supervisors(id)` RESTRICT → supervisors must be loaded before those modules' ETLs. Noted for the cross-module ETL sequencing.
- **Consultant enum value unused in prod** — harmless; it is an additive superset value for future use.

## 9. Open questions for the user
1. ~~prod-cts supervisor~~ — **RESOLVED: excluded, test account** (Decisions locked).
2. ~~`departmentId` backfill~~ — **RESOLVED: all 56 → NS** (Decisions locked).
3. ~~`departmentId` NOT NULL~~ — **RESOLVED: yes, NOT NULL after backfill** (Decisions locked; §7 step 5).
4. **Canonical-email normalization** — keep the (fixed) in-SQL approach, or move app-side / to a generated column? *(implementation detail — decide at fix time; shared with `cand`.)*
5. **Apply `departmentId` NOT NULL to `cand` too?** `cand` is already backfilled (0 NULL dept), so making `candidates.departmentId` NOT NULL now would be safe and consistent with this decision. Not in scope of this plan — flag for a follow-up if you want DB-level department enforcement across all user tables.

## 10. Approval checklist
- [x] Scope confirmed
- [x] Table/column mapping approved
- [x] ETL rules approved (56 prod → NS; CTS excluded; no purge; no dedupe)
- [x] `departmentId` NOT NULL after backfill approved + **implemented**
- [x] API contract: `/supervisor` reads unchanged; **create now requires `departmentId`** (from NOT NULL decision) — frontend must send it
- [x] The 2 PG-portability code fixes approved + **implemented**
- [x] Approved to implement — **implemented on `migration/mysql-to-postgres` + `ka-institute` staging** (2026-07-12)
- [ ] Commit + push (awaiting explicit user go-ahead)
