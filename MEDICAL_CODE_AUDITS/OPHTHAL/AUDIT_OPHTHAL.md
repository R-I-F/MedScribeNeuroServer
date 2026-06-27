# OPHTHAL Department Audit
**Date (last updated)**: 2026-06-27
**Dept**: OPHTHAL — Ophthalmology | طب وجراحة العيون

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-06-27 (COMPLETE)
**Current step**: Done
**Status**: complete

### Step status
- [x] Phase 1 — state loaded (28 diags, 0 procs, 12 main_diags)
- [x] Phase 2A — structural scan (0 orphans, 0 empty-diag, Arabic clean)
- [x] Phase 2B — ICD-11 audit (28/28 verified → 10✅ 3⚠️ 15❌)
- [x] Phase 2C — CPT audit — N/A (0 procs imported)
- [x] Phase 2D — candidate diagnoses (72 specced / +72 target → 100 total)
- [x] Phase 2E — candidate procs (104 specced AAPC-verified / +100 target)
- [x] Phase 3 — migrations written (139–144)
- [x] Phase 4 — migrations applied (139–144 ✅)
- [x] Phase 5 — embeddings backfilled (85 diagnoses ✅ + 104 procs ✅)
- [x] Phase 6 — finalized (audit + MISMAPPED + CLAUDE.md)

### Migration numbers reserved
139=FixOphthalIcdCodes [applied ✅], 140=AddOphthalDiagnosesBatch1 [applied ✅], 141=AddOphthalDiagnosesBatch2 [applied ✅], 142=ImportOphthalProcCpts1 [applied ✅], 143=ImportOphthalProcCpts2 [applied ✅], 144=LinkOphthalProcCpts [applied ✅]

### ▶ Next action
Done — OPHTHAL audit complete. 100 diagnoses + 105 linked proc_cpts, all verified & embedded.

### Coverage targets
| Metric | Value |
|---|---|
| Main_diags | 12 |
| Diagnoses (current) | 28 |
| Diagnoses gap to 100 | 72 |
| Proc_cpts dept-specific (current) | 0 |
| Proc_cpts gap to 100 | 100 |
| Existing alpha-code groups | none (no procs imported) |

---

## 🔬 Working notes (verification log — written incrementally, safe to keep)

### 2A — Structural scan findings
- Orphaned diagnoses (dept-linked, no main_diag): **0**
- Empty main_diags (no diagnoses): **0**
- Empty main_diags (no procs): **12** (all — no procs imported yet; resolved by Phase 2E/3)
- Arabic terminology check (دماغ→مخ etc.): **PASS** — no brain-anatomy hallucinations; all 28 Arabic fields read clean.
- Possible miscategorisations to review: (1) **conjunctivitis 9A20.0** under "eyelid pathology" — it is conjunctival/ocular-surface, not eyelid (no conjunctiva category exists; closest fit). (2) **retinoblastoma GB92.0** under "orbital pathology" — it is an intraocular/retinal malignancy, not orbital (no intraocular-tumour category exists). Both minor; will leave unless expansion adds a better home.

### 2B — ICD-11 audit findings
| icdCode (current) | icdName | Rating | Correct code | Correct ICD-11 name |
|---|---|---|---|---|
| 9B10.0 | senile cataract | ⚠️ parent→leaf | 9B10.0Z | Age-related cataract, unspecified (syn. Senile cataract) |
| 9A30.0 | corneal ulcer | ❌ WRONG | 9A76 | Corneal ulcer |
| 9A70.0 | endothelial corneal dystrophy | ✅ OK | 9A70.0 | Endothelial corneal dystrophy |
| 9A78.50 | keratoconus | ✅ OK | 9A78.50 | Keratoconus |
| 9A50.0 | diabetic retinopathy | ❌ WRONG | 9B71.0Z | Diabetic retinopathy, unspecified |
| 9A20.0 | conjunctivitis | ❌ WRONG | 9A60.Z | Conjunctivitis, unspecified |
| 9B40.0 | chalazion | ❌ WRONG | 9A02.0Z | Chalazion, unspecified |
| 9B41.0 | entropion | ❌ WRONG | 9A03.1Z | Entropion of eyelid, unspecified |
| 9B41.1 | ectropion | ❌ WRONG | 9A03.2Z | Ectropion of eyelid, unspecified |
| 9A00.0 | open-angle glaucoma | ❌ WRONG | 9C61.0Z | Primary open-angle glaucoma, unspecified |
| 9A00.1 | acute angle-closure glaucoma | ❌ WRONG | 9C61.14 | Acute angle closure with pupillary block (syn. acute angle-closure glaucoma) |
| 9B75.0 | age-related macular degeneration | ⚠️ parent→leaf | 9B75.0Z | Age-related macular degeneration, unspecified |
| 9B75.04 | neovascular age-related macular degeneration | ✅ OK | 9B75.04 | Neovascular late-stage age-related macular degeneration |
| NA06.04 | open wound of eyelid or periocular area | ✅ OK | NA06.04 | Open wound of eyelid or periocular area |
| NA06.8 | traumatic injury to eyeball | ⚠️ confirm batch 3 | NA06.8 | (Open wound/injury of eyeball — parent; verify) |
| NA06.9 | contusion of eyeball or orbital tissues | ✅ OK | NA06.9 | Contusion of eyeball or orbital tissues |
| 9A01.0 | thyroid eye disease | ❌ WRONG | 9C82.3 | Restrictive ophthalmopathy (syn. thyroid ophthalmopathy/orbitopathy) |
| GB92.0 | retinoblastoma | ❌ WRONG | 2D02.2 | Retinoblastoma |
| 9B20.0 | pterygium | ❌ WRONG | 9A61.1 | Pterygium (syn. pterygium of eye) |
| 9D00.0 | myopia | ✅ OK | 9D00.0 | Myopia |
| 9D00.1 | hypermetropia | ✅ OK | 9D00.1 | Hypermetropia |
| 9D00.2 | astigmatism | ✅ OK | 9D00.2 | Astigmatism |
| 9A40.0 | central retinal artery occlusion | ❌ WRONG | 9B74.0 | Retinal artery occlusions (Central retinal artery occlusion) |
| 9A40.1 | central retinal vein occlusion | ❌ WRONG | 9B74.1 | Retinal venous occlusions (Central retinal vein occlusion) |
| 9A81.0 | rhegmatogenous retinal detachment | ❌ WRONG | 9B73.0 | Retinal detachment with retinal break (rhegmatogenous) |
| 9B11.0 | vitreous haemorrhage | ❌ WRONG | 9B83 | Vitreous haemorrhage |
| 9C80.0 | esotropia | ✅ OK | 9C80.0 | Esotropia |
| 9C80.1 | exotropia | ✅ OK | 9C80.1 | Exotropia |
| NA06.8 | traumatic injury to eyeball | ⚠️ parent→leaf | NA06.8Z | Traumatic injury to eyeball, unspecified |

**2B tally: 28/28 verified → 10 ✅ OK · 3 ⚠️ parent→leaf · 15 ❌ WRONG (~64% corrupt).**
All ❌ are wrong-chapter-block fabrications. Corrections by block: glaucoma→9C61, conjunctiva→9A60/9A61, cornea ulcer→9A76, retinal vascular→9B74, retinal detachment→9B73, diabetic retinopathy→9B71, vitreous→9B83, macula→9B75, retinoblastoma→2D02.2 (ch.2 neoplasm), thyroid eye→9C82.3.
**Collision check needed before MIG-A**: 2D02.2 (retinoblastoma) and 9B71.0Z (diabetic retinopathy) may already exist as shared rows owned by SOC/PEDSURG/GS — verify and MERGE rather than UPDATE if so.

### 2C — CPT audit findings
N/A — no proc_cpts imported for OPHTHAL yet.

### 2D — Candidate diagnoses (planned)
_Compact log: code | EN | AR | main_diag. Full EN/AR descriptions authored inline in MIG-D. All codes ICD-11-verified via icd11_search. "In DB?" NO unless noted._

**cataract** (existing: senile cataract 9B10.0Z)
| 9B10.0Y | cortical and nuclear age-related cataract | ساد قشري ونووي مرتبط بالعمر | cataract |
| 9B10.02 | mature age-related cataract | ساد ناضج مرتبط بالعمر | cataract |
| 9B10.20 | traumatic cataract | ساد رضحي | cataract |
| 9B10.21 | diabetic cataract | ساد سكري | cataract |
| 9B10.22 | after-cataract (posterior capsule opacification) | الساد التالي (إعتام المحفظة الخلفية) | cataract |
| 9B10.2Y | complicated (secondary) cataract | ساد معقد (ثانوي) | cataract |
| LA12.1 | congenital cataract | ساد خلقي | cataract |
| 9B11.0 | aphakia | انعدام العدسة (اللاعدسية) | cataract — note: 9B11.0 freed after vitreous-haem recode |

**corneal disease & scarring** (existing: corneal ulcer 9A76, endothelial dystrophy 9A70.0, keratoconus 9A78.50)
| 9A71&XN74M | bacterial (microbial) keratitis | التهاب القرنية الجرثومي | corneal disease & scarring |
| 9A71&XN8AY | fungal keratitis | التهاب القرنية الفطري | corneal disease & scarring |
| 1F00.10 | herpes simplex keratitis | التهاب القرنية بالهربس البسيط | corneal disease & scarring |
| 9A77.Z | corneal scar or opacity | ندبة وعتامة القرنية | corneal disease & scarring |
| 9A78.8 | recurrent corneal erosion | تآكل القرنية المتكرر | corneal disease & scarring |
| 9A78.4 | corneal degeneration (incl. band keratopathy/arcus) | تنكس القرنية | corneal disease & scarring |
| 9A78.0 | corneal neovascularization (pannus) | تكوّن الأوعية الدموية في القرنية | corneal disease & scarring |

**glaucoma** (existing: POAG 9C61.0Z, acute angle-closure 9C61.14)
| 9C61.12 | primary angle-closure glaucoma | الجلوكوما الأولية مغلقة الزاوية | glaucoma |
| 9C61.00 | normal tension glaucoma | الجلوكوما سوية التوتر | glaucoma |
| 9C61.01 | ocular hypertension | ارتفاع ضغط العين | glaucoma |
| 9C61.20 | pseudoexfoliative (exfoliation) glaucoma | الجلوكوما التقشّرية الكاذبة | glaucoma |
| 9C61.21 | pigmentary glaucoma | الجلوكوما الصباغية | glaucoma |
| 9C61.29 | traumatic (post-trauma) glaucoma | الجلوكوما الرضحية | glaucoma |
| 9C61.32 | neovascular glaucoma | الجلوكوما الوعائية الحديثة التكوّن | glaucoma |
| 9C61.40 | primary congenital glaucoma | الجلوكوما الخلقية الأولية | glaucoma |

**macular degeneration** (existing: AMD 9B75.0Z, neovascular AMD 9B75.04)
| 9B75.03 | atrophic (dry) late-stage AMD / geographic atrophy | الضمور البقعي الجاف (الضموري) المتأخر | macular degeneration |
| 9B75.1 | non-traumatic macular hole | ثقب البقعة غير الرضحي | macular degeneration |
| 9B78.3Y | epiretinal membrane (macular pucker) | الغشاء فوق الشبكي (تجعّد البقعة) | macular degeneration |
| 9B75.2 | central serous chorioretinopathy | اعتلال المشيمية والشبكية المصلي المركزي | macular degeneration |
| 9B7Y | cystoid macular oedema | الوذمة البقعية الكيسية | macular degeneration |

**diabetic retinopathy** (existing: diabetic retinopathy 9B71.0Z, MERGED from TRS)
| 9B71.00 | nonproliferative diabetic retinopathy | اعتلال الشبكية السكري غير التكاثري | diabetic retinopathy |
| 9B71.01 | proliferative diabetic retinopathy | اعتلال الشبكية السكري التكاثري | diabetic retinopathy |
| 9B71.02 | diabetic macular oedema | الوذمة البقعية السكرية | diabetic retinopathy |
| 9B71.1 | hypertensive retinopathy | اعتلال الشبكية الارتفاع‑ضغطي | diabetic retinopathy |
| 9B71.2 | radiation retinopathy | اعتلال الشبكية الإشعاعي | diabetic retinopathy |
| 9B71.3 | retinopathy of prematurity | اعتلال الشبكية الخداجي | diabetic retinopathy |

**retinal detachment** (existing: CRAO 9B74.0, CRVO 9B74.1, rhegmatogenous RD 9B73.0, vitreous haem 9B83)
| 9B73.3 | serous (exudative) retinal detachment | انفصال الشبكية المصلي | retinal detachment |
| 9B73.Y | tractional retinal detachment | انفصال الشبكية الشدّي | retinal detachment |
| 9B73.4 | retinal break/tear without detachment | تمزّق الشبكية دون انفصال | retinal detachment |
| 9B70 | retinitis pigmentosa | التهاب الشبكية الصباغي | retinal detachment |
| 9B78.5 | retinal haemorrhage | نزيف الشبكية | retinal detachment |

**eyelid pathology** (existing: chalazion 9A02.0Z, entropion 9A03.1Z, ectropion 9A03.2Z; conjunctivitis 9A60.Z moves OUT to pterygium/ocular-surface)
| 9A01.3 | blepharitis (infectious/marginal) | التهاب الجفن | eyelid pathology |
| 9A01.2Z | hordeolum (stye) | شحاذ العين (دُمَّل الجفن) | eyelid pathology |
| 9A03.0Z | blepharoptosis (ptosis) | تدلّي الجفن | eyelid pathology |
| 9A03.5 | dermatochalasis of eyelid | ارتخاء جلد الجفن | eyelid pathology |
| 9A04.0 | trichiasis | داء الشعرة (انحراف الرموش) | eyelid pathology |
| 2C33 | sebaceous carcinoma of eyelid | سرطان الغدة الدهنية للجفن | eyelid pathology |

**orbital pathology** (existing: thyroid eye disease 9C82.3, retinoblastoma 2D02.2)
| 9A21.0 | orbital cellulitis | التهاب النسيج الخلوي المحجري | orbital pathology |
| 9A22.Z | idiopathic orbital inflammation (orbital pseudotumour) | الالتهاب المحجري مجهول السبب (الورم الكاذب المحجري) | orbital pathology |
| 9A11.2 | dacryocystitis | التهاب كيس الدمع | orbital pathology |
| 2D05.0 | melanoma of choroid (uveal melanoma) | الورم الميلانيني المشيمي (العنبي) | orbital pathology |
| 2A02.0Y | optic pathway glioma | الورم الدبقي للمسار البصري | orbital pathology |
| 2D04 | malignant neoplasm of orbit | ورم خبيث في المحجر | orbital pathology |

**pterygium → conjunctival & ocular-surface** (existing: pterygium 9A61.1; conjunctivitis 9A60.Z relinked IN from eyelid)
| 9A61.0 | pinguecula | ظُفَيرة الملتحمة (اللطخة الصفراء) | pterygium |
| 9A79 | keratoconjunctivitis sicca (dry eye disease) | جفاف العين (التهاب القرنية والملتحمة الجاف) | pterygium |
| 9A61.5 | subconjunctival haemorrhage | نزف تحت الملتحمة | pterygium |
| 9A60.5 | vernal keratoconjunctivitis | التهاب القرنية والملتحمة الربيعي | pterygium |

**refractive errors** (existing: myopia 9D00.0, hypermetropia 9D00.1, astigmatism 9D00.2)
| 9D00.3 | presbyopia | طول النظر الشيخوخي | refractive errors |
| 9B76 | degenerative (pathological) high myopia | قِصَر النظر التنكسي (المرضي) | refractive errors |

**strabismus** (existing: esotropia 9C80.0, exotropia 9C80.1)
| 9C81.2 | sixth (abducens) nerve palsy | شلل العصب السادس (المُبعِّد) | strabismus |
| 9C81.0Z | third (oculomotor) nerve palsy | شلل العصب الثالث (المُحرِّك للعين) | strabismus |
| 9C81.1 | fourth (trochlear) nerve palsy | شلل العصب الرابع (البَكَري) | strabismus |
| 9C84.Z | nystagmus | الرأرأة (تذبذب العين اللاإرادي) | strabismus |
| 9D46 | amblyopia | الغَمَش (كسل العين) | strabismus — **resolves CLAUDE.md open amblyopia item** |

**ocular trauma** (existing: open wound eyelid NA06.04, eyeball injury NA06.8Z, contusion NA06.9)
| NA06.84 | penetrating wound of eyeball (open globe) | جرح نافذ في مقلة العين (الكرة المفتوحة) | ocular trauma |
| 9A80 | hyphaema (anterior-chamber haemorrhage) | تَحَدُّم (نزف الحجرة الأمامية) | ocular trauma |
| NA02.21 | fracture of orbital floor (blowout) | كسر أرضية المحجر (الكسر الانفجاري) | ocular trauma |
| NA06.62 | commotio retinae | ارتجاج الشبكية | ocular trauma |
| NA06.4&XA4C02 | corneal abrasion injury | سحجة القرنية الرضحية | ocular trauma |
| NE00 | chemical/thermal burn of cornea or conjunctival sac | حرق كيميائي/حراري للقرنية أو كيس الملتحمة | ocular trauma |
| NA06.81 | retained intraocular foreign body | جسم غريب محتبس داخل العين | ocular trauma |

**add'l corneal & refractive (mini-batch 2D-3c)**
| 9A78.20 | bullous keratopathy | اعتلال القرنية الفقاعي | corneal disease & scarring |
| 9D00.4 | anisometropia | اختلاف الانكسار بين العينين | refractive errors |
| 9D01.Z | disorders of accommodation | اضطرابات المطابقة (التكيّف البصري) | refractive errors |

### 2D summary
**72 new diagnoses** specced & ICD-11-verified → final **100 diagnoses**, every category ≥5:
cataract 9 · cornea 11 · glaucoma 10 · macular degeneration 7 · diabetic retinopathy 7 · retinal detachment 9 · eyelid 9 · orbital 8 · pterygium/ocular-surface 6 · refractive 7 · strabismus 7 · ocular trauma 10.
(conjunctivitis 9A60.Z relinked eyelid→pterygium; diabetic-retinopathy row MERGED into TRS's 9B71.0Z.)
### 2E — Candidate proc_cpts (planned)
| alphaCode | numCode | EN title | AR title | EN desc | AR desc | main_diag(s) |
|---|---|---|---|---|---|---|

### Migration log
| # | File | Purpose | Status |
|---|---|---|---|
| 139 | FixOphthalIcdCodes | 14 in-place recodes + 3 parent→leaf + 1 MERGE (diabetic retinopathy→TRS 9B71.0Z) + conjunctivitis relink eyelid→pterygium | written |
| 140 | AddOphthalDiagnosesBatch1 | +35 diagnoses (cataract 8, cornea 8, glaucoma 8, macula 5, diabetic retinopathy 6) | written |
| 141 | AddOphthalDiagnosesBatch2 | +37 diagnoses (retina 5, eyelid 6, orbit 6, ocular-surface 4, refractive 4, strabismus 5, trauma 7) | written |
| 142 | ImportOphthalProcCpts1 | +48 procs (CATR 10, CORN 12, GLAU 11, RETN 15) | applied ✅ |
| 143 | ImportOphthalProcCpts2 | +56 procs (INJX 3, STRB 9, OPLT 12, LACR 6, ORBT 8, PTRY 7, REFR 4, OTRA 7) | applied ✅ |
| 144 | LinkOphthalProcCptsToMainDiags | link 104 procs + MNR → 12 main_diags | applied ✅ |

---

## Summary
| Metric | Count |
|---|---|
| Main_diags | 12 |
| Diagnoses (current) | 100 |
| Proc_cpts (linked, incl. MNR) | 105 (104 dept-specific AAPC-verified + MNR) |
| ICD-11 codes fixed (❌ wrong) | 15 |
| ICD-11 codes updated (⚠️ parent→leaf) | 3 |
| CPT codes fixed | 0 (no procs existed; 104 imported fresh) |
| Structural issues resolved | 1 (conjunctivitis relink eyelid→pterygium) + 1 cross-dept MERGE |
| New diagnoses added (this run) | 72 |
| New proc_cpts added (this run) | 104 |
| Diagnoses re-embedded | 85 (72 new + 13 recoded) |
| Proc_cpts re-embedded | 104 |

Original OPHTHAL data was **~64% corrupt** (15/28 ICD codes wrong + 3 parent→leaf). The seed used a fabricated `9A00/9A20/9A30/9A40/9A50/9A81/9B11/9B20/9B40/9B41` scheme that does not match WHO ICD-11; cornea codes (9A70.0, 9A78.50) and refractive/strabismus codes (9D00.x, 9C80.x) were the only correct blocks. OPHTHAL had **0 proc_cpts** before this audit.

## ICD-11 Changes Applied
| Old code | Old name | New code | New name | Migration |
|---|---|---|---|---|
| 9A30.0 | corneal ulcer | 9A76 | Corneal ulcer | 139 |
| 9A20.0 | conjunctivitis | 9A60.Z | Conjunctivitis, unspecified | 139 |
| 9B40.0 | chalazion | 9A02.0Z | Chalazion, unspecified | 139 |
| 9B41.0 | entropion | 9A03.1Z | Entropion of eyelid, unspecified | 139 |
| 9B41.1 | ectropion | 9A03.2Z | Ectropion of eyelid, unspecified | 139 |
| 9A00.0 | open-angle glaucoma | 9C61.0Z | Primary open-angle glaucoma, unspecified | 139 |
| 9A00.1 | acute angle-closure glaucoma | 9C61.14 | Acute angle closure with pupillary block | 139 |
| 9A01.0 | thyroid eye disease | 9C82.3 | Restrictive ophthalmopathy (thyroid orbitopathy) | 139 |
| GB92.0 | retinoblastoma | 2D02.2 | Retinoblastoma | 139 |
| 9B20.0 | pterygium | 9A61.1 | Pterygium | 139 |
| 9A40.0 | central retinal artery occlusion | 9B74.0 | Retinal artery occlusions | 139 |
| 9A40.1 | central retinal vein occlusion | 9B74.1 | Retinal venous occlusions | 139 |
| 9A81.0 | rhegmatogenous retinal detachment | 9B73.0 | Retinal detachment with retinal break | 139 |
| 9B11.0 | vitreous haemorrhage | 9B83 | Vitreous haemorrhage | 139 |
| 9A50.0 | diabetic retinopathy | 9B71.0Z | Diabetic retinopathy, unspecified (**MERGE** into TRS row) | 139 |
| 9B10.0 ⚠️ | senile cataract | 9B10.0Z | Age-related cataract, unspecified | 139 |
| 9B75.0 ⚠️ | age-related macular degeneration | 9B75.0Z | Age-related macular degeneration, unspecified | 139 |
| NA06.8 ⚠️ | traumatic injury to eyeball | NA06.8Z | Traumatic injury to eyeball, unspecified | 139 |

## CPT Changes Applied
N/A — OPHTHAL had **0 proc_cpts**; 104 dept-specific procedures were imported fresh (migrations 142–143, all AAPC-verified active, none deleted) across 12 new alpha groups: CATR, CORN, GLAU, RETN, INJX, STRB, OPLT, LACR, ORBT, PTRY, REFR, OTRA.

## Structural Fixes
**Collision check (scripts/check-ophthal.ts vs staging)**: all 28 OPHTHAL rows are OPHTHAL-only (no shared). Only MIG-A target collision = **`9B71.0Z` already owned by TRS** ("diabetic retinopathy", added in the TRS audit as a diabetes complication). So OPHTHAL `9A50.0`→`9B71.0Z` is a **MERGE** (delete OPHTHAL 9A50.0 row, relink existing 9B71.0Z to OPHTHAL + "diabetic retinopathy" main_diag). `2D02.2` (retinoblastoma) is free → simple UPDATE. All other 16 targets free.

**Planned structural relink (MIG-C)**: move **conjunctivitis** (recoded `9A60.Z`) from "eyelid pathology" → "pterygium" category, which functionally becomes the conjunctival/ocular-surface group (pterygium + conjunctivitis + pinguecula + dry eye + OSSN + subconjunctival haemorrhage). Keeps titles unchanged (no main_diag rename); fixes the conjunctiva-under-eyelid miscategorisation and brings the thin "pterygium" category to ≥5.
**retinoblastoma** stays under "orbital pathology" (no intraocular-tumour category; closest fit) — documented, not moved.

## New Diagnoses Added
72 new diagnoses across 12 categories (full code/EN/AR list in working-notes §2D; migrations 140–141). Distribution (existing + new = final): cataract 1+8=9 · cornea 3+8=11 · glaucoma 2+8=10 · macular degeneration 2+5=7 · diabetic retinopathy 1+6=7 · retinal detachment 4+5=9 · eyelid 3+6=9 · orbital 2+6=8 · pterygium/ocular-surface 2+4=6 · refractive 3+4=7 · strabismus 2+5=7 · ocular trauma 3+7=10. All ICD-11-verified via icd11_search, all embedded.

## New Proc_cpts Added
104 dept-specific AAPC-verified proc_cpts across 12 new alpha groups (migrations 142–143; full list in working-notes / migration files). CATR 10 · CORN 12 · GLAU 11 · RETN 15 · INJX 3 · STRB 9 · OPLT 12 · LACR 6 · ORBT 8 · PTRY 7 · REFR 4 · OTRA 7. Linked to the 12 main_diags + MNR by migration 144 (some dual-linked). All embedded. Two Category III codes verified active: 0402T (corneal cross-linking), 0671T (MIGS trabecular stent).

## Still-Open Items
- **None for OPHTHAL** — 100 diagnoses, 105 linked proc_cpts, 0 orphans, 0 empty categories, every main_diag ≥5 diagnoses & ≥7 procs.
- **Resolved this run**: the long-open CLAUDE.md amblyopia item — amblyopia = **9D46** (Impairment of binocular functions), added to strabismus.
- No new cross-dept mismaps discovered. Diabetic-retinopathy `9B71.0Z` is now correctly shared OPHTHAL+TRS.
- Project-wide open items unaffected: GS `2B90.Y`="Lynch syndrome"; `CA22.Z`="lung abscess" (=COPD unspecified). Remaining dept without proc_cpts: **UROL**.
