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
All on **staging**, **uncommitted beyond the side-branch commits**. Migrations `1750000000011`–`1750000000027` (in `src/migrations/`, gitignored) are applied.

**Done:**
- Filled every empty `main_diags` across all 15 departments → **0 empty main_diags**. Procedure-named categories (transplants, dental implants, bariatric, aesthetic, vascular access) mapped to their codeable **indication**.
- Added high-volume diagnoses (e.g. NS brain/spinal metastases, subdural empyema, OPLL, concussion).
- **Full ICD-11 code audit + fixes:** original 5 mismaps (migration 024), 20 clean audited mismaps incl. the whole ENT ear/nose-throat cluster (026), and the tangled cardiovascular cluster + merged the `DC94.0/.1` pancreatitis duplicates (027).
- State: **480 diagnoses, all embedded, 0 empty main_diags.**

**Pending / next steps:**
1. **Thin-strengthening (task not finished):** ~57 `main_diags` across 13 departments still have only 1 diagnosis. Only **HBP** was strengthened (migration 025) as the example. Continue department-by-department where a category has genuine additional common entities; leave true single-entity categories alone.
2. **2 codes left flagged** (no distinct ICD-11 atherosclerotic-stenosis leaf — need site extension codes the one-code-per-row schema can't hold): `BD10.4` subclavian artery stenosis, `BA41.0` carotid artery stenosis. See `MISMAPPED_ICD11_CODES.md`.
3. Consider whether `src/migrations/` should be force-added to git (see handoff note).

## 🔴 Handoff note: migrations are gitignored
`src/migrations/` is in `.gitignore`, so the 17 migration files that define all the reference-data work exist **only on this machine's disk** and as applied state in the **staging DB** — they are **not in git**. The staging-migrations *config* (`staging-migrations.config.ts`) IS committed, but it references files that aren't. If this working copy is cleaned or moved, that work is lost. To make the work durable/portable, `git add -f src/migrations/*.ts` (the user must decide, given their gitignore choice).

## Audit/data-quality artifact
`MISMAPPED_ICD11_CODES.md` (repo root) records every ICD-11 code mismap found and how it was fixed, plus the 2 still-open flagged codes.
