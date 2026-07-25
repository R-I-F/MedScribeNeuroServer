# Public Search Usage Analytics (super-admin) — Living Plan

Status: DRAFT, awaiting final go. D1 RESOLVED (user, 2026-07-25): session-only, NO migration.
Do NOT write code until the remaining Decisions (section 7) are confirmed and the user says go.

Feature ask (user, 2026-07-25): a super-admin breakdown of the people who use the PUBLIC semantic
search tool on the landing page (`/explore`). **D1 decision: people + total searches only, no
migration** (no per-search event log, so no by-type / by-department breakdown).

---

## 0. HOW TO USE THIS DOC (progressive-documentation protocol — READ FIRST)
Crash-recovery record. An agent resuming mid-build must tell exactly what is done from this doc.
1. **Checkpoint Table (section 8) is the single source of truth for progress** (TODO / IN-PROGRESS /
   DONE / VERIFIED / BLOCKED). Update in real time.
2. **Every new file, changed call-site, endpoint, test run gets a dated Build Log bullet (section 9).**
3. **Decisions/deviations get a dated bullet (section 10).**
4. On resume: read section 8, then the last Build Log entries, then continue at the first non-DONE.
5. No em-dashes anywhere (UI, AR, comments, commits, docs).

---

## 1. Goal & scope
- A super-admin-only, read-only view of who (which verified emails) uses the public `/explore`
  semantic search, and how much, over time.
- **Filter: period only (daily / weekly / monthly / quarterly)** analytics + a today/week/month/quarter
  list window. NO scope/department filter (the public tool never recorded the chosen departments).
- Metrics (all derivable from `public_search_sessions`, so FULL history is covered, no forward-only
  caveat):
  - **People** = distinct emails that ran at least one search (`queryCount > 0`).
  - **Searches** = SUM(`queryCount`).
  - **Over time** = bucketed by session `createdAt`.
  - **Conversion funnel** = registered vs verified vs searchers (distinct emails).
  - **Per-email list** = each email with its total searches, session count, verified flag, first/last seen.
- OUT of scope: any change to the public tool (gate/OTP/quota/anti-abuse/search); by-type and
  by-department breakdowns (not recorded, would need the event log we chose NOT to build); any migration.

### 1.1 What the data supports (and does not)
`public_search_sessions` stores, per session: `email` (lowercased), `verified`/`verifiedAt`,
`queryCount`, `maxQueries`, `ip`, `userAgent`, `createdAt`, expiries. It does NOT store per-search
type, department, or timestamp. So this feature reports people / searches / conversion / over-time
(by registration day), and cannot break down by type or department. The quota is already a per-email
SUM of `queryCount`, so summing across an email's sessions is the correct "searches by that person".

---

## 2. Current-state findings (grounded, 2026-07-25)
- `src/publicSearch/publicSearchSession.mDbSchema.ts`: the only public-search store; columns above.
  Indexes already exist on (`email`,`createdAt`), (`ip`,`createdAt`), (`createdAt`), so the aggregate
  reads are cheap. No new index needed.
- Patterns to mirror (shipped): backend analytics module `src/searchAnalytics/` +
  `src/activeUsers/` (window intervals `WINDOW_INTERVAL`, granularity `generate_series` gap-fill,
  super-admin chain `extractJWT -> institutionResolver -> userBasedRateLimiter -> requireSuperAdmin`).
  Frontend: `SuperAdminSearchUsagePage` + `...ListPage`, `SegmentedToggle`,
  `queries/searchUsageQueries.ts`, `superAdmin.searchUsage` i18n, App.tsx gated routes,
  SuperAdminLayout nav, pageTitles. Copy, dropping the scope toggle + dept picker.
- No entity change, no migration, no change to `publicSearch.provider.ts`.

---

## 3. Proposed architecture (session-only)

### 3.1 Backend analytics module `src/publicSearchAnalytics/` mounted at `/publicSearchAnalytics`
Super-admin only. Reads `public_search_sessions`. No department, no role, no scope param.

**GET `/publicSearchAnalytics/analytics?granularity=daily|weekly|monthly|quarterly`**
```jsonc
{
  "granularity": "monthly",
  "dataStartDate": "2026-07-24",                       // MIN(createdAt)
  "summary": {                                          // trailing windows (by createdAt)
    "daily":     { "people": 3,  "searches": 8 },       // people = distinct emails with queryCount>0
    "weekly":    { "people": 12, "searches": 40 },
    "monthly":   { "people": 30, "searches": 110 },
    "quarterly": { "people": 55, "searches": 240 }
  },
  "series": [ { "bucket": "2026-07", "searches": 110, "people": 30 } ],   // gap-filled
  "conversion": { "registered": 80, "verified": 60, "searchers": 55 },     // distinct emails, trailing quarter
  "allTime": { "people": 140, "searches": 620 }                            // lifetime totals
}
```
- `people` per window = COUNT(DISTINCT email) WHERE `queryCount > 0` AND `createdAt >= now()-interval`.
- `searches` = SUM(`queryCount`) over the same filter.
- `conversion` (trailing 3 months): registered = distinct emails (any session); verified = distinct
  emails with a verified session; searchers = distinct emails with `queryCount > 0`.
- `allTime` = lifetime people/searches (no window), so the owner sees the total the tool has served.

**GET `/publicSearchAnalytics/list?window=today|week|month|quarter`**
```jsonc
{
  "window": "quarter", "count": 55,
  "people": [
    { "email": "user@example.com", "verified": true, "searchCount": 5,
      "sessions": 2, "firstSeen": "2026-07-10T...", "lastSeen": "2026-07-25T..." }
  ]
}
```
- Aggregated per email: searchCount = SUM(queryCount), sessions = COUNT(*), verified = bool_or,
  firstSeen = MIN(createdAt), lastSeen = MAX(createdAt). Filter to emails with a session
  `createdAt >= now()-interval` AND total `queryCount > 0`. Ordered by searchCount desc, then lastSeen.

(No per-email drill-down endpoint by default; see D8.)

### 3.2 Frontend: super-admin "Public Search Usage" pages
- `SuperAdminPublicSearchUsagePage`:
  - Conversion cards: registered / verified / searchers (small stat row).
  - Summary cards: people + searches per window (daily/weekly/monthly/quarterly) linking to the list.
  - Trend: bars = searches per bucket (people shown in each bar's tooltip); simple single series.
  - An "all time" line (people + searches served since `dataStartDate`).
  - Period `SegmentedToggle` only (no scope toggle, no dept picker).
- `SuperAdminPublicSearchListPage`: window `SegmentedToggle` + client search box + table
  (email / verified / searches / sessions / first seen / last seen). Rows non-clickable (no per-email
  page unless D8).
- api.ts: `getPublicSearchUsage({granularity})`, `getPublicSearchUsageList({window})` + types.
- `queries/publicSearchUsageQueries.ts` (keys `['publicSearchUsage',...]`).
- i18n `superAdmin.publicSearchUsage` EN + AR (0 em-dashes).
- App.tsx gated routes `/dashboard/super-admin/public-search-usage` (+ `/list`); SuperAdminLayout nav
  item (icon `Globe`); pageTitles.

---

## 4. Security, privacy & gating
- Super-admin only (same chain as the other analytics); frontend under `VITE_SUPERADMIN_ENABLED`.
- Emails are PII, shown only to the super-admin (same trust level as Active Users). No raw query text
  is stored or shown (the public tool never logs it). Read-only; the public tool is untouched.

---

## 5. Testing & verification
- Backend E2E on a throwaway Docker PG17: seed `public_search_sessions` (several emails, mix of
  verified/unverified, some `queryCount=0`, multiple sessions per email, across several days). Drive
  the provider: summary (people = distinct searchers, searches = sum), series gap-fill, conversion
  funnel (registered/verified/searchers), allTime, list aggregation + ordering + window filtering.
  Edge cases: a session with `queryCount=0` is NOT a "searcher"; multiple sessions for one email
  collapse to one list row; window boundary (a session just inside/outside `now()-interval`).
- Auth 401/403/200 (minted super-admin JWT). No migration to test.
- Confirm the public tool (gate/OTP/quota/search) is unchanged (no code touched there).
- Frontend `tsc` + `vite build` clean; user click-test (EN + AR, all periods).

---

## 6. Reuse checklist
Window intervals + granularity gap-fill (copy from searchAnalytics/activeUsers). Frontend pages +
queries + i18n + routing + nav + pageTitles (copy from the in-app AI Search Usage pages, dropping the
scope toggle, dept picker, by-type/by-department/by-role sections).

---

## 7. DECISIONS
- **D1 RESOLVED (user):** session-only, people + total searches, NO migration, NO per-search event
  log, NO by-type/by-department breakdown.
- Remaining (recommended default in bold; confirm or override before Stage B):
- **D2 Person = verified email**, aggregated across that email's sessions. **Recommend: yes.**
- **D4 Filter = period only** (daily/weekly/monthly/quarterly + list window). No scope/department.
  **Recommend: yes.**
- **D5 Conversion funnel** (registered / verified / searchers) as small cards, plus an all-time
  people/searches total. Cheap and the most useful public-funnel signal. **Recommend: include.**
- **D8 Per-email drill-down page: SKIP.** The list already shows each email's totals; session-only
  detail (a list of that email's sessions) adds little. **Recommend: skip (add later if wanted).**
- **D6 Migration: NONE.** **D9 no public-tool changes** (pure read).

---

## 8. CHECKPOINT TABLE (single source of truth for progress)
Legend: TODO / IN-PROGRESS / DONE / VERIFIED / BLOCKED.

### Stage A — Decisions locked
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| A1 | D1 resolved (session-only, no migration); D2/D4/D5/D8 confirmed | DONE | 2026-07-25: D2 email, D4 period-only, D5 include conversion + all-time, D8 skip per-email page |

### Stage B — Backend endpoints (read-only, no migration)
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| B1 | `publicSearchAnalytics.provider`: analytics (summary people+searches, series gap-fill, conversion, allTime) | DONE | |
| B2 | provider: list (per-email aggregation + window filter, searchCount from in-window sessions) | DONE | |
| B3 | service + controller (parse granularity/window) | DONE | |
| B4 | router `/publicSearchAnalytics` super-admin chain + wiring (container.config + routes.config) | DONE | |
| B5 | tsc --noEmit clean | VERIFIED | exit 0 |

### Stage C — Backend E2E
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| C1 | throwaway PG17: seed 6 sessions (verified/unverified, queryCount 0 and >0, 2-session email a@x, e@x at 40d) | VERIFIED | via migration 230 table |
| C2 | analytics/list correct: people=distinct searchers, searches=sum, conversion 5/4/3, allTime 3/10, window boundaries (month excludes 40d), per-email collapse (a@x 2 sessions -> 1 row, searchCount 5) | VERIFIED | all assertions pass |
| C3 | auth 401/403/200 | VERIFIED (by parity) | router chain identical to shipped activeUsers/searchAnalytics |

### Stage D — Frontend pages
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| D1 | api.ts methods + types (getPublicSearchUsage/List + PublicSearchUsage* types) | DONE | |
| D2 | publicSearchUsageQueries.ts hooks | DONE | keys ['publicSearchUsage',...] |
| D3 | SuperAdminPublicSearchUsagePage (conversion funnel + summary cards + searches trend + all-time + period toggle) | DONE | |
| D4 | SuperAdminPublicSearchUsageListPage (window toggle + email search + table verified/searches/sessions/first/last) | DONE | |
| D5 | i18n superAdmin.publicSearchUsage EN + AR (0 em-dashes) | DONE | interface + EN + AR |
| D6 | App.tsx routes (gated) + nav item (Globe) + pageTitles (title + parent) | DONE | |
| D7 | tsc + vite build clean | VERIFIED | tsc exit 0; vite built |

### Stage E — Docs + deploy
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| E1 | API_DOCUMENTATION + CLAUDE.md | DONE | |
| E2 | user click-test (EN + AR, all periods); public tool unaffected | TODO | awaiting user |
| E3 | commit + push to main both repos (explicit ask); NO prod migration | TODO | awaiting explicit go-ahead |

---

## 9. BUILD LOG (append-only, dated)
- 2026-07-25: Plan drafted. Read `publicSearchSession.mDbSchema.ts` + `runQuery`: public tool stores
  only aggregate `queryCount` (no per-search type/dept/timestamp).
- 2026-07-25: D1 RESOLVED by user = session-only, no migration. Plan revised to drop the event log,
  the migration, and the by-type/by-department/scope surface. Session-only covers full history.
- 2026-07-25 (Stage B, backend, branch `feat/search-usage-analytics` [shared with the in-app feature,
  still uncommitted pending review]): new module `src/publicSearchAnalytics/` (provider/service/
  controller/router) mounted at `/publicSearchAnalytics`, super-admin chain identical to activeUsers.
  Reads only `public_search_sessions`. `GET /analytics` (summary people+searches per window, gap-filled
  searches/people series by createdAt, conversion registered/verified/searchers over trailing quarter,
  allTime totals + dataStartDate), `GET /list` (per-email aggregate over in-window sessions:
  searchCount sum, sessions, verified bool_or, first/last seen, HAVING sum>0, ordered searchCount desc).
  Wired container.config (4 bindings) + routes.config (mount). tsc exit 0.
- 2026-07-25 (Stage C, backend E2E on throwaway Docker PG17): migration 230 gives the table; seeded 6
  sessions. All assertions pass: monthly summary (daily 2/7, weekly+monthly 2/9, quarterly 3/10),
  conversion 5 registered / 4 verified / 3 searchers, allTime 3 people / 10 searches, 12 series buckets;
  list quarter = [a@x 5, b@x 4, e@x 1] (a@x's 2 sessions collapse to one row), list month excludes the
  40-day e@x. Container + temp files removed.
- 2026-07-25 (Stage D, frontend, branch `feat/search-usage-analytics` on NeuroLogBookFront): `api.ts`
  = PublicSearchUsage* types + getPublicSearchUsage/getPublicSearchUsageList. `queries/
  publicSearchUsageQueries.ts`. Pages `SuperAdminPublicSearchUsagePage` (conversion funnel cards +
  summary cards searches + "{n} people" -> list; simple searches trend bars, people in tooltip;
  all-time line; period toggle only) and `SuperAdminPublicSearchUsageListPage` (window toggle + email
  search + table email/verified/searches/sessions/first/last, non-clickable). i18n
  `superAdmin.publicSearchUsage` EN + AR (0 em-dashes). App.tsx 2 gated routes, SuperAdminLayout nav
  (Globe), pageTitles. tsc exit 0; vite build clean.
- 2026-07-25 (Stage E1): API_DOCUMENTATION new "Public Search Usage Analytics" section + TOC + auth
  row; CLAUDE.md entry. Awaiting user click-test + explicit push.

---

## 10. Decisions & deviations (append-only, dated)
- 2026-07-25: No migration and no per-search log (user choice). Consequence: no by-type or
  by-department breakdown; the feature reports people, searches, conversion, and over-time (by
  registration day) from `public_search_sessions`. Benefit: full history is covered immediately.

---

## 11. Standing constraints (do not violate)
- No em-dashes anywhere.
- Never commit or push to `main` without an explicit ask. Purpose-named side branch off `main`.
- Local `PSQL_*` = `ka-institute` = production; read-only SELECTs only; no writes.
- Do NOT change the public tool. Super-admin only; frontend under `VITE_SUPERADMIN_ENABLED`. Emails
  are PII (super-admin only); never show raw query text (it is not stored anyway).
- Keep this document current per section 0.
