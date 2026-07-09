# UROL Additional-Questions Audit (professor authoring — fresh)

## 🔄 Progress Checkpoint (resumption state — keep this section first)
**Last updated**: 2026-07-09
**Current step**: DONE
**Status**: ✅ complete

### Step status
- [x] Phase 1 — state loaded (0 questions, 0 options, 0 links, 13 main_diags — FRESH AUTHORING)
- [x] Phase 2A — N/A (fresh authoring)
- [x] Phase 2B — question set decided (8 questions: approach, laterality, urgency, surgicalIntent, nodalSurgery, neoadjuvant, donorType, intraopEvents — ALL reused keys, zero new; THIRD all-reuse dept)
- [x] Phase 2C — option sets authored (32 options, EN+AR)
- [x] Phase 2D — link matrix + narrowing designed (49 links, 65 narrowing rows)
- [x] Phase 3 — migrations written (186 AuthorUrolAdditionalQuestions, 187 AddUrolQuestionNarrowing)
- [x] Phase 4 — applied + verified: **8 questions / 32 options / 49 links / 65 narrowing / 0 NULL arValue — exact match**; down() cycle tested (revert 187+186 → re-apply → identical); all 14 other configured depts untouched; 0 cross-dept link violations; tsc clean
- [x] Phase 5 — finalized (audit + CLAUDE.md)

### Migration numbers reserved
186=AuthorUrolAdditionalQuestions [applied ✅ 2026-07-09], 187=AddUrolQuestionNarrowing [applied ✅ 2026-07-09]

### ▶ Next action
None — audit complete. **UROL is the 15th and final department — the additional-questions framework now covers ALL departments.** Still-open (documented in 2B): stone site/burden, continence device type — single-category keys deferred.

---

## 🔬 Working notes

UROL = **third all-reuse department** (after MFS, ENT) — every key already exists. Endourology (TURP/TURBT/URS/PCNL) makes `approach` the dominant axis; the 4 urologic cancers reuse the SOC onc keys; renal transplantation reuses the TRS donorType key.

### 2B — Question set (8 questions, all reused keys)

| key | inputType | label / arLabel | professor's rationale |
|---|---|---|---|
| `approach` | single_choice | Surgical approach / المدخل الجراحي | THE urology axis: open / laparoscopic / robotic / **transurethral (endoscopic)** / **percutaneous**. All 13 categories; heavily narrowed. |
| `laterality` | single_choice | Side (laterality) / الجهة (أيمن / أيسر) | Kidney/ureter/testis/graft side: male infertility (varicocele), nephrolithiasis, renal cancer, renal transplantation, testicular cancer, ureteral obstruction. 6 categories. |
| `urgency` | single_choice | Urgency of surgery / مدى إلحاح الجراحة | Urologic emergencies: acute urinary retention, obstructed-infected system (ureteral obstruction, nephrolithiasis), priapism (penile pathology). 4 categories. |
| `surgicalIntent` | single_choice | Surgical intent / الهدف من الجراحة | Reused SOC key. The 4 urologic cancers (bladder, prostate, renal, testicular). |
| `nodalSurgery` | single_choice | Lymph node surgery / جراحة العقد اللمفاوية | Reused SOC key. The 4 cancers (pelvic LND / RPLND / hilar); narrowed to none/regional/radical (no SLNB/sampling in urology). |
| `neoadjuvant` | single_choice | Neoadjuvant therapy received / العلاج المساعد قبل الجراحة | Reused SOC key. The 4 cancers (neoadjuvant cisplatin for bladder, ADT for prostate, BEP for testis, targeted for renal); narrowed per cancer. |
| `donorType` | single_choice | Donor type / نوع المتبرع | Reused TRS key. Renal transplantation (living / deceased-DBD / deceased-DCD). |
| `intraopEvents` | free_text | Intraoperative events / الأحداث أثناء العملية | Canonical; all 13; sortOrder 9. |

Skipped (justified): `surgicalDomain` (upper-tract/lower-tract/andrology/onc axis duplicates the categories), `position` (lithotomy/supine/flank implied by approach), `region` (each category is pinned to an organ), `clinicalPresentation` (preOpClinCond exists). **No new keys** — UROL closes the set fully composed from established vocabulary.

**Still-open (deferred single-category):** stone site/burden (ureteric vs renal, Guy's stone score) for nephrolithiasis; BPH size/technique (already proc_cpt); continence device type (AUS vs sling) for urinary incontinence.

Question sortOrder: approach 0, laterality 1, urgency 2, surgicalIntent 3, nodalSurgery 4, neoadjuvant 5, donorType 6, intraopEvents 9.

### 2C — Option sets (32 options, EN + AR)

`approach` (6): open مفتوح · laparoscopic تنظير البطن · robotic-assisted بمساعدة الروبوت · transurethral (endoscopic) عبر الإحليل (بالمنظار) · percutaneous عن طريق الجلد · other أخرى

`laterality` (3): right أيمن · left أيسر · bilateral ثنائي الجانب

`urgency` (3): elective اختياري (مجدول) · urgent عاجل · emergency طارئ

`surgicalIntent` (5): curative (radical) شافٍ (جذري) · palliative تلطيفي · diagnostic / staging تشخيصي / تحديد المرحلة · cytoreductive (debulking) اختزال الورم (استئصال جزئي) · prophylactic (risk-reducing) وقائي (خفض الخطورة)

`nodalSurgery` (5): none بدون · nodal sampling أخذ عينات من العقد · sentinel lymph node biopsy خزعة العقدة الحارسة · regional lymphadenectomy استئصال العقد الإقليمية · radical / extended lymphadenectomy استئصال العقد الجذري / الموسع

`neoadjuvant` (6): none بدون · chemotherapy علاج كيميائي · radiotherapy علاج إشعاعي · chemoradiotherapy علاج كيميائي إشعاعي · immunotherapy / targeted therapy علاج مناعي / موجه · hormonal therapy علاج هرموني

`donorType` (4): living donor متبرع حي · deceased donor - brain death (dbd) متبرع متوفى - موت دماغي (DBD) · deceased donor - circulatory death (dcd) متبرع متوفى - موت دوري (DCD) · other أخرى

### 2D — Link matrix (49 links) + narrowing (65 rows)

| category | appr | lat | urg | intent | nodal | neo | donor | ie | n |
|---|---|---|---|---|---|---|---|---|---|
| benign prostatic hyperplasia | ✓ | | | | | | | ✓ | 2 |
| bladder cancer | ✓ | | | ✓ | ✓ | ✓ | | ✓ | 5 |
| erectile dysfunction | ✓ | | | | | | | ✓ | 2 |
| male infertility | ✓ | ✓ | | | | | | ✓ | 3 |
| nephrolithiasis | ✓ | ✓ | ✓ | | | | | ✓ | 4 |
| penile pathology | ✓ | | ✓ | | | | | ✓ | 3 |
| prostate cancer | ✓ | | | ✓ | ✓ | ✓ | | ✓ | 5 |
| renal cancer | ✓ | ✓ | | ✓ | ✓ | ✓ | | ✓ | 6 |
| renal transplantation | ✓ | ✓ | | | | | ✓ | ✓ | 4 |
| testicular cancer | ✓ | ✓ | | ✓ | ✓ | ✓ | | ✓ | 6 |
| ureteral obstruction | ✓ | ✓ | ✓ | | | | | ✓ | 4 |
| urinary incontinence | ✓ | | | | | | | ✓ | 2 |
| urinary retention | ✓ | | ✓ | | | | | ✓ | 3 |

Per-question: approach 13 · laterality 6 · urgency 4 · surgicalIntent 4 · nodalSurgery 4 · neoadjuvant 4 · donorType 1 · intraopEvents 13 → **Σ 49**.

`approach` narrowing (41): BPH → transurethral (endoscopic), open, laparoscopic, robotic-assisted, other (5) · bladder cancer → transurethral (endoscopic), open, robotic-assisted, laparoscopic, other (5) · erectile dysfunction → open, other (2) · male infertility → open, other (2) · nephrolithiasis → transurethral (endoscopic), percutaneous, laparoscopic, open, other (5) · penile pathology → open, other (2) · prostate cancer → robotic-assisted, open, laparoscopic, other (4) · renal cancer → laparoscopic, robotic-assisted, open, percutaneous, other (5) · renal transplantation → open, other (2) · testicular cancer → open, laparoscopic, other (3) · urinary incontinence → open, transurethral (endoscopic), other (3) · urinary retention → transurethral (endoscopic), open, other (3). **ureteral obstruction un-narrowed** (all 6 real: stent transurethral, nephrostomy percutaneous, pyeloplasty lap/robotic/open).

`laterality` narrowing (2): renal transplantation → right, left (iliac fossa, no bilateral). Others un-narrowed (bilateral stones/tumours/varicocele occur).

`nodalSurgery` narrowing (12): each of bladder / prostate / renal / testicular cancer → none, regional lymphadenectomy, radical / extended lymphadenectomy (3 each) — no SLNB/sampling in urologic practice.

`neoadjuvant` narrowing (10): bladder cancer → none, chemotherapy, immunotherapy / targeted therapy (3) · prostate cancer → none, hormonal therapy, radiotherapy (3) · renal cancer → none, immunotherapy / targeted therapy (2) · testicular cancer → none, chemotherapy (2).

surgicalIntent / urgency / donorType un-narrowed. Σ narrowing = 41 + 2 + 12 + 10 = **65**.

### Expected totals after 186+187
questions **8** · options **32** · links **49** · narrowing **65** · NULL arValue **0**

### Migration log
| # | name | status |
|---|---|---|
| 1750000000186 | AuthorUrolAdditionalQuestions | applied ✅ (2026-07-09) |
| 1750000000187 | AddUrolQuestionNarrowing | applied ✅ (2026-07-09) |

### Final verification (staging, 2026-07-09)
- UROL: questions=8, options=32, links=49, narrowing=65, NULL arValue=0 — exact match with 2D.
- All 13 categories covered (≥2 questions each); approach narrowed per category (TURP transurethral/open, PCNL percutaneous, robotic prostatectomy; ureteral obstruction un-narrowed across all 6); the 4 cancers reuse SOC onc keys; renal transplant reuses TRS donorType.
- down() tested: revert 187+186 → re-apply → identical counts. All 14 other configured depts untouched; 0 cross-dept link violations. `npx tsc --noEmit` clean.
- **Zero new keys — third all-reuse department** (after MFS, ENT). UROL closes the full 15-department framework.
- **Full-framework integrity check (all 15 depts): 0 cross-dept link violations, 0 orphan narrowing rows, 0 choice-questions-without-options, 0 options-on-free_text, 0 NULL arValue. Grand total: 98 questions / 472 options / 700 links / 937 narrowing rows.**
