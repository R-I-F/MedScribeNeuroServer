# LECTURES AUDIT — UROL (Urology) · جراحة المسالك البولية

**Reference:** ISCP Urology Curriculum (Aug 2021), **Appendix 2 "Urology Syllabus"** · Intercollegiate
Surgical Curriculum Programme (ISCP), Joint Committee on Surgical Training / UK surgical royal colleges ·
2021 · https://www.iscp.ac.uk/media/1186/appendix-2-urology-syllabus.pdf
(full curriculum: https://www.iscp.ac.uk/media/1112/urology-curriculum-aug-2021-approved-oct-20.pdf)

Chosen because UROL is an ISCP surgical specialty and the standalone Appendix-2 syllabus PDF enumerates
the whole urology curriculum. (Egyptian source-0 checked first — Mansoura Faculty of Medicine urology page
awards MSc/MD but publishes no enumerated topic list online — so the ISCP syllabus is used for the LIST with
`level = NULL`, exactly as CTS/ENT/etc.)

---

## 🔄 Progress Checkpoint
- **Last updated:** 2026-07-10
- **Current step:** Phase 5 — finalize (record)
- **Migration reserved:** `1750000000216` — AuthorUrolLectures (single file; 87 rows < 180)
- **Step status:**
  - [x] Phase 0 — reference found & cited (ISCP Urology Syllabus, Aug 2021, App 2)
  - [x] Phase 1 — staging state loaded (UROL = FRESH; 0 topics / 0 lectures)
  - [x] Phase 2A — topics extracted (7)
  - [x] Phase 2B — lectures transcribed (87)
  - [x] Phase 2C — Arabic titles authored (all topics + all lectures)
  - [x] Phase 3 — migration written `[applied]`
  - [x] Phase 4 — registered, applied, verified
  - [x] Phase 5 — record finalized
- **▶ Next action:** COMPLETE.

---

## Mapping decision (faithful transcription)

The ISCP Urology syllabus has **three top-level parts**, each with its own enumerated entries. Following the
ENT/CTS precedent (topics = the reference's own top-level groupings; lectures = its topic entries; per-topic
knowledge/clinical/technical bullets are lecture **content**, not separate lectures), each top-level grouping
becomes a `lecture_topic` and its enumerated entries become `lectures` (all section 1, numbered `<topic>.1.<n>`):

1. **certification competencies** — the "At certification, all Urologists will be able to:" clinical-objective
   headings (each a "Manage the patient presenting with…" line). → 19 lectures.
2. **knowledge** — the "Knowledge" syllabus: Basic Science Level (Anatomy / Physiology / Pharmacology /
   Pathology) + the 28 knowledge condition-blocks. → 32 lectures.
3–7. the **5 Special-Interest Modular Curricula** (General Urology; Female, Functional & Reconstructive
   Urology; Endourology; Andrology & Infertility; Urological Oncology), each Module = topic, its **Topic**
   entries = lectures. → 8 + 11 + 4 + 7 + 6 = 36 lectures.

The reference deliberately repeats several conditions across its three parts (e.g. "management of prostate
cancer" appears in Knowledge AND in the Oncology module; "assessment of lower urinary tract symptoms" in both
General and Female modules). These repeats are faithful to the source and are kept (lectures carry no
uniqueness constraint). Nothing invented — every topic and lecture traces to a heading in the PDF.

**`level` = NULL on every row.** ISCP uses training-phase / competence tiers (P2 / P3 / SI, and knowledge
levels 1–4), NOT the Cairo-University ماجستير/دكتوراه (MSc/MD) construct, so level is left NULL (never guessed),
to be backfilled later from an authoritative Egyptian MSc/MD source — same policy as CTS/ENT.

---

## Expected totals
- **Topics:** 7
- **Lectures:** 87  (msc: 0, md: 0, no-level: 87)
- **Lectures missing AR:** 0 (Arabic authored inline)

## 2A — Topics (document order → sortOrder 0..6)
| # | EN | AR |
|---|----|----|
| 0 | certification competencies | كفاءات شهادة الاختصاص |
| 1 | knowledge | المنهج المعرفي |
| 2 | general urology | جراحة المسالك البولية العامة |
| 3 | female, functional and reconstructive urology | جراحة المسالك البولية النسائية والوظيفية والترميمية |
| 4 | endourology | جراحة المسالك البولية بالمنظار (الإندويورولوجي) |
| 5 | andrology and infertility | طب الذكورة والعقم |
| 6 | urological oncology | أورام المسالك البولية |

## 2B/2C — Lectures per topic (number · EN · AR · level=NULL)

### 1. certification competencies (19)
1.1.1 manage the patient presenting with stone disease — تدبير المريض المصاب بداء الحصيات
1.1.2 manage the patient presenting with acute or chronic abdominal pain referable to the urinary tract — تدبير المريض المصاب بألم بطني حاد أو مزمن متعلق بالسبيل البولي
1.1.3 manage patients presenting with lower urinary tract symptoms (luts) — تدبير المرضى المصابين بأعراض السبيل البولي السفلي (LUTS)
1.1.4 manage the patient presenting with haematuria — تدبير المريض المصاب بالبيلة الدموية
1.1.5 manage the patient presenting with urethral stricture — تدبير المريض المصاب بتضيق الإحليل
1.1.6 manage urinary tract infections — تدبير التهابات السبيل البولي
1.1.7 manage benign & malignant lesions of male genitalia skin — تدبير الآفات الحميدة والخبيثة لجلد الأعضاء التناسلية الذكرية
1.1.8 manage patients presenting with a scrotal swelling — تدبير المرضى المصابين بتورم كيس الصفن
1.1.9 manage the patient presenting with urinary incontinence — تدبير المريض المصاب بالسلس البولي
1.1.10 manage the patient with prostate cancer — تدبير مريض سرطان البروستاتا
1.1.11 manage the patient with bladder cancer — تدبير مريض سرطان المثانة
1.1.12 manage the patient with renal cancer — تدبير مريض سرطان الكلية
1.1.13 manage the patient presenting with infertility, ejaculatory disorders etc. — تدبير المريض المصاب بالعقم واضطرابات القذف وغيرها
1.1.14 manage the patient presenting with erectile dysfunction — تدبير المريض المصاب بضعف الانتصاب
1.1.15 manage the patient presenting with penile deformity, priapism, penile fracture — تدبير المريض المصاب بتشوه القضيب والقساح وكسر القضيب
1.1.16 manage the common urological conditions of childhood — تدبير الحالات البولية الشائعة في الطفولة
1.1.17 manage the patient presenting with renal failure — تدبير المريض المصاب بالقصور الكلوي
1.1.18 manage the patient with multiple injuries — تدبير المريض المصاب بإصابات متعددة
1.1.19 manage trauma of the renal tract according to accepted protocols — تدبير إصابات السبيل البولي وفقًا للبروتوكولات المعتمدة

### 2. knowledge (32)
2.1.1 basic science: anatomy — العلوم الأساسية: التشريح
2.1.2 basic science: physiology — العلوم الأساسية: علم وظائف الأعضاء
2.1.3 basic science: pharmacology — العلوم الأساسية: علم الأدوية
2.1.4 basic science: pathology — العلوم الأساسية: علم الأمراض
2.1.5 urinary frequency/urgency syndrome and urinary urge incontinence — متلازمة تكرار/إلحاح التبول وسلس البول الإلحاحي
2.1.6 bladder and pelvic pain syndromes — متلازمات ألم المثانة والحوض
2.1.7 stress urinary incontinence in men and women — سلس البول الجهدي عند الرجال والنساء
2.1.8 female urinary retention — احتباس البول لدى الإناث
2.1.9 genito-urinary prolapse (primary and recurrent) — هبوط الأعضاء التناسلية البولية (الأولي والناكس)
2.1.10 urinary fistulae — النواسير البولية
2.1.11 urethral diverticulum — رتج الإحليل
2.1.12 defaecatory disorders and other lower gastrointestinal disorders — اضطرابات التغوط واضطرابات السبيل الهضمي السفلي الأخرى
2.1.13 reconstruction of the bladder and ureter — إعادة بناء المثانة والحالب
2.1.14 urethral reconstruction — إعادة بناء الإحليل
2.1.15 management of patients with neurogenic bladder — تدبير المرضى المصابين بالمثانة العصبية
2.1.16 diagnosis and assessment of upper urinary tract stone disease — تشخيص وتقييم داء حصيات السبيل البولي العلوي
2.1.17 acute management of ureteric colic — التدبير الحاد للمغص الحالبي
2.1.18 management of renal stones — تدبير حصيات الكلية
2.1.19 assessment and management of bladder stones — تقييم وتدبير حصيات المثانة
2.1.20 assessment and management of lower urinary tract obstruction — تقييم وتدبير انسداد السبيل البولي السفلي
2.1.21 andrology and infertility — طب الذكورة والعقم
2.1.22 paediatric urology — جراحة المسالك البولية للأطفال
2.1.23 transplant surgery — جراحة الزرع
2.1.24 trauma — الرضوح (الإصابات)
2.1.25 emergency urology — جراحة المسالك البولية الطارئة
2.1.26 technology — التقنيات
2.1.27 general principles in the management of urological malignancy — المبادئ العامة في تدبير الأورام الخبيثة البولية
2.1.28 management of prostate cancer — تدبير سرطان البروستاتا
2.1.29 management of bladder cancer — تدبير سرطان المثانة
2.1.30 management of renal cancer — تدبير سرطان الكلية
2.1.31 management of testicular cancer — تدبير سرطان الخصية
2.1.32 management of penile cancer — تدبير سرطان القضيب

### 3. general urology (8)
3.1.1 assessment of lower urinary tract symptoms — تقييم أعراض السبيل البولي السفلي
3.1.2 management of urological infections — تدبير الالتهابات البولية
3.1.3 upper urinary tract obstruction and stones — انسداد السبيل البولي العلوي والحصيات
3.1.4 management of benign prostatic hyperplasia — تدبير تضخم البروستاتا الحميد
3.1.5 erectile dysfunction and hypogonadism — ضعف الانتصاب وقصور الغدد التناسلية
3.1.6 female, functional and reconstructive urology — جراحة المسالك البولية النسائية والوظيفية والترميمية
3.1.7 emergency urology — جراحة المسالك البولية الطارئة
3.1.8 paediatric urology — جراحة المسالك البولية للأطفال

### 4. female, functional and reconstructive urology (11)
4.1.1 assessment of lower urinary tract symptoms — تقييم أعراض السبيل البولي السفلي
4.1.2 management of overactive bladder and urge incontinence — تدبير فرط نشاط المثانة وسلس البول الإلحاحي
4.1.3 bladder and pelvic pain syndromes — متلازمات ألم المثانة والحوض
4.1.4 neuropathic bladder — المثانة العصبية
4.1.5 stress urinary incontinence in men and women — سلس البول الجهدي عند الرجال والنساء
4.1.6 female urinary retention — احتباس البول لدى الإناث
4.1.7 genito-urinary prolapse (primary and recurrent) — هبوط الأعضاء التناسلية البولية (الأولي والناكس)
4.1.8 urinary fistulae — النواسير البولية
4.1.9 urethral diverticulum — رتج الإحليل
4.1.10 reconstruction of the bladder and ureter — إعادة بناء المثانة والحالب
4.1.11 urethral reconstruction — إعادة بناء الإحليل

### 5. endourology (4)
5.1.1 diagnosis and assessment of upper urinary tract stone disease and obstruction — تشخيص وتقييم داء حصيات وانسداد السبيل البولي العلوي
5.1.2 acute management of ureteric colic and upper urinary tract obstruction — التدبير الحاد للمغص الحالبي وانسداد السبيل البولي العلوي
5.1.3 management of renal stones — تدبير حصيات الكلية
5.1.4 assessment and management of bladder stones — تقييم وتدبير حصيات المثانة

### 6. andrology and infertility (7)
6.1.1 male infertility — العقم عند الذكور
6.1.2 erectile dysfunction — ضعف الانتصاب
6.1.3 ejaculatory dysfunction — اضطراب القذف
6.1.4 peyronie's disease — داء بيروني
6.1.5 penile enlargement, reconstruction and phalloplasty — تكبير القضيب وإعادة بنائه ورأب القضيب
6.1.6 priapism — القساح
6.1.7 penile cancer — سرطان القضيب

### 7. urological oncology (6)
7.1.1 urological cancers — سرطانات المسالك البولية
7.1.2 management of prostate cancer — تدبير سرطان البروستاتا
7.1.3 management of bladder cancer — تدبير سرطان المثانة
7.1.4 management of renal cancer — تدبير سرطان الكلية
7.1.5 management of testicular cancer — تدبير سرطان الخصية
7.1.6 management of penile cancer — تدبير سرطان القضيب

---

## Migration log
- `1750000000216-AuthorUrolLectures.ts` — 7 topics + 87 lectures, all `level = NULL`, bilingual. `[applied ✅]`

## Still-open items
- `level` (MSc/MD) NULL on all 87 rows — backfill later from an authoritative Egyptian (Cairo Univ.)
  urology postgraduate bylaw / course-spec, or the production tenant lectures table. Never guessed.
