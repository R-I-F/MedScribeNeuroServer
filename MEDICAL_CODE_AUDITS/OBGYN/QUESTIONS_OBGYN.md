# OBGYN Additional-Questions Audit (professor authoring — fresh)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-07-09
**Current step**: DONE
**Status**: ✅ complete

### Step status
- [x] Phase 1 — state loaded (0 questions, 0 options, 0 links, 12 main_diags — FRESH AUTHORING)
- [x] Phase 2A — N/A (fresh authoring)
- [x] Phase 2B — question set decided (8 questions: approach, laterality, urgency, gestationalAge, surgicalIntent, nodalSurgery, neoadjuvant, intraopEvents)
- [x] Phase 2C — option sets authored (32 options, EN+AR)
- [x] Phase 2D — link matrix + narrowing designed (35 links, 40 narrowing rows)
- [x] Phase 3 — migrations written (180 AuthorObgynAdditionalQuestions, 181 AddObgynQuestionNarrowing)
- [x] Phase 4 — applied + verified: **8 questions / 32 options / 35 links / 40 narrowing / 0 NULL arValue — exact match**; down() cycle tested (revert 181+180 → re-apply → identical); all 11 other configured depts untouched; 0 cross-dept link violations; tsc clean
- [x] Phase 5 — finalized (audit + CLAUDE.md)

### Migration numbers reserved
180=AuthorObgynAdditionalQuestions [applied ✅ 2026-07-09], 181=AddObgynQuestionNarrowing [applied ✅ 2026-07-09]

### ▶ Next action
None — audit complete. Still-open (documented in 2B): miscarriage management mode, perineal-tear degree, FIGO stage — single-category / pathology-dependent keys deferred.

---

## 🔬 Working notes

OBGYN spans obstetric (cesarean, miscarriage, placental abnormalities, vaginal delivery complications, ectopic) and gynaecologic (endometriosis, gynae cancer, ovarian cysts, pelvic mass, SUI, fibroids, prolapse) work — the question set covers both.

### 2B — Question set (8 questions)

| key | inputType | label / arLabel | professor's rationale |
|---|---|---|---|
| `approach` | single_choice | Surgical approach / المدخل الجراحي | OBGYN-native spectrum: abdominal (open) / laparoscopic / robotic / **vaginal** / **hysteroscopic**. THE gynae-surgery question. 8 categories (the 7 gynae + ectopic); C-section is abdominal by definition, obstetric categories skip it. |
| `laterality` | single_choice | Side (laterality) / الجهة (أيمن / أيسر) | Reused. Adnexal side: ovarian cysts & masses, ectopic pregnancy (which tube), pelvic mass. 3 categories. |
| `urgency` | single_choice | Urgency of surgery / مدى إلحاح الجراحة | Canonical (3 options). The obstetric emergencies (cat-1 emergency CS, ruptured ectopic, abruption/previa bleeding, PPH, septic miscarriage). 5 obstetric categories; gynae is planned. |
| `gestationalAge` | single_choice | Gestational age / عمر الحمل | NEW OBGYN key — THE obstetric axis (preterm vs term changes everything). 4 categories (cesarean, miscarriage, placental abnormalities, vaginal delivery complications); narrowed per category. |
| `surgicalIntent` | single_choice | Surgical intent / الهدف من الجراحة | Reused SOC key. Gynaecologic cancer (curative/palliative/staging/cytoreductive/prophylactic). |
| `nodalSurgery` | single_choice | Lymph node surgery / جراحة العقد اللمفاوية | Reused SOC key. Gynaecologic cancer (pelvic/para-aortic lymphadenectomy). |
| `neoadjuvant` | single_choice | Neoadjuvant therapy received / العلاج المساعد قبل الجراحة | Reused SOC key. Gynaecologic cancer (interval debulking post-NACT). |
| `intraopEvents` | free_text | Intraoperative events / الأحداث أثناء العملية | Canonical; all 12; sortOrder 9. |

Skipped (justified): `surgicalDomain` (obstetric/gynae axis duplicates the categories), `position` (lithotomy/supine implied by approach), `region` (each category IS the organ), `clinicalPresentation` (preOpClinCond exists). Single-category SOC keys (intent/nodal/neo) reused because they keep the gynae-onc JSONB consistent with SOC — established-key single-category reuse is acceptable (MFS nodalSurgery precedent).

**Still-open (deferred):** miscarriage management mode (surgical/medical/expectant); perineal-tear degree (vaginal delivery); FIGO stage for gynae cancer (pathology-dependent — post-op field).

Question sortOrder: approach 0, laterality 1, urgency 2, gestationalAge 3, surgicalIntent 4, nodalSurgery 5, neoadjuvant 6, intraopEvents 9.

### 2C — Option sets (32 options, EN + AR)

`approach` (6): abdominal (open) بطني (مفتوح) · laparoscopic تنظير البطن · robotic-assisted بمساعدة الروبوت · vaginal مهبلي · hysteroscopic تنظير الرحم · other أخرى

`laterality` (3): right أيمن · left أيسر · bilateral ثنائي الجانب

`urgency` (3): elective اختياري (مجدول) · urgent عاجل · emergency طارئ

`gestationalAge` (4): first trimester الثلث الأول من الحمل · second trimester الثلث الثاني من الحمل · third trimester - preterm الثلث الثالث - مبتسر · third trimester - term الثلث الثالث - مكتمل

`surgicalIntent` (5): curative (radical) شافٍ (جذري) · palliative تلطيفي · diagnostic / staging تشخيصي / تحديد المرحلة · cytoreductive (debulking) اختزال الورم (استئصال جزئي) · prophylactic (risk-reducing) وقائي (خفض الخطورة)

`nodalSurgery` (5): none بدون · nodal sampling أخذ عينات من العقد · sentinel lymph node biopsy خزعة العقدة الحارسة · regional lymphadenectomy استئصال العقد الإقليمية · radical / extended lymphadenectomy استئصال العقد الجذري / الموسع

`neoadjuvant` (6): none بدون · chemotherapy علاج كيميائي · radiotherapy علاج إشعاعي · chemoradiotherapy علاج كيميائي إشعاعي · immunotherapy / targeted therapy علاج مناعي / موجه · hormonal therapy علاج هرموني

### 2D — Link matrix (35 links) + narrowing (40 rows)

| category | appr | lat | urg | gestAge | intent | nodal | neo | ie | n |
|---|---|---|---|---|---|---|---|---|---|
| cesarean section | | | ✓ | ✓ | | | | ✓ | 3 |
| ectopic pregnancy | ✓ | ✓ | ✓ | | | | | ✓ | 4 |
| endometriosis | ✓ | | | | | | | ✓ | 2 |
| gynecologic cancer | ✓ | | | | ✓ | ✓ | ✓ | ✓ | 5 |
| miscarriage | | | ✓ | ✓ | | | | ✓ | 3 |
| ovarian cysts & masses | ✓ | ✓ | | | | | | ✓ | 3 |
| pelvic mass | ✓ | ✓ | | | | | | ✓ | 3 |
| placental abnormalities | | | ✓ | ✓ | | | | ✓ | 3 |
| stress urinary incontinence | ✓ | | | | | | | ✓ | 2 |
| uterine fibroids | ✓ | | | | | | | ✓ | 2 |
| uterine prolapse | ✓ | | | | | | | ✓ | 2 |
| vaginal delivery complications | | | ✓ | ✓ | | | | ✓ | 3 |

Per-question: approach 8 · laterality 3 · urgency 5 · gestationalAge 4 · surgicalIntent 1 · nodalSurgery 1 · neoadjuvant 1 · intraopEvents 12 → **Σ 35**.

`approach` narrowing (29): ectopic → laparoscopic, abdominal (open), other (3) · endometriosis → laparoscopic, robotic-assisted, abdominal (open), other (4) · gynecologic cancer → abdominal (open), laparoscopic, robotic-assisted, vaginal, other (5) · ovarian cysts & masses → laparoscopic, abdominal (open), robotic-assisted, other (4) · pelvic mass → laparoscopic, abdominal (open), robotic-assisted, other (4) · stress urinary incontinence → vaginal, laparoscopic, abdominal (open), other (4) · uterine prolapse → vaginal, laparoscopic, abdominal (open), robotic-assisted, other (5). **uterine fibroids un-narrowed** (all 6 real — hysteroscopic for submucous, vaginal, abdominal/lap/robotic myomectomy).

`laterality` narrowing (2): ectopic pregnancy → right, left (bilateral ectopic is vanishingly rare). ovarian & pelvic mass un-narrowed (bilateral ovarian cysts common).

`gestationalAge` narrowing (9): miscarriage → first trimester, second trimester (2) · cesarean section → third trimester - preterm, third trimester - term (2) · placental abnormalities → second trimester, third trimester - preterm, third trimester - term (3) · vaginal delivery complications → third trimester - preterm, third trimester - term (2).

surgicalIntent / nodalSurgery / neoadjuvant un-narrowed (single category each). Σ narrowing = 29 + 2 + 9 = **40**.

### Expected totals after 180+181
questions **8** · options **32** · links **35** · narrowing **40** · NULL arValue **0**

### Migration log
| # | name | status |
|---|---|---|
| 1750000000180 | AuthorObgynAdditionalQuestions | applied ✅ (2026-07-09) |
| 1750000000181 | AddObgynQuestionNarrowing | applied ✅ (2026-07-09) |

### Final verification (staging, 2026-07-09)
- OBGYN: questions=8, options=32, links=35, narrowing=40, NULL arValue=0 — exact match with 2D.
- All 12 categories covered (≥2 questions each); approach narrowed per category (ectopic never offers hysteroscopic; SUI leads with the vaginal sling route; fibroids un-narrowed across all 6 routes); gestationalAge narrowed per obstetric category.
- down() tested: revert 181+180 → re-apply → identical counts. All 11 other configured depts untouched; 0 cross-dept link violations. `npx tsc --noEmit` clean.
- Cross-dept key reuse: approach (OBGYN-native vaginal/hysteroscopic options), laterality, urgency, intraopEvents, + surgicalIntent/nodalSurgery/neoadjuvant reused from SOC for gynae cancer; new OBGYN key `gestationalAge` justified in 2B.
