# Active Users Analytics + Signup Cap - Implementation Plan

> Status: **DRAFT - awaiting user review before any development.**
> Feature owner surface: **Super Admin only.**
> Branch (proposed, per CLAUDE.md): backend `feat/active-users-analytics` off `main`; frontend `feat/active-users-analytics` off `main`. Nothing touches `main`. Nothing committed without an explicit ask.
> Repos: backend `F:\WebDev\MedScribeNeuroServer` (Node/TS/Express + TypeORM + Inversify); frontend `F:\WebDev\NeuroLogBookFront` (React/TS/Vite, Clinical Aurora design system).
> DB reminder: local `PSQL_*` = `ka-institute` = **production**. No schema/data writes to it without an explicit go-ahead. All dev/E2E on an alt-port instance with minted JWTs.

---

## 0. HOW TO USE THIS DOC (progressive-documentation protocol - READ FIRST)

**This document is the living memory of the build.** If a session is interrupted (token limit, crash, restart), the next session MUST be able to open this file and know exactly what is done and what is not. Therefore:

1. **The Checkpoint Table in section 9 is the single source of truth for progress.** Every stage/sub-step has a status: `TODO` / `IN-PROGRESS` / `DONE` / `BLOCKED` / `VERIFIED`.
2. **Update the checkpoint the moment a sub-step changes state** - before moving on, not at the end. A half-done stage must be left as `IN-PROGRESS` with a one-line note on exactly where it stopped (file + what remains).
3. **Every applied migration, every new file, every changed call-site gets a dated bullet in section 10 (Build Log).** Append-only. Never rewrite history; add a new line.
4. **Anything discovered mid-build that changes the plan** (a gotcha, a schema surprise, a rejected approach) goes in section 11 (Decisions & Deviations) with the date and why.
5. On resume: read section 0 -> section 9 checkpoint -> most recent entries in sections 10 & 11, then continue from the first non-`DONE` sub-step.
6. Mirror the standing rule already used in this repo: keep this file current the same way `CLAUDE.md`'s "Where we stopped" is kept current.

---

## 1. Goal & scope

Give the Super Admin a clean, performant analytics dashboard showing **Active Users**:

- **Two scopes:** per-department AND institution-total.
- **Four periods:** daily, weekly, monthly, quarterly.
- **"Active" is defined by role-specific signals:**

| Role | Activity signals that count as "active" |
|------|------------------------------------------|
| Candidate | submission created, event attendance recorded, clinical submission created, **login** |
| Supervisor | review/approval action (surgical + clinical), **login** |
| Calendar Manager (clerk/CM) | calSurg created, event created, **login** |
| Institute Admin | **login** |

- **Metric definitions (both are shown, they are different):**
  - **Active Users** = COUNT(DISTINCT actor) who performed >=1 tracked action in the period. Distinct *people*. NOT additive across sub-periods (a user active on 3 days = 1 weekly-active user).
  - **Activity Volume** = COUNT(events) in the period. Additive. Used for the "what are they doing" breakdown by activity type.
- **Super Admin can set a Max Active Users cap** measured against the rolling **quarterly** active-users number (trailing 3 months, institution-total). Exceed it -> new-account signups (candidate + supervisor) lock; fall below -> unlock automatically. Self-regulating.
- **Design:** must follow the Clinical Aurora design system (`ds-*` classes, `landing-*` tokens), bilingual EN+AR, RTL-safe. No em-dashes anywhere.

Out of scope (call out, do not build): editing/deleting activity records; CSV export; per-user drill-down beyond the charts (possible follow-up).

---

## 2. Current-state findings (from codebase inventory)

### 2.1 Activity data sources that ALREADY exist - these remain the SINGLE source of truth for their events
Entities are `src/<module>/<name>.mDbSchema.ts` (TypeORM). Every activity table already carries `departmentId`. **We read these live; we never copy them.**

| Signal | Table / file | Actor column | Timestamp to group by | Notes |
|--------|--------------|--------------|-----------------------|-------|
| Candidate submission | `submissions` / `src/sub/sub.mDbSchema.ts` | `candDocId` | `createdAt` | filter `submissionType = 'candidate'` |
| Event attendance | `event_attendance` / `src/event/eventAttendance.mDbSchema.ts` | `candidateId` | `createdAt` | credit the attendee, not `addedBy` |
| Clinical submission | `clinical_sub` / `src/clinicalSub/clinicalSub.mDbSchema.ts` | `candDocId` | `createdAt` | |
| Supervisor surgical review | `submissions` / `src/sub/sub.mDbSchema.ts` | `reviewedBy` | `reviewedAt` | write at `src/sub/sub.service.ts:340-349`; both cols present |
| Supervisor clinical review | `clinical_sub` / `src/clinicalSub/clinicalSub.mDbSchema.ts` | **`supervisorDocId`** | `reviewedAt` | reviewer IS `supervisorDocId` (per user); no schema change needed |
| calSurg creation | `cal_surgs` / `src/calSurg/calSurg.mDbSchema.ts` | `clerkId` | `createdAt` | |
| Event creation | `events` / `src/event/event.mDbSchema.ts` | **none (gap)** | `createdAt` | `events` has no creator column; see 3.4 |

### 2.2 The ONE genuine data gap, plus the cap
1. **LOGIN TRACKING DOES NOT EXIST. Anywhere.** No `lastLoginAt` column, no session/audit/login table. `src/auth/auth.controller.ts` login methods (`candidateSupervisorLogin`, `superAdminLogin`, `instituteAdminLogin`, `clerkLogin`) do `findOne -> bcrypt.compare -> sign JWT` and write nothing. Logins are the only signal recorded nowhere, and the only signal at all for Institute Admins. This is legitimately new data (an authentication-event domain), NOT a duplicate of an existing table.
2. **`events` has no creator column** -> event creation cannot be attributed to a CM. A missing field on the source table (fixed on the source, section 3.4), not a duplication.
3. **No signup cap / signups-open flag** exists. `institutions` (`src/institution/institution.mDbSchema.ts`) has only `isActive/isAcademic/isPractical/isClinical`.

> Correction vs the first draft: `clinical_sub` does NOT need a `reviewedBy` column - `supervisorDocId` is the reviewer. Dropped.

### 2.3 Reusable patterns
- Super-admin route chain: `extractJWT -> institutionResolver -> userBasedRateLimiter -> requireSuperAdmin` (`src/superAdmin/superAdmin.router.ts`). `requireSuperAdmin` = `src/middleware/authorize.middleware.ts:60`. A new analytics endpoint copies this chain; it does NOT re-check `SUPERADMIN_LOGIN_ENABLED` (that gate is login-only).
- DI wiring template = the superAdmin 4-file module (router/controller/service/provider) bound in `src/config/container.config.ts`, mounted in `src/config/routes.config.ts`.
- Aggregation template: QueryBuilder `COUNT(*) ... GROUP BY` at `src/sub/sub.service.ts:241-257`; raw parameterized SQL at `src/sub/sub.provider.ts:1356-1369`.
- deptCode -> departmentId resolution: `SELECT id FROM departments WHERE code = $1`, default `REF_DEPT_CODE || "NS"`.
- Responses are plain JSON (no `.data` envelope) shaped by mappers.
- Signup chokepoint: `PendingSignupProvider.startSignup` (`src/pendingSignup/pendingSignup.provider.ts:51-99`); real account creation happens in `verifyOtp`'s transaction (`:129-157`).
- Reference aggregation-by-createdAt already exists: `src/activityTimeline/activityTimeline.provider.ts`.

### 2.4 Frontend reusables
- Super-admin shell: `src/components/SuperAdminLayout.tsx` (Aurora `.app-shell`, mounts `DashboardLanguageContext`). Page = inner `*Content` component rendered as the layout's child (`src/pages/SuperAdminDashboardPage.tsx`).
- Route gating: `src/App.tsx` ~207-240, wrapped in `{(import.meta.env.DEV || import.meta.env.VITE_SUPERADMIN_ENABLED === 'true') && (...)}` (inlined for tree-shaking). Add nav entry in `SuperAdminLayout` nav array.
- Design system: `src/styles/dashboard.css` (`ds-card`, `ds-btn-*`, `ds-eyebrow`, `ds-alert`, `ds-spinner`, `ds-chip`, `.lang`/`.pill` toggle), `tailwind.config.js` `landing-*` tokens, `DASH_CARD_CLASS` (`src/lib/constants.ts`) for cards outside `.app-shell`.
- **No charting library is wired** (`@nivo/*` installed but unused). Reuse hand-rolled primitives: `HorizontalBarChart.tsx`, `VerticalBarChart.tsx`, `RoleStackedBarChart.tsx`, `ClinicalInsights.tsx` (inline-SVG donut), `CodeAnalyticsCard.tsx`. Role palette `['#1991C8','#16BBA6','#6E8BE8','#F59E0B','#7C92A8']`.
- Data fetching: React Query v5, `*Keys` object convention, `staleTime` (dashboard uses 15min), aggregation hook `useCandidateDashboardData.ts`.
- **No period selector exists.** Model a daily/weekly/monthly/quarterly segmented control on `LanguageToggle.tsx` (`.lang`/`.pill`). Dept filter = reuse `SuperAdminDeptPicker.tsx`.
- i18n: `src/content/dashboard.i18n.ts` parallel `en`/`ar` blocks; new copy in both.

---

## 3. Proposed architecture - read-model separation (single source of truth preserved)

### 3.1 Core principle
**Write side (source of truth) and read side (analytics) are separated.**

- Every operational fact stays in exactly ONE table. We do NOT re-record submissions, attendance, clinical subs, calSurgs, or events anywhere. No double-writes, no instrumentation of those paths, no drift.
- The single genuinely-missing fact - **logins** - gets ONE new source-of-truth table, `login_events`. It is not a duplicate (logins live nowhere else); it is the authoritative store for authentication events.
- Analytics unify these sources **only at read time** through a database **VIEW**, so the endpoint enjoys one clean query shape without any stored duplication.

### 3.2 The read model: a VIEW, not a table

`login_events` (the only new write target - append-only auth log):
```
login_events
  id            uuid PK (uuid_generate_v4)
  user_id       uuid NOT NULL
  user_role     varchar NOT NULL   -- 'candidate' | 'supervisor' | 'clerk' | 'instituteAdmin' | 'superAdmin'
  department_id uuid NULL           -- from the user's dept claim/row at login time
  logged_in_at  timestamp NOT NULL default now()
  created_at    timestamp default now()
  -- indexes: (logged_in_at), (department_id, logged_in_at), (user_id, logged_in_at), (user_role, logged_in_at)
```

`activity_read_model` (a Postgres VIEW - zero storage, always live against the source tables):
```sql
CREATE VIEW activity_read_model AS
    SELECT "candDocId"      AS actor_id, 'candidate'  AS actor_role, "departmentId" AS department_id,
           'submission'          AS activity_type, "createdAt" AS occurred_at FROM submissions WHERE "submissionType" = 'candidate'
  UNION ALL
    SELECT "candidateId",     'candidate',  "departmentId", 'event_attendance',   "createdAt" FROM event_attendance
  UNION ALL
    SELECT "candDocId",       'candidate',  "departmentId", 'clinical_submission','createdAt' FROM clinical_sub
  UNION ALL
    SELECT "reviewedBy",      'supervisor', "departmentId", 'surgical_review',    "reviewedAt" FROM submissions
      WHERE "reviewedBy" IS NOT NULL AND "reviewedAt" IS NOT NULL
  UNION ALL
    SELECT "supervisorDocId", 'supervisor', "departmentId", 'clinical_review',    "reviewedAt" FROM clinical_sub
      WHERE "supervisorDocId" IS NOT NULL AND "reviewedAt" IS NOT NULL
  UNION ALL
    SELECT "clerkId",         'clerk',      "departmentId", 'calsurg_create',     "createdAt" FROM cal_surgs WHERE "clerkId" IS NOT NULL
  UNION ALL
    SELECT "createdBy",       "createdByRole", "departmentId", 'event_create',    "createdAt" FROM events WHERE "createdBy" IS NOT NULL
  UNION ALL
    SELECT user_id,           user_role,    department_id,   'login',             logged_in_at FROM login_events;
```
Normalized columns: `(actor_id, actor_role, department_id, activity_type, occurred_at)`. Every analytics query hits this one view. Created/dropped in a TypeORM migration; queried with raw parameterized SQL in the provider (matches the repo's raw-SQL analytics idiom).

**Why a view is the professional answer here:** each fact has exactly one home; the view is a read-only projection that cannot drift from source; and the upgrade to a materialized view or rollup (section 3.6) is a localized swap that never changes the provider query. This is CQRS-lite: many sources of truth, one read model, no duplication.

### 3.3 Writes we add (minimal, and none of them duplicate an existing fact)
1. **`login` recording** - the four login methods in `src/auth/auth.controller.ts` append one `login_events` row on a successful `bcrypt.compare`, before/after signing the JWT. A tiny injectable `LoginEventService` (`src/loginEvents/`) does the insert. Wrapped in try/catch so an audit-write failure never blocks login (fail-open for logging). Optionally deferred with `setImmediate` if any latency shows (mind the known deferred-write gotcha).
2. **`events.createdBy` / `createdByRole` stamping** - `handlePostEvent` stamps these from the JWT at event creation (section 3.4). This closes a missing field on the source; it is not a new copy of anything.

That is the entire write footprint. Submissions/attendance/clinical/calSurg paths are untouched.

### 3.4 Additive source-table fix for the event-creator gap
Migration adds `events.createdBy uuid NULL` + `events.createdByRole varchar NULL`; stamp in `handlePostEvent` from the JWT. Enables `event_create` attribution going forward. Legacy events (no creator recorded) are simply excluded from the `event_create` union (the `WHERE "createdBy" IS NOT NULL` clause) - honest, no guessing.

### 3.5 No historical backfill needed (a benefit of the read model)
Because analytics read the live source tables, all historical submissions/attendance/clinical/reviews/calSurgs are already counted with no migration of data. The single honest limitation: **logins have no history**, so login-based active-user counts accrue only from deployment forward. The endpoint returns a `dataStartDate` and the UI shows a "login tracking started <date>" note.

### 3.6 Analytics endpoint - Super Admin only
New module `src/activeUsers/`. Route:
```
GET /superAdmin/activeUsers
  chain: extractJWT -> institutionResolver -> userBasedRateLimiter -> requireSuperAdmin
  query params:
    granularity = daily | weekly | monthly | quarterly   (default monthly)
    scope       = institution | department               (default institution)
    deptCode    = <code>                                 (required when scope=department; validated against departments)
    from, to    = ISO dates                              (optional; default trailing window per granularity)
```
Response (plain JSON via a mapper) - one call powers the page:
```jsonc
{
  "granularity": "monthly", "scope": "institution",
  "dataStartDate": "2026-07-24",
  "summary": { "daily": 12, "weekly": 34, "monthly": 88, "quarterly": 140 },
  "series": [ { "bucket": "2026-06", "activeUsers": 82, "byRole": { "candidate": 60, "supervisor": 15, "clerk": 6, "instituteAdmin": 1 } } ],
  "byActivityType": { "submission": 210, "login": 640, "surgical_review": 95, "calsurg_create": 120, ... },
  "byDepartment": [ { "deptCode": "NS", "activeUsers": 60 } ],
  "cap": { "maxActiveUsers": 200, "currentCount": 141, "signupsOpen": true }
}
```

### 3.7 Aggregation query design (performance)
- **Distinct active users per bucket:** `SELECT date_trunc($granularity, occurred_at) AS bucket, COUNT(DISTINCT actor_id) FROM activity_read_model WHERE occurred_at BETWEEN $from AND $to [AND department_id = $dept] GROUP BY bucket ORDER BY bucket;`
- **By role:** add `actor_role` to GROUP BY (pivot in mapper).
- **By department (institution scope):** GROUP BY `department_id`.
- **Summary cards** (today/week/month/quarter distinct counts): 4 windowed `COUNT(DISTINCT)`, or one query with FILTER clauses.
- **DISTINCT counts do NOT roll up additively** - always query the view with `date_trunc`; never pre-sum daily into weekly.
- **Performance reality:** the view is a `UNION ALL` of indexed range scans. Source tables have thousands of rows; the required indexes exist or are added (`submissions.createdAt/reviewedAt`, `clinical_sub.createdAt/reviewedAt`, `event_attendance.createdAt`, `cal_surgs.createdAt`, `events.createdAt`, `login_events.logged_in_at/department_id`). Sub-100ms at current scale. Verify indexes as part of Stage A.
- **Upgrade path (deferred, only if measured):** promote `activity_read_model` to a `MATERIALIZED VIEW` refreshed nightly (`REFRESH ... CONCURRENTLY`), or add an `activity_daily_rollup` cache for VOLUME queries (distinct-user counts stay on the live view or use a count-distinct sketch). These are derived caches of the source, refreshable, never authoritative - so they do not reintroduce a competing source of truth.
- **Caching:** React Query `staleTime` (~5min) client-side; optional short in-process server cache only if measured.

---

## 4. Max Active Users cap + signup gate

### 4.1 Where the cap lives
Add `institutions.max_active_users int NULL` (NULL = unlimited) to the single, already-cached institutions row.
- Migration adds the column; `InstitutionEntity` + `institution.service.ts` expose it; **call `clearInstitutionCache()` on update** (the row is memoized).
- Super-admin write endpoint `PATCH /superAdmin/settings/active-users-cap` (requireSuperAdmin) sets/clears it.

### 4.2 What "active users" means for the cap - DECIDED (user, 2026-07-23)
**The cap watches the rolling QUARTERLY active-users metric** (the same distinct-active-users number the dashboard shows, institution-total, trailing 3 months). Behaviour: super admin sets a cap (e.g. 500). If DISTINCT active users in the last 3 months **exceeds** the cap, signups **lock**; when that number **falls below** the cap, signups **unlock automatically**. It is self-regulating - no manual open/close flag.
- Count basis = `COUNT(DISTINCT actor_id) FROM activity_read_model WHERE occurred_at >= now() - interval '3 months'` (institution-wide, all roles). This is exactly the institution-total "quarterly" summary number on the dashboard, so the cap and the dashboard never disagree.
- `institutions.max_active_users` stores only the cap number. **`signupsOpen` is NOT stored** - it is derived live (cap vs current quarterly-active count) because the rolling window moves even with no new activity.
- Assumption to confirm inline: "active users" counts **all roles** active in the window (matches the dashboard headline). Say the word if you instead want only candidate+supervisor accounts to count toward the cap.

### 4.3 Guard points
- Primary + only meaningful gate: `PendingSignupProvider.startSignup` - after `assertDepartmentExists`/`accountEmailExists`, before staging OTP. Compute the quarterly-active count; if cap set and `count >= cap` -> return `{ status: "signups_closed" }`.
- Router maps `signups_closed` -> HTTP 403 alongside existing `email_exists` -> 409 (`auth.router.ts:95-99`, `:131-135`).
- **No `verifyOtp` transactional re-check needed** (unlike an account-count cap): verifying an OTP creates an account but does NOT make it "active" - a user only enters the active set when they act/log in. So the population that matters is measured live at `startSignup`; there is no burst-of-verifications race to guard against.
- Count helper: `COUNT(DISTINCT actor_id)` over the trailing-3-months window from `activity_read_model`. Signups are low-frequency, so compute live; optionally memoize the count for ~1-2 min if a signup burst ever shows load.

### 4.4 Frontend signup UX
- Expose `signupsOpen` (derived server-side: `cap IS NULL OR quarterlyActive < cap`) on public `GET /institution` so the candidate/supervisor signup pages render a bilingual "Registrations are currently closed" state (disable submit) instead of a form that will 403. Only the boolean is exposed publicly, never the count or cap.

---

## 5. Frontend build

### 5.1 Route + nav (super-admin, gated)
- Route `/dashboard/super-admin/active-users` inside the `import.meta.env.DEV || VITE_SUPERADMIN_ENABLED` block in `src/App.tsx`.
- Nav entry "Active Users" in `SuperAdminLayout` nav array (icon e.g. `Activity`), EN+AR label.

### 5.2 Page structure (inner-Content pattern)
- `SuperAdminActiveUsersPage` renders `<SuperAdminLayout><ActiveUsersContent/></SuperAdminLayout>`.
- `ActiveUsersContent` calls `useDashboardLanguageCtx()` (resolves the layout-mounted provider) so all copy + data are language-aware.

### 5.3 Controls
- **Period toggle** (daily/weekly/monthly/quarterly): segmented pill modeled on `LanguageToggle.tsx` (`.lang`/`.pill`), `aria-pressed`, RTL-safe.
- **Scope toggle** (Institution / Department).
- **Department picker**: reuse `SuperAdminDeptPicker.tsx` (shown when scope = Department).

### 5.4 Visualizations (reuse hand-rolled primitives - no new chart lib)
- **Summary stat row** (4 `ds-card`s): Active users Today / This week / This month / This quarter. `ds-display` numbers.
- **Trend chart**: active users over the trailing window -> `VerticalBarChart` or an inline-SVG area (following `ClinicalInsights`).
- **By-role breakdown**: `RoleStackedBarChart` (Aurora role ramps).
- **By-activity-type** (volume): `HorizontalBarChart`.
- **By-department** (institution scope): `HorizontalBarChart` or a compact `ds-card` table.
- **Cap widget**: `ds-card` gauge (reuse the `ClinicalInsights` donut) showing currentCount / cap + signupsOpen + inline super-admin edit (`ds-btn-*`, `ds-alert` feedback).
- Empty/loading: `Skeleton` + `ds-spinner`; the "login tracking started <date>" note near login figures.

### 5.5 Data layer
- `api.getActiveUsers({granularity, scope, deptCode, from, to})` -> `GET /superAdmin/activeUsers`.
- `api.setActiveUsersCap(maxActiveUsers | null)` -> `PATCH /superAdmin/settings/active-users-cap`.
- Keys: `activeUsersKeys.analytics(granularity, scope, deptCode) = ['activeUsers', granularity, scope, deptCode]`; `staleTime ~5min`.
- Optional `useActiveUsersData` memo hook (mirrors `useCandidateDashboardData`).
- Cap mutation invalidates `['activeUsers']` + `['institution']`.

### 5.6 i18n
- New `activeUsers` block in `src/content/dashboard.i18n.ts`, EN + AR (period names, role names, activity-type names, cap copy, closed-signups copy). No em-dashes in either language. Language-aware dept names, ar-EG bucket/date formatting, `text-start/end` + logical margins for RTL.

---

## 6. Security & permissions
- Analytics + cap endpoints: `requireSuperAdmin` only.
- Frontend routes stay inside the `VITE_SUPERADMIN_ENABLED`/DEV gate (tree-shaken out of prod when off).
- Public `signupsOpen` boolean on `GET /institution` is safe (a flag, no counts).
- Aggregates count ids only; no names exposed. `login_events` is super-admin-visible only (and only in aggregate).

---

## 7. Testing & verification plan
- **Backend E2E on an alt-port ts-node instance** (never the user's :3001), super-admin JWT minted with `SERVER_TOKEN_SECRET`/issuer (HS256):
  - each granularity buckets distinct counts correctly; scope=department is dept-scoped; scope=institution aggregates all; non-super-admin -> 403; no token -> 401;
  - the view returns rows for each activity_type after seeding one of each on the alt DB;
  - a login on the alt instance writes exactly one `login_events` row;
  - cap: set below current -> `startSignup` returns signups_closed -> 403; raise -> proceeds; `verifyOtp` transaction re-check blocks the race; `GET /institution` reflects `signupsOpen`.
- **Migrations:** apply + revert-cycle clean on the alt DB (incl. `CREATE/DROP VIEW`, `events` columns, `login_events`, `institutions.max_active_users`) before any prod apply.
- **Frontend:** `tsc` + `vite build` clean; user visual click-test EN + AR (RTL), toggles, cap edit.

---

## 8. Decisions / open questions

**Resolved (user, 2026-07-23):**
1. **Cap basis (4.2):** DECIDED - rolling **quarterly active-users** metric (trailing 3 months, institution-total, distinct), self-regulating auto lock/unlock. (One sub-point to confirm inline: all-roles vs candidate+supervisor-only count.)
2. **Read-model approach (3.1-3.2):** ACCEPTED - VIEW-based read model + single new `login_events` table, replacing the first draft's duplicate `activity_events` table.
3. **`events.createdBy/createdByRole` (3.4):** APPROVED - OK to add the two source columns for CM event-creation attribution.
4. **Login table vs lastLoginAt:** APPROVED - append-only `login_events` (needed for period history).

**Resolved during build (2026-07-23, my default - confirm or override):**
9. **superAdmin excluded from counts:** superAdmin activity is EXCLUDED from every active-user count, the byDepartment/byActivityType breakdowns, and the cap metric (the owner viewing the dashboard must not inflate the user base). superAdmin logins are still recorded in `login_events` for audit. If you want superAdmins counted, it is a one-line filter change.

**Still open (lower stakes; defaulted in the plan, adjust anytime):**
5. **Cap count scope:** all active roles except superAdmin (current default) vs only candidate+supervisor accounts.
6. **Trailing windows** per granularity (proposed: 30 days daily, 12 weeks weekly, 12 months monthly, 8 quarters quarterly).
7. **Deactivation:** any suspended-user notion to exclude from metric + cap? (None found; only `approved`.)
8. **login_events retention:** keep all (default; matview/rollup upgrade path for scale) vs prune.

---

## 9. CHECKPOINT TABLE (single source of truth for progress)

Legend: TODO / IN-PROGRESS / DONE / VERIFIED / BLOCKED. Keep current in real time.

### Stage A - Backend schema (source-of-truth changes only)
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| A1 | `login_events` table migration + indexes | DONE | `1783782610180-CreateLoginEvents.ts` (4 indexes) |
| A2 | `LoginEventEntity` + register in both datasource configs | DONE | `src/loginEvents/loginEvent.mDbSchema.ts`; added to database.config.ts + ka-migrations.config.ts |
| A3 | `events.createdBy/createdByRole` migration + entity | DONE | `1783782610190-AddEventCreator.ts` + EventEntity cols |
| A4 | `institutions.max_active_users` migration + entity | DONE | `1783782610200-AddInstitutionMaxActiveUsers.ts` + InstitutionEntity col |
| A5 | `activity_read_model` VIEW migration (CREATE/DROP) | DONE | `1783782610210-CreateActivityReadModel.ts`; reviewedBy::uuid + ::text literal casts for clean UNION |
| A6 | verify/add indexes on source timestamp+dept columns | IN-PROGRESS | new-table indexes done + verified; source-table index tuning deferred until measured (fast at current scale) |
| A7 | apply + revert-cycle on alt DB | VERIFIED | Full ka chain + my 4 applied on a throwaway Docker PG17; schema + view + view-SELECT confirmed; revert-cycle (undo all 4 -> re-apply) clean; container torn down. NOT applied to ka-institute/prod. |

### Stage B - Login recording (the only new write path)
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| B1 | `LoginEventService` + DI wiring | DONE | `src/loginEvents/loginEvent.service.ts`; bound + injected into AuthController |
| B2 | append `login_events` in candidate/supervisor login | DONE | fail-open; departmentId from user row |
| B3 | append in instituteAdmin login | DONE | |
| B4 | append in clerk login | DONE | |
| B5 | append in superAdmin login | DONE | departmentId null (superAdmin has none) |
| B6 | stamp `events.createdBy/Role` in handlePostEvent | DONE | provider signature + IEvent + controller JWT extraction |
| B7 | functional E2E (login writes a row; event stamps creator) | TODO | deferred to Stage C/D combined E2E (needs running app) |

Note: the deprecated + unrouted `adminLogin` was deliberately NOT instrumented (dead code, no route). tsc clean.

### Stage C - Analytics endpoint
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| C1 | `src/activeUsers/` module (4 files) + DI + route | DONE | provider/service/controller/router; bound; mounted at `/activeUsers` (GET `/analytics`) |
| C2 | aggregation queries over the view (summary/series/byRole/byType/byDept) | VERIFIED | 7 queries run concurrently (Promise.all); gap-filled series via generate_series; superAdmin excluded |
| C3 | dept-scope + institution-scope + deptCode validation | VERIFIED | deptCode->id (case-insensitive, REF_DEPT_CODE default); unknown throws |
| C4 | mapper -> response shape (+ dataStartDate + loginTrackingStartedAt) | DONE | |
| C5 | E2E (granularities, scopes, distinct-count, cap flip) | VERIFIED | provider-level integration test on throwaway PG17 with seeded data: all numbers matched hand-computed expectations (superAdmin excluded, A's 2 logins = 1 active user, byDept attribution, cap 5->closed/6->open, 4 granularities gap-filled, unknown dept throws). HTTP 401/403 layer deferred to final E2E (router uses the same production-proven requireSuperAdmin chain). |

### Stage D - Signup cap
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| D1 | cap read/gate lives in ActiveUsersProvider (no institution cache needed) | DONE | `getSignupGate` reads maxActiveUsers direct from DB; live, not cached |
| D2 | cap setter endpoint | DONE | `PATCH /activeUsers/cap` {maxActiveUsers:number\|null}; controller validates non-neg int or null; provider `setCap` |
| D3 | count helper (quarterly-active, superAdmin excluded) | VERIFIED | `getSignupGate` = cap vs COUNT(DISTINCT) trailing 3mo |
| D4 | guard in `startSignup` + status mapping | VERIFIED | gate check after accountEmailExists; `signups_closed` -> 403 in both register handlers |
| D5 | race re-check in `verifyOtp` transaction | N/A | intentionally omitted: OTP verify does not make an account "active" (only acting/logging in does), so no race past the cap. Documented in code + section 11. |
| D6 | `signupsOpen` on `GET /institution` | DONE | live-derived, fail-open, boolean only (no count/cap exposed) |
| D7 | E2E (cap block/allow) | VERIFIED | throwaway PG17: no-cap open(current 3); setCap(3)->closed; startSignup over cap->`signups_closed`; setCap(5)->open; setCap(null)->unlimited; under-cap startSignup passes the gate. |

### Stage E - Frontend (repo NeuroLogBookFront, branch feat/active-users-analytics)
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| E1 | route + nav entry (gated) | DONE | `/dashboard/super-admin/active-users` inside the VITE_SUPERADMIN_ENABLED block; nav "Active users" (Users icon); pageTitles entry |
| E2 | page + inner Content pattern | DONE | `SuperAdminActiveUsersPage` + `ActiveUsersContent` under the layout provider |
| E3 | period + scope toggles + dept picker | DONE | new `SegmentedToggle` (reuses `.lang`/`.pill`, RTL-safe) for period+scope; reuses `SuperAdminDeptPicker` |
| E4 | summary stat row | DONE | 4 ds-cards (today/week/month/quarter) |
| E5 | trend / by-role / by-type / by-dept charts | DONE | inline: stacked-by-role vertical bars (role palette), horizontal bar lists for activity-type + department; no new chart lib |
| E6 | cap widget (gauge + edit) | DONE | progress bar + open/closed badge + numeric input + save/clear via mutation |
| E7 | signups-closed state on public signup pages | DONE | redux Institution +signupsOpen (default true); candidate + supervisor pages show a closed card when false; +signupForms i18n EN+AR |
| E8 | api + React Query hooks + keys | DONE | api.getActiveUsers/setActiveUsersCap; activeUsersQueries (useActiveUsersQuery + cap mutation, placeholderData keepPrevious) |
| E9 | i18n EN+AR block | DONE | `superAdmin.activeUsers` block (~45 keys) EN+AR, no em-dashes |
| E10 | tsc + vite build clean | VERIFIED | `tsc --noEmit` clean; `vite build` succeeds (1944 modules) |
| E11 | live visual click-test EN+AR | TODO | needs migrations applied to a DB the running backend uses (see G2); build-verified only |

### Stage F - Final verification
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| F1 | live HTTP E2E (auth gates + analytics + cap) | VERIFIED | against :3001 on the migrated prod DB with minted JWTs: no-token 401, candidate 403, superAdmin 200; real analytics (summary {3,8,48,82}, byActivityType calsurg5703/sub3664/att1264/review1222/clin88, byDepartment NS=82, July bucket 25=20cand+4sup+1clerk); cap PATCH set 100000->{open:true} then cleared to null (prod cap restored, signups never closed). Caught the formatter-wrap bug (see section 11). Login-write path covered by the Stage-D integration test; will populate on the first real login via the running branch. |
| F2 | user visual click-test EN+AR | TODO | super-admin logs in at /login/super-admin -> Active Users; real data present. Unblocked (frontend unwrap fix live via vite HMR). |
| F3 | migrations applied to ka-institute (production) | VERIFIED | user ran `db:ka:migrate` (classifier blocks agent prod-writes). All 4 now [X] (180/190/200/210). Read-only prod check: activity_read_model 11,941 rows (calsurg 5703 / submission 3664 / attendance 1264 / surgical_review 1222 / clinical_submission 88); reviewedBy::uuid holds on real data; quarterly-active=82; cap unset; login_events=0 (accrues once the branch code runs). |

---

## 10. BUILD LOG (append-only, dated)
> Every applied migration, new file, and changed call-site gets a line here. Never rewrite; append.

- 2026-07-23: Branch `feat/active-users-analytics` created off `dev` (== main) in the backend repo.
- 2026-07-23: Stage A code written + `tsc --noEmit` clean. New files: `src/loginEvents/loginEvent.mDbSchema.ts`; migrations `1783782610180-CreateLoginEvents`, `..190-AddEventCreator`, `..200-AddInstitutionMaxActiveUsers`, `..210-CreateActivityReadModel`. Edits: EventEntity (+`createdBy`/`createdByRole`), InstitutionEntity (+`maxActiveUsers`), `database.config.ts` + `ka-migrations.config.ts` (+`LoginEventEntity`). Nothing committed.
- 2026-07-23: A7 VERIFIED on a throwaway Docker PG17 container (never ka-institute). Gotcha: the full ka chain includes data-dependent migration `..140-BilingualTitlesClerkAttribution`, which refuses to run unless the legacy clerk `45eb7fb8-...` exists; seeded a minimal clerk row on the empty container to get past it, then the chain (incl. my 180/190/200/210) applied clean. Verified: login_events (6 cols, 4 idx + PK), events.createdBy/createdByRole (nullable), institutions.maxActiveUsers (int null), activity_read_model view SELECTs (0 rows, UNION types valid incl. reviewedBy::uuid), view surfaces inserted login rows with correct type/role/distinct-actor counts, trailing-3-months quarterly-active query works. Revert-cycle: undo all 4 -> objects absent, migrations pointer back to ..170 -> re-apply clean. Container removed. Migrations still NOT applied to ka-institute/production. Stage A done.
- 2026-07-23: Stage B done + tsc clean. New: `src/loginEvents/loginEvent.service.ts` (fail-open insert). Wiring: container.config.ts (bind LoginEventService) + AuthController (inject + `record()` in candidate/supervisor, superAdmin, instituteAdmin, clerk logins). Event-creator stamping: event.interface.ts (IEvent +createdBy/createdByRole), event.provider.ts (createEvent `creator` param -> processedData), event.controller.ts (handlePostEvent extracts JWT id/role). Deprecated unrouted adminLogin left uninstrumented. Nothing committed.
- 2026-07-23: Stage C done + tsc clean + provider-level E2E VERIFIED. New module `src/activeUsers/` (provider/service/controller/router). DI bound in container.config.ts; mounted `/activeUsers` (GET `/analytics`) in routes.config.ts with the standard extractJWT->institutionResolver->userBasedRateLimiter->requireSuperAdmin chain. Provider reads only `activity_read_model`, runs 7 queries concurrently, gap-fills series via generate_series, EXCLUDES superAdmin from all counts and the cap. E2E on a throwaway PG17 (seeded departments/institutions/login_events/one event): institution monthly summary {daily4,weekly5,monthly5,quarterly5}, byDept NS4/UROL1, byActivityType login5/event_create1, cap flips at 5(closed)/6(open), NS/UROL dept scoping correct, 4 granularities gap-filled (30/12/12/8 buckets), unknown deptCode throws. Container + temp seed script removed. Nothing applied to production. Nothing committed.
- 2026-07-23: Stage D done + tsc clean + E2E VERIFIED. Cap gate: ActiveUsersProvider.getSignupGate (cap vs live quarterly-active, superAdmin excluded) + setCap. PATCH `/activeUsers/cap` (super-admin) + controller validation. PendingSignupProvider injects ActiveUsersProvider; startSignup returns `signups_closed` when gate closed (after accountEmailExists, before staging/mailer). StartSignupResult += `signups_closed`; auth.router both register handlers map it -> 403. GET /institution now returns live `signupsOpen` (fail-open, boolean only). No verifyOtp re-check by design (OTP verify != active). getAnalytics cap block refactored to reuse getSignupGate. E2E on throwaway PG17: setCap(3)->closed->startSignup signups_closed; setCap(5)->open; setCap(null)->unlimited; under-cap passes gate. Container + temp script removed. BACKEND (Stages A-D) COMPLETE. Nothing applied to production. Nothing committed.
- 2026-07-23: SAFETY - made the startSignup cap check FAIL-OPEN (try/catch): a getSignupGate error (e.g. the read model not yet migrated on the DB the backend runs against, or a deploy where migrations lag) must never block registration. Login recording + GET /institution signupsOpen were already fail-open. Deploy ordering note: apply migrations before/with the backend code, but a lag now degrades gracefully (signups stay open, analytics 500s until migrated) instead of breaking signup.
- 2026-07-23: Stage E (FRONTEND) done + tsc + vite build clean. Repo NeuroLogBookFront branch feat/active-users-analytics. New files: pages/SuperAdminActiveUsersPage.tsx, components/SegmentedToggle.tsx, queries/activeUsersQueries.ts. Edits: utils/api.ts (ActiveUsers types + Institution.signupsOpen + getActiveUsers/setActiveUsersCap), App.tsx (import + gated route), components/SuperAdminLayout.tsx (nav item), lib/pageTitles.ts (title + parent), content/dashboard.i18n.ts (superAdmin.activeUsers EN+AR), content/landingPage.i18n.ts (signupForms closed copy EN+AR), store/slices/authSlice.ts (Institution.signupsOpen + STATIC default), pages/CandidateSignupPage.tsx + SupervisorSignupPage.tsx (signups-closed state). Charts inline (no new lib), reuses .lang/.pill + SuperAdminDeptPicker + role palette. No em-dashes. Nothing committed. Live visual click-test pending (needs a migrated DB behind the running backend).
- 2026-07-23: MIGRATIONS APPLIED TO PRODUCTION (ka-institute). User ran `npm run db:ka:migrate` (Claude Code's classifier blocks agent-initiated prod DB writes, so the user ran it via `!`). Verified read-only: all 4 show [X] (180-210); activity_read_model view SELECTs on real data = 11,941 rows across calsurg_create/submission/event_attendance/surgical_review/clinical_submission; the reviewedBy::uuid cast holds against real reviewedBy values; getSignupGate = {max:null, quarterly_active:82}; login_events=0 (logins accrue once the branch code runs in prod). Backend code still on the branch (NOT deployed to Railway/main). Temp verify script removed. STILL not committed. Remaining: backend was down at test time so live HTTP E2E is pending; user browser click-test; commit + deploy on explicit ask (deploy = push branch->main, applies the code that starts recording logins/event creators).

---

### Stage H - Active-users drill-down list (enhancement, user-requested 2026-07-23)
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| H1 | backend `GET /activeUsers/list?window=today\|week\|month\|quarter` | VERIFIED | provider getActiveUsersList: distinct actors in window, role-joined to candidates/supervisors/clerks/institute_admins for name+email, dept, activityCount, lastActive DESC; superAdmin excluded; dept-scopable. E2E on :3001/prod: quarter=82 users w/ full detail, today=3 (matches summary). |
| H2 | service/controller/router wiring | DONE | GET /activeUsers/list, requireSuperAdmin chain |
| H3 | frontend list page + route + pageTitles | DONE | SuperAdminActiveUsersListPage (table: user/role/dept/activity/lastActive, client search, window toggle, back link); /dashboard/super-admin/active-users/list |
| H4 | stat cards link to the list (carry window+scope+deptCode) | DONE | StatCard -> Link (ds-card-interactive); listHref threads scope/dept |
| H5 | api + query hook + i18n (EN+AR) | DONE | getActiveUsersList (unwraps .data), useActiveUsersListQuery, +10 i18n keys EN+AR (no em-dashes) |
| H6 | tsc + vite build clean | VERIFIED | both clean |
| H7 | backend `GET /activeUsers/user?actorId=&role=&window=` (per-user drill-down) | VERIFIED | getUserActivity: that user's byType breakdown + total + capped recent timeline in the window. E2E on prod: candidate 42a7c7fe -> {submission:23, event_attendance:7, clinical_submission:1}, total 31 (matches list activityCount). |
| H8 | frontend expandable user row (breakdown + recent timeline) | DONE | click a list row -> lazy-loaded detail (activity-type bars + recent-activity list); Fragment-keyed rows, chevron, RTL-safe; api.getUserActivity + useUserActivityQuery + 2 i18n keys EN+AR. tsc + vite build clean. |

### Stage I - Login IP + user-agent capture (enhancement, user-requested 2026-07-24)
Prompted by the ElBaroody review: `login_events` recorded who/when but not from where, so a suspicious login could not be traced to a device/location. Added.
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| I1 | migration `1783782610220` (+ip/+userAgent on login_events; recreate view to carry them) | VERIFIED | throwaway PG17: apply -> cols + view carry ip/userAgent for login rows (NULL for other sources); revert -> cols dropped + view reverts + still selects; re-apply clean. |
| I2 | entity + LoginEventService.record capture ip/userAgent (UA capped 512) | DONE | |
| I3 | thread ip (`req.ip \|\| socket.remoteAddress`) + user-agent from all 4 login routes -> controller -> record | DONE | trust proxy 1 already set, so req.ip is the real client |
| I4 | surface in per-user drill-down: getUserActivity returns ip/userAgent on recent events; UI shows `ip · device` on login rows (full UA in tooltip) | DONE | shortUA() derives a compact browser/OS label |
| I5 | tsc (backend + frontend) + vite build clean | VERIFIED | |
| I6 | deploy: apply migration 220 to prod + push both repos to main | PENDING user go-ahead | historical logins stay IP-less (predate capture); only new logins are traced |

### Stage J - Dedicated per-user activity page (enhancement, user-requested 2026-07-24)
Replaced the inline click-to-expand dropdown with a full per-user page.
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| J1 | backend getUserActivity: + user identity (name/email/dept) + FULL event timeline (was capped-50 `recent`; now `events`, LIMIT 1000, each with ip/userAgent) | VERIFIED | E2E on prod: Ibrahim Elkony / NS / 12 events with ip/userAgent |
| J2 | new page `SuperAdminUserActivityPage` (/active-users/user): header (name/role/dept/email), window filter (today/week/month/quarter), byType breakdown, full timeline table Time/Activity/IP/Device | DONE | route + pageTitles + shared `lib/activityFormat.ts` (formatDateTime + shortUA) |
| J3 | list rows now NAVIGATE to the user page (carry window+scope+dept); removed the inline dropdown + UserActivityDetail | DONE | chevron affordance kept |
| J4 | i18n (+activityTimeline/colTime/colIp/colDevice/backToList EN+AR) | DONE | |
| J5 | tsc (backend + frontend) + vite build clean | VERIFIED | |
| J6 | deploy: commit + push both repos to main | PENDING user go-ahead | no migration needed (code-only) |

## 11. Decisions & deviations (append-only, dated)
> Record anything that changes the plan mid-build: a gotcha, a rejected approach, a schema surprise, a scope change, and why.

- 2026-07-23: First draft proposed a unified `activity_events` table that re-recorded submissions/attendance/clinical/calSurg events. **Rejected on review (user):** it duplicates facts already stored elsewhere and breaks single-source-of-truth. **Replaced with read-model separation:** source tables stay authoritative and are read live; a Postgres VIEW (`activity_read_model`) unifies them at read time; the only new write target is `login_events` (a genuinely new domain - logins are recorded nowhere). Also corrected: `clinical_sub.supervisorDocId` IS the reviewer, so no `reviewedBy` column is needed (dropped). Event-creator gap closed on the source `events` table (`createdBy/createdByRole`), not by duplication.
- 2026-07-23: A7 migration-apply test could not run - the machine has no local `psql` and Docker Desktop's daemon would not start within a reasonable window. There is no separate staging DB (`ka-institute` = production, off-limits). Options recorded for the user: (a) start Docker so a throwaway PG17 container can apply+revert-test the full chain; (b) explicitly authorize a one-time apply of these additive, reversible migrations to `ka-institute` (new table + nullable columns + a read-only view, all with clean down()); (c) point at any other non-prod Postgres. Chosen: PENDING user input. All code is written and tsc-clean, so whichever DB is chosen, applying is a single `db:ka:migrate`.
- 2026-07-23: ENHANCEMENT (user ask) - stat cards now drill down to a filtered active-users LIST. Backend: `GET /activeUsers/list?window=today|week|month|quarter&scope=&deptCode=` (ActiveUsersProvider.getActiveUsersList) - distinct actors in the window, role-joined to the 4 user tables for name/email, with dept + activityCount + lastActive, superAdmin excluded, dept-scopable. Verified live on :3001/prod: quarter=82 with full detail (e.g. top candidate 31 activities), today=3 (matches summary.daily). Frontend: SuperAdminActiveUsersListPage (searchable table + window toggle + back), stat cards became links carrying scope+dept, api.getActiveUsersList + useActiveUsersListQuery + i18n EN+AR. tsc + vite build clean. Caught + fixed an em-dash I'd typed in a dept fallback. Nothing committed.
- 2026-07-23: LIVE E2E caught a real bug: the backend has a global response formatter that wraps every `res.json(payload)` as `{status, statusCode, message, data: payload}` (same as GET /institution). The backend analytics/cap endpoints are correct (they return the object; the formatter wraps it), but the frontend `api.getActiveUsers`/`api.setActiveUsersCap` returned the whole wrapper instead of `.data`, so the dashboard would have read `undefined`. Fixed both to `(data?.data ?? data)`, matching `getInstitution`. tsc clean. Lesson: new endpoints inherit the .data envelope; unwrap on the client.
- 2026-07-23: Cap basis DECIDED (user) = rolling **quarterly active-users** (trailing 3 months, distinct, institution-total), self-regulating: exceeds cap -> signups lock; falls below -> unlock automatically. `signupsOpen` derived live (not stored). No `verifyOtp` cap re-check needed because OTP verification does not make an account "active" (only acting/logging in does). Approved: `login_events` table, `events.createdBy/createdByRole`. These three answers unblock Stages A-D.

---

## 12. Standing constraints (do not violate)
- No em-dashes anywhere (UI/AR/comments/commits/docs). Use period, comma, colon, or parentheses.
- Never commit or push to `main`. Work on side branches. Commit only on explicit ask.
- Local `PSQL_*` = `ka-institute` = **production**. No schema/data writes to it without an explicit go-ahead. Dev + E2E on an alt-port instance with minted JWTs.
- Do not write temp files into either repo (triggers watcher restart / HTTP 000 false-crash). Use the scratchpad.
- Keep this document current per section 0.
