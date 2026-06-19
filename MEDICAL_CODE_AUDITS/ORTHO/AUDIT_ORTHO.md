# ORTHO Department Audit
**Date (last updated)**: 2026-06-19
**Migrations applied**: 070–077
**Dept**: ORTHO — Orthopedic Surgery (جراحة العظام والمفاصل)

## Summary
| Metric | Count |
|---|---|
| Main_diags | 17 (13 original + 4 new) |
| Diagnoses (current) | 105 |
| Proc_cpts (current, dept-specific) | 101 |
| ICD-11 codes fixed (❌ wrong) | 19 |
| ICD-11 codes updated (⚠️ approximate → leaf) | 1 |
| CPT codes fixed | 0 (none existed pre-audit) |
| Structural issues resolved | 4 (3 duplicate merges + 1 spurious link) |
| New diagnoses added (this run) | 73 |
| New proc_cpts added (this run) | 101 |
| Diagnoses re-embedded | 84 |
| Proc_cpts re-embedded | 101 |

## Audit findings (Phase 2)
- **Arabic terminology**: clean (ORTHO has no brain anatomy; no دماغ/مخ hits).
- **Dominant ICD error**: traumatic fractures/dislocations were coded in the **FB\*** (musculoskeletal *disease*) chapter instead of the **N\*** (injury) chapter. Plus cross-chapter mismaps: meniscal tear used a femur-fracture code (NC72.0), osteoarthritis used injury codes (NC90.x), osteomyelitis used a developmental-anomaly code (LA91.1), rotator-cuff tear used a wrong arthropathy code (FA71.0).
- **Pre-audit state**: 13 main_diags, 32 diagnoses, **0 proc_cpts**, 0 orphans, 0 empty main_diags.

## ICD-11 Changes Applied
| Old code | Old name | New code | New ICD-11 name | Migration |
|---|---|---|---|---|
| NC71.0 | anterior cruciate ligament tear | NC93.62 | rupture of anterior cruciate ligament | 070 |
| FB50.0 | tibial shaft fracture | NC92.2 | fracture of shaft of tibia | 070 |
| FB70.0 | patella fracture | NC92.0 | fracture of patella | 070 |
| FB80.0 | fracture of neck of femur | NC72.2Z | fracture of neck of femur | 070 |
| FB80.2 | subtrochanteric fracture of femur | NC72.4 | subtrochanteric fracture of femur | 070 |
| FB83.0 | fracture of shaft of femur | NC72.5 | fracture of shaft of femur | 070 |
| FB91.0 | ankle fracture | NC92.Y | fracture of ankle | 070 |
| FB81.0 | intertrochanteric fracture of femur | NC72.30 | intertrochanteric fracture of femur | 070 |
| FA72.0 | anterior dislocation of shoulder | NC13.0 | dislocation of shoulder joint | 070 |
| FB50.1 | fracture of distal radius | NC32.5Z | fracture of lower end of radius | 070 |
| FB91.1 | fracture of hand bone | NC53.3Z | fracture of other metacarpal bone | 070 |
| NC12.0 ⚠️ | fracture of clavicle | NC12.0Z | fracture of clavicle (leaf) | 070 |
| NC72.0 | meniscal tear of knee | NC93.3Z | tear of meniscus, current | 070 |
| NC90.0 | osteoarthritis of knee | FA01.Z | osteoarthritis of knee | 070 |
| NC90.1 | osteoarthritis of hip | FA00.Z | osteoarthritis of hip | 070 |
| LA91.1 | osteomyelitis | FB84.Z | osteomyelitis or osteitis | 070 |
| FA71.0 | rotator cuff tear | NC16.0Y | injury of rotator cuff of shoulder | 070 |
| FA30.0 | lumbar disc herniation | FA80.9 (merged) | intervertebral disc degeneration, lumbar, with prolapse | 071 |
| FA31.0 | lumbar spinal stenosis | FA82 (merged) | spinal stenosis | 071 |
| FB20.0 | fracture of lumbar vertebra | NB52.0 (merged) | fracture of lumbar vertebra | 071 |

**Codes verified OK (no change)**: 8C10.0, NA22.Z, NA82.0, FA10.0, FB84.4, FB81.3, 2E03, FB80.B, FB53.1, FB53.2, FA81.Z, FA84.Z.

## Structural Fixes (migration 071)
- **3 duplicate merges**: lumbar disc herniation (FA30.0), lumbar spinal stenosis (FA31.0), and lumbar vertebra fracture (FB20.0) were duplicates of correctly-coded NS rows (FA80.9, FA82, NB52.0). The shared NS rows were linked to ORTHO (dept + main_diag) and the mis-coded ORTHO rows deleted. This freed FA30.0, later reused for *acquired hallux valgus* (its true ICD-11 meaning).
- **1 spurious link**: the intertrochanteric-fracture row (recoded to NC72.30) was wrongly linked to the `osteonecrosis` main_diag in addition to `fractures (lower extremity)`; the bogus link was removed.

## New main_diag categories added (migration 073)
`bone tumours`, `foot & ankle disorders`, `hand & wrist disorders`, `paediatric & developmental conditions`.

## New Diagnoses Added (73) — by category
| main_diag | ICD-11 codes added | Migration |
|---|---|---|
| anterior cruciate ligament injury | NC93.63, NC93.52, NC93.1Z, NC76.1Y | 072 |
| fractures (lower extremity) | NC92.1Z, ND13.0, ND13.1, ND13.3, NC92.6, NC73.0Z, NC92.4Z | 072 |
| fractures (spine) | NB52.10*, NA22.1Z | 072 |
| fractures (upper extremity) | NC12.2Z, NC12.3, NC12.4Z, NC32.0, NC32.1, NC53.0, NC33.1 | 072 |
| meniscal tears | NC93.30, NC93.31, FA33.2, NC93.3Y | 072 |
| osteoarthritis | FA02.Z, FA03.Z, FA05 | 072 |
| osteomyelitis & septic joint | FB84.1, FA90.Z, 1B12.40 | 072 |
| osteonecrosis | FB81.0, FB81.2, FB81.4, FB81.Y | 072 |
| pathologic fractures | FB8Y, FB83.1Z, FB83.11 | 073 |
| rotator cuff pathology | FB53.0, FB40.3 | 073 |
| spinal stenosis | FA80.1*, FA8Z*, 8B42 | 073 |
| spondylolisthesis | FA84.0, FA84.1, FA81.0 | 073 |
| bone tumours (new) | 2B51.Z, 2B52.Z, 2B50.Z, 2F7B, FB80.6, FB80.5, 2A83.1, 2E83.Z | 073 |
| foot & ankle disorders (new) | FA30.0, FA31.5, NC96.02, FB40.1, FA31.7, FA30.2, 8C11.6 | 073 |
| hand & wrist disorders (new) | FB51.0*, FB42.2, FB40.4, FB40.5, 8C10.1*, FA30.Y | 073 |
| paediatric & developmental conditions (new) | LB74.0, LB98.00, FB82.2, FB82.1, FA70.1, FA70.0*, LB73.2Y | 073 |

`*` = code already existed (shared with another dept: NB52.10/FA80.1/FA8Z/8C10.1/FA70.0 with NS, FB51.0 with PRS); insert skipped, ORTHO link added.

All ICD-11 codes verified via `icd11_search`.

## New Proc_cpts Added (101 dept-specific) — by alpha group
| Group | Count | Scope |
|---|---|---|
| ARTH | 10 | joint arthroplasty / replacement (TKA, THA, shoulder, elbow, ankle, revisions) |
| SCOP | 12 | arthroscopy (knee, shoulder, hip, ankle; ACL/PCL/RC repair) |
| FIXN | 22 | fracture fixation (ORIF, IM nailing, ex-fix, prophylactic fixation, implant removal) |
| SPIN | 11 | spine (discectomy, laminectomy, fusion, ACDF, vertebroplasty/kyphoplasty, scoliosis) |
| HAND | 8 | hand & wrist (carpal/cubital tunnel, trigger finger, De Quervain, Dupuytren, ganglion, mallet) |
| FOOT | 8 | foot & ankle (bunionectomy, hammertoe, Achilles, plantar fasciotomy, Morton, fusions, osteotomy) |
| SOFT | 6 | soft tissue / tendon (RC repair, biceps tenodesis, patellar tendon, ligament recon, MUA) |
| TUMR | 6 | bone tumour (needle/open biopsy, radical resection, curettage, excision) |
| OSTE | 4 | osteotomy / deformity (HTO, proximal femoral, periacetabular, humeral) |
| PEDS | 6 | paediatric (SCFE pinning, DDH reduction, clubfoot tenotomy/casting, guided growth) |
| INFX | 5 | infection / debridement (sequestrectomy, arthrotomy + drainage, bone debridement) |
| AMPU | 3 | amputation (above-knee, below-knee, transmetatarsal) |
| MNR (shared) | — | basic surgical step — linked to all 17 main_diags |

> **CPT verification (2026-06-19, migration 077)**: all 101 codes were verified against **AAPC** (`aapc.com/codes/cpt-codes/<code>`), whose lay descriptions confirm code↔procedure mapping (the verbatim AMA descriptor is paywalled in Codify but not needed for this check). 97 were correct as-is. **4 corrected:**
> | Old | Issue | New |
> |---|---|---|
> | SPIN 22524 (kyphoplasty) | code **deleted by AMA in 2015** | 22514 (current kyphoplasty/vertebral augmentation, lumbar) |
> | SPIN 22514 (labelled vertebroplasty) | 22514 is actually kyphoplasty | 22511 (lumbosacral vertebroplasty) |
> | SCOP 29891 ("ankle debridement") | 29891 = excision of osteochondral lesion of talus | retitled (code unchanged) |
> | TUMR 27065 ("excision of bone tumour") | 27065 = *superficial* excision (ilium/pubis/greater trochanter) | title/description tightened (code unchanged) |
> The 4 changed rows were re-embedded. main_diag_procs links were unaffected (they reference row id, not code). **All CPT codes now AAPC-verified.**

## Still-Open Items
- **`carpal tunnel syndrome` main_diag** has 1 diagnosis and 3 proc_cpts (below the ≥5 guideline). **Documented exception**: carpal tunnel syndrome is a single discrete clinical entity; related entrapment neuropathies and hand procedures are housed in the new `hand & wrist disorders` category. Could be merged/renamed in a future pass if broader scope is desired.
- All other 16 main_diags meet ≥5 diagnoses and ≥5 proc_cpts.
- ICD-11 codes verified via `icd11_search`; CPT codes verified via AAPC (migration 077). No open code issues.
