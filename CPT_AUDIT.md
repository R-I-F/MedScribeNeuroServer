## Legend

| Symbol | Meaning |
|--------|---------|

| ⚠️ | Code is in the right family but has a notable specificity or description mismatch |
| ❌ | Code does not match the stated procedure — likely incorrect |

---

## CRAN — Cranial Procedures (36 rows)

| numCode | Title | Verdict | Notes |
|---------|-------|---------|-------|

| 61108-00 | burr holes | ⚠️ | 61108 = twist drill hole for evacuation of subdural hematoma. Using it as a general "burr holes" code is an approximation — the description in the DB ("small skull openings") is generic rather than the specific CPT text |
practice for VSG shunts |

| 61304-00 | craniotomy for further procedure | ⚠️ | 61304 = craniectomy/craniotomy for exploration or decompression of cranial nerves (not a general "access for further procedure"). Used informally as a standalone craniotomy code in some NS logbooks |

| **61516-00** | **cyst fenestration** | **❌** | **61516 = craniectomy for excision of supratentorial brain tumor in eloquent cortex — NOT cyst fenestration. Open cyst craniotomy falls under 61516 only if the cyst is in eloquent cortex; otherwise it has no direct CPT equivalent (61516 is tumor-specific). Neuroendoscopic cyst fenestration should be 62161.** |

| **61703-00** | **clipping** | **❌** | **61703 = surgery of intracranial aneurysm via CERVICAL approach (Selverstone-Crutchfield extracranial carotid occlusion) — NOT standard intracranial clip ligation. Correct codes for intracranial clipping: 61700 (carotid circulation, complex/giant under circulatory arrest) or 61702 (vertebrobasilar). For a straightforward carotid circulation clip: consider 61697 (also in use here for wrapping). 61703 is a rarely-used extracranial method.** |

| **61715-00** | **lesion / ultrasonic ablation** | **❌** | **61715 does not correspond to ultrasonic ablation in AMA CPT. MRI-guided focused ultrasound ablation (eg, for essential tremor, tremor-dominant PD) is coded as 0398T (thalamus) or 0016T/0017T range. 61715 may not exist as a distinct active code — it appears to be an erroneous or retired code entry.** |


---

## FUSN — Spinal Fusion & Instrumentation (12 rows)

| numCode | Title | Verdict | Notes |
|---------|-------|---------|-------|
| **22513-00** | **kyphoplasty** | **⚠️** | **22513 = percutaneous vertebral augmentation (kyphoplasty), THORACIC specifically. Lumbar kyphoplasty = 22514. Using 22513 as a general kyphoplasty code is a specificity mismatch — it is correct only for thoracic levels.** |

| 22630-01 | removal of prolapsed disc | ⚠️ | Discectomy as a standalone is coded separately (eg, 63030). Using 22630 here implies the discectomy is part of the interbody fusion approach, which is acceptable but the title is misleading |

| **22842-00** | **fixation via hooks** | **⚠️** | **22842 = posterior segmental instrumentation, 3–6 vertebral segments. The segment-count specificity is lost in the local variant system. Fixation with hooks at fewer than 3 segments would fall under 22840 (non-segmental). The three 22842 subtypes (-00 hooks, -01 pedicle screws, -02 otherwise) are not official CPT distinctions.** |
| 22842-01 | fixation via pedicle screws and rods | ⚠️ | Same note as 22842-00 — segment count specificity lost |
| 22842-02 | fixation otherwise | ⚠️ | Same note as above |


---

## LAM — Laminectomy / Spinal Decompression (21 rows)

| numCode | Title | Verdict | Notes |
|---------|-------|---------|-------|
| **0274T-00** | **Foraminotomy** | **⚠️** | **0274T (Category III) = percutaneous laminotomy/laminectomy, interlaminar approach, for soft tissue decompression, CERVICAL or THORACIC. The title "Foraminotomy" is used as a generic term but this is a percutaneous cervical/thoracic-specific code. Open lumbar foraminotomy = 63042 (already in DB). Category III codes are temporary and subject to reassignment/deletion — verify against current AMA CPT edition.** |

| **20660-00** | **traction and immobilization** | **⚠️** | **20660 = application of cranial tongs, caliper, or stereotactic frame. This is specifically cranial tong application (eg, Gardner-Wells for cervical traction in trauma), NOT general cervical traction. General mechanical cervical traction is a rehabilitation code (97012). If intent is surgical cervical traction via tongs, 20660 is correct; as a generic "traction" code it is too specific.** |

---

## MNR — Minor / Bedside Procedures (11 rows)

| numCode | Title | Verdict | Notes |
|---------|-------|---------|-------|
| **11044-00** | **debridment** | **⚠️** | **11044 = debridement, BONE (includes epidermis, dermis, subcutaneous tissue, muscle/fascia if performed), first 20 sq cm or less. This is bone-involved debridement, not general wound debridement. General skin/subcutaneous debridement = 11042. Using 11044 for all wound debridement over-codes the procedure. Also: title is misspelled — should be "debridement".** |
| **11044-01** | **tissue excision** | **⚠️** | Same code issue as 11044-00. "Tissue excision" is a broad term incorrectly mapped to a bone-specific debridement code. |

| **12001-00** | **basic surgical step (sutures or muscle separation)** | **❌** | **12001 = simple repair of superficial wounds, scalp/neck/axillae/trunk/extremities, ≤2.5 cm. This is a very specific small-wound closure code, NOT a generic "basic surgical step" code. Muscle separation is not covered by 12001 at all. There is no single CPT code for a generic "basic surgical step" — this entry appears to be a local workaround with an incorrect CPT assignment.** |

| **13121-00** | **wound closure** | **⚠️** | **13121 = complex repair, scalp/arms/legs, 1.1–2.5 cm. This is highly specific — complex repair, limited body locations, small size range. Using it as a generic "wound closure" code will not cover most neurosurgical wound closures (craniotomy scalp flaps, large wounds, trunk, etc.). Should at minimum be replaced with a site/size-appropriate repair code or noted as a placeholder.** |

| **61000-00** | **ventricular tapping** | **❌** | **61000 = subdural tap through fontanelle or suture, INFANT, unilateral or bilateral, initial. This is infant-specific, fontanelle/suture access, and SUBDURAL (not ventricular). For ventricular access through an existing burr hole or catheter, the correct code is 61020. Using 61000 for adult ventricular tapping is incorrect on all three counts (age, access point, compartment).** |


---

## NONE (1 row)

| numCode | Title | Verdict | Notes |
|---------|-------|---------|-------|
| 00000-00 | other procedure | ✅ | Custom local placeholder — intentional, not a real CPT |

---

## PRPH — Peripheral Nerve (9 rows)

| numCode | Title | Verdict | Notes |
|---------|-------|---------|-------|
| **0908T-00** | **Vagal nerve compression / VNS implantation** | **❌** | **0908T is a Category III (temporary tracking) code that has been reassigned in recent AMA CPT editions — as of CPT 2024, 0908T = "Transcutaneous magnetic stimulation (TMS) for OCD, each 18-minute session." It does NOT cover VNS implantation. Correct established codes for VNS: 64568 (open implantation of vagus nerve neurostimulator electrode array and pulse generator), 64569 (revision/replacement), 64570 (removal). This is a confirmed misassignment and represents the highest-priority fix in this audit.** |


---

## VSHN — VP Shunts (5 rows)

| numCode | Title | Verdict | Notes |
|---------|-------|---------|-------|
| **62160-00** | **laparoscopic implantation of the ventricular catheter** | **⚠️** | **62160 = neuroendoscopy, intracranial, for placement/replacement of ventricular catheter and attachment to shunt system — correct code, but the title says "laparoscopic" which is wrong terminology. The approach is neuroendoscopic (intracranial), not laparoscopic. This is a title error, not a code error.** |


---

## Summary of Findings

### ❌ Definite code mismatches (6 rows — action recommended)

| numCode | Current title | Problem | Suggested correct code |
|---------|---------------|---------|----------------------|
| **61516-00** | cyst fenestration | 61516 = supratentorial brain tumor in eloquent cortex; not cyst fenestration | Neuroendoscopic: **62161**; Open cyst craniotomy: may require 61521 or a custom placeholder |
| **61703-00** | clipping | 61703 = extracranial cervical carotid occlusion; not standard intracranial clip ligation | Intracranial clip, carotid circulation: **61700**; vertebrobasilar: **61702** |
| **61715-00** | lesion / ultrasonic ablation | 61715 is not a recognized active CPT code for ultrasonic ablation | MRI-guided focused ultrasound (thalamus/GPi): **0398T**; verify current edition |
| **61000-00** | ventricular tapping | 61000 = subdural tap via infant fontanelle; wrong compartment, age, and access | **61020** (ventricular puncture via existing burr hole/catheter) |
| **12001-00** | basic surgical step | 12001 = simple superficial wound repair ≤2.5 cm; not a generic surgical step | No single CPT exists for this — consider a local placeholder (like 00000) or site-specific repair codes |
| **0908T-00** | Vagal nerve stimulator | 0908T reassigned in CPT 2024 to TMS for OCD — completely wrong | VNS implantation: **64568** |

### ⚠️ Partial matches / notable specificity issues (8 rows — review recommended)

| numCode | Issue |
|---------|-------|
| 61108-00 | Generic "burr holes" description; 61108 is specifically for subdural hematoma evacuation via twist drill |
| 61304-00 | 61304 = cranial nerve exploration/decompression; used informally as standalone craniotomy |
| 22513-00 | Kyphoplasty thoracic only; lumbar kyphoplasty = 22514 |
| 22842-00/-01/-02 | 22842 = 3–6 segment posterior instrumentation; local variants don't distinguish segment count |
| 0274T-00 | Category III code for percutaneous cervical/thoracic only; may be outdated |
| 20660-00 | 20660 = cranial tongs; used as generic "traction" code |
| 11044-00/-01 | 11044 = bone debridement; used for general wound debridement |
| 13121-00 | Very specific complex repair code; used as generic wound closure |
| 62160-00 | Code correct; title says "laparoscopic" but procedure is neuroendoscopic |


---

## Priority Fix Order

1. **0908T-00** — Active CPT reassignment; VNS coded as TMS is a billing/compliance error. Fix: `64568`
2. **61000-00** — Pediatric subdural code used for adult ventricular tapping. Fix: `61020`
3. **61703-00** — Cervical carotid occlusion code used for standard intracranial clipping. Fix: `61700`
4. **61516-00** — Tumor-in-eloquent-cortex code used for cyst fenestration. Fix: `62161` (neuroendoscopic) or review
5. **61715-00** — Non-existent/retired code for ultrasonic ablation. Fix: `0398T` or placeholder
6. **12001-00** — Small superficial wound repair code used as generic surgical step placeholder. Fix: custom placeholder

---

## Changes Applied — Migration 043 (`FixCptCodeMismatches`)

> Applied to PostgreSQL staging (`defaultdb`) on 2026-06-15.
> All 6 code mismatches corrected; 2 additional title fixes included.
> `down()` reverses every change.

### Code replacements (❌ → ✅)

| # | numCode before | numCode after | Title | Reason |
|---|---------------|--------------|-------|--------|
| 1 | `61516-00` (CRAN) | `62161-02` (CRAN) | cyst fenestration | 61516 = supratentorial tumor in eloquent cortex; 62161 explicitly covers neuroendoscopic intraventricular/intracranial cyst fenestration |
| 2 | `61703-00` (CRAN) | `61700-00` (CRAN) | clipping | 61703 = extracranial cervical carotid approach (Selverstone-Crutchfield); 61700 = standard intracranial aneurysm clip ligation, carotid circulation |
| 3 | `61715-00` (CRAN) | `0398T-00` (CRAN) | lesion / ultrasonic ablation | 61715 is a retired/invalid code; 0398T = MRI-guided focused ultrasound ablation of thalamus/GPi/STN for movement disorders |
| 4 | `61000-00` (MNR) | *row deleted* | ventricular tapping | 61000 = infant subdural tap via fontanelle. Correct code 61020-01 "tapping" already existed. Deleted 61000-00; added 61020-01 link to "cns infection" to cover the lost concept. |
| 5 | `12001-00` (MNR) | `00001-00` (MNR) | basic surgical step | 12001 = simple superficial wound repair ≤2.5 cm; no valid single CPT covers "basic surgical step". Recoded as local placeholder 00001-00 (mirrors 00000-00 "other procedure"). All main_diag_procs links preserved (reference UUID, not numCode). |
| 6 | `0908T-00` (PRPH) | `64568-00` (PRPH) | Vagal nerve stimulator implantation | CPT 0908T reassigned in AMA CPT 2024 to TMS for OCD; 64568 = open implantation of vagus nerve neurostimulator electrode array and pulse generator |

### Title-only fixes (code correct, wording wrong)

| numCode | Old title | New title | Reason |
|---------|-----------|-----------|--------|
| `62160-00` (VSHN) | laparoscopic implantation of the ventricular catheter | neuroendoscopic implantation of the ventricular catheter | The approach is intracranial neuroendoscopic, not laparoscopic |
| `63087-00` (LAM) | korpectomy | corpectomy | Spelling correction |

### main_diag_procs link changes

| Action | procCpt | main_diag | Reason |
|--------|---------|-----------|--------|
| ➕ Added | `62161-02` (cyst fenestration) | NS — cns tumors | Replaced lost link from deleted 61516-00 |
| ➕ Added | `61700-00` (clipping) | NS — neuro-vascular diseases | Replaced lost link from deleted 61703-00 |
| ➕ Added | `0398T-00` (ultrasonic ablation) | NS — functional neurosurgery | Replaced lost link from deleted 61715-00 |
| ➕ Added | `61020-01` (tapping) | NS — cns infection | Preserved concept from deleted 61000-00 (61020-01 was already linked to the other 2 main_diags) |
| ➕ Added | `64568-00` (VNS) | NS — functional neurosurgery | Replaced lost link from deleted 0908T-00 |
