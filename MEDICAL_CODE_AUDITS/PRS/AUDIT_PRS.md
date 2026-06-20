# PRS Department Audit
**Date (last updated)**: 2026-06-20
**Migrations applied**: 078–084
**Dept**: PRS — Plastic & Reconstructive Surgery

## Summary
| Metric | Count |
|---|---|
| Main_diags | 12 |
| Diagnoses (current) | 100 |
| Proc_cpts (current, dept-specific) | 100 (+4 shared linked) |
| ICD-11 codes fixed (❌ wrong) | 18 |
| ICD-11 codes updated (⚠️ approximate, parent→leaf) | 3 |
| CPT codes fixed | 0 (none existed before this run) |
| Structural issues resolved | 1 (scar row relinked) |
| New diagnoses added (this run) | 70 |
| New proc_cpts added (this run) | 100 |
| Diagnoses re-embedded | 86 |
| Proc_cpts re-embedded | 100 |

Starting state: 12 main_diags, 30 diagnoses, **0 proc_cpts**. The original PRS coverage
(migration 019) used many out-of-chapter codes (skin-disease `E*` codes for injuries,
developmental `L*` codes for tumours/ulcers, etc.) — 21 of the 30 codes were corrected.

## ICD-11 Changes Applied
| Old code | Old name | New code | New name | Migration |
|---|---|---|---|---|
| EJ40.0 | burn of first degree | ND92.1 | superficial partial-thickness burn | 078 |
| EJ41.0 | burn of second degree | ND92.2 | deep partial-thickness burn | 078 |
| EJ42.0 | burn of third degree | ND92.3 | full-thickness burn | 078 |
| EJ50.0 | frostbite | NE41 | frostbite with tissue necrosis | 078 |
| ED00.0 | cleft palate | LA42.Z | cleft palate | 078 |
| ED00.1 | cleft lip | LA40.Z | cleft lip | 078 |
| EH61.0 | syndactyly | LB79.Z | syndactyly | 078 |
| EH63.0 | polydactyly | LB78.Z | polydactyly | 078 |
| ED91.0 | keloid scar | EE60.0Z | keloid scar | 078 |
| ED91.1 | hypertrophic scar | EE60.1 | hypertrophic scar | 078 |
| ED91.2 | contracture of scar | EH94 | scar of skin (relinked → scar revision) | 078 / 079 |
| NA14.0 | brachial plexus injury | NA41.Z | brachial plexus injury *(shared: NS — also corrected there)* | 078 |
| EK90.0 | pressure ulcer | EH90.Z | pressure ulcer | 078 |
| LA70.0 | diabetic foot ulcer | BD54 | diabetic foot ulcer | 078 |
| LA91.2 | necrotizing fasciitis | 1B71.Z | necrotizing fasciitis | 078 |
| 2F31.0 | basal cell carcinoma | 2C32.Z | basal cell carcinoma | 078 |
| 2F33.0 | cutaneous squamous cell carcinoma | 2C31.Z | cutaneous squamous cell carcinoma | 078 |
| LB20.0 | epidermoid cyst | EK70.0Z | epidermoid cyst *(shared: PEDSURG — also corrected there)* | 078 |
| 2B72.0 | giant cell tumour of soft tissue | 2C35 | cutaneous sarcoma *(repurposed — see note)* | 078 |
| 2C30.0 | melanoma of skin | 2C30.Z | melanoma of skin *(⚠️ parent→leaf)* | 078 |
| 2E80.0 | lipoma | 2E80.0Z | lipoma *(⚠️ parent→leaf)* | 078 |

**Note on 2B72.0 → 2C35**: the exact ICD-11 code for "giant cell tumour of soft tissue"
(2F7C) is already used by NS (for hemangioblastoma) and 2F7Z is used by NS (epidermoid &
dermoid tumours), so neither was available. The wrong-coded row was repurposed to the free,
PRS-relevant **2C35 "Cutaneous sarcoma"** (a wide-excision + reconstruction entity).

## CPT Changes Applied
None — PRS had no proc_cpts before this run. 100 new dept-specific procedures imported
(migrations 082–083), all verified against AAPC (none deleted).

## Structural Fixes
- **Migration 079**: the former "contracture of scar" row (recoded to EH94 "scar of skin")
  was relinked from the `contractures` main_diag to `scar revision`, which fits the entity
  better; `contractures` is now populated with true contracture entities (Dupuytren,
  Volkmann, joint/muscle contracture, trigger finger, plantar fibromatosis, acquired clawhand).
- No orphaned diagnoses and no empty main_diags before or after.

## New Diagnoses Added (70) — by main_diag
- **aesthetic surgery** (+5): dermatochalasis 9A03.5, excess/redundant skin ME66.2, localised adiposity 5B80.1, actinic elastosis EJ20.0, blepharoptosis 9A03.0Z
- **breast reconstruction** (+4): Poland syndrome LB73.10, breast-implant mechanical complication PK9B.2, DCIS 2E65.2, postmastectomy lymphoedema BE1B.0
- **burn injuries** (+9): superficial frostbite NE40, burns multiple regions NE10, burn unspecified region NE11, respiratory/inhalation burn NE01, hand full-thickness burn ND95.3, face full-thickness burn ND91.3, electrical injury NF08.4, chemical burn NE2Z, head/neck full-thickness burn ND90.3
- **cleft lip & palate** (+5): cleft lip unilateral LA40.0, bilateral LA40.1, cleft hard palate LA42.0, cleft soft palate LA42.1, velopharyngeal incompetence LA50
- **congenital anomalies** (+8): prominent ear LA21.Z, port-wine stain LC50.1, infantile haemangioma 2E81.2Z, radial hemimelia LB99.2, constriction ring LD26.5, thumb hypoplasia LB99.7, thumb polydactyly LB78.0, ulnar hemimelia LB99.3
- **contractures** (+6): trigger finger FB40.Y, Volkmann ischaemic contracture NF0A.6, joint contracture FA34.3, plantar fibromatosis FB51.Y, muscle contracture FB32.4, acquired clawhand FA31.6
- **hand trauma** (+7): extensor tendon injury NC57.3Z, metacarpal fracture NC53.3Z, phalanx fracture NC53.6Z, fingernail/nail-bed injury NC50, thumb amputation NC59.0Z, multi-finger amputation NC59.2Z, first metacarpal (Bennett) fracture NC53.2
- **nerve injuries** (+8): ulnar nerve NC34.0, median nerve NC34.1, radial nerve NC34.2, digital nerve NC55.Z, facial nerve palsy 8B88.0, carpal tunnel 8C10.0, cubital tunnel 8C10.1, tarsal tunnel 8C11.5
- **pressure ulcers** (+4): pressure ulcer grade 2 EH90.1, grade 3 EH90.2, grade 4 EH90.3, venous leg ulcer BD74.3Z
- **scar revision** (+2): atrophic scarring EE40.2, keloidal surgical scar EL50.0 (+ relinked EH94)
- **traumatic lacerations & avulsions** (+7): strep necrotising fasciitis 1B71.0, polymicrobial necrotising fasciitis 1B71.1, gas gangrene 1C16, open wound of head NA01.Z, open wound of lower leg NC91.Z, gangrene MC85, traumatic avulsion ND56.8
- **tumor reconstruction** (+5): dermatofibrosarcoma protuberans 2B53.Y, giant congenital naevus 2F20.20, congenital melanocytic naevus 2F20.2Z, pyogenic granuloma 2F26, SCC in situ (Bowen) 2E64.0Z

All 70 codes verified via `icd11_search` (WHO ICD-11 2024-01).

## New Proc_cpts Added (100, dept-specific) — alpha groups
| Group | Count | Scope |
|---|---|---|
| FLAP | 11 | pedicled, free & adjacent-tissue flaps |
| GRFT | 10 | split/full-thickness skin grafts, fat grafting, ADM |
| HSGY | 10 | hand surgery (tendon/nerve/fracture/replant/pollicisation) |
| CLEF | 8 | cleft lip/palate, pharyngoplasty, cleft rhinoplasty |
| BURN | 9 | dressing/debridement, escharotomy, burn-wound prep, autografts |
| BRST | 10 | implant/expander, flap reconstruction, capsulectomy, reduction, mastopexy |
| AEST | 10 | blepharoplasty, facelift, browlift, rhinoplasty, abdominoplasty, liposuction, otoplasty, ptosis repair |
| MICR | 6 | nerve repair/graft, facial reanimation (free & regional muscle) |
| WND | 7 | debridement (subq/muscle), selective debridement, complex/intermediate repairs |
| SCRV | 6 | Z-plasty, dermabrasion, scar excision, complex repair |
| EXCN | 8 | malignant excision (trunk/face/scalp), Mohs, sentinel node, radical soft-tissue resection |
| CONT | 5 | Dupuytren fasciectomy/fasciotomy, tenotomy, constriction-ring release, contracture Z-plasty |

All 100 CPT codes verified against AAPC (`aapc.com/codes/cpt-codes/<code>`); none deleted.
MNR 00001-00 linked to every main_diag. Four pre-existing shared procs reused (not
duplicated): BREA 19357-00 (tissue expander)→breast reconstruction, BREA 38525-00 (axillary
node)→tumor reconstruction, PRPH 64856-00 (major nerve repair) & PRPH 64861-00 (brachial
plexus)→nerve injuries.

## Still-Open Items
- None for PRS. 100 diagnoses (all ICD-11 verified ✅, all embedded), 100 dept-specific
  proc_cpts (all AAPC-verified ✅, all embedded). Every main_diag ≥ 5 diagnoses and ≥ 5 procs.
