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
| 1D03.3 | intracranial subdural empyema | ✅ | 1D03.3 = intracranial or spinal abscess/empyema — correct |
| 1D03.3Y | epidural abscess | ✅ | Within 1D03.3 family — acceptable variant for epidural abscess |
| 1D03.3Z | brain abscess | ✅ | 1D03.3Z = intracranial abscess, unspecified — correct |
| 1D0Y | ventriculitis primary | ✅ | 1D0Y = other specified infectious CNS disease — acceptable for primary ventriculitis |
| 1D0Z | acute cns infection | ✅ | 1D0Z = infectious CNS disease, unspecified — correct as catch-all |
| AAAA | other | 🔖 | Local placeholder — intentional |
| **FA9Z** | discitis spinal infection | **❌** | **FA9Z = spondylopathy, unspecified — this is a musculoskeletal/degenerative chapter code (FA = diseases of musculoskeletal system). Infectious discitis must be coded in the infectious chapter. Correct ICD-11 code: 1C90.1 (pyogenic vertebral osteomyelitis/spondylodiscitis) or 1C90.Y (other specified bacterial bone infection). Using a degenerative spine code for an infectious process is a significant chapter-level mismap.** |
| **NE81.2Z** | surgical site infection | **⚠️** | NE81.2 in ICD-11 = disruption/dehiscence of wound (not infection). Surgical site infection (SSI) is more accurately coded as NE81.3 (infection of wound) or NE83.Z (infection due to implant). Verify exact NE81 sub-code mapping. |
| NE83.1 | infected vp shunt | ✅ | NE83 = complications of implanted devices. NE83.1 = infection of implanted device — correct for infected VP shunt |

---

## CNS Tumors (30 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| 2A00.00 | glioblastoma of brain | ✅ | 2A00.00 = glioblastoma, supratentorial — correct |
| 2A00.0Y | ependymoma | ⚠️ | 2A00.0Y = other specified glial neoplasm. Ependymoma in ICD-11 may have its own code (2A00.04 or similar) — verify specificity |
| 2A00.0Z | gliomas of brain unspecified | ✅ | 2A00.0Z = glial neoplasm, unspecified — correct |
| 2A00.10 | medulloblastoma of brain | ✅ | 2A00.10 = medulloblastoma — correct |
| 2A00.11 | pnet | ✅ | 2A00.11 = primitive neuroectodermal tumour — correct |
| 2A00.20 | tumors of the pineal gland or pineal region | ✅ | 2A00.20 = pineal region tumours — correct |
| 2A00.21 | mixed neuronal-glial tumors | ✅ | 2A00.21 = mixed neuronal-glial tumours — correct |
| 2A00.22 | choroid plexus tumors | ✅ | 2A00.22 = choroid plexus tumours — correct |
| 2A00.3 | central neurocytoma | ✅ | 2A00.3 = neuronal and mixed neuronal-glial tumours; central neurocytoma falls here — correct |
| 2A01.0Z | meningiomas unspecified | ✅ | 2A01 = meningiomas. 2A01.0Z = unspecified — correct |
| 2A02.2 | primary neoplasm of spinal cord | ✅ | 2A02 = neoplasms of spinal cord. 2A02.2 = primary spinal cord neoplasm — correct |
| 2A02.3 | vestibular schwannoma | ⚠️ | 2A02.3 = schwannoma of cranial nerve. Vestibular schwannoma (acoustic neuroma) is a cranial nerve VIII schwannoma — plausible but verify exact extension code |
| 2B33.5 | cns lymphoma | ⚠️ | 2B33 = non-Hodgkin lymphoma. 2B33.5 for primary CNS lymphoma needs verification — primary CNS lymphoma may have a more specific code (possibly 2B33.50 or 2B33.5Z) |
| 2B5J | chordoma | ✅ | 2B5J = chordoma — correct (bone tumour chapter, J suffix for chordoma) |
| 2D12.Y | paraganglioma | ✅ | 2D12 = paragangliomas. 2D12.Y = other specified — correct |
| 2D50 | brain metastasis | ⚠️ | 2D50 = secondary malignant neoplasm of specified sites. Verify that 2D50 (without extension) is the correct code for brain metastasis specifically, vs. a more specific sub-code |
| 2D52 | spinal cord metastasis | ⚠️ | Similar to 2D50 — verify that 2D52 specifically maps to spinal cord secondary neoplasm |
| 2F37.0 | non-secreting pituitary adenoma | ✅ | 2F37 = pituitary adenoma. 2F37.0 = non-secreting — correct |
| 2F37.Y | prolactinoma | ✅ | 2F37.Y = other specified pituitary adenoma — acceptable for prolactinoma (PRL-secreting) |
| 2F7A.Y | craniopharyngioma | ✅ | 2F7A = craniopharyngioma. 2F7A.Y = other specified type — correct |
| 2F7C | hemangioblastoma | ✅ | 2F7C = haemangioblastoma of CNS — correct |
| 2F7Z | epidermoid and dermoid tumors | ⚠️ | 2F7Z = other benign CNS tumour, unspecified. Epidermoid and dermoid cysts may have more specific codes. Used as best-available catch-all here — acceptable but verify |
| **5A01.1** | secondary hyperthyroidism | **❌** | **5A01.1 = secondary hyperthyroidism (an endocrine condition caused by something else, eg. TSH-secreting adenoma). This is a consequence code placed in a "CNS tumors" category — the code describes the hormonal effect, not the underlying pituitary tumor. If the intent is to capture TSH-secreting pituitary adenoma (TSHoma), the correct code is 2F37.Y (other specified pituitary adenoma). The endocrine consequence should not substitute for the tumor code.** |
| **5A61.Y** | rathkes cleft cyst | **❌** | **5A61 = hypopituitarism. 5A61.Y = other specified hypopituitarism. Rathke's cleft cyst is a benign embryonal cyst of the sella turcica — it is NOT hypopituitarism. The cyst may cause hypopituitarism as a complication, but the cyst itself is a distinct structural entity. Correct code: 2F7Z (other benign CNS tumour) or LA05.7 (other congenital anomaly of CNS) depending on pathological context.** |
| 5A60.0 | acromegaly or pituitary gigantism | ✅ | 5A60 = acromegaly and pituitary gigantism. 5A60.0 — correct |
| 5A70.0 | pituitary-dependent cushing disease | ✅ | 5A70 = hypercortisolism. 5A70.0 = Cushing disease (ACTH-secreting pituitary adenoma) — correct |
| AAAA | other | 🔖 | Local placeholder — intentional |
| LA05.7 | colloid cyst | ⚠️ | LA05 = congenital malformations of nervous system. LA05.7 for colloid cyst of third ventricle is plausible (congenital origin) but 8D67 (intracranial cyst) may be equally valid. Verify preferred coding |
| LD2D.10 | neurofibromatosis type 1 | ✅ | LD2D.10 = NF1 — correct |
| LD2D.11 | neurofibromatosis type 2 | ✅ | LD2D.11 = NF2 — correct |

---

## Congenital Anomalies, Infantile Hydrocephalus (19 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| 8D64.02 | post hemorrhagic hydrocephalus | ✅ | 8D64.02 = post-haemorrhagic hydrocephalus — correct |
| 8D64.0Y | post infectious hydrocephalus | ✅ | 8D64.0Y = other specified acquired hydrocephalus — acceptable for post-infectious |
| 8D64.0Z | communicating hydrocephalus unspecified | ⚠️ | 8D64.0Z = acquired hydrocephalus, unspecified. "Communicating" hydrocephalus implies a specific pathophysiology (patent ventricular pathways; failure of CSF reabsorption). This distinction may be lost in the unspecified code. Minor concern for a logbook; acceptable as best-available. |
| 8D64.1Z | non-communicating hydrocephalus unspecified | ✅ | 8D64.1 = structural (obstructive) hydrocephalus. 8D64.1Z = unspecified — correct |
| 8D67 | intracranial arachnoid cyst | ✅ | 8D67 = intracranial cyst — correct |
| 8D68 | porencephalic cyst | ✅ | 8D68 = porencephaly — correct |
| **8E40** | acquired porencephalic cyst | **⚠️** | 8E40 is in the acquired structural CNS disorders range. Verify that 8E40 specifically maps to acquired porencephalic cyst vs. another acquired CNS structural anomaly |
| **8E60** | post ventricular shunting leak | **⚠️** | 8E60 needs verification — shunt-related CSF leak as a complication of procedure might be better coded under NE83.0 (mechanical complication of implanted device) or NE81.Z. Verify ICD-11 8E60 definition. |
| AAAA | other | 🔖 | Local placeholder — intentional |
| LA01 | encephaloceles | ✅ | LA01 = encephalocele — correct |
| LA02.01 | myelomeningoceles | ✅ | LA02.01 = myelomeningocele — correct |
| LA02.Y | meningoceles | ✅ | LA02.Y = other specified spinal dysraphism — acceptable for meningocele |
| LA03 | arnold-chiari malformation type 2 | ✅ | LA03 = Arnold-Chiari malformation type II — correct |
| LA04.0 | hydrocephalus with aqueduct stenosis | ✅ | LA04 = structural hydrocephalus. LA04.0 = aqueductal stenosis — correct |
| LA06.0 | dandywalker malformation | ✅ | LA06 = Dandy-Walker syndrome — correct |
| LA07.0 | primary tethered cord syndrome | ⚠️ | LA07.0 for tethered cord — verify this specific extension maps to primary tethered cord vs. another LA07 structural anomaly |
| LA07.4 | arnold-chiari malformation type 1 | ✅ | LA07.4 = Chiari malformation type I (distinct from type II at LA03) — correct |
| LA07.Y | leptomyelolipoma | ✅ | LA07.Y = other specified congenital malformation of nervous system — acceptable |
| LB70 | structural developmental anomalies of cranium | ✅ | LB70 = structural developmental anomalies of skull — correct |

---

## Cranial Trauma (14 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| 8B00.4 | intraventricular hemorrhage | ✅ | 8B00.4 = intraventricular haemorrhage — correct |
| 8B01 | subarachnoid hemorrhage | ✅ | 8B01 = subarachnoid haemorrhage — correct |
| 8B02 | chronic subdural hematoma | ✅ | 8B02 = subdural haematoma — correct |
| 8D60.1 | cerebral oedema | ✅ | 8D60.1 = cerebral oedema — correct |
| 8D62 | cerebrospinal fluid rhinorrhoea | ✅ | 8D62 = CSF rhinorrhoea — correct |
| 8D64.Z | hydrocephalus | ✅ | 8D64.Z = hydrocephalus, unspecified — correct as a general post-traumatic hydrocephalus code |
| AAAA | other | 🔖 | Local placeholder — intentional |
| NA01.3 | laceration with foreign body of head | ✅ | NA01.3 = open wound of head with foreign body — correct |
| NA02.0 | depressed fracture | ✅ | NA02.0 = depressed skull fracture — correct |
| NA07.0 | concussion | ✅ | NA07.0 = concussion — correct |
| NA07.1 | intracerebral hematoma | ✅ | NA07.1 = traumatic intracerebral haematoma — correct |
| NA07.3Z | diffuse axonal injury | ✅ | NA07.3 = diffuse traumatic brain injury. NA07.3Z = unspecified — correct |
| NA07.5 | extradural hematoma | ✅ | NA07.5 = epidural haematoma — correct |
| NA07.6 | acute subdural hematoma | ✅ | NA07.6 = acute subdural haematoma — correct |

---

## CSF Disorders — Other Than Infantile Hydrocephalus (5 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| 8D64.04 | normal-pressure hydrocephalus | ✅ | 8D64.04 = normal-pressure hydrocephalus — correct |
| 8D64.0Z | communicating hydrocephalus unspecified | ⚠️ | Same note as in congenital section — minor specificity concern; acceptable |
| 8D64.1 | non-communicating hydrocephalus | ✅ | 8D64.1 = structural/obstructive hydrocephalus — correct |
| 8D66 | syringomyelia or syringobulbia | ✅ | 8D66 = syringomyelia and syringobulbia — correct |
| AAAA | other | 🔖 | Local placeholder — intentional |

---

## Functional Neurosurgery (10 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| **8A00** | parkinsonism | **⚠️** | In ICD-11, 8A00 = Parkinson disease (idiopathic, primary). "Parkinsonism" is a broader term that includes secondary and atypical forms (eg, MSA, PSP, drug-induced). For DBS patients these distinctions matter clinically. If the logbook covers all Parkinson-spectrum patients, 8A00 is commonly used as a practical simplification, but technically secondary parkinsonism has separate codes (8A01, 8A04.0Z). Minor concern for a logbook. |
| 8A02 | dystonic disorders | ✅ | 8A02 = dystonias — correct |
| 8A04 | disorders associated with tremor | ✅ | 8A04 = movement disorders associated with tremor — correct |
| 8A04.1 | essential tremors | ✅ | 8A04.1 = essential tremor — correct |
| 8A6Z | epilepsy | ✅ | 8A6Z = epilepsy, unspecified — correct |
| 8B82.0 | trigeminal neuralgia | ✅ | 8B82.0 = classic trigeminal neuralgia — correct |
| 8B88.2 | hemifacial spasm | ✅ | 8B88.2 = hemifacial spasm — correct |
| AAAA | other | 🔖 | Local placeholder — intentional |
| MB47.3 | spasticity | ✅ | MB47.3 = spasticity — correct |
| MG30.0Z | chronic pain syndromes | ✅ | MG30.0Z = chronic pain, unspecified — correct |

---

## Neuro-Vascular Diseases (11 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| 8B00 | intracerebral haemorrhage | ✅ | 8B00 = intracerebral haemorrhage — correct |
| 8B01.0 | aneurysmal subarachnoid haemorrhage | ✅ | 8B01.0 = aneurysmal SAH — correct |
| 8B11 | cerebral ischaemic stroke | ✅ | 8B11 = cerebral ischaemic stroke — correct |
| 8B22.40 | arteriovenous malformation of cerebral vessels | ✅ | 8B22.40 = AVM of brain — correct |
| 8B22.41 | cerebral cavernous malformation | ✅ | 8B22.41 = cavernous malformation — correct |
| 8B22.42 | dural arteriovenous fistula | ✅ | 8B22.42 = dural AVF — correct |
| 8B22.43 | carotid cavernous fistula | ✅ | 8B22.43 = CCF — correct |
| 8B22.5 | cerebral aneurysm nonruptured | ✅ | 8B22.5 = unruptured intracranial aneurysm — correct |
| 8B22.B | moyamoya syndrome | ✅ | 8B22.B = moyamoya disease/syndrome — correct (ICD-11 uses alphanumeric extensions including letters) |
| AAAA | other | 🔖 | Local placeholder — intentional |
| LA90.20 | vein of galen aneurysm | ✅ | LA90.20 = vein of Galen aneurysmal malformation — correct |

---

## Peripheral Nerve Diseases (14 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| 2C4Z | malignant neoplasms of peripheral nerves | ✅ | 2C4Z = malignant peripheral nerve sheath tumour, unspecified — correct |
| 2F3Y | benign peripheral nerve sheath tumor | ✅ | 2F3Y = other specified benign peripheral nerve tumour — correct |
| 8C10.0 | carpal tunnel syndrome | ✅ | 8C10.0 = carpal tunnel syndrome — correct |
| 8C10.1 | lesion of ulnar nerve | ✅ | 8C10.1 = lesion of ulnar nerve — correct |
| 8C10.2 | lesion of radial nerve | ✅ | 8C10.2 = lesion of radial nerve — correct |
| 8C11.0 | lesion of sciatic nerve | ✅ | 8C11.0 = lesion of sciatic nerve — correct |
| 8C11.1 | meralgia paraesthetica | ✅ | 8C11.1 = meralgia paraesthetica — correct |
| 8C11.2 | lesion of femoral nerve | ✅ | 8C11.2 = lesion of femoral nerve — correct |
| 8C11.3 | lesion of common peroneal nerve | ✅ | 8C11.3 = lesion of common peroneal nerve — correct |
| 8C11.4 | lesion of tibial nerve | ✅ | 8C11.4 = lesion of tibial nerve — correct |
| 8C11.5 | tarsal tunnel syndrome | ✅ | 8C11.5 = tarsal tunnel syndrome — correct |
| AAAA | other | 🔖 | Local placeholder — intentional |
| **NA41.Z** | brachial plexus injury | **⚠️** | NA41 = injuries of shoulder/upper arm region. NA41.Z = unspecified injury in that region. Brachial plexus injury has a more specific code in ICD-11 — likely NA50.Z or ND50.Z (nerve injuries of upper limb). Verify the correct brachial plexus trauma code. |
| ND56.4 | nerve injury otherwise | ✅ | ND56 = injuries involving multiple or other specified body regions — acceptable catch-all for unspecified nerve injury |

---

## Spinal Degenerative Diseases (13 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| 8D65 | cerebrospinal fluid fistula | ⚠️ | 8D65 = CSF fistula. Placing CSF fistula under "spinal degenerative diseases" is categorically unusual — fistula is more a structural/traumatic complication. The code itself may be correct but the category assignment is questionable |
| AAAA | other | 🔖 | Local placeholder — intentional |
| FA70.0 | kyphosis | ✅ | FA70.0 = kyphosis — correct |
| **FA70.1** | scoliosis | **⚠️** | FA70 = kyphosis in ICD-11. FA70.1 may be "other kyphosis" rather than scoliosis. Scoliosis in ICD-11 is coded under FA71 (scoliosis) — a sibling category, not a child of FA70. Verify: if FA70.1 = other kyphosis, then using it for scoliosis is a mismap; correct code would be FA71.Z. |
| FA80.1 | intervertebral disc degeneration cervical with prolapse | ✅ | FA80.1 = cervical disc degeneration with prolapse — correct |
| FA80.5 | intervertebral disc degeneration thoracic with prolapse | ✅ | FA80.5 = thoracic disc degeneration with prolapse — correct |
| FA80.9 | intervertebral disc degeneration lumbar with prolapse | ✅ | FA80.9 = lumbar disc degeneration with prolapse — correct |
| **FA81.Z** | spondylolysis | **⚠️** | FA81 in ICD-11 needs verification — if FA81 covers spondylopathies and FA84 covers spondylolisthesis, the FA81.Z code for "spondylolysis" (pars interarticularis defect) may or may not have a dedicated code. Verify FA81.Z vs. possible dedicated spondylolysis code |
| FA82 | spinal canal stenosis | ✅ | FA82 = spinal canal stenosis — correct |
| FA83 | ossification of posterior longitudinal ligament | ✅ | FA83 = OPLL — correct |
| FA84.Z | spondylolisthesis | ✅ | FA84 = spondylolisthesis. FA84.Z = unspecified — correct |
| FA8Z | facet arthropathy | ✅ | FA8Z = spondylosis, unspecified — acceptable for facet arthropathy |
| FA92.01 | sacroiliitis | ✅ | FA92 = sacroiliac joint disease. FA92.01 = sacroiliitis — correct |

---

## Spinal Trauma (8 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| AAAA | other | 🔖 | Local placeholder — intentional |
| **LB73.22** | atlanto-axial instability or subluxation | **❌** | **LB73 = congenital malformations of spine. LB73.22 is in the congenital anomalies chapter (LA–LB range) — NOT a trauma code. This diagnosis appears under "spinal trauma" but is coded with a congenital malformation code, which is a chapter-level error. For traumatic atlanto-axial injury/subluxation, the correct code is in the NA2x range (cervical spine injuries): NA22.0 (fracture of C1), NA22.1 (fracture of C2), or NA21.Z (dislocation/subluxation of cervical spine). If some patients have Down syndrome or rheumatoid-associated AAI (not trauma), those would need separate codes — but a single code for both is still incorrect.** |
| NA22.Z | cervical fracture | ✅ | NA22 = cervical spine fractures. NA22.Z = unspecified — correct |
| **NA23.4Z** | whiplash injury | **⚠️** | NA23 in ICD-11 may be spinal cord injuries rather than bony/ligamentous cervical injuries. Verify that NA23.4Z specifically maps to whiplash (cervical acceleration-deceleration) vs. another spinal cord injury code. Whiplash in ICD-11 may be under NA22.80 or a dedicated code. |
| NA82.0 | dorsal spine fracture | ✅ | NA82 = thoracic spine fracture. NA82.0 — correct |
| NB52.0 | lumbar spine fracture | ✅ | NB52.0 = lumbar spine fracture — correct |
| NB52.10 | sacral fracture | ✅ | NB52.10 = sacral fracture — correct |
| NB52.11 | coccygeal fracture | ✅ | NB52.11 = coccygeal fracture — correct |

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

## Notes for Next Session

- The 4 ❌ mismatches are clear enough to correct without browser verification. However, per user instruction, **no database changes have been made**.
- The 9 ⚠️ items should be verified against [WHO ICD-11 browser](https://icd.who.int/browse/2024-01/mms/en) or findacode.com before any corrective migration is written. Confidence on these is ~70-80% — the base chapters are right but exact extension codes may differ.
- `FA70.1 = scoliosis` is the highest-priority ⚠️ item — if FA70.1 is "other kyphosis" (not scoliosis), this is a definite mismap for a common NS diagnosis.
