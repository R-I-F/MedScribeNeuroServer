# Module List — MedScribeNeuroServer API

All modules under `src/`, as of the `migration/mysql-to-postgres` branch (KA single-institution spoke). Grouped by role. Route paths are as mounted in `src/config/routes.config.ts`.

## Feature / API modules (mounted routers)

| Module | Route | Description |
|---|---|---|
| `auth` | `/auth` | Authentication: login/refresh for all roles, JWT issuing (`authToken.service.ts`, incl. `departmentId` claim) |
| `institution` | `/institutions` | Institutions (public list; spoke is pinned to the static KA institution) |
| `hospital` | `/hospital` | Hospitals within the institution |
| `arabProc` | `/arabProc` | Arabic procedure names |
| `calSurg` | `/calSurg` | Surgical case calendar (scheduled surgeries) |
| `cand` | `/cand` | Candidates (trainees): registration, profile, management |
| `supervisor` | `/supervisor` | Supervisors: registration, profile, management |
| `clerk` | `/clerk` | Clerk users |
| `instituteAdmin` | `/instituteAdmin` | Institute admin users |
| `superAdmin` | `/superAdmin` | Super admin users |
| `sub` | `/sub` | Surgical submissions (the core logbook entries) |
| `clinicalSub` | `/clinicalSub` | Clinical (non-surgical) submissions |
| `additionalQuestions` | `/additionalQuestions` | Legacy per-tenant six-flag additional questions (spOrCran/pos/approach/region/clinPres/intEvents) |
| `journal` | `/journal` | Journal club entries |
| `conf` | `/conf` | Conferences |
| `event` | `/event` | Events + attendance (`eventAttendance.mDbSchema.ts`) |
| `activityTimeline` | `/activityTimeline` | Candidate activity timeline |
| `consumables` | `/consumables` | Consumables lookup used in submissions |
| `equipment` | `/equipment` | Equipment lookup used in submissions |
| `reports` | `/instituteAdmin/reports` | Institute-admin reporting/analytics |
| `mailer` | `/mailer` | Outbound email endpoints |
| `externalService` | `/external` | External-integration endpoints (bulk imports from external systems) |
| `bundler` | `/references`, `/candidate` | Aggregated reference-data bundle for the frontend |
| `waBot` | `/waBot` | WhatsApp bot integration + session management (`waSession.service.ts`) |
| `referenceRead` | `/` (root-level GETs) | Dept-scoped reference reads served **from the mirror tables**: public `GET /departments`, plus `GET /mainDiag`, `/mainDiag/:id`, `/diagnosis`, `/procCpt`, `/lecture`, `/lecture/:id` (dept resolved via `?deptCode` → JWT `departmentId` claim → `REF_DEPT_CODE` default) |
| `refApi` | `/admin` (webhook) | Hub (LibelusRefApi) client: `refApi.client.ts`, reference-data polling (`refData.service.ts`), mirror sync (`refMirror.service.ts`), HMAC re-sync webhook `POST /admin/ref-resync` (`refResync.router.ts`) |

## Service-only modules (no mounted router — consumed by other modules)

| Module | Description |
|---|---|
| `aiAgent` | Gemini AI service (embeddings/agent, `aiAgent.service.ts`) |
| `diagnosis` | Diagnosis entity/service (reads from mirror; legacy router removed in spoke conversion) |
| `mainDiag` | Main-diagnosis category entity/service (legacy router removed) |
| `procCpt` | CPT procedure entity/service (legacy router removed) |
| `lecture` | Lecture + lecture-topic entities/service (mirror-backed; legacy router removed) |
| `positions` | Patient-position lookup (seeded; legacy router removed) |
| `approaches` | Surgical-approach lookup (seeded; legacy router removed) |
| `regions` | Anatomical-region lookup (seeded; legacy router removed) |
| `passwordReset` | Password-reset tokens + flow (exposed through the auth surface) |
| `pdf` | PDF generation (submission report layout, `submissionReport/`) |
| `departments` | Mirrored `departments` entity schema (hub UUID PK; `department.mDbSchema.ts`) |
| `user` | Shared user interface (`user.interface.ts`) |

## Infrastructure / support

| Module | Description |
|---|---|
| `config` | App wiring: Inversify container, database config + `datasource.manager.ts` (pinned single-institution), `ka-migrations.config.ts`, `routes.config.ts`, `server.config.ts` |
| `middleware` | `authorize`, `extractJWT`, `globalErrorHandler`, `institutionResolver` (defaults to static institution), `rateLimiter`, `requestLogger`, `responseFormatter` |
| `migrations` | Legacy MySQL tenant migrations (1735*) — incompatible with the Postgres-native entities; superseded by `migrations-ka` |
| `migrations-ka` | KA spoke Postgres migrations (git-tracked): `InitKaSchema`, `SeedKaLookups`, `SeedKaSixFlags`, `AddDepartmentScoping`, `WidenMirrorTextColumns` |
| `types` | Shared TS declarations (`role.types.ts`, `supervisorPosition.types.ts`, express augmentation, arabic-reshaper/bidi shims) |
| `utils` | Utilities: `censored.mapper.ts`, `cookie.utils.ts`, `utils.service.ts` |
| `validators` | express-validator request validators for all modules |
| `mailgun` | Empty directory (unused) |
| `references` | Empty directory (unused) |

## Entry point

- `src/index.ts` — application bootstrap.
