import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * UROL (Urology) academic lectures — transcribed from the ISCP Urology Curriculum (Aug 2021),
 * Appendix 2 "Urology Syllabus". Reference cited in MEDICAL_CODE_AUDITS/UROL/LECTURES_UROL.md.
 *
 * The syllabus has three top-level parts, each mapped onto the framework (topics = the reference's
 * own top-level groupings, lectures = its enumerated topic entries; per-topic knowledge/clinical/
 * technical bullets are lecture content, not separate lectures):
 *   1. certification competencies — the "At certification, all Urologists will be able to:" clinical
 *      objective headings (19).
 *   2. knowledge — the "Knowledge" syllabus: Basic Science Level (anatomy/physiology/pharmacology/
 *      pathology) + the 28 knowledge condition-blocks (32).
 *   3–7. the 5 Special-Interest Modular Curricula (General Urology; Female, Functional &
 *      Reconstructive Urology; Endourology; Andrology & Infertility; Urological Oncology) — each
 *      module = topic, its Topic entries = lectures (8 + 11 + 4 + 7 + 6).
 * Total: 7 topics / 87 lectures. The reference deliberately repeats several conditions across its
 * three parts (kept faithfully; lectures carry no uniqueness constraint). Nothing invented.
 *
 * Each lecture is section 1 (KNOWLEDGE/CLINICAL), numbered <topic>.1.<n>. **`level` is NULL** on
 * every row: ISCP uses training-phase / competence tiers (P2/P3/SI, knowledge levels 1–4), NOT the
 * Egyptian ماجستير/دكتوراه (MSc/MD) construct, so level is left NULL (to be sourced later, not guessed).
 * Bilingual (EN + AR).
 */
export class AuthorUrolLectures1750000000216 implements MigrationInterface {
  name = "AuthorUrolLectures1750000000216";

  // [englishTopic, arabicTopic] — 7 ISCP top-level groupings, in document order
  private readonly TOPICS: Array<[string, string]> = [
    ["certification competencies", "كفاءات شهادة الاختصاص"],
    ["knowledge", "المنهج المعرفي"],
    ["general urology", "جراحة المسالك البولية العامة"],
    ["female, functional and reconstructive urology", "جراحة المسالك البولية النسائية والوظيفية والترميمية"],
    ["endourology", "جراحة المسالك البولية بالمنظار (الإندويورولوجي)"],
    ["andrology and infertility", "طب الذكورة والعقم"],
    ["urological oncology", "أورام المسالك البولية"],
  ];

  // section 1 = KNOWLEDGE/CLINICAL. { topic, en, ar } — topic entries in document order.
  private readonly LECTURES: Array<{ topic: string; en: string; ar: string }> = [
    // ── 1. certification competencies ──
    { topic: "certification competencies", en: "manage the patient presenting with stone disease", ar: "تدبير المريض المصاب بداء الحصيات" },
    { topic: "certification competencies", en: "manage the patient presenting with acute or chronic abdominal pain referable to the urinary tract", ar: "تدبير المريض المصاب بألم بطني حاد أو مزمن متعلق بالسبيل البولي" },
    { topic: "certification competencies", en: "manage patients presenting with lower urinary tract symptoms (luts)", ar: "تدبير المرضى المصابين بأعراض السبيل البولي السفلي (LUTS)" },
    { topic: "certification competencies", en: "manage the patient presenting with haematuria", ar: "تدبير المريض المصاب بالبيلة الدموية" },
    { topic: "certification competencies", en: "manage the patient presenting with urethral stricture", ar: "تدبير المريض المصاب بتضيق الإحليل" },
    { topic: "certification competencies", en: "manage urinary tract infections", ar: "تدبير التهابات السبيل البولي" },
    { topic: "certification competencies", en: "manage benign & malignant lesions of male genitalia skin", ar: "تدبير الآفات الحميدة والخبيثة لجلد الأعضاء التناسلية الذكرية" },
    { topic: "certification competencies", en: "manage patients presenting with a scrotal swelling", ar: "تدبير المرضى المصابين بتورم كيس الصفن" },
    { topic: "certification competencies", en: "manage the patient presenting with urinary incontinence", ar: "تدبير المريض المصاب بالسلس البولي" },
    { topic: "certification competencies", en: "manage the patient with prostate cancer", ar: "تدبير مريض سرطان البروستاتا" },
    { topic: "certification competencies", en: "manage the patient with bladder cancer", ar: "تدبير مريض سرطان المثانة" },
    { topic: "certification competencies", en: "manage the patient with renal cancer", ar: "تدبير مريض سرطان الكلية" },
    { topic: "certification competencies", en: "manage the patient presenting with infertility, ejaculatory disorders etc.", ar: "تدبير المريض المصاب بالعقم واضطرابات القذف وغيرها" },
    { topic: "certification competencies", en: "manage the patient presenting with erectile dysfunction", ar: "تدبير المريض المصاب بضعف الانتصاب" },
    { topic: "certification competencies", en: "manage the patient presenting with penile deformity, priapism, penile fracture", ar: "تدبير المريض المصاب بتشوه القضيب والقساح وكسر القضيب" },
    { topic: "certification competencies", en: "manage the common urological conditions of childhood", ar: "تدبير الحالات البولية الشائعة في الطفولة" },
    { topic: "certification competencies", en: "manage the patient presenting with renal failure", ar: "تدبير المريض المصاب بالقصور الكلوي" },
    { topic: "certification competencies", en: "manage the patient with multiple injuries", ar: "تدبير المريض المصاب بإصابات متعددة" },
    { topic: "certification competencies", en: "manage trauma of the renal tract according to accepted protocols", ar: "تدبير إصابات السبيل البولي وفقًا للبروتوكولات المعتمدة" },
    // ── 2. knowledge ──
    { topic: "knowledge", en: "basic science: anatomy", ar: "العلوم الأساسية: التشريح" },
    { topic: "knowledge", en: "basic science: physiology", ar: "العلوم الأساسية: علم وظائف الأعضاء" },
    { topic: "knowledge", en: "basic science: pharmacology", ar: "العلوم الأساسية: علم الأدوية" },
    { topic: "knowledge", en: "basic science: pathology", ar: "العلوم الأساسية: علم الأمراض" },
    { topic: "knowledge", en: "urinary frequency/urgency syndrome and urinary urge incontinence", ar: "متلازمة تكرار/إلحاح التبول وسلس البول الإلحاحي" },
    { topic: "knowledge", en: "bladder and pelvic pain syndromes", ar: "متلازمات ألم المثانة والحوض" },
    { topic: "knowledge", en: "stress urinary incontinence in men and women", ar: "سلس البول الجهدي عند الرجال والنساء" },
    { topic: "knowledge", en: "female urinary retention", ar: "احتباس البول لدى الإناث" },
    { topic: "knowledge", en: "genito-urinary prolapse (primary and recurrent)", ar: "هبوط الأعضاء التناسلية البولية (الأولي والناكس)" },
    { topic: "knowledge", en: "urinary fistulae", ar: "النواسير البولية" },
    { topic: "knowledge", en: "urethral diverticulum", ar: "رتج الإحليل" },
    { topic: "knowledge", en: "defaecatory disorders and other lower gastrointestinal disorders", ar: "اضطرابات التغوط واضطرابات السبيل الهضمي السفلي الأخرى" },
    { topic: "knowledge", en: "reconstruction of the bladder and ureter", ar: "إعادة بناء المثانة والحالب" },
    { topic: "knowledge", en: "urethral reconstruction", ar: "إعادة بناء الإحليل" },
    { topic: "knowledge", en: "management of patients with neurogenic bladder", ar: "تدبير المرضى المصابين بالمثانة العصبية" },
    { topic: "knowledge", en: "diagnosis and assessment of upper urinary tract stone disease", ar: "تشخيص وتقييم داء حصيات السبيل البولي العلوي" },
    { topic: "knowledge", en: "acute management of ureteric colic", ar: "التدبير الحاد للمغص الحالبي" },
    { topic: "knowledge", en: "management of renal stones", ar: "تدبير حصيات الكلية" },
    { topic: "knowledge", en: "assessment and management of bladder stones", ar: "تقييم وتدبير حصيات المثانة" },
    { topic: "knowledge", en: "assessment and management of lower urinary tract obstruction", ar: "تقييم وتدبير انسداد السبيل البولي السفلي" },
    { topic: "knowledge", en: "andrology and infertility", ar: "طب الذكورة والعقم" },
    { topic: "knowledge", en: "paediatric urology", ar: "جراحة المسالك البولية للأطفال" },
    { topic: "knowledge", en: "transplant surgery", ar: "جراحة الزرع" },
    { topic: "knowledge", en: "trauma", ar: "الرضوح (الإصابات)" },
    { topic: "knowledge", en: "emergency urology", ar: "جراحة المسالك البولية الطارئة" },
    { topic: "knowledge", en: "technology", ar: "التقنيات" },
    { topic: "knowledge", en: "general principles in the management of urological malignancy", ar: "المبادئ العامة في تدبير الأورام الخبيثة البولية" },
    { topic: "knowledge", en: "management of prostate cancer", ar: "تدبير سرطان البروستاتا" },
    { topic: "knowledge", en: "management of bladder cancer", ar: "تدبير سرطان المثانة" },
    { topic: "knowledge", en: "management of renal cancer", ar: "تدبير سرطان الكلية" },
    { topic: "knowledge", en: "management of testicular cancer", ar: "تدبير سرطان الخصية" },
    { topic: "knowledge", en: "management of penile cancer", ar: "تدبير سرطان القضيب" },
    // ── 3. general urology ──
    { topic: "general urology", en: "assessment of lower urinary tract symptoms", ar: "تقييم أعراض السبيل البولي السفلي" },
    { topic: "general urology", en: "management of urological infections", ar: "تدبير الالتهابات البولية" },
    { topic: "general urology", en: "upper urinary tract obstruction and stones", ar: "انسداد السبيل البولي العلوي والحصيات" },
    { topic: "general urology", en: "management of benign prostatic hyperplasia", ar: "تدبير تضخم البروستاتا الحميد" },
    { topic: "general urology", en: "erectile dysfunction and hypogonadism", ar: "ضعف الانتصاب وقصور الغدد التناسلية" },
    { topic: "general urology", en: "female, functional and reconstructive urology", ar: "جراحة المسالك البولية النسائية والوظيفية والترميمية" },
    { topic: "general urology", en: "emergency urology", ar: "جراحة المسالك البولية الطارئة" },
    { topic: "general urology", en: "paediatric urology", ar: "جراحة المسالك البولية للأطفال" },
    // ── 4. female, functional and reconstructive urology ──
    { topic: "female, functional and reconstructive urology", en: "assessment of lower urinary tract symptoms", ar: "تقييم أعراض السبيل البولي السفلي" },
    { topic: "female, functional and reconstructive urology", en: "management of overactive bladder and urge incontinence", ar: "تدبير فرط نشاط المثانة وسلس البول الإلحاحي" },
    { topic: "female, functional and reconstructive urology", en: "bladder and pelvic pain syndromes", ar: "متلازمات ألم المثانة والحوض" },
    { topic: "female, functional and reconstructive urology", en: "neuropathic bladder", ar: "المثانة العصبية" },
    { topic: "female, functional and reconstructive urology", en: "stress urinary incontinence in men and women", ar: "سلس البول الجهدي عند الرجال والنساء" },
    { topic: "female, functional and reconstructive urology", en: "female urinary retention", ar: "احتباس البول لدى الإناث" },
    { topic: "female, functional and reconstructive urology", en: "genito-urinary prolapse (primary and recurrent)", ar: "هبوط الأعضاء التناسلية البولية (الأولي والناكس)" },
    { topic: "female, functional and reconstructive urology", en: "urinary fistulae", ar: "النواسير البولية" },
    { topic: "female, functional and reconstructive urology", en: "urethral diverticulum", ar: "رتج الإحليل" },
    { topic: "female, functional and reconstructive urology", en: "reconstruction of the bladder and ureter", ar: "إعادة بناء المثانة والحالب" },
    { topic: "female, functional and reconstructive urology", en: "urethral reconstruction", ar: "إعادة بناء الإحليل" },
    // ── 5. endourology ──
    { topic: "endourology", en: "diagnosis and assessment of upper urinary tract stone disease and obstruction", ar: "تشخيص وتقييم داء حصيات وانسداد السبيل البولي العلوي" },
    { topic: "endourology", en: "acute management of ureteric colic and upper urinary tract obstruction", ar: "التدبير الحاد للمغص الحالبي وانسداد السبيل البولي العلوي" },
    { topic: "endourology", en: "management of renal stones", ar: "تدبير حصيات الكلية" },
    { topic: "endourology", en: "assessment and management of bladder stones", ar: "تقييم وتدبير حصيات المثانة" },
    // ── 6. andrology and infertility ──
    { topic: "andrology and infertility", en: "male infertility", ar: "العقم عند الذكور" },
    { topic: "andrology and infertility", en: "erectile dysfunction", ar: "ضعف الانتصاب" },
    { topic: "andrology and infertility", en: "ejaculatory dysfunction", ar: "اضطراب القذف" },
    { topic: "andrology and infertility", en: "peyronie's disease", ar: "داء بيروني" },
    { topic: "andrology and infertility", en: "penile enlargement, reconstruction and phalloplasty", ar: "تكبير القضيب وإعادة بنائه ورأب القضيب" },
    { topic: "andrology and infertility", en: "priapism", ar: "القساح" },
    { topic: "andrology and infertility", en: "penile cancer", ar: "سرطان القضيب" },
    // ── 7. urological oncology ──
    { topic: "urological oncology", en: "urological cancers", ar: "سرطانات المسالك البولية" },
    { topic: "urological oncology", en: "management of prostate cancer", ar: "تدبير سرطان البروستاتا" },
    { topic: "urological oncology", en: "management of bladder cancer", ar: "تدبير سرطان المثانة" },
    { topic: "urological oncology", en: "management of renal cancer", ar: "تدبير سرطان الكلية" },
    { topic: "urological oncology", en: "management of testicular cancer", ar: "تدبير سرطان الخصية" },
    { topic: "urological oncology", en: "management of penile cancer", ar: "تدبير سرطان القضيب" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    // ── Topics (all 7) ──
    const topicRows = this.TOPICS.map(([en, ar], i) => `('${q(en)}', '${q(ar)}', ${i})`).join(",\n        ");
    await queryRunner.query(`
      INSERT INTO "lecture_topics" ("departmentId", "title", "arTitle", "sortOrder")
      SELECT d."id", v.title, v.ar, v.ord
      FROM "departments" d
      CROSS JOIN (VALUES ${topicRows}) AS v(title, ar, ord)
      WHERE d."code" = 'UROL'
    `);

    // ── Lectures (section 1, level NULL) ──
    // number = <topicIndex>.1.<n>; sortOrder = topicIndex*1e6 + 1e3 + n
    const topicIndex = new Map(this.TOPICS.map(([en], i) => [en, i + 1]));
    const counters = new Map<string, number>();
    const rows = this.LECTURES.map((l) => {
      const c = topicIndex.get(l.topic)!;
      const n = (counters.get(l.topic) ?? 0) + 1;
      counters.set(l.topic, n);
      const num = `${c}.1.${n}`;
      const ord = c * 1_000_000 + 1_000 + n;
      return `('${q(l.topic)}', '${q(num)}', '${q(l.en)}', '${q(l.ar)}', ${ord})`;
    });
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).join(",\n          ");
      await queryRunner.query(`
        INSERT INTO "lectures" ("topicId", "lectureNumber", "title", "arTitle", "level", "sortOrder")
        SELECT lt."id", v.number, v.title, v.ar, NULL, v.ord
        FROM (VALUES ${batch}) AS v(topic, number, title, ar, ord)
        JOIN "departments" d ON d."code" = 'UROL'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Deleting the UROL topics cascades to their lectures.
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'UROL'
    `);
  }
}
