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

## 📍 Where we stopped (2026-06-15)
All on **staging**, committed and pushed to `migration/mysql-to-postgres`. Migrations `1750000000011`–`1750000000041` (in `src/migrations/`, force-added to git this session) are applied.

### Previous session — ICD-11 audit + GS biliary (migrations 035–036, committed `d2e81ac`)
- **035** ICD-11 Audit Batch 2 — 12 confirmed mismaps fixed; **036** GS biliary: DC91.x deleted, DC11.3 inserted.
- State after 036: 506 diagnoses, all embedded, 0 empty main_diags.

### This session — proc_cpts table + NS procedure data (migrations 037–041)
New tables created in PostgreSQL staging (`defaultdb`):
- **037** `proc_cpts` table: id (UUID PK), title, alphaCode, numCode, description, ar_title (nullable), ar_description (nullable), createdAt, updatedAt.
- **038** `main_diag_procs` junction table: mainDiagId ↔ procCptId, composite PK, cascade FKs, indexed.
- **039** Added `embedding vector(768)` + HNSW cosine index to `proc_cpts` (nullable, not yet backfilled).
- **040** Imported 94 NS proc_cpts from production KA MySQL (read-only; 96 rows − 2 case-duplicate numCodes: 0274T/0274t, 0908T/0908t). Added Arabic title + description for every row. Unique index on (alphaCode, numCode).
- **041** Linked all 94 proc_cpts to the 10 NS main_diags (155 total links). Also inserted the one row missed in 040 (LAM 64493-02). Script `scripts/read-production-proc-cpts.ts` reads prod MySQL read-only.

**State: 506 diagnoses (all embedded), 94 proc_cpts (embeddings not yet backfilled), 155 NS main_diag_procs links.**

**Pending / next steps:**
1. Backfill `proc_cpts.embedding` once a backfill script is written (same Gemini model, same 768-dim pattern as diagnoses).
2. **2 ICD-11 codes still left as-is**: `BD10.4` subclavian artery stenosis, `BA41.0` carotid artery stenosis.
3. **Amblyopia**: needs correct ICD-11 code added to OPHTHAL strabismus category (code not confirmed; somewhere in 9C80–9C8Z range).
4. Proc_cpts for non-NS departments not yet imported.

## 🔴 Handoff note: migrations are now in git (force-added)
`src/migrations/` is in `.gitignore` but all migration files 037–041 were committed with `git add -f`. Earlier migrations (001–036) were also force-added in this commit. If `.gitignore` is ever respected again (e.g. `git rm --cached`), migration files would disappear from git. Keep force-adding new migrations.

## Audit/data-quality artifacts
- `MISMAPPED_ICD11_CODES.md` (repo root) — ICD-11 code mismaps found and fixed, plus 2 still-open flagged codes.
- `CPT_AUDIT_NS.md` (repo root) — Full CPT code audit for NS `proc_cpts`: all 94 rows reviewed, 6 code mismatches fixed (migration 043), 10 partial-match title/description issues resolved (migration 044).
