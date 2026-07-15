# Clerk Procedures — Self-Learning Input Pipeline (Plan)

**Status**: 📋 DRAFT — awaiting user review · **Date**: 2026-07-15
**Repos**: MedScribeNeuroServer (`migration/mysql-to-postgres`) + NeuroLogBookFront (`design-integration`) + LibelusRefApi (read-only consumer)
**Databases**: KA-PSQL `ka-institute` (staging — the ONLY write target) · production MySQL `SQL_DB_DEF_NAME_KA` (**READ-ONLY, never touched**)

---

## 🔴 Hard guardrails (verbatim user requirement)

1. **`SQL_DB_DEF_NAME_KA` (production MySQL) is NEVER edited, dropped, patched, or touched.** Every production access in this plan is a read-only SELECT through the guarded `query.js`-style connection (`SET SESSION transaction_read_only = 1`).
2. All drops/writes happen on **`ka-institute` (staging PG)** only.
3. The hub (LibelusRefApi) is consumed via its public API only — no hub DB writes.
4. **The legacy six-flag additional-questions schema is DEAD and stays dead** (user: *"the old schema is a child that died 1000 years ago"*). The submissions re-ETL writes answers ONLY as keyed rows in `submission_question_answers` against the hub-mirrored questions framework (`ref_questions`/`ref_question_options`). No six-flag columns, no legacy `additional_questions` table, no inline answer fields — nothing from the pre-`1783782610060` world is recreated in schema, code, or data.
5. **No procedure → no clerk_proc.** A production `cal_surg` whose `arabProcId` is NULL imports with `clerkProcId = NULL` and `procCptId = NULL` — the pipeline never invents a procedure for a surgery that never logged one.
6. **NOTHING starts before Stage 0: a full local snapshot of production exists and is verified.** Before any other stage runs, `SQL_DB_DEF_NAME_KA` is dumped in full to local disk (see §Stage 0) — so even in a worst-case screwup there is a complete restorable backup. No snapshot → no work.
7. **This document is the living memory of the work.** Every implementation step — done, partially done, skipped, or failed — is recorded in the `🔄 Progress Checkpoint` below **in the same session it happens**, before the work is considered complete. A future session (or a fresh model with no context) must be able to open this file alone and know exactly what exists, what doesn't, what was verified, and what the next action is. Nothing counts as done until it is written here.

---

## 🔄 Progress Checkpoint (living record — update every session, keep current)

**Last updated**: 2026-07-15 · **Status**: 📋 plan drafted — awaiting user review, nothing implemented

| Stage | State | Record (what was actually done, verified how, by whom/when) |
|---|---|---|
| §8 open questions | ✅ ANSWERED (user 2026-07-15: "i agree to all you're recommended open questions") | Q1 legacy clerkId=NULL · Q2 approved mapping WINS for the legacy 81, algorithm result only logged in the divergence report (algorithm rules for NEW inputs) · Q3 hub enhancement: /v1/procedure-search returns the matched mainDiagId · Q4 non-clerk creators → clerkId NULL · Q5 PII to Gemini accepted · Q6 store scores, cutoff decided later |
| **0 — FULL PRODUCTION SNAPSHOT (blocking)** | ✅ **DONE 2026-07-15** | `F:\DB_BACKUPS\kasr-el-ainy-20260715.sql.gz` (1,543,319 B, SHA-256 `46863ADD…A393`) + `kasr-el-ainy-cts-20260715.sql.gz` (37,047 B, SHA-256 `7FED099D…E857`). mysqldump --single-transaction via docker mysql:8 (read-only, no locks). **RESTORE-TESTED** into a scratch container: 31 tables = 31 live; cal_surgs 5,578 · submissions 3,599 · arab_procs 81 · candidates 110 · supervisors 56 · events 102 — ALL exact vs live prod. Scratch destroyed. Backup dir is outside all git trees. |
| A — migration (clerk_procs + cal_surgs columns) | ✅ DONE 2026-07-15 | `1783782610130-ClerkProcsLearningPipeline` applied on ka-institute: `clerk_procs` (UNIQUE dept+title, 4 FKs, matchScore real) + `cal_surgs.clerkProcId/patientNameAr/patientNameEn`. Entities: new `src/clerkProc/clerkProc.mDbSchema.ts`, CalSurgEntity extended, both registered in database.config + ka-migrations.config. tsc clean. |
| B — clerkProc module + hub procedureSearch client | ✅ DONE 2026-07-15 | Hub (LibelusRefApi, **uncommitted**): `/v1/procedure-search` response now includes `procCptId` + `mainDiagnoses[].id` (ordered by title) — additive; hub tsc clean. Spoke: `RefApiClient.procedureSearch()` (POST + retry/backoff), `IRefProcSearchHit` types, `ClerkProcService.resolveOrCreate()` per plan §2 with EXACT mirror fallback for pre-enhancement hubs ((alphaCode,numCode) unique 1436/1436; (departmentId,title) unique on main_diags — both verified live). Never blocks the clerk flow; failed resolutions retry on next encounter. DI bound. |
| C — bilingual patient-name service | ✅ DONE 2026-07-15 | `src/calSurg/patientName.service.ts`: Arabic-script regex detection (free), Gemini transliteration via existing `AiAgentService.generateText` (strict-JSON batch prompt, ~50 names/call), failure → typed slot filled + other NULL (never blocks). DI bound. Create path wired: POST /calSurg now takes `procedureText` (free text, validator updated); controller passes JWT clerkId (clerk role only, Q4); `CalSurgProvider.createCalSurgFromClerkInput` runs pipeline → stamps clerkProcId + procCptId + bilingual names + departmentId (body ?? REF_DEPT_CODE default). tsc clean. |
| D — staging wipe + re-ETL + divergence report | ✅ DONE 2026-07-15 | `scripts/rebuild-calsurgs-clerkprocs.cjs`: approved mapping captured 73/73 BEFORE wipe → wiped answers/subs/cal_surgs/clerk_procs → 81 clerk_procs seeded (clerkId NULL per Q1; approved mapping stored per Q2, algorithm logged) → **divergence report `docs/CLERK_PROCS_DIVERGENCE_REPORT.md`: agree 44 / disagree 29 / no-mapping 8** → 4,316 distinct names transliterated (Gemini batches, 0 failed chunks) → cal_surgs 5,578 rebuilt (ids preserved) → subs ETL rerun (3,599 + 5,948 keyed answers, 10/10 mainDiag remap, 0 FK orphans). **Verified**: with-clerkProc 4,608 · both-NULL 970 = prod NULL parity (guardrail #5 ✅) · six-flag columns 0 + legacy table 0 (guardrail #4 ✅) · 0 rows without a name slot · clerk_procs 81/81 resolved (procCptId+mainDiagId). Sample translit: محمد م م → Mohamed M M. |
| E — calSurg paths + frontend form/calendar | ✅ DONE 2026-07-15 | Backend: dashboard response + `clerkProc {title}`; new `GET /calSurg/clerkProcs` (superAdmin/instituteAdmin/clerk) = typeahead source. Frontend (design-integration): `PostCalSurgBody.procedureText` (free text), create form = free-text input + datalist typeahead of learned phrases (`dir=auto`, bilingual placeholder), calendar procedure line = clerk's words (AR) / CPT title (EN) + `· ALPHA` suffix; normalize + types updated. **Deliberate residue**: CalSurgEditModal still edits via the CPT picker (PATCH procCpt) — not the learning pipeline. Both builds clean. |
| F — E2E verification + docs | ✅ DONE 2026-07-15 | Live E2E (staging, clerk JWT): two creates with the SAME new phrase "استئصال ورم سحائي من الجبهة" → **ONE clerk_procs row** (learning ✅), hub-resolved → gross total resection · CRAN · cns tumors · score 0.713, clerkId stamped; bilingual names filled both creates. Test rows deleted, baseline 5,578/81 restored. **Bug found+fixed during E2E**: `processCalSurgData` dropped clerkProcId/departmentId/patientNameAr/En (procCpt survived) — fields added; also earlier mangled-input garbage cleaned. Live endpoint checks: /calSurg/clerkProcs = 81 rows with scores+context; dashboard rows carry clerkProc + procCpt + bilingual names. ⚠️ create latency ~16-20s (Gemini transliteration is synchronous in the create path) — works, but consider async fire-and-forget or thinkingBudget:0 as a follow-up. |

### ▶ Next action
User reviews the divergence report (`docs/CLERK_PROCS_DIVERGENCE_REPORT.md`, 29 disagreements — diagnostic only, approved mapping is what's stored) and decides on commit. Open follow-ups: async patient-name transliteration (create latency), edit-modal → pipeline, hub commit+deploy of the procedure-search id enhancement (mirror fallback covers until then).

### Session log
- **2026-07-15** — plan drafted + guardrails #4 (six-flag stays dead), #5 (no procedure → no clerk_proc), #6 (Stage-0 snapshot), #7 (living-document protocol) added per user. No code, no schema, no data touched yet.
- **2026-07-15 (same session)** — user: "i agree to all you're recommended open questions. start". Stages 0→F ALL implemented + verified (see table). Production MySQL only ever read (read-only sessions); full verified snapshot at `F:\DB_BACKUPS\`. Hub enhancement implemented but UNCOMMITTED (deployed Railway hub still serves the old shape — spoke's exact mirror-fallback in use). All spoke/frontend changes UNCOMMITTED, awaiting user go-ahead.

---

## Stage 0 — Full production snapshot (BLOCKING; runs before anything else)

A complete, restorable local backup of `SQL_DB_DEF_NAME_KA` so that even a catastrophic mistake is recoverable.

1. **Dump**: `mysqldump --single-transaction --routines --triggers --hex-blob` of the ENTIRE `kasr-el-ainy` database. `--single-transaction` = consistent InnoDB snapshot with **zero locks and zero writes** — safe against live production. (Optionally repeat for the `SQL_DB_DEF_NAME_KA_CTS` clone — cheap while we're at it.)
2. **Destination**: local disk, OUTSIDE any git working tree (e.g. `F:\DB_BACKUPS\kasr-el-ainy-<UTC timestamp>.sql.gz`). ⚠️ The dump is full patient PII + credentials — it must NEVER land in a repo, a commit, or any cloud upload. If a path inside a repo is ever used, it must be gitignored AND verified untracked.
3. **Verify before proceeding** (a dump that doesn't restore is not a backup):
   - dump completed without errors; gzip integrity check passes;
   - table count in the dump = table count in live prod;
   - row counts for the load-bearing tables (`cal_surgs`, `submissions`, `arab_procs`, `candidates`, `supervisors`, `events`) grepped from the dump match live prod counts;
   - **restore test**: load the dump into a scratch local database (or a throwaway schema), spot-check counts, then drop the scratch. Only after this passes is the snapshot considered real.
4. **Record in the checkpoint**: file path, size, SHA-256, dump timestamp, verified counts. No other stage may start until this row is ✅.

---

## 1. The problem being solved

Calendar surgeries are registered by **clerks with no medical-terminology knowledge**. Yesterday's arab_procs retirement replaced their familiar colloquial pick-list with the formal CPT catalog — correct data-wise, but hostile to the actual user at the keyboard. A clerk knows "ورم بالمخ"; they do not know "gross total resection (61510-00 CRAN)".

**Goal**: let clerks type whatever they normally type, and make the system *learn* — each new phrase is semantically resolved ONCE against the CPT catalog, remembered forever, and enriched with the medical context (probable main diagnosis + ALPHA code) that the calendar and analytics need.

---

## 2. The learning algorithm (per clerk input)

When a clerk submits a procedure text (e.g. **ورم بالمخ**) while creating a calendar surgery:

```
input text ──► normalize (trim, collapse whitespace)
        │
        ▼
  EXISTS in clerk_procs (same departmentId + normalized title)?
        │
   yes ─┼──► reuse the existing row → link cal_surg.clerkProcId. DONE.
        │    (zero tokens, zero API calls — this is the "learning")
   no ──┘
        ▼
  1. INSERT clerk_procs row (title, departmentId, clerkId)
  2. Semantic search: POST {hub}/v1/procedure-search
     { deptCode, query: title, limit: 1..5 }   ← hub embeds the query
     (gemini-embedding-001, pgvector cosine over proc_cpts.embedding)
  3. Save on the clerk_procs row:
       • procCptId   = best-scoring proc_cpt        (→ its alphaCode for display)
       • mainDiagId  = the main diagnosis that match belongs to (see §5.3)
       • matchScore  = cosine similarity of the best hit
  4. Link cal_surg.clerkProcId → the new row
```

**Why store mainDiagId + best procCptId**: the clerk's phrase is often too general to be a real CPT ("ورم بالمخ" = a whole category). The semantic search tells us which **main diagnosis** the phrase probably belongs to and gives an **ALPHA code** — both usable for calendar display and analytics without pretending the clerk picked an exact procedure.

---

## 3. Schema changes (`ka-institute`, one migration)

### 3.1 New table `clerk_procs`

| Column | Type | Constraints | Notes |
|---|---|---|---|
| `id` | uuid | PK, default uuid_generate_v4() | |
| `title` | text | NOT NULL | clerk's input, normalized (trimmed, single-spaced), original casing/script kept |
| `departmentId` | uuid | NOT NULL, FK → `departments` | semantic context of the search |
| `clerkId` | uuid | NULL, FK → `clerks` | NULL = legacy import / created by a non-clerk role (see §8 Q1) |
| `procCptId` | uuid | NULL, FK → `proc_cpts` | best semantic match; NULL until resolved (or resolution failed) |
| `mainDiagId` | uuid | NULL, FK → `main_diags` | probable category derived from the match |
| `matchScore` | real | NULL | cosine similarity of the best hit (audit/threshold tuning) |
| `createdAt` / `updatedAt` | timestamp | NOT NULL default now() | |
| — | — | **UNIQUE (`departmentId`, `title`)** | the dedupe/learning key |

### 3.2 `cal_surgs` additions

| Column | Type | Notes |
|---|---|---|
| `clerkProcId` | uuid NULL, FK → `clerk_procs` | what the clerk actually entered |
| `patientNameAr` | text NULL | Arabic slot (see §6) |
| `patientNameEn` | text NULL | English slot |

- **`procCptId` STAYS on `cal_surgs`** (denormalized, stamped from the clerk_procs row at creation). Rationale: every consumer rewired yesterday (dashboard, submissions, PDF, emails, analytics) reads `calSurg.procCpt` — keeping the stamped copy means zero churn there, and rows keep a stable procedure even if the clerk_procs row is later re-resolved.
- **`patientName` STAYS** as the as-typed original (display default + audit); the two new slots are the bilingual pair.

---

## 4. New backend module `src/clerkProc/`

- `clerkProc.mDbSchema.ts` — entity per §3.1.
- `clerkProc.service.ts` — `resolveOrCreate(title, departmentId, clerkId, ds)`: implements §2 (normalize → lookup → hub search → insert). Returns the row (existing or new).
- `refApi.client.ts` — new method `procedureSearch(deptCode, query, limit)` calling the hub's existing **`POST /v1/procedure-search`** (X-API-Key; endpoint shipped + verified 2026-07-11).
- `calSurg` create path: controller accepts `procedureText` (free text) instead of / alongside a `procedure` id; provider calls `resolveOrCreate`, stamps `clerkProcId` + `procCptId` (+ patient-name pipeline §6).
- **Failure containment**: if the hub search is down/times out, the clerk_procs row is still created with NULL procCptId/mainDiagId and the surgery saves — a background retry (or the next identical input) can re-resolve. Clerk workflow must never block on the hub.

## 5. Semantic-search details

1. **Hub endpoint**: `POST /v1/procedure-search` `{ deptCode, query, limit }` — the hub embeds the query (gemini-embedding-001, 768d) and runs pgvector cosine over `proc_cpts.embedding`, dept-scoped via `main_diag_procs → main_diags.departmentId`. No local embeddings needed on the spoke.
2. **Token economics**: exactly ONE hub call (one embedding) per *new distinct phrase per department* — repeats are free by design.
3. **mainDiag derivation**: verify whether the hub response already names the main_diag the hit matched through. If it does → save it. If not → derive locally from mirror `main_diag_procs` ∩ `main_diags.departmentId = dept`; if the proc belongs to **multiple** main_diags in the department, pick the highest-ranked hub hit whose category is unambiguous, else the first category by title (deterministic) — see §8 Q3. (Optionally: a one-line hub enhancement to return `mainDiagId` per hit — we own the hub.)
4. **Threshold**: store `matchScore` always; optionally treat score < ~0.5 as "unresolved" (procCptId saved but flagged) — tune after seeing the legacy-import score distribution.

## 6. Bilingual patient name pipeline

1. **Detection is free**: Arabic script test (`/[؀-ۿ]/`) — no AI needed to know which language was typed.
2. **Transliteration via the existing aiAgent (Gemini)**: the *other* slot is produced by an external AI call — Arabic input → English transliteration into `patientNameEn`; Latin input → Arabic into `patientNameAr`. As-typed original also lands in its own-language slot (and stays in `patientName`).
3. **Batching for the ETL**: dedupe distinct names first, translate in batches (~50 names per prompt) — 5,578 rows ≈ a few thousand distinct names ≈ well under 100 Gemini calls.
4. ⚠️ **PII note (explicit)**: patient names get sent to the Google Gemini API. The app already sends submission clinical context to Gemini (aiAgent), so this extends an existing exposure — but it is patient PII leaving the DB; confirm you accept this (§8 Q5). Failure containment: if translation fails, save with the typed slot filled and the other NULL; backfillable.

---

## 7. The staging reset + re-ETL (the big one)

**Why**: re-map the historical data through the new pipeline, treating production `arab_procs` titles as "what the clerk typed".

### 7.1 What gets dropped (ka-institute ONLY — staging)

In FK-safe order: `submission_question_answers` (5,948) → `submissions` (3,599) → `cal_surgs` (5,578). Nothing else (events/clinicalSubs/journals/confs/users untouched).

### 7.2 Rebuild sequence (all sources read-only from production MySQL)

1. **clerk_procs seed** — read prod `arab_procs` (81 rows, READ-ONLY): each `title` becomes a clerk_procs row (`departmentId = NS`, `clerkId` per §8 Q1) and is run through the §2 algorithm → 81 hub searches, one per title.
   - **Validation gift**: we hold a clinically-approved arab_proc→proc_cpt mapping (`docs/CALSURG_PROC_MAPPING_REVIEW.md`, approved 2026-07-14). The ETL produces a **divergence report**: algorithm's best match vs your approved match, per title, with scores. This both re-maps the data AND measures the algorithm's clinical accuracy before any clerk relies on it. Which one wins when they disagree → §8 Q2.
2. **cal_surgs re-ETL** — read prod `cal_surgs` (READ-ONLY), preserve prod UUIDs (so submissions re-link identically):
   - `clerkProcId` ← the clerk_procs row seeded from that surgery's legacy `arabProcId` (title-matched);
   - **prod `arabProcId` IS NULL → `clerkProcId = NULL` and `procCptId = NULL`, full stop** (guardrail #5). No semantic search runs, no clerk_procs row is linked or created for these — expected ~970 rows;
   - `procCptId` ← stamped from that clerk_procs row (only when one exists);
   - `patientNameAr`/`patientNameEn` ← §6 pipeline (batched);
   - departmentId = NS, hospital/dates/gender as before.
3. **submissions + submission_question_answers re-ETL** — re-run the existing proven ETL scripts (prod ids preserved; mainDiag legacy→hub remap as before). **Guardrail #4 applies in full**: production's six-flag values (`spOrCran`/`pos`/`approach`/`region`/`clinPres`/`intEvents`) are converted at import time into keyed `submission_question_answers` rows against the CURRENT hub-mirrored questions framework — the same conversion the `1f423fa` cutover ETL performed. The target schema has no six-flag columns and none are added back; any prod value that cannot be mapped to a current question/option is logged in the ETL report rather than silently shoehorned.

### 7.3 Verification (all counts vs production, plus pipeline-specific)

- Counts: cal_surgs = 5,578 · submissions = 3,599 · answers = 5,948 · clerk_procs = 81 · FK orphans = 0.
- Every cal_surg that had a legacy procedure has `clerkProcId` AND `procCptId` (expect 4,608); every cal_surg whose prod row had NO procedure has BOTH NULL (count must equal the prod `arabProcId IS NULL` count — guardrail #5 proof).
- **Six-flag extinction proof (guardrail #4)**: schema contains no six-flag columns and no legacy `additional_questions` table (information_schema check); all imported answers exist solely as `submission_question_answers` keyed to current `ref_questions`; unmappable prod values enumerated in the ETL report, not silently dropped or shoehorned.
- Divergence report reviewed (§7.2.1); score distribution sanity (how many < 0.5).
- Bilingual names: 0 rows with both slots NULL; spot-check 10 transliterations both directions.
- E2E on staging: clerk creates a surgery with a NEW Arabic phrase → clerk_procs row + hub search fires once; create a second surgery with the SAME phrase → no hub call (log-verified); calendar renders per §7.4.
- Regression: submissions views, PDF report, dashboards unchanged (they read the stamped `procCpt`).

### 7.4 Calendar display (frontend, design-integration)

Card procedure line becomes: **clerk's own words first**, medical context as garnish —
- AR mode: `clerkProc.title` (what was typed) + ALPHA badge (`procCpt.alphaCode`)
- EN mode: `procCpt.title` (EN) + ALPHA badge; falls back to clerkProc.title when unresolved
- Create form: free-text procedure input with typeahead over the department's existing `clerk_procs` (prevents near-duplicate spellings, shows the clerk their own vocabulary back). Edit modal same.

---

## 8. Open questions (answer before implementation)

1. **`clerkId` for the 81 legacy imports** — NULL (= "legacy import") or stamped to the one existing clerk (Masr El Dawly)? *Recommend NULL; the column means "who taught the system this phrase".*
2. **Divergence policy** — when the semantic search disagrees with your approved clinical mapping for a legacy title: (a) approved mapping wins, algorithm result only logged (*recommended — it's clinically reviewed*), or (b) algorithm wins everywhere (purest test of the new pipeline), with the divergence report as your review artifact?
3. **mainDiag ambiguity** — accept the deterministic rule in §5.3, or prefer a small hub enhancement so `/v1/procedure-search` returns the matched mainDiag explicitly? *Recommend the hub enhancement — honest data over local guessing.*
4. **Non-clerk creators** — instituteAdmin/superAdmin can also create surgeries. Same pipeline with `clerkId = NULL`, or store any creator id (rename column `createdById` FK-less)? *Recommend: same pipeline, clerkId NULL for non-clerks.*
5. **PII sign-off** — confirm patient names may be sent to Gemini for transliteration (§6.4).
6. **Threshold** — flag matches below a similarity cutoff for later human review, or trust everything initially? *Recommend: store scores now, decide the cutoff after seeing the legacy-import distribution.*

## 9. Implementation stages (after your review)

Each stage ends by updating the `🔄 Progress Checkpoint` (state, record, session log, next action) — per guardrail #6, a stage without its checkpoint entry is NOT done.

| Stage | Deliverable |
|---|---|
| **0** | **Full verified production snapshot (§Stage 0) — blocking gate for everything below** |
| A | Migration: `clerk_procs` + `cal_surgs.clerkProcId/patientNameAr/patientNameEn` |
| B | `src/clerkProc/` module + hub `procedureSearch` client (+ optional hub mainDiag enhancement) |
| C | Bilingual patient-name service in aiAgent (detect + transliterate + batch mode) |
| D | Staging wipe (§7.1) + re-ETL scripts (§7.2) + divergence report + verification (§7.3) |
| E | calSurg create/update paths + frontend form/typeahead + calendar display (§7.4) |
| F | E2E verification + docs/CLAUDE.md updates |

## 10. Risks & mitigations

- **Production safety** — every prod read through a read-only session; no prod credentials in any write path; scripts refuse to run if pointed at a MySQL target for writing.
- **Hub availability** — clerk flow never blocks on the hub (§4); unresolved rows are retryable.
- **Semantic misses on vague phrases** — expected and acceptable: mainDiag + ALPHA is the goal, not exact CPT truth; scores stored for auditing; divergence report calibrates trust.
- **Gemini transliteration quirks on names** — original as-typed is never lost (`patientName` + own-language slot); bad transliterations are overwritable.
- **Staging drop is destructive** — but sources are production (untouched) + deterministic scripts; the whole rebuild is repeatable end-to-end.
