# ENT Additional-Questions Audit (professor authoring — fresh)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-07-09
**Current step**: DONE
**Status**: ✅ complete

### Step status
- [x] Phase 1 — state loaded (0 questions, 0 options, 0 links, 13 main_diags — FRESH AUTHORING)
- [x] Phase 2A — N/A (fresh authoring)
- [x] Phase 2B — question set decided (8 questions: approach, laterality, region, urgency, surgicalIntent, nodalSurgery, neoadjuvant, intraopEvents — ALL reused keys, zero new)
- [x] Phase 2C — option sets authored (35 options, EN+AR)
- [x] Phase 2D — link matrix + narrowing designed (39 links, 38 narrowing rows)
- [x] Phase 3 — migrations written (182 AuthorEntAdditionalQuestions, 183 AddEntQuestionNarrowing)
- [x] Phase 4 — applied + verified: **8 questions / 35 options / 39 links / 38 narrowing / 0 NULL arValue — exact match**; down() cycle tested (revert 183+182 → re-apply → identical); all 12 other configured depts untouched; 0 cross-dept link violations; tsc clean
- [x] Phase 5 — finalized (audit + CLAUDE.md)

### Migration numbers reserved
182=AuthorEntAdditionalQuestions [applied ✅ 2026-07-09], 183=AddEntQuestionNarrowing [applied ✅ 2026-07-09]

### ▶ Next action
None — audit complete. Still-open (documented in 2B): tympanoplasty graft material, OSA surgery level, hearing-loss device type — single-category keys deferred.

---

## 🔬 Working notes

ENT = ear (hearing loss, mastoiditis, otitis media w/ effusion, TM perforation) · nose/sinus (chronic sinusitis, deviated septum, nasal polyps) · throat/airway (laryngeal pathology, OSA, tonsillitis & adenoids) · head & neck (H&N cancer, salivary gland, thyroid & parathyroid). **Second all-reuse department** (after MFS) — every key already exists.

### 2B — Question set (8 questions, all reused keys)

| key | inputType | label / arLabel | professor's rationale |
|---|---|---|---|
| `approach` | single_choice | Surgical approach / المدخل الجراحي | THE ENT axis, subsite-specific: endonasal / transoral / transcervical / transcanal / postauricular / direct laryngoscopy / external. 12 categories; heavily narrowed. |
| `laterality` | single_choice | Side (laterality) / الجهة (أيمن / أيسر) | Ear + salivary + thyroid lobe. 6 categories. |
| `region` | single_choice | Tumour subsite / الموضع التشريحي للورم | Reused canonical key. Head & neck cancer subsite (oral cavity/oropharynx/larynx/hypopharynx/nasopharynx) — THE H&N staging axis. 1 category (essential single-category reuse). |
| `urgency` | single_choice | Urgency of surgery / مدى إلحاح الجراحة | Airway/infective emergencies: mastoiditis (acute coalescent), laryngeal pathology (airway), head & neck cancer (airway/tracheostomy). 3 categories. |
| `surgicalIntent` | single_choice | Surgical intent / الهدف من الجراحة | Reused SOC key. Head & neck cancer. |
| `nodalSurgery` | single_choice | Lymph node surgery / جراحة العقد اللمفاوية | Reused MFS neck-dissection ladder. Head & neck cancer + thyroid & parathyroid (central/lateral neck). 2 categories. |
| `neoadjuvant` | single_choice | Neoadjuvant therapy received / العلاج المساعد قبل الجراحة | Reused SOC key. Head & neck cancer (induction chemo / chemoradiation). |
| `intraopEvents` | free_text | Intraoperative events / الأحداث أثناء العملية | Canonical; all 13; sortOrder 9. |

Skipped (justified): `surgicalDomain` (ear/nose/throat/neck axis duplicates the categories), `position` (supine ± head-turn, invariant), `clinicalPresentation` (preOpClinCond exists). No new keys created.

**Still-open (deferred single-category):** tympanoplasty graft material (fascia/cartilage); OSA surgery level (nasal/palatal/hypopharyngeal); hearing-loss device type (stapes prosthesis / cochlear implant / BAHA).

Question sortOrder: approach 0, laterality 1, region 2, urgency 3, surgicalIntent 4, nodalSurgery 5, neoadjuvant 6, intraopEvents 9.

### 2C — Option sets (35 options, EN + AR)

`approach` (8): endoscopic (endonasal) بالمنظار (عبر الأنف) · transoral عبر الفم · transcervical (open neck) عبر الرقبة (فتح رقبي) · transcanal عبر قناة الأذن · postauricular خلف الأذن · direct laryngoscopy / microlaryngoscopy تنظير الحنجرة المباشر / المجهري · external / open خارجي / مفتوح · other أخرى

`laterality` (3): right أيمن · left أيسر · bilateral ثنائي الجانب

`region` (5): oral cavity تجويف الفم · oropharynx البلعوم الفموي · larynx الحنجرة · hypopharynx البلعوم السفلي · nasopharynx البلعوم الأنفي

`urgency` (3): elective اختياري (مجدول) · urgent عاجل · emergency طارئ

`surgicalIntent` (5): curative (radical) شافٍ (جذري) · palliative تلطيفي · diagnostic / staging تشخيصي / تحديد المرحلة · cytoreductive (debulking) اختزال الورم (استئصال جزئي) · prophylactic (risk-reducing) وقائي (خفض الخطورة)

`nodalSurgery` (5): none بدون · sentinel lymph node biopsy خزعة العقدة الحارسة · selective neck dissection تشريح رقبي انتقائي · modified radical neck dissection تشريح رقبي جذري معدل · radical neck dissection تشريح رقبي جذري

`neoadjuvant` (6): none بدون · chemotherapy علاج كيميائي · radiotherapy علاج إشعاعي · chemoradiotherapy علاج كيميائي إشعاعي · immunotherapy / targeted therapy علاج مناعي / موجه · hormonal therapy علاج هرموني

### 2D — Link matrix (39 links) + narrowing (38 rows)

| category | appr | lat | region | urg | intent | nodal | neo | ie | n |
|---|---|---|---|---|---|---|---|---|---|
| chronic sinusitis | ✓ | | | | | | | ✓ | 2 |
| deviated septum | ✓ | | | | | | | ✓ | 2 |
| head & neck cancer | ✓ | | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 7 |
| hearing loss | ✓ | ✓ | | | | | | ✓ | 3 |
| laryngeal pathology | ✓ | | | ✓ | | | | ✓ | 3 |
| mastoiditis | ✓ | ✓ | | ✓ | | | | ✓ | 4 |
| nasal polyps | ✓ | | | | | | | ✓ | 2 |
| obstructive sleep apnea | ✓ | | | | | | | ✓ | 2 |
| otitis media with effusion | | ✓ | | | | | | ✓ | 2 |
| salivary gland disease | ✓ | ✓ | | | | | | ✓ | 3 |
| thyroid & parathyroid diseases | ✓ | ✓ | | | | ✓ | | ✓ | 4 |
| tonsillitis & adenoid hypertrophy | ✓ | | | | | | | ✓ | 2 |
| tympanic membrane perforation | ✓ | ✓ | | | | | | ✓ | 3 |

**otitis media with effusion = laterality + intraopEvents only**: grommet insertion is transcanal by definition (approach single-answer, omitted).

Per-question: approach 12 · laterality 6 · region 1 · urgency 3 · surgicalIntent 1 · nodalSurgery 2 · neoadjuvant 1 · intraopEvents 13 → **Σ 39**.

`approach` narrowing (35): hearing loss → transcanal, postauricular, other (3) · mastoiditis → postauricular, transcanal, other (3) · tympanic membrane perforation → transcanal, postauricular, other (3) · chronic sinusitis → endoscopic (endonasal), external / open, other (3) · deviated septum → endoscopic (endonasal), other (2) · nasal polyps → endoscopic (endonasal), other (2) · laryngeal pathology → direct laryngoscopy / microlaryngoscopy, transoral, transcervical (open neck), other (4) · obstructive sleep apnea → transoral, endoscopic (endonasal), other (3) · tonsillitis & adenoid hypertrophy → transoral, other (2) · head & neck cancer → transoral, transcervical (open neck), endoscopic (endonasal), external / open, other (5) · salivary gland disease → transcervical (open neck), transoral, other (3) · thyroid & parathyroid diseases → transcervical (open neck), other (2)

`nodalSurgery` narrowing (3): thyroid & parathyroid diseases → none, selective neck dissection, modified radical neck dissection (3) — no SLNB / radical for thyroid. head & neck cancer un-narrowed (all 5).

laterality / region / urgency / surgicalIntent / neoadjuvant un-narrowed. Σ narrowing = 35 + 3 = **38**.

### Expected totals after 182+183
questions **8** · options **35** · links **39** · narrowing **38** · NULL arValue **0**

### Migration log
| # | name | status |
|---|---|---|
| 1750000000182 | AuthorEntAdditionalQuestions | applied ✅ (2026-07-09) |
| 1750000000183 | AddEntQuestionNarrowing | applied ✅ (2026-07-09) |

### Final verification (staging, 2026-07-09)
- ENT: questions=8, options=35, links=39, narrowing=38, NULL arValue=0 — exact match with 2D.
- All 13 categories covered (≥2 questions each); approach narrowed per subsite (ear=transcanal/postauricular, sinus=endonasal, thyroid=transcervical); thyroid nodalSurgery narrowed away from SLNB.
- down() tested: revert 183+182 → re-apply → identical counts. All 12 other configured depts untouched; 0 cross-dept link violations. `npx tsc --noEmit` clean.
- **Zero new keys — second all-reuse department** (after MFS). Cross-dept reuse: approach/laterality/region/urgency/intraopEvents + surgicalIntent/neoadjuvant (SOC) + nodalSurgery (MFS neck-dissection ladder).
