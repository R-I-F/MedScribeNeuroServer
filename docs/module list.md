# Module List — MedScribeNeuroServer API

All modules under `src/`, as of the `migration/mysql-to-postgres` branch (KA single-institution spoke). Grouped by role. Route paths are as mounted in `src/config/routes.config.ts`.

> **Every module has an audit doc** at `docs/audit_module/AUDIT_MODULE_<module>.md` (38 total). The **Status** column below tracks the migration/implementation state, updated 2026-07-13.

**Status legend**
- ✅ **Done** — implemented, converted, or nothing to do (no prod data to migrate).
- 🔁 **ETL pending** — audited; prod→`ka-institute` data migration still to run (row count in parens).
- ⏭️ **Skip ETL** — audited; ephemeral table, recommend NOT migrating.
- ⚠️ / 🗑️ — infra tidy items.

**Migration status summary**
- **Implemented (user tables):** `cand`, `supervisor`, `instituteAdmin`, `superAdmin` ✅
- **ETL still pending (9 tables):** `sub` (3,599), `calSurg` (5,578, PII), `event`+`event_attendance` (102/1,264), `clinicalSub` (86), `conf` (2), `journal` (27), `arabProc` (81), `additionalQuestions` (reconcile) [`clerk` + `hospital` now done]
- **Reference = hub mirror / seeded (no prod ETL):** `departments`, `diagnosis`, `mainDiag`, `procCpt`, `lecture`, `positions`, `approaches`, `regions`, `refApi`, `referenceRead`, **`consumables` (204+301) & `equipment` (102+234)** — the latter two now hub-mirrored + dept-scoped as of commit `696c87f` (hub endpoint added + spoke sync wired + synced; superseded my earlier "sync gap" note).
- **No table / stateless (no ETL):** `auth`, `institution`, `bundler`, `reports`, `activityTimeline`, `externalService`, `mailer`, `aiAgent`, `pdf`
- **Ephemeral (skip ETL):** `waBot`, `passwordReset`
- **FK load order for the pending ETLs:** `hospitals`+`arab_procs` → `cal_surgs` → `submissions`; `confs`/`journals`/`lectures` → `events` → `event_attendance`.

## Feature / API modules (mounted routers)

| Module | Route | Status | Description |
|---|---|---|---|
| `auth` | `/auth` | ✅ Done (no table; converted) | Authentication: login/refresh for all roles, JWT issuing (`authToken.service.ts`, incl. `departmentId` claim) |
| `institution` | `/institutions` | ✅ Done (retired → static-pinned) | Institutions (public list; spoke is pinned to the static KA institution) |
| `hospital` | `/hospital` | ✅ **Done** — dept-scoped (`departmentId` FK NOT NULL) + 7 → NS + location→json (reads-filtering deferred) | Hospitals/units per department (surgery venues) |
| `arabProc` | `/arabProc` | 🔁 ETL pending (81) | Arabic procedure names |
| `calSurg` | `/calSurg` | 🔁 ETL pending (5,578; **PII**) | Surgical case calendar (scheduled surgeries) |
| `cand` | `/cand` | ✅ **Implemented** (110 → NS; PG fixes; phone-unique; dept NOT NULL) | Candidates (trainees): registration, profile, management |
| `supervisor` | `/supervisor` | ✅ **Implemented** (56 → NS; PG fixes; phone-unique; dept NOT NULL) | Supervisors: registration, profile, management |
| `clerk` | `/clerk` | 🔁 Pending (audit draft; impl + ETL) | Clerk users |
| `instituteAdmin` | `/instituteAdmin` | ✅ **Implemented** (3 → NS; PG fix; dept nullable) | Institute admin users |
| `superAdmin` | `/superAdmin` | ✅ **Implemented** (1 already loaded; no idioms) | Super admin users |
| `sub` | `/sub` | 🔁 ETL pending (3,599; after cal_surgs) | Surgical submissions (the core logbook entries) |
| `clinicalSub` | `/clinicalSub` | 🔁 ETL pending (86) | Clinical (non-surgical) submissions |
| `additionalQuestions` | `/additionalQuestions` | 🔁 Pending (reconcile: seeded 196 vs prod 10) | Legacy per-tenant six-flag additional questions (spOrCran/pos/approach/region/clinPres/intEvents) |
| `journal` | `/journal` | 🔁 ETL pending (27; before events) | Journal club entries |
| `conf` | `/conf` | 🔁 ETL pending (2; before events) | Conferences |
| `event` | `/event` | 🔁 ETL pending (102 events / 1,264 attendance) | Events + attendance (`eventAttendance.mDbSchema.ts`) |
| `activityTimeline` | `/activityTimeline` | ✅ Done (no table; derived reads) | Candidate activity timeline |
| `consumables` | `/consumables` | ✅ **Mirror-synced** (hub, dept-scoped) — 204 items + 301 dept-links; `arName` + `department_consumables` (commit `696c87f`) | Consumables reference (hub-mirrored, dept-scoped read) |
| `equipment` | `/equipment` | ✅ **Mirror-synced** (hub, dept-scoped) — 102 items + 234 dept-links; `arName` + `department_equipment` (commit `696c87f`) | Equipment reference (hub-mirrored, dept-scoped read) |
| `reports` | `/instituteAdmin/reports` | ✅ Done (no table; service layer) | Institute-admin reporting/analytics |
| `mailer` | `/mailer` | ✅ Done (no table; verify mail env) | Outbound email endpoints |
| `externalService` | `/external` | ✅ Done (no table; verify `GETTER_API_ENDPOINT`) | External-integration endpoints (bulk imports from external systems) |
| `bundler` | `/references`, `/candidate` | ✅ Done (no table; aggregator) | Aggregated reference-data bundle for the frontend |
| `waBot` | `/waBot` | ⏭️ Done — skip ETL (ephemeral; optional tenancy cleanup) | WhatsApp bot integration + session management (`waSession.service.ts`) |
| `referenceRead` | `/` (root-level GETs) | ✅ Done (new; mirror reads; verify `REF_DEPT_CODE`) | Dept-scoped reference reads served **from the mirror tables**: public `GET /departments`, plus `GET /mainDiag`, `/mainDiag/:id`, `/diagnosis`, `/procCpt`, `/lecture`, `/lecture/:id` (dept resolved via `?deptCode` → JWT `departmentId` claim → `REF_DEPT_CODE` default) |
| `refApi` | `/admin` (webhook) | ✅ Done (new; hub sync; verify `REF_API_URL`/`REF_API_KEY`) | Hub (LibelusRefApi) client: `refApi.client.ts`, reference-data polling (`refData.service.ts`), mirror sync (`refMirror.service.ts`), HMAC re-sync webhook `POST /admin/ref-resync` (`refResync.router.ts`) |

## Service-only modules (no mounted router — consumed by other modules)

| Module | Status | Description |
|---|---|---|
| `aiAgent` | ✅ Done (no table; verify `GEMINI_*` env) | Gemini AI service (embeddings/agent, `aiAgent.service.ts`) |
| `diagnosis` | ✅ Done (mirror 1,319; router retired) | Diagnosis entity/service (reads from mirror; legacy router removed in spoke conversion) |
| `mainDiag` | ✅ Done (mirror 196 + join tables) | Main-diagnosis category entity/service (legacy router removed) |
| `procCpt` | ✅ Done (mirror 1,429) | CPT procedure entity/service (legacy router removed) |
| `lecture` | ✅ Done (mirror 3,237 lectures / 141 topics) | Lecture + lecture-topic entities/service (mirror-backed; legacy router removed) |
| `positions` | ✅ Done (seeded 5 = prod) | Patient-position lookup (seeded; legacy router removed) |
| `approaches` | ✅ Done (seeded 15 = prod) | Surgical-approach lookup (seeded; legacy router removed) |
| `regions` | ✅ Done (seeded 4 = prod) | Anatomical-region lookup (seeded; legacy router removed) |
| `passwordReset` | ⏭️ Done — skip ETL (87 ephemeral tokens) | Password-reset tokens + flow (exposed through the auth surface) |
| `pdf` | ✅ Done (no table; verify Arabic render) | PDF generation (submission report layout, `submissionReport/`) |
| `departments` | ✅ Done (mirror 15; hub UUID PK; FK anchor) | Mirrored `departments` entity schema (hub UUID PK; `department.mDbSchema.ts`) |
| `user` | ✅ Done (type only, no table) | Shared user interface (`user.interface.ts`) |

## Infrastructure / support

| Module | Status | Description |
|---|---|---|
| `config` | ✅ Done (pinned datasource + wiring) | App wiring: Inversify container, database config + `datasource.manager.ts` (pinned single-institution), `ka-migrations.config.ts`, `routes.config.ts`, `server.config.ts` |
| `middleware` | ✅ Done (static resolver) | `authorize`, `extractJWT`, `globalErrorHandler`, `institutionResolver` (defaults to static institution), `rateLimiter`, `requestLogger`, `responseFormatter` |
| `migrations` | ⚠️ Quarantine (legacy MySQL — must NOT run on PG) | Legacy MySQL tenant migrations (1735*) — incompatible with the Postgres-native entities; superseded by `migrations-ka` |
| `migrations-ka` | ✅ Active (authoritative PG set) | KA spoke Postgres migrations (git-tracked): `InitKaSchema`, `SeedKaLookups`, `SeedKaSixFlags`, `AddDepartmentScoping`, `WidenMirrorTextColumns`, `AddCandidatesPhoneUnique`, `AddSupervisorsPhoneUnique`, `SupervisorDepartmentNotNull`, `CandidateDepartmentNotNull` |
| `types` | ✅ Done (keep Arabic reshaper/bidi shims) | Shared TS declarations (`role.types.ts`, `supervisorPosition.types.ts`, express augmentation, arabic-reshaper/bidi shims) |
| `utils` | ✅ Done | Utilities: `censored.mapper.ts`, `cookie.utils.ts`, `utils.service.ts` |
| `validators` | ✅ Done (updated: cand/supervisor `departmentId` required) | express-validator request validators for all modules |
| `mailgun` | 🗑️ Remove (empty, unused) | Empty directory (unused) |
| `references` | 🗑️ Remove (empty, unused) | Empty directory (unused) |

## Entry point

- `src/index.ts` — application bootstrap.
