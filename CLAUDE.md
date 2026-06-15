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
All on **staging**, committed and pushed to `migration/mysql-to-postgres`. Migrations `1750000000001`–`1750000000045` applied.

### Session recap — CPT audit + NS ICD-11 audit + fixes (migrations 042–045)
- **042** Fixed proc_cpts casing duplicates (0274T/0274t, 0908T/0908t) — lowercase variants removed.
- **043** Fixed 6 definite CPT code mismatches in NS proc_cpts + 2 title-only corrections.
- **044** Resolved 10 partial CPT match issues (title/description updates, no numCode changes).
- **045** Fixed 10 NS ICD-11 code mismatches in `diagnoses` table (3 ❌ + 7 ⚠️ — see `ICD_AUDIT_NS.md`).

**State after 045: 506 diagnoses (all embedded), 94 proc_cpts (embeddings not yet backfilled), 155 NS main_diag_procs links. All NS ICD-11 codes audited and corrected.**

**Pending / next steps:**
1. **Backfill `proc_cpts.embedding`** — write a script mirroring `scripts/backfill-diagnosis-embeddings.ts` but for `proc_cpts` (same Gemini model `gemini-embedding-001`, 768-dim).
2. **2 VASC ICD-11 codes still open**: `BD10.4` subclavian artery stenosis, `BA41.0` carotid artery stenosis (flagged in `MISMAPPED_ICD11_CODES.md`).
3. **Amblyopia**: correct ICD-11 code for OPHTHAL strabismus category not yet confirmed (somewhere 9C80–9C8Z).
4. **Proc_cpts for non-NS departments** not yet imported.

## 🔴 Handoff note: migrations are now in git (force-added)
`src/migrations/` is in `.gitignore` but all migration files (001–045) were committed with `git add -f`. If `.gitignore` is ever respected again (e.g. `git rm --cached`), migration files would disappear from git. Keep force-adding new migrations.

## Audit/data-quality artifacts
- `MISMAPPED_ICD11_CODES.md` (repo root) — ICD-11 code mismaps found across all departments; 2 still-open VASC codes.
- `MEDICAL_CODE_AUDITS/CPT_AUDIT_NS.md` — Full CPT code audit for NS `proc_cpts`: all 94 rows reviewed; 6 code mismatches fixed (043), 10 partial-match issues resolved (044).
- `MEDICAL_CODE_AUDITS/ICD_AUDIT_NS.md` — Full ICD-11 audit for all 134 NS diagnoses; 10 codes fixed (045). See "Changes Applied" section for details.
