# Clerk-Proc Bilingual Titles + Name-Initials Translation Fix + Pre-Deployment Delta Sync (Plan)

**Status**: ✅ IMPLEMENTED (all stages A→G, 2026-07-16, uncommitted) — see the checkpoint table for per-stage records
**Date**: 2026-07-16 (v2 — revised from the user's edited requirement; v2.1 — NS-scope + clerk-attribution directive, §4.4; v2.2 — first 7 answers folded in, incl. Q5 bilingual-everywhere; v2.3 — Q3 no-deletions guarantee + Q6 instant save, §3.6)
**Repos**: MedScribeNeuroServer (branch **`migration/mysql-to-postgres`**) + NeuroLogBookFront (branch **`design-integration`**) + LibelusRefApi (read-only consumer, no changes expected)
**Databases**: KA-PSQL `ka-institute` (staging — the ONLY write target) · production MySQL `SQL_DB_DEF_NAME_KA` (**READ-ONLY, never touched**)
**Parent plan**: `docs/CLERK_PROCS_LEARNING_PIPELINE_PLAN.md` (all stages ✅ implemented 2026-07-15 — this plan extends it)

---

## 🔴 NON-NEGOTIABLE RULES (user-stated, verbatim intent — DON'T SKIP)

1. **`SQL_DB_DEF_NAME_KA` (production MySQL) is NEVER edited, dropped, patched, or touched.** Every production access in this plan is a read-only SELECT through the guarded `query.js`-style connection (`SET SESSION transaction_read_only = 1`).
2. All drops/writes happen on **`ka-institute` (staging PG)** only.
3. **ONLY work on the side-branch repos and NEVER commit or push to `main`.** Backend: `migration/mysql-to-postgres`. Frontend: `design-integration`. Nothing is committed even to the side branches without the user's explicit ask.

### Additional guardrails (carried from the parent plan)

4. The hub (LibelusRefApi) is consumed via its public API only — no hub DB writes. `.env` is never edited.
5. **Token economics is a design constraint, not an afterthought**: a phrase that already exists in `clerk_procs` is NEVER re-translated and NEVER re-searched — it is only re-linked (`cal_surgs.clerkProcId`) to the new cal_surg row. AI spend happens exactly once per NEW `(departmentId, normalized title)`.
6. **No procedure → no clerk_proc** (parent guardrail): a production `cal_surg` with `arabProcId = NULL` imports with `clerkProcId = NULL` and `procCptId = NULL`. The pipeline never invents a procedure.
7. **The delta sync REPLACES nothing**: no wipe, no rebuild. Existing ka-institute rows are updated in place only when production shows they changed; everything else is insert-only.
8. **A fresh verified production snapshot must exist before the first APPLYING delta run** (same Stage-0 procedure as the parent plan: dump → gzip check → count parity → restore test → record here). Dry-runs may run without it.
9. **This document is the living memory of the work.** Every step — done, partial, skipped, failed — is recorded in the `🔄 Progress Checkpoint` in the same session it happens. Nothing counts as done until written here.

---

## 🔄 Progress Checkpoint (living record — update every session)

**Last updated**: 2026-07-16 · **Status**: ✅ **ALL STAGES IMPLEMENTED + VERIFIED (2026-07-16, uncommitted)**

| Stage | State | Record (what was done, verified how) |
|---|---|---|
| Open questions (§6) | ✅ ALL 9 answered (user, 2026-07-16) | Q1 literal · Q2 CPT fallback · Q3 **no deletions ever** (user guarantee; sync has no delete mode) · Q4 events out of scope · Q5 **bilingual standard at ALL levels incl. PDFs/emails** · Q6 **instant save + background enrichment** (§3.6) · Q7 delegated · Q8 yes · Q9 yes. |
| A — migration + backfills | ✅ DONE 2026-07-16 | `1783782610140-BilingualTitlesClerkAttribution` applied on ka-institute: `clerk_procs.titleAr/titleEn`; `cal_surgs.clerkId` FK→clerks (guarded: fails loud if the clerk row is missing); backfilled 5,578/5,578 cal_surgs + re-attributed 81/81 clerk_procs to `45eb7fb8-…` (pre-verified all were NULL → down() is exact); `prod_sync_state` created. Entities updated (CalSurgEntity.clerkId+relation, ClerkProcEntity.titleAr/En). Verified by count queries. |
| B — pipeline + instant save | ✅ DONE 2026-07-16 | New `src/clerkProc/procPhrase.service.ts` (literal-but-clinical batch translation, strict JSON). `ClerkProcService` split per §3.6: `resolveOrCreate` = LOCAL-only find-or-insert (typed title slot verbatim, zero AI/hub) · `enrich()` = background hub resolve + missing-slot translation (heals legacy rows too, never throws). `CalSurgProvider.createCalSurgFromClerkInput` → instant save: sync = privacy-format + typed name slot + clerk_procs link + `clerkId` stamp; `setImmediate` fire-and-forget = hub resolution (procCpt stamped onto the row if NULL) + name transliteration (COALESCE, never clobbers). PATCH name edits same split (typed slot sync + NULL the other → background refill). Projections: dashboard `clerkProc {title,titleAr,titleEn}` + `/calSurg/clerkProcs` SELECT + both fields. DI bound. tsc clean. |
| B2 — initials-aware names + server format | ✅ DONE 2026-07-16 | `PatientNameService` rewritten: tokenize → Gemini ONLY for word tokens → single-letter initials via the fixed digraph tables (recorded below, Q7) → reassemble; `typedSlot()` for the sync path. `UtilService.formatPatientNameForStore` (server port of the frontend formatter, idempotent) applied in `processCalSurgData` (all create paths) + PATCH. |
| C — 81-title backfill | ✅ DONE 2026-07-16 | `scripts/backfill-clerk-proc-titles.cjs`: 81/81 rows now have both slots (2 Gemini chunks); register verified literal ("إزالة كيس علي المخ" → "Removal of cyst on brain"). Idempotent (reruns find 0). |
| C2 — initials remediation | ✅ DONE 2026-07-16 | `scripts/fix-patient-name-initials.cjs` (dry-run→apply): **1,279/5,578 rows (23%) had fused initials** ("Asmaa Ma'm"→"Asmaa M A M", "Mohamed Akh"→"Mohamed A Kh"); repaired reusing the existing word transliterations + local digraph initials (only 76 word tokens needed AI). Post-apply dry-run finds 0 → idempotent. |
| D — frontend display | ✅ DONE 2026-07-16 | `Calendar.procTitle()`: AR = `clerkProc.titleAr‖title‖procCpt.arTitle‖title`, EN = `clerkProc.titleEn‖procCpt.title‖clerkProc.title` (+ ALPHA suffix kept); manager surgeries column EN-first; create-form datalist options carry the other-language form as `label`; types + normalize carry titleAr/titleEn. Build clean. |
| D2 — PDFs/emails/timeline (Q5) | ✅ DONE 2026-07-16 | `sub.provider` email(HTML) + PDF/text templates: "Patient Name (English)/(Arabic)" + "Procedure Title (English)/(Arabic)" lines (clerk phrase first, CPT fallback), mirroring the existing Hospital EN/AR pattern; sub queries now load `calSurg.clerkProc` (12 relation lists). `/activityTimeline` metadata + frontend types carry `patientNameAr/En`; `CandidateDashboardContent` picks by UI language; `dashboardSlice` prepend path carries both. Both builds clean. |
| E — delta dry-run | ✅ DONE 2026-07-16 | `scripts/delta-sync-prod-to-ka.cjs` (dry-run default; NO delete mode per Q3 — ka-only ids report as anomalies only). Reconcile by id + per-row `updatedAt` (ka mirrors prod's verbatim). Found: **125 NEW cal_surgs + 17 NEW subs** accumulated since the 07-15 rebuild; 0 changed, 0 anomalies, 0 missing parents; all 29 delta phrases already known (zero-token reuse ✅). |
| F — delta apply | ✅ DONE 2026-07-16 | **Fresh snapshot FIRST (rule #8)**: `F:\DB_BACKUPS\kasr-el-ainy-20260716.sql.gz` (1,484,158 B, SHA-256 `B139857F…DF34`), gzip-verified, **restore-tested** in a scratch container: 31 tables, cal_surgs 5,703 / submissions 3,616 / arab_procs 81 / candidates 110 / supervisors 56 = live parity; scratch destroyed. Then `--apply`: 125 cal_surgs upserted (125/125 with clerkProc — reused approved-mapping rows; initials-aware names; NS + default clerkId) + proven subs ETL rerun (3,616 total, 5,989 keyed answers, 0 FK orphans; 7 new choice values kept raw/optionId NULL). Invariants: distinct dept=1(NS) · clerkId NULL=0 · name-slotless=0 · hosp orphans=0. Watermarks written to `prod_sync_state`. **Second dry-run = 0/0/0 → idempotent.** Delta-row samples: "طارق ع ا م"→"Tarek A A M", "ورم بالمخ"→"Brain tumor". |
| G — E2E verification | ✅ DONE 2026-07-16 | Live E2E (dev server 3001, nodemon = current code; clerk JWT): create HTTP 201 in **1,474 ms** (was ~16–20 s), typed AR slot + clerkProc link + clerkId stamped at response time; **background fill in ~9 s**: `patientNameEn = "Ahmed M Kh"` from `أحمد م خ` (the user's exact example, initials preserved), procCpt stamped, new phrase translated ("Test arterial connection for the delta", hub score 0.665). **Learn-once**: same phrase again → still 1 row. **Dept-scoping leak test (§2.0)**: "phacoemulsification cataract extraction…" with deptCode NS → NS-linked hit only (ommaya reservoir CRAN), OPHTHAL gets the real Phaco CATR → no cross-dept leak. Test rows deleted, baseline 5,578/81 restored (pre-delta). Both builds clean. |

### Q7 record — the initials digraph tables (delegated, now fixed in code)
AR→EN: `ا/أ/آ/ء→A إ→E ب→B ت→T ث→Th ج→G ح→H خ→Kh د→D ذ→Dh ر→R ز→Z س→S ش→Sh ص→S ض→D ط→T ظ→Z ع→A غ→Gh ف→F ق→K ك→K ل→L م→M ن→N ه/ة→H و→W ي→Y ى→A ؤ→W ئ→Y` · EN→AR: `A→أ B→ب C→ك D→د E→إ F→ف G→ج H→ه I→إ J→ج K→ك L→ل M→م N→ن O→أ P→ب Q→ق R→ر S→س T→ت U→أ V→ف W→و X→س Y→ي Z→ز`. Single source of truth: `src/calSurg/patientName.service.ts` (⚠️ the .cjs scripts carry synced copies — keep aligned).

### ✅ Follow-up implemented 2026-07-16 — department-driven narrowing (future multi-dept)
The procedure-search narrowing now follows the clerk's **assigned department**, not always the NS default. Resolution order everywhere (create + typeahead): **explicit body/`?deptCode` → clerk's JWT `departmentId` claim → `REF_DEPT_CODE` (NS)**.
- **Backend**: `calSurg.controller.handlePostCalSurg` resolves `body.departmentId ?? jwt.departmentId` (provider still `?? NS`); `handleGetClerkProcs` + `getClerkProcs(ds, jwtDepartmentId?, deptCode?)` mirror the same order so the typeahead matches. Clerk login already embeds the `departmentId` JWT claim (`auth.controller.ts:493`) when the clerk has one — verified.
- **Frontend (design-integration)**: `User.departmentId` added + threaded through clerk login (`CalendarManagerLoginPage`) and auth-restore (`App.tsx`, straight from the token payload — survives refresh). New `Department` type + `api.getDepartments()` + `useDepartmentsQuery`. `PostCalSurgBody.departmentId?` added. **Surgery-create form shows a required Department picker ONLY when the logged-in user has no assigned department** (`needsDeptPicker = !user.departmentId`); scoped clerks send nothing and narrow via the JWT claim.
- **No disruption today**: the sole KA clerk (Mohamed Ismail) is assigned NS (`65bda505…`), so the JWT claim resolves to NS = the old default; picker never shows.
- **Verified live** (dev server, clerk JWT): A) JWT dept=ORTHO, no body → row **ORTHO**; B) no JWT dept, body=UROL → row **UROL**; C) no JWT dept, no body → **NS** default. Both builds clean; baseline restored (5,703 cal_surgs / 81 clerk_procs).
- ⚠️ **Gotcha for test cleanup** (not a product bug): background enrichment (`setImmediate`) can `save()` a clerk_procs row *after* a concurrent test DELETE, resurrecting it. Delete test-learned phrases a moment after creates settle, or after the server is idle. Irrelevant in production (phrases aren't deleted mid-create).

### ▶ Next action
User reviews the implementation. Open follow-ups: commit (only on explicit ask); rerun `delta-sync-prod-to-ka.cjs` any time (idempotent) + one final run right before cutover; the 7 unresolved choice values from the new subs (optionId NULL, values preserved) if worth mapping; (minor) the un-scoped-clerk typeahead still lists NS phrases until the department picker drives a `?deptCode` refetch — low priority, suggestions only.

### Session log
- **2026-07-16** — plan v1 drafted from the user's written requirement. Facts verified read-only same day: prod `cal_surgs` and `submissions` both carry `createdAt` + `updatedAt (ON UPDATE CURRENT_TIMESTAMP)` → reliable delta watermarks exist.
- **2026-07-16 (later)** — **v2** from the user's edited requirement: (1) explicit DON'T-SKIP rule that matching narrows **by department first, then semantic search** — verified already true in the hub (see §2.0, code citation) and added as a permanent E2E leak test; (2) NEW requirement: the patient-name **initials privacy format** (`أحمد محمد خلف` stored as `أحمد م خ`) must translate to `Ahmed M Kh` — the current whole-string transliteration sometimes merges initials (`Ahmed Mkh`); fix + remediation designed (§3); (3) non-negotiable rules restated verbatim incl. branch discipline. No code, no schema, no data touched.
- **2026-07-16 (later still)** — **v2.1**: user directive added — ALL source (`SQL_DB_DEF_NAME_KA`) cal_surgs are NS-scoped and assigned to the single clerk `45eb7fb8-b9af-4bdd-90c8-8519cb4ce472` unless uploaded by someone else. Verified read-only: that clerk is the ONLY ka `clerks` row (Mohamed Ismail); all 5,578 ka cal_surgs already NS; NO uploader field exists anywhere in the source (prod schema + sheet shape) — escape clause recorded as an evidence check in the import report. Design = new `cal_surgs.clerkId` FK + full backfill + delta default + JWT stamping on create (§4.4); new Q9 (re-attribute the 81 legacy clerk_procs?). Plan-only, nothing implemented.
- **2026-07-16 (evening)** — **v2.2**: user answered 7/9 open questions — Q1 literal translation · Q2 CPT fallback OK · Q4 events/attendance out of scope ("completely separate issue"; §4.3 dependency closure corrected — nothing imported references events) · **Q5 OVERRIDE: bilingual standard holds at ALL levels incl. PDFs/emails** → new §3.5 + Stage D2 (PDF/email get "Patient Name (English)/(Arabic)" lines mirroring the existing Hospital EN/AR pattern; timeline language-aware) · Q7 digraph table delegated · Q8 yes (server-side format enforcement → Stage B2) · Q9 yes (81 legacy clerk_procs re-attributed → Stage A). Q3 (deletion mirroring) + Q6 (async/instant save) re-explained in §6 in plain terms, awaiting answers. Plan-only, nothing implemented.
- **2026-07-16 (implementation session)** — **ALL STAGES A→G IMPLEMENTED + VERIFIED** on user "implement" (see checkpoint table for full records). Highlights: instant save 1.5 s (was 16–20 s) with ~9 s background fill; 1,279 fused-initials rows remediated ("Ahmed Mkh"-class → "Ahmed M Kh"); 81 phrases translated (literal register); delta sync built + applied after a fresh restore-tested snapshot (125 new cal_surgs + 17 new subs from prod, all invariants green, idempotent); dept-scoping leak test permanent in the E2E script (scratchpad). Prod only ever read (read-only sessions); all writes ka-institute; branches only. **Nothing committed — awaiting explicit ask.**
- **2026-07-16 (night)** — **v2.3 — plan COMPLETE**: user answered the last two — **Q3: deletions are out of scope, "nothing will be deleted from the source and I guarantee that"** → the sync has NO delete mode; the id cross-check only reports an anomaly if the guarantee is ever contradicted. **Q6: instant save approved** → §3.6 (synchronous: insert + clerk_procs link; fire-and-forget: hub resolution + all Gemini translations; PATCH same; Stage-G latency check < ~2 s). All 9 questions decided; awaiting implementation go-ahead. Plan-only, nothing implemented.

---

## 1. The requirement (engineered restatement of the user's ask)

### Part 1 — presentational fidelity for procedure titles (bilingual clerk phrases)

Today the calendar's procedure line is asymmetric:

| UI language | Shown today | Source |
|---|---|---|
| Arabic | the clerk's own words | `clerk_procs.title` |
| English | the semantic **match** | `proc_cpts.title` |

The matching pipeline itself is correct and explicitly kept: **the algorithm narrows the candidate procedures to the department FIRST, and only then semantically matches the clerk's entered text** (user: DON'T SKIP — verified in §2.0). That match yields the main-diagnosis link and ALPHA code, which stay valuable for later purposes and features.

But as a *display*, English mode shows what the system matched, not what was entered. **Requirement**: for calendar/bilingual presentational purposes, show the exact translation of the clerk's entered procedure title — if entered in Arabic, an aiAgent-translated English form; **and vice versa if entered in English** (Arabic form generated). Both forms are stored on **`clerk_procs`** (`ar` + `en`).

**Token economics (user-stated)**: if the input already exists in `clerk_procs`, do NOT re-translate — the existing row is simply remapped to the new cal_surg row (`cal_surgs.clerkProcId`), spending zero tokens on a job already done. Historical data needs NO cal_surgs remap: all history already points at 81 `clerk_procs` rows, so one backfill of those rows covers every past surgery.

### Part 2 — patient-name initials: privacy format must survive translation

Privacy rule already in force: the clerk enters a full patient name, and it is **stored as complete-first-name + single-letter initials of the remaining names** (frontend `formatPatientNameForStore`: `أحمد محمد خلف` → `أحمد م خ`).

**Observed defect (user)**: the transliteration algorithm is sometimes confused by this format and merges the initials — `أحمد م خ` → **"Ahmed Mkh"** instead of the correct **"Ahmed M Kh"**. Requirement: the translated form must preserve the same structure — complete first name + space-separated initials, each initial rendered as its standard Latin (di)graph (`خ` → `Kh`), and the reverse for English-entered names.

### Part 3 — pre-deployment completion sync (incremental, not destructive)

Production (`SQL_DB_DEF_NAME_KA`, MySQL) keeps accumulating cal_surgs and submissions while the spoke is developed. Before deployment, ka-institute must be **updated, not rebuilt**: check what was last added/updated on `SQL_DB_DEF_NAME_KA`, compare it to ka-psql, and update the ka `cal_surgs` and `subs` (and their keyed answers) accordingly. Production is read-only throughout; the sync is rerunnable any number of times up to cutover day.

**Scoping + attribution directive (user, 2026-07-16)**: ALL cal_surgs on the source database `SQL_DB_DEF_NAME_KA` are **NS-scoped**, and every one of them is **assigned to the single existing clerk `45eb7fb8-b9af-4bdd-90c8-8519cb4ce472`** (Mohamed Ismail — verified the only row in ka `clerks`) — **unless a row is found to have been uploaded by someone else**. Design in §4.4.

---

## 2. Part 1 design — bilingual clerk-proc titles

### 2.0 Department-first narrowing — VERIFIED existing behavior (the DON'T-SKIP rule)

No new code needed — this is how it already works, end to end:

- Spoke: `ClerkProcService.resolveOrCreate()` passes the surgery's department to the hub (`refApiClient.procedureSearch(title, deptCode, 1)` — `src/clerkProc/clerkProc.service.ts`).
- Hub: the search SQL **restricts the candidate set to the department BEFORE ranking** — `JOIN main_diags md ON md."id" = mdp."mainDiagId" AND md."departmentId" = $2`, and only then `ORDER BY p."embedding" <=> $query` (`LibelusRefApi src/procedureSearch/procedureSearch.service.ts:79-87`). A procedure not linked to the department cannot appear, regardless of similarity.

**Made permanent in this plan**: Stage G adds an explicit cross-department leak test (a phrase that is a strong match only in dept Y must return no dept-X result), so a future refactor cannot silently drop the narrowing. Any future change to this ordering must be ASKED first.

### 2.1 Schema (one migration on `ka-institute`)

```
ALTER TABLE clerk_procs ADD COLUMN "titleAr" text NULL;
ALTER TABLE clerk_procs ADD COLUMN "titleEn" text NULL;
```

- `title` stays untouched — it is the raw learning key; `UNIQUE(departmentId, title)` unchanged.
- **Both-forms rule**: the typed-language slot gets the raw phrase **verbatim** (free — Arabic-script regex, same as `PatientNameService.isArabic`); the *other* slot is a Gemini **translation** (meaning-for-meaning — unlike patient names, which are transliterated sound-for-sound). Works in both directions (AR-entered and EN-entered).
- NULL = translation not yet done / failed — retryable, never blocks the clerk flow (same failure model as `procCptId`).

### 2.2 Translation service + pipeline wiring

- New small service mirroring `PatientNameService` (e.g. `ProcPhraseService` in `src/clerkProc/`): `bilingualTitle(raw)` for the create path + `translateBatch(phrases[], to)` for the backfill (~50 phrases per `generateText` call, strict-JSON prompt: *"Translate these surgical-procedure phrases … translate meaning, keep it clinical and short, return ONLY a JSON array …"*).
- `ClerkProcService.resolveOrCreate()` gains one step:
  - **new phrase** → fill `titleAr`/`titleEn` (1 extra Gemini call, in the same request that already does the dept-scoped hub search);
  - **existing phrase** → zero calls; the row is only re-linked to the cal_surg (the user's "remap"). Opportunistic retry ONLY if a slot is NULL (mirrors the existing `procCptId` retry).
- Failure containment identical to the parent plan: typed slot always filled, other slot NULL on AI failure.

### 2.3 Token-economics ledger (why this stays cheap)

| Event | AI cost |
|---|---|
| Clerk repeats a known phrase | **0** (row reuse + relink — no re-spend on a done job) |
| Clerk types a new phrase | 1 dept-scoped hub search (existing) + **1 translation call** (new) |
| Historical 81 clerk_procs | one backfill script ≈ **2 batched calls**, run once |
| Historical 5,578 cal_surgs | **0** — solved at the clerk_procs level, no remap |

### 2.4 Backfill script (historical 81 rows)

`scripts/backfill-clerk-proc-titles.cjs` (gitignored, PG-only writes): select rows with a NULL slot → batch-translate → update. Idempotent (only NULL slots touched), rerunnable, prints a per-row report. Also reusable after any delta sync (Stage F) for phrases whose translation failed.

### 2.5 API + frontend display

- **Backend projections** (additive): dashboard `clerkProc {_id, title}` → `{_id, title, titleAr, titleEn}`; same for `GET /calSurg/clerkProcs` (typeahead).
- **Calendar `procTitle()`** (the only display-logic change):
  - **AR mode**: `clerkProc.titleAr || clerkProc.title || procCpt.arTitle || procCpt.title`
  - **EN mode**: `clerkProc.titleEn || procCpt.title || clerkProc.title`
  - ALPHA-code suffix (`· CRAN`) unchanged — the semantic match stays visible as medical context.
  - Deliberate EN fallback: when `titleEn` is NULL (failed translation, not yet retried) English mode falls back to the CPT title (readable English) rather than the raw Arabic phrase. See §6 Q2.
- **CalendarManagerSurgeriesPage** procedure column + create-form typeahead datalist: show the phrase with its translated form where available (EN-labeled UI → `titleEn || title`).
- Submissions/PDF are untouched — subs render `procCpt`/diagnosis data, not clerk phrases.

---

## 3. Part 2 design — initials-aware patient-name translation

### 3.1 Root cause

`PatientNameService.transliterateBatch` sends the stored string (`أحمد م خ`) to Gemini as one opaque name. The model has no way to know the single letters are privacy initials, so it sometimes fuses them (`Ahmed Mkh`). Prompt tweaks alone can't guarantee structure — so the structure is enforced in code, not in the prompt.

### 3.2 Fix — tokenize; AI only for real words; initials mapped deterministically

Upgrade `PatientNameService` (single fix point — the create path, the PATCH re-translation path, backfills, and the delta sync all flow through it):

1. **Tokenize** the stored name on whitespace. A token of exactly one letter = an initial (that is precisely what `formatPatientNameForStore` produces; multi-letter tokens are real names).
2. **Word tokens** (normally just the complete first name) → Gemini batch transliteration, exactly as today but fed ONLY the word tokens. Fewer characters, less confusion, slightly cheaper.
3. **Initial tokens** → a fixed deterministic letter map, zero AI:
   - AR→EN digraph table (Egyptian romanization, `ج`=G per project convention): `م→M, خ→Kh, ش→Sh, ث→Th, ذ→Dh, غ→Gh, ظ→Z, ص→S, ض→D, ط→T, ح→H, ه→H, ع→A, ق→K, ج→G, ب→B, ت→T, س→S, ر→R, ز→Z, د→D, ف→F, ك→K, ل→L, ن→N, و→W, ي→Y, ا/أ/إ/آ/ء→A, ى→A, ة→H` (full table reviewed at implementation — §6 Q7).
   - EN→AR reverse map for English-entered names (`M→م, K→ك, …`); stored EN initials are single Latin letters (`charAt(0)`), so the reverse map is single-letter → single-letter.
4. **Reassemble** preserving token order and spaces: `أحمد م خ` → `Ahmed M Kh`; `Khaled M` → `خالد م`.

Guarantees: the translated form always has the same token count and structure as the stored form; initials can never fuse; the privacy format survives translation **by construction**.

### 3.3 Remediation of existing data (5,578 rows, ~zero AI cost)

One gitignored script `scripts/fix-patient-name-initials.cjs`:

1. **Detect** malformed rows: token count of `patientNameEn` ≠ token count of `patientName` (or an initial token position isn't a 1–2-letter Latin token). Same check for `patientNameAr` on EN-entered names.
2. **Repair locally where possible (recommended, 0 tokens)**: the existing translit's FIRST word is already a good transliteration of the first name — keep it, recompute the initials deterministically from the stored Arabic initials, reassemble. Gemini is called ONLY for rows whose first-word transliteration is itself missing/garbage (expected: few).
3. Idempotent, dry-run first (prints before/after samples + counts), rerunnable; report recorded here.

### 3.4 Server-side enforcement of the privacy format (Q8 — decided YES)

`formatPatientNameForStore` (frontend) stays as-is, but its logic is **ported to the backend** (`UtilService`) and applied on `POST /calSurg` and PATCH before `PatientNameService` runs — so API-direct writes are normalized to the same complete-first-name + initials format, closing the privacy gap. Folded into Stage B2.

### 3.5 Bilingual standard at ALL levels — PDFs, emails, activity timeline (Q5 — user directive)

The user's ruling: *"whether it's PDFs or emails, we need to hold the bilingual standard of the app, on all levels — that's why we are going through this translational effort."* Applied as:

- **PDF + email templates** (`sub.provider.ts` submission documents): these are static bilingual documents with no language toggle — they already render Hospital in BOTH languages as two labeled lines ("Hospital (English)" / "Hospital (Arabic)"). The patient name follows the exact same established pattern: **"Patient Name (English)" = `patientNameEn`** and **"Patient Name (Arabic)" = `patientNameAr`** (each falling back to the raw stored name when its slot is NULL). The raw entry therefore never disappears from the record — it IS one of the two slots (typed-language slot is stored verbatim).
- **Dashboard activity timeline** (candidate dashboard feed, language-aware UI): the timeline item metadata carries both name slots; `CandidateDashboardContent` picks by the active UI language (AR → `patientNameAr`, EN → `patientNameEn`, fallback raw) — same convention as the calendar. Requires the backend `/activityTimeline` metadata + the client-side prepend path in `dashboardSlice` to carry both slots.
- Same treatment for the **procedure line in PDFs/emails** where a clerk phrase exists: the templates already show "Arabic Procedure Title" + English procedure names; once `clerk_procs.titleAr/titleEn` exist (Part 1) the clerk's phrase is rendered in both forms alongside, keeping the document fully bilingual.

New **Stage D2** covers all of this.

### 3.6 Instant save — background enrichment (Q6 — decided YES)

Today `POST /calSurg` waits synchronously for the Gemini transliteration (and would soon wait for the phrase translation too) — ~16–20 s per new surgery. Approved change:

- **Synchronous (before the response)**: validate → insert the cal_surg → insert/link the `clerk_procs` row (`resolveOrCreate`'s local part — fast DB ops, so `clerkProcId` and `clerkId` are set at response time). Response returns in normal API time.
- **Fire-and-forget (after the response)**: hub semantic resolution (`procCptId`/`mainDiagId`/`matchScore`), patient-name transliteration (`patientNameAr/En`), phrase translation (`titleAr/titleEn`). Each failure leaves its slot NULL — visible via the calendar fallbacks and retried opportunistically on the next encounter (the pattern `tryResolve` already uses).
- PATCH name edits get the same treatment (respond first, re-transliterate in background).
- Stage G verifies: create responds in < ~2 s; slots observably fill within seconds; a killed background task self-heals on the next encounter.

---

## 4. Part 3 design — incremental prod → ka delta sync

### 4.1 Verified facts (read-only, 2026-07-16)

- Prod `cal_surgs`: has `createdAt` + `updatedAt` (`ON UPDATE CURRENT_TIMESTAMP`) → new AND edited rows are detectable.
- Prod `submissions`: same two columns, same semantics; `subGoogleUid` UNIQUE also available as a secondary identity check.
- Prod still has `arab_procs` (retired on ka only) — new prod cal_surgs still reference it; `arab_procs.name` is the procedure phrase feeding the learning pipeline.
- The 2026-07-15 rebuild preserved prod row **ids** in ka → identity matching is by primary key, no crosswalk needed.
- ka `clerks` contains exactly ONE row: `45eb7fb8-b9af-4bdd-90c8-8519cb4ce472` (Mohamed Ismail) — the directive's target clerk exists.
- ka `cal_surgs`: 5,578/5,578 already carry `departmentId`, all resolving to **NS** — consistent with the "source is NS-scoped" directive.
- **No uploader evidence channel exists in the source today**: prod `cal_surgs` has no creator/uploader column (full schema verified) and the sheet-import row shape (`IExternalRow`) carries none — so "unless uploaded by someone else" currently has nothing to trigger on; the rule is recorded so that if an evidence surface appears (e.g. a form email field), it wins over the default.
- ka `cal_surgs` has **no clerk column** yet (`departmentId`/`clerkProcId` only) — per-surgery assignment needs the small schema addition in §4.4.

### 4.2 Sync state

New tiny ka-institute table `prod_sync_state` (same migration as §2.1): `(tableName PK, lastProdUpdatedAt, lastRunAt, lastReport jsonb)`. Watermark = max prod `updatedAt` successfully applied per table. First run derives its baseline by full comparison (not by trusting any assumed watermark).

### 4.3 The script: `scripts/delta-sync-prod-to-ka.cjs`

Gitignored, same guarded read-only prod connection as `rebuild-calsurgs-clerkprocs.cjs`. **Dry-run by default** — prints the full classified report; writes only with `--apply`. Phases:

1. **Reconcile** — pull `(id, updatedAt)` for prod `cal_surgs` + `submissions` (≈6k rows, cheap); compare against ka. Classify per table: **NEW** (prod id absent in ka), **CHANGED** (prod `updatedAt` > watermark and field-diff confirms). A ka id missing from prod is reported as an **anomaly only** (user guarantees the source never deletes — §6 Q3). Report counts + samples.
2. **Dependency closure** — new rows may reference candidates/supervisors/hospitals created after the snapshot: detect missing parents and import them first (reusing the existing ETL field mappings), else the FK inserts fail. Report which parents were pulled. (Events are NOT in this closure — no sub or cal_surg column references them; confirmed with the user as a separate issue, §6 Q4.)
3. **cal_surgs upsert** —
   - NEW: insert with prod id preserved; `departmentId` = **NS** (the source is NS-scoped by directive — §4.4); `clerkId` = **the default clerk** unless uploader evidence says otherwise (§4.4); `arabProcId` → prod `arab_procs.name` → `ClerkProcService.resolveOrCreate` (known phrase = free relink; new phrase = 1 dept-scoped hub search + 1 translation per Part 1); NULL procedure → both NULL (rule #6); bilingual patient names via the **initials-aware** `transliterateBatch` (§3) over the distinct NEW names only.
   - CHANGED: update the changed columns; `patientName` changed → re-transliterate that name; `arabProcId` changed → re-resolve `clerkProcId`/`procCptId`.
4. **subs + keyed answers** — NEW subs: insert + generate `submission_question_answers` via the same six-flag→keyed mapping used in the rebuild (extracted into a shared helper rather than copy-pasted); mainDiag remap as before. CHANGED subs (`subStatus`, `review`, `reviewedAt`, edited fields): update in place + regenerate that sub's keyed answers.
5. **Deletions** — none, by decision (§6 Q3): the user guarantees nothing is ever deleted from the source, so the sync has NO delete mode at all. The reconcile's anomaly report (phase 1) is the only trace of the topic.
6. **Verify + record** — parity counts vs prod (cal_surgs, subs, answers, per-status sub counts), 0 FK orphans, NULL-procedure parity, 100% of NEW rows have a filled name slot with correct initials structure, spot samples; write the report, advance the watermark, update this doc's checkpoint.

### 4.4 NS scoping + clerk attribution (user directive, 2026-07-16)

**The directive**: all source cal_surgs are NS-scoped and belong to clerk `45eb7fb8-b9af-4bdd-90c8-8519cb4ce472` unless a row is found to have been uploaded by someone else.

1. **Schema** (added to the Stage-A migration): `cal_surgs.clerkId uuid NULL` FK → `clerks` (ON DELETE SET NULL). Needed because cal_surgs currently has NO creator column, and clerk attribution today lives only on the shared `clerk_procs.clerkId` — which cannot express *per-surgery* assignment (one phrase row is shared by many surgeries).
2. **Backfill (one-time, same migration or script)**: ALL existing 5,578 ka cal_surgs → `clerkId = 45eb7fb8-…` ("all the calsurgs on the source database" — every existing ka row came from that source). All are already NS-scoped (verified §4.1) — the backfill asserts rather than changes `departmentId`.
3. **Delta imports (Stage F)**: every NEW row gets `departmentId = NS` and `clerkId = 45eb7fb8-…`. The "unless uploaded by someone else" escape is honored structurally: the import checks the source row for any uploader evidence before applying the default — today no such field exists in prod (verified §4.1), so the check documents itself in the run report ("evidence channel: none — default applied to N rows"); if production ever grows one, it wins without a plan change.
4. **Going forward (create path)**: `POST /calSurg` stamps `cal_surgs.clerkId` from the authenticated clerk's JWT (the controller already extracts it for `clerk_procs`) — so future rows are attributed to their *actual* creator automatically, which is exactly the "unless someone else" rule applied prospectively.
5. **clerk_procs attribution**: NEW phrases learned by the delta import get `clerkId = 45eb7fb8-…` (consistent with the directive — the prod phrases were originally typed by that clerk), and per the user's Q9 answer the **81 legacy rows are re-attributed to the same clerk** in the Stage-A backfill (supersedes the parent plan's NULL decision).
6. **Verification (Stage F/G)**: after every applying run — `cal_surgs` distinct departmentId = 1 (NS); `clerkId` NULL-count = 0 (or exactly the rows with recorded uploader evidence); FK integrity to `clerks` intact.

### 4.5 Operational notes

- Rerunnable at will; each run is small after the first. **Final run happens right before cutover.**
- Rule #8: fresh verified snapshot before the first `--apply`.
- Prod reads use one consistent read-only session; anything written to prod during the run is simply caught by the next run.
- Events/attendance are **out of scope** — confirmed by the user ("a completely separate issue", §6 Q4); nothing in the imported tables references them.

---

## 5. Implementation order

| # | Work | Where |
|---|---|---|
| A | Migration: `clerk_procs.titleAr/titleEn` + `cal_surgs.clerkId` FK (+ backfill all 5,578 to the default clerk + re-attribute the 81 legacy clerk_procs, §4.4/Q9) + `prod_sync_state` | MedScribeNeuroServer `src/migrations-ka/` |
| B | `ProcPhraseService` + `resolveOrCreate` wiring + projections + create-path `clerkId` stamping + instant-save refactor (§3.6) | backend |
| B2 | Initials-aware transliteration in `PatientNameService` + server-side privacy-format enforcement (Q8) | backend |
| C | Backfill 81 clerk_procs titles, verify vs mapping sheet | script |
| C2 | Remediation of malformed initials in existing name slots (dry-run → apply) | script |
| D | Calendar/typeahead display switch | frontend (`design-integration`) |
| D2 | Bilingual PDFs/emails (EN+AR name lines, bilingual clerk phrase) + language-aware activity timeline (Q5, §3.5) | backend + frontend |
| E | Delta-sync script, dry-run report reviewed by user | script |
| F | `--apply` run (after fresh snapshot), verification suite | script |
| G | E2E incl. dept-scoping leak test + update this doc + CLAUDE.md | docs |

Parts are independent and can be approved separately — but doing Part 1 + B2 FIRST is recommended so delta-imported rows get correct bilingual titles and correctly-structured names on arrival instead of needing a second pass.

---

## 6. Decisions (answered by the user 2026-07-16) + remaining open questions

### ✅ Decided

| # | Question | **User's decision** |
|---|---|---|
| Q1 | Translation register for procedure phrases | **Literal translation of the clerk's wording** (e.g. "ورم بالمخ" → "brain tumour"). The normalized medical form stays available as `procCpt.title`. |
| Q2 | EN-mode fallback when `titleEn` is NULL | **CPT title fallback OK.** |
| Q4 | Events/attendance in the delta scope | **Out of scope — "a completely separate issue"** (user). It was raised only out of FK caution; on re-check, NO sub or cal_surg column references events at all (subs FK: candidate/supervisor/calSurg/mainDiag; cal_surgs FK: hospital/department/clerkProc), so the dependency-closure phase needs candidates/supervisors/hospitals only. §4.3 corrected accordingly. |
| Q5 | Patient names in PDFs/emails + activity timeline | **The bilingual standard holds at ALL levels of the app — including PDFs and emails** (user override of the keep-raw recommendation; this is the point of the translation effort). Design in §3.5, Stage D2. |
| Q7 | AR↔EN initials digraph table | **Delegated** — implementation picks the standard Egyptian-romanization table (`ج`=G, `خ`=Kh, `ش`=Sh, `ع`=A, …) without further sign-off; the chosen table is recorded in this doc when built. |
| Q8 | Enforce the initials privacy format server-side too | **Yes.** `formatPatientNameForStore` logic ported to the backend (`UtilService`), applied on create/update before `PatientNameService` — folded into Stage B2. |
| Q9 | Re-attribute the 81 legacy `clerk_procs` to clerk `45eb7fb8-…` | **Yes.** One UPDATE, folded into the Stage-A migration/backfill (supersedes the parent plan's Q1 NULL decision). |
| Q3 | Surgeries deleted in production after being copied — mirror or report? | **Out of scope — "nothing will be deleted from the source and I guarantee that"** (user). The sync performs NO deletions and has no delete mode. The id cross-check stays (it's free); if a ka id ever turns up missing from prod — contradicting the guarantee — the run only REPORTS it as an anomaly and takes no action. |
| Q6 | Instant save with background translation (create latency is ~16–20 s today) | **Yes — instant save.** Design in §3.6: the save + clerk_procs row/link are synchronous (fast DB ops); the hub semantic resolution and ALL Gemini translations run fire-and-forget after the response. Calendar shows the raw entry until the slots fill; failures retry on the next encounter (existing pattern). |

**All 9 questions answered (2026-07-16). No open items — the plan is ready for implementation approval.**

---

## 7. What this plan deliberately does NOT do

- No change to the matching pipeline's order (**department narrowing first, then semantic search** — verified existing behavior, §2.0, protected by a new E2E test), nor to `mainDiagId`, `matchScore`, or the ALPHA-code display — explicitly kept per the requirement.
- No re-translation or re-search of any existing phrase, ever (rule #5).
- No cal_surgs history remap for Part 1 (solved at the clerk_procs level, per the requirement).
- No wipe/rebuild anywhere; no writes to production; no work outside the side branches; no commits without the explicit ask.
