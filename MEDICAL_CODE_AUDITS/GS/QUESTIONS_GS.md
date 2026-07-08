# GS Additional-Questions Audit (professor authoring — fresh)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-07-09
**Current step**: DONE
**Status**: ✅ complete

### Step status
- [x] Phase 1 — state loaded (0 questions, 0 options, 0 links, 13 main_diags — FRESH AUTHORING)
- [x] Phase 2A — N/A (fresh authoring)
- [x] Phase 2B — question set decided (6 questions: approach, region, urgency, woundClass, stomaFormed, intraopEvents; surgicalDomain/position/clinicalPresentation skipped, justified)
- [x] Phase 2C — option sets authored (34 options, EN+AR)
- [x] Phase 2D — link matrix + narrowing designed (56 links, 65 narrowing rows)
- [x] Phase 3 — migrations written (162 AuthorGsAdditionalQuestions, 163 AddGsQuestionNarrowing)
- [x] Phase 4 — applied + verified: **6 questions / 34 options / 56 links / 65 narrowing / 0 NULL arValue — exact match**; down() cycle tested (revert 163+162 → re-apply → identical); CTS (6/39/83/99) & NS (6/26/14/0) untouched; tsc clean
- [x] Phase 5 — finalized (audit + CLAUDE.md)

### Migration numbers reserved
162=AuthorGsAdditionalQuestions [applied ✅ 2026-07-09], 163=AddGsQuestionNarrowing [applied ✅ 2026-07-09]

### ▶ Next action
None — audit complete. Every category has ≥3 questions; no justified-empty categories needed.

---

## 🔬 Working notes

### 2B — Question set (6 questions)

| key | inputType | label / arLabel | professor's rationale |
|---|---|---|---|
| `approach` | single_choice | Surgical approach / المدخل الجراحي | THE general-surgery question: open vs laparoscopic vs converted vs robotic, plus the named incision for open cases. Linked to 11 categories (not breast/thyroid — there the "approach" IS the procedure, already captured by proc_cpts). |
| `region` | single_choice | Anatomical site / الموضع التشريحي | Only where the site is NOT already encoded in the diagnosis: breast (side), thyroid (lobe/isthmus), colorectal (segment). Elsewhere (hernia type, gastric vs duodenal ulcer, small vs large bowel) the linked diagnosis already says it — asking again teaches nothing. |
| `urgency` | single_choice | Urgency of surgery / مدى إلحاح الجراحة | Canonical key (CTS precedent). GS = 3 options (elective/urgent/emergency; "salvage" is cardiac-EuroSCORE vocabulary, not GS). All 13 categories. |
| `woundClass` | single_choice | Surgical wound classification / تصنيف الجرح الجراحي | NEW GS key — the classic CDC wound-class viva question (clean → dirty), drives SSI thinking. Linked to 10 categories; dropped where single-answer: breast (clean), thyroid (clean), bariatric (uniformly clean-contaminated). |
| `stomaFormed` | single_choice | Stoma formed / الفغرة المُنشأة | NEW GS key — ileostomy/colostomy decision-making is core GS teaching. 6 categories where stoma is a real decision (trauma, acute abdomen, obstruction, colorectal, diverticulitis, perforated viscus). |
| `intraopEvents` | free_text | Intraoperative events / الأحداث أثناء العملية | Canonical; all 13. sortOrder 9 (renders last). |

Skipped (justified): `surgicalDomain` — GS practice axes (abdominal/breast/endocrine/hernia) exactly duplicate the main_diag categories. `position` — >95% supine; the exceptions (Lloyd-Davies for pelvic colorectal) are implied by the operation. `clinicalPresentation` — tenant submissions already carry `preOpClinCond`; urgency captures the operative-status axis in structured form.

Question sortOrder: approach 0, region 1, urgency 2, woundClass 3, stomaFormed 4, intraopEvents 9.

### 2C — Option sets (34 options, EN + AR)

`approach` (9):
| value | arValue |
|---|---|
| laparoscopic | تنظير البطن (لاباروسكوبي) |
| laparoscopic converted to open | تنظيري محوَّل إلى مفتوح |
| robotic-assisted | بمساعدة الروبوت |
| open - midline laparotomy | مفتوح - فتح بطن ناصف |
| open - gridiron / lanz incision | مفتوح - شق جريدايرون / لانز |
| open - kocher (subcostal) incision | مفتوح - شق كوخر تحت الضلعي |
| open - inguinal incision | مفتوح - شق إربي |
| endoscopic | بالمنظار الداخلي |
| other | أخرى |

`region` (12): right breast الثدي الأيمن · left breast الثدي الأيسر · right thyroid lobe الفص الأيمن للغدة الدرقية · left thyroid lobe الفص الأيسر للغدة الدرقية · thyroid isthmus برزخ الغدة الدرقية · bilateral ثنائي الجانب (shared by breast+thyroid narrow sets) · caecum / ascending colon الأعور / القولون الصاعد · transverse colon القولون المستعرض · descending colon القولون النازل · sigmoid colon القولون السيني · rectum المستقيم · anal canal القناة الشرجية

`urgency` (3): elective اختياري (مجدول) · urgent عاجل · emergency طارئ

`woundClass` (4): clean نظيف · clean-contaminated نظيف-ملوث · contaminated ملوث · dirty / infected متسخ / مصاب بالعدوى

`stomaFormed` (6): none بدون فغرة · loop ileostomy فغرة لفائفية عروية · end ileostomy فغرة لفائفية طرفية · loop colostomy فغرة قولونية عروية · end colostomy (hartmann) فغرة قولونية طرفية (عملية هارتمان) · other أخرى

### 2D — Link matrix (56 links) + narrowing (65 rows)

| category | approach | region | urgency | woundClass | stomaFormed | intraopEvents | n |
|---|---|---|---|---|---|---|---|
| abdominal trauma | ✓ | | ✓ | ✓ | ✓ | ✓ | 5 |
| acute abdomen | ✓ | | ✓ | ✓ | ✓ | ✓ | 5 |
| appendicitis | ✓ | | ✓ | ✓ | | ✓ | 4 |
| bariatric conditions | ✓ | | ✓ | | | ✓ | 3 |
| bowel obstruction | ✓ | | ✓ | ✓ | ✓ | ✓ | 5 |
| breast lumps & cancer | | ✓ | ✓ | | | ✓ | 3 |
| cholecystitis & cholelithiasis | ✓ | | ✓ | ✓ | | ✓ | 4 |
| colorectal polyps & masses | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | 6 |
| diverticulitis | ✓ | | ✓ | ✓ | ✓ | ✓ | 5 |
| hernias | ✓ | | ✓ | ✓ | | ✓ | 4 |
| peptic ulcer disease | ✓ | | ✓ | ✓ | | ✓ | 4 |
| perforated viscus | ✓ | | ✓ | ✓ | ✓ | ✓ | 5 |
| thyroid nodules | | ✓ | ✓ | | | ✓ | 3 |

Per-question: approach 11 · region 3 · urgency 13 · woundClass 10 · stomaFormed 6 · intraopEvents 13 → **Σ 56**.

`approach` narrowing (52 rows): LAP=laparoscopic, CONV=laparoscopic converted to open, ROBOT=robotic-assisted, MID=open - midline laparotomy, GRID=open - gridiron / lanz incision, KOCH=open - kocher (subcostal) incision, ING=open - inguinal incision, ENDO=endoscopic, OTH=other
| category | allowed (n) |
|---|---|
| abdominal trauma | LAP, CONV, MID, OTH (4) |
| acute abdomen | LAP, CONV, MID, OTH (4) |
| appendicitis | LAP, CONV, GRID, MID, OTH (5) |
| bariatric conditions | LAP, CONV, ROBOT, MID, OTH (5) |
| bowel obstruction | LAP, CONV, MID, OTH (4) |
| cholecystitis & cholelithiasis | LAP, CONV, KOCH, MID, OTH (5) |
| colorectal polyps & masses | LAP, CONV, ROBOT, MID, ENDO, OTH (6) |
| diverticulitis | LAP, CONV, MID, OTH (4) |
| hernias | ING, LAP, CONV, ROBOT, MID, OTH (6) |
| peptic ulcer disease | LAP, CONV, MID, ENDO, OTH (5) |
| perforated viscus | LAP, CONV, MID, OTH (4) |

`region` narrowing (13 rows): breast lumps & cancer → right breast, left breast, bilateral (3) · thyroid nodules → right thyroid lobe, left thyroid lobe, thyroid isthmus, bilateral (4) · colorectal polyps & masses → caecum / ascending colon, transverse colon, descending colon, sigmoid colon, rectum, anal canal (6)

No narrowing for urgency/woundClass/stomaFormed (small, generally-applicable lists).

### Expected totals after 162+163
questions **6** · options **34** · links **56** · narrowing **65** · NULL arValue **0**

### Migration log
| # | name | status |
|---|---|---|
| 1750000000162 | AuthorGsAdditionalQuestions | applied ✅ (2026-07-09) |
| 1750000000163 | AddGsQuestionNarrowing | applied ✅ (2026-07-09) |

### Final verification (staging, 2026-07-09)
- GS: questions=6, options=34, links=56, narrowing=65, NULL arValue=0 — exact match with 2D.
- All 13 categories covered (≥3 questions each); approach narrowed 4–6 per category; region narrowed 3/4/6 (breast/thyroid/colorectal).
- down() tested: revert 163+162 → re-apply → identical counts. CTS and NS configs untouched. `npx tsc --noEmit` clean.
- Cross-dept key reuse: approach/region/urgency/intraopEvents shared with CTS/NS; new GS keys `woundClass` + `stomaFormed` justified in 2B.
