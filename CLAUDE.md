# CLAUDE.md

Guidance for Claude Code working in this repository.

## ⚠️ Critical constraints (read first)
- **NEVER commit or push to `main`.** `main` is the live **production** app. Work only on side branches (currently `migration/mysql-to-postgres`). Commit only when the user explicitly asks.
- **All database work is on STAGING**, via `.env.staging` (Aiven Postgres host `pg-288cac9e-logbooknative.g.aivencloud.com`, DB `defaultdb`). Never point scripts at production.
- Secrets `.env`, `.env.staging`, `*.pem` are gitignored. **`src/migrations/` and `scripts/` are also gitignored** — see the handoff note below.

## Project
MedScribeNeuroServer — Node/TypeScript/Express backend (TypeORM + Inversify DI), a multi-tenant medical/surgical logbook platform. Active work is on `migration/mysql-to-postgres`: migrating shared **reference data** into Postgres `defaultdb` and adding a **semantic diagnosis-search** feature exposed over **MCP**.

## Reference data model (shared, in defaultdb)
`Department → main_diags (categories) → diagnoses`, linked via `department_diagnoses` (dept↔diagnosis) and `main_diag_diagnoses` (main_diag↔diagnosis).
- Accessed by `ReferenceDataSource` (`src/config/referenceDb.config.ts`) — pooled raw-SQL connection, **no entities**.
- Goal: data should reflect **>90% of surgical diagnoses at a university hospital**. Every `main_diags` should have diagnoses (an empty one is redundant). **All ICD-11 codes must be verified** against WHO ICD-11 (findacode.com mirrors it well; the WHO browser is JS-heavy/hard to fetch) — do not guess codes.

## Semantic search + MCP
- `DiagnosisSearchService` (`src/diagnosis/diagnosisSearch.service.ts`): embeds the query (Gemini) and runs pgvector **cosine** search (`<=>`, HNSW `vector_cosine_ops`), scoped to a department.
- Embeddings: model **`gemini-embedding-001`** (the API key does NOT serve `text-embedding-004`), `outputDimensionality: 768` to match the `vector(768)` column. See `AiAgentService.embedText` (`src/aiAgent/aiAgent.service.ts`).
- MCP server (`src/mcp/`): stateless Streamable-HTTP at `/mcp`, JWT-authed, exposes a `search_diagnosis` tool.

## Staging workflow & commands
- `npm run db:migrate:staging` — apply pending migrations. **The migration list is explicit in `src/config/staging-migrations.config.ts`; add each new migration file to that array** or it won't run.
- `npm run db:backfill-embeddings:staging` — idempotent; embeds only rows with NULL `embedding` (`gemini-embedding-001`). Run after adding diagnoses.
- Per-department migration pattern: `INSERT diagnoses (EN + Arabic name + EN/AR description) … ON CONFLICT("icdCode") DO NOTHING` → link `department_diagnoses` (by `dept.code`) → link `main_diag_diagnoses` (by `md.title`). Share existing correct-coded diagnoses across departments rather than duplicating. Always include a clean `down()`.
- Department codes: CTS, GS, HBP, MFS, NS, OBGYN, OPHTHAL, ORTHO, ENT, PEDSURG, PRS, SOC, TRS, **UROL** (not URO), VASC.

## 📍 Where we stopped (2026-06-16)
All on **staging**, committed and pushed to `migration/mysql-to-postgres`. Migrations `1750000000001`–`1750000000050` applied.

### Session recap — CTS dept-audit (migrations 046–050)
- **046** Fixed BC81.3 icdName: "atrial fibrillation" → "permanent atrial fibrillation" (name matched the specific subtype code).
- **047** Added 5 missing CTS diagnoses: BA40 (unstable angina), CA22.Z (lung abscess), CB24.1 (secondary pneumothorax), BB80.Z (acute pericarditis), BB82 (cardiac tamponade).
- **048** Imported 72 CTS proc_cpts: 40 CARD (cardiac surgery) + 32 THOR (thoracic surgery).
- **049** Linked all CTS proc_cpts to all 17 CTS main_diags.
- **050** Fixed MNR basic-step link (numCode is `00001-00`, not `12001-00` as assumed in 049).

**State after 050: 511 diagnoses (all embedded), 169 proc_cpts (embeddings not yet backfilled), all 17 CTS main_diags fully populated. CTS ICD-11 audit: 58/59 original codes ✅ OK, 1 name fix (BC81.3).**

**Known issue in NS migrations: MIG-041 also referenced MNR `12001-00` (basic surgical step) which doesn't exist — NS main_diags are missing the `00001-00` link too. Not fixed yet.**

**Pending / next steps:**
1. **Backfill `proc_cpts.embedding`** — write a script mirroring `scripts/backfill-diagnosis-embeddings.ts` but for `proc_cpts` (same Gemini model `gemini-embedding-001`, 768-dim). Now 169 rows need embedding.
2. **Fix NS MNR basic-step link** — NS main_diags reference `12001-00` (not found); should link to `00001-00` like CTS-050 did. Add migration 051.
3. **2 VASC ICD-11 codes still open**: `BD10.4` subclavian artery stenosis, `BA41.0` carotid artery stenosis (flagged in `MISMAPPED_ICD11_CODES.md`).
4. **Amblyopia**: correct ICD-11 code for OPHTHAL strabismus category not yet confirmed (somewhere 9C80–9C8Z).
5. **Proc_cpts for remaining departments** (GS, VASC, ORTHO, etc.) not yet imported.
6. **CTS unverified diagnoses** (pending findacode): rheumatic aortic valve disease, bicuspid AV, pulmonary valve stenosis (congenital), small cell lung cancer.

## 🔴 Handoff note: migrations are now in git (force-added)
`src/migrations/` is in `.gitignore` but all migration files (001–045) were committed with `git add -f`. If `.gitignore` is ever respected again (e.g. `git rm --cached`), migration files would disappear from git. Keep force-adding new migrations.

## Audit/data-quality artifacts
- `MISMAPPED_ICD11_CODES.md` (repo root) — ICD-11 code mismaps found across all departments; 2 still-open VASC codes.
- `MEDICAL_CODE_AUDITS/NS/CPT_AUDIT_NS.md` — Full CPT code audit for NS `proc_cpts`: all 94 rows reviewed; 6 code mismatches fixed (043), 10 partial-match issues resolved (044).
- `MEDICAL_CODE_AUDITS/NS/ICD_AUDIT_NS.md` — Full ICD-11 audit for all 134 NS diagnoses; 10 codes fixed (045). See "Changes Applied" section for details.
- `MEDICAL_CODE_AUDITS/CTS/AUDIT_CTS.md` — Full audit for CTS (ICD-11 + CPT + gaps); 1 name fix (046), 5 new diagnoses (047), 72 new proc_cpts (048–050).
