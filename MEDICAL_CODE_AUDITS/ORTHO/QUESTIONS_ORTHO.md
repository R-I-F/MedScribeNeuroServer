# ORTHO Additional-Questions Audit (professor authoring — fresh)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-07-09
**Current step**: DONE
**Status**: ✅ complete

### Step status
- [x] Phase 1 — state loaded (0 questions, 0 options, 0 links, 17 main_diags — FRESH AUTHORING)
- [x] Phase 2A — N/A (fresh authoring)
- [x] Phase 2B — question set decided (8 questions: laterality, position, approach, region, urgency, fixationMethod, fractureType, intraopEvents)
- [x] Phase 2C — option sets authored (47 options, EN+AR)
- [x] Phase 2D — link matrix + narrowing designed (65 links, 102 narrowing rows)
- [x] Phase 3 — migrations written (164 AuthorOrthoAdditionalQuestions, 165 AddOrthoQuestionNarrowing)
- [x] Phase 4 — applied + verified: **8 questions / 47 options / 65 links / 102 narrowing / 0 NULL arValue — exact match**; down() cycle tested (revert 165+164 → re-apply → identical); GS/CTS/NS untouched; 0 cross-dept link violations; tsc clean
- [x] Phase 5 — finalized (audit + CLAUDE.md)

### Migration numbers reserved
164=AuthorOrthoAdditionalQuestions [applied ✅ 2026-07-09], 165=AddOrthoQuestionNarrowing [applied ✅ 2026-07-09]

### ▶ Next action
None — audit complete. Every category has ≥2 deliberate questions (stenosis/spondylolisthesis minimal by design: elective, axial, approach+events only).

---

## 🔬 Working notes

### 2B — Question set (8 questions)

| key | inputType | label / arLabel | professor's rationale |
|---|---|---|---|
| `laterality` | single_choice | Side (laterality) / الجهة (أيمن / أيسر) | NEW ORTHO key — THE universal orthopaedic axis; never encoded in the diagnosis (which side's ACL? which femur?). 14 categories (all except the 3 axial spine ones). |
| `position` | single_choice | Patient position / وضعية المريض | Canonical. Real viva material where it varies: beach chair vs lateral for shoulder, traction table for femoral nailing, supine vs lateral for THR. Only those 3 categories. |
| `approach` | single_choice | Surgical approach / المدخل الجراحي | Canonical. The ortho discriminator is open vs arthroscopic vs percutaneous vs MIS — not per-joint eponymous approaches (too granular for a logbook dropdown). NOT linked to fracture categories (redundant with fixationMethod: ORIF=open, k-wires=percutaneous) nor bone tumours (open always). |
| `region` | single_choice | Bone / joint involved / العظم / المفصل المصاب | Canonical. Only where the diagnosis does NOT encode the site: bone tumours, osteomyelitis & septic joint, osteonecrosis. (Fracture diagnoses already name the bone.) |
| `urgency` | single_choice | Urgency of surgery / مدى إلحاح الجراحة | Canonical (3 options). Only the 8 categories with a real urgent/emergency share (fractures ×4, osteomyelitis/septic joint, paediatric [SUFE/septic hip], foot & ankle [ankle fx], bone tumours [impending fracture]). Elective-only categories (ACL, CTS, OA, rotator cuff, stenosis…) skip it — one-answer question. |
| `fixationMethod` | single_choice | Fixation method / طريقة التثبيت | NEW ORTHO key — "how did you fix it?" is THE fracture viva. 6 categories (fractures ×4, foot & ankle, paediatric). |
| `fractureType` | single_choice | Fracture type (closed / open) / نوع الكسر (مغلق / مفتوح) | NEW ORTHO key — closed vs open with Gustilo grade; drives antibiotics/debridement/fixation decisions. Upper + lower extremity fractures only (spine/pathologic fractures are near-uniformly closed). |
| `intraopEvents` | free_text | Intraoperative events / الأحداث أثناء العملية | Canonical; all 17; sortOrder 9 (renders last). |

Skipped (justified): `surgicalDomain` — trauma/elective and anatomical axes duplicate urgency and the categories themselves. `clinicalPresentation` — submissions already carry `preOpClinCond` (GS precedent).

Question sortOrder: laterality 0, position 1, approach 2, region 3, urgency 4, fixationMethod 5, fractureType 6, intraopEvents 9.

### 2C — Option sets (47 options, EN + AR)

`laterality` (3): right أيمن · left أيسر · bilateral ثنائي الجانب

`position` (6): supine استلقاء على الظهر · prone انبطاح على البطن · lateral decubitus استلقاء جانبي · beach chair وضعية كرسي الشاطئ · traction (fracture) table طاولة الجر (طاولة الكسور) · other أخرى

`approach` (6): open مفتوح · arthroscopic بمنظار المفصل · arthroscopic-assisted mini-open بمساعدة المنظار - فتح مصغر · percutaneous عن طريق الجلد · minimally invasive (tubular / endoscopic) طفيف التوغل (أنبوبي / منظاري) · other أخرى

`region` (12): femur عظم الفخذ · tibia / fibula الظنبوب / الشظية · humerus عظم العضد · radius / ulna الكعبرة / الزند · hand bones عظام اليد · foot bones عظام القدم · pelvis الحوض · spine العمود الفقري · shoulder joint مفصل الكتف · hip joint مفصل الورك · knee joint مفصل الركبة · ankle joint مفصل الكاحل

`urgency` (3): elective اختياري (مجدول) · urgent عاجل · emergency طارئ

`fixationMethod` (11): closed reduction + cast / splint رد مغلق + جبس / جبيرة · percutaneous k-wires أسلاك كيرشنر عبر الجلد · orif - plate & screws تثبيت داخلي مفتوح - شريحة ومسامير · intramedullary nail مسمار نخاعي · external fixator مثبت خارجي · tension band wiring ربط سلكي شدّي · spinal instrumentation (pedicle screws) تثبيت فقري (مسامير عنيقية) · vertebroplasty / kyphoplasty (cement) رأب الفقرة بالأسمنت الطبي · hemiarthroplasty استبدال مفصل جزئي · total joint replacement استبدال مفصل كلي · other أخرى

`fractureType` (6): closed مغلق · open - gustilo i مفتوح - جوستيلو الدرجة الأولى · open - gustilo ii مفتوح - جوستيلو الدرجة الثانية · open - gustilo iiia مفتوح - جوستيلو 3أ · open - gustilo iiib مفتوح - جوستيلو 3ب · open - gustilo iiic مفتوح - جوستيلو 3ج

### 2D — Link matrix (65 links) + narrowing (102 rows)

| category | lat | pos | appr | region | urg | fix | fxType | ie | n |
|---|---|---|---|---|---|---|---|---|---|
| anterior cruciate ligament injury | ✓ | | ✓ | | | | | ✓ | 3 |
| bone tumours | ✓ | | | ✓ | ✓ | | | ✓ | 4 |
| carpal tunnel syndrome | ✓ | | ✓ | | | | | ✓ | 3 |
| foot & ankle disorders | ✓ | | ✓ | | ✓ | ✓ | | ✓ | 5 |
| fractures (lower extremity) | ✓ | ✓ | | | ✓ | ✓ | ✓ | ✓ | 6 |
| fractures (spine) | | | | | ✓ | ✓ | | ✓ | 3 |
| fractures (upper extremity) | ✓ | | | | ✓ | ✓ | ✓ | ✓ | 5 |
| hand & wrist disorders | ✓ | | ✓ | | | | | ✓ | 3 |
| meniscal tears | ✓ | | ✓ | | | | | ✓ | 3 |
| osteoarthritis | ✓ | ✓ | ✓ | | | | | ✓ | 4 |
| osteomyelitis & septic joint | ✓ | | ✓ | ✓ | ✓ | | | ✓ | 5 |
| osteonecrosis | ✓ | | ✓ | ✓ | | | | ✓ | 4 |
| paediatric & developmental conditions | ✓ | | ✓ | | ✓ | ✓ | | ✓ | 5 |
| pathologic fractures | ✓ | | | | ✓ | ✓ | | ✓ | 4 |
| rotator cuff pathology | ✓ | ✓ | ✓ | | | | | ✓ | 4 |
| spinal stenosis | | | ✓ | | | | | ✓ | 2 |
| spondylolisthesis | | | ✓ | | | | | ✓ | 2 |

Per-question: laterality 14 · position 3 · approach 12 · region 3 · urgency 8 · fixationMethod 6 · fractureType 2 · intraopEvents 17 → **Σ 65**.

`approach` narrowing (42): ACL → arthroscopic, mini-open, open, other (4) · carpal tunnel → open, MIS(endoscopic), other (3) · foot & ankle → open, arthroscopic, percutaneous, MIS, other (5) · hand & wrist → open, arthroscopic, percutaneous, other (4) · meniscal → arthroscopic, open, other (3) · OA → open, MIS, other (3) · osteomyelitis → open, arthroscopic, percutaneous, other (4) · osteonecrosis → open, percutaneous, other (3) · paediatric → open, percutaneous, other (3) · rotator cuff → arthroscopic, mini-open, open, other (4) · stenosis → open, MIS, other (3) · spondylolisthesis → open, MIS, other (3)

`region` narrowing (13): bone tumours → femur, tibia / fibula, humerus, radius / ulna, pelvis, spine, hand bones, foot bones (8) · osteonecrosis → hip joint, shoulder joint, knee joint, ankle joint, hand bones (5) · osteomyelitis & septic joint → **no narrowing** (all 12 bones+joints legitimately apply)

`position` narrowing (10): fx lower → supine, traction table, lateral decubitus, other (4) · OA → supine, lateral decubitus, other (3) · rotator cuff → beach chair, lateral decubitus, other (3)

`fixationMethod` narrowing (37): fx spine → spinal instrumentation, vertebroplasty/kyphoplasty, closed reduction + cast / splint, other (4) · fx lower → cast, k-wires, plate & screws, im nail, ex-fix, tension band, hemiarthroplasty, total joint replacement, other (9) · fx upper → cast, k-wires, plate & screws, im nail, ex-fix, tension band, hemiarthroplasty, other (8) · pathologic fx → im nail, plate & screws, hemiarthroplasty, total joint replacement, other (5) · foot & ankle → plate & screws, k-wires, cast, ex-fix, other (5) · paediatric → cast, k-wires, ex-fix, plate & screws, im nail, other (6)

Σ narrowing = 42 + 13 + 10 + 37 = **102**.

### Expected totals after 164+165
questions **8** · options **47** · links **65** · narrowing **102** · NULL arValue **0**

### Migration log
| # | name | status |
|---|---|---|
| 1750000000164 | AuthorOrthoAdditionalQuestions | applied ✅ (2026-07-09) |
| 1750000000165 | AddOrthoQuestionNarrowing | applied ✅ (2026-07-09) |

### Final verification (staging, 2026-07-09)
- ORTHO: questions=8, options=47, links=65, narrowing=102, NULL arValue=0 — exact match with 2D.
- All 17 categories covered; laterality on all 14 non-axial; fixationMethod narrowed per fracture pattern (spine gets pedicle screws/cement, never hemiarthroplasty; upper never gets total joint replacement).
- down() tested: revert 165+164 → re-apply → identical counts. GS (6/34/56/65), CTS (6/39/83/99), NS (6/26/14/0) untouched; 0 cross-dept link violations. `npx tsc --noEmit` clean.
- Cross-dept key reuse: approach/region/position/urgency/intraopEvents; new ORTHO keys `laterality`, `fixationMethod`, `fractureType` justified in 2B (laterality is a strong candidate for reuse in OPHTHAL/ENT/UROL/VASC audits).
