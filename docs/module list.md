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
- **ETL COMPLETE — all prod operational tables loaded to `ka-institute`.** Final batch (dept-scoped NS, migrations `610070`/`610080`): `clinicalSub` (87), `conf` (2), `journal` (27), `event` (102) + `event_attendance` (1,264). **`events.lectureId` nulled for 81 lecture-events** — prod's legacy lectures are disjoint from the hub-mirror catalog (0/80 match on id/title/google_uid); events + attendance kept, dead pointer dropped.
- **Follow-on (not ETL):** `arab_procs → proc_cpts` semantic remap for `cal_surgs.procCptId` (hub procedure-search + user review + backfill), then retire arab_procs.
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
| `arabProc` | `/arabProc` | ✅ **Done** — dept-scoped (`departmentId` FK, nullable) + 81 → NS | Arabic procedure names (per department) |
| `calSurg` | `/calSurg` | ✅ **Done** — 5,578 → NS (dept-scoped, nullable) + `procCptId` FK staged; legacy `arabProcId` kept (proc_cpts remap = follow-on) | Surgical case calendar (dept-scoped) |
| `cand` | `/cand` | ✅ **Implemented** (110 → NS; PG fixes; phone-unique; dept NOT NULL) | Candidates (trainees): registration, profile, management |
| `supervisor` | `/supervisor` | ✅ **Implemented** (56 → NS; PG fixes; phone-unique; dept NOT NULL) | Supervisors: registration, profile, management |
| `clerk` | `/clerk` | 🔁 Pending (audit draft; impl + ETL) | Clerk users |
| `instituteAdmin` | `/instituteAdmin` | ✅ **Implemented** (3 → NS; PG fix; dept nullable) | Institute admin users |
| `superAdmin` | `/superAdmin` | ✅ **Implemented** (1 already loaded; no idioms) | Super admin users |
| `sub` | `/sub` | ✅ **Done** — 3,599 → NS (dept-scoped) + `mainDiagDocId` remapped legacy→hub (10/10 by title); 0 FK orphans | Surgical submissions (the core logbook entries) |
| `clinicalSub` | `/clinicalSub` | ✅ **Done** — 87 → NS (dept-scoped, nullable via candidate→supervisor); migration `610070` | Clinical (non-surgical) submissions |
| `additionalQuestions` | ~~`/additionalQuestions`~~ (route retired) | ✅ **Fully replaced by hub questions framework** (Fable `1758c6d`→`dbf4c2a`→`9544976`, verified) — 4 mirror tables (98 Q / 472 opt / 700 main_diag_q / 1,989 mdq_opt) + `submission_question_answers` (5,948 answers). **Legacy fully removed:** six-flag module + `additional_questions` table + the 6 inline `submissions` cols dropped (migration `1783782610060`); `getSubById` resolves the 6 named fields from the answer store at read time. `tsc` green. | Dynamic additional questions (hub-mirrored, per-main_diag) — legacy six-flag retired |
| `journal` | `/journal` | ✅ **Done** — 27 → NS (dept-scoped); migration `610080` | Journal club entries |
| `conf` | `/conf` | ✅ **Done** — 2 → NS (dept-scoped); migration `610080` | Conferences |
| `event` | `/event` | ✅ **Done** — 102 events + 1,264 attendance → NS (dept-scoped); migration `610080`; **`lectureId` nulled for 81** (prod lectures disjoint from hub mirror) | Events + attendance (`eventAttendance.mDbSchema.ts`) |
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
| `migrations-ka` | ✅ Active (authoritative PG set) | KA spoke Postgres migrations (git-tracked): `InitKaSchema`, `SeedKaLookups`, `AddDepartmentScoping`, `WidenMirrorTextColumns`, phone-unique + dept-NOT-NULL (cand/supervisor), `AddHospitalDepartment`(+NotNull), `AddArabProcDepartment`, `AddCalSurgDepartmentAndProcCpt`, `AddSubmissionDepartment`, questions framework `MirrorRefQuestions`/`AddSubmissionQuestionAnswers`/`DropLegacyAdditionalQuestions` (Fable), `AddClinicalSubDepartment` (`610070`), `AddEventsBranchDepartment` (`610080`) |
| `types` | ✅ Done (keep Arabic reshaper/bidi shims) | Shared TS declarations (`role.types.ts`, `supervisorPosition.types.ts`, express augmentation, arabic-reshaper/bidi shims) |
| `utils` | ✅ Done | Utilities: `censored.mapper.ts`, `cookie.utils.ts`, `utils.service.ts` |
| `validators` | ✅ Done (updated: cand/supervisor `departmentId` required) | express-validator request validators for all modules |
| `mailgun` | 🗑️ Remove (empty, unused) | Empty directory (unused) |
| `references` | 🗑️ Remove (empty, unused) | Empty directory (unused) |

## Entry point

- `src/index.ts` — application bootstrap.
