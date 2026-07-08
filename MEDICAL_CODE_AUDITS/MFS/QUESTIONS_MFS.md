# MFS Additional-Questions Audit (professor authoring — fresh)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-07-09
**Current step**: DONE
**Status**: ✅ complete

### Step status
- [x] Phase 1 — state loaded (0 questions, 0 options, 0 links, 12 main_diags — FRESH AUTHORING)
- [x] Phase 2A — N/A (fresh authoring)
- [x] Phase 2B — question set decided (7 questions: laterality, region, approach, urgency, fixationMethod, nodalSurgery, intraopEvents)
- [x] Phase 2C — option sets authored (38 options, EN+AR)
- [x] Phase 2D — link matrix + narrowing designed (37 links, 49 narrowing rows)
- [x] Phase 3 — migrations written (176 AuthorMfsAdditionalQuestions, 177 AddMfsQuestionNarrowing)
- [x] Phase 4 — applied + verified: **7 questions / 38 options / 37 links / 49 narrowing / 0 NULL arValue — exact match**; down() cycle tested (revert 177+176 → re-apply → identical); all 9 other configured depts untouched; 0 cross-dept link violations; tsc clean
- [x] Phase 5 — finalized (audit + CLAUDE.md)

### Migration numbers reserved
176=AuthorMfsAdditionalQuestions [applied ✅ 2026-07-09], 177=AddMfsQuestionNarrowing [applied ✅ 2026-07-09]

### ▶ Next action
None — audit complete. No still-open items (impacted-teeth tooth-level detail and Le Fort level granularity live in proc_cpts/surgNotes).

---

## 🔬 Working notes

### 2B — Question set (7 questions)

| key | inputType | label / arLabel | professor's rationale |
|---|---|---|---|
| `laterality` | single_choice | Side (laterality) / الجهة (أيمن / أيسر) | Reused (4 options incl. `midline` — nasal/NOE trauma, symphysis fractures, cleft palate are midline). 5 categories. |
| `region` | single_choice | Facial region / jaw / المنطقة الوجهية / الفك | THE MFS mapping question: which bone/subsite? Fracture-grade granularity for trauma (mandible condyle/angle/body, Le Fort, ZMC, orbit, NOE, frontal, panfacial) + general jaw for cysts/implants/orthognathic + the three salivary glands. 7 categories; heavily narrowed. |
| `approach` | single_choice | Surgical approach / المدخل الجراحي | MFS-native axis: **intraoral vs extraoral vs combined** (+ endoscopic-assisted for TMJ arthroscopy/subcondylar). 7 categories; skipped where intraoral is the only answer (impacted teeth, dentoalveolar, implants, orthognathic, cleft). |
| `urgency` | single_choice | Urgency of surgery / مدى إلحاح الجراحة | Canonical. Only facial trauma, jaw fractures, dentoalveolar surgery (odontogenic infections/Ludwig territory). The rest of MFS is elective. |
| `fixationMethod` | single_choice | Fixation method / طريقة التثبيت | Reused ORTHO key with MFS options: ORIF miniplates / closed reduction + MMF / ORIF+MMF / conservative / external fixation. Facial trauma + jaw fractures (the ≥2 rule). |
| `nodalSurgery` | single_choice | Lymph node surgery / جراحة العقد اللمفاوية | Reused SOC key with MFS-specific neck-dissection ladder (none / SLNB / selective / modified radical / radical). Oral cancer — THE oral-oncology question (established cross-dept key, so single-category reuse is acceptable). |
| `intraopEvents` | free_text | Intraoperative events / الأحداث أثناء العملية | Canonical; all 12; sortOrder 9. |

Skipped (justified): `surgicalDomain` (trauma/pathology/orthognathic axes duplicate the categories), `position` (supine with head ring — invariant), `clinicalPresentation` (preOpClinCond exists), `ageGroup` (cleft timing is protocolized; single-category).

Question sortOrder: laterality 0, region 1, approach 2, urgency 3, fixationMethod 4, nodalSurgery 5, intraopEvents 9.

### 2C — Option sets (38 options, EN + AR)

`laterality` (4): right أيمن · left أيسر · bilateral ثنائي الجانب · midline خط الوسط

`region` (15): mandible - condyle / subcondylar الفك السفلي - اللقمة / تحت اللقمة · mandible - angle / ramus الفك السفلي - الزاوية / الفرع · mandible - body / symphysis الفك السفلي - الجسم / الارتفاق · maxilla (le fort) الفك العلوي (لوفور) · zygomaticomaxillary complex المركب الوجني الفكي · orbital floor / rim أرضية / حافة الحجاج · nasal / naso-orbito-ethmoid الأنف / الأنفي الحجاجي الغربالي · frontal bone / sinus العظم الجبهي / الجيب الجبهي · panfacial كسور وجهية شاملة · maxilla الفك العلوي · mandible الفك السفلي · bimaxillary الفكان معًا · parotid gland الغدة النكفية · submandibular gland الغدة تحت الفك السفلي · sublingual / minor glands الغدة تحت اللسان / الغدد الصغرى

`approach` (5): intraoral داخل الفم · extraoral (transcervical / facial) خارج الفم (عبر الرقبة / الوجه) · combined intraoral + extraoral مشترك داخل وخارج الفم · endoscopic-assisted بمساعدة المنظار · other أخرى

`urgency` (3): elective اختياري (مجدول) · urgent عاجل · emergency طارئ

`fixationMethod` (6): orif - miniplates / screws تثبيت داخلي مفتوح - شرائح مصغرة ومسامير · closed reduction + mmf رد مغلق + تثبيت بين الفكين (MMF) · orif + mmf تثبيت داخلي + تثبيت بين الفكين · conservative / no fixation تحفظي / بدون تثبيت · external fixation مثبت خارجي · other أخرى

`nodalSurgery` (5): none بدون · sentinel lymph node biopsy خزعة العقدة الحارسة · selective neck dissection تشريح رقبي انتقائي · modified radical neck dissection تشريح رقبي جذري معدل · radical neck dissection تشريح رقبي جذري

### 2D — Link matrix (37 links) + narrowing (49 rows)

| category | lat | region | appr | urg | fix | nodal | ie | n |
|---|---|---|---|---|---|---|---|---|
| benign oral tumors | | | ✓ | | | | ✓ | 2 |
| cleft lip & palate | ✓ | | | | | | ✓ | 2 |
| dental implants | | ✓ | | | | | ✓ | 2 |
| dentoalveolar surgery | | | | ✓ | | | ✓ | 2 |
| facial trauma | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | 6 |
| impacted teeth | | ✓ | | | | | ✓ | 2 |
| jaw cysts & pathology | | ✓ | ✓ | | | | ✓ | 3 |
| jaw fractures | ✓ | ✓ | ✓ | ✓ | ✓ | | ✓ | 6 |
| oral cancer | | | ✓ | | | ✓ | ✓ | 3 |
| orthognathic surgery | | ✓ | | | | | ✓ | 2 |
| salivary gland pathology | ✓ | ✓ | ✓ | | | | ✓ | 4 |
| temporomandibular joint disorders | ✓ | | ✓ | | | | ✓ | 3 |

Per-question: laterality 5 · region 7 · approach 7 · urgency 3 · fixationMethod 2 · nodalSurgery 1 · intraopEvents 12 → **Σ 37**.

`region` narrowing (22): facial trauma → ZMC, orbital floor / rim, nasal / NOE, frontal, maxilla (le fort), panfacial (6) · jaw fractures → mandible condyle, angle/ramus, body/symphysis, maxilla (le fort) (4) · jaw cysts → maxilla, mandible (2) · impacted teeth → maxilla, mandible (2) · dental implants → maxilla, mandible (2) · orthognathic → maxilla, mandible, bimaxillary (3) · salivary → parotid, submandibular, sublingual / minor (3)

`approach` narrowing (17): TMJ → endoscopic-assisted, extraoral, other (3) · salivary → extraoral, intraoral, other (3) · oral cancer → intraoral, combined, extraoral, other (4) · benign oral tumors → intraoral, extraoral, combined, other (4) · jaw cysts → intraoral, extraoral, other (3). Facial trauma & jaw fractures un-narrowed (all 5 real incl. endoscopic-assisted subcondylar).

`laterality` narrowing (6): TMJ → right, left, bilateral (3) · salivary → right, left, bilateral (3). Facial trauma / jaw fractures / cleft un-narrowed (midline is real: NOE, symphysis, cleft palate).

`fixationMethod` narrowing (4): facial trauma → orif - miniplates / screws, conservative / no fixation, external fixation, other (midface doesn't get MMF-primary). Jaw fractures un-narrowed (all 6 real).

Σ narrowing = 22 + 17 + 6 + 4 = **49**.

### Expected totals after 176+177
questions **7** · options **38** · links **37** · narrowing **49** · NULL arValue **0**

### Migration log
| # | name | status |
|---|---|---|
| 1750000000176 | AuthorMfsAdditionalQuestions | applied ✅ (2026-07-09) |
| 1750000000177 | AddMfsQuestionNarrowing | applied ✅ (2026-07-09) |

### Final verification (staging, 2026-07-09)
- MFS: questions=7, options=38, links=37, narrowing=49, NULL arValue=0 — exact match with 2D.
- All 12 categories covered (≥2 questions each); region narrowed per category (orthognathic → maxilla/mandible/bimaxillary; salivary → the 3 glands; trauma gets fracture-grade subsites).
- down() tested: revert 177+176 → re-apply → identical counts. All 9 other configured depts untouched; 0 cross-dept link violations. `npx tsc --noEmit` clean.
- Cross-dept key reuse heavy: laterality (+midline), region, approach (MFS-native intraoral/extraoral options), urgency, fixationMethod (ORTHO key, MFS miniplate/MMF options), nodalSurgery (SOC key, neck-dissection ladder), intraopEvents. **Zero new keys** — first dept fully composed from established keys.
