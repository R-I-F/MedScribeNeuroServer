# Public Semantic Search Tool ("Explore our data flow") - Implementation Plan

> Status: **DRAFT - awaiting user review before ANY development.** We only start implementing after the user approves this plan.
> Surface: **public landing page** (unauthenticated), gated behind a soft email + OTP registration with a small free-query quota.
> Repos: backend `F:\WebDev\MedScribeNeuroServer` (KA spoke, Node/TS/Express + TypeORM + Inversify); frontend `F:\WebDev\NeuroLogBookFront` (React/TS/Vite, landing = LibelusPro). The reference hub `F:\WebDev\LibelusRefApi` is used **as-is** (server-to-server via X-API-Key); no hub change is needed (D1 resolved to a user-selected department picker).
> Standing constraints (section 12) apply: no em-dashes anywhere, never push to `main` without an explicit ask, `PSQL_*` = production `ka-institute` (writes need go-ahead), test on alt-port/throwaway DB.

---

## 0. HOW TO USE THIS DOC (progressive-documentation protocol - READ FIRST)

**This document is the living memory of the build.** If a session is interrupted (token limit, crash, restart), the next session MUST open this file and know exactly what is done and what is not.

1. **The Checkpoint Table (section 9) is the single source of truth for progress** - every sub-step is `TODO` / `IN-PROGRESS` / `DONE` / `VERIFIED` / `BLOCKED`.
2. **Update the checkpoint the moment a sub-step changes state** - before moving on, not at the end. A half-done step is left `IN-PROGRESS` with a one-line note on exactly where it stopped.
3. **Every applied migration, new file, changed call-site, and env var gets a dated bullet in the Build Log (section 10).** Append-only.
4. **Anything discovered mid-build that changes the plan** goes in Decisions & Deviations (section 11), dated, with the why.
5. On resume: read section 0 -> section 9 -> latest entries in 10 & 11, then continue from the first non-`DONE` sub-step.
6. Keep this file current the same way `CLAUDE.md`'s "Where we stopped" is kept current.

---

## 1. Goal & scope

LibelusPro is a black box today: everything is behind a login. This tool exposes the **reference data flow** (Department -> Main diagnosis -> Diagnosis/Procedure + codes) through a **controlled, AI-assisted public search**, so outsiders can understand the app's data model without an account.

A visitor:
1. Chooses whether they are searching for a **Procedure** or a **Diagnosis** (a small toggle, asked up front).
2. Types a natural-language phrase (e.g. "suction of blood from the brain") even if they do not know the scientific name or where it lives in the tree.
3. Gets the **top 5** semantically-matched candidates. Context in the phrase narrows the result (e.g. "from the brain" surfaces Neurosurgery candidates); a context-free phrase ("suction of blood") returns a broader cross-department set.
4. Clicks a result to see its place in the tree: **(1) Department, (2) Main diagnosis, (3) the leaf** - Diagnosis + ICD code, OR Procedure + ALPHA code + CPT (numCode) - **plus a plain description**.

**Access is gated** to prevent abuse and to capture soft leads: "Try our semantic search for free - enter your email", email OTP verification, then a small quota (proposed **5 queries per verified email**), after which a "Register for full access" CTA appears.

**Reuse note (out of scope now, design for it):** the same search service will later be used **inside the app** for surgical submissions, where the **department is already known** and passed in. So the core search must accept an optional department and skip the public gate for authenticated internal callers.

Out of scope: a free-form LLM chatbot; exposing anything beyond reference catalog data; editing/writing reference data; the in-app submission integration itself.

---

## 2. Current-state findings (from a 4-agent codebase inventory)

### 2.1 Semantic search lives on the HUB, not the spoke
- **The spoke has NO local semantic search**: no pgvector, no cosine, `diagnosisSearch`/`referenceDb`/`embedText` were deleted in the KA-spoke conversion. The mirror tables (`diagnoses`, `proc_cpts`) store **text only, no `embedding` column** (`src/refApi/refMirror.service.ts` writes only text fields).
- **`AiAgentService` (`src/aiAgent/aiAgent.service.ts`) can generate text but CANNOT embed.** Methods: `generateText(prompt)` and `generateContentFromAudioAndText(...)`, model `gemini-2.5-flash` (env `GEMINI_API_KEY`, `GEMINI_MODEL_NAME`, `GEMINI_API_VERSION`). No embedding method.
- **The hub (`LibelusRefApi`) does the pgvector work.** `POST /v1/procedure-search` and `POST /v1/diagnosis-search` (gemini-embedding-001, 768-dim, HNSW cosine). The spoke reaches the hub through `RefApiClient` (`src/refApi/refApi.client.ts`), base `REF_API_URL`, header `X-API-Key` from `REF_API_KEY`/`REF_API_KA`. The client already has `procedureSearch()`; it does **NOT** have `diagnosisSearch()` yet (would need adding). The hub is deployed (Railway; the clerk-proc pipeline calls it in prod).

### 2.2 The hub search REQUIRES a department (no cross-department mode)
Both hub searches reject a request unless exactly one of `deptCode`/`departmentId` is supplied, and the pgvector SQL **hard-scopes by department via an inner JOIN** (`diagnosis-search`: `department_diagnoses.departmentId`; `procedure-search`: `main_diag_procs -> main_diags.departmentId`). There is no all-departments query path. Result fields:
- diagnosis: `icdCode, icdName, icdArName, description, arDescription, similarity, mainDiagnoses:[{title,arTitle}]`
- procedure: `alphaCode, numCode, title, arTitle, description, arDescription, similarity, mainDiagnoses:[{title,arTitle}]`
- Neither echoes the department or the mainDiag id; the caller knows the department (it searched that dept), and `mainDiagnoses[].title` gives the "main diagnosis" line.
So a search result already contains everything the "on click" detail needs (department is known from the search scope; main-diag title; leaf + codes; description).

### 2.3 Anti-abuse + OTP templates already exist on the spoke
- **`src/demoRequest/**`** (public "Book a demo"): the anti-abuse template - dedicated IP rate limiter `demoRequestRateLimiter` (5/15min), honeypot `website`, `elapsedMs` min-fill, per-email + per-IP daily DB caps, global daily email budget, HTML-escaping, and the **anti-oracle contract** (every discard returns an identical generic 201). Public (no `extractJWT`), mounted in `routes.config.ts`.
- **`src/pendingSignup/**`**: the OTP template - 6-digit `crypto.randomInt` code, bcrypt-hashed, 15-min TTL (resend does not extend), 60s resend cooldown x max 3 sends, 5 wrong-attempt lock, a `setInterval().unref()` purge sweep, jsonb payload, env `OTP_DEV_LOG`/`PENDING_SIGNUP_PURGE_MS`. Backed by `pending_signups`.
- **Rate limiter** (`src/middleware/rateLimiter.middleware.ts`): `express-rate-limit`, in-memory, IP-only. **A per-verified-email quota is NOT expressible here** - it must be a provider-level DB count (like `demoRequest.service.countByEmailSince`).
- **Mailer** (`src/mailer/mailer.service.ts`): Mailgun, `sendMail({to,subject,text?,html?,from?})`, inline HTML (OTP email style in `pendingSignup.provider`).

### 2.4 Frontend landing + gated-UI reusables
- Landing = `src/pages/LandingPage.tsx` composing `src/components/landing/*` sections (`LandingHero/Features/Contact/...`), each taking `copy: LandingCopy`. New section = `LandingAiSearch.tsx` added to `<main>`. Styles in `src/styles/landing.css` (glass tokens `--glass-bg`, `--grad-brand`, etc.); Aurora background.
- **`LandingDemoForm.tsx`** = the modal template (honeypot `.demo-hp`, `elapsedMs`, `api.requestDemo`, success/error, `.demo-modal*` CSS, mobile bottom-sheet).
- **`SignupOtpStep.tsx`** = the OTP UI (props `signupId,email,expiresAt,onVerified,onTerminal`; countdown, resend x3, 5 attempts). Driven by a `'form' | 'otp' | 'success'` step machine (see `CandidateSignupPage`). **Requires `LandingLanguageContext` provider** - `LandingPage` does NOT mount it today, so we mount `LandingLanguageContext.Provider` around the widget (or use a `LoginLayout`-style shell).
- **`PhraseCombobox.tsx`** = an accessible search-input with match highlighting + bilingual lines - a strong basis for the query box (free text accepted). No chat/streaming component exists (build fresh if wanted).
- i18n: `src/content/landingPage.i18n.ts` (`LandingCopy` type + `en`/`ar`, TS-enforced parity). Public API methods in `src/utils/api.ts` follow the `requestDemo`/`getDepartments` no-auth pattern (`credentials:'include'`, 429 -> `RATE_LIMITED`).

---

## 3. Proposed architecture

**The frontend never calls the hub directly** (that would leak the hub URL + X-API-Key). The landing widget calls the **spoke** public API; the spoke proxies to the hub server-to-server. One core search service on the spoke serves both the public tool and (later) authenticated in-app callers.

```
Landing widget (public)                         Spoke backend (public, gated)                 Hub (X-API-Key)
  type toggle + query  ── POST /publicSearch/query ──▶  verify session + quota
                                                        resolve department scope (D1)
                                                        ── /v1/{procedure|diagnosis}-search ──▶ pgvector cosine
                                                        merge + enrich (dept, mainDiag)  ◀────  results + similarity
  top-5 results  ◀────────────────────────────────────  shaped results
```

### 3.1 Department scope - RESOLVED (D1, user 2026-07-24): the visitor picks the department(s)
No auto-detection and no cross-department hub endpoint. The tool shows a **department picker** where the visitor selects **1 or 2 departments** (hard max 2, e.g. PRS + GS). The spoke calls the EXISTING hub dept-scoped search (`/v1/procedure-search` or `/v1/diagnosis-search`) **once per selected department** (1 or 2 calls) and merges the hits by `similarity` (scores are comparable across departments) to return the top 5. This uses the hub as-is (**no `LibelusRefApi` change, Stage H dropped**), removes the brittle LLM-classification / fan-out problem, and makes narrowing explicit and deterministic. The Gemini embedding on the hub still does the natural-language-to-scientific-name matching WITHIN the chosen department(s), which is the core value (e.g. "suction of blood" typed under NS surfaces the cranial-evacuation procedure). The same `search({ query, type, deptCodes, limit })` interface (deptCodes = 1-2 codes) serves the future in-app caller, which passes its single known department.

### 3.2 What the LLM does (and does not do) - safety
- The core AI is the **Gemini embedding on the hub** (semantic match within the chosen department[s]). With the department user-selected, **no LLM classification is needed**.
- **Descriptions come from the DB** (`proc_cpts.description`/`diagnoses.description` + AR), never LLM-generated (no hallucinated medical text).
- **Optional enhancement (D3, approved as opt-in per best practice):** a clearly-labeled "Explain in plain language" button per result that sends ONLY the DB fields (not raw user text) to `generateText` for a one-paragraph lay summary. Off by default; the visitor opts in per result. User text is always treated as untrusted data, never instructions; there is no free-form LLM chat surface.

### 3.3 The gate: soft email registration + OTP + quota
Modeled on `demoRequest` (anti-abuse shell) + `pendingSignup` (OTP), new table `public_search_sessions`:
`id (uuid = sessionId), email (lowercased), otpHash, verified (bool), verifiedAt, queryCount (int), maxQueries (int, default 5), ip, userAgent, attempts, sendCount, lastSentAt, otpExpiresAt, sessionExpiresAt, createdAt`.

Flow:
1. `POST /publicSearch/session {email, website(honeypot), elapsedMs}` -> full anti-abuse (dedicated IP rate limiter, honeypot, min-fill, per-email + per-IP daily caps, global daily OTP-email budget, HTML-escape), create/refresh a session row with a fresh OTP, email the 6-digit code, return the **identical generic** `{sessionId, expiresAt, email}` on every accepted path (anti-oracle).
2. `POST /publicSearch/verify {sessionId, code}` -> OTP verify (5 attempts, 15-min expiry). On success: `verified=true`, `sessionExpiresAt = now + 24h`, return `{ok, remaining: maxQueries}`.
3. `POST /publicSearch/resend {sessionId}` -> 60s cooldown, max 3 sends.
4. `POST /publicSearch/query {sessionId, query, type}` -> require `verified` + not `sessionExpiresAt`-expired + `queryCount < maxQueries`; increment `queryCount`; run the search; return `{results, remaining}`. At quota: `{quotaExhausted:true}` (frontend shows the register CTA). `sessionId` is an unguessable uuidv4 bearer (optionally upgrade to a signed short-lived token - D5).

Quota is a **DB counter on the session row** (the rate limiter is IP-only and cannot enforce per-email). A `setInterval().unref()` purge sweep deletes expired/exhausted sessions (mirrors `pendingSignup`).

### 3.4 The search pipeline (spoke)
1. Validate + normalize `query` (2-500 chars), `type` (`procedure|diagnosis`), and `deptCodes` (1-2 valid department codes; reject 0 or >2).
2. Call the hub (`RefApiClient`) once per selected department: add a `diagnosisSearch()` method (mirrors the existing `procedureSearch()`).
3. Merge the 1-2 result sets by `similarity` desc; take top 5.
4. Enrich each hit with its **department code + name** (the department it was searched under) and shape to a stable public DTO:
   `{ kind, department:{code,name,arName}, mainDiagnosis:{title,arTitle}, leaf: (diagnosis:{icdCode,icdName,icdArName} | procedure:{title,arTitle,alphaCode}), description, arDescription, similarity }`.
   Per D2, the procedure leaf **omits the CPT `numCode`** for the public/anonymous tool (the DTO shaping is caller-aware: authenticated in-app callers get `numCode` too).
5. Return top 5.

---

## 4. Backend design (spoke)

New module `src/publicSearch/` (router/controller/service/provider/entity), wired in `container.config.ts` + mounted **public** (no `extractJWT`) in `routes.config.ts`, mirroring `demoRequest`.
- **Entity/migration:** `public_search_sessions` (+ indexes on `email`, `ip`, `sessionExpiresAt`); migration `1783782610230-CreatePublicSearchSessions` added to `src/migrations-ka/` (git-tracked). Register the entity in both datasource configs.
- **Provider:** the anti-abuse + OTP + quota logic (reuse the `demoRequest`/`pendingSignup` mechanics; do NOT re-invent). New env knobs mirroring demoRequest (`PUBLIC_SEARCH_*`: per-email/day, per-ip/day, otp-email budget, min-fill ms, max queries, session TTL, dev-log).
- **SearchService (reusable core):** `search({ query, type, deptCodes, limit })` (deptCodes = 1-2) -> per-dept hub calls + merge + enrich + caller-aware DTO shaping. Public callers reach it through the gate and get the CPT-hidden shape; a future in-app caller passes its known single department, skips the gate, and gets `numCode`.
- **RefApiClient:** add `diagnosisSearch(query, deptCode, limit)` (mirrors the existing `procedureSearch`). No hub change (departments come from the user, max 2).
- **Rate limiter:** a dedicated `publicSearchRateLimiter` (IP), separate for the session vs query routes.
- **Mailer:** reuse for the OTP email (LibelusPro OTP style).
- **Env (prod, Railway):** must NOT set the dev-log flag; `REF_API_URL`/`REF_API_KEY` already set; confirm `GEMINI_API_KEY` if Option B/D3.

---

## 5. Frontend design (landing)

Per **D7**: an **inline teaser section** on the landing (`src/components/landing/LandingAiSearch.tsx` in `LandingPage.tsx <main>`: a glass card with eyebrow + short pitch + an "Explore our data flow" CTA) that routes to a **dedicated public `/explore` page** (`src/pages/ExplorePage.tsx`, public route in `App.tsx`) holding the full tool. The /explore page uses a `LoginLayout`-style shell so `LandingLanguageContext` is mounted (required by the reused `SignupOtpStep`); the teaser section itself needs no provider (static copy + a link).

/explore state machine: `intro -> email -> otp -> ready -> (searching) -> results`, plus `quota`.
- **Type toggle:** Procedure / Diagnosis (a `SegmentedToggle`-style control) shown up front.
- **Department picker:** multi-select of **1 or 2** departments (hard-capped at 2) from public `GET /departments`; required before a search runs. Bilingual labels (name/arName).
- **Gate:** email input (honeypot + `elapsedMs`) -> `api.startSearchSession` -> `SignupOtpStep` (reused, `onVerified` flips to `ready`) -> a "N of 5 free searches" indicator.
- **Query box:** a `PhraseCombobox`-style input + search button.
- **Results:** top-5 cards (leaf name + code + department chip + similarity bar); click -> a detail panel showing **Department -> Main diagnosis -> leaf (diagnosis+ICD, or procedure+ALPHA; no CPT number publicly per D2) -> description**, bilingual, `dir="auto"`, glass styling, `--grad-brand` accents.
- **Quota exhausted:** a "Register for full access" panel linking to signup.
- **New api.ts methods** (public, no auth): `startSearchSession`, `verifySearchOtp`, `resendSearchOtp`, `runPublicSearch` - following the `requestDemo`/`verifySignupOtp` patterns (429 -> `RATE_LIMITED`; OTP returns a discriminated union).
- **i18n:** a new `aiSearch` block in `landingPage.i18n.ts` (EN + AR, TS-parity), **no em-dashes** (the existing file violates this; new copy must not).
- **Design system:** glass card, Aurora fit, `landing-*` tokens; reuse `.demo-modal*` input styles.

---

## 6. Security, anti-abuse & privacy (best practices)
- **Anti-oracle:** the session-request endpoint returns an identical generic response on every accepted/discarded path (honeypot, timing, caps) - never reveals whether an email exists or a cap was hit.
- **Layered abuse limits:** dedicated IP rate limiter (session + query), honeypot, `elapsedMs` min-fill, per-email + per-IP daily caps, a **global daily OTP-email budget** (Mailgun reputation), and the per-verified-email **query quota** (DB counter). This bounds cost even under distributed bots.
- **OTP hygiene:** 6-digit crypto code, bcrypt at rest, 15-min TTL, 60s/x3 resend, 5-attempt lock, purge sweep. `OTP_DEV_LOG`-style flag NEVER in prod.
- **AI safety:** user text is data, not instructions; fixed prompts; allow-listed classification output; DB-sourced descriptions (no hallucination); no free-form LLM surface. Log/enforce a max query length.
- **Input hardening + escaping:** trim/length-cap all inputs; HTML-escape anything rendered into emails.
- **Data exposure (D2, RESOLVED - risk-minimizing default):** ICD-11 is WHO-public and is shown in full. CPT codes + descriptors are AMA-copyrighted and the owner has NO AMA license (stated by the user). This is not legal advice, but exposing CPT publicly without a license is a real infringement risk, and hiding the "AMA" label does NOT cure it (it removes attribution while still copying the content). Default for the PUBLIC/anonymous tool: show the procedure's **own ALPHA code + title + description** and **omit the raw CPT `numCode`**; do not label anything "AMA". The CPT `numCode` stays visible only to authenticated in-app (institutional) users. Revisit and attribute properly if an AMA license is obtained.
- **Secrets:** the hub URL + X-API-Key stay server-side; the frontend only ever talks to the spoke.
- **PII:** store the soft-lead email + ip/userAgent (like demoRequest). Add a one-line privacy note near the email field ("we use your email to send a code and occasional product updates" - confirm the marketing-consent wording).

---

## 7. Performance
- Cross-dept single-embed (Option A) is one Gemini embed + one indexed HNSW query per search. Option B is up to K embeds + K indexed queries; cap K (default 3).
- Cache the hub `/v1/departments` list on the spoke (already effectively available) for enrichment; no per-query dept lookup.
- The quota (5) bounds per-user cost; the daily budgets bound global cost.
- Hub cold-start (Railway) can exceed the client timeout - reuse the existing retry/timeout in `RefApiClient` and show a graceful "try again" on timeout.

---

## 8. Testing & verification
- **Backend E2E on an alt-port instance** (never the user's :3001): session-request anti-abuse (honeypot/timing/caps all return the identical generic 201), OTP verify happy-path + 5-attempt lock + expiry + resend cooldown, quota enforcement (6th query blocked), and the search pipeline against the **real hub** with fixture queries ("...from the brain" narrows to NS; context-free returns cross-department; procedure vs diagnosis toggle hits the right hub endpoint; result shape carries department + mainDiag + codes + description).
- **Migration** apply + revert-cycle on a throwaway Docker PG17 (as with the active-users work).
- **Frontend:** `tsc` + `vite build` clean; a manual click-through of the full gate + search + result-detail in EN and AR (RTL).
- **Prod apply** (migration + deploy) only on an explicit ask, user-run for the DB write.

---

## 9. CHECKPOINT TABLE (single source of truth for progress)
Legend: TODO / IN-PROGRESS / DONE / VERIFIED / BLOCKED. Keep current in real time. (Stages assume Decision D1 is resolved; Stage H is Option-A-only.)

### Stage A - Decisions locked (section 11)
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| A1 | D1-D7 resolved (user 2026-07-24): dept picker max 2; CPT hidden publicly; opt-in AI-explain; gate numbers approved; uuid session; inline teaser -> /explore | DONE | see section 11 |

### Stage B - Backend gate module (public_search_sessions)
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| B1 | migration + entity + datasource registration | TODO | |
| B2 | provider: anti-abuse (honeypot/timing/caps/budget) + OTP + quota | TODO | |
| B3 | routes (session/verify/resend/query) public + rate limiter + validators | TODO | |
| B4 | OTP email (Mailer) | TODO | |
| B5 | purge sweep wired at boot | TODO | |

### Stage C - Search core + hub
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| C1 | RefApiClient.diagnosisSearch() (mirrors procedureSearch) | TODO | no hub change |
| C2 | SearchService.search({query,type,deptCodes,limit}) + per-dept calls + merge by similarity + enrich (dept, mainDiag) | TODO | |
| C3 | validate 1-2 selected departments (reject 0 or >2) | TODO | |
| C4 | caller-aware DTO shaping (public omits CPT numCode; in-app includes it) | TODO | |

### Stage D - Backend E2E
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| D1 | anti-abuse + OTP + quota E2E (alt port) | TODO | |
| D2 | search E2E vs real hub (context-narrowing, both types, shape) | TODO | |
| D3 | migration apply/revert on throwaway PG17 | TODO | |

### Stage E - Frontend widget
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| E1 | api.ts public methods (session/verify/resend/query) | TODO | |
| E2 | landing teaser section `LandingAiSearch` + dedicated public `/explore` page (LoginLayout-style shell mounts the language provider) + state machine | TODO | |
| E3 | type toggle + department multi-select (max 2) + email gate + reused SignupOtpStep + quota indicator | TODO | |
| E4 | query box + results cards + result-detail (tree path; no CPT number) | TODO | |
| E5 | i18n aiSearch EN+AR (no em-dashes) + landing.css | TODO | |
| E6 | tsc + vite build clean | TODO | |

### Stage F - Optional AI explain (D3, opt-in per result, DB-fields-only) | TODO |
### Stage G - Docs + deploy
| # | Sub-step | Status | Note |
|---|----------|--------|------|
| G1 | API_DOCUMENTATION + CLAUDE.md | TODO | |
| G2 | user click-test EN+AR | TODO | |
| G3 | migration applied to prod (user-run) + push to main (explicit ask) | TODO | |

(Stage H "hub cross-department endpoint" was DROPPED - D1 resolved to a user-selected department picker, so no `LibelusRefApi` change is needed.)

---

## 10. BUILD LOG (append-only, dated)
- 2026-07-24: Plan APPROVED by user. Backend branch `feat/public-semantic-search` created.
- 2026-07-24: Stages B + C backend code DONE + tsc clean. New module `src/publicSearch/` (publicSearchSession.mDbSchema, publicSearch.service [session repo + per-email quota sum], publicSearch.provider [anti-abuse + OTP + quota + purge sweep + orchestration], publicSearch.controller, publicSearch.router [4 public routes, anti-oracle /session], search.service [reusable core: per-dept hub calls + merge + caller-aware DTO]). Migration `1783782610230-CreatePublicSearchSessions`. RefApiClient + `diagnosisSearch()` + `IRefDiagnosisSearchHit`. Rate limiter `publicSearchRateLimiter` (10/15min). Wiring: container.config (5 binds), routes.config (/publicSearch public mount), database.config + ka-migrations.config (entity), index.ts (purge sweep at boot). New env knobs `PUBLIC_SEARCH_*`. Nothing committed, nothing applied to prod.
- 2026-07-24: Stage D backend E2E VERIFIED. (D2) search vs the REAL deployed hub: "suction of blood from the brain"/NS/procedure -> CRAN evacuation + burr holes (cranial trauma), CPT hidden; "bleeding inside the brain after trauma"/NS/diagnosis -> intracerebral hematoma NA07.1 etc (diagnosis-search IS deployed, no hub redeploy needed); "skin flap reconstruction"/PRS+GS -> merged, PRS flaps rank top. (D1) gate on throwaway PG17: honeypot + too-fast discards create no row and return the generic shape; OTP wrong->attemptsRemaining 4, correct->verified remaining 5; 5 queries ok then 6th quota_exhausted (per-email quota); per-email/day cap holds at 3. (D3) migration 230 apply -> revert (table gone) -> re-apply clean. Temp scripts + container removed. Stages B/C/D DONE. Starting Stage E (frontend).
- 2026-07-24: Stage E (FRONTEND) DONE + tsc + vite build clean. Frontend branch `feat/public-semantic-search`. New: `pages/ExplorePage.tsx` (LoginLayout shell + state machine gate->otp->ready; type toggle, department multi-select max 2, query box, expandable result cards with tree path, quota indicator + register CTA), `components/landing/ExploreOtpStep.tsx` (dedicated OTP calling the public-search API), `components/landing/LandingAiSearch.tsx` (landing teaser section -> /explore). Edits: utils/api.ts (PublicSearch types + 4 methods, .data-unwrap + 429->RATE_LIMITED + OTP discriminated unions), content/landingPage.i18n.ts (aiSearch block ~50 keys EN+AR, no em-dashes), pages/LandingPage.tsx (teaser mounted), App.tsx (public /explore route), styles/landing.css (.ai-search* teaser styles). CPT number never rendered publicly. Nothing committed. Remaining: Stage F (optional AI explain), live click-test (needs migration 230 applied to the running backend's DB), Stage G (docs + deploy on explicit ask).
- 2026-07-24: Migration 230 APPLIED to prod ka-institute (user-run `db:ka:migrate`; verified read-only [X] 38). Feature now live-testable on the local branch servers.
- 2026-07-24: Stage F (opt-in AI explain) DONE + tsc/build clean both repos. Backend: provider.explain (verified-session gated, DB-fields-only prompt, length-capped, no user query text) + AiAgentService inject + controller + `POST /publicSearch/explain` (strictRateLimiter) + validator. Frontend: api.explainResult + per-result "Explain in plain language" button (opt-in, labeled AI-generated) + 3 i18n keys EN+AR. Verified real Gemini generateText produces a clean EN + AR lay explanation from the DB fields. All Stages B-F COMPLETE. Remaining: Stage G (API doc + CLAUDE.md + commit + push to main, on explicit ask).

---

## 11. Decisions & deviations

**All RESOLVED by the user, 2026-07-24:**
- **D1 (department strategy): the visitor picks 1-2 departments** (hard max 2, e.g. PRS + GS) via a picker; the spoke searches the existing hub per selected department and merges. No auto-detection, no LLM classification, and **no hub change** (Stage H dropped). Cleanest and self-contained; Gemini embeddings still do the natural-language matching within the chosen department(s).
- **D2 (CPT): risk-minimizing default.** ICD-11 shown in full (WHO-public). CPT is AMA-copyrighted and no license is held; not legal advice, but public exposure is a real risk and hiding the label does not cure it, so the public tool shows the procedure's own ALPHA code + title + description and OMITS the raw CPT `numCode`; `numCode` stays in-app only. Revisit if a license is obtained.
- **D3 (AI explain): included as opt-in** per result, DB-fields-only, clearly labeled AI-generated (best-practice safe use). Built last (Stage F).
- **D4 (gate numbers): approved** as proposed - 5 free queries/verified email, 15-min OTP TTL, 60s resend x max 3, 5-attempt lock, per-IP daily caps, 24h session, global daily OTP-email budget.
- **D5 (session token): best practice** - an opaque unguessable `sessionId` (uuidv4) bearer over HTTPS, checked against the DB (which is authoritative for verified-state + quota). No JWT needed since the DB lookup is required for the quota anyway.
- **D6 (consent): best practice** - the OTP email is transactional (no marketing consent needed to send a code); a short, clear privacy line by the email field notes the email is used to send the code and may be used for occasional product updates, with an unsubscribe path. Store the lead like demoRequest.
- **D7 (entry point): both** - an inline teaser section on the landing page linking to a dedicated public `/explore` page that holds the full tool.

**Deviations (append-only, dated):**
- 2026-07-24: Plan drafted from a 4-agent inventory. Grounding: spoke cannot embed (only generateText); hub owns pgvector search but requires a department and has no cross-department mode; demoRequest + pendingSignup are the anti-abuse + OTP templates; frontend has LandingDemoForm/SignupOtpStep/PhraseCombobox to reuse.
- 2026-07-24: D1-D7 resolved (above). Net effect: architecture simplified - no `LibelusRefApi` change, no LLM department detection; the tool is fully contained in the spoke + frontend repos. CPT number hidden on the public surface (D2).

---

## 12. Standing constraints (do not violate)
- No em-dashes anywhere (UI/AR/comments/commits/docs). Use period, comma, colon, or parentheses.
- Never commit or push to `main` without an explicit ask. Work on purpose-named side branches. `main` = production (Railway backend, Netlify frontend).
- Local `PSQL_*` = `ka-institute` = **production**. No schema/data writes without an explicit go-ahead; the harness blocks agent-run prod migrations, so the user runs `npm run db:ka:migrate`. Dev/E2E on an alt-port instance + throwaway Docker DB.
- The frontend must never call the hub directly (keep the hub URL + X-API-Key server-side).
- Keep this document current per section 0.
