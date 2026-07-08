# HBP Additional-Questions Audit (professor authoring — fresh)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-07-09
**Current step**: DONE
**Status**: ✅ complete

### Step status
- [x] Phase 1 — state loaded (0 questions, 0 options, 0 links, 12 main_diags — FRESH AUTHORING)
- [x] Phase 2A — N/A (fresh authoring)
- [x] Phase 2B — question set decided (5 questions: approach, region, urgency, childPugh, intraopEvents)
- [x] Phase 2C — option sets authored (24 options, EN+AR)
- [x] Phase 2D — link matrix + narrowing designed (39 links, 90 narrowing rows)
- [x] Phase 3 — migrations written (172 AuthorHbpAdditionalQuestions, 173 AddHbpQuestionNarrowing)
- [x] Phase 4 — applied + verified: **5 questions / 24 options / 39 links / 90 narrowing / 0 NULL arValue — exact match**; down() cycle tested (revert 173+172 → re-apply → identical); PEDSURG/VASC/PRS/ORTHO/GS/CTS/NS untouched; 0 cross-dept link violations; tsc clean
- [x] Phase 5 — finalized (audit + CLAUDE.md)

### Migration numbers reserved
172=AuthorHbpAdditionalQuestions [applied ✅ 2026-07-09], 173=AddHbpQuestionNarrowing [applied ✅ 2026-07-09]

### ▶ Next action
None — audit complete. Still-open (documented in 2B): bile-duct-injury Strasberg classification; CBD-clearance method for cholecystitis & choledocholithiasis — single-category keys deferred by the ≥2 rule.

---

## 🔬 Working notes

### 2B — Question set (5 questions)

| key | inputType | label / arLabel | professor's rationale |
|---|---|---|---|
| `approach` | single_choice | Surgical approach / المدخل الجراحي | HBP is uniquely multi-modal — the same disease may be treated open, laparoscopic, robotic, **endoscopic (ERCP)** or **percutaneous** (PTBD, cholecystostomy, RFA, step-up necrosectomy). All 12 categories; heavily narrowed per category. |
| `region` | single_choice | Anatomical site / segment / الموضع التشريحي | Only where the diagnosis doesn't encode it: liver side/bilobar (resection planning), cholangiocarcinoma level (intrahepatic/perihilar/distal — THE classification), pancreatic head-body-tail (Whipple vs distal), chronic-pancreatitis head-dominant vs diffuse (Frey vs Puestow). 7 categories. |
| `urgency` | single_choice | Urgency of surgery / مدى إلحاح الجراحة | Canonical (3 options). 6 categories where it varies (emergency cholecystectomy, necrosectomy timing, immediate-vs-delayed bile-duct-injury repair, variceal bleeding, ruptured HCC). Oncology electives (pancreatic ca, cholangio, ampullary, mets, benign, chronic panc) skip it. |
| `childPugh` | single_choice | Liver function (Child-Pugh) / وظائف الكبد (تشايلد-بيو) | NEW HBP key — "what was the Child grade?" is the first thing an HBP examiner asks about any operation on a cirrhotic liver. HCC + cirrhosis/portal-HTN (exactly the ≥2 rule). Options include `non-cirrhotic`. |
| `intraopEvents` | free_text | Intraoperative events / الأحداث أثناء العملية | Canonical; all 12; sortOrder 9. |

Skipped (justified): `surgicalDomain` (liver/biliary/pancreas duplicates the categories), `laterality` (liver side lives in region), `position` (supine-dominant), `clinicalPresentation` (preOpClinCond exists), biliary reconstruction type (captured by proc_cpts — hepaticojejunostomy etc. are procedures).

**Still-open (single-category keys deferred by the ≥2 rule):** bile-duct-injury Strasberg classification; CBD-clearance method for cholecystitis & choledocholithiasis (lap chole ± pre/post-op ERCP vs lap/open CBD exploration).

Question sortOrder: approach 0, region 1, urgency 2, childPugh 3, intraopEvents 9.

### 2C — Option sets (24 options, EN + AR)

`approach` (7): laparoscopic تنظير البطن · laparoscopic converted to open تنظير بطن محوَّل إلى مفتوح · open مفتوح · robotic-assisted بمساعدة الروبوت · endoscopic (ercp) بالمنظار الداخلي (ERCP) · percutaneous عن طريق الجلد · other أخرى

`region` (10): right hemiliver الفص الأيمن للكبد · left hemiliver الفص الأيسر للكبد · bilobar / multiple segments الفصان / قطاعات متعددة · intrahepatic ducts القنوات الصفراوية داخل الكبد · perihilar (hilar) حول سرة الكبد (نقيري) · mid / distal bile duct القناة الصفراوية الوسطى / البعيدة · pancreatic head / uncinate رأس البنكرياس / الناتئ المعقوف · pancreatic body جسم البنكرياس · pancreatic tail ذيل البنكرياس · diffuse pancreas البنكرياس بأكمله (منتشر)

`urgency` (3): elective اختياري (مجدول) · urgent عاجل · emergency طارئ

`childPugh` (4): non-cirrhotic غير متليف · child-pugh a تشايلد-بيو أ · child-pugh b تشايلد-بيو ب · child-pugh c تشايلد-بيو ج

### 2D — Link matrix (39 links) + narrowing (90 rows)

| category | appr | region | urg | childPugh | ie | n |
|---|---|---|---|---|---|---|
| acute pancreatitis | ✓ | | ✓ | | ✓ | 3 |
| ampullary cancer | ✓ | | | | ✓ | 2 |
| benign liver lesions | ✓ | ✓ | | | ✓ | 3 |
| bile duct injuries | ✓ | | ✓ | | ✓ | 3 |
| biliary stricture | ✓ | ✓ | ✓ | | ✓ | 4 |
| cholangiocarcinoma | ✓ | ✓ | | | ✓ | 3 |
| cholecystitis & choledocholithiasis | ✓ | | ✓ | | ✓ | 3 |
| chronic pancreatitis | ✓ | ✓ | | | ✓ | 3 |
| hepatocellular carcinoma | ✓ | ✓ | ✓ | ✓ | ✓ | 5 |
| liver cirrhosis & portal hypertension | ✓ | | ✓ | ✓ | ✓ | 4 |
| metastatic liver disease | ✓ | ✓ | | | ✓ | 3 |
| pancreatic cancer | ✓ | ✓ | | | ✓ | 3 |

Per-question: approach 12 · region 7 · urgency 6 · childPugh 2 · intraopEvents 12 → **Σ 39**.

`approach` narrowing (68):
| category | allowed (n) |
|---|---|
| acute pancreatitis | percutaneous, ercp, lap, lap-conv, open, other (6) — the step-up ladder |
| ampullary cancer | open, lap, lap-conv, robotic, ercp (endoscopic ampullectomy), other (6) |
| benign liver lesions | lap, lap-conv, open, robotic, percutaneous (aspiration/ablation), other (6) |
| bile duct injuries | open, lap, lap-conv, ercp (stenting), percutaneous (ptbd), other (6) |
| biliary stricture | ercp, percutaneous, open, lap, lap-conv, other (6) |
| cholangiocarcinoma | open, lap, lap-conv, robotic, other (5) |
| cholecystitis & choledocholithiasis | lap, lap-conv, open, ercp, percutaneous (cholecystostomy), other (6) |
| chronic pancreatitis | open, lap, lap-conv, ercp, other (5) |
| hepatocellular carcinoma | lap, lap-conv, open, robotic, percutaneous (rfa/mwa), other (6) |
| liver cirrhosis & portal hypertension | ercp/endoscopic (banding), open (shunt/devascularization), lap, lap-conv, other (5) |
| metastatic liver disease | lap, lap-conv, open, robotic, percutaneous (ablation), other (6) |
| pancreatic cancer | open, lap, lap-conv, robotic, other (5) |

`region` narrowing (22): benign liver / HCC / metastatic liver → right hemiliver, left hemiliver, bilobar / multiple segments (3×3=9) · cholangiocarcinoma → intrahepatic ducts, perihilar (hilar), mid / distal bile duct (3) · biliary stricture → perihilar (hilar), mid / distal bile duct, intrahepatic ducts (3) · pancreatic cancer → pancreatic head / uncinate, pancreatic body, pancreatic tail (3) · chronic pancreatitis → pancreatic head / uncinate, diffuse pancreas, pancreatic body, pancreatic tail (4)

No narrowing for urgency/childPugh. Σ narrowing = 68 + 22 = **90**.

### Expected totals after 172+173
questions **5** · options **24** · links **39** · narrowing **90** · NULL arValue **0**

### Migration log
| # | name | status |
|---|---|---|
| 1750000000172 | AuthorHbpAdditionalQuestions | applied ✅ (2026-07-09) |
| 1750000000173 | AddHbpQuestionNarrowing | applied ✅ (2026-07-09) |

### Final verification (staging, 2026-07-09)
- HBP: questions=5, options=24, links=39, narrowing=90, NULL arValue=0 — exact match with 2D.
- All 12 categories covered (≥2 questions each); approach on all 12 with per-category modality narrowing (acute pancreatitis keeps the full step-up ladder; pancreatic cancer never offers percutaneous; liver categories never offer pancreatic sites).
- down() tested: revert 173+172 → re-apply → identical counts. All 7 other configured depts untouched; 0 cross-dept link violations. `npx tsc --noEmit` clean.
- Cross-dept key reuse: approach/region/urgency/intraopEvents; new HBP key `childPugh` justified in 2B (HCC + cirrhosis/portal-HTN — exactly the ≥2 rule).
