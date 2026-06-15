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
All on **staging**, committed and pushed to `migration/mysql-to-postgres`. Migrations `1750000000011`–`1750000000034` (in `src/migrations/`, gitignored) are applied.

### Last session — thin-strengthening pass (migrations 028–034, committed `eeb7180`)
Removed stale "STILL OPEN" pancreatitis section from `MISMAPPED_ICD11_CODES.md` (already fixed in 027).
Then ran the full thin-strengthening pass:
- **028** ENT: added acute mastoiditis (AB11.0), chronic mastoiditis (AB11.1), recurrent respiratory papillomatosis (2F00.1), vocal cord polyp (CA0H.1), laryngeal stenosis (CA0H.5).
- **029** OPHTHAL: fixed `9A60.0` AMD mismap → `9B75.0`; added neovascular AMD (9B75.04), keratoconus (9A78.50), Fuchs/endothelial corneal dystrophy (9A70.0).
- **030** ORTHO: added septic arthritis (FA10.0), chronic osteomyelitis (FB84.4), rotator cuff syndrome (FB53.1), impingement (FB53.2), cervical fracture (NA22.Z), thoracic fracture (NA82.0).
- **031** SOC + UROL: added DCIS (2E65.2), invasive lobular carcinoma (2C61.1), basal cell carcinoma (2C32), classical Hodgkin lymphoma (2B30.1), oral SCC (2B66.0), azoospermia (GB04.0).
- **032** PEDSURG: added gastroschisis (LB02), congenital hydrocele (KC00).
- **033** GS + PRS: added type 2 DM bariatric indication (5A11), colorectal adenoma (2E92.4Y), polyposis syndrome (2E92.40), Dupuytren's (FB51.0).
- **034** Mixed: fixed `BD41.0` AVF mismap → `BD52.1`; added arterial FMD (BD41.0 VASC), metastatic bone disease (2E03 ORTHO), midgut malrotation/volvulus (LB14 PEDSURG), persistent cloaca (LB17.2 PEDSURG), odontogenic keratocyst (DA05.0 MFS).
- **035** ICD-11 Audit Batch 2 — 12 confirmed mismaps fixed (verified via findacode.com):
  - BD11.Z renamed: "heart failure - unspecified" → "left ventricular failure, unspecified"
  - 2C20.0 (SOC NHL) → 2A81.Z (DLBCL NOS); 2C20.3 (ENT larynx) → 2C23.Z; 2C20.4 (ENT NPC) → 2B6B.1
  - 9A70.0 renamed: "amblyopia" → "endothelial corneal dystrophy"; unlinked from strabismus main_diag
  - 9A71.0 (exotropia) → 9C80.1; 9A71.1 (esotropia) → 9C80.0
  - HBP biliary cluster: DC10.0→DC11.Z, DC10.2→DC10.3, DC11.0 renamed, DC12.0→DC13.0, DC13.1→DB96.2Z
- **036** GS biliary cleanup: DC91.0 and DC91.2 (non-existent ICD-11 codes) deleted; GS relinked to DC11.0 (existing) and new DC11.3 (cholelithiasis without cholecystitis).

**State: 506 diagnoses, all embedded, 0 empty main_diags, 42 thin categories (all genuine single-entity conditions).**
Correction philosophy: names were the clinical intent; codes should match the name. When there's a mismatch, correct the code (or rename if the code accidentally points to something more specific and appropriate).

**Pending / next steps:**
1. **2 codes still left as-is** (no distinct ICD-11 atherosclerotic-stenosis leaf): `BD10.4` subclavian artery stenosis, `BA41.0` carotid artery stenosis.
2. **Amblyopia**: 9A70.0 was renamed to endothelial corneal dystrophy (correct). Amblyopia needs its own correct ICD-11 code added to the OPHTHAL strabismus category — code not confirmed yet (ICD-11 ophthal amblyopia code is somewhere in 9C80-9C8Z or 9D41-9D7Z range but not pinpointed).
3. Consider whether `src/migrations/` should be force-added to git (see handoff note).

## 🔴 Handoff note: migrations are gitignored
`src/migrations/` is in `.gitignore`, so the 17 migration files that define all the reference-data work exist **only on this machine's disk** and as applied state in the **staging DB** — they are **not in git**. The staging-migrations *config* (`staging-migrations.config.ts`) IS committed, but it references files that aren't. If this working copy is cleaned or moved, that work is lost. To make the work durable/portable, `git add -f src/migrations/*.ts` (the user must decide, given their gitignore choice).

## Audit/data-quality artifact
`MISMAPPED_ICD11_CODES.md` (repo root) records every ICD-11 code mismap found and how it was fixed, plus the 2 still-open flagged codes.
