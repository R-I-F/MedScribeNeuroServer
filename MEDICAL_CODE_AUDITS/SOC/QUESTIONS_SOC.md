# SOC Additional-Questions Audit (professor authoring — fresh)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-07-09
**Current step**: DONE
**Status**: ✅ complete

### Step status
- [x] Phase 1 — state loaded (0 questions, 0 options, 0 links, 16 main_diags — FRESH AUTHORING)
- [x] Phase 2A — N/A (fresh authoring)
- [x] Phase 2B — question set decided (9 questions: surgicalIntent, nodalSurgery, neoadjuvant, approach, laterality, region, urgency, stomaFormed, intraopEvents)
- [x] Phase 2C — option sets authored (45 options, EN+AR)
- [x] Phase 2D — link matrix + narrowing designed (76 links, 94 narrowing rows)
- [x] Phase 3 — migrations written (174 AuthorSocAdditionalQuestions, 175 AddSocQuestionNarrowing)
- [x] Phase 4 — applied + verified: **9 questions / 45 options / 76 links / 94 narrowing / 0 NULL arValue — exact match**; down() cycle tested (revert 175+174 → re-apply → identical); all 8 other configured depts untouched; 0 cross-dept link violations; tsc clean
- [x] Phase 5 — finalized (audit + CLAUDE.md)

### Migration numbers reserved
174=AuthorSocAdditionalQuestions [applied ✅ 2026-07-09], 175=AddSocQuestionNarrowing [applied ✅ 2026-07-09]

### ▶ Next action
None — audit complete. Still-open (documented in 2B): resection-margin R status (pathology-dependent — better as a post-op review field on submissions).

---

## 🔬 Working notes

### 2B — Question set (9 questions)

| key | inputType | label / arLabel | professor's rationale |
|---|---|---|---|
| `surgicalIntent` | single_choice | Surgical intent / الهدف من الجراحة | NEW SOC key — THE oncology question: curative (radical) / palliative / diagnostic-staging / cytoreductive / prophylactic. ALL 16 categories. |
| `nodalSurgery` | single_choice | Lymph node surgery / جراحة العقد اللمفاوية | NEW SOC key — the second onc axis: none / sampling / sentinel biopsy / regional / radical-extended (covers SLNB-vs-ALND, D1/D2, neck dissections, CME). 12 categories (skipped where nodal surgery isn't practice: HCC, sarcoma, metastatic, lymphoma — where the node excision IS the operation). |
| `neoadjuvant` | single_choice | Neoadjuvant therapy received / العلاج المساعد قبل الجراحة | NEW SOC key — operating after chemo/radio changes everything (rectal post-CRT, interval debulking post-NACT, perioperative FLOT). 9 categories. |
| `approach` | single_choice | Surgical approach / المدخل الجراحي | Canonical: open/lap/lap-converted/robotic. 10 abdominal-pelvic categories; skipped where open/excisional is the only mode (breast, melanoma, NMSC, H&N, sarcoma, lymphoma). |
| `laterality` | single_choice | Side (laterality) / الجهة (أيمن / أيسر) | Reused. 4 categories where side is real and not in the diagnosis: breast, endocrine & adrenal, genitourinary, ovarian. |
| `region` | single_choice | Anatomical site / الموضع التشريحي | Canonical. Only where site is not in the diagnosis: melanoma/NMSC (skin site), sarcoma (extremity vs retroperitoneal — THE sarcoma axis), metastatic disease (target organ), lymphoma (node basin). 5 categories. |
| `urgency` | single_choice | Urgency of surgery / مدى إلحاح الجراحة | Canonical. Only colorectal + gastric (obstructing/perforated/bleeding presentations are a real share); everything else in SOC is planned. |
| `stomaFormed` | single_choice | Stoma formed / الفغرة المُنشأة | Reused GS key + **urostomy (ileal conduit)** option. Colorectal + genitourinary (exactly the ≥2 rule). |
| `intraopEvents` | free_text | Intraoperative events / الأحداث أثناء العملية | Canonical; all 16; sortOrder 9. |

Skipped (justified): `surgicalDomain` (organ-system axis duplicates the 16 categories), `position` (follows the operation), `clinicalPresentation` (preOpClinCond exists).

**Still-open (deferred):** resection-margin status (R0/R1/R2) — pathology-dependent, frequently unknown at logging time; better as a post-op review field. Gastric D1-vs-D2 granularity folded into regional/radical lymphadenectomy.

Question sortOrder: surgicalIntent 0, nodalSurgery 1, neoadjuvant 2, approach 3, laterality 4, region 5, urgency 6, stomaFormed 7, intraopEvents 9.

### 2C — Option sets (45 options, EN + AR)

`surgicalIntent` (5): curative (radical) شافٍ (جذري) · palliative تلطيفي · diagnostic / staging تشخيصي / تحديد المرحلة · cytoreductive (debulking) اختزال الورم (استئصال جزئي) · prophylactic (risk-reducing) وقائي (خفض الخطورة)

`nodalSurgery` (5): none بدون · nodal sampling أخذ عينات من العقد · sentinel lymph node biopsy خزعة العقدة الحارسة · regional lymphadenectomy استئصال العقد الإقليمية · radical / extended lymphadenectomy استئصال العقد الجذري / الموسع

`neoadjuvant` (6): none بدون · chemotherapy علاج كيميائي · radiotherapy علاج إشعاعي · chemoradiotherapy علاج كيميائي إشعاعي · immunotherapy / targeted therapy علاج مناعي / موجه · hormonal therapy علاج هرموني

`approach` (5): open مفتوح · laparoscopic تنظير البطن · laparoscopic converted to open تنظير بطن محوَّل إلى مفتوح · robotic-assisted بمساعدة الروبوت · other أخرى

`laterality` (3): right أيمن · left أيسر · bilateral ثنائي الجانب

`region` (11): head & neck الرأس والرقبة · trunk / torso الجذع · upper limb الطرف العلوي · lower limb الطرف السفلي · retroperitoneum خلف الصفاق · intra-abdominal / peritoneal داخل البطن / الصفاق · liver الكبد · lung / thoracic الرئة / الصدر · cervical nodes العقد الرقبية · axillary nodes العقد الإبطية · inguinal nodes العقد الإربية

`urgency` (3): elective اختياري (مجدول) · urgent عاجل · emergency طارئ

`stomaFormed` (7): none بدون فغرة · loop ileostomy فغرة لفائفية عروية · end ileostomy فغرة لفائفية طرفية · loop colostomy فغرة قولونية عروية · end colostomy (hartmann) فغرة قولونية طرفية (هارتمان) · urostomy (ileal conduit) فغرة بولية (قناة لفائفية) · other أخرى

### 2D — Link matrix (76 links) + narrowing (94 rows)

| category | intent | nodal | neo | appr | lat | region | urg | stoma | ie | n |
|---|---|---|---|---|---|---|---|---|---|---|
| biliary tract & gallbladder cancer | ✓ | ✓ | | ✓ | | | | | ✓ | 4 |
| breast cancer | ✓ | ✓ | ✓ | | ✓ | | | | ✓ | 5 |
| colorectal cancer | ✓ | ✓ | ✓ | ✓ | | | ✓ | ✓ | ✓ | 7 |
| endocrine & adrenal tumours | ✓ | ✓ | | ✓ | ✓ | | | | ✓ | 5 |
| gastric cancer | ✓ | ✓ | ✓ | ✓ | | | ✓ | | ✓ | 6 |
| genitourinary cancer | ✓ | ✓ | ✓ | ✓ | ✓ | | | ✓ | ✓ | 7 |
| gynaecological cancer | ✓ | ✓ | ✓ | ✓ | | | | | ✓ | 5 |
| head & neck cancer | ✓ | ✓ | ✓ | | | | | | ✓ | 4 |
| hepatocellular carcinoma | ✓ | | | ✓ | | | | | ✓ | 3 |
| melanoma | ✓ | ✓ | | | | ✓ | | | ✓ | 4 |
| metastatic disease | ✓ | | | ✓ | | ✓ | | | ✓ | 4 |
| non-melanoma skin cancer | ✓ | ✓ | | | | ✓ | | | ✓ | 4 |
| ovarian cancer | ✓ | ✓ | ✓ | ✓ | ✓ | | | | ✓ | 6 |
| pancreatic cancer | ✓ | ✓ | ✓ | ✓ | | | | | ✓ | 5 |
| soft tissue sarcoma | ✓ | | ✓ | | | ✓ | | | ✓ | 4 |
| surgical lymphoma | ✓ | | | | | ✓ | | | ✓ | 3 |

Per-question: intent 16 · nodal 12 · neo 9 · approach 10 · laterality 4 · region 5 · urgency 2 · stoma 2 · intraopEvents 16 → **Σ 76**.

`nodalSurgery` narrowing (37): breast → none, sentinel, regional (3) · melanoma → none, sentinel, regional (3) · NMSC → none, sentinel, regional (3) · gastric → none, sampling, regional, radical/extended (4) · colorectal → none, regional, radical/extended (3) · H&N → none, regional, radical/extended (3) · endocrine → none, regional, radical/extended (3) · GU → none, regional, radical/extended (3) · gynae → none, sampling, regional (3) · ovarian → none, sampling, regional (3) · pancreatic → none, regional, radical/extended (3) · biliary → none, regional, radical/extended (3)

`neoadjuvant` narrowing (28): colorectal → none, chemo, radio, chemoradio (4) · gastric → none, chemo, chemoradio (3) · pancreatic → none, chemo, chemoradio (3) · H&N → none, chemo, radio, chemoradio (4) · ovarian → none, chemotherapy (2) · sarcoma → none, chemo, radio, chemoradio (4) · gynae → none, chemo, radio, chemoradio (4) · GU → none, chemo, immunotherapy/targeted, hormonal (4). breast un-narrowed (all 6 real: NACT, hormonal, targeted).

`region` narrowing (20): melanoma → head & neck, trunk / torso, upper limb, lower limb (4) · NMSC → same 4 · sarcoma → upper limb, lower limb, trunk / torso, retroperitoneum, head & neck (5) · metastatic → liver, lung / thoracic, intra-abdominal / peritoneal (3) · lymphoma → cervical nodes, axillary nodes, inguinal nodes, intra-abdominal / peritoneal (4)

`stomaFormed` narrowing (9): colorectal → none, loop ileostomy, end ileostomy, loop colostomy, end colostomy (hartmann), other (6) · GU → none, urostomy (ileal conduit), other (3)

surgicalIntent and approach deliberately un-narrowed (all options genuinely plausible across their linked categories). Σ narrowing = 37 + 28 + 20 + 9 = **94**.

### Expected totals after 174+175
questions **9** · options **45** · links **76** · narrowing **94** · NULL arValue **0**

### Migration log
| # | name | status |
|---|---|---|
| 1750000000174 | AuthorSocAdditionalQuestions | applied ✅ (2026-07-09) |
| 1750000000175 | AddSocQuestionNarrowing | applied ✅ (2026-07-09) |

### Final verification (staging, 2026-07-09)
- SOC: questions=9, options=45, links=76, narrowing=94, NULL arValue=0 — exact match with 2D.
- All 16 categories covered (≥3 questions each); surgicalIntent on all 16; nodalSurgery narrowed per cancer (breast never offers "nodal sampling"; gastric keeps sampling→radical for D1/D2).
- down() tested: revert 175+174 → re-apply → identical counts. All 8 other configured depts untouched; 0 cross-dept link violations. `npx tsc --noEmit` clean.
- Cross-dept key reuse: approach/laterality/region/urgency/stomaFormed (+urostomy option)/intraopEvents; 3 new SOC keys (`surgicalIntent`, `nodalSurgery`, `neoadjuvant`) justified in 2B — the oncology-universal axes.
