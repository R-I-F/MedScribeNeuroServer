import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PEDSURG (Pediatric Surgery) academic lectures — transcribed from the ISCP Paediatric Surgery
 * Curriculum (Aug 2021), Appendix 2 "Syllabus". Reference cited in
 * MEDICAL_CODE_AUDITS/PEDSURG/LECTURES_PEDSURG.md.
 *
 * The reference's Category → Topic structure maps onto the framework: lecture_topics = the 9
 * CATEGORIES, lectures = the 62 TOPICS (each Topic has its own Objective — a teachable unit). The
 * per-topic Knowledge/Clinical/Technical bullets are lecture content, not separate lectures.
 * Faithful transcription — nothing invented. Each lecture is section 1 (KNOWLEDGE/CLINICAL),
 * numbered `<topic>.1.<n>`. **`level` is NULL** on every row: the ISCP competence numbers (1–4
 * knowledge depth) are NOT the Egyptian MSc/MD construct, so level is left NULL (sourced later) not
 * guessed. Bilingual (EN + AR).
 */
export class AuthorPedsurgLectures1750000000205 implements MigrationInterface {
  name = "AuthorPedsurgLectures1750000000205";

  // [englishTopic, arabicTopic] — 9 ISCP Appendix-2 categories, in document order
  private readonly TOPICS: Array<[string, string]> = [
    ["general surgery of childhood", "الجراحة العامة للأطفال"],
    ["gastrointestinal", "الجهاز الهضمي"],
    ["urology", "المسالك البولية"],
    ["neonatal surgery", "جراحة حديثي الولادة"],
    ["oncology", "علم الأورام"],
    ["endocrine conditions", "حالات الغدد الصماء"],
    ["thoracic anomalies", "تشوهات الصدر"],
    ["operative skills", "المهارات الجراحية"],
    ["management", "الإدارة"],
  ];

  // section 1 = KNOWLEDGE/CLINICAL. { topic, en, ar } — topics in document order.
  private readonly LECTURES: Array<{ topic: string; en: string; ar: string }> = [
    // ── 1. general surgery of childhood ──
    { topic: "general surgery of childhood", en: "groin conditions", ar: "حالات الأربية" },
    { topic: "general surgery of childhood", en: "abdominal wall pathologies", ar: "أمراض جدار البطن" },
    { topic: "general surgery of childhood", en: "head and neck swellings", ar: "تورمات الرأس والرقبة" },
    // ── 2. gastrointestinal ──
    { topic: "gastrointestinal", en: "pyloric stenosis", ar: "تضيق البواب" },
    { topic: "gastrointestinal", en: "gastro-oesophageal reflux", ar: "الجزر المعدي المريئي" },
    { topic: "gastrointestinal", en: "abdominal pain", ar: "ألم البطن" },
    { topic: "gastrointestinal", en: "constipation", ar: "الإمساك" },
    { topic: "gastrointestinal", en: "gastro-intestinal bleeding", ar: "نزف الجهاز الهضمي" },
    { topic: "gastrointestinal", en: "intestinal obstruction", ar: "الانسداد المعوي" },
    { topic: "gastrointestinal", en: "inflammatory bowel disease", ar: "مرض الأمعاء الالتهابي" },
    { topic: "gastrointestinal", en: "short bowel syndrome", ar: "متلازمة الأمعاء القصيرة" },
    { topic: "gastrointestinal", en: "liver/biliary disease", ar: "أمراض الكبد والقنوات الصفراوية" },
    // ── 3. urology ──
    { topic: "urology", en: "urinary tract infection", ar: "عدوى المسالك البولية" },
    { topic: "urology", en: "haematuria", ar: "البيلة الدموية" },
    { topic: "urology", en: "hypospadias", ar: "الإحليل التحتي" },
    { topic: "urology", en: "posterior urethral valves", ar: "الصمامات الإحليلية الخلفية" },
    { topic: "urology", en: "urinary tract calculus disease", ar: "مرض حصوات المسالك البولية" },
    { topic: "urology", en: "bladder dysfunction (incl. neuropathic bladder)", ar: "خلل وظيفة المثانة (بما في ذلك المثانة العصبية)" },
    { topic: "urology", en: "renal failure", ar: "الفشل الكلوي" },
    { topic: "urology", en: "bladder exstrophy (to include outlet anomalies e.g. epispadias)", ar: "انقلاب المثانة الخارجي (بما في ذلك تشوهات المخرج مثل الإحليل الفوقي)" },
    { topic: "urology", en: "duplication of urinary tract", ar: "ازدواج المسالك البولية" },
    { topic: "urology", en: "urethral meatus", ar: "فوهة الإحليل" },
    { topic: "urology", en: "epispadias", ar: "الإحليل الفوقي" },
    { topic: "urology", en: "vesico-ureteric reflux", ar: "الجزر المثاني الحالبي" },
    // ── 4. neonatal surgery ──
    { topic: "neonatal surgery", en: "small bowel duplications", ar: "ازدواجات الأمعاء الدقيقة" },
    { topic: "neonatal surgery", en: "sacro coccygeal teratoma", ar: "المسخي العجزي العصعصي" },
    { topic: "neonatal surgery", en: "congenital diaphragmatic hernia", ar: "الفتق الحجابي الخلقي" },
    { topic: "neonatal surgery", en: "intestinal atresias", ar: "رتق الأمعاء" },
    { topic: "neonatal surgery", en: "meconium ileus", ar: "علوص العقي" },
    { topic: "neonatal surgery", en: "malrotation", ar: "سوء الدوران المعوي" },
    { topic: "neonatal surgery", en: "hirschsprung's disease", ar: "داء هيرشسبرونغ" },
    { topic: "neonatal surgery", en: "oesophageal atresia and tracheo-oesophageal fistula", ar: "رتق المريء والناسور الرغامي المريئي" },
    { topic: "neonatal surgery", en: "anorectal malformations", ar: "تشوهات الشرج والمستقيم" },
    { topic: "neonatal surgery", en: "necrotising enterocolitis", ar: "التهاب الأمعاء والقولون النخر" },
    { topic: "neonatal surgery", en: "neonatal abdominal wall defects", ar: "عيوب جدار البطن لدى حديثي الولادة" },
    { topic: "neonatal surgery", en: "disorders of sex development", ar: "اضطرابات التطور الجنسي" },
    { topic: "neonatal surgery", en: "antenatal management", ar: "التدبير قبل الولادة" },
    // ── 5. oncology ──
    { topic: "oncology", en: "wilms tumour", ar: "ورم ويلمز" },
    { topic: "oncology", en: "neuroblastoma", ar: "الورم الأرومي العصبي" },
    { topic: "oncology", en: "hepatoblastoma", ar: "الورم الأرومي الكبدي" },
    { topic: "oncology", en: "soft tissue tumours", ar: "أورام الأنسجة الرخوة" },
    { topic: "oncology", en: "haematological malignancies", ar: "الأورام الخبيثة الدموية" },
    { topic: "oncology", en: "benign tumours", ar: "الأورام الحميدة" },
    { topic: "oncology", en: "generic procedures", ar: "الإجراءات العامة" },
    // ── 6. endocrine conditions ──
    { topic: "endocrine conditions", en: "adrenal gland", ar: "الغدة الكظرية" },
    { topic: "endocrine conditions", en: "disease of the thyroid gland", ar: "أمراض الغدة الدرقية" },
    { topic: "endocrine conditions", en: "parathyroid disease", ar: "أمراض الغدة جارة الدرقية" },
    { topic: "endocrine conditions", en: "diabetes", ar: "السكري" },
    { topic: "endocrine conditions", en: "disorders of growth", ar: "اضطرابات النمو" },
    { topic: "endocrine conditions", en: "disorders of secondary sexual development", ar: "اضطرابات التطور الجنسي الثانوي" },
    // ── 7. thoracic anomalies ──
    { topic: "thoracic anomalies", en: "chest wall anomalies", ar: "تشوهات جدار الصدر" },
    { topic: "thoracic anomalies", en: "congenital and acquired lung abnormalities including management of empyema", ar: "تشوهات الرئة الخلقية والمكتسبة بما في ذلك تدبير الدُّبيلة" },
    { topic: "thoracic anomalies", en: "tracheal anomalies", ar: "تشوهات الرغامى" },
    { topic: "thoracic anomalies", en: "inhaled/aspirated/ingested foreign body", ar: "الجسم الغريب المستنشق/المستنشَق شفطًا/المبتلع" },
    // ── 8. operative skills ──
    { topic: "operative skills", en: "pre-operative care", ar: "الرعاية قبل الجراحة" },
    { topic: "operative skills", en: "intra-operative care", ar: "الرعاية أثناء الجراحة" },
    { topic: "operative skills", en: "post-operative care", ar: "الرعاية بعد الجراحة" },
    // ── 9. management ──
    { topic: "management", en: "nhs structure", ar: "هيكل الخدمة الصحية الوطنية (NHS)" },
    { topic: "management", en: "trust/hospital/health authority managerial", ar: "الإدارة على مستوى المؤسسة/المستشفى/الهيئة الصحية" },
    { topic: "management", en: "leadership", ar: "القيادة" },
    { topic: "management", en: "supporting training", ar: "دعم التدريب" },
    { topic: "management", en: "interview process", ar: "عملية المقابلة" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    // ── Topics (all 9) ──
    const topicRows = this.TOPICS.map(([en, ar], i) => `('${q(en)}', '${q(ar)}', ${i})`).join(",\n        ");
    await queryRunner.query(`
      INSERT INTO "lecture_topics" ("departmentId", "title", "arTitle", "sortOrder")
      SELECT d."id", v.title, v.ar, v.ord
      FROM "departments" d
      CROSS JOIN (VALUES ${topicRows}) AS v(title, ar, ord)
      WHERE d."code" = 'PEDSURG'
    `);

    // ── Lectures (section 1, level NULL) ──
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
        JOIN "departments" d ON d."code" = 'PEDSURG'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Deleting the PEDSURG topics cascades to their lectures.
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'PEDSURG'
    `);
  }
}
