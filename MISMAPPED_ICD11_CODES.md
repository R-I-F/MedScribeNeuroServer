# Mismapped ICD-11 codes (for review)

> **STATUS: RESOLVED 2026-06-15** — all rows below were corrected by migration
> `1750000000024-FixMismappedIcdCodes` (DC31.0→DA20.3, DC31.1→DC32, JA00.0→JA01,
> JA40.0→JA8B.Z, 2C73.2→2C73.Z). Kept here as an audit record.


These existing `diagnoses` rows have an ICD-11 code that does **not** match the
condition named/used. The clinical name and department placement may be correct,
but the `icdCode` is wrong per WHO ICD-11 MMS. Semantic search is unaffected (it
runs on names/descriptions, not codes), but the codes are unreliable as references.

Found while filling empty main_diags (2026-06-14). **None are in Neurosurgery.**

| Stored code | Stored name | Correct per ICD-11 | Suggested fix |
|---|---|---|---|
| `DC31.0` | rupture or perforation of oesophagus | `DC31.0` = Acute idiopathic pancreatitis | oesophageal perforation ≈ `DA2Y`/`DA2Z` range — verify |
| `DC31.1` | chronic pancreatitis | `DC31.1` = Acute alcohol-induced pancreatitis | chronic pancreatitis = `DC32` — verify |
| `JA00.0` | ectopic pregnancy | `JA00.0` = Spontaneous abortion | ectopic pregnancy = `JA01` — verify |
| `JA40.0` | placenta praevia | `JA40.0` = Threatened abortion | placenta praevia = `JA42`/`JB05` range — verify |
| `2C73.2` | carcinoma of ovary (generic) | `2C73.2` = Granulosa cell malignant tumour of ovary | use generic `2C73` or specific subtype (`2C73.03` high-grade serous) — minor specificity mismatch |

> Note: the whole `DC31` branch is **acute pancreatitis** in ICD-11; chronic pancreatitis is `DC32`.

## Additional mismaps discovered later (NOT yet fixed)

Found incidentally while strengthening thin main_diags. None in Neurosurgery. These suggest a full audit of all original ICD-11 codes would be worthwhile.

| Stored code | Stored name | Correct per ICD-11 | Suggested fix |
|---|---|---|---|
| `DC10.2` | gallbladder polyp | `DC10.2` = Fistula of gallbladder or bile duct | gallbladder polyp ≈ `2E92.6`/`DC12` range — verify |

## Full audit 2026-06-15 (all 482 codes scanned by chapter consistency)

**CONFIRMED mismapped (web-verified this session):**
| Stored code | Stored name | ICD-11 says this code is | Correct code for the name |
|---|---|---|---|
| `BA41.0` | carotid artery stenosis | Acute STEMI | carotid stenosis ≈ `BD5x`/`8B22` — verify |
| `BD10.0` | peripheral arterial occlusive disease | Congestive heart failure (BD10) | PAD = `BD4Z`/`BD40` family |
| `BD10.1` | critical limb ischaemia | (child of BD10 = CHF) | `BD4x` |
| `BD10.2` | renal artery stenosis | (child of BD10 = CHF) | verify |
| `BD10.3` | mesenteric artery ischaemia | (child of BD10 = CHF) | verify |
| `BD10.4` | subclavian artery stenosis | (child of BD10 = CHF) | verify |
| `BD11.0` | acute limb ischaemia | Left ventricular failure (BD11 = HF) | `BD42`/`BD4x` |

**STRONGLY SUSPECTED (chapter mismatch; pending web verification):**
ENT ear on respiratory(CA) codes: `CA09.0` otitis media, `CA22.0` otosclerosis (CA22=COPD), `CA23.0` CSOM, `CA23.2` cholesteatoma, `CA24.0` TM perforation, `CA30.0` hearing loss, `CA43.0` BPPV, `CA44.0` Meniere.
ENT nose/throat on `AA` codes: `AA05.0` epistaxis, `AA12.0/.1/.3` rhinosinusitis/polyp, `AA40.0/.2` tonsillitis/abscess.
GI/onc: `2A10.0` colorectal adenoca (colon=2B90/91), `2C71.0` thyroid carcinoma (thyroid=2D10), `DA22.0` achalasia (DA22=GORD), `DA24.0` diaphragmatic hernia (DA24=oesophagitis), `DC94.0` acute pancreatitis & `DC94.1` chronic pancreatitis (pancreatitis=DC31/DC32).
Other: `FA82.0` fracture of clavicle (FA82=spinal stenosis), `LB70.0` lipoma (LB70=cranium anomaly), `1B10.Z`/`1B41.Z` cardiac-on-infection codes.

> None of the above are in Neurosurgery.

### Resolution
**FIXED 2026-06-15** by migration `1750000000026-FixAuditedMismapsBatch1` (20 clean 1:1 recodes, verified):
CA09.0→AB00, CA22.0→AB33, CA23.0→AA91.Z, CA23.2→AB12, CA24.0→AB13, CA30.0→AB51.1,
CA43.0→AB31.2, CA44.0→AB31.0, AA05.0→MD20, AA12.0→CA01, AA12.1→CA0A.Z, AA12.3→CA0J,
AA40.0→CA03, AA40.2→CA0K.1, 2A10.0→2B90, 2C71.0→2D10, DA22.0→DA21.0, DA24.0→DD50.0,
LB70.0→2E80.0, FA82.0→NC12.0.

### RESOLVED 2026-06-15 — Audit Batch 2 (migrations `1750000000035`, `1750000000036`)
14 mismaps found by systematic code/name cross-check across all non-NS departments (verified via findacode.com ICD-11 MMS):
- `BD11.Z` (CTS) — BD11.Z = Left ventricular failure, not generic heart failure. Fixed: renamed name only.
- `2C20.0` (SOC) — 2C20.0 = Adenocarcinoma of nasal cavity, not NHL. Fixed: → `2A81.Z` (DLBCL NOS).
- `2C20.3` (ENT) — 2C20.3 = Olfactory neuroblastoma, not laryngeal carcinoma. Fixed: → `2C23.Z`.
- `2C20.4` (ENT) — 2C20.4 = SCC of nasal cavity, not nasopharyngeal carcinoma. Fixed: → `2B6B.1`.
- `9A70.0` (OPHTHAL) — 9A70.0 = Endothelial corneal dystrophy (Fuchs), not amblyopia. Fixed: renamed + removed from strabismus main_diag.
- `9A71.0` (OPHTHAL) — 9A71.0 = anterior-segment code, not exotropia. Fixed: → `9C80.1`.
- `9A71.1` (OPHTHAL) — 9A71.1 = anterior-segment code, not esotropia. Fixed: → `9C80.0`.
- `DC10.0` (HBP) — DC10.0 = Obstruction of gallbladder/bile ducts, not cholelithiasis. Fixed: → `DC11.Z`.
- `DC10.2` (HBP) — DC10.2 = Fistula of gallbladder, not gallbladder polyp (off by one digit). Fixed: → `DC10.3`.
- `DC11.0` (HBP) — name "acute cholecystitis" wrong; DC11.0 = calculus WITH acute cholecystitis. Fixed: renamed.
- `DC12.0` (HBP) — DC12.0 = Acute cholecystitis, not acute cholangitis. Fixed: → `DC13.0`.
- `DC13.1` (HBP) — DC13.1 = cholangitis subtype, not PSC. Fixed: → `DB96.2Z`.
- `DC91.0` (GS) — DC91 does not exist in ICD-11; correct code = DC11.0. Fixed: relinked GS to DC11.0, deleted DC91.0.
- `DC91.2` (GS) — same DC91 issue; correct = DC11.3. Fixed: inserted DC11.3, relinked GS, deleted DC91.2.

**Still open:**
- ~~`BD10.4` subclavian artery stenosis, `BA41.0` carotid artery stenosis~~ — ✅ RESOLVED in migration `1750000000085` (VASC dept-audit, 2026-06-20). See section below.
- ~~Amblyopia: needs its own correct ICD-11 code added to the OPHTHAL strabismus category; code not confirmed.~~ — ✅ RESOLVED 2026-06-27 (OPHTHAL dept-audit, migration `1750000000141`): amblyopia = **`9D46`** (Impairment of binocular functions), added to the strabismus category.

### RESOLVED 2026-06-27 — OPHTHAL full dept-audit (migrations `1750000000139`–`1750000000144`)
OPHTHAL reference data was **~64% corrupt** (15/28 ICD codes wrong + 3 parent→leaf). The seed used a fabricated `9A00/9A20/9A30/9A40/9A50/9A81/9B11/9B20/9B40/9B41` scheme not matching WHO ICD-11. Migration 139 fixed all 18 (14 in-place recodes + 3 parent→leaf + 1 cross-dept MERGE: diabetic retinopathy `9A50.0`→existing TRS `9B71.0Z`). Key recodes: glaucoma→`9C61`, conjunctiva→`9A60/9A61`, corneal ulcer→`9A76`, retinal vascular→`9B74`, retinal detachment→`9B73`, vitreous→`9B83`, thyroid orbitopathy→`9C82.3`, retinoblastoma→`2D02.2`. No new cross-dept mismaps found. ✅ **100 diagnoses, 105 proc_cpts — all verified, all embedded. Audit complete.**

### RESOLVED 2026-06-15 — thin-strengthening pass (migrations `1750000000029`, `1750000000034`)
Two mismaps found incidentally during thin-strengthening:
- `9A60.0` (OPHTHAL macular degeneration) — 9A60 = Conjunctivitis, not AMD.
  Fixed → `9B75.0` (age-related macular degeneration) in migration 029.
- `BD41.0` (VASC arteriovenous fistula) — BD41.0 = Arterial fibromuscular dysplasia.
  Fixed → `BD52.1` (arteriovenous fistula, acquired) in migration 034.
  BD41.0 then added as a new entry (arterial fibromuscular dysplasia) to VASC renal artery disease.

### RESOLVED 2026-06-15 — cardiovascular remodel (migration `1750000000027`)
Fixed: BD10.0→BD40.Z, BD10.1→BD4Z, BD10.2→BD40.2, BD10.3→BD40.Y, BD11.0→BD30.2,
BD40.0→BD50.Z, BD40.1→BD50.3, BD50.0(varicose)→BD74.1, BD42.1→BD50.0.
Merged duplicates: DC94.0→DC31.Z, DC94.1→DC32 (deleted, links repointed).
**Still left as-is (no distinct ICD-11 stenosis leaf — need site extension codes):**
~~`BD10.4` subclavian artery stenosis, `BA41.0` carotid artery stenosis.~~ → ✅ RESOLVED 2026-06-20 (migration 085): `BA41.0`→`BD55` (asymptomatic stenosis of intra/extracranial artery, WHO syn. "stenosis of carotid artery NOS"); `BD10.4`→`8B22.A` (subclavian steal syndrome, WHO syn. "subclavian artery stenosis").

### RESOLVED 2026-06-23 — PEDSURG full ICD-11 audit (migration `1750000000092`)
PEDSURG reference data was the most corrupted yet (18/24 codes wrong, ~75%): surgical conditions scattered into developmental `LA9x`/`LB1x` chapters, tumours in disease chapters, and a duodenal-atresia↔pyloric-stenosis↔Meckel↔annular-pancreas code tangle. 18 fixed in migration 092 (see `MEDICAL_CODE_AUDITS/PEDSURG/AUDIT_PEDSURG.md` for the full table). Highlights:
- Chapter fixes: appendicitis `LA50.0`→`DB10.0`, CDH `KB20.0`→`LB00.0`, intussusception `LA95.0`→`DA91.0`, inguinal hernia `LA91.0`→`DD51`, umbilical hernia `LA92.0`→`DD53`, NEC `LB22.00`→`KB88.Z`, exomphalos `LB19.0`→`LB01`.
- Tumours out of disease chapters: Wilms `GB82.0`→`2C90.Y`, neuroblastoma (raw morphology) `XH4MH9`→`2D11.2`.
- Duodenal/pyloric tangle: pyloric `LB11.0`→`LB13.0`; Hirschsprung `LB14.0`→`LB16.1`; Meckel `LB21.0`→GS-owned `LB15.0`; deleted the duplicate "duodenal atresia"-as-`LB13.0` row and kept the concept on `LB14`.
- Cross-dept MERGEs into existing shared rows: fournier→PRS `1B71.1`; intussusception/inguinal/umbilical/Meckel → GS `DA91.0`/`DD51`/`DD53`/`LB15.0`.
**None still open for PEDSURG** — all 24 codes verified via `icd11_search`; all 100 final diagnoses verified.

### RESOLVED 2026-06-20 — VASC full ICD-11 audit (migration `1750000000085`)
VASC reference data was heavily corrupted (17/28 codes wrong — fabricated sequential `BA80.x`/`BD53.x` blocks + cross-concept mis-assignments). 18 codes fixed in migration 085 (see `MEDICAL_CODE_AUDITS/VASC/AUDIT_VASC.md` for the full table). Highlights:
- The 2 long-open codes: `BA41.0`→`BD55`, `BD10.4`→`8B22.A`.
- Cross-dept shared-row fixes: `GB60.0`(ESRD, was "acute kidney failure st.1")→`GB61.5` corrects **TRS+UROL+VASC**; `BD50.Z`(aortic root)→`BD50.3Y&XA01A6` corrects **CTS+VASC**.
- `BD51.0`(DVT, was carotid-aneurysm code)→`BD71.4`; `BD52.0`(chronic venous insufficiency, was in arterial block)→`BD74.Z`; `BD53.0`(lymphoedema)→`BD93.Z`; `BD53.1`(gangrene)→merged into shared `MC85`.
- Note: some earlier-resolved cardiovascular-remodel targets (e.g. `BD50.Z`, `BD50.3`, `BD74.1`) were themselves imprecise and were further corrected here.

### (historical) cardiovascular cluster — now resolved above
This section is tangled: multiple mismapped names compete for the same/adjacent codes, so
blind recoding would create new collisions or imprecise codes. Needs deliberate redesign:
| Stored code | Stored name | Issue |
|---|---|---|
| `BA41.0` | carotid artery stenosis | BA41.0 = STEMI; carotid stenosis has no clean leaf (cerebrovascular `8B22` grouping) |
| `BD10.0` | peripheral arterial occlusive disease | BD10 = congestive heart failure; PAD = `BD40`/`BD4Z` (but `BD40.0` is occupied below) |
| `BD10.1` | critical limb ischaemia | child of BD10 (CHF) |
| `BD10.2` | renal artery stenosis | should be `BD40.2` |
| `BD10.3` | mesenteric artery ischaemia | child of BD10 (CHF) |
| `BD10.4` | subclavian artery stenosis | child of BD10 (CHF); no clean leaf |
| `BD11.0` | acute limb ischaemia | BD11 = heart failure; acute limb ischaemia = `BD30.2` |
| `BD40.0` | aneurysm of aortic root | BD40.0 = lower limb atherosclerosis; aortic root aneurysm ≈ `BA80`/`BD50` |
| `BD40.1` | thoracic aortic aneurysm | BD40.1 = atherosclerosis of aorta; TAA ≈ `BD50.x` |
| `BD42.1` | dissection of thoracic aorta | BD42 = Raynaud phenomenon; dissection = `BD50.x` |
| `BD50.0` | varicose veins of lower extremity | BD50 = aortic aneurysm/dissection; varicose veins = `BD7x` |

### RESOLVED 2026-06-19 — ORTHO dept audit (migrations `1750000000070`–`1750000000071`)
Full ICD-11 audit of all 32 original ORTHO diagnoses (see `MEDICAL_CODE_AUDITS/ORTHO/AUDIT_ORTHO.md`). The dominant error: traumatic fractures/dislocations coded in the **FB\*** (musculoskeletal *disease*) chapter instead of the **N\*** (injury) chapter. 19 codes fixed + 1 leaf refinement (migration 070); 3 mis-coded duplicate rows merged into correctly-coded NS rows (migration 071). Key examples:
- `NC72.0` "meniscal tear" → was a femur-fracture code → `NC93.3Z` (tear of meniscus).
- `LA91.1` "osteomyelitis" → was a developmental-anomaly code → `FB84.Z`.
- `NC90.0`/`NC90.1` osteoarthritis knee/hip → were injury codes → `FA01.Z`/`FA00.Z`.
- `FA71.0` rotator cuff tear → `NC16.0Y` (FB53.1 was already used for rotator cuff syndrome).
- `FA30.0` "lumbar disc herniation" → merged into NS `FA80.9`; `FA30.0` (= acquired hallux valgus in ICD-11) reused for that condition.

**None still open for ORTHO** — all ICD-11 codes verified via `icd11_search`.

### RESOLVED 2026-06-20 — PRS dept audit (migration `1750000000078`)
Full ICD-11 audit of all 30 original PRS diagnoses (see `MEDICAL_CODE_AUDITS/PRS/AUDIT_PRS.md`). The dominant error: injuries/tumours/ulcers coded in the **skin-disease `E*`** or **developmental `L*`** chapters instead of the correct injury (`N*`), neoplasm (`2C*`) or other chapters. 18 codes fixed + 3 parent→leaf refinements. Key examples:
- Burns `EJ40.0/.1/.2` (skin chapter) → ICD-11 burn-depth ladder `ND92.1/.2/.3`; frostbite `EJ50.0` → `NE41`.
- Cleft `ED00.0/.1` → `LA42.Z`/`LA40.Z`; syndactyly/polydactyly `EH61.0`/`EH63.0` → `LB79.Z`/`LB78.Z`.
- Keloid/hypertrophic scar `ED91.0/.1` → `EE60.0Z`/`EE60.1`; pressure ulcer `EK90.0` → `EH90.Z`; diabetic foot `LA70.0` → `BD54`.
- Skin cancers coded in benign range: BCC `2F31.0` → `2C32.Z`, SCC `2F33.0` → `2C31.Z`; epidermoid cyst `LB20.0` → `EK70.0Z`.

**Two of the fixes corrected rows shared with other (already-"complete") departments:**
- `NA14.0` "brachial plexus injury" (shared with **NS**) → `NA41.Z`. NA14.0 was an intracranial-injury code; the shared row is now correct for NS too.
- `LB20.0` "epidermoid cyst" (shared with **PEDSURG**) → `EK70.0Z`. The shared row is now correct for PEDSURG too.

**Newly noticed NS mismaps (NOT fixed — out of PRS scope, flag for NS re-review):**
- `2F7C` (NS) is named "hemangioblangioma/hemangioblastoma" but 2F7C = *Neoplasms of uncertain behaviour of connective/soft tissue*.
- `2F7Z` (NS) is named "epidermoid and dermoid tumors" but 2F7Z = *Neoplasms of uncertain behaviour of unspecified site*.
  Because both were occupied, PRS "giant cell tumour of soft tissue" (`2B72.0`, wrong) was repurposed to the free `2C35` "Cutaneous sarcoma" instead of the ideal soft-parts GCT code.

**None still open for PRS** — all 100 ICD-11 codes verified via `icd11_search`.

### RESOLVED 2026-06-23 — HBP full ICD-11 audit (migration `1750000000098`)
Full ICD-11 audit of all 27 original HBP diagnoses (see `MEDICAL_CODE_AUDITS/HBP/AUDIT_HBP.md`). HBP reference data was ~52% corrupt (14/27 codes wrong) — the seed used **fabricated sequential codes in the DA9x/DB0x/DC0x/DC1x ranges** and put portal hypertension in the metabolic chapter. 14 codes fixed in migration 098 (8 in-place recodes + 6 collision-aware MERGEs into existing GS rows + 1 parent→leaf merge), 1 orphan removed. Highlights:
- Fabricated/wrong liver codes: hepatic haemangioma `DA95.0`→`2E81.0Y`, FNH `DA96.0`→`DB99.Y`, HCC `DA92.0`→`2C12.02`, intrahepatic cholangiocarcinoma `DA9B.0`→`2C12.10`, liver metastases `DA93.Z`→`2D80.0`.
- Wrong chapter: portal hypertension `5C81.0` (metabolic) → `DB98.7Z`; biliary stricture `DC15.0`→`DC10.02`; exocrine pancreatic carcinoma `DB00.0`→`2C10.Z`; IPMN `DB01.1`→`2E92.8`.
- Cross-dept MERGEs into existing shared rows: hydatid `DA97.0`→GS `1F73.0`; pseudocyst `DB01.0`→GS `DC30.1`; liver abscess `DC00.0`→GS `DB90.0`; acute cholangitis `DC13.0`→GS `DC13`; choledocholithiasis `DC14.1`→GS `DC11.6`; oesophageal varices `DA26.0`→GS `DA26.0Z`.
- **HCC `DA92.0`→`2C12.02` is a cross-dept merge** correcting the shared row for **HBP + SOC** (both link "hepatocellular carcinoma").
- Orphan removed: `DA20.3` "rupture or perforation of oesophagus" — out of HBP scope (foregut/thoracic emergency, originally seeded as `DC31.0`).

**Newly discovered MFS oral-cancer mismap (NOT fixed — out of HBP scope, flag for an MFS audit):**
The seed used three pancreas/liver oncology codes as MFS "oral cancer" rows (migrations 002/004/005/007):
- `2C10.0` is named/used for oral SCC but `2C10.0` = **Adenocarcinoma of pancreas** (GS later reused this same row for "pancreatic adenocarcinoma" → the row is now ambiguous MFS+GS).
- `2C10.1` is used for oral cancer but `2C10.1` = **Neuroendocrine neoplasms of pancreas**.
- `2C12.0` is used for oral cancer but `2C12.0x` = **Malignant neoplasms of liver** (HCC/cholangio family).
HBP deliberately avoided these by using `2C10.Z` (exocrine carcinoma) and postcoordinated histology codes (`2C10.0&XH3PG9` acinar, `2C10.1&XH8DS0`/`&XH0U20` NET/NEC, `2C10.0&XH7CY5` mixed) for its pancreatic neoplasms.

**None still open for HBP** — all 100 final diagnoses verified via `icd11_search`; all 75 HBP-specific CPTs AAPC-verified (the deleted code 47802 was identified and excluded).

### RESOLVED 2026-06-23 — SOC full ICD-11 audit (migration `1750000000104`)
Full ICD-11 audit of all 26 original SOC (Surgical Oncology) diagnoses (see `MEDICAL_CODE_AUDITS/SOC/AUDIT_SOC.md`). SOC reference data was ~62% corrupt (13/26 wrong + 3 approximate) — the seed mapped concepts onto the **wrong chapter blocks**: `2B60`=lip, `2B91`=rectosigmoid, `2B5C`≠stomach, `2C90`=kidney, `2C73`=ovary, `2C77`=**cervix uteri**(!), `2C80`/`2C8x`=male genital, `2C6Y`=breast, `2D42`=ill-defined sites. 16 codes changed in migration 104 (10 in-place recodes + 6 collision-aware MERGEs into GS/PRS/HBP shared rows). Highlights:
- Wrong block: colon `2B91.1`→`2B90.Z`, rectum `2B91.2`→`2B92.Z`, anal `2C20.2`→`2C00.Z`, small-intestine NET `2F73.0`→`2B80.21`, adrenocortical ca `2C73.1`→`2D11.Z`, retroperitoneal sarcoma `2C6Y.0`→`2B5F.1Z`, soft-tissue sarcoma `2C80.0`→`2B5F.2`, desmoid `2C80.1`→`2F9C`, classical HL `2B30.1`→`2B30.1Z`.
- **Cross-dept fix:** urothelial bladder `2C90.0`(=renal cell carcinoma code)→`2C94.2` — the row is shared **SOC+UROL**, so this corrects UROL's bladder-cancer row too.
- Cross-dept MERGEs into existing shared rows: stomach `2B5C.0`→GS `2B72.Z`; oesophagus `2B60.0`→GS `2B70.Z`; melanoma `2C77.0`→PRS `2C30.Z`; peritoneal carcinomatosis `2C90.3`→HBP `2D91`; BCC `2C32`→PRS `2C32.Z`; SCC of skin `2D42.0`→PRS `2C31.Z`.

**Newly discovered cross-dept mismaps (NOT fixed — out of SOC scope, flag for the owning depts' audits):**
- **MFS oral/H&N cancers on pancreatic/biliary codes** (extends the HBP-audit finding): `2C10.0`(=Adenocarcinoma of pancreas) labelled "squamous cell carcinoma of oral cavity" (shared **MFS+GS**); `2C10.1`(=Pancreatic NET) labelled "carcinoma of lip" (**MFS**); `2C13.0`(=Adenocarcinoma of gallbladder) labelled "carcinoma of salivary gland" (shared **HBP+MFS**). SOC avoided all three by using `2C10.Y`/`2C13.Z` and free codes.
- **GS:** `2B90.Y`(=Adenocarcinoma of colon) labelled "Lynch syndrome". SOC used `2B91.Z` (rectosigmoid) instead.
- **OBGYN:** `2C76.0`(=Endometrial endometrioid adenocarcinoma) labelled "carcinoma of uterine cervix". SOC used `2C76.3` (endometrial serous) and the correct cervix code `2C77.0`.
- **NS `2F7C`** (still open from PRS audit): occupied by NS's mislabelled "hemangioblastoma", so SOC desmoid used `2F9C` rather than the ideal `2F7C`.

**None still open for SOC** — all 100 final diagnoses verified via `icd11_search`; all 101 SOC oncology CPTs AAPC-verified current (none deleted).

### RESOLVED 2026-06-24 — MFS full ICD-11 audit (migration `1750000000111`)
Full ICD-11 audit of all 21 original MFS (Maxillofacial Surgery) diagnoses (see `MEDICAL_CODE_AUDITS/MFS/AUDIT_MFS.md`). MFS was the **most corrupt department yet (~86%, 18/21 wrong)**: facial fractures were mis-chaptered into the `DA0x` dental-disease chapter (belong in `NA02.x` injury), `DA4x` cyst/tumour codes were fabricated, cleft was mis-coded, TMJ/Ludwig/condylar mis-coded, and the four oncology codes were the long-flagged **MFS oral-cancer mismap**. 18 codes fixed in migration 111. Highlights:
- Fracture chapter fixes: nasal `DA0G.0`→`NA02.3`, zygomatic `DA0F.1`→`NA02.5`, orbital floor `DA0F.2`→`NA02.21`, maxilla(Le Fort) `DA0E.0`→`NA02.4Z`, mandible `DA0F.0`→`NA02.7Z`.
- Cyst/tumour: ameloblastoma `DA4A.0`→`2E83.1`, periapical `DA4C.0`→`DA09.8`, pleomorphic adenoma `DA50.0`→`2E91.0`.
- Concept fixes: Ludwig `DA12.0`→`DA01.30`, condylar hyperplasia `LA2A.0`→`DA0E.0Y&XA51B7`, TMJ `DA0K.0`→`DA0E.8`.
- Cleft MERGEs into PRS shared rows: `DA03.0`→`LA40.Z`, `DA03.1`→`LA42.Z`; dentigerous `DA4B.0` merged into `DA05.0`.

**The MFS oral-cancer mismap (open since the HBP audit, expanded by the SOC audit) is now RESOLVED:**
- `2C10.1` "carcinoma of lip" → `2B60.Z` (MFS-only recode); `2C12.0` "carcinoma of tongue" → `2B62.Z` (MFS-only recode).
- **`2C10.0` (shared GS) and `2C13.0` (shared HBP)** were *renamed in place* to their **correct meaning** — `2C10.0`→"adenocarcinoma of pancreas" (**fixes GS**), `2C13.0`→"adenocarcinoma of the gallbladder" (**fixes HBP**) — and MFS was unlinked and relinked to the proper oral/salivary cancer codes (SOC `2B66.0` SCC of mouth, `2B68.Z` salivary malignancy). This is a cross-dept MERGE benefiting GS + HBP, analogous to the VASC ESRD and HBP HCC fixes.

**None still open for MFS** — all 100 final diagnoses verified via `icd11_search`; all 104 oral/maxillofacial CPTs AAPC-verified current (the deleted code 21310 was identified and excluded). With this, the MFS/GS/OBGYN mismaps flagged during the SOC audit: MFS oral-cancer ✅ resolved; **GS `2B90.Y`="Lynch syndrome" and OBGYN `2C76.0`="cervix" remain open** for those depts' audits.

### RESOLVED 2026-06-27 — TRS full ICD-11 audit (migration `1750000000117`)
Full ICD-11 audit of all 20 original TRS (Transplant Surgery) diagnoses (see `MEDICAL_CODE_AUDITS/TRS/AUDIT_TRS.md`). TRS reference data was **~80% corrupt (15/20 wrong — second-worst after MFS)**: liver disease in the metabolic chapter (`5C56.x`/`5C81.3`), fabricated digestive code (`DA92.1`), developmental-chapter PBC (`LB41.1`), fabricated rejection/complication subdivisions (`NE84.0/.1`, `NE80.0`, `NE81.0`, `NE85.0`), and CKD-stage codes mislabelled as nephropathy types (`GB60.1`=CKD st.1 area, `GB61.0`=CKD stage 1, `GB62.0`, `GB63.0`). 15 codes fixed in migration 117 (3 collision-aware MERGEs + 12 in-place recodes). Highlights:
- MERGEs into existing rows: ESLD `5C56.0`→`DB93.1` (hepatic cirrhosis), PBC `LB41.1`→`DB96.1Z`, hepatic vein thrombosis `5C81.3`→`DB98.5` (Budd-Chiari).
- Recodes: HBV/HCV cirrhosis `5C56.1/.2`→`DB93.1/1E51.0Z`/`DB93.1/1E51.1`; hepatic failure `DA92.1`→`DB99.7`; acute/chronic rejection `NE84.0/.1`→`NE84&XT5R`/`NE84&XT8W`; diabetic nephropathy `GB60.1`→`GB61.Z`; hypertensive nephropathy `GB61.0`→`BA02`; IgA nephropathy `GB62.0`→`GB4Y`; primary non-function `NE80.0`→`NE84`; PTLD `NE81.0`→`2B32.Z`; infection in recipient `NE85.0`→`1H0Z`.
- **Cross-dept fix:** PKD `GB63.0`→`GB81` (autosomal dominant PKD) corrects the row shared by **TRS+UROL**.

**Newly discovered mismap (NOT fixed — out of TRS scope, flag for a respiratory/pulmonary pass):**
- **`CA22.Z`** is labelled **"lung abscess - unspecified"** in the shared DB, but `CA22.Z` = *Chronic obstructive pulmonary disease, unspecified*. Because the leaf was occupied, TRS's COPD row was left on the valid parent `CA22` rather than refined to `CA22.Z`. (Likely a CTS/ENT/respiratory seed row — `CA22` family is COPD, lung abscess belongs in `CA43`/`CB1x`.)

**None still open for TRS** — all 20 original codes verified via `icd11_search`; all 100 transplant CPTs AAPC-verified current (ERCP 43260-43274, angioplasty/stent 37246/37236, the 2016 percutaneous-biliary 47531-47544 family and the 2023 anterior-abdominal-hernia 49591-49622 family confirmed active). BK polyomavirus nephropathy uses `GC2Z&XA6KU8` (Disease of kidney NEC) as the best-available home (no dedicated BK code exists).

### RESOLVED 2026-06-27 — OBGYN full ICD-11 audit (migration `1750000000124`)
Full ICD-11 audit of all 23 original OBGYN (Obstetrics & Gynaecology) diagnoses (see `MEDICAL_CODE_AUDITS/OBGYN/AUDIT_OBGYN.md`). OBGYN reference data was **~78% corrupt (15/23 wrong + 3 approximate)** — gynae conditions scattered into the wrong chapter blocks (leiomyoma in the GA10 endometriosis block, PCOS outside the 5A80 endocrine block, ovarian cyst/torsion/PID/prolapse/fistula mis-coded) and an obstetric tangle (pre-eclampsia/eclampsia swapped, PPH on a preterm-labour code, uterine rupture on a puerperal-sepsis code). 18 in-place recodes in migration 124 (all OBGYN-only, no cross-dept impact). Highlights:
- **Cervix mismap resolved** (open since the SOC audit): `2C76.0` (= corpus uteri / endometrial endometrioid adenocarcinoma) labelled "carcinoma of uterine cervix" → `2C77.Z` (cervix). The endometrial-cancer row `2C76.1` → `2C76.Z`.
- Gynae chapter fixes: leiomyoma `GA10.0`→`2E86.0`, adenomyosis `GA12.0`→`GA11`, PCOS `GA15.4`→`5A80.1`, ovarian cyst `GA15.0`→`GA18.6`, ovarian torsion `GA15.3`→`GA18.5`, PID `JA84.0`→`GA05.Z`, uterovaginal prolapse `GA30.0`→`GC40.3Z`, VVF `GA30.2`→`GC04.10`.
- Obstetric fixes: abruptio `JA41.0`→`JA8C.Z`; pre-eclampsia `JA22.0`→`JA24.Z`; eclampsia `JA24.0`→`JA25.3` (JA24.0 is actually *mild-moderate pre-eclampsia*); uterine rupture `JB40.0`→`JB0A.1`; PPH `JB00.0`→`JA43.Z` (JB00.0 is actually *preterm labour*); ectopic `JA01`→`JA01.Z`.
- Three freed codes were re-used to their correct WHO meaning as new diagnoses: `GA15.0`→polyp of cervix, `JB40.0`→puerperal sepsis, `JB00.0`→preterm labour.

**None still open for OBGYN** — all 23 original codes verified via `icd11_search`; all 100 OBGYN CPTs AAPC-verified current (the deleted code 58823 pelvic-abscess-drainage was identified and replaced with 58820). With the OBGYN cervix mismap resolved, the **only remaining open cross-dept mismap is GS `2B90.Y`="Lynch syndrome"** (a colon-adenocarcinoma code), for a future GS pass.

### RESOLVED 2026-06-27 — ENT full ICD-11 audit (migration `1750000000132`)
Full ICD-11 audit of all 29 original ENT (Otolaryngology) diagnoses (see `MEDICAL_CODE_AUDITS/ENT/AUDIT_ENT.md`). ENT was the **least-corrupted department audited (~14%, 4/29 wrong + 4 approximate)** — most of its original seed mismaps had already been corrected by migrations 026/035, so only residual errors remained. 8 code fixes in migration 132. Highlights:
- **2 cross-dept MERGEs** (removed redundant ENT-only rows): parotid gland calculus `DA50.2` → `DA04.4` (Sialolithiasis, MFS-owned); branchial cyst `DA50.3` → `DA05.Y` (Branchial cleft cyst, PEDSURG-owned). Both `DA50.x` were arbitrary salivary codes; the conditions already existed under correct codes.
- Chapter/leaf fixes: deviated septum `CA01.0` (= acute sinusitis child) → `CA0D`; **obstructive sleep apnoea `CA62.0` → `7A41`** (OSA was relocated to chapter 7 sleep-wake disorders in ICD-11, out of the respiratory chapter); sudden SNHL `AB51.1` (= acquired SNHL) → `AB55` (sudden idiopathic); parent→leaf `CA0J`→`CA0J.Z`, `AB13`→`AB13.Z`, `CA03`→`CA03.Z`.
- Name/encoding repairs (code already correct): `AB31.0` EN "MeniÃ¨re disease" mojibake → "Meniere disease"; `AB12` Arabic cholesteatoma term; `CA0H.1` Arabic (was "papilloma", fixed to "polyp").

**None still open for ENT** — no new cross-dept mismaps were discovered (the earlier 026/035 ENT fixes held). All 102 ENT diagnoses verified via `icd11_search`; all 105 ENT CPTs AAPC-verified current (none deleted). The **only remaining open cross-dept mismap project-wide is GS `2B90.Y`="Lynch syndrome"** (plus the `CA22.Z`="lung abscess"/COPD mislabel flagged during the TRS audit, for a respiratory/CTS pass).

