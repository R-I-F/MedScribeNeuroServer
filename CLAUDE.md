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

## 📍 Where we stopped (2026-06-23)
All on **staging**. Migrations `1750000000001`–`1750000000110` applied. Migrations 104–110 (SOC), 098–103 (HBP) and 091–097 (PEDSURG) were added this session and **force-added to git but not yet committed** (commit only on explicit request). VASC migrations 085–090 are committed.

### ✅ SOC full dept-audit — COMPLETE (migrations 104–110)
Save-game at `MEDICAL_CODE_AUDITS/SOC/AUDIT_SOC.md`. SOC (Surgical Oncology) reference data was **~62% corrupt** (13/26 ICD codes wrong + 3 approximate). The seed mapped concepts onto the **wrong chapter blocks**: `2B60`=lip, `2B91`=rectosigmoid, `2B5C`≠stomach, `2C90`=kidney, `2C73`=ovary, `2C77`=**cervix uteri**, `2C80`/`2C8x`=male genital, `2C6Y`=breast, `2D42`=ill-defined sites. SOC started with **0 proc_cpts**.
- **104** MIG-A: 10 in-place recodes + **6 collision-aware MERGEs** into GS/PRS/HBP shared rows (stomach→GS `2B72.Z`, oesophagus→GS `2B70.Z`, melanoma→PRS `2C30.Z`, peritoneal→HBP `2D91`, BCC→PRS `2C32.Z`, SCC-skin→PRS `2C31.Z`). Cross-dept fix: bladder `2C90.0`(RCC code)→`2C94.2` also corrects **UROL**. Three recodes free codes reused for their correct meaning in MIG-D (`2C90.0`→RCC, `2C77.0`→cervix SCC, `2C73.1`→dysgerminoma).
- **105** +4 main_diags (genitourinary, endocrine & adrenal, gynaecological, biliary tract & gallbladder) → 16 categories; linked the orphaned bladder row → genitourinary; moved adrenocortical carcinoma metastatic→endocrine.
- **106+107** +74 diagnoses → **100 total** (42 new rows + 32 links to correctly-labelled shared rows owned by GS/HBP/PRS/ENT/ORTHO/NS/PEDSURG/UROL/OBGYN). 52 embeddings backfilled. Every category ≥5.
- **108+109** Imported **101** AAPC-verified oncology proc_cpts across **18 new alpha groups** (BRST, AXIL, COLR, GAST, ESOG, HEPB, BILI, PANC, THYR, HNCK, SKIN, OVRY, HYST, SARC, NEPH, ADRN, LYMP, METS). None deleted; the 2025-deleted retroperitoneal-tumour codes were avoided (`49186–49190` used).
- **110** Linked all 101 procs + MNR to the 16 main_diags; some dual-linked (HEPB hepatectomy→hepatocellular+metastatic+biliary; THYR→head&neck+endocrine; SKIN→melanoma+non-melanoma; AXIL sentinel-node→breast+melanoma). 93 new proc embeddings backfilled (8 reused shared rows already embedded).

**State after 110: SOC at 100 diagnoses (all ICD-11 verified ✅, all embedded ✅), 102 linked proc_cpts (101 AAPC-verified oncology ops + MNR, all embedded ✅), 16 main_diags; 0 orphans, 0 empty categories. Every category ≥5 diagnoses & ≥6 procs. Audit complete.**

> ⚠️ **Cross-dept mismaps found during SOC audit (flag for those depts)**: MFS uses pancreatic/biliary codes `2C10.0`/`2C10.1`/`2C13.0` for oral/H&N cancers; **GS** labels `2B90.Y` (colon-adeno code) "Lynch syndrome"; **OBGYN** labels `2C76.0` (endometrial code) "carcinoma of uterine cervix". SOC avoided all by substituting free/correctly-labelled codes. Desmoid uses `2F9C` (not ideal `2F7C`, occupied by NS hemangioblastoma mismap). See `MISMAPPED_ICD11_CODES.md`.

### ✅ HBP full dept-audit — COMPLETE (migrations 098–103)
Save-game at `MEDICAL_CODE_AUDITS/HBP/AUDIT_HBP.md`. HBP reference data was **~52% corrupt** (14/27 ICD codes wrong — fabricated sequential codes in the DA9x/DB0x/DC0x/DC1x ranges; portal hypertension in the metabolic chapter `5C81.0`).
- **098** MIG-A: 8 free recodes + **7 collision-aware MERGEs** into existing GS rows (hydatid→`1F73.0`, pseudocyst→`DC30.1`, liver abscess→`DB90.0`, acute cholangitis→`DC13`, choledocholithiasis→`DC11.6`, oesophageal varices→`DA26.0Z`) incl. the cross-dept HCC merge `DA92.0`→`2C12.02` correcting **HBP+SOC**; removed out-of-scope orphan `DA20.3` (oesophageal perforation); relinked pancreatic pseudocyst from "benign liver lesions"→"acute pancreatitis".
- **099+100** +74 diagnoses → **100 total**; 74 embeddings backfilled. Every main_diag ≥5 except metastatic liver disease=4 (documented: few distinct ICD-11 secondary-neoplasm entities exist).
- **101+102** Imported **75** HBP-specific proc_cpts across **7 new groups** (LIVR, BILE, PTBD, PANC additions, SPLN, PORT, ERCP). All AAPC-verified. **Deletion caught**: `47802` (U-tube hepaticoenterostomy, deleted 2025-01-01) excluded. PTBD `47531–47544` is the 2016 replacement set for the deleted percutaneous-biliary codes.
- **103** Linked the 75 new procs + **25 reused GS shared rows** (cholecystectomy 47600/47562, Whipple 48150, partial hepatectomy 47120, ERCP 43260, splenectomy 38100/38120, etc.) + MNR to the 12 main_diags. 75 new proc embeddings backfilled (reused rows already embedded).

**State after 103: HBP at 100 diagnoses (all ICD-11 verified ✅, all embedded ✅), 101 HBP-linked proc_cpts (75 HBP-specific AAPC-verified + 25 reused GS + MNR, all embedded ✅), 12 main_diags; 0 orphans, 0 empty categories. Every main_diag ≥5 diagnoses (except metastatic liver disease=4, documented) & ≥8 procs. Audit complete.**

> ⚠️ **CPT note (reusable)**: the percutaneous transhepatic biliary codes `47510/47511/47525/47530/47560/47561/47630` were DELETED 2016-01-01 → use the `47531–47544` family (cholangiography/drainage/stent/dilation/stone-removal by access type). And `47802` (U-tube hepaticoenterostomy) was DELETED 2025-01-01.
> ⚠️ **Pre-existing MFS mismap noted (flag for MFS audit)**: the seed used `2C10.0` (Adenocarcinoma of pancreas), `2C10.1` (Pancreatic NEN) and `2C12.0` (Malignant neoplasm of liver) as MFS "oral cancer" rows. See `MISMAPPED_ICD11_CODES.md`.

### ✅ PEDSURG full dept-audit — COMPLETE (migrations 091–097)
Save-game at `MEDICAL_CODE_AUDITS/PEDSURG/AUDIT_PEDSURG.md`. PEDSURG data was **~75% corrupt** (18/24 ICD codes wrong — worst yet; surgical conditions scattered into developmental `LA9x`/`LB1x` chapters, tumours in disease chapters, a duodenal-atresia↔pyloric↔Meckel↔annular-pancreas code tangle).
- **091** Added 2 new main_diags (soft tissue & skin lesions; thoracic & lung anomalies) → 15 categories.
- **092** MIG-A: 11 free UPDATEs + **6 collision-aware MERGEs** into shared rows (fournier→PRS `1B71.1`; intussusception→GS `DA91.0`; inguinal→GS `DD51`; umbilical→GS `DD53`; Meckel→GS `LB15.0`; deleted PEDSURG's duplicate `LB13.0`). Resolved duodenal/pyloric cascade, relinked both orphans to soft tissue.
- **093+094** +77 diagnoses → **100 total**; 78 embeddings backfilled. Every main_diag ≥5 except intussusception=3 (documented: only 3 distinct ICD-11 intussusception entities exist).
- **095+096** Imported **101** dept-specific proc_cpts across **13 new alpha groups** (AWAL, APDX, DIAF, ESOP, GUSX, ANOR, HERN, BOWL, NEON, FORG, ONCO, SOFT, THOR). All AAPC-verified. **2023 hernia recode** handled (49570/49572/49580/49585→49591/49592/49593/49613) and **2025 retroperitoneal-tumour deletion** (49203/49204→60540 adrenalectomy + 49186); 46700 adult→46705 infant. 7 THOR codes shared with CTS's existing THOR group (ON CONFLICT reused them).
- **097** Linked all 101 procs to the 15 main_diags + MNR to every category. 94 new proc embeddings backfilled (+7 shared already embedded = all 101).

**State after 097: PEDSURG at 100 diagnoses (all ICD-11 verified ✅, all embedded ✅), 101 dept-specific proc_cpts (all AAPC-verified ✅, all embedded ✅), 15 main_diags; 0 orphans, 0 empty categories. Every main_diag ≥5 diagnoses & ≥5 procs except intussusception (3 dx, documented narrow). Audit complete.**

> ⚠️ **CPT currency notes (reusable)**: (1) the umbilical/epigastric/ventral hernia codes 49560–49590 were DELETED 2023-01-01 → use the anterior-abdominal-hernia family 49591–49622 (by size + reducible/incarcerated + initial/recurrent). (2) intra-abdominal/retroperitoneal tumour excision codes 49203–49205 were DELETED 2025-01-01 → use 49186–49190 (by size) or organ-specific resections (eg adrenalectomy 60540).

### 🔧 dept-audit skill is now resumable (this session)
The `dept-audit` skill now checkpoints continuously so a token-limit interrupt loses no research. New `.claude/skills/dept-audit/resume-check.js` + a **Phase 0** that runs it on every `/dept-audit <DEPT>` and echoes the audit file's `🔄 Progress Checkpoint` block. The audit file is created at **end of Phase 1** (not Phase 6) and updated after every sub-step (2B/2D write in batches of ~10). To resume any interrupted audit: just run `/dept-audit <DEPT>` — Phase 0 shows where to continue.

### ✅ VASC full dept audit — COMPLETE (migrations 085–090)
Save-game at `MEDICAL_CODE_AUDITS/VASC/AUDIT_VASC.md`.
- **085** 18 ICD-11 fixes (VASC data was 61% corrupt) incl. gangrene→`MC85` merge; resolved the 2 long-open codes `BA41.0`→`BD55`, `BD10.4`→`8B22.A`; cross-dept ESRD `GB60.0`→`GB61.5` (TRS+UROL+VASC) and aortic-root `BD50.Z`→`BD50.3Y&XA01A6` (CTS+VASC).
- **086+087** +72 diagnoses → **100 total**, every main_diag ≥5; 84 rows embedded. All ICD-11-verified ✅ + embedded ✅.
- **088+089** Imported **114** dept-specific proc_cpts across **13 new alpha groups** (AORT, EVAR, ENDO, BYPS, ENDA, THRM, PERA, AMPU, DIAL, AVFR, VARX, IVCF, TRMA). All AAPC-verified. **2 deleted codes avoided** (33860→33858, 33870→33871) and the **2026 AMA LER restructure** handled — the lower-extremity endovascular family 37220–37235 was deleted effective 2026-01-01, replaced by new territory codes 37254/37256/37258/37260 (iliac), 37263/37265/37267/37269/37271/37273 (fem-pop), 37280 (tibial), 37296 (inframalleolar). 3 AMPU codes were already ORTHO-owned shared rows (ON CONFLICT reused them).
- **090** Linked all 114 procs to the 12 main_diags + MNR to every category. 111 new proc embeddings backfilled (+3 shared already embedded = all 114).

**State after 090: VASC at 100 diagnoses (all embedded, all ICD-11 verified ✅), 114 dept-specific proc_cpts (all AAPC-verified, all embedded). 12 main_diags; every category ≥5 diagnoses & ≥5 procs; 0 orphans, 0 empty categories. Audit complete.**

> ⚠️ **2026 CPT note (reusable)**: the lower-extremity endovascular revascularization codes 37220–37235 were DELETED by AMA effective 2026-01-01 and replaced by 46 new codes 37254–37299, organised by territory (iliac/fem-pop/tibial-peroneal/inframalleolar) × lesion (stenosis=straightforward vs occlusion=complex) × initial/additional vessel. Use the new codes for any vascular endovascular work going forward.

### Session recap — PRS full dept audit + coverage extension (migrations 078-084)
- **078** Fixed 21 ICD-11 codes (18 wrong + 3 parent→leaf). Original PRS data had injuries/tumours/ulcers in skin-disease `E*` / developmental `L*` chapters. Burns `EJ40/41/42`→`ND92.1/.2/.3` (depth ladder), frostbite `EJ50.0`→`NE41`; cleft `ED00.0/.1`→`LA42.Z`/`LA40.Z`; syndactyly/polydactyly→`LB79.Z`/`LB78.Z`; keloid/hypertrophic→`EE60.0Z`/`EE60.1`; pressure ulcer→`EH90.Z`, diabetic foot→`BD54`; necr. fasc.→`1B71.Z`; BCC/SCC `2F31.0`/`2F33.0`→`2C32.Z`/`2C31.Z`; epidermoid cyst→`EK70.0Z`; GCT-soft-tissue `2B72.0`→`2C35` (cutaneous sarcoma — ideal 2F7C/2F7Z occupied by NS). Two shared rows fixed also benefit **NS** (brachial plexus `NA14.0`→`NA41.Z`) and **PEDSURG** (epidermoid cyst).
- **079** Structural: relinked the recoded scar row (`EH94`) from `contractures` → `scar revision`.
- **080–081** Added 70 diagnoses (30→**100**), every main_diag now ≥5. 86 diagnosis embeddings backfilled.
- **082–083** Imported **100** dept-specific proc_cpts across 12 new alpha groups (FLAP, GRFT, HSGY, CLEF, BURN, BRST, AEST, MICR, WND, SCRV, EXCN, CONT). 100 proc embeddings backfilled.
- **084** Linked all 100 procs to the 12 main_diags + MNR to every category + 4 reused shared procs (BREA 19357/38525, PRPH 64856/64861). All 100 CPTs AAPC-verified (none deleted).

**State after 084: PRS at 100 diagnoses (all embedded, all ICD-11 verified ✅), 100 dept-specific proc_cpts (all AAPC-verified, all embedded). 12 main_diags; every category ≥5 diagnoses & ≥5 procs.**

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
4. **Proc_cpts for remaining departments** (MFS, OBGYN, OPHTHAL, ENT, TRS, UROL) not yet imported. (CTS, NS, GS, ORTHO, PRS, VASC, PEDSURG, HBP, **SOC** done.)
5. **NS re-review** (flagged in `MISMAPPED_ICD11_CODES.md`): NS uses `2F7C` for "hemangioblastoma" and `2F7Z` for "epidermoid and dermoid tumors" — both are *uncertain-behaviour neoplasm* codes, likely mismapped. (SOC desmoid had to use `2F9C` instead of the ideal `2F7C` because of this.)
6. **MFS oral-cancer mismap** (HBP audit + confirmed/expanded by SOC audit, in `MISMAPPED_ICD11_CODES.md`): seed used `2C10.0`/`2C10.1`/`2C12.0`/`2C13.0` (pancreas/liver/gallbladder oncology codes) as MFS "oral/H&N cancer" rows. Fix in an MFS audit.
7. **GS `2B90.Y` mislabel** (found during SOC audit): the colon-adenocarcinoma code `2B90.Y` is labelled "Lynch syndrome" in GS. Fix in a future GS pass.
8. **OBGYN `2C76.0` mislabel** (found during SOC audit): the endometrial-endometrioid-adenocarcinoma code `2C76.0` is labelled "carcinoma of uterine cervix" in OBGYN. Fix in an OBGYN audit.

## 🔴 Handoff note: migrations are now in git (force-added)
`src/migrations/` is in `.gitignore` but all migration files (001–084) were committed with `git add -f`. If `.gitignore` is ever respected again (e.g. `git rm --cached`), migration files would disappear from git. Keep force-adding new migrations.

## Audit/data-quality artifacts
- `MISMAPPED_ICD11_CODES.md` (repo root) — ICD-11 code mismaps found across all departments. ORTHO mismaps resolved 2026-06-19 (migrations 070-071); PRS mismaps resolved 2026-06-20 (migration 078); the 2 long-open VASC codes (`BA41.0`, `BD10.4`) resolved 2026-06-20 (migration 085); PEDSURG (092) + HBP (098) + SOC (104) mismaps resolved 2026-06-23. New open items: MFS oral/H&N-cancer mismap (`2C10.0`/`2C10.1`/`2C12.0`/`2C13.0`), GS `2B90.Y`="Lynch syndrome", OBGYN `2C76.0`="cervix" — all discovered during HBP/SOC audits.
- `MEDICAL_CODE_AUDITS/NS/AUDIT_NS.md` — Full audit for NS (ICD-11 + CPT); 10 ICD-11 codes fixed (045); 6 CPT codes fixed (043), 10 CPT title/description updates (044). ✅ **134 diagnoses, 94 proc_cpts — all codes verified. Audit complete.**
- `MEDICAL_CODE_AUDITS/CTS/AUDIT_CTS.md` — Full audit for CTS (ICD-11 + CPT + gaps); 1 name fix (046), 5 new diagnoses (047), 72 new proc_cpts (048–050); extended to 100 diagnoses + 100 proc_cpts (057–059); 52 ICD-11 errors fixed (060–064). ✅ **All codes verified — audit complete.**
- `MEDICAL_CODE_AUDITS/GS/AUDIT_GS.md` — Full audit for GS; 3 new diagnoses (052), 64 new proc_cpts (053–055); 23 ICD-11 errors fixed (065); 58 new diagnoses added (066–068); 35 new proc_cpts added (069). ✅ **96 diagnoses, 100 proc_cpts — all ICD-11 verified. Audit complete.**
- `MEDICAL_CODE_AUDITS/ORTHO/AUDIT_ORTHO.md` — Full audit for ORTHO; 19 ICD-11 errors fixed + 1 leaf refinement (070), 3 duplicate merges + 1 spurious link (071), 73 new diagnoses (072–073), 101 new proc_cpts (074–076), all 101 CPT codes AAPC-verified + 4 corrected (077). ✅ **105 diagnoses, 101 proc_cpts — all ICD-11 and CPT codes verified. Audit complete.**
- `MEDICAL_CODE_AUDITS/PRS/AUDIT_PRS.md` — Full audit for PRS; 21 ICD-11 codes fixed (078, incl. shared NS brachial-plexus + PEDSURG epidermoid rows), 1 structural relink (079), 70 new diagnoses (080–081), 100 new proc_cpts AAPC-verified (082–084). ✅ **100 diagnoses, 100 proc_cpts — all ICD-11 and CPT codes verified. Audit complete.**
- `MEDICAL_CODE_AUDITS/VASC/AUDIT_VASC.md` — Full audit for VASC; data was 61% corrupt. 18 ICD-11 codes fixed (085: incl. cross-dept ESRD fix for TRS+UROL+VASC and aortic-root fix for CTS+VASC); +72 diagnoses (086/087) → 100; +114 proc_cpts AAPC-verified across 13 new alpha groups (088/089), all linked (090); 2 deleted CPTs avoided + 2026 LER restructure handled. ✅ **100 diagnoses, 114 proc_cpts — all ICD-11 and CPT codes verified, all embedded. Audit complete.**
- `MEDICAL_CODE_AUDITS/PEDSURG/AUDIT_PEDSURG.md` — Full audit for PEDSURG; data was ~75% corrupt (worst yet, 18/24 ICD codes wrong). 2 new main_diags (091); 18 ICD fixes incl. 6 collision-aware MERGEs into GS/PRS shared rows + duodenal/pyloric/Meckel cascade (092); +77 diagnoses (093/094) → 100; +101 proc_cpts AAPC-verified across 13 new alpha groups (095/096), all linked (097); 2023 hernia recode + 2025 retro-tumour deletion handled; 7 THOR procs shared with CTS. ✅ **100 diagnoses, 101 proc_cpts — all verified, all embedded. Audit complete (intussusception=3 dx documented narrow).**
- `MEDICAL_CODE_AUDITS/HBP/AUDIT_HBP.md` — Full audit for HBP; data was ~52% corrupt (14/27 ICD codes wrong — fabricated DA9x/DB0x/DC0x sequential codes). 14 ICD fixes incl. 6 collision-aware MERGEs into GS rows + cross-dept HCC merge (HBP+SOC) + orphan removal (098); +74 diagnoses (099/100) → 100; +75 HBP-specific proc_cpts AAPC-verified across 7 new groups (101/102) + 25 reused GS rows, all linked (103); 47802 deletion caught + 2016 percutaneous-biliary recode family used. Discovered the MFS oral-cancer mismap (2C10.0/2C10.1/2C12.0). ✅ **100 diagnoses, 101 proc_cpts — all verified, all embedded. Audit complete (metastatic liver disease=4 dx documented narrow).**
- `MEDICAL_CODE_AUDITS/SOC/AUDIT_SOC.md` — Full audit for SOC (Surgical Oncology); data was ~62% corrupt (13/26 wrong + 3 approx — wrong chapter blocks: 2B60=lip, 2B91=rectosigmoid, 2C90=kidney, 2C73=ovary, 2C77=cervix, 2C6Y=breast, 2D42=ill-defined). 16 code changes incl. 6 collision-aware MERGEs into GS/PRS/HBP rows + cross-dept bladder fix (SOC+UROL) (104); +4 main_diags → 16 + orphan/recategorise structural fixes (105); +74 diagnoses (106/107) → 100; SOC had 0 procs → +101 AAPC-verified oncology proc_cpts across 18 new alpha groups (108/109), all linked (110). Discovered MFS (2C13.0), GS (2B90.Y), OBGYN (2C76.0) mismaps. ✅ **100 diagnoses, 102 proc_cpts — all verified, all embedded. Audit complete.**
