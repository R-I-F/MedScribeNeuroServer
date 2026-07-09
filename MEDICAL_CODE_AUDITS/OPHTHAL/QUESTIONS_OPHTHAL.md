# OPHTHAL Additional-Questions Audit (professor authoring — fresh)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-07-09
**Current step**: DONE
**Status**: ✅ complete

### Step status
- [x] Phase 1 — state loaded (0 questions, 0 options, 0 links, 12 main_diags — FRESH AUTHORING)
- [x] Phase 2A — N/A (fresh authoring)
- [x] Phase 2B — question set decided (4 questions: laterality, anesthesiaType, urgency, intraopEvents)
- [x] Phase 2C — option sets authored (14 options, EN+AR)
- [x] Phase 2D — link matrix + narrowing designed (39 links, 47 narrowing rows)
- [x] Phase 3 — migrations written (184 AuthorOphthalAdditionalQuestions, 185 AddOphthalQuestionNarrowing)
- [x] Phase 4 — applied + verified: **4 questions / 14 options / 39 links / 47 narrowing / 0 NULL arValue — exact match**; down() cycle tested (revert 185+184 → re-apply → identical); all 13 other configured depts untouched; 0 cross-dept link violations; tsc clean
- [x] Phase 5 — finalized (audit + CLAUDE.md)

### Migration numbers reserved
184=AuthorOphthalAdditionalQuestions [applied ✅ 2026-07-09], 185=AddOphthalQuestionNarrowing [applied ✅ 2026-07-09]

### ▶ Next action
None — audit complete. Still-open (documented in 2B): open-globe zone, corneal graft type, orbital-tumour intent — single-category keys deferred.

---

## 🔬 Working notes

**Design principle**: ophthalmology's specific operation (phaco / trabeculectomy / vitrectomy / LASIK …) is fully captured by proc_cpts. The additional questions must therefore be the axes proc_cpts DON'T carry: which eye, anaesthesia, urgency, complications. A "technique" question would duplicate proc_cpts, so it is deliberately omitted. This yields a lean but non-redundant 4-question set — richness comes from anesthesiaType (an 8-option ophthalmic-specific axis) + heavy per-category narrowing.

### 2B — Question set (4 questions)

| key | inputType | label / arLabel | professor's rationale |
|---|---|---|---|
| `laterality` | single_choice | Eye (laterality) / العين (يمنى / يسرى) | Reused. THE universal ophthalmic descriptor — which eye. All 12 categories (bilateral is real: ISBCS cataract, bilateral refractive, bilateral orbital decompression). |
| `anesthesiaType` | single_choice | Anaesthesia type / نوع التخدير | NEW OPHTHAL key — the standout ophthalmic axis (topical vs block vs GA is a core viva point). 8 options span surface/lid/orbital-block/GA. 11 categories (skipped for refractive — always topical). |
| `urgency` | single_choice | Urgency of surgery / مدى إلحاح الجراحة | Canonical (3 options). The ophthalmic emergencies: ocular trauma (open globe), retinal detachment (mac-on), orbital pathology (compartment/cellulitis), glaucoma (acute angle closure). 4 categories. |
| `intraopEvents` | free_text | Intraoperative events / الأحداث أثناء العملية | Canonical; all 12; the ophthalmic-complication narrative (posterior capsule rupture, vitreous loss, suprachoroidal haemorrhage). sortOrder 9. |

Skipped (justified): `approach`/technique (duplicates proc_cpts — the operation IS the technique), `surgicalDomain` (anterior/posterior segment duplicates the categories), `position` (supine invariant), `region` (each category is pinned to a structure by name), `clinicalPresentation` (preOpClinCond exists). Only 1 new key.

**Still-open (deferred single-category):** ocular-trauma open-globe zone (I/II/III); corneal graft type PK/DALK/DSAEK/DMEK (= proc_cpt technique anyway); orbital-tumour surgical intent (biopsy/excision/exenteration).

Question sortOrder: laterality 0, anesthesiaType 1, urgency 2, intraopEvents 9.

### 2C — Option sets (14 options, EN + AR)

`laterality` (3): right أيمن · left أيسر · bilateral ثنائي الجانب

`anesthesiaType` (8): topical موضعي (بالقطرة) · subconjunctival تحت الملتحمة · local infiltration تسلل موضعي (حقن) · sub-tenon تحت محفظة تينون · peribulbar حول المقلة · retrobulbar خلف المقلة · general anaesthesia تخدير عام · other أخرى

`urgency` (3): elective اختياري (مجدول) · urgent عاجل · emergency طارئ

### 2D — Link matrix (39 links) + narrowing (47 rows)

| category | lat | anaes | urg | ie | n |
|---|---|---|---|---|---|
| cataract | ✓ | ✓ | | ✓ | 3 |
| corneal disease & scarring | ✓ | ✓ | | ✓ | 3 |
| diabetic retinopathy | ✓ | ✓ | | ✓ | 3 |
| eyelid pathology | ✓ | ✓ | | ✓ | 3 |
| glaucoma | ✓ | ✓ | ✓ | ✓ | 4 |
| macular degeneration | ✓ | ✓ | | ✓ | 3 |
| ocular trauma | ✓ | ✓ | ✓ | ✓ | 4 |
| orbital pathology | ✓ | ✓ | ✓ | ✓ | 4 |
| pterygium | ✓ | ✓ | | ✓ | 3 |
| refractive errors | ✓ | | | ✓ | 2 |
| retinal detachment | ✓ | ✓ | ✓ | ✓ | 4 |
| strabismus | ✓ | ✓ | | ✓ | 3 |

**refractive errors = laterality + intraopEvents only**: LASIK/PRK/SMILE are topical by definition, so anesthesiaType is non-discriminating and omitted.

Per-question: laterality 12 · anesthesiaType 11 · urgency 4 · intraopEvents 12 → **Σ 39**.

`anesthesiaType` narrowing (47) — the surface/lid/orbital-block/GA distinction per category:
| category | allowed (n) |
|---|---|
| cataract | topical, sub-tenon, peribulbar, general anaesthesia, other (5) |
| corneal disease & scarring | topical, peribulbar, sub-tenon, general anaesthesia, other (5) |
| diabetic retinopathy | topical, sub-tenon, peribulbar, retrobulbar, general anaesthesia, other (6) |
| eyelid pathology | local infiltration, general anaesthesia, other (3) |
| glaucoma | topical, sub-tenon, peribulbar, general anaesthesia, other (5) |
| macular degeneration | topical, subconjunctival, sub-tenon, other (4) |
| ocular trauma | general anaesthesia, peribulbar, other (3) |
| orbital pathology | general anaesthesia, local infiltration, other (3) |
| pterygium | topical, subconjunctival, sub-tenon, peribulbar, other (5) |
| retinal detachment | peribulbar, retrobulbar, sub-tenon, general anaesthesia, other (5) |
| strabismus | general anaesthesia, sub-tenon, other (3) |

laterality un-narrowed (bilateral is clinically real in every category); urgency un-narrowed (elective/urgent/emergency all plausible for the 4 linked categories). Σ narrowing = **47**.

### Expected totals after 184+185
questions **4** · options **14** · links **39** · narrowing **47** · NULL arValue **0**

### Migration log
| # | name | status |
|---|---|---|
| 1750000000184 | AuthorOphthalAdditionalQuestions | applied ✅ (2026-07-09) |
| 1750000000185 | AddOphthalQuestionNarrowing | applied ✅ (2026-07-09) |

### Final verification (staging, 2026-07-09)
- OPHTHAL: questions=4, options=14, links=39, narrowing=47, NULL arValue=0 — exact match with 2D.
- All 12 categories covered (≥2 questions each); anesthesiaType narrowed per category (eyelid/orbital = local infiltration/GA; intraocular = topical/blocks; strabismus = GA); refractive = laterality+intraopEvents only (topical by definition).
- down() tested: revert 185+184 → re-apply → identical counts. All 13 other configured depts untouched; 0 cross-dept link violations. `npx tsc --noEmit` clean.
- Cross-dept key reuse: laterality/urgency/intraopEvents; new OPHTHAL key `anesthesiaType` justified in 2B. Technique deliberately omitted (proc_cpts carry it).
