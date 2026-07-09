import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * VASC (Vascular Surgery) academic lectures — transcribed from the ISCP Vascular Surgery Curriculum
 * (Aug 2021), Appendix 2 "Vascular Surgery Syllabus". Reference cited in
 * MEDICAL_CODE_AUDITS/VASC/LECTURES_VASC.md.
 *
 * The reference's two-level structure maps onto the framework: lecture_topics = the 5 SECTION
 * groupings, lectures = the 47 ALL-CAPS topics (each a discrete teachable unit with its own
 * OBJECTIVES). The per-topic OBJECTIVES competency statements are lecture content, not separate
 * lectures. Faithful transcription — nothing invented. Each lecture is section 1 (KNOWLEDGE/CLINICAL),
 * numbered `<topic>.1.<n>`. **`level` is NULL** on every row: the ISCP Phase-2/Phase-3 markers are
 * training-phase tiers, NOT the Egyptian MSc/MD construct, so level is left NULL (sourced later) not
 * guessed. Bilingual (EN + AR).
 */
export class AuthorVascLectures1750000000204 implements MigrationInterface {
  name = "AuthorVascLectures1750000000204";

  // [englishTopic, arabicTopic] — 5 ISCP Appendix-2 section groupings, in document order
  private readonly TOPICS: Array<[string, string]> = [
    ["vascular surgery generic topics", "الموضوعات العامة لجراحة الأوعية الدموية"],
    ["vascular surgery imaging", "التصوير في جراحة الأوعية الدموية"],
    ["vascular surgery generic procedures 1", "الإجراءات العامة في جراحة الأوعية الدموية (1)"],
    ["vascular surgery generic procedures 2", "الإجراءات العامة في جراحة الأوعية الدموية (2)"],
    ["vascular surgery abdominal and general surgery topics", "موضوعات جراحة البطن والجراحة العامة في جراحة الأوعية"],
  ];

  // section 1 = KNOWLEDGE/CLINICAL. { topic, en, ar } — ALL-CAPS topics in document order.
  private readonly LECTURES: Array<{ topic: string; en: string; ar: string }> = [
    // ── 1. vascular surgery generic topics ──
    { topic: "vascular surgery generic topics", en: "vascular anatomy", ar: "تشريح الأوعية الدموية" },
    { topic: "vascular surgery generic topics", en: "vascular physiology", ar: "فسيولوجيا الأوعية الدموية" },
    { topic: "vascular surgery generic topics", en: "vascular pathology", ar: "باثولوجيا الأوعية الدموية" },
    { topic: "vascular surgery generic topics", en: "vascular epidemiology", ar: "وبائيات أمراض الأوعية الدموية" },
    { topic: "vascular surgery generic topics", en: "screening and surveillance", ar: "المسح الكشفي والترصد" },
    { topic: "vascular surgery generic topics", en: "risk factor modification", ar: "تعديل عوامل الخطر" },
    { topic: "vascular surgery generic topics", en: "vascular conditions of childhood", ar: "الحالات الوعائية في الطفولة" },
    { topic: "vascular surgery generic topics", en: "nutrition", ar: "التغذية" },
    { topic: "vascular surgery generic topics", en: "cardio-respiratory disease", ar: "الأمراض القلبية التنفسية" },
    { topic: "vascular surgery generic topics", en: "haematology", ar: "أمراض الدم" },
    { topic: "vascular surgery generic topics", en: "clinical audit, research & health economics", ar: "التدقيق السريري والبحث واقتصاديات الصحة" },
    { topic: "vascular surgery generic topics", en: "outpatient, ward and mdt meetings", ar: "العيادات الخارجية والأقسام واجتماعات الفريق متعدد التخصصات" },
    // ── 2. vascular surgery imaging ──
    { topic: "vascular surgery imaging", en: "principles of vascular imaging", ar: "مبادئ التصوير الوعائي" },
    { topic: "vascular surgery imaging", en: "vascular ultrasound", ar: "الموجات فوق الصوتية الوعائية" },
    { topic: "vascular surgery imaging", en: "computed tomographic imaging", ar: "التصوير المقطعي المحوسب" },
    { topic: "vascular surgery imaging", en: "magnetic resonance imaging", ar: "التصوير بالرنين المغناطيسي" },
    { topic: "vascular surgery imaging", en: "catheter angiography", ar: "تصوير الأوعية بالقسطرة" },
    // ── 3. vascular surgery generic procedures 1 ──
    { topic: "vascular surgery generic procedures 1", en: "open vascular surgery", ar: "جراحة الأوعية المفتوحة" },
    // ── 4. vascular surgery generic procedures 2 ──
    { topic: "vascular surgery generic procedures 2", en: "endovascular procedures", ar: "الإجراءات داخل الوعائية" },
    { topic: "vascular surgery generic procedures 2", en: "acute lower limb ischaemia", ar: "الإقفار الحاد للطرف السفلي" },
    { topic: "vascular surgery generic procedures 2", en: "vascular trauma", ar: "إصابات الأوعية الدموية" },
    { topic: "vascular surgery generic procedures 2", en: "chronic lower limb ischaemia", ar: "الإقفار المزمن للطرف السفلي" },
    { topic: "vascular surgery generic procedures 2", en: "vascular complications of diabetes", ar: "المضاعفات الوعائية للسكري" },
    { topic: "vascular surgery generic procedures 2", en: "vascular disease of the upper limb", ar: "المرض الوعائي للطرف العلوي" },
    { topic: "vascular surgery generic procedures 2", en: "hyperhidrosis", ar: "فرط التعرق" },
    { topic: "vascular surgery generic procedures 2", en: "vasospastic disorders and vasculitis", ar: "الاضطرابات التشنجية الوعائية والتهاب الأوعية" },
    { topic: "vascular surgery generic procedures 2", en: "carotid artery disease", ar: "مرض الشريان السباتي" },
    { topic: "vascular surgery generic procedures 2", en: "aneurysm - elective", ar: "أم الدم - الاختيارية" },
    { topic: "vascular surgery generic procedures 2", en: "aneurysm - emergency", ar: "أم الدم - الطارئة" },
    { topic: "vascular surgery generic procedures 2", en: "vascular access (va)", ar: "الوصول الوعائي (VA)" },
    { topic: "vascular surgery generic procedures 2", en: "renovascular disease and transplantation", ar: "المرض الوعائي الكلوي وزرع الكلى" },
    { topic: "vascular surgery generic procedures 2", en: "mesenteric vascular disease", ar: "المرض الوعائي المساريقي" },
    { topic: "vascular surgery generic procedures 2", en: "superficial venous disease", ar: "المرض الوريدي السطحي" },
    { topic: "vascular surgery generic procedures 2", en: "deep venous thrombosis", ar: "الخثار الوريدي العميق" },
    { topic: "vascular surgery generic procedures 2", en: "deep venous insufficiency", ar: "القصور الوريدي العميق" },
    { topic: "vascular surgery generic procedures 2", en: "lymphoedema", ar: "الوذمة اللمفية" },
    // ── 5. vascular surgery abdominal and general surgery topics ──
    { topic: "vascular surgery abdominal and general surgery topics", en: "superficial sepsis including necrotising infections", ar: "الإنتان السطحي بما في ذلك العداوى المنخرة" },
    { topic: "vascular surgery abdominal and general surgery topics", en: "abdominal wall", ar: "جدار البطن" },
    { topic: "vascular surgery abdominal and general surgery topics", en: "laparoscopic surgery", ar: "الجراحة بالمنظار" },
    { topic: "vascular surgery abdominal and general surgery topics", en: "elective hernia", ar: "الفتق الاختياري" },
    { topic: "vascular surgery abdominal and general surgery topics", en: "acute abdomen", ar: "البطن الحاد" },
    { topic: "vascular surgery abdominal and general surgery topics", en: "acute intestinal obstruction", ar: "الانسداد المعوي الحاد" },
    { topic: "vascular surgery abdominal and general surgery topics", en: "gastrointestinal bleeding", ar: "نزف الجهاز الهضمي" },
    { topic: "vascular surgery abdominal and general surgery topics", en: "abdominal injuries", ar: "إصابات البطن" },
    { topic: "vascular surgery abdominal and general surgery topics", en: "gastric stasis, paralytic ileus and constipation", ar: "الركود المعدي والعلوص الشللي والإمساك" },
    { topic: "vascular surgery abdominal and general surgery topics", en: "ischaemic and infectious colitis", ar: "التهاب القولون الإقفاري والعدوائي" },
    { topic: "vascular surgery abdominal and general surgery topics", en: "reticulo-endothelial system", ar: "الجهاز الشبكي البطاني" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    // ── Topics (all 5) ──
    const topicRows = this.TOPICS.map(([en, ar], i) => `('${q(en)}', '${q(ar)}', ${i})`).join(",\n        ");
    await queryRunner.query(`
      INSERT INTO "lecture_topics" ("departmentId", "title", "arTitle", "sortOrder")
      SELECT d."id", v.title, v.ar, v.ord
      FROM "departments" d
      CROSS JOIN (VALUES ${topicRows}) AS v(title, ar, ord)
      WHERE d."code" = 'VASC'
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
        JOIN "departments" d ON d."code" = 'VASC'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Deleting the VASC topics cascades to their lectures.
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'VASC'
    `);
  }
}
