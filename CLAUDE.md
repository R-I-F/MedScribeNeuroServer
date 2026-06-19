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

## 📍 Where we stopped (2026-06-19)
All on **staging**. Migrations `1750000000001`–`1750000000077` applied. Migrations 070–077 (ORTHO) were added this session and **force-added to git but not yet committed** (commit only on explicit request).

### Session recap — ORTHO full dept audit + coverage extension (migrations 070-076)
- **070** Fixed 17 ICD-11 codes (+1 leaf refinement): traumatic fractures were in the FB* *disease* chapter instead of N* *injury* chapter (e.g. tibial shaft FB50.0→NC92.2, neck of femur FB80.0→NC72.2Z); cross-chapter mismaps fixed: meniscal tear NC72.0→NC93.3Z, osteomyelitis LA91.1→FB84.Z, OA knee/hip NC90.0/.1→FA01.Z/FA00.Z, rotator cuff tear FA71.0→NC16.0Y.
- **071** Structural: merged 3 mis-coded duplicate rows into NS-owned correct rows (lumbar disc FA30.0→FA80.9, lumbar stenosis FA31.0→FA82, lumbar fx FB20.0→NB52.0); removed a spurious intertrochanteric↔osteonecrosis link. Freed FA30.0, reused for acquired hallux valgus.
- **072–073** Added 73 diagnoses (→105 total). 4 new main_diags created: bone tumours, foot & ankle disorders, hand & wrist disorders, paediatric & developmental conditions. 84 diagnosis embeddings backfilled.
- **074–076** Added 101 dept-specific proc_cpts across 12 new alpha groups (ARTH, SCOP, FIXN, SPIN, HAND, FOOT, SOFT, TUMR, OSTE, PEDS, INFX, AMPU) + linked all to the 17 main_diags with shared MNR. 101 proc embeddings backfilled.
- **077** All 101 CPT codes verified against AAPC (`aapc.com/codes`); 4 corrected: kyphoplasty 22524 (deleted by AMA 2015)→22514, vertebroplasty 22514→22511, SCOP 29891 retitled (osteochondral lesion of talus), TUMR 27065 tightened. 4 rows re-embedded.

**State after 076: ORTHO at 105 diagnoses (all embedded, all ICD-11 verified ✅), 101 dept-specific proc_cpts (all embedded). 17 main_diags; every category ≥5 diagnoses & ≥5 procs EXCEPT `carpal tunnel syndrome` (1 dx, 3 procs — documented single-entity exception).**

### Session recap — GS coverage extension (migrations 066-068)
- **066** Added 15 diagnoses: abdominal trauma (+3: pancreas/small intestine/colon injuries), acute abdomen (+8: mesenteric ischaemia, GI bleed, rectal haemorrhage, anal fistula, rectal prolapse, small bowel intussusception, perianal thrombosis, Meckel diverticulum), appendicitis (+1: perforated with generalised peritonitis), bariatric (+3: metabolic syndrome, NAFLD, NASH)
- **067** Added 17 diagnoses: bowel obstruction (+3: strangulated inguinal hernia, large bowel obstruction, large bowel intussusception), breast lumps & cancer (+8: fibroadenoma, DCIS, ILC, Paget disease, fibrocystic change, gynaecomastia, phyllodes, LCIS), colorectal (+6: rectal adenocarcinoma, anal SCC, GIST, Lynch syndrome, rectosigmoid malignancy, HCC)
- **068** Added 26 diagnoses: cholecystitis & cholelithiasis (+9: choledocholithiasis, cholangitis, pseudocyst, GB polyp, chronic cholecystitis, cholelithiasis+chronic, hepatic abscess, hydatid cyst, pancreatic adenocarcinoma), peptic ulcer disease (+6: GORD, gastric cancer, H. pylori gastritis, GOO, oesophageal varices, oesophageal carcinoma), hernias (+4: epigastric, hiatal, strangulated femoral, strangulated umbilical), thyroid (+7: Graves', multinodular goitre, Hashimoto's, medullary, anaplastic, primary hyperparathyroidism, toxic MNG)
- 50 new embeddings backfilled (8 diagnoses already had embeddings as shared with other depts)
- **069** Added 35 proc_cpts: BILI (percutaneous cholecystostomy, hepaticojejunostomy, choledochoduodenostomy, partial hepatectomy, RFA/MWA ablation, ERCP+stent), PANC (Whipple, PPPD, distal pancreatectomy, pseudocyst drainage, necrosectomy), OESO (transhiatal oesophagectomy, Ivor Lewis, PEG, oesophageal dilation), GASTR (total gastrectomy ×2, Billroth I, Billroth II, duodenal switch), ENDO (variceal ligation, EMR), LAPR (lap liver ablation, lap distal pancreatectomy, lap distal gastrectomy), COLO (total abdominal colectomy, IPAA), NECK (modified radical neck dissection, radical neck+thyroidectomy), BREA (subcutaneous mastectomy for gynaecomastia, breast reconstruction with expander), THYR (parathyroid autotransplantation), ABDO (re-laparotomy, peritoneal abscess drainage, intestinal bypass). All 35 embeddings backfilled.

**State after 069: GS at 96 diagnoses (all embedded, all ICD-11 codes verified ✅), 100 proc_cpts (99 GS-specific + 1 shared). CTS: 100 diagnoses, 100 proc_cpts. NS: 134 diagnoses, 94 proc_cpts.**

**Also from earlier sessions:**
- dept-extend skill merged into dept-audit. dept-extend directory deleted.
- medical-terminologies-mcp configured in user scope; `icd11_search` is the verification tool; `icd11_lookup` is broken (returns "Unknown" for all codes — do not use).

**Pending / next steps:**
1. **GS diagnoses**: 96 total; +4 to reach 100 (minor gaps: Spigelian hernia, chronic appendicitis, diverticular fistula — low priority)
2. **2 VASC ICD-11 codes still open**: `BD10.4` subclavian artery stenosis, `BA41.0` carotid artery stenosis (flagged in `MISMAPPED_ICD11_CODES.md`).
3. **Amblyopia**: correct ICD-11 code for OPHTHAL strabismus category not yet confirmed (somewhere 9C80–9C8Z).
4. **Proc_cpts for remaining departments** (VASC, HBP, MFS, OBGYN, OPHTHAL, ENT, PEDSURG, PRS, SOC, TRS, UROL) not yet imported. (ORTHO done this session.)

## 🔴 Handoff note: migrations are now in git (force-added)
`src/migrations/` is in `.gitignore` but all migration files (001–077) were committed with `git add -f`. If `.gitignore` is ever respected again (e.g. `git rm --cached`), migration files would disappear from git. Keep force-adding new migrations.

## Audit/data-quality artifacts
- `MISMAPPED_ICD11_CODES.md` (repo root) — ICD-11 code mismaps found across all departments; 2 still-open VASC codes. ORTHO mismaps resolved 2026-06-19 (migrations 070-071).
- `MEDICAL_CODE_AUDITS/NS/AUDIT_NS.md` — Full audit for NS (ICD-11 + CPT); 10 ICD-11 codes fixed (045); 6 CPT codes fixed (043), 10 CPT title/description updates (044). ✅ **134 diagnoses, 94 proc_cpts — all codes verified. Audit complete.**
- `MEDICAL_CODE_AUDITS/CTS/AUDIT_CTS.md` — Full audit for CTS (ICD-11 + CPT + gaps); 1 name fix (046), 5 new diagnoses (047), 72 new proc_cpts (048–050); extended to 100 diagnoses + 100 proc_cpts (057–059); 52 ICD-11 errors fixed (060–064). ✅ **All codes verified — audit complete.**
- `MEDICAL_CODE_AUDITS/GS/AUDIT_GS.md` — Full audit for GS; 3 new diagnoses (052), 64 new proc_cpts (053–055); 23 ICD-11 errors fixed (065); 58 new diagnoses added (066–068); 35 new proc_cpts added (069). ✅ **96 diagnoses, 100 proc_cpts — all ICD-11 verified. Audit complete.**
- `MEDICAL_CODE_AUDITS/ORTHO/AUDIT_ORTHO.md` — Full audit for ORTHO; 19 ICD-11 errors fixed + 1 leaf refinement (070), 3 duplicate merges + 1 spurious link (071), 73 new diagnoses (072–073), 101 new proc_cpts (074–076), all 101 CPT codes AAPC-verified + 4 corrected (077). ✅ **105 diagnoses, 101 proc_cpts — all ICD-11 and CPT codes verified. Audit complete.**
