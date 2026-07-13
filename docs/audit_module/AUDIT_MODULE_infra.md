# Module Upgrade Audit: infra (config / middleware / migrations / types / utils / user / empty dirs)
**Date**: 2026-07-13 · **Status**: ✅ COVERAGE NOTE — no tables owned; wiring already converted
**Old side**: main @ `affa22e` + MySQL `kasr-el-ainy` (READ-ONLY) · **New side**: migration/mysql-to-postgres @ `6f010d2` + PG `ka-institute`

## 0. TL;DR
The support/infrastructure modules own **no tables** and need **no ETL**. They are the wiring that *implements* the spoke conversion (pinned datasource, static institution resolver, PG migrations). Consolidated here rather than as separate audit files. One real cleanup item: the **legacy MySQL `migrations/` are dead** and must not run against Postgres.

## 1. `config`
`container.config.ts` (Inversify DI), `database.config.ts` (single `AppDataSource`), **`datasource.manager.ts` — pinned to the one static institution** (returns `AppDataSource` for any id), `ka-migrations.config.ts` (points at `migrations-ka`, `synchronize:false`), `routes.config.ts` (mounts all routers), `server.config.ts`. **Verdict:** ✅ this is where tenancy removal is wired. No table. Confirm all entities registered in `database.config.ts` (they are — cand/supervisor/instituteAdmin/superAdmin/clerk/submissions/clinical_sub/events/event_attendance/confs/journals/cal_surgs/hospitals/arab_procs/consumables/equipment/additional_questions/password_reset_tokens/whatsapp_sessions + mirror entities).

## 2. `middleware`
`authorize`, `extractJWT`, `globalErrorHandler`, **`institutionResolver` (defaults to the static institution)**, `rateLimiter`, `requestLogger`, `responseFormatter`. **Verdict:** ✅ converted — `institutionResolver` no longer routes per-tenant; it pins the static institution + carries the `departmentId` claim. No table.

## 3. `migrations` (LEGACY — ⚠ action)
Legacy MySQL tenant migrations (`1735*`) — **incompatible with the Postgres-native entities**; superseded by `migrations-ka`. **⚠ They must never run against `ka-institute`.** Recommend: confirm the migration runner only targets `migrations-ka` (it does, via `ka-migrations.config.ts`), and consider deleting/quarantining the legacy `migrations/` folder to avoid accidental execution. No table (they *are* migrations).

## 4. `migrations-ka` (ACTIVE)
The git-tracked PG migration set: `InitKaSchema`, `SeedKaLookups`, `SeedKaSixFlags`, `AddDepartmentScoping`, `WidenMirrorTextColumns`, **+ this session's additions** `AddCandidatesPhoneUnique`, `AddSupervisorsPhoneUnique`, `SupervisorDepartmentNotNull`, `CandidateDepartmentNotNull`. **Verdict:** ✅ authoritative; run via `npm run db:ka:migrate`. This is the schema backbone the whole conversion rests on.

## 5. `types`
`role.types.ts`, `supervisorPosition.types.ts`, express augmentation, **arabic-reshaper / bidi shims** (used by `pdf` for Arabic report rendering). **Verdict:** ✅ no table; keep the Arabic shims (submissions/cal_surgs carry Arabic text).

## 6. `utils`
`censored.mapper.ts` (role-based censoring for cand/supervisor/etc), `cookie.utils.ts`, `utils.service.ts`. **Verdict:** ✅ no table; used across the role modules (already exercised in cand/supervisor/instituteAdmin audits).

## 7. `user`
Shared `user.interface.ts` only. **Verdict:** ✅ type-only, no table.

## 8. Empty / unused dirs
- `src/mailgun/` — empty (the mailer uses its own provider). Recommend remove.
- `src/references/` — empty. Recommend remove.

## 9. Open questions / recommendations
1. **Delete/quarantine the legacy `migrations/` folder** so it can't be run against Postgres (low risk today since the runner targets `migrations-ka`, but tidy).
2. Remove the two empty dirs (`mailgun`, `references`).
3. Confirm every entity is registered in `database.config.ts` (spot-checked ✅).

## 10. Checklist
- [x] No tables owned by infra
- [x] Tenancy wiring converted (pinned datasource + static resolver)
- [x] `migrations-ka` is the authoritative set
- [ ] Legacy `migrations/` quarantined + empty dirs removed (recommended tidy)
