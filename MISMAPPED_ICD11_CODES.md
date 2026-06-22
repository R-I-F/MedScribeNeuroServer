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
- Amblyopia: 9A70.0 was renamed (9A70.0 = Fuchs dystrophy). Amblyopia needs its own correct ICD-11 code added to the OPHTHAL strabismus category; code not confirmed in this session.

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

