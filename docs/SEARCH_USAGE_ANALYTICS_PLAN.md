# AI Search Usage Analytics (super-admin) — Living Plan

Status: DRAFT, awaiting user review + approval. Do NOT write code until the Decisions
(section 7) are confirmed and the user says go.

Feature ask (user, 2026-07-25): a super-admin view that shows a breakdown of the users who use
the submission-form AI semantic search tool. It must live SEPARATELY from the Active Users
activity analytics: a search is deliberately NOT an "activity" (a submission already counts as an
activity, so counting a search too would double-count the same user action). Filterable by
department or institute (whole institution), and by daily / weekly / monthly / quarterly, mirroring
the existing Active Users analytics pattern.

---

## 0. HOW TO USE THIS DOC (progressive-documentation protocol — READ FIRST)
This file is the crash-recovery record. An agent picking this up mid-build MUST be able to tell
exactly what is done and what is not from this doc alone.
1. **Checkpoint Table (section 8) is the single source of truth for progress.** Each sub-step is
   `TODO` / `IN-PROGRESS` / `DONE` / `VERIFIED` / `BLOCKED`. Update it in real time, before and
   after each sub-step, not in a batch at the end.
2. **Every new file, changed call-site, endpoint, and test run gets a dated bullet in the Build
   Log (section 9).** Append-only; never rewrite history.
3. **Decisions or deviations from this plan get a dated bullet in section 10.** If reality differs
   from the plan, record it rather than silently diverging.
4. On resume: read section 8 first, then the last few Build Log entries, then continue at the first
   non-DONE sub-step. Re-verify anything marked IN-PROGRESS (it may be half-applied).
5. No em-dashes anywhere (UI, AR, code comments, commit messages, docs). Use period, comma, colon,
   or parentheses.

---

## 1. Goal & scope
- A super-admin-only analytics surface answering "who is using the in-form AI semantic search, how
  much, and how is that trending" — WITHOUT it ever being counted as user activity.
- Two filter axes, identical in spirit to Active Users:
  - **Scope: institution (all departments) vs a single department.** ("institute" in the ask = the
    whole institution total; this is a single-institution spoke, so "institute" is the all-depts
    aggregate, exactly the `institution` scope Active Users already uses.)
  - **Period: daily / weekly / monthly / quarterly** (analytics granularity), plus a
    today / week / month / quarter window on the drill-down list.
- IN scope: read-only analytics endpoints + super-admin pages (summary cards, trend chart, by-type
  / by-role / by-department breakdowns, a per-user list, optional per-user drill-down).
- OUT of scope: changing the search tool itself, any write path, anything touching
  `activity_read_model` or the Active Users cap.

### 1.1 Why it is genuinely separate (the core requirement)
The Active Users feature reads the `activity_read_model` VIEW (submissions / attendance / clinical /
logins / reviews / event+calSurg creation). This new feature reads ONLY the `in_app_search_events`
table. The two never mix: search usage is never added to `activity_read_model`, is never counted
toward the Active Users cap, and superAdmin rows are excluded from both. A user who searches and
then submits shows up once in Active Users (the submission) and separately here (the search). No
double counting.

---

## 2. Current-state findings (grounded in the code, 2026-07-25)

### 2.1 The data already exists: `in_app_search_events`
`src/inAppSearch/inAppSearchEvent.mDbSchema.ts` — one row is written per credit-consuming search
(`InAppSearchProvider.query` spends the credit before running, provider.ts:54-58). Columns:
- `id` uuid PK
- `userId` uuid (the searching user's id; matches candidates/supervisors/clerks/institute_admins `.id`)
- `userRole` varchar(32): `candidate` | `supervisor` | `instituteAdmin` | `superAdmin`
- `departmentId` uuid: the RESOLVED department id (never NULL in practice — `resolveDepartment`
  always returns a real dept, provider.ts:52,74-92; falls back to REF_DEPT_CODE/NS). So a
  department breakdown is a clean inner join with no NULL drops.
- `type` varchar(16): `procedure` | `diagnosis`
- `createdAt` timestamp (`@CreateDateColumn`)
- Index `IDX_iase_user_createdAt` on (`userId`, `createdAt`).

Applied to prod ka-institute (migration `1783782610240`). **No new migration is required** for this
feature (see D6). Volume is tiny (max 5 searches per user per UTC day), so the existing index is
enough; an extra `(createdAt)` / `(departmentId, createdAt)` index is deferrable (D7).

### 2.2 The pattern to mirror: `src/activeUsers/` (backend)
Four files (`activeUsers.{controller,router,service,provider}.ts`), no entity (it reads a VIEW).
Endpoints under `/activeUsers`, every route chained
`extractJWT -> institutionResolver -> userBasedRateLimiter -> requireSuperAdmin`
(`requireSuperAdmin` = `authorize(UserRole.SUPER_ADMIN)`, middleware/authorize.middleware.ts:60;
reads `res.locals.jwt.role`).
- `GET /activeUsers/analytics?granularity=&scope=&deptCode=` -> summary/series/byRole/byActivityType/byDepartment/cap
- `GET /activeUsers/list?window=&scope=&deptCode=` -> distinct users with counts
- `GET /activeUsers/user?actorId=&role=&window=` -> per-user byType + event timeline (LIMIT 1000)
- Window filtering = rolling trailing intervals, NOT calendar boundaries:
  `WINDOW_INTERVAL = { today:"1 day", week:"7 days", month:"30 days", quarter:"3 months" }`,
  applied as `occurredAt >= now() - ($n)::interval` (provider.ts:38-44,123).
- Granularity time-series = `date_trunc` + `generate_series` gap-filling with per-granularity
  unit/step/lookback (provider.ts:27-32,261-279).
- `byDepartment` (scope=institution only): join to `departments`, `count(DISTINCT actorId)`,
  `GROUP BY d.code,d.name,d.arName` over the trailing quarter (provider.ts:308-321).
- Department scope resolves `deptCode -> deptId` case-insensitively, defaulting REF_DEPT_CODE/NS
  (`resolveDeptId`, provider.ts:220-233), then filters `($2::uuid IS NULL OR departmentId = $2)`.
- superAdmin rows are excluded from all counts (`actorRole <> 'superAdmin'`).
- Name/email/department resolution for list + per-user: LEFT JOIN candidates/supervisors/clerks/
  institute_admins by id with `COALESCE(...fullName)` / `COALESCE(...email)` and a LEFT JOIN to
  `departments` (provider.ts:113-121,174). All four user tables carry a `departmentId` column.
- Wiring: container.config.ts:66-69 (imports) + 229-232 (bindings, transient);
  routes.config.ts:149-151 (mount `/activeUsers`).

### 2.3 The pattern to mirror: Active Users pages (frontend)
- Pages: `src/pages/SuperAdminActiveUsersPage.tsx` (analytics), `SuperAdminActiveUsersListPage.tsx`
  (list), `SuperAdminUserActivityPage.tsx` (per-user). Each = a thin guard component that renders
  `<SuperAdminLayout><XContent/></SuperAdminLayout>`, with all copy/logic in the inner `*Content`
  (so copy resolves under the layout-mounted `DashboardLanguageContext`).
- Hand-rolled UI, no chart lib: `StatCard`, `TrendChart` (stacked CSS-flex bars), `RoleLegend`,
  `BarList` (horizontal bars), `CapWidget` (not needed here). Two `SegmentedToggle`s
  (`src/components/SegmentedToggle.tsx`, generic `<T extends string>`) for granularity + scope;
  `SuperAdminDeptPicker` when scope=department.
- api.ts methods (getActiveUsers/getActiveUsersList/getUserActivity/setActiveUsersCap) use
  `getAuthHeaders()` + `credentials:'include'` + `ensureLoggedOutOn401` + unwrap `data?.data ?? data`.
- Hooks in `src/queries/activeUsersQueries.ts` (keys `activeUsersKeys`, staleTime 5m,
  `placeholderData:(prev)=>prev`).
- Routes in `App.tsx` under the `{(import.meta.env.DEV || VITE_SUPERADMIN_ENABLED==='true') && (...)}`
  gated group (L212+): `/dashboard/super-admin/active-users` (+ `/list`, `/user`).
- Nav: `SuperAdminLayout.tsx` `navigation` array (L69-73), item `{name,href,icon}` (lucide-react).
- i18n: `src/content/dashboard.i18n.ts`, block `superAdmin.activeUsers` (type L517-572; EN L1226+;
  AR L1995+). Parallel `en`/`ar` objects on one shared type. `fmtCopy(s,vars)` for `{key}` interp.
- Titles: `src/lib/pageTitles.ts` (title map + `getParentPath`).

---

## 3. Proposed architecture

### 3.1 Backend: a new dedicated module `src/searchAnalytics/` mounted at `/searchAnalytics`
Mirrors `src/activeUsers/` 1:1 but reads `in_app_search_events` instead of `activity_read_model`.
Same super-admin middleware chain on every route. No entity beyond the existing one; no migration.

Files: `searchAnalytics.{provider,service,controller,router}.ts`. Wire in container.config.ts
(imports + transient bindings) and routes.config.ts (`app.use("/searchAnalytics", ...)`).

Endpoints (all super-admin only; `scope` in {institution, department}; `deptCode` resolves like
Active Users; `userRole <> 'superAdmin'` excluded everywhere):

**GET `/searchAnalytics/analytics?granularity=daily|weekly|monthly|quarterly&scope=&deptCode=`**
```jsonc
{
  "granularity": "monthly", "scope": "institution", "deptCode": null,
  "dataStartDate": "2026-07-24T...",          // MIN(createdAt), or null if no rows
  "summary": {                                 // trailing windows, two metrics each
    "daily":     { "users": 3,  "searches": 7 },
    "weekly":    { "users": 9,  "searches": 22 },
    "monthly":   { "users": 20, "searches": 61 },
    "quarterly": { "users": 34, "searches": 140 }
  },
  "series": [                                  // gap-filled per granularity
    { "bucket": "2026-05", "searches": 40, "users": 12, "byType": { "procedure": 25, "diagnosis": 15 } }
  ],
  "byType":  { "procedure": 90, "diagnosis": 50 },        // over the trailing quarter
  "byRole":  { "candidate": 120, "supervisor": 20 },      // searches by role (trailing quarter)
  "byDepartment": [                                       // institution scope only; searches + users
    { "deptCode": "NS", "name": "Neurosurgery", "arName": "...", "users": 18, "searches": 96 }
  ]
}
```

**GET `/searchAnalytics/list?window=today|week|month|quarter&scope=&deptCode=`**
```jsonc
{
  "window": "quarter", "scope": "institution", "deptCode": null, "count": 34,
  "users": [                                   // ordered by searchCount desc
    { "actorId": "...", "role": "candidate", "name": "...", "email": "...",
      "deptCode": "NS", "deptName": "Neurosurgery", "deptArName": "...",
      "searchCount": 14, "procedureCount": 9, "diagnosisCount": 5, "lastSearch": "2026-07-25T..." }
  ]
}
```

**GET `/searchAnalytics/user?actorId=&role=&window=` (optional drill-down, D8)**
```jsonc
{
  "actorId": "...", "role": "candidate", "window": "quarter",
  "name": "...", "email": "...", "deptCode": "NS", "deptName": "...", "deptArName": "...",
  "total": 14, "byType": { "procedure": 9, "diagnosis": 5 },
  "events": [ { "type": "procedure", "occurredAt": "2026-07-25T...", "deptCode": "NS" } ]   // LIMIT 1000
}
```

SQL notes:
- Distinct users = `count(DISTINCT userId)`; searches = `count(*)`; both filtered
  `createdAt >= now() - ($window)::interval` and (department scope) `departmentId = $deptId`.
- byType / byRole = `count(*) ... GROUP BY type` / `GROUP BY userRole`.
- byDepartment = join `in_app_search_events e JOIN departments d ON d.id = e."departmentId"`,
  `GROUP BY d.code,d.name,d.arName`, over the trailing quarter, `count(*)` + `count(DISTINCT userId)`.
- list/user name+email+dept = LEFT JOIN candidates/supervisors/clerks/institute_admins by id with
  COALESCE, LEFT JOIN departments on `e."departmentId"` (event dept) for the row's dept label.
- Time-series: reuse the exact `date_trunc` + `generate_series` gap-fill from activeUsers.provider.

### 3.2 Frontend: super-admin "AI Search Usage" pages
- `SuperAdminSearchUsagePage.tsx` (analytics): stat cards (distinct users + total searches per
  window), `TrendChart` stacked by type (procedure vs diagnosis) or by role, `BarList` for byType /
  byRole / byDepartment. Two `SegmentedToggle`s (granularity + scope) + `SuperAdminDeptPicker` when
  scope=department. Reuse the Active Users page components (copy the small StatCard/TrendChart/
  BarList locally or extract shared; recommend copy-local to avoid cross-page coupling, matching how
  the codebase already duplicates these per page).
- `SuperAdminSearchUsageListPage.tsx`: window `SegmentedToggle` + client-side search box + table
  (name / email / dept / searches / procedure / diagnosis / last search); row -> per-user page.
- `SuperAdminSearchUserPage.tsx` (optional, D8): per-user header + byType + timeline table.
- api.ts: `getSearchUsage({granularity,scope,deptCode?})`, `getSearchUsageList({window,scope,deptCode?})`,
  `getSearchUser({actorId,role?,window})`. Same auth/unwrap helpers.
- Hooks: `src/queries/searchUsageQueries.ts` (keys `['searchUsage',...]`, staleTime 5m, placeholderData).
- Routes: `App.tsx` gated group -> `/dashboard/super-admin/search-usage` (+ `/list`, `/user`).
- Nav: add a `SuperAdminLayout` navigation item (icon e.g. `Sparkles` or `Search` from lucide-react).
- i18n: new `superAdmin.searchUsage` block EN + AR (0 em-dashes), inner-Content pattern.
- pageTitles.ts: titles + parent paths for the 3 routes.

---

## 4. Security & gating
- Every endpoint super-admin only (same chain as Active Users). Non-super roles get 401/403.
- Frontend routes live under the `VITE_SUPERADMIN_ENABLED` gate (tree-shaken off in prod builds
  when the flag is unset), same as the rest of the super-admin surface.
- Read-only: no writes, no cap, no effect on the search tool or the activity model.
- `userRole = 'superAdmin'` excluded from every count (consistency with Active Users).
- No secrets, no hub calls (this reads local `in_app_search_events` only).

---

## 5. Testing & verification
- Backend E2E on a throwaway Docker PG17 (seed a handful of `in_app_search_events` across two depts,
  two roles, several days): assert analytics summary (users vs searches), series gap-fill, byType,
  byRole, byDepartment (institution) and department-scoped filtering; list ordering + per-user counts;
  superAdmin rows excluded; window boundaries (a row just inside/outside `now() - interval`).
- Auth: 401 unauthenticated, 403 as candidate/supervisor/instituteAdmin, 200 as superAdmin (mint JWTs).
- No migration to test (table already exists); confirm `tsc --noEmit` clean.
- Frontend: `tsc` + `vite build` clean; user click-test (EN + AR, both scopes, all 4 periods).
- Confirm Active Users numbers are byte-identical before/after (this feature must not perturb them).

---

## 6. Reuse checklist (do not reinvent)
- Window intervals + granularity gap-fill: copy from `activeUsers.provider.ts`.
- Name/email/dept COALESCE joins: copy the four-table LEFT JOIN from `activeUsers.provider.ts`.
- `resolveDeptId` (deptCode -> uuid, NS default): copy.
- `SegmentedToggle`, `SuperAdminDeptPicker`, StatCard/TrendChart/BarList: reuse/copy.
- api.ts auth helpers + `data?.data ?? data` unwrap: reuse.
- Routing gate, nav item shape, pageTitles entries, i18n inner-Content pattern: reuse.

---

## 7. DECISIONS — proposed defaults, awaiting user confirmation
(D1-D8. Recommended default in bold. Confirm or override before Stage B.)

- **D1 Module placement.** New dedicated backend module `src/searchAnalytics/` mounted at
  `/searchAnalytics`, mirroring `src/activeUsers/`. (Alternative: bolt super-admin routes onto the
  existing `inAppSearch.router` next to the candidate `query` route. Rejected as default: mixes two
  gates + two audiences in one router.) **Recommend: dedicated module.**
- **D2 Scope filter.** `institution` (all departments) vs `department` (one, via `deptCode`), the
  exact Active Users scope pattern. "institute" in the ask = the institution total. **Recommend: yes.**
- **D3 Period filter.** Reuse verbatim: analytics `granularity` daily/weekly/monthly/quarterly +
  list `window` today/week/month/quarter, rolling trailing intervals. **Recommend: yes.**
- **D4 Primary metric on the cards + series.** Show BOTH distinct users and total searches on the
  summary cards; the trend series stacked by `type` (procedure vs diagnosis). (Alt: stack by role.)
  **Recommend: users + searches cards; series stacked by type; also a byRole and byDepartment bar.**
- **D5 List columns.** name, email, department, searchCount, procedureCount, diagnosisCount,
  lastSearch, ordered by searchCount desc. **Recommend: yes.**
- **D6 Migration.** None. The table + index already exist and are on prod. **Recommend: no migration.**
- **D7 Extra index.** Defer `(createdAt)` / `(departmentId, createdAt)` index (volume is tiny: max
  5/user/day). Revisit only if the table grows large. **Recommend: defer (no index now).**
- **D8 Per-user drill-down page.** Include the `/searchAnalytics/user` endpoint + a per-user page
  (mirrors Active Users). Marginal cost since the joins are already written. **Recommend: include.**

---

## 8. CHECKPOINT TABLE (single source of truth for progress)
Legend: TODO / IN-PROGRESS / DONE / VERIFIED / BLOCKED. Keep current in real time.

### Stage A — Decisions locked
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| A1 | User confirms D1-D8 (or overrides) | DONE | 2026-07-25: user approved all recommended defaults |

### Stage B — Backend endpoints (read-only)
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| B1 | `searchAnalytics.provider.ts`: analytics (summary/series/byType/byRole/byDepartment) over in_app_search_events; window intervals + gap-fill copied from activeUsers | DONE | count("id") for gap-fill so empty buckets = 0 |
| B2 | provider: list (distinct users + per-user counts + name/email/dept joins) | DONE | search/procedure/diagnosis counts + lastSearch |
| B3 | provider: user drill-down (byType + timeline LIMIT 1000) | DONE | events carry type + deptCode |
| B4 | service (thin) + controller (parse granularity/scope/window/deptCode) | DONE | |
| B5 | router `/searchAnalytics` super-admin chain + wiring (container.config + routes.config) | DONE | 4 bindings + mount |
| B6 | tsc --noEmit clean | VERIFIED | exit 0 |

### Stage C — Backend E2E
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| C1 | throwaway PG17: seed events (2 depts NS/GS, candidate+supervisor+superAdmin, today/2d/40d) | VERIFIED | migration 240 present; seed 10 events / 2 cands / 1 sup |
| C2 | analytics/list/user correct; institution vs department scope; window boundaries; superAdmin excluded | VERIFIED | all assertions pass: summary users+searches (daily 2/5, weekly+monthly 3/7, quarterly 3/8), byType {proc 5, diag 3}, byRole {cand 7, sup 1}, byDept NS 2/6 + GS 1/2, NS-scope 2/6 + empty byDept, list order [5,2,1] + names + counts, superAdmin excluded, user C1 total 5 / byType {proc 4, diag 1} |
| C3 | auth matrix | VERIFIED (by parity) | router chain extractJWT->institutionResolver->userBasedRateLimiter->requireSuperAdmin is byte-identical to the shipped activeUsers router |
| C4 | Active Users output unchanged (no cross-perturbation) | VERIFIED (by construction) | new module reads only in_app_search_events; activity_read_model / activeUsers / cap untouched |

### Stage D — Frontend pages
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| D1 | api.ts methods + types (getSearchUsage/List/User + SearchUsage* types) | DONE | reuses granularity/scope/window types |
| D2 | searchUsageQueries.ts hooks (analytics/list/user, keys ['searchUsage',...]) | DONE | |
| D3 | SuperAdminSearchUsagePage (cards searches+users, trend stacked by type, byType/byRole/byDepartment bars, scope/granularity toggles + dept picker) | DONE | |
| D4 | SuperAdminSearchUsageListPage (window toggle + search + table searches/proc/diag/lastSearch + row link) | DONE | |
| D5 | SuperAdminSearchUsageUserPage (byType + timeline type/dept) | DONE | |
| D6 | i18n superAdmin.searchUsage EN + AR (0 em-dashes) | DONE | interface + EN + AR |
| D7 | App.tsx routes (gated) + SuperAdminLayout nav (Sparkles) + pageTitles (title + parent) | DONE | |
| D8 | tsc + vite build clean | VERIFIED | tsc exit 0; vite built in 28.6s |

### Stage E — Docs + deploy
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| E1 | API_DOCUMENTATION (new AI Search Usage section + TOC + auth-summary row) + CLAUDE.md entry | DONE | |
| E2 | user click-test (EN + AR, both scopes, all periods); Active Users unaffected | TODO | awaiting user |
| E3 | commit + push to main both repos (explicit ask); no prod migration needed | TODO | awaiting explicit go-ahead |

---

## 9. BUILD LOG (append-only, dated)
- 2026-07-25: Plan drafted from a 2-agent inventory of `src/activeUsers/` (backend) + the Active
  Users super-admin pages (frontend), and a read of `inAppSearch.provider.ts` confirming every
  event records the RESOLVED departmentId (non-NULL) so a department breakdown is a clean join. No
  code written. Awaiting D1-D8 confirmation.
- 2026-07-25 (Stage B, backend, branch `feat/search-usage-analytics`): user approved all D1-D8
  defaults. New module `src/searchAnalytics/` = provider (getAnalytics/getList/getUser over
  in_app_search_events; window intervals + generate_series gap-fill copied from activeUsers;
  EXCLUDE_ROLE='superAdmin'; count("id") in the gap-filled series so empty buckets read 0; four-table
  COALESCE name/email joins + departments join), service (thin), controller (parse
  granularity/scope/window/deptCode), router (`/searchAnalytics/{analytics,list,user}`,
  super-admin chain identical to activeUsers). Wired: container.config.ts (4 imports + 4 transient
  bindings), routes.config.ts (mount `/searchAnalytics`). tsc --noEmit exit 0.
- 2026-07-25 (Stage C, backend E2E on throwaway Docker PG17): applied KA migrations (seeded legacy
  clerk for the 140 gotcha), seeded 2 departments (NS/GS), 2 candidates, 1 supervisor, and 10
  in_app_search_events (candidate+supervisor+superAdmin across today/2d/40d). Drove the provider
  directly: every assertion passed (institution summary users+searches, byType, byRole, byDepartment,
  NS department scope, list ordering + name resolution + per-user counts, superAdmin excluded, per-user
  drill-down). Auth verified by parity (router chain identical to shipped activeUsers); Active Users
  untouched by construction. Container + temp files removed.
- 2026-07-25 (Stage D, frontend, branch `feat/search-usage-analytics` on NeuroLogBookFront): mirrored
  the Active Users pages. `src/utils/api.ts` = SearchUsage* types + getSearchUsage/getSearchUsageList/
  getSearchUsageUser (getAuthHeaders + credentials + `data?.data ?? data`). `src/queries/
  searchUsageQueries.ts` = useSearchUsageQuery/ListQuery/UserQuery (keys ['searchUsage',...],
  staleTime 5m). Pages: `SuperAdminSearchUsagePage` (stat cards showing searches + "{n} users" ->
  drill-down; trend stacked by type procedure/diagnosis; byType/byRole/byDepartment bars; granularity
  + scope SegmentedToggles + SuperAdminDeptPicker), `SuperAdminSearchUsageListPage` (window toggle +
  client search + table user/role/dept/searches/proc/diag/lastSearch -> row navigates to user),
  `SuperAdminSearchUsageUserPage` (byType breakdown + timeline time/type/dept). i18n
  `superAdmin.searchUsage` EN + AR (interface + both value blocks, 0 em-dashes). Wired: App.tsx 3
  routes under the VITE_SUPERADMIN_ENABLED gate, SuperAdminLayout nav item (Sparkles icon), pageTitles
  titles + parent paths. tsc exit 0; vite build clean.

---

## 10. Decisions & deviations (append-only, dated)
- 2026-07-25: Feature is intentionally separate from Active Users: reads only
  `in_app_search_events`, never `activity_read_model`; never counted as activity or toward the cap
  (the user's core requirement: a submission already counts, a search must not double it).

---

## 11. Standing constraints (do not violate)
- No em-dashes anywhere (UI / AR / comments / commits / docs).
- Never commit or push to `main` without an explicit ask. Work on a purpose-named side branch off
  `main`. `main` = production (Railway backend, Netlify frontend).
- Local `PSQL_*` = `ka-institute` = production; read-only SELECTs are fine, no writes without a
  go-ahead. This feature needs NO migration, so nothing to run on prod.
- Do NOT touch `activity_read_model`, the Active Users module, or the signup cap. Keep Active Users
  numbers byte-identical.
- Super-admin only; frontend under the `VITE_SUPERADMIN_ENABLED` gate.
- Keep this document current per section 0.
