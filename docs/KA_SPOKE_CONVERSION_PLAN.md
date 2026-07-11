# Convert MedScribeNeuroServer into the KA Institute Spoke API

> Status: ✅ IMPLEMENTED (Stages 0–E) on branch `migration/mysql-to-postgres` — committed as `0087757` (2026-07-11; `main` never touched, guardrail 1 respected).
> **✅ REVISED + GAPS CLOSED (independent review, 2026-07-11 evening):** full re-verification against staging passed — boot (mirror @ 217.279, poll started), mirror↔hub parity EXACT (main_diags 10/10, diagnoses 124/124, procs 93/93, joins 134+153 both sides, lectures 152/152), auth register+login *without* institutionId, JWT embeds static id, removed routes 404 (`/mcp`, `/refLectures`, `/positions`, `POST /mainDiag`), `/references` bundle (15/4/5 lookups), webhook HMAC 401-bad/200-good, tsc clean. **INSTITUTION_ID concern investigated and cleared**: `550e8400-…440000` / `cairo-university` are the platform's own canonical registry values from `scripts/seed-institutions.ts` — faithful, not fabricated (NB: staging defaultdb never had an `institutions` table, so the shim was doubly necessary). **Six-flag gap CLOSED**: production truth captured read-only from MySQL `kasr-el-ainy` (guardrail-2 compliant), cross-checked = 14 nonzero flags matching hub migration 158's independent capture, seeded via title-keyed migration `1783782609910-SeedKaSixFlags` (applied; API serves real values, e.g. cns tumors = spOrCran/pos/approach/intEvents). **Hub→spoke broadcast wired end-to-end**: `SPOKE_WEBHOOKS=KA|http://localhost:3001/admin/ref-resync|…` set in hub `.env`; `npm run resync:broadcast` → KA HTTP 200 with full sync report. Deliberately retained (validated by this revision — the prod capture needed them): legacy gitignored `scripts/` + `mysql2` dep.
> **Still open**: (1) deep tenant E2E not yet exercised (hospital → calSurg → POST /sub → dashboard analytics → PDF) — needs fixtures; (2) frontend usage audit (risk 1); (3) hub repo State-A work + SPOKE_WEBHOOKS still uncommitted there; the webhook URL must be updated when the spoke deploys off localhost; (4) SeedKaSixFlags migration uncommitted in this repo.
> Companion plan file: `~/.claude/plans/merry-sprouting-boole.md` (same content).
> Architecture context: `~/.claude/plans/so-the-current-sql-ethereal-pike.md` (hub-and-spoke design + progress log).

## 🔴 Hard guardrails (user rules, 2026-07-11 — non-negotiable)

1. **Never touch the `main` branch** of MedScribeNeuroServer — it is the live production app. Every change in this plan lands on `migration/mysql-to-postgres` only. No merges to `main`, no commits on `main`, no tags pushed to `main`. Production keeps running from `main`, completely unaffected, until a separate explicitly-approved cutover (outside this plan).
   - The LibelusRefApi repo's `main` is fine to work on — it is a new, not-yet-production repo.
2. **Never write to `SQL_DB_DEF_NAME_KA` (the production `kasr-el-ainy` database)** — or any other production database (`SQL_DB_DEF_NAME_MD`, `SQL_DB_DEF_NAME_KA_CTS`, `SQL_DB_DEF_NAME_FNS`, production defaultdb, `SQL_*_B_KA` backup). **Read-only SELECTs are permitted when needed** (e.g. capturing the KA institution row or the NS six-flag map) — nothing else. No migrations, no seeds, no schema changes, no deletes against production.
3. **All database work targets ONLY the staging Postgres services in Aiven project `logbooknative`**: `pg-288cac9e` (staging `defaultdb` — hub-side work only) and the dedicated KA service `ka-psql` (`ka-institute` DB — spoke work). The production env file `.env` is **never edited**; only `.env.staging` changes. Every new npm script added by this plan loads `.env.staging` explicitly (`dotenv -e .env.staging`).

## Context

LibelusRefApi (the hub) now serves all shared reference data — departments, ICD-11 diagnoses, CPT procedures, lectures, additional-questions framework, semantic search (REST + MCP) — from staging `defaultdb`. This repo (the monolith) still contains: (a) the read-only reference modules hitting defaultdb directly, (b) the reference migrations/backfill pipeline, (c) legacy per-tenant CRUD on duplicated reference tables, and (d) multi-tenant machinery whose `institutions` registry lives in defaultdb. The goal: this API becomes the **KA (Kasr El Ainy) institute's dedicated spoke** — no direct reference-DB access, reference data pulled from the hub over HTTP, and a KA-only database.

## Settled decisions (user, 2026-07-11)

1. **Reference pipeline moves to LibelusRefApi**: migrations `1750000000001–217`, `staging-migrations.config.ts`, run/revert + embedding-backfill scripts. This repo never touches defaultdb again.
2. **Legacy reference-shaped CRUD removed too** (`/diagnosis`, `/mainDiag`, `/procCpt`, `/lecture`, `/additionalQuestions`, `/positions`, `/approaches`, `/regions`, `/arabProc` were listed); reads replaced by an HTTP client against the hub.
3. **KA database = `ka-institute` on a DEDICATED staging Aiven service `ka-psql`** (`ka-psql-logbooknative.j.aivencloud.com`, project `logbooknative`, PostgreSQL 17.10) — the user provisioned a separate service, upgrading the original same-service idea. ✅ **Done 2026-07-11**: `ka-institute` DB created, connectivity verified with the existing project CA (`ca-defaultdb-staging.pem` — Aiven CAs are per-project, so both services share it; no new cert needed), creds in `.env.staging` under the new `PSQL_*` names. Fresh empty schema, no production import.
4. **Multi-tenant machinery pinned, not removed**: thin shims serve one static KA institution from env; `req.institutionDataSource` keeps working; ~30 routers / ~55 controllers untouched; logins accept-and-ignore `institutionId`.

## ⚠️ Scope adjustments found during code reading (justified deviations from decision 2)

- **`/arabProc` + `arab_procs` STAY** — genuine KA tenant data (FK from `cal_surgs.arabProcId`, populated by the Google-Sheet import), not hub reference data. The hub has no arab-procs endpoint.
- **`/additionalQuestions` (six-flag) STAYS as KA-local config** — `additional_questions` here is the legacy per-mainDiag flag row (`spOrCran/pos/approach/region/clinPres/intEvents`) driving which form fields the frontend shows. The hub's scaled framework has a different shape and the frontend cutover to it is a separate (deferred) project.
- **`positions`/`approaches`/`regions`: entities + providers + seed stay** (the `GET /references` bundle needs them; submissions store them as plain strings), **routes/controllers removed**.

## Core design

### Reference-consumption pattern — DECIDED (2026-07-11): mirror (local read model) + hub-governed re-mirror

Four state-of-the-art patterns were evaluated with the user before implementation:
1. **Pure ID references + API composition** (submissions store hub UUIDs only; reads resolve via a version-keyed in-memory catalog) — rejected: largest rewrite of the riskiest analytics/PDF code, and requires a hub no-hard-delete/alias contract.
2. **Snapshot-on-write** (submissions embed code/name at creation) — **rejected by user, decisive argument**: reference codes are volatile (the audit history is full of ICD/CPT recodes and AMA deletions); frozen snapshots become silently-corrupt copies when the hub corrects a code. The user wants corrections to propagate to history.
3. **Local read model (mirror) — CHOSEN**: replica tables synced from the hub's public API (never its DB). This is textbook event-carried-state-transfer, not a boundary violation — the hub remains the only writer/source of truth; the mirror is a disposable cache in table form. It keeps submissions' FKs and all analytics SQL byte-identical, and hub recodes propagate to all history on every re-sync (answering the option-2 corruption concern).
4. **BFF/federation** — deferred; doesn't solve server-side analytics/PDFs anyway.

**Governance addition (user requirement): a hub-superadmin re-mirror tool.** When the microservice's data is updated, the hub superadmin pushes a re-sync to ALL served APIs instead of waiting for their polls:
- **Hub side (LibelusRefApi)**: `POST /v1/admin/resync-broadcast`, gated by a NEW `ADMIN_API_KEY` (superadmin-only, separate from consumer `API_KEYS`). It reads a spoke registry (env `SPOKE_WEBHOOKS` = `label:url:secret` per spoke, or a small table later), fans out an HMAC-signed `POST <spoke>/admin/ref-resync` carrying the current `dataVersion`, and returns per-spoke results (synced / unreachable / failed). Plus a small CLI wrapper (`npm run resync:broadcast`) so the superadmin can trigger it from the terminal; a UI button can come later.
- **Spoke side (this repo)**: `POST /admin/ref-resync` — service-to-service auth (verifies the HMAC signature against `HUB_WEBHOOK_SECRET`, not JWT), triggers `RefMirrorService.sync()`, responds with row counts + the new `dataVersion`.
- **Poll fallback stays** (the 5-min `dataVersion` poll): a missed webhook self-heals on the next poll — push gives immediacy + admin control, pull gives reliability.
- **Hub data contract** (enables the whole pattern): served rows are never hard-deleted outside curated migrations, `dataVersion` only increases, and the spoke's mirror sync is upsert-only/never-delete so RESTRICT FKs can never break mid-sync.

### Reference mirror + hub client (the submissions problem)

`SubmissionEntity` (`src/sub/sub.mDbSchema.ts`) is FK-coupled to reference tables: `ManyToOne → MainDiagEntity` (RESTRICT) + `ManyToMany → ProcCptEntity/DiagnosisEntity` via `submission_proc_cpts`/`submission_icds`; analytics/PDF reports traverse those relations; `EventEntity.lectureId → lectures` (RESTRICT). Rewriting all of that is the riskiest possible change.

**Design: local read-only mirror tables synced from the hub, preserving hub UUIDs as local PKs.** KA schema keeps `main_diags`, `diagnoses`, `proc_cpts`, `main_diag_diagnoses`, `main_diag_procs`, `lectures` as mirrors. Sync = upsert rows (never delete → RESTRICT FKs can't break), truncate+rebuild join tables. IDs served by reads are exactly the IDs submissions store.

New `src/refApi/` module:
- `refApi.client.ts` — axios (already a dep ^1.11.0), `X-API-Key`, envelope-unwrapping, typed errors, timeout + 1 retry. Methods for version/main-diags/diagnoses/proc-cpts/lectures/questions.
- `refData.service.ts` — in-memory cache keyed on hub `GET /v1/version` dataVersion (poll every `REF_VERSION_POLL_MS`, default 5 min; on change → clear cache + trigger mirror sync). Stale-while-error fallback; 503 only if nothing cached.
- `refMirror.service.ts` — the mirror sync; `ref_sync_state` table records `{dataVersion, syncedAt}`; boot = sync if version changed, tolerate hub-down if mirror exists, fail fast only on first-ever boot with hub down. Sync is triggered by (a) boot, (b) dataVersion poll change, (c) the hub superadmin's re-mirror broadcast hitting `POST /admin/ref-resync`.
- `refResync.router.ts` — the `POST /admin/ref-resync` webhook endpoint (HMAC-verified via `HUB_WEBHOOK_SECRET`, no JWT), calls `RefMirrorService.sync()` and returns counts + dataVersion.
- `legacyShapes.mapper.ts` — pure hub→legacy shape functions.

### Read routes keep their legacy shapes (frontend contract preserved)

New `src/referenceRead/` router+controller mounted at the OLD paths with the OLD middleware chain (`extractJWT`, `institutionResolver`, `userBasedRateLimiter`, roles):

| Route | Backing |
|---|---|
| `GET /mainDiag`, `GET /mainDiag/:id` | hub main-diags + per-id diagnoses/proc-cpts → `{id,title,diagnosis[],procs[]}` |
| `GET /diagnosis/` | hub dept diagnoses → `{id,icdCode,icdName,neuroLogName:null}` |
| `GET /procCpt/` | hub dept proc-cpts → `{id,title,alphaCode,numCode,description}` |
| `GET /lecture/`, `/lecture/:id` | hub refLectures flattened → `{id,lectureTitle,mainTopic,level,google_uid:null}` |

All writes on those paths and all of `/positions|/approaches|/regions`, `/refAdditionalQuestions`, `/refLectures`, `/mcp` are **removed** (404). Fallback if shape fidelity bites: point handlers at the mirror tables (same IDs/shapes, one-line swap).

### Static-institution shims

- `src/institution/institution.service.ts` → env-backed `STATIC_INSTITUTION` (reuse the **existing KA UUID** — capture from defaultdb pre-cutover — so in-flight JWTs stay valid). `getInstitutionById(_)` always returns it; `getAllActiveInstitutions()` → `[it]`; cache-clear = no-op. Keep `IInstitution` interface.
- `src/config/datasource.manager.ts` → `getDataSource(_)` returns the single `AppDataSource`; drop the Map; `closeAll()` → `closeDatabase()`.
- `src/middleware/institutionResolver.middleware.ts` → missing institutionId defaults to static id instead of 400 (everything else unchanged).
- `src/auth/*` → no signature changes; `getDataSourceFromRequest` falls back to static; JWTs keep embedding (static) institutionId.
- `GET /institutions` → unchanged code path, now returns the single env-backed row.
- `src/waBot/waSession.service.ts` → routing shim: `getRoutedInstitutionId()` → static id, `setRoutedInstitution` no-op; delete `waSessionRouting.mDbSchema.ts` + `defaultdb.config.ts` + `institution.mDbSchema.ts`.

### KA database bootstrap (MySQL-flavored migrations problem)

The 1735* tenant migrations are MySQL DDL (`datetime`, `char(36) utf8mb4`, `tinyint(1)`, `UUID()`) — they will NOT run on Postgres. Strategy:
1. Postgres-compat pass on all `*.mDbSchema.ts`: `datetime`→`timestamp`, `tinyint width:1`→`smallint`, drop `charset/collation`, `lectures.google_uid` nullable.
2. New `src/config/ka-migrations.config.ts` (unified 26-entity list; `DepartmentEntity` deleted — registered but unused) + `src/migrations-ka/` (git-tracked).
3. `typeorm migration:generate` against the empty `ka-institute` DB → reviewed, committed `InitKaSchema`; hand-written `SeedKaLookups` (positions/approaches/regions seed + `ref_sync_state`), Postgres syntax.
4. npm scripts `db:ka:generate|migrate|revert` via `scripts/run-ka-migrations.ts` — all wired through `dotenv -e .env.staging` so they can only ever target the staging `ka-institute` DB. No runtime `synchronize`.

### Env scheme (`.env.staging` ONLY — `.env` is production and is never edited; rename = fail-fast on leftovers)

```
PSQL_HOST / PSQL_PORT / PSQL_USERNAME / PSQL_PASSWORD   (dedicated KA service ka-psql-logbooknative.j.aivencloud.com — ✅ set 2026-07-11)
PSQL_DB_NAME=ka-institute        SSL_CA_PATH (unchanged — per-project CA covers both services)
INSTITUTION_ID=<existing KA uuid>  INSTITUTION_CODE=KA  INSTITUTION_NAME  INSTITUTION_DEPARTMENT=neurosurgery
INSTITUTION_IS_ACADEMIC/_PRACTICAL/_CLINICAL   (copy current defaultdb row — isClinical gates the clinical dashboard)
REF_API_URL  REF_API_KEY(=REF_API_KA value)  REF_DEPT_CODE=NS  REF_API_TIMEOUT_MS  REF_VERSION_POLL_MS
HUB_WEBHOOK_SECRET   (shared secret for the hub superadmin's re-mirror broadcast)
DELETE: PSQL_*_DEFAULT, SQL_DB_DEF_NAME_*, SQL_*_B_KA, REF_API_FAYOUM
Hub repo (.env there): ADMIN_API_KEY (superadmin), SPOKE_WEBHOOKS (label:url:secret per spoke)
```
`validateDatabaseConfig` requires the new set. Keep GEMINI_* (aiAgent generateText/audio are tenant features; only `embedText` is removed).

## Stages

**Stage 0 — Prep**: ~~create the KA database~~ ✅ done 2026-07-11 (`ka-institute` on the dedicated staging service `ka-psql`, connectivity + CA verified, `.env.staging` updated); capture the KA institutions row (id/flags) and the NS six-flag map via **read-only SELECTs** (production registry/tenant DB reads permitted by guardrail 2 — SELECT only, nothing written) — ✅ **KA institutions row captured 2026-07-11** (read-only SELECT on the **MySQL** prod defaultdb): `id=550e8400-e29b-41d4-a716-446655440000`, `code=cairo-university`, `name="Kasr El Ainy / Cairo University"`, `department=neurosurgery`, isAcademic/isPractical/isClinical all true → written to `.env.staging` `INSTITUTION_*`. NS six-flag map still pending (Stage D need). Local git tag `pre-spoke-split` on the current branch of both repos (never on `main`, not pushed to `main`).

**Stage A — Hub move + admin broadcast (LibelusRefApi repo, independent)** — ✅ **DONE 2026-07-11 (uncommitted in the hub repo)**: 217 ref migrations copied verbatim → `LibelusRefApi/src/migrations/` (not gitignored there); `staging-migrations.config.ts` ported with the explicit 217-entry array verbatim (216-before-215 ordering preserved) and the hub's `resolveSslCa()` (SSL_CA_CERT/SSL_CA_PATH — exported from `referenceDb.config.ts`); run/revert scripts ported; both backfill scripts rewired `AiAgentService` → `EmbeddingClient`; npm scripts added (`db:migrate:staging`, `db:migrate:staging:revert`, `db:backfill-embeddings:staging`, `db:backfill-proc-cpt-embeddings:staging`, `resync:broadcast`) — **no dotenv-cli needed** (hub's own `.env` IS its staging env; configs call `dotenv.config()`). **Superadmin re-mirror broadcast built**: `src/admin/` (adminAuth X-Admin-Key vs `ADMIN_API_KEY` timing-safe; `spokeRegistry` parsing `SPOKE_WEBHOOKS` as `label|url|secret` — pipe-separated since URLs contain colons; `ResyncBroadcastService` HMAC-SHA256 fan-out via Node fetch with per-spoke results; `AdminRouter` at `/v1/admin/resync-broadcast`) + CLI `scripts/resync-broadcast.ts` (service invoked directly, no server needed). `ADMIN_API_KEY` generated + `SPOKE_WEBHOOKS=` placeholder added to hub `.env`. README updated (pipeline ownership + admin endpoint + env docs). **Verified**: tsc clean (incl. all 217 migrations), `db:migrate:staging` → "No pending migrations", both backfills → "Nothing to do", `/v1/version` → `217.279` unchanged, broadcast 401 (no/wrong key) / 200 + `{spokesConfigured:0}` (valid key), CLI runs. NB: a stale hub dev-server on port 8090 (PID 11732, other session) answered first verification attempts with 404 — re-verified on PORT=8099; left that process running.

**Stage B — Entities + KA datasource (app still multi-tenant)** — ✅ **DONE 2026-07-11 (uncommitted)**: Postgres-compat entity pass = 75 codemod substitutions across 26 `*.mDbSchema.ts` (`datetime`→`timestamp`, `tinyint width:1`→`smallint`, charset/collation stripped) **+ 14 FK shadow columns `char(36)`→`uuid`** (discovered during `migration:generate`: columns paired with `@JoinColumn` to uuid PKs merge to `uuid` on PG and reject `length` — conf.presenterId, calSurg.hospitalId/arabProcId, event.lectureId/journalId/confId, clinicalSub.candDocId/supervisorDocId, sub.candDocId/procDocId/supervisorDocId/mainDiagDocId, eventAttendance.eventId/candidateId; polymorphic no-relation `char(36)` columns kept) **+ whatsappSession `longtext`→`text`, bigint `unsigned` dropped** + `lectures.google_uid` AND `lectures.level` made nullable (hub lectures have no google_uid and NULL levels). `src/department/` deleted (unused). Created `src/config/ka-migrations.config.ts` (26-entity union, `PSQL_*` env), generated `src/migrations-ka/1783782609882-InitKaSchema.ts` (30 tables, 22 FKs, 19 enums; + explicit `CREATE EXTENSION uuid-ossp`), hand-wrote `1783782609900-SeedKaLookups.ts` (positions 5/approaches 15/regions 4 via `gen_random_uuid()` + `ref_sync_state` single-row table), `scripts/run-ka-migrations.ts`/`revert-ka-migrations.ts`, npm `db:ka:migrate|revert|generate` (all `dotenv -e .env.staging`). `src/migrations-ka/` NOT gitignored (verified). **Verified on `ka-institute`**: both migrations applied; re-run → "No pending"; revert→re-apply cycle clean; 32 tables; submissions FKs → candidates/main_diags/cal_surgs/supervisors all RESTRICT; seeds 5/15/4; lectures.google_uid+level nullable; tsc clean.

**Stage C — Static institution pinning** — ✅ **DONE 2026-07-11 (uncommitted)**: `institution.service.ts` rewritten to an env-backed `getStaticInstitution()` (real KA uuid + code/name/flags from env); `getInstitutionById/ByCode` accept-and-ignore → static row, `getAllActiveInstitutions()` → `[static]`, `clearInstitutionCache()` no-op. `datasource.manager.ts` collapsed to the single `AppDataSource` (Map dropped; `getDataSource(_)` ignores id; `closeAll()`→`closeDatabase()`). `database.config.ts` repointed to `PSQL_*` (ka-institute), unified 26-entity list (+ClinicalSub +WhatsappSession), `migrations`→`migrations-ka`, `validateDatabaseConfig` now requires `PSQL_*`+`SSL_CA_PATH`+`INSTITUTION_ID`. `institutionResolver.middleware.ts` defaults missing institutionId to the static id (no more 400). `auth.router.ts` `getDataSourceFromRequest` always returns the static DS + the four login guards removed; **auth.controller.ts** register/login (all 7 methods) no longer require institutionId and embed the **static** id in JWTs. 7 validators made `institutionId` optional. `waSession.service.ts` routing = static id / no-op. `index.ts` dropped the defaultdb shutdown. **Deleted** `defaultdb.config.ts`, `institution.mDbSchema.ts`, `waSessionRouting.mDbSchema.ts`. Env: `INSTITUTION_*` added to `.env.staging` (captured read-only from prod registry, see Stage 0). **Verified** (tsc clean; booted on `ka-institute`): `GET /institutions`=1 row (KA); register (no institutionId) → 201; login with AND without institutionId → 200 and JWT carries the static KA id even when a *different* institution uuid is sent; wrong-password → 401. NB actual production defaultdb is **MySQL**; real KA institution `code` is `cairo-university` (not "KA" as the env-scheme draft assumed) — the real value is used. Remaining plan-listed check not yet run: authenticated `hospital create` (exercises institutionResolver→static DS, already proven via the login path).

**Stage D — Hub client + mirror + reference-read swap** — ✅ **DONE 2026-07-11 (uncommitted)**: Built `src/refApi/` = `refApi.types.ts` (hub shapes), `refApi.client.ts` (axios; `X-API-Key`, envelope-unwrap, timeout, 1 retry; auto-`https://`, dept defaults `NS`, key falls back to `REF_API_KA`), `legacyShapes.mapper.ts` (hub→mirror rows), `refMirror.service.ts` (upsert `main_diags`/`diagnoses`/`proc_cpts`/`lectures` never-delete + rebuild `main_diag_*` join tables + all-zero `additional_questions` continuity + `ref_sync_state`), `refData.service.ts` (boot-sync when hub dataVersion≠stored, tolerate hub-down when mirror exists; 5-min poll, stale-while-error), `refResync.router.ts` (`POST /admin/ref-resync`, HMAC `X-Hub-Signature` vs `HUB_WEBHOOK_SECRET`). New `src/referenceRead/` (controller+router) serves GET `/mainDiag`(+`:id`), `/diagnosis`, `/procCpt`, `/lecture`(+`:id`) from the mirror via the KEPT services, ORIGINAL middleware/role gates preserved; writes 404. Rewired `container.config` (dropped mainDiag/diagnosis/procCpt/lecture controllers+routers, mcp, refAdditionalQuestions/refLectures bindings; kept the services/providers; added referenceRead + refApi singletons) and `routes.config` (mirror-read at `/`, `/admin` webhook; unmounted `/refAdditionalQuestions`,`/refLectures`,`/mcp`,`/positions`,`/approaches`,`/regions`). `index.ts` bootstrap now DB→mirror-sync→listen + poll start / stop on shutdown. **Deleted**: `refAdditionalQuestions/`, `refLectures/`, `mcp/`, `diagnosis/diagnosisSearch.service.ts`, `config/referenceDb.config.ts`, the 4 legacy routers+controllers; **pruned** `@modelcontextprotocol/sdk`. `.env.staging` got `REF_API_KEY`/`REF_DEPT_CODE`/`REF_API_TIMEOUT_MS`/`REF_VERSION_POLL_MS`/`HUB_WEBHOOK_SECRET`. **Verified** (tsc clean; booted on `ka-institute`): mirror sync idempotent (main_diags 10 / diagnoses 124 / proc_cpts 93 / lectures 152 / joins 134·153 / six-flag 10 @ dataVersion 217.279); `GET /mainDiag` returns mirror-backed legacy shape (10 rows, per-id dx/procs); removed routes 404; webhook 401 bad-sig / 200 good-sig. **Deferred → handled in Stage E**: positions/approaches/regions routers+controllers deleted, `AiAgentService.embedText` removed, `REF_API_FAYOUM` dropped (the unused write-only validator *files* were left in place — harmless/unimported). **NS six-flag map still all-zero** (still open) — real values need a read-only prod-tenant capture + title-keyed seed.

**Stage E — Cleanups** — ✅ **DONE 2026-07-11 (uncommitted)**: Deleted **`src/migrations/` (209 tracked files)** — reference 1750* live in the hub, tenant 1735* are unusable on PG, history preserved in the `pre-spoke-split` tag. Deleted the 5 script-only migration configs (`backupdb.config`, `staging-migrations.config`, `production-index-migrations{,-md,-ka-cts}.config` — confirmed zero app imports). Pruned dead npm scripts (`db:migrate:staging{,:revert}`, `db:backfill-embeddings:staging`, `db:backfill-proc-cpt-embeddings:staging`, `db:migrate:backup`, `db:migrate:production{,:ka-cts,:md}`); kept `db:ka:*`. App-side: removed dead `AiAgentService.embedText` (its only caller `diagnosisSearch.service` is gone), **deleted the unmounted `positions`/`approaches`/`regions` routers+controllers** (+ container bindings) while KEEPING their services/providers (the `/references` bundle still returns positions/approaches/regions — verified 200). Dropped `REF_API_FAYOUM` from `.env.staging`. The now-unused write-only validator *files* (create/update/delete for mainDiag/diagnosis/procCpt/lecture) were **left in place** — unimported and harmless; not worth the churn. **Verified**: tsc clean; boot on `ka-institute` → `/institutions` 200, `/references` 200 (keys consumables,equipment,approaches,regions,positions), `/mainDiag` 200. ⚠️ **Scope change on discovery**: `scripts/` is **gitignored** (only 16 of ~123 tracked) — the "delete legacy runner/seed/copy scripts", "retarget still-useful scripts", and **`mysql2` dep prune** items were **intentionally NOT done**: those ~30 mysql2 scripts + the legacy runners are untracked local operational tooling (deleting = irreversible, no git history; and `mysql2` is used by 30 local scripts so it stays). **Deferred doc polish**: CLAUDE.md/README narrative (plan doc is the authoritative record). **Still open (not Stage E)**: NS six-flag map real values (read-only prod-tenant capture + title-keyed seed).

## Verification (end-to-end)

1. `tsc --noEmit` clean in both repos after each stage.
2. `db:ka:migrate` idempotent on `ka-institute`.
3. Boot: KA connect + hub version + mirror sync counts logged.
4. Auth round-trip with and without institutionId; JWT carries static id; `/institutions` = 1 row (legacy KA uuid).
5. Reference reads match legacy shapes (diff vs pre-cutover capture); hub stopped → stale cache serves; restart with hub down → boots on mirror.
6. Tenant E2E: hospital → calSurg (arabProc import) → `POST /sub` using ids from `GET /mainDiag` → approve → dashboard CPT/ICD analytics correct → PDF report renders.
7. `GET /references` bundle (positions/approaches/regions/consumables/equipment); `GET/PUT /additionalQuestions/:mainDiagId` with mirror ids.
8. Version-bump invalidation, both paths: (a) push — superadmin runs `resync:broadcast` on the hub → spoke re-mirrors immediately and the broadcast report shows it; (b) pull — with the webhook disabled, a trivial hub migration is picked up within the poll interval. Bad-signature webhook call → 401, no sync.
9. Event with mirrored lecture id + report shows title. WA webhook routes straight to KA.
10. Removed routes 404: `/mcp`, `/refLectures/*`, `/positions`, `POST /mainDiag`.

## Risks / open questions

1. **Frontend usage audit before Stage D**: does it call `/refAdditionalQuestions|/refLectures` (vs legacy paths)? `/positions|/approaches|/regions` directly or only via `/references`? Any superAdmin screens using reference writes? Reads of `createdAt/neuroLogName` (mapper emits null; mirror-read fallback exists)?
2. **Hub lecture identity**: NS lectures in the hub were re-authored (new UUIDs, no google_uid) — fresh DB means no legacy event FKs to worry about, but cross-cutover reporting continuity is lost (accepted).
3. **arab_procs/hospitals population** in the fresh DB via existing external-import endpoints — one-time runbook step.
4. **Semantic search** for the KA frontend is hub-only now; a thin authenticated proxy via RefApiClient is a later, out-of-scope addition.
5. **Sibling tenants** (MD, KA_CTS, FNS/`REF_API_FAYOUM`): this branch stops serving them — production (all tenants incl. KA) continues on untouched `main` until each gets its own spoke; nothing in this plan changes what production serves.
6. ~~Free-tier connection cap shared by hub+spoke~~ — resolved: the spoke now has its own dedicated service (`ka-psql`), so pools are independent; only the hub's service remains on the shared/free plan.

## Critical files

- `src/config/database.config.ts`, `src/config/datasource.manager.ts`, `src/institution/institution.service.ts` — the pinning core
- `src/config/routes.config.ts`, `src/config/container.config.ts` — unmount/remount wiring
- `src/sub/sub.mDbSchema.ts` + `src/sub/sub.service.ts` — the FK contract the mirror preserves
- `src/middleware/institutionResolver.middleware.ts`, `src/auth/auth.router.ts`
- New: `src/refApi/{refApi.client,refData.service,refMirror.service,legacyShapes.mapper}.ts`, `src/referenceRead/*`, `src/config/ka-migrations.config.ts`, `src/migrations-ka/*`
- Hub repo: `LibelusRefApi/src/migrations/*`, `scripts/{run,revert}-staging-migrations.ts`, `scripts/backfill-*.ts`
