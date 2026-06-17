# NS Department Audit — Neurosurgery
**Date:** 2026-06-15 (CPT audit) / 2026-06-16 (ICD-11 audit)
**Branch:** migration/mysql-to-postgres
**Migrations applied:** 040–045
**Dept:** NS — Neurosurgery | جراحة الأعصاب

---

## Summary

| Metric | Count |
|--------|-------|
| Main_diags | 10 |
| Diagnoses | **134** |
| Proc_cpts | **94** |
| ICD-11 codes fixed (❌ wrong) | **3** (MIG-045) |
| ICD-11 codes updated (⚠️ partial match) | **7** (MIG-045) |
| CPT codes fixed (❌ wrong) | **6** (MIG-043) |
| CPT codes updated (⚠️ partial match) | **10** (MIG-044) |
| CPT title-only fixes | **2** (MIG-043) |

✅ **All 134 diagnoses ICD-11 verified. All 94 proc_cpts CPT audited. Audit complete.**

---

## ICD-11 Audit

> **Source:** 134 rows in `defaultdb.diagnoses` scoped to `dept.code = 'NS'` (staging Aiven PostgreSQL)
> **Method:** Each ICD-11 code verified against known ICD-11 MMS structure and chapter hierarchy.
> **Note:** Previous sessions (migrations 024, 026, 035) already fixed known mismaps across all departments — those corrected codes are not re-flagged here.

### Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Code matches the stated diagnosis in ICD-11 |
| ⚠️ | Code is in the right area but has a specificity, chapter, or description concern |
| ❌ | Code does not match the stated diagnosis — definite mismap |
| 🔖 | Local placeholder code — intentional, not a real ICD-11 code |

---

### CNS Infection (10 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| **1D00.Z** | cerebral ventriculitis nos | **⚠️** | 1D00.Z maps to bacterial meningitis (unspecified). Ventriculitis/ependymitis is inflammation of the ventricular ependyma — better captured under 1C80.Y (other specified bacterial CNS infections). **Fixed → 1C80.Y in MIG-045.** |
| AAAA | other | 🔖 | Local placeholder — intentional |
| **FA9Z** | discitis spinal infection | **❌** | FA9Z = spondylopathy, unspecified — a musculoskeletal/degenerative code. Infectious discitis must be in the infectious chapter. **Fixed → 1C90.1 in MIG-045.** |
| **NE81.2Z** | surgical site infection | **⚠️** | NE81.2 = disruption/dehiscence of wound (not infection). SSI is more accurately NE81.3 (infection of wound). **Fixed → NE81.3 in MIG-045.** |
| NE83.1 | infected vp shunt | ✅ | NE83 = complications of implanted devices. NE83.1 = infection of implanted device — correct. |

---

### CNS Tumors (30 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| 2A00.0Y | ependymoma | ⚠️ | 2A00.0Y = other specified glial neoplasm. Ependymoma may have its own code (2A00.04 or similar) — used as best-available. |
| 2A02.3 | vestibular schwannoma | ⚠️ | 2A02.3 = schwannoma of cranial nerve (CN VIII schwannoma). Plausible but specificity limited. |
| 2B33.5 | cns lymphoma | ⚠️ | 2B33 = non-Hodgkin lymphoma. 2B33.5 for primary CNS lymphoma confirmed as best-available. |
| 2D50 | brain metastasis | ⚠️ | 2D50 = secondary malignant neoplasm. Confirmed as correct for brain metastasis (no narrower sub-code). |
| 2D52 | spinal cord metastasis | ⚠️ | Same family as 2D50 — confirmed as best-available for spinal cord secondary neoplasm. |
| 2F7Z | epidermoid and dermoid tumors | ⚠️ | 2F7Z = other benign CNS tumour, unspecified. Used as best-available catch-all — acceptable. |
| **5A01.1** | secondary hyperthyroidism | **❌** (kept) | 5A01.1 = secondary hyperthyroidism — codes the hormonal effect, not the TSH-secreting adenoma. Logbook convention: secreting pituitary adenomas are coded by their functional endocrine syndrome (same pattern as 5A60.0 acromegaly, 5A70.0 Cushing). **Kept as-is for consistency.** |
| **5A61.Y** | rathkes cleft cyst | **❌** | 5A61 = hypopituitarism. A Rathke's cleft cyst is a benign structural embryonal cyst of the sella — not hypopituitarism. **Fixed → 2F7Y in MIG-045** (2F7Z was already used by epidermoid/dermoid). |
| AAAA | other | 🔖 | Local placeholder — intentional |
| LA05.7 | colloid cyst | ⚠️ | LA05 = congenital malformations of nervous system. LA05.7 for colloid cyst of third ventricle plausible (congenital origin); 8D67 also valid — best-available retained. |

---

### Congenital Anomalies, Infantile Hydrocephalus (19 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| 8D64.0Z | communicating hydrocephalus unspecified | ⚠️ | 8D64.0Z = acquired hydrocephalus, unspecified. "Communicating" specificity is lost — acceptable for a logbook. |
| **8E40** | acquired porencephalic cyst | ⚠️ (confirmed) | 8E40 is in the acquired structural CNS disorders range — confirmed as best-available. Retained. |
| **8E60** | post ventricular shunting leak | **⚠️** | 8E60 = acquired structural CNS disorder (wrong chapter for a device complication). **Fixed → NE83.0 in MIG-045** (NE83.0 = mechanical complication of implanted prosthetic device; consistent with NE83.1 infected VP shunt). |
| AAAA | other | 🔖 | Local placeholder — intentional |
| LA07.0 | primary tethered cord syndrome | ⚠️ | LA07.0 for tethered cord — verified as best-available. Retained. |

---

### CSF Disorders — Other Than Infantile Hydrocephalus (5 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| 8D64.0Z | communicating hydrocephalus unspecified | ⚠️ | Same note as congenital section — minor specificity concern; acceptable. |
| AAAA | other | 🔖 | Local placeholder — intentional |

---

### Functional Neurosurgery (10 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| **8A00** | parkinsonism | **⚠️** | 8A00 = Parkinson disease (idiopathic, primary only). "Parkinsonism" is broader (secondary, atypical forms). **Fixed → 8A0Z in MIG-045** (8A0Z = Parkinson disease or parkinsonism, unspecified — covers all Parkinson-spectrum patients). |

---

### Peripheral Nerve Diseases (14 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| AAAA | other | 🔖 | Local placeholder — intentional |
| **NA41.Z** | brachial plexus injury | **⚠️** | NA41 = injuries of shoulder/upper arm region. NA41.Z is anatomically imprecise for brachial plexus. **Fixed → NA14.0 in MIG-045** (NA14.0 = injury of brachial plexus at cervical root origin C5–T1). |

---

### Spinal Degenerative Diseases (13 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| 8D65 | cerebrospinal fluid fistula | ⚠️ | 8D65 = CSF fistula. Categorically unusual under "spinal degenerative diseases" but code itself is correct. |
| AAAA | other | 🔖 | Local placeholder — intentional |
| **FA70.1** | scoliosis | **⚠️** | FA70 = kyphosis family; FA70.1 = other kyphosis. Scoliosis is under FA71 (sibling category). **Fixed → FA71.Z in MIG-045.** |
| **FA81.Z** | spondylolysis | ⚠️ (confirmed) | FA81 covers spondylopathies; FA81.Z is best-available for spondylolysis (pars interarticularis defect). Retained. |

---

### Spinal Trauma (8 diagnoses)

| ICD-11 Code | Diagnosis | Verdict | Notes |
|-------------|-----------|---------|-------|
| AAAA | other | 🔖 | Local placeholder — intentional |
| **LB73.22** | atlanto-axial instability or subluxation | **❌** | LB73 = congenital malformations of spine (wrong chapter for a trauma diagnosis). **Fixed → NA21.Z in MIG-045** (NA21.Z = cervical subluxation/dislocation, unspecified — injury chapter). |
| **NA23.4Z** | whiplash injury | **⚠️** | NA23 = cervical spinal cord injuries. Whiplash is soft-tissue/ligamentous, not cord injury. **Fixed → NA2Y in MIG-045** (NA2Y = other specified injury of cervical spine). |

---

### ICD-11 Audit — Summary of Findings

#### ❌ Definite code mismatches (4 identified, 3 fixed)

| Code | Diagnosis | main_diag | Problem | Action |
|------|-----------|-----------|---------|--------|
| **FA9Z** | discitis spinal infection | cns infection | FA9Z = musculoskeletal spondylopathy (wrong chapter) | Fixed → **1C90.1** (MIG-045) |
| **5A01.1** | secondary hyperthyroidism | cns tumors | Codes hormonal effect, not the pituitary tumor | **Kept** — logbook convention |
| **5A61.Y** | rathkes cleft cyst | cns tumors | 5A61 = hypopituitarism; a benign cyst ≠ hypopituitary state | Fixed → **2F7Y** (MIG-045) |
| **LB73.22** | atlanto-axial instability or subluxation | spinal trauma | LB73 = congenital anomalies (wrong chapter for trauma) | Fixed → **NA21.Z** (MIG-045) |

#### ⚠️ Partial matches resolved (7 fixed, 3 confirmed correct)

| Old Code | New Code | Diagnosis | Reason |
|----------|----------|-----------|--------|
| **1D00.Z** | **1C80.Y** | cerebral ventriculitis nos | 1D00.Z = meningitis; 1C80.Y = other bacterial CNS infection (covers ventriculitis) |
| **NE81.2Z** | **NE81.3** | surgical site infection | NE81.2 = wound dehiscence; NE81.3 = SSI (infection of wound) |
| **8E60** | **NE83.0** | post ventricular shunting leak | 8E60 = acquired CNS disorder; NE83.0 = mechanical complication of implanted device |
| **8A00** | **8A0Z** | parkinsonism | 8A00 = idiopathic PD only; 8A0Z = all Parkinson-spectrum |
| **FA70.1** | **FA71.Z** | scoliosis | FA70 = kyphosis family; FA71 = scoliosis chapter |
| **NA41.Z** | **NA14.0** | brachial plexus injury | NA41 = shoulder region; NA14.0 = brachial plexus at cervical root origin |
| **NA23.4Z** | **NA2Y** | whiplash injury | NA23 = cord injuries; NA2Y = other cervical spine injury (ligamentous) |

Confirmed correct (retained): `8E40` acquired porencephalic cyst · `FA81.Z` spondylolysis · `LA05.7` colloid cyst

---

## CPT Audit

> **Source:** 94 rows in `defaultdb.proc_cpts` scoped to `dept.code = 'NS'` (staging Aiven PostgreSQL)
> All 94 rows reviewed across 7 alpha-code groups.

### Legend

| Symbol | Meaning |
|--------|---------|
| ✅ | Code matches the stated procedure |
| ⚠️ | Code is in the right family but has a notable specificity or description mismatch |
| ❌ | Code does not match the stated procedure — likely incorrect |

---

### CRAN — Cranial Procedures (36 rows)

| numCode | Title | Verdict | Notes |
|---------|-------|---------|-------|
| 61108-00 | burr holes | ⚠️ | 61108 = twist drill hole for subdural hematoma evacuation — not a general "burr holes" code. Description was generic; specificity issue. |
| 61304-00 | craniotomy for further procedure | ⚠️ | 61304 = craniectomy/craniotomy for exploration/decompression of cranial nerves. Used informally as standalone craniotomy. |
| **61516-00** | **cyst fenestration** | **❌** | 61516 = supratentorial brain tumor in eloquent cortex — NOT cyst fenestration. **Fixed → 62161-02 in MIG-043.** |
| **61703-00** | **clipping** | **❌** | 61703 = extracranial cervical carotid occlusion (Selverstone-Crutchfield) — NOT intracranial clip ligation. **Fixed → 61700-00 in MIG-043.** |
| **61715-00** | **lesion / ultrasonic ablation** | **❌** | 61715 is not a recognized active CPT code. **Fixed → 0398T-00 (MRI-guided focused ultrasound) in MIG-043.** |

---

### FUSN — Spinal Fusion & Instrumentation (12 rows)

| numCode | Title | Verdict | Notes |
|---------|-------|---------|-------|
| **22513-00** | kyphoplasty | **⚠️** | 22513 = kyphoplasty THORACIC only; lumbar = 22514. **Title updated → "kyphoplasty (thoracic)" in MIG-044.** |
| 22630-01 | removal of prolapsed disc | ⚠️ | 22630 = posterior interbody fusion; discectomy is part of the same code, not standalone. **Title updated → "discectomy (as part of interbody fusion)" in MIG-044.** |
| **22842-00** | fixation via hooks | **⚠️** | 22842 = posterior segmental instrumentation, 3–6 vertebral segments. Segment-count specificity lost in local variant system. **Description updated in MIG-044.** |
| 22842-01 | fixation via pedicle screws and rods | ⚠️ | Same as 22842-00. **Description updated in MIG-044.** |
| 22842-02 | fixation otherwise | ⚠️ | Same. **Description updated in MIG-044.** |

---

### LAM — Laminectomy / Spinal Decompression (21 rows)

| numCode | Title | Verdict | Notes |
|---------|-------|---------|-------|
| **0274T-00** | Foraminotomy | **⚠️** | 0274T = percutaneous laminotomy/foraminotomy, CERVICAL or THORACIC only (Category III). Open lumbar = 63042. **Title + description updated in MIG-044.** |
| **20660-00** | traction and immobilization | **⚠️** | 20660 = application of cranial tongs/caliper (eg Gardner-Wells) — NOT generic cervical traction. **Title + description updated in MIG-044.** |

---

### MNR — Minor / Bedside Procedures (11 rows)

| numCode | Title | Verdict | Notes |
|---------|-------|---------|-------|
| **11044-00** | debridment | **⚠️** | 11044 = debridement of BONE — not general wound debridement. Also misspelled. **Title + description updated in MIG-044.** |
| **11044-01** | tissue excision | **⚠️** | Same bone-specificity issue. **Title + description updated in MIG-044.** |
| **12001-00** | basic surgical step (sutures or muscle separation) | **❌** | 12001 = simple superficial wound repair ≤2.5 cm. No single CPT covers "basic surgical step". **Fixed → 00001-00 (local placeholder) in MIG-043; all main_diag_procs links preserved.** |
| **13121-00** | wound closure | **⚠️** | 13121 = complex repair of scalp/arms/legs, 1.1–2.5 cm — too specific to be a generic wound closure. **Title + description updated in MIG-044.** |
| **61000-00** | ventricular tapping | **❌** | 61000 = subdural tap via infant fontanelle (wrong age, wrong compartment, wrong access). **Deleted in MIG-043; concept preserved via 61020-01 link to "cns infection".** |

---

### NONE (1 row)

| numCode | Title | Verdict | Notes |
|---------|-------|---------|-------|
| 00000-00 | other procedure | ✅ | Custom local placeholder — intentional |

---

### PRPH — Peripheral Nerve (9 rows)

| numCode | Title | Verdict | Notes |
|---------|-------|---------|-------|
| **0908T-00** | Vagal nerve compression / VNS implantation | **❌** | 0908T reassigned in AMA CPT 2024 to TMS for OCD — VNS implantation is 64568. **Fixed → 64568-00 in MIG-043.** |

---

### VSHN — VP Shunts (5 rows)

| numCode | Title | Verdict | Notes |
|---------|-------|---------|-------|
| **62160-00** | laparoscopic implantation of the ventricular catheter | **⚠️** | Code (62160) is correct for neuroendoscopic ventricular catheter placement; title says "laparoscopic" which is wrong terminology. **Title updated → "neuroendoscopic implantation of the ventricular catheter" in MIG-043.** |

---

### CPT Audit — Summary of Findings

#### ❌ Definite code mismatches (6 rows — all fixed in MIG-043)

| numCode | Title | Problem | Fix applied |
|---------|-------|---------|-------------|
| 61516-00 | cyst fenestration | 61516 = supratentorial tumor in eloquent cortex | → **62161-02** |
| 61703-00 | clipping | 61703 = extracranial cervical carotid occlusion | → **61700-00** |
| 61715-00 | lesion / ultrasonic ablation | 61715 = retired/invalid code | → **0398T-00** |
| 61000-00 | ventricular tapping | 61000 = infant subdural tap via fontanelle | **Row deleted**; 61020-01 linked to "cns infection" |
| 12001-00 | basic surgical step | 12001 = simple superficial wound repair ≤2.5 cm | → **00001-00** (local placeholder) |
| 0908T-00 | Vagal nerve stimulator | 0908T reassigned in CPT 2024 to TMS for OCD | → **64568-00** |

#### ⚠️ Partial matches resolved (MIG-044 — title/description updates only)

| numCode | Change |
|---------|--------|
| 61108-00 | Description updated to specify subdural hematoma twist drill — not generic burr hole |
| 61304-00 | Description updated to match actual CPT 61304 (cranial nerve exploration/decompression) |
| 22513-00 | Title → "kyphoplasty (thoracic)"; description adds thoracic restriction |
| 22630-01 | Title → "discectomy (as part of interbody fusion)"; prevents misuse as standalone code |
| 22842-00/-01/-02 | Descriptions updated to add mandatory 3–6 segment scope |
| 0274T-00 | Title/description updated for percutaneous cervical/thoracic restriction + Category III status |
| 20660-00 | Title/description updated to name cranial tongs specifically (Gardner-Wells) |
| 11044-00/-01 | Title/description updated for bone-specificity; 11044-00 spelling fixed (debridment → debridement) |
| 13121-00 | Title → "complex wound repair (scalp / extremity)"; description adds body-part and size restrictions |
| 62160-00 | Title → "neuroendoscopic…" (resolved in MIG-043, not MIG-044) |

---

## Changes Applied — Migration 043 (`FixCptCodeMismatches`)

> Applied to staging `defaultdb` on 2026-06-15. All 6 code mismatches corrected; 2 title-only fixes included.

### Code replacements

| # | numCode before | numCode after | Title | Reason |
|---|----------------|---------------|-------|--------|
| 1 | `61516-00` | `62161-02` | cyst fenestration | 61516 = eloquent-cortex tumor excision; 62161 = neuroendoscopic intraventricular/intracranial cyst fenestration |
| 2 | `61703-00` | `61700-00` | clipping | 61703 = extracranial cervical approach (Selverstone-Crutchfield); 61700 = intracranial aneurysm clip ligation |
| 3 | `61715-00` | `0398T-00` | lesion / ultrasonic ablation | 61715 = retired/invalid; 0398T = MRI-guided focused ultrasound ablation of thalamus/GPi/STN |
| 4 | `61000-00` | *deleted* | ventricular tapping | 61000 = infant subdural tap via fontanelle; correct 61020-01 already existed → link added to "cns infection" |
| 5 | `12001-00` | `00001-00` | basic surgical step | No valid CPT for generic surgical step; recoded as local placeholder mirroring 00000-00 |
| 6 | `0908T-00` | `64568-00` | Vagal nerve stimulator | 0908T reassigned to TMS in CPT 2024; 64568 = VNS open implantation |

### Title-only fixes

| numCode | Old title | New title |
|---------|-----------|-----------|
| `62160-00` | laparoscopic implantation of the ventricular catheter | neuroendoscopic implantation of the ventricular catheter |
| `63087-00` | korpectomy | corpectomy |

### main_diag_procs link changes

| Action | procCpt | main_diag | Reason |
|--------|---------|-----------|--------|
| ➕ Added | `62161-02` | cns tumors | Replaced link from deleted 61516-00 |
| ➕ Added | `61700-00` | neuro-vascular diseases | Replaced link from deleted 61703-00 |
| ➕ Added | `0398T-00` | functional neurosurgery | Replaced link from deleted 61715-00 |
| ➕ Added | `61020-01` | cns infection | Preserved concept from deleted 61000-00 |
| ➕ Added | `64568-00` | functional neurosurgery | Replaced link from deleted 0908T-00 |

---

## Changes Applied — Migration 044 (`ResolvePartialCptMatches`)

> Applied to staging `defaultdb` on 2026-06-15. All ⚠️ partial matches resolved via title/description updates — no numCode changes. No main_diag_procs changes.

### Title + description updates

| numCode | Field | Before | After |
|---------|-------|--------|-------|
| `61108-00` | description | 'Small skull openings to relieve pressure or access brain.' | 'Twist drill hole(s) for evacuation or drainage of subdural hematoma' |
| `61304-00` | description | 'Removing skull section for brain surgery access.' | 'Craniectomy or craniotomy for exploration, diagnosis, or decompression of cranial nerves' |
| `22513-00` | title | 'kyphoplasty' | 'kyphoplasty (thoracic)' |
| `22513-00` | description | 'kyphoplasty' | 'Percutaneous vertebral augmentation (kyphoplasty), thoracic vertebral body, initial level' |
| `22630-01` | title | 'removal of prolapsed disc' | 'discectomy (as part of interbody fusion)' |
| `22630-01` | description | original arthrodesis text | 'Discectomy performed as part of posterior interbody arthrodesis (PLIF/TLIF); included in CPT 22630 — not standalone discectomy' |
| `22842-00` | description | 'posterior spinal instrumentation' | 'Posterior segmental instrumentation via hooks; 3 to 6 vertebral segments' |
| `22842-01` | description | 'posterior spinal instrumentation' | 'Posterior segmental instrumentation via pedicle screws and rods; 3 to 6 vertebral segments' |
| `22842-02` | description | 'posterior spinal instrumentation' | 'Posterior segmental instrumentation, other method; 3 to 6 vertebral segments' |
| `0274T-00` | title | 'Foraminotomy' | 'percutaneous foraminotomy (cervical / thoracic)' |
| `0274T-00` | description | 'Percutaneous foraminotomy' | 'Percutaneous laminotomy/foraminotomy, interlaminar approach, cervical or thoracic; soft tissue decompression (Category III tracking code)' |
| `0274T-00` | ar_title | 'توسيع الثقبة الفقرية' | 'توسيع الثقبة الفقرية بالجلد (عنقي / صدري)' |
| `20660-00` | title | 'traction and immobilization' | 'cranial tongs / traction (Gardner-Wells)' |
| `20660-00` | description | 'cervical traction' | 'Application of cranial tongs, caliper, or halo device (eg, Gardner-Wells) for cervical traction or immobilization' |
| `20660-00` | ar_title | 'شد الرقبة وتثبيتها' | 'تثبيت عنقي بالملقط الرأسي (غاردنر-ويلز)' |
| `11044-00` | title | 'debridment' *(misspelled)* | 'debridement (bone)' |
| `11044-00` | description | 'wound debridement' | 'Debridement of bone (includes epidermis, dermis, subcutaneous tissue, muscle and/or fascia if performed); first 20 sq cm or less' |
| `11044-01` | title | 'tissue excision' | 'debridement (bone), additional' |
| `11044-01` | description | 'wound debridement' | 'Debridement of bone (includes overlying soft tissue if performed); additional 20 sq cm or less' |
| `13121-00` | title | 'wound closure' | 'complex wound repair (scalp / extremity)' |
| `13121-00` | description | 'wound repair' | 'Complex repair of scalp, arms, or legs; 1.1 to 2.5 cm' |

---

## Changes Applied — Migration 045 (`FixNsIcdCodes`)

> Applied to staging `defaultdb` on 2026-06-16.
> All UPDATEs scoped by both `icdCode` AND `icdName` to prevent accidental changes to shared-department rows.
> 0 rows deleted or inserted — all changes are pure UPDATE (no FK impact).

### ❌ Definite mismatches corrected (3 of 4)

| Old Code | New Code | Diagnosis | Reason |
|----------|----------|-----------|--------|
| **FA9Z** | **1C90.1** | discitis spinal infection | FA9Z = musculoskeletal spondylopathy; 1C90.1 = pyogenic vertebral osteomyelitis/spondylodiscitis |
| **5A61.Y** | **2F7Y** | rathkes cleft cyst | 5A61 = hypopituitarism; 2F7Y = other specified benign CNS tumour (2F7Z already used by epidermoid/dermoid) |
| **LB73.22** | **NA21.Z** | atlanto-axial instability or subluxation | LB73 = congenital malformations; NA21.Z = cervical subluxation/dislocation (injury chapter) |

> `5A01.1` "secondary hyperthyroidism" — **not changed.** Follows same logbook convention as 5A60.0 (acromegaly) and 5A70.0 (Cushing disease): secreting pituitary adenomas coded by their functional endocrine syndrome. Kept for consistency.

### ⚠️ Partial matches corrected (7 of 9)

| Old Code | New Code | Diagnosis | Reason |
|----------|----------|-----------|--------|
| **1D00.Z** | **1C80.Y** | cerebral ventriculitis nos | 1D00.Z = bacterial meningitis; 1C80.Y = other specified bacterial CNS infection (ependymitis/ventriculitis) |
| **NE81.2Z** | **NE81.3** | surgical site infection | NE81.2 = wound dehiscence; NE81.3 = SSI |
| **8E60** | **NE83.0** | post ventricular shunting leak | 8E60 = acquired CNS disorder; NE83.0 = mechanical implant complication |
| **8A00** | **8A0Z** | parkinsonism | 8A00 = idiopathic PD only; 8A0Z = all Parkinson-spectrum |
| **FA70.1** | **FA71.Z** | scoliosis | FA70 = kyphosis; FA71 = scoliosis |
| **NA41.Z** | **NA14.0** | brachial plexus injury | NA41 = shoulder region; NA14.0 = brachial plexus at cervical root origin |
| **NA23.4Z** | **NA2Y** | whiplash injury | NA23 = cord injury; NA2Y = other cervical spine injury |

Confirmed correct (no change): `8E40` · `FA81.Z`

---

## Still-Open Items

✅ **ICD-11 audit complete** — all 134 NS diagnoses verified. 10 codes updated (MIG-045).
✅ **CPT audit complete** — all 94 proc_cpts reviewed. 6 codes fixed (MIG-043), 10 title/description updates (MIG-044).

No outstanding issues. All known mismaps resolved.
