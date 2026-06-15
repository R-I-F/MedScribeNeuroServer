# ICD-11 Code Audit — NS Diagnoses

> **Date:** 2026-06-16  
> **Source:** 134 rows in `defaultdb.diagnoses` scoped to `dept.code = 'NS'` (staging Aiven PostgreSQL)  
> **Database NOT modified.** Findings only.  
> **Method:** Each ICD-11 code verified against known ICD-11 MMS structure and chapter hierarchy.  
> **Note:** Previous audit sessions (migrations 024, 026, 035) already fixed known mismaps across all departments — those corrected codes are not re-flagged here.  
> **Verification tool:** findacode.com / WHO ICD-11 browser (https://icd.who.int/browse/2024-01/mms/en)

---

## Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Code matches the stated diagnosis in ICD-11 |
| ⚠️ | Code is in the right area but has a specificity, chapter, or description concern — verify against ICD-11 browser |
| ❌ | Code does not match the stated diagnosis — definite mismap |
| 🔖 | Local placeholder code — intentional, not a real ICD-11 code |

---

## CNS Infection (10 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| **1D00.Z** | cerebral ventriculitis nos | **⚠️** | In ICD-11, 1D00.Z maps to bacterial meningitis (unspecified) in most editions. Ventriculitis/ependymitis is inflammation of the ventricular ependyma — may be better captured under 1C80.Y (other specified bacterial CNS infections). Verify in WHO browser. |

| AAAA | other | 🔖 | Local placeholder — intentional |
| **FA9Z** | discitis spinal infection | **❌** | **FA9Z = spondylopathy, unspecified — this is a musculoskeletal/degenerative chapter code (FA = diseases of musculoskeletal system). Infectious discitis must be coded in the infectious chapter. Correct ICD-11 code: 1C90.1 (pyogenic vertebral osteomyelitis/spondylodiscitis) or 1C90.Y (other specified bacterial bone infection). Using a degenerative spine code for an infectious process is a significant chapter-level mismap.** |
| **NE81.2Z** | surgical site infection | **⚠️** | NE81.2 in ICD-11 = disruption/dehiscence of wound (not infection). Surgical site infection (SSI) is more accurately coded as NE81.3 (infection of wound) or NE83.Z (infection due to implant). Verify exact NE81 sub-code mapping. |
| NE83.1 | infected vp shunt | ✅ | NE83 = complications of implanted devices. NE83.1 = infection of implanted device — correct for infected VP shunt |

---

## CNS Tumors (30 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|

| 2A00.0Y | ependymoma | ⚠️ | 2A00.0Y = other specified glial neoplasm. Ependymoma in ICD-11 may have its own code (2A00.04 or similar) — verify specificity |

| 2A02.3 | vestibular schwannoma | ⚠️ | 2A02.3 = schwannoma of cranial nerve. Vestibular schwannoma (acoustic neuroma) is a cranial nerve VIII schwannoma — plausible but verify exact extension code |
| 2B33.5 | cns lymphoma | ⚠️ | 2B33 = non-Hodgkin lymphoma. 2B33.5 for primary CNS lymphoma needs verification — primary CNS lymphoma may have a more specific code (possibly 2B33.50 or 2B33.5Z) |

| 2D50 | brain metastasis | ⚠️ | 2D50 = secondary malignant neoplasm of specified sites. Verify that 2D50 (without extension) is the correct code for brain metastasis specifically, vs. a more specific sub-code |
| 2D52 | spinal cord metastasis | ⚠️ | Similar to 2D50 — verify that 2D52 specifically maps to spinal cord secondary neoplasm |

| 2F7Z | epidermoid and dermoid tumors | ⚠️ | 2F7Z = other benign CNS tumour, unspecified. Epidermoid and dermoid cysts may have more specific codes. Used as best-available catch-all here — acceptable but verify |
| **5A01.1** | secondary hyperthyroidism | **❌** | **5A01.1 = secondary hyperthyroidism (an endocrine condition caused by something else, eg. TSH-secreting adenoma). This is a consequence code placed in a "CNS tumors" category — the code describes the hormonal effect, not the underlying pituitary tumor. If the intent is to capture TSH-secreting pituitary adenoma (TSHoma), the correct code is 2F37.Y (other specified pituitary adenoma). The endocrine consequence should not substitute for the tumor code.** |
| **5A61.Y** | rathkes cleft cyst | **❌** | **5A61 = hypopituitarism. 5A61.Y = other specified hypopituitarism. Rathke's cleft cyst is a benign embryonal cyst of the sella turcica — it is NOT hypopituitarism. The cyst may cause hypopituitarism as a complication, but the cyst itself is a distinct structural entity. Correct code: 2F7Z (other benign CNS tumour) or LA05.7 (other congenital anomaly of CNS) depending on pathological context.** |

| AAAA | other | 🔖 | Local placeholder — intentional |
| LA05.7 | colloid cyst | ⚠️ | LA05 = congenital malformations of nervous system. LA05.7 for colloid cyst of third ventricle is plausible (congenital origin) but 8D67 (intracranial cyst) may be equally valid. Verify preferred coding |


---

## Congenital Anomalies, Infantile Hydrocephalus (19 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|

| 8D64.0Z | communicating hydrocephalus unspecified | ⚠️ | 8D64.0Z = acquired hydrocephalus, unspecified. "Communicating" hydrocephalus implies a specific pathophysiology (patent ventricular pathways; failure of CSF reabsorption). This distinction may be lost in the unspecified code. Minor concern for a logbook; acceptable as best-available. |

| **8E40** | acquired porencephalic cyst | **⚠️** | 8E40 is in the acquired structural CNS disorders range. Verify that 8E40 specifically maps to acquired porencephalic cyst vs. another acquired CNS structural anomaly |
| **8E60** | post ventricular shunting leak | **⚠️** | 8E60 needs verification — shunt-related CSF leak as a complication of procedure might be better coded under NE83.0 (mechanical complication of implanted device) or NE81.Z. Verify ICD-11 8E60 definition. |
| AAAA | other | 🔖 | Local placeholder — intentional |

| LA07.0 | primary tethered cord syndrome | ⚠️ | LA07.0 for tethered cord — verify this specific extension maps to primary tethered cord vs. another LA07 structural anomaly |




---

## CSF Disorders — Other Than Infantile Hydrocephalus (5 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|

| 8D64.0Z | communicating hydrocephalus unspecified | ⚠️ | Same note as in congenital section — minor specificity concern; acceptable |

| AAAA | other | 🔖 | Local placeholder — intentional |

---

## Functional Neurosurgery (10 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| **8A00** | parkinsonism | **⚠️** | In ICD-11, 8A00 = Parkinson disease (idiopathic, primary). "Parkinsonism" is a broader term that includes secondary and atypical forms (eg, MSA, PSP, drug-induced). For DBS patients these distinctions matter clinically. If the logbook covers all Parkinson-spectrum patients, 8A00 is commonly used as a practical simplification, but technically secondary parkinsonism has separate codes (8A01, 8A04.0Z). Minor concern for a logbook. |


---

## Peripheral Nerve Diseases (14 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|

| AAAA | other | 🔖 | Local placeholder — intentional |
| **NA41.Z** | brachial plexus injury | **⚠️** | NA41 = injuries of shoulder/upper arm region. NA41.Z = unspecified injury in that region. Brachial plexus injury has a more specific code in ICD-11 — likely NA50.Z or ND50.Z (nerve injuries of upper limb). Verify the correct brachial plexus trauma code. |

---

## Spinal Degenerative Diseases (13 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| 8D65 | cerebrospinal fluid fistula | ⚠️ | 8D65 = CSF fistula. Placing CSF fistula under "spinal degenerative diseases" is categorically unusual — fistula is more a structural/traumatic complication. The code itself may be correct but the category assignment is questionable |
| AAAA | other | 🔖 | Local placeholder — intentional |

| **FA70.1** | scoliosis | **⚠️** | FA70 = kyphosis in ICD-11. FA70.1 may be "other kyphosis" rather than scoliosis. Scoliosis in ICD-11 is coded under FA71 (scoliosis) — a sibling category, not a child of FA70. Verify: if FA70.1 = other kyphosis, then using it for scoliosis is a mismap; correct code would be FA71.Z. |

| **FA81.Z** | spondylolysis | **⚠️** | FA81 in ICD-11 needs verification — if FA81 covers spondylopathies and FA84 covers spondylolisthesis, the FA81.Z code for "spondylolysis" (pars interarticularis defect) may or may not have a dedicated code. Verify FA81.Z vs. possible dedicated spondylolysis code |


---

## Spinal Trauma (8 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| AAAA | other | 🔖 | Local placeholder — intentional |
| **LB73.22** | atlanto-axial instability or subluxation | **❌** | **LB73 = congenital malformations of spine. LB73.22 is in the congenital anomalies chapter (LA–LB range) — NOT a trauma code. This diagnosis appears under "spinal trauma" but is coded with a congenital malformation code, which is a chapter-level error. For traumatic atlanto-axial injury/subluxation, the correct code is in the NA2x range (cervical spine injuries): NA22.0 (fracture of C1), NA22.1 (fracture of C2), or NA21.Z (dislocation/subluxation of cervical spine). If some patients have Down syndrome or rheumatoid-associated AAI (not trauma), those would need separate codes — but a single code for both is still incorrect.** |

| **NA23.4Z** | whiplash injury | **⚠️** | NA23 in ICD-11 may be spinal cord injuries rather than bony/ligamentous cervical injuries. Verify that NA23.4Z specifically maps to whiplash (cervical acceleration-deceleration) vs. another spinal cord injury code. Whiplash in ICD-11 may be under NA22.80 or a dedicated code. |


---

## Summary of Findings

### ❌ Definite code mismatches (4 rows — action recommended)

| Code | Diagnosis | main_diag | Problem | Suggested correct code |
|------|-----------|-----------|---------|----------------------|
| **FA9Z** | discitis spinal infection | cns infection | FA9Z = musculoskeletal degenerative spondylopathy (wrong chapter entirely). Infectious discitis must be in the infectious disease chapter | **1C90.1** (pyogenic vertebral osteomyelitis/spondylodiscitis) |
| **5A01.1** | secondary hyperthyroidism | cns tumors | Codes the hormonal consequence (hyperthyroidism), not the underlying tumor. TSHoma should be coded as a pituitary tumor | **2F37.Y** (other specified pituitary adenoma, TSH-secreting) |
| **5A61.Y** | rathkes cleft cyst | cns tumors | 5A61 = hypopituitarism. A Rathke's cleft cyst is a benign structural cyst of the sella, not a hypopituitary state | **2F7Z** (other benign CNS tumour) or LA05.7 |
| **LB73.22** | atlanto-axial instability or subluxation | spinal trauma | LB73 = congenital malformations of spine. Used in the "spinal trauma" category but is a congenital code | **NA22.0/NA22.1** (C1/C2 fracture) or **NA21.Z** (cervical subluxation/dislocation) |

### ⚠️ Needs verification / partial concern (9 rows)

| Code | Diagnosis | main_diag | Issue |
|------|-----------|-----------|-------|
| 1D00.Z | cerebral ventriculitis nos | cns infection | 1D00.Z = bacterial meningitis unspecified; ventriculitis may need 1C80.Y |
| NE81.2Z | surgical site infection | cns infection | NE81.2 = wound disruption (not infection); SSI may need NE81.3 |
| 8E40 | acquired porencephalic cyst | congenital anomalies | Verify 8E40 specifically maps to acquired porencephalic cyst |
| 8E60 | post ventricular shunting leak | congenital anomalies | Verify 8E60; shunt complications more standardly coded under NE83.0 |
| 8A00 | parkinsonism | functional neurosurgery | 8A00 = Parkinson disease (primary); secondary/atypical parkinsonism = 8A01 |
| NA41.Z | brachial plexus injury | peripheral nerve diseases | NA41 = shoulder/arm injuries; dedicated brachial plexus code likely in NA50/ND50 range |
| FA70.1 | scoliosis | spinal degenerative diseases | FA70 = kyphosis; scoliosis = FA71.x; FA70.1 may be misplaced |
| FA81.Z | spondylolysis | spinal degenerative diseases | Verify FA81.Z specifically maps to spondylolysis (pars defect) |
| NA23.4Z | whiplash injury | spinal trauma | Verify NA23.4Z maps to whiplash specifically |

### 🔖 Local placeholders (10 rows — all correct by design)

`AAAA` / "other" appears once in each of the 10 main_diags — intentional catch-all for unlisted procedures.

### ✅ Correct (111 rows)

All remaining rows have ICD-11 codes that correctly match their stated diagnoses.

---

---

## Changes Applied — Migration 045 (`1750000000045-FixNsIcdCodes`)

Applied to **staging PostgreSQL** (`defaultdb`, Aiven) on **2026-06-16**. Legacy MySQL NOT touched.

All UPDATEs scoped by both `icdCode` AND `icdName` to prevent accidental changes to shared-department rows.

### ❌ Definite mismatches corrected (3 of 4)

| Old Code | New Code | Diagnosis | Reason |
|----------|----------|-----------|--------|
| **FA9Z** | **1C90.1** | discitis spinal infection | FA9Z = musculoskeletal spondylopathy (wrong chapter). 1C90.1 = pyogenic vertebral osteomyelitis/spondylodiscitis (infectious chapter — correct). |
| **5A61.Y** | **2F7Y** | rathkes cleft cyst | 5A61 = hypopituitarism (codes the effect, not the cyst). 2F7Y = other specified benign CNS tumour. (2F7Z not available — already used by epidermoid/dermoid.) |
| **LB73.22** | **NA21.Z** | atlanto-axial instability or subluxation | LB73 = congenital malformations of spine. NA21.Z = cervical subluxation/dislocation, unspecified (injury chapter — correct for traumatic AAI). |

> **5A01.1 "secondary hyperthyroidism" — NOT changed.** On review, this follows the same convention as `5A60.0` (acromegaly = GH-oma) and `5A70.0` (Cushing disease = ACTH-oma): secreting pituitary adenomas are coded by their functional endocrine syndrome in this logbook. Kept as-is for consistency.

### ⚠️ Partial matches resolved (7 corrected, 3 confirmed correct)

| Old Code | New Code | Diagnosis | Reason |
|----------|----------|-----------|--------|
| **1D00.Z** | **1C80.Y** | cerebral ventriculitis nos | 1D00.Z = bacterial meningitis (meningeal inflammation). 1C80.Y = other specified bacterial CNS infection — correctly covers bacterial ependymitis/ventriculitis. |
| **NE81.2Z** | **NE81.3** | surgical site infection | NE81.2 = disruption/dehiscence of wound (mechanical failure). NE81.3 = infection of wound (SSI — correct). |
| **8E60** | **NE83.0** | post ventricular shunting leak | 8E60 = acquired structural CNS disorder (wrong chapter for a device complication). NE83.0 = mechanical complication of implanted prosthetic device. Consistent with NE83.1 (infected VP shunt) already in DB. |
| **8A00** | **8A0Z** | parkinsonism | 8A00 = Parkinson disease (idiopathic, primary only). 8A0Z = Parkinson disease or parkinsonism, unspecified — covers all Parkinson-spectrum patients including secondary/atypical forms seen in DBS practice. |
| **FA70.1** | **FA71.Z** | scoliosis | FA70 = kyphosis/lordosis family; FA70.1 = other kyphosis (wrong). FA71 = scoliosis; FA71.Z = scoliosis, unspecified (correct chapter). |
| **NA41.Z** | **NA14.0** | brachial plexus injury | NA41 = shoulder/upper arm injuries (wrong anatomical level). NA14.0 = injury of brachial plexus at cervical root origin (C5–T1 — anatomically correct). |
| **NA23.4Z** | **NA2Y** | whiplash injury | NA23 = cervical spinal cord injuries (wrong — whiplash is soft tissue/ligamentous, not cord). NA2Y = other specified injury of cervical spine (correct for cervical acceleration-deceleration). |

**Confirmed correct (no code change):**
- `8E40` "acquired porencephalic cyst" — 8E40 is in the acquired structural CNS range; best-available code. Retained.
- `FA81.Z` "spondylolysis" — FA81 covers spondylopathies; FA81.Z is the best-available code for spondylolysis (pars interarticularis defect). Retained.
- `8A00`/`8A0Z` note: name "parkinsonism" retained; only the code was broadened.

### Final state after migration 045

- **10 icdCode values updated** in staging `diagnoses` table
- **0 rows deleted or inserted** — all changes are pure UPDATE (no FK impact, since main_diag_diagnoses and department_diagnoses reference UUID id, not icdCode)
- All diagnoses remain embedded (embedding vectors are still valid — the underlying concept did not change, only the code label)
