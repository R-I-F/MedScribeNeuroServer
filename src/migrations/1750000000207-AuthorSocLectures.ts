import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * SOC (Surgical Oncology) academic lectures — transcribed from the ESSO Core Curriculum ("The ESSO
 * core curriculum committee update on surgical oncology", European Society of Surgical Oncology,
 * EJSO 2021). Reference cited in MEDICAL_CODE_AUDITS/SOC/LECTURES_SOC.md.
 *
 * SOC is a subspecialty (not a standalone ISCP specialty); the ESSO core curriculum is the
 * authoritative European specialty-society curriculum (built for the EBSQ). Its numbered outline
 * maps onto the framework: lecture_topics = the 2 academic-content sections (Basic Principles of
 * Oncology; Disease Site Specific Oncology), lectures = their numbered subsections (1.1–1.10,
 * 2.1–2.11), carrying the reference's OWN outline numbers. The per-subsection two-column knowledge
 * tables are lecture content, not separate lectures. Sections 3 (Generic Clinical Skills — an empty
 * stub in the source), 4 (Training Recommendations — programme-design) and 5 (EBSQ Eligibility —
 * admin) are non-lecture content and excluded. Faithful transcription — nothing invented. **`level`
 * is NULL**: the ESSO curriculum has no MSc/MD tiering, so level is left NULL (sourced later) not
 * guessed. Bilingual (EN + AR).
 */
export class AuthorSocLectures1750000000207 implements MigrationInterface {
  name = "AuthorSocLectures1750000000207";

  // [englishTopic, arabicTopic] — the 2 ESSO academic sections, in document order
  private readonly TOPICS: Array<[string, string]> = [
    ["basic principles of oncology", "المبادئ الأساسية لعلم الأورام"],
    ["disease site specific oncology", "علم الأورام حسب موقع المرض"],
  ];

  // { topic, number (ESSO outline number), en, ar }
  private readonly LECTURES: Array<{ topic: string; number: string; en: string; ar: string }> = [
    // ── 1. basic principles of oncology ──
    { topic: "basic principles of oncology", number: "1.1", en: "carcinogenesis", ar: "التسرطن" },
    { topic: "basic principles of oncology", number: "1.2", en: "carcinogens", ar: "المواد المسرطنة" },
    { topic: "basic principles of oncology", number: "1.3", en: "epidemiology of cancer", ar: "وبائيات السرطان" },
    { topic: "basic principles of oncology", number: "1.4", en: "screening for cancer", ar: "المسح الكشفي للسرطان" },
    { topic: "basic principles of oncology", number: "1.5", en: "clinical trials and research methods", ar: "التجارب السريرية وطرق البحث" },
    { topic: "basic principles of oncology", number: "1.6", en: "radiation biology", ar: "بيولوجيا الإشعاع" },
    { topic: "basic principles of oncology", number: "1.7", en: "principles of chemotherapy and targeted molecular therapies", ar: "مبادئ العلاج الكيميائي والعلاجات الجزيئية الموجهة" },
    { topic: "basic principles of oncology", number: "1.8", en: "principles of systemic therapy for solid cancers", ar: "مبادئ العلاج الجهازي للسرطانات الصلبة" },
    { topic: "basic principles of oncology", number: "1.9", en: "palliative and end of life care", ar: "الرعاية التلطيفية ورعاية نهاية الحياة" },
    { topic: "basic principles of oncology", number: "1.10", en: "psycho-oncology and communication skills", ar: "علم النفس الورمي ومهارات التواصل" },
    // ── 2. disease site specific oncology ──
    { topic: "disease site specific oncology", number: "2.1", en: "breast cancer", ar: "سرطان الثدي" },
    { topic: "disease site specific oncology", number: "2.2", en: "colorectal cancer", ar: "سرطان القولون والمستقيم" },
    { topic: "disease site specific oncology", number: "2.3", en: "thoracic cancer", ar: "سرطان الصدر" },
    { topic: "disease site specific oncology", number: "2.4", en: "upper gastro-intestinal cancer (oesophageal, gastric, gist, small bowel)", ar: "سرطان الجهاز الهضمي العلوي (المريء والمعدة والأورام اللحمية المعدية المعوية والأمعاء الدقيقة)" },
    { topic: "disease site specific oncology", number: "2.5", en: "hepatopancreatobiliary cancer", ar: "سرطان الكبد والبنكرياس والقنوات الصفراوية" },
    { topic: "disease site specific oncology", number: "2.6", en: "skin cancer and melanoma", ar: "سرطان الجلد والميلانوما" },
    { topic: "disease site specific oncology", number: "2.7", en: "urological malignancies", ar: "الأورام الخبيثة البولية" },
    { topic: "disease site specific oncology", number: "2.8", en: "endocrine malignancies (thyroid, parathyroid, adrenal and pancreatic endocrine all nets)", ar: "الأورام الخبيثة الصماوية (الدرقية وجارة الدرقية والكظرية والغدد الصماء البنكرياسية وجميع الأورام العصبية الصماوية)" },
    { topic: "disease site specific oncology", number: "2.9", en: "sarcoma", ar: "الساركوما (الأورام اللحمية)" },
    { topic: "disease site specific oncology", number: "2.10", en: "gynaecological malignancies", ar: "الأورام الخبيثة النسائية" },
    { topic: "disease site specific oncology", number: "2.11", en: "peritoneal surface malignancies", ar: "أورام السطح البريتوني الخبيثة" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    // ── Topics (both) ──
    const topicRows = this.TOPICS.map(([en, ar], i) => `('${q(en)}', '${q(ar)}', ${i})`).join(",\n        ");
    await queryRunner.query(`
      INSERT INTO "lecture_topics" ("departmentId", "title", "arTitle", "sortOrder")
      SELECT d."id", v.title, v.ar, v.ord
      FROM "departments" d
      CROSS JOIN (VALUES ${topicRows}) AS v(title, ar, ord)
      WHERE d."code" = 'SOC'
    `);

    // ── Lectures (ESSO outline numbers, level NULL); sortOrder = section*1e6 + subsection*1e3 ──
    const rows = this.LECTURES.map((l) => {
      const [sec, sub] = l.number.split(".").map((x) => parseInt(x, 10));
      const ord = sec * 1_000_000 + sub * 1_000;
      return `('${q(l.topic)}', '${q(l.number)}', '${q(l.en)}', '${q(l.ar)}', ${ord})`;
    });
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).join(",\n          ");
      await queryRunner.query(`
        INSERT INTO "lectures" ("topicId", "lectureNumber", "title", "arTitle", "level", "sortOrder")
        SELECT lt."id", v.number, v.title, v.ar, NULL, v.ord
        FROM (VALUES ${batch}) AS v(topic, number, title, ar, ord)
        JOIN "departments" d ON d."code" = 'SOC'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Deleting the SOC topics cascades to their lectures.
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'SOC'
    `);
  }
}
