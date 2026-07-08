# VASC Additional-Questions Audit (professor authoring — fresh)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-07-09
**Current step**: DONE
**Status**: ✅ complete

### Step status
- [x] Phase 1 — state loaded (0 questions, 0 options, 0 links, 12 main_diags — FRESH AUTHORING)
- [x] Phase 2A — N/A (fresh authoring)
- [x] Phase 2B — question set decided (6 questions: laterality, approach, region, urgency, graftType, intraopEvents)
- [x] Phase 2C — option sets authored (31 options, EN+AR)
- [x] Phase 2D — link matrix + narrowing designed (55 links, 57 narrowing rows)
- [x] Phase 3 — migrations written (168 AuthorVascAdditionalQuestions, 169 AddVascQuestionNarrowing)
- [x] Phase 4 — applied + verified: **6 questions / 31 options / 55 links / 57 narrowing / 0 NULL arValue — exact match**; down() cycle tested (revert 169+168 → re-apply → identical); PRS/ORTHO/GS/CTS/NS untouched; 0 cross-dept link violations; tsc clean
- [x] Phase 5 — finalized (audit + CLAUDE.md)

### Migration numbers reserved
168=AuthorVascAdditionalQuestions [applied ✅ 2026-07-09], 169=AddVascQuestionNarrowing [applied ✅ 2026-07-09]

### ▶ Next action
None — audit complete. Still-open (documented in 2B): structured PAD severity (Fontaine/Rutherford) and carotid symptomatic status — deferred single-category keys; preOpClinCond covers meanwhile.

---

## 🔬 Working notes

### 2B — Question set (6 questions)

| key | inputType | label / arLabel | professor's rationale |
|---|---|---|---|
| `laterality` | single_choice | Side (laterality) / الجهة (أيمن / أيسر) | Reused key (3 options — no midline; the aortic categories that would need it are excluded). 9 categories; skipped for the 3 midline-aorta ones (AAA, dissection, TAA). |
| `approach` | single_choice | Surgical approach / المدخل الجراحي | Canonical key, VASC-native semantics: **open vs endovascular vs hybrid** — THE post-endovascular-revolution question, asked of every vascular case. All 12 categories. |
| `region` | single_choice | Target vessel / segment / الوعاء / القطعة المستهدفة | Only where the diagnosis doesn't encode the vessel: PAD (the aortoiliac/fem-pop/infrapopliteal grading — matches the 2026 CPT LER territories), peripheral aneurysms (popliteal/femoral/iliac/visceral), arterial trauma (vessel group), VTE (IVC/iliac vs limb veins). |
| `urgency` | single_choice | Urgency of surgery / مدى إلحاح الجراحة | Canonical (3 options). Hugely discriminating (ruptured AAA, acute limb ischaemia, acute dissection). 9 categories; skipped for the elective-only three (varicose veins, AVF creation, renal artery disease). |
| `graftType` | single_choice | Conduit / device used / الطُعم / الجهاز المستخدم | NEW VASC key — "what conduit and why?" is the bypass viva; extended to the endo era (stent-graft/bare stent/DCB). 9 categories. |
| `intraopEvents` | free_text | Intraoperative events / الأحداث أثناء العملية | Canonical; all 12; sortOrder 9 (renders last). |

Skipped (justified): `surgicalDomain` (arterial/venous/access duplicates the categories), `position` (supine-dominant), `clinicalPresentation` (preOpClinCond exists — GS/ORTHO/PRS precedent).

**Still-open (deferred):** structured PAD severity (Fontaine/Rutherford stage) and carotid symptomatic-vs-asymptomatic status — different vocabularies per category, single-category keys by the ≥2 rule; free-text preOpClinCond covers meanwhile.

Question sortOrder: laterality 0, approach 1, region 2, urgency 3, graftType 4, intraopEvents 9.

### 2C — Option sets (31 options, EN + AR)

`laterality` (3): right أيمن · left أيسر · bilateral ثنائي الجانب

`approach` (4): open surgery جراحة مفتوحة · endovascular داخل الأوعية (تداخلي) · hybrid (open + endovascular) هجين (مفتوح + داخل الأوعية) · other أخرى

`region` (12): aortoiliac segment القطعة الأبهرية الحرقفية · femoropopliteal segment القطعة الفخذية المأبضية · infrapopliteal (tibial) segment القطعة تحت المأبضية (الظنبوبية) · popliteal artery الشريان المأبضي · femoral artery الشريان الفخذي · iliac artery الشريان الحرقفي · visceral arteries الشرايين الحشوية · neck vessels أوعية الرقبة · upper limb vessels أوعية الطرف العلوي · lower limb vessels أوعية الطرف السفلي · abdominal / pelvic vessels الأوعية البطنية / الحوضية · ivc / iliac veins الوريد الأجوف السفلي / الأوردة الحرقفية

`urgency` (3): elective اختياري (مجدول) · urgent عاجل · emergency طارئ

`graftType` (9): autologous vein وريد ذاتي · prosthetic graft - ptfe طُعم صناعي - PTFE · prosthetic graft - dacron طُعم صناعي - داكرون · stent-graft (covered) دعامة مغطاة (ستنت جرافت) · bare-metal stent دعامة معدنية غير مغطاة · drug-coated balloon / stent بالون / دعامة دوائية · patch angioplasty رأب الشريان بالرقعة · none (primary repair / native) بدون طُعم (إصلاح أولي / أوعية ذاتية) · other أخرى

### 2D — Link matrix (55 links) + narrowing (57 rows)

| category | lat | appr | region | urg | graft | ie | n |
|---|---|---|---|---|---|---|---|
| abdominal aortic aneurysm | | ✓ | | ✓ | ✓ | ✓ | 4 |
| aortic dissection | | ✓ | | ✓ | ✓ | ✓ | 4 |
| arterial trauma | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 6 |
| arteriovenous fistula | ✓ | ✓ | | | ✓ | ✓ | 4 |
| carotid artery disease | ✓ | ✓ | | ✓ | ✓ | ✓ | 5 |
| peripheral aneurysms | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 6 |
| peripheral artery disease | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 6 |
| renal artery disease | ✓ | ✓ | | | ✓ | ✓ | 4 |
| thoracic aortic aneurysm | | ✓ | | ✓ | ✓ | ✓ | 4 |
| varicose veins | ✓ | ✓ | | | | ✓ | 3 |
| vascular access | ✓ | ✓ | | ✓ | | ✓ | 4 |
| venous thromboembolism | ✓ | ✓ | ✓ | ✓ | | ✓ | 5 |

Per-question: laterality 9 · approach 12 · region 4 · urgency 9 · graftType 9 · intraopEvents 12 → **Σ 55**.

`region` narrowing (15): PAD → aortoiliac, femoropopliteal, infrapopliteal segments (3) · peripheral aneurysms → popliteal artery, femoral artery, iliac artery, visceral arteries, upper limb vessels (5) · arterial trauma → neck vessels, upper limb vessels, lower limb vessels, abdominal / pelvic vessels (4) · VTE → ivc / iliac veins, lower limb vessels, upper limb vessels (3)

`graftType` narrowing (39): AAA → dacron, stent-graft, ptfe, other (4) · dissection → stent-graft, dacron, other (3) · TAA → dacron, stent-graft, other (3) · arterial trauma → autologous vein, ptfe, patch angioplasty, none, other (5) · AVF → autologous vein, ptfe, none, other (4) · carotid → patch angioplasty, bare-metal stent, none, other (4) · peripheral aneurysms → autologous vein, ptfe, dacron, stent-graft, other (5) · PAD → autologous vein, ptfe, dacron, bare-metal stent, drug-coated balloon / stent, stent-graft, other (7) · renal → bare-metal stent, autologous vein, dacron, other (4)

`approach` narrowing (3): varicose veins → open surgery, endovascular, other (hybrid is not a varicose-vein concept). All other categories keep all 4 (hybrid is real everywhere else, incl. HeRO-type access).

Σ narrowing = 15 + 39 + 3 = **57**.

### Expected totals after 168+169
questions **6** · options **31** · links **55** · narrowing **57** · NULL arValue **0**

### Migration log
| # | name | status |
|---|---|---|
| 1750000000168 | AuthorVascAdditionalQuestions | applied ✅ (2026-07-09) |
| 1750000000169 | AddVascQuestionNarrowing | applied ✅ (2026-07-09) |

### Final verification (staging, 2026-07-09)
- VASC: questions=6, options=31, links=55, narrowing=57, NULL arValue=0 — exact match with 2D.
- All 12 categories covered (≥3 questions each); approach (open/endovascular/hybrid) on all 12; graftType narrowed per category (AAA never offers DCB; carotid offers patch/bare-stent/none, never dacron tube grafts; varicose veins never offer hybrid).
- down() tested: revert 169+168 → re-apply → identical counts. PRS/ORTHO/GS/CTS/NS untouched; 0 cross-dept link violations. `npx tsc --noEmit` clean.
- Cross-dept key reuse: laterality/approach/region/urgency/intraopEvents; new VASC key `graftType` justified in 2B. PAD region values deliberately match the 2026 CPT LER territory split (aortoiliac / fem-pop / infrapopliteal).
