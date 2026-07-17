# Drop Multi-Tenancy — Progress Ledger

**Design doc:** `docs/DROP_MULTITENANCY_INSTITUTION_TABLE_PLAN.md` (read it first).
**Rule:** update this after every sub-step. Status: ⬜ not started · 🚧 in progress · ✅ done · ⏭️ deferred.

**Decisions locked (user, 2026-07-17):** D1-A (keep `req.institutionDataSource` name, source from `AppDataSource`;
delete `DataSourceManager`) · D3 (frontend fetches `GET /institution`) · D5 (redirect old `:institutionId` URLs).

---

## Checkpoint table

| Stage | Status | Files touched | Verified how | Notes / gotchas | Date |
|---|---|---|---|---|---|
| B0 Scaffold + discovery | ✅ | this doc | grep | **D4: NO tenant entity has an institutionId column** — table is purely additive, no FK closure. Seed values captured from `.env.staging`. Latest ka migration = `1783782610140`; next = `...610150`. ka migrations auto-load via glob `migrations-ka/*.ts` (no array to register), but new entities MUST be added to `ka-migrations.config.ts` entities[]. | 2026-07-17 |
| B1 institutions table | ✅ | `institution.mDbSchema.ts` (new), `migrations-ka/1783782610150-CreateInstitutionsTable.ts` (new), `ka-migrations.config.ts`, `database.config.ts` | tsc clean; applied on ka-institute; `SELECT` → 1 row (id 550e8400-…, code cairo-university, all flags true); revert→re-apply cycle clean | Table has UQ on code; no per-tenant database{} block; purely additive | 2026-07-17 |
| B2 DB-backed service | ✅ | `institution.service.ts` (rewritten) | tsc clean; standalone script → getInstitution() returns DB row, no `database` block, getAllActiveInstitutions=1, getStaticInstitution() warmed id correct | `IInstitution` dropped per-tenant `database{}` block (nobody read it). `getInstitution()` async+cached is authoritative; `getStaticInstitution()` sync throws if cold (boot warms via index.ts:122). Wrappers delegate. | 2026-07-17 |
| B3 Delete DataSourceManager + slim mw | ✅ | DELETED `config/datasource.manager.ts`; rewrote `middleware/institutionResolver.middleware.ts` (slim context-attacher, export name kept); repointed `auth.controller` (drop unused import), `auth.router` (getDataSourceFromRequest→AppDataSource), `index.ts` (shutdown→closeDatabase), `waSession.service` (`this.ds()`→AppDataSource, getRoutedInstitutionId→getInstitution), `waBot.provider` (→AppDataSource); comment fix in `database.config.ts` | tsc clean; nodemon on :3001 reloaded → `/health` 200 (⟹ boot cache-warm from DB succeeded); `/mainDiag`,`/calSurg/clerkProcs`,`/cand` no-token → clean 401 (no 500 from mw) | D1-A: kept `req.institutionDataSource` name (0 churn at 133 sites) + `req.institutionId`/`institutionDepartment` now derived constants. Middleware export name `institutionResolver` kept so ~30 routers untouched. Full authed data E2E deferred to B6. | 2026-07-17 |
| B4 Strip institutionId (auth/validators) | ✅ | `authToken.service.ts` (sign+signRefreshToken drop institutionId param+claim), `auth.controller.ts` (5 login payloads + refresh flow + import), `auth.router.ts` (log fragments + 2 register error msgs), `auth.interface.ts` (drop institutionId), validators clerkLogin/adminLogin/instituteAdminLogin/createCand (drop institutionId body rule) | tsc clean; standalone sign+decode → institutionId absent even when passed, departmentId=dept-123 kept | Old JWTs w/ institutionId still decode & authorize (nothing rejects on the claim). Left stale JSDoc "REQUIRES institutionId" comments (cosmetic). `req.institutionId` still attached by mw as constant — bundler/express.d.ts unaffected. | 2026-07-17 |
| B5 GET /institution endpoint | ✅ | `config/routes.config.ts` (inline public route, apiRateLimiter) | tsc clean; live `GET /institution` → 200 `{data:{id,code,name,department,isAcademic,isPractical,isClinical}}` all true | Public, no JWT (like /departments). Response uses the global `{status,statusCode,message,data}` wrapper — **frontend reads `.data`**. Inline route (no new DI/controller) since it's a trivial single read. | 2026-07-17 |
| B6 Env cleanup + backend verify | ✅ | `config/database.config.ts` (drop INSTITUTION_ID from required env) | Clean ts-node instance on :3010 → authed `/calSurg/clerkProcs` 200 with REAL KA data (titleAr/titleEn/CRAN), `/mainDiag` 200, `/institution` flags; :3001 public endpoints all 200, `/mainDiag` no-token 401 | **INSTITUTION_* env now inert** (DB is source of truth) — left in `.env.staging`, operator may prune. ⚠️ GOTCHA: writing temp scripts into the repo makes the user's **nodemon :3001 restart mid-request → HTTP 000** (looked like a crash; wasn't). Use ts-node on an alt port for authed tests; don't scribble temp files into the watched tree. | 2026-07-17 |
| F1 Fetch institution at bootstrap | ✅ | `utils/api.ts` (getInstitution()), `App.tsx` (bootstrap effect → selectInstitution) | tsc clean; vite build clean; backend `GET /institution` verified serving flags | DB-sourced flags now override STATIC_INSTITUTION at runtime; STATIC kept as offline/first-paint fallback. Uses existing local `Institution` type in api.ts. | 2026-07-17 |
| F2 Drop availableInstitutions array | ✅ | `authSlice.ts` (removed field+init); 8 login/signup pages use `selectedInstitution` (dropdowns removed) | tsc 0 + vite build 0 (self-verified); grep `availableInstitutions` → NONE | User chose "routes + array only". Signup institution dropdowns removed (dept picker is separate). ResetPasswordPage keeps inert `?institutionId` for the reset API (harmless). | 2026-07-17 |
| F3 Remove X-Institution-Id headers | ⏭️ | — | — | **SKIPPED per user decision** (inert; backend ignores it). Can revisit later. | 2026-07-17 |
| F4 Collapse :institutionId routes + redirects | ✅ | `App.tsx` (49 route segments stripped + 6 legacy redirects), new `components/LegacyInstitutionRedirect.tsx`, new `hooks/useInstitutionId.ts`, ~42 files nav-strings stripped, ~41 files `useParams`→`useInstitutionId()` | tsc 0 + vite build 0 (self-verified); residual `:institutionId` only in intended legacy redirects + cm/login; no `${institutionId}` navs left | Subagent did the mechanical sweep; I verified routing structure + build. RR v6 static>dynamic ranking makes param-free routes win, legacy id-URLs redirect. Dashboard-switcher id-guards now tautological (harmless). ⚠️ **Runtime SPA nav NOT click-tested from CLI — user should smoke-test i-admin/super-admin/cm dashboards.** | 2026-07-17 |
| F5 Remove institutionId from user/auth model | ✅ (mostly) | — | grep | User model already has NO institutionId; all 4 login methods already send only {email,password}. Residue: register methods send inert `body.institutionId` (backend ignores). | 2026-07-17 |

---

## Discovery findings (B0)

**Seed values (from `.env.staging`, = frontend `STATIC_INSTITUTION`):**
- `id` = `550e8400-e29b-41d4-a716-446655440000` (kept stable for JWT continuity)
- `code` = `cairo-university`
- `name` = `Kasr El Ainy / Cairo University`
- `department` = `neurosurgery`
- `isAcademic` / `isPractical` / `isClinical` = `true` / `true` / `true`
- `isActive` = `true`

**Backend scope (grounded 2026-07-17):**
- `req.institutionDataSource` reads: **133 call sites / 24 files** → D1-A keeps the name, changes the source.
- `req.institution*` reads: ~148 sites → `req.institution` stays (DB-backed flag carrier).
- `DataSourceManager` importers: auth.controller, auth.router, index, waBot.provider, waSession.service,
  institutionResolver.middleware, database.config, datasource.manager itself.
- `institution.service` importers: 13 files.
- JWT `institutionId`: `authToken.service.ts` `sign` + `signRefreshToken`.
- Validators w/ institutionId: clerkLogin, adminLogin, instituteAdminLogin, createCand, + auth.interface.

**Frontend scope:**
- `selectedInstitution`/`availableInstitutions`: 82 files. Flag reads (`isAcademic/isPractical/isClinical`): 44.
- `X-Institution-Id` in `src/utils/api.ts`: ~160 sites.
- `:institutionId` route params in `src/App.tsx`: i-admin, super-admin, cm dashboards.

---

## Session log (newest first)

- **2026-07-17** — B0 complete. Plan approved with D1-A/D3/D5. Discovery done (no institutionId FKs anywhere).
  Starting B1.
