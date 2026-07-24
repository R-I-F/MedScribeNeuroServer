# In-Form Semantic Search + Auto-Fill (Submission Form) - Implementation Plan

> Status: **DRAFT - awaiting user review before ANY development.** We only start implementing after the user approves this plan.
> Surface: the **authenticated submission form** at `/dashboard/submissions/new/:procId` (candidate + supervisor), an optional AI assist placed **before the Main Diagnosis question (Q11)**.
> Repos: backend `F:\WebDev\MedScribeNeuroServer` (KA spoke); frontend `F:\WebDev\NeuroLogBookFront`. The reference hub `F:\WebDev\LibelusRefApi` is used as-is (no change). Builds on the just-shipped `src/publicSearch/search.service.ts` (reusable `SearchService`).
> Standing constraints (section 11): no em-dashes anywhere; never push to `main` without an explicit ask; `PSQL_*` = production `ka-institute` (writes need a go-ahead; the harness blocks agent-run prod migrations so the user runs `db:ka:migrate`); dev/E2E on alt-port + throwaway Docker DB.

---

## 0. HOW TO USE THIS DOC (progressive-documentation protocol - READ FIRST)

**This document is the living memory of the build.** If a session is interrupted, the next session must open it and know exactly what is done and what is not.
1. **Checkpoint Table (section 9) is the single source of truth for progress** - each sub-step is `TODO` / `IN-PROGRESS` / `DONE` / `VERIFIED` / `BLOCKED`.
2. **Update the checkpoint the moment a sub-step changes state** - before moving on. A half-done step is left `IN-PROGRESS` with a one-line note on exactly where it stopped.
3. **Every applied migration, new file, changed call-site, env var gets a dated bullet in the Build Log (section 10).** Append-only.
4. **Anything discovered mid-build that changes the plan** goes in Decisions & Deviations (section 11), dated, with the why.
5. On resume: read section 0 -> 9 -> latest 10 & 11, then continue from the first non-`DONE` sub-step.
6. Keep this file current the way `CLAUDE.md`'s "Where we stopped" is kept current.

---

## 1. Goal & scope

Inside the submission form, before Main Diagnosis (Q11), add an **optional** AI assist. A candidate or supervisor who does not know the exact scientific name can describe a procedure or diagnosis in natural language and get the top matches; picking one **auto-fills** the Main Diagnosis and the matching Diagnosis or Procedure fields. The traditional manual tree-filling stays fully available and unchanged; the tool is a shortcut, never a requirement.

Requirements (from the user):
1. Placed **before Q11 (Main Diagnosis)** in the form.
2. Department is **auto-detected from the logged-in user** (candidate or supervisor); the user never picks it.
3. **Gate: max 5 searches per user per day** (all roles).
4. A **mandatory Procedure/Diagnosis toggle** when using the tool.
5. User picks the toggle, types the input, sees results.
6. **Auto-fill:** picking a result fills the Main Diagnosis and either the Diagnosis or the Procedure in the form.
7. **UX:** presented inside the form so the user understands how to use it; clearly **optional** (they can use it or fill the tree manually).

Out of scope: changing the manual form flow, the public `/explore` tool, or the reference data; an in-form AI "explain" button (the explore tool has that; not needed here).

---

## 2. Current-state findings (from a 2-agent codebase inventory)

### 2.1 The form already holds the full reference tree client-side (auto-fill can match in memory)
- `src/components/SubmissionForm.tsx` (shared by candidate + supervisor via a `variant` prop; wrapper pages `AcademicPracticalSubmissionFormPage.tsx` / `SupervisorSubmissionFormPage.tsx`).
- Loads the tree via `useMainDiagnosesQuery(institutionId)` (`SubmissionForm.tsx:121`, `miscQueries.ts:21-30`) -> **`GET /mainDiag`** (dept resolved server-side from the JWT `departmentId` claim; `deptCode` omitted). In-memory shape (`types/api.ts:416-443`):
  - `MainDiagnosis { id, title, arTitle?, procs: MainDiagnosisProcedure[], diagnosis: MainDiagnosisDiagnosis[] }`
  - `MainDiagnosisDiagnosis { id, icdCode?, icdName?, icdArName?, title?, description?, arDescription? }`
  - `MainDiagnosisProcedure { id, numCode?, alphaCode?, title, arTitle?, description?, arDescription? }`
  - NB the array keys are **`diagnosis`** and **`procs`** (not `diagnoses`/`procCpts`).
- So a search hit resolves entirely client-side: `mainDiagnoses.find(m => m.title === hit.mainDiagnosis.title)`, then `diagnosis[].icdCode === hit.diagnosis.icdCode` or `procs[].alphaCode === hit.procedure.alphaCode`.

### 2.2 Form state + the auto-fill targets (and the ordering gotcha)
- Q11 Main Diagnosis: `SubmissionForm.tsx:1072-1089`. State `mainDiagDocId: string` (the mainDiag **id**), setter `setMainDiagDocId`; derived `selectedMainDiag = mainDiagnoses.find(m => m.id === mainDiagDocId)`.
- Diagnosis picker (`:1201-1255`): `diagnosisSelections: string[]` + mirror `diagnosisSelectionsRef`; each stored value is the **canonical EN label** `getDiagnosisLabel(d) = d.icdName ?? d.title` (`:396-397`); setter `setDiagnosisSelections`.
- Procedure picker (`:1257-1310`): `procedureSelections: string[]` + mirror `procedureSelectionsRef`; each stored value is **`proc.title`** (EN); setter `setProcedureSelections`.
- Options are `selectedMainDiag.diagnosis` / `selectedMainDiag.procs`.
- **THE GOTCHA:** the effect at `SubmissionForm.tsx:293-305` **resets `diagnosisSelections`/`procedureSelections` to `[]` whenever `mainDiagDocId` changes.** So auto-fill cannot set mainDiag + leaf in the same tick: set `mainDiagDocId` first, then apply the leaf selection AFTER that reset effect runs (a pending-autofill ref + a follow-up effect keyed on `mainDiagDocId`).
- Submission payload (`:723-745`, `types/api.ts:494-514`): `mainDiagDocId` (id) + `diagnosisName?: string[]` (EN labels, from the ref) + `procedureName?: string[]` (EN titles, from the ref). No leaf ids or codes are sent, so **auto-fill must write the exact canonical EN strings the option list produces** (it does, because it copies them from the loaded tree).

### 2.3 Department + auth for the logged-in user
- The form does not read a department; `GET /mainDiag` resolves it from the JWT `departmentId` claim (candidate/supervisor sign it at login: `auth.controller.ts:185`). Client also has `user.departmentId` in redux (`authSlice.ts:29-30`).
- To keep the search department **identical to the tree the form loaded**, the new search endpoint must resolve the department the **same way `/mainDiag` does**: `?deptCode` (unused here) -> JWT `departmentId` -> `REF_DEPT_CODE`/NS default (`referenceRead.controller.ts:36-63`).

### 2.4 The reusable SearchService (already shipped) + auth wiring
- `SearchService.search({ query, type, departments:[{code,name,arName}], limit, includeCpt })` returns `PublicSearchResult[]` with `mainDiagnosis:{title,arTitle}`, `diagnosis:{icdCode,icdName,icdArName}` or `procedure:{title,arTitle,alphaCode,numCode?}`, `description`, `similarity`. `includeCpt:true` includes `numCode` (`search.service.ts:90`). DI-bound (`container.config.ts:230`).
- Its results give exactly the auto-fill keys (`mainDiagnosis.title`, `diagnosis.icdCode`, `procedure.alphaCode`/`numCode`). It does NOT return the mirror leaf `id`, which is fine (the form matches by code against its own tree).
- Standard authed chain: `extractJWT -> institutionResolver -> userBasedRateLimiter -> requireCandidate -> validator`. `requireCandidate = authorize(CANDIDATE, SUPERVISOR, INSTITUTE_ADMIN, SUPER_ADMIN)` is hierarchical, so it already admits candidates AND supervisors (`authorize.middleware.ts:64`). userId for the quota = `res.locals.jwt.id || ._id`; department = `res.locals.jwt.departmentId`.
- New-entity registration (3 touch-points, mirror `PublicSearchSessionEntity`): entity file + both datasource configs (`database.config.ts`, `ka-migrations.config.ts`) + DI bind + route mount; migration in `src/migrations-ka/` (next after `...230`).
- Quota pattern to mirror: the demoRequest per-day DB count (`countByEmailSince` + `startOfUtcDay` UTC-day boundary) and publicSearch's "count the credit BEFORE running the search".

---

## 3. Proposed architecture

### 3.1 Backend: a new authenticated endpoint that reuses SearchService
New small module `src/inAppSearch/` (mirrors `publicSearch`, keeps `sub` uncluttered):
- **`POST /inAppSearch/query`** - chain `extractJWT -> institutionResolver -> userBasedRateLimiter -> requireCandidate -> validator`. Body `{ query (2-500), type: procedure|diagnosis }`. **No department in the body** (server-derived).
- Provider flow:
  1. `userId = jwt.id || jwt._id`; `deptClaim = jwt.departmentId`.
  2. Resolve the department the same way `/mainDiag` does: `deptClaim` -> `departments` mirror row `{code,name,arName}` (default `REF_DEPT_CODE`/NS), so the search department matches the form's loaded tree (D1).
  3. **Daily quota:** count this user's searches since `startOfUtcDay()`; if `>= MAX (5)` -> `{ status: "quota_exhausted", remaining: 0 }`. Else record one usage row (credit spent before running, like publicSearch) and proceed.
  4. `SearchService.search({ query, type, departments:[dept], limit:5, includeCpt:true })`.
  5. Return `{ status: "ok", results, remaining }`.
- **Quota storage (D2):** a small append-only table `in_app_search_events { id, userId, userRole, departmentId, type, createdAt }`; quota = `count WHERE userId=$1 AND createdAt >= startOfUtcDay()` capped at 5 (env `IN_APP_SEARCH_MAX_PER_DAY`, default 5). This mirrors `countByEmailSince`, doubles as a usage audit, and needs no upsert. Migration `1783782610240-CreateInAppSearchEvents`.
- **Reuse note:** `SearchService` is caller-aware; the public tool passes `includeCpt:false`, this authenticated in-app tool passes `includeCpt:true` (institutional users may see CPT). Same service, no duplication.

### 3.2 Frontend: an optional collapsible AI-assist panel before Q11
Insert in `SubmissionForm.tsx` immediately before the Main Diagnosis block (`:1072`), inside the common section. Styled with the form's raw-Tailwind idiom (gray-*/blue-*, NOT ds-*), bilingual via `copy.submissionForm` (new `aiAssist` sub-block).

- **Disclosure header (collapsed by default):** a subtle "Not sure of the exact name? Try AI search" toggle + a one-line hint that it is optional and they can still fill the tree below manually. Opening it reveals the tool.
- **Mandatory type toggle:** Procedure / Diagnosis (no default selected, or default to the submission's nature; must be chosen to search).
- **Query input + Search button.** Shows the remaining daily quota ("N of 5 searches left today"); at 0 -> a disabled state with a "try again tomorrow" note.
- **Results:** top-5 compact rows (leaf name + code + similarity + a short description). Each has a **"Use this" action** that auto-fills.
- **Auto-fill (client-side, against the already-loaded `mainDiagnoses` tree), handling the reset gotcha:**
  1. Find `md = mainDiagnoses.find(m => norm(m.title) === norm(hit.mainDiagnosis.title))`.
  2. Set a `pendingAutoFill` ref = `{ kind, code }` (icdCode or alphaCode), then `setMainDiagDocId(md.id)`.
  3. The existing effect (`:293-305`) resets the leaf selections. A NEW effect keyed on `mainDiagDocId` + `pendingAutoFill` runs after the reset and applies the leaf: for diagnosis, `setDiagnosisSelections([getDiagnosisLabel(md.diagnosis.find(d => d.icdCode === code))])` (+ ref); for procedure, `setProcedureSelections([md.procs.find(p => p.alphaCode === code).title])` (+ ref); then clears `pendingAutoFill`.
  4. Scroll to / highlight Q11 so the user sees what was filled, and can adjust.
- **Data source:** a new authenticated `api.inAppSearch({ query, type })` (no dept, JWT-scoped) + a small React Query mutation. No OTP (the user is already authenticated).
- **Graceful partial match (D4):** if the mainDiag title is not found in the loaded tree, or the code is not found under it (rare, since the search is scoped to the same department as the tree), fill what matches and show a subtle "review the selection" note rather than failing. If a hit has no `mainDiagnosis`, do not auto-fill the tree for it (offer it as reference only).

### 3.3 Consistency guarantee (why auto-fill will match)
The search endpoint scopes to the user's JWT department, which is the same department `/mainDiag` used to build the form's tree. So every hit's `mainDiagnosis` + leaf code exists in the loaded tree, and the codes (`icdCode`/`alphaCode`) are unique keys. A diagnosis shared across several main diagnoses is disambiguated by the hit's `mainDiagnosis.title`.

---

## 4. Security, gating & cost
- **Auth:** authenticated route (candidates + supervisors + admins via `requireCandidate`); no anonymous access, no OTP.
- **Daily quota:** 5 per user per UTC day (DB count, server-enforced; the IP/user rate limiter is a coarse throttle, not the quota). Env-tunable.
- **AI cost:** each search is one hub embed (+ indexed cosine). The 5/day/user cap bounds it. No new Gemini text calls (no in-form explain).
- **Input hardening:** query length-capped (2-500); type strictly `procedure|diagnosis`; department never client-supplied (server-derived from the JWT).
- **Data exposure:** authenticated institutional users, so CPT `numCode` may be shown in the result card (D5, confirm). Nothing new is exposed beyond what the manual tree already shows these users.

---

## 5. Testing & verification
- **Backend E2E (alt port):** authed `POST /inAppSearch/query` with a minted candidate JWT and a minted supervisor JWT: department auto-derived; results match the department's tree; quota blocks the 6th search in a UTC day; unknown/absent dept falls back to NS; non-authed -> 401.
- **Migration** apply + revert-cycle on a throwaway Docker PG17.
- **Frontend:** `tsc` + `vite build` clean; manual click-through in the real form (candidate + supervisor) EN + AR: open the panel, toggle, search, "Use this" -> Q11 + the diagnosis/procedure fill correctly (respecting the reset-effect ordering), submit succeeds with the right `mainDiagDocId` + `diagnosisName`/`procedureName`; the manual path still works untouched; quota indicator + exhausted state.
- **Prod apply + deploy** only on an explicit ask (user runs the migration).

---

## 6. Reuse from the shipped public tool
- Backend `SearchService` (unchanged) is the shared core; the new provider adds only the auth + department-from-JWT + daily quota.
- The auto-fill match keys (`mainDiagnosis.title`, `diagnosis.icdCode`, `procedure.alphaCode`) are exactly what `SearchService` already returns.

---

## 7. Decisions - RESOLVED (user, 2026-07-24)
- **D1 (department source): JWT `departmentId` claim** (same resolution as `/mainDiag`, so the search department always matches the form's loaded tree and auto-fill matches). [recommended]
- **D2 (quota storage): append-only `in_app_search_events` log + per-day count** (also a usage audit). [recommended]
- **D3 (module): dedicated `src/inAppSearch/` module** (mirrors publicSearch). [recommended]
- **D4 (partial/no-match): fill what matches + a subtle "review" note**, not all-or-nothing. [recommended]
- **D5 (CPT in card): show the CPT `numCode`** in the in-form result card (authenticated institutional users; `includeCpt:true`). [recommended]
- **D6 (quota): 5 searches per user per UTC day**, reset at UTC midnight. [recommended]
- **D7 (type toggle default): default to Procedure** (user choice; still switchable to Diagnosis, mandatory selection).

---

## 8. (reserved)

## 9. CHECKPOINT TABLE (single source of truth for progress)
Legend: TODO / IN-PROGRESS / DONE / VERIFIED / BLOCKED. Keep current in real time.

### Stage A - Decisions locked
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| A1 | D1-D7 confirmed by user (2026-07-24): JWT dept, events-log quota, dedicated module, graceful partial-match, CPT shown, 5/user/UTC-day, toggle defaults to Procedure | DONE | see section 7 |

### Stage B - Backend endpoint + quota
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| B1 | `in_app_search_events` entity + migration + register in both datasource configs | DONE | migration 1783782610240; registered in database.config + ka-migrations.config |
| B2 | provider: resolve dept from JWT claim -> {code,name,arName}; daily quota count+record; call SearchService(includeCpt:true) | DONE | src/inAppSearch/inAppSearch.provider.ts |
| B3 | service (repo: countByUserSince, record) | DONE | src/inAppSearch/inAppSearch.service.ts |
| B4 | controller + router `POST /inAppSearch/query` (requireCandidate) + validator | DONE | router chain: extractJWT -> institutionResolver -> userBasedRateLimiter -> requireCandidate -> validator |
| B5 | DI bind + route mount | DONE | container.config.ts (4 bindings), routes.config.ts (/inAppSearch) |
| B6 | tsc --noEmit clean | VERIFIED | exit 0 |

### Stage C - Backend E2E
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| C1 | authed query (candidate + supervisor JWT): dept auto, results, CPT numCode + icdCode + alphaCode present | VERIFIED | proc top=CRAN 61313-00 evacuation; dx=NA07.1 intracerebral hematoma; both carry match keys |
| C2 | quota blocks the 6th/day; remaining decrements 4->0 | VERIFIED | q1-5 ok (remaining 4,3,2,1,0), q6 quota_exhausted |
| C3 | migration apply/revert/re-apply on throwaway PG17 + NS-default (no claim) | VERIFIED | down() drops table clean; re-apply ok; no-claim -> NS default |

### Stage D - Frontend in-form panel + auto-fill
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| D1 | api.runInAppSearch + InAppSearchQueryResult type (reuses PublicSearchResultItem; sends getAuthHeaders + credentials) | DONE | src/utils/api.ts |
| D2 | collapsible AI-assist panel before Q11 (optional, raw-Tailwind indigo, bilingual) + mandatory Procedure/Diagnosis toggle (default Procedure) + query + quota indicator | DONE | SubmissionForm.tsx, gated on mainDiagnoses.length>0 |
| D3 | auto-fill logic (pendingAutoFillRef + follow-up effect keyed [mainDiagDocId, selectedMainDiag] for the reset gotcha; proc match by numCode/title, diagnosis by icdCode) | DONE | flushPendingAutoFill; sets state + ref |
| D4 | graceful partial-match ('partial'/'noMatch' banners) + scrollIntoView Q11 anchor | DONE | mainDiagAnchorRef |
| D5 | i18n aiAssist EN+AR (no em-dashes) | DONE | dashboard.i18n.ts (interface + EN + AR) |
| D6 | tsc + vite build clean | VERIFIED | tsc exit 0; vite built in 7.74s |

### Stage E - Docs + deploy
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| E1 | API_DOCUMENTATION (new In-App Semantic Search section + TOC + auth-summary row) + CLAUDE.md entry | DONE | |
| E2 | user click-test (candidate + supervisor, EN+AR); manual path unaffected | TODO | awaiting user |
| E3a | migration applied to prod ka-institute (user-run) + read-only verified | DONE | table + PK + IDX_iase_user_createdAt + migration row present, 0 rows |
| E3b | push to main both repos (explicit ask) | TODO | awaiting explicit go-ahead; code lives on `feat/in-form-search`, NOT deployed |

---

## 10. BUILD LOG (append-only, dated)
- 2026-07-24 (Stage B, backend, branch `feat/in-form-search`): created module `src/inAppSearch/` = `inAppSearchEvent.mDbSchema.ts` (entity, @Index userId+createdAt), `inAppSearch.service.ts` (countByUserSince/record), `inAppSearch.provider.ts` (getMaxPerDay = IN_APP_SEARCH_MAX_PER_DAY default 5; query() = startOfUtcDay count -> quota_exhausted if used>=max else resolveDepartment + record + SearchService.search{type, departments:[dept], limit:5, includeCpt:true}; resolveDepartment = SELECT departments by JWT mirror-UUID, fallback REF_DEPT_CODE/NS by code), `inAppSearch.controller.ts` (thin), `inAppSearch.router.ts` (POST /query: extractJWT -> institutionResolver -> userBasedRateLimiter -> requireCandidate -> inAppSearchQueryValidator; actor from res.locals.jwt, 401 if no userId). Validator `src/validators/inAppSearch.validator.ts` (query 2-500 trim, type isIn procedure|diagnosis). Migration `src/migrations-ka/1783782610240-CreateInAppSearchEvents.ts` (CREATE TABLE + IDX_iase_user_createdAt, clean down()). Wiring: `container.config.ts` (+4 bindings), `routes.config.ts` (mount /inAppSearch), `database.config.ts` + `ka-migrations.config.ts` (register InAppSearchEventEntity). tsc --noEmit exit 0.
- 2026-07-24 (Stage C, backend E2E on throwaway Docker PG17): applied all KA migrations (seeded legacy clerk 45eb7fb8-... first for migration 140 gotcha) -> 240 applied; verified table + IDX_iase_user_createdAt; down()/re-apply clean. Ran provider E2E against the REAL hub: NS-claim procedure search top = "evacuation" CRAN CPT 61313-00 mainDiag "cranial trauma"; quota 5/UTC-day (remaining 4,3,2,1,0 then quota_exhausted on the 6th); diagnosis search returns ICD-coded hits (NA07.1 intracerebral hematoma etc.); no-claim -> NS default. In-app tool returns CPT numCode (D5). Container + temp test removed.
- 2026-07-25 (Stage E, prod migration): user ran `npm run db:ka:migrate` on prod ka-institute -> migration 240 applied. Read-only verify (temp script, removed): `in_app_search_events` present with all 6 columns (id/userId/userRole/departmentId/type/createdAt), PK + `IDX_iase_user_createdAt`, migration row `CreateInAppSearchEvents1783782610240` recorded, 0 rows. NB: the `/inAppSearch/query` ROUTE is not deployed yet (still on `feat/in-form-search`); it goes live only on the push to main. Local dev servers (branch code) can click-test now against prod DB + live hub.
- 2026-07-24 (Stage D, frontend, branch `feat/in-form-search` on NeuroLogBookFront): `src/utils/api.ts` = `InAppSearchQueryResult` type (reuses `PublicSearchResultItem`) + `api.runInAppSearch({query,type})` (POST /inAppSearch/query, getAuthHeaders + credentials:'include', 429->RATE_LIMITED, unwrap .data). `src/content/dashboard.i18n.ts` = `submissionForm.aiAssist` block (interface + EN + AR, 0 em-dashes). `src/components/SubmissionForm.tsx` = optional collapsible indigo panel inserted before Q11 (gated `mainDiagnoses.length>0`): mandatory Procedure/Diagnosis toggle (default Procedure), query input (Enter to search), Search button, remaining/quota/rate-limit/error lines, results list (localized name, CPT/ICD code mono-LTR, main-diagnosis label, similarity%), "Use this" -> `applyAiResult`. Auto-fill: match main diagnosis by normalized title -> `setMainDiagDocId`; stage the leaf in `pendingAutoFillRef`; a follow-up effect keyed [mainDiagDocId, selectedMainDiag] runs AFTER the mainDiag-change reset effect (declared earlier) and calls `flushPendingAutoFill` (procedure by numCode/title, diagnosis by icdCode) -> sets state + the mirror ref; green filled / amber partial|noMatch banners; scrollIntoView the Q11 anchor. Manual filling untouched. tsc exit 0; vite build clean.

---

## 11. Decisions & deviations (append-only, dated)
- 2026-07-24: Plan drafted from a 2-agent inventory. Grounding: the form holds the full tree in memory (match hits by code); the mainDiag-change effect resets leaf selections (ordering gotcha); `SearchService` is reusable with the user's dept + `includeCpt:true`; department must resolve from the JWT claim to match the loaded tree.
- 2026-07-24: D1-D7 RESOLVED by user (section 7). Toggle defaults to Procedure; all others recommended defaults.

---

## 12. Standing constraints (do not violate)
- No em-dashes anywhere (UI/AR/comments/commits/docs). Use period, comma, colon, or parentheses.
- Never commit or push to `main` without an explicit ask. Work on purpose-named side branches. `main` = production (Railway backend, Netlify frontend).
- Local `PSQL_*` = `ka-institute` = production; no schema/data writes without a go-ahead; the harness blocks agent-run prod migrations, so the user runs `npm run db:ka:migrate`. Dev/E2E on alt-port + throwaway Docker DB.
- Do NOT change the manual tree-filling flow; the AI assist is strictly additive and optional.
- Keep this document current per section 0.
