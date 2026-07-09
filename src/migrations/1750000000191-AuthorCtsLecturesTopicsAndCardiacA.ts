import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * CTS academic lectures — transcribed from the ISCP Cardiothoracic Surgery Curriculum
 * (Aug 2021), Appendix 2 "Cardiothoracic Surgery Syllabus". Reference cited in
 * MEDICAL_CODE_AUDITS/CTS/LECTURES_CTS.md.
 *
 * Part 1 of the CTS lecture set: all 20 ISCP syllabus TOPICS (into lecture_topics) + the
 * lectures for Cardiac topics 1–3 (Cardiopulmonary Bypass, Myocardial Protection, Circulatory
 * Support). Remaining cardiac (4–7), thoracic (8–16) and cross-cutting (17–20) topics' lectures
 * follow in later migrations.
 *
 * Faithful transcription of the ISCP syllabus items — nothing invented. Each item is a syllabus
 * KNOWLEDGE/CLINICAL entry (numbered `<topic>.1.<n>`) or TECHNICAL/OPERATIVE entry
 * (`<topic>.2.<n>`). **`level` is NULL** on every row: the MSc/MD split is a Cairo-University /
 * Egyptian-bylaw construct that ISCP does not carry, so it is left NULL (to be sourced/filled
 * later) rather than guessed. Bilingual (EN + AR; brain = مخ convention where relevant).
 */
export class AuthorCtsLecturesTopicsAndCardiacA1750000000191 implements MigrationInterface {
  name = "AuthorCtsLecturesTopicsAndCardiacA1750000000191";

  // [englishTopic, arabicTopic] — 20 ISCP Appendix-2 topics, in document order
  private readonly TOPICS: Array<[string, string]> = [
    ["Cardiopulmonary Bypass", "المجازة القلبية الرئوية"],
    ["Myocardial Protection", "حماية عضلة القلب"],
    ["Circulatory Support", "الدعم الدوري"],
    ["Ischaemic Heart Disease", "مرض القلب الإقفاري"],
    ["Heart Valve Disease", "أمراض صمامات القلب"],
    ["Aorta and Vascular Disease", "أمراض الأبهر والأوعية الدموية"],
    ["Miscellaneous Cardiac Conditions", "حالات قلبية متنوعة"],
    ["General Management of a Patient Undergoing Thoracic Surgery", "التدبير العام لمريض جراحة الصدر"],
    ["Neoplasms of the Lung", "أورام الرئة"],
    ["Disorders of the Pleura", "اضطرابات غشاء الجنب"],
    ["Disorders of the Chest Wall", "اضطرابات جدار الصدر"],
    ["Disorders of the Diaphragm", "اضطرابات الحجاب الحاجز"],
    ["Emphysema and Bullae", "النفاخ الرئوي والفقاعات الرئوية"],
    ["Disorders of the Pericardium", "اضطرابات التامور"],
    ["Disorders of the Mediastinum", "اضطرابات المنصف"],
    ["Disorders of the Airway", "اضطرابات مجرى الهواء"],
    ["Transplantation and Surgery for Heart Failure", "زراعة القلب وجراحة قصور القلب"],
    ["Congenital Heart Disease", "أمراض القلب الخلقية"],
    ["Critical Care and Post-operative Management", "الرعاية الحرجة والتدبير بعد الجراحة"],
    ["Cardiothoracic Trauma", "إصابات القلب والصدر"],
  ];

  // Lectures for Cardiac topics 1–3. section 1 = KNOWLEDGE/CLINICAL, section 2 = TECHNICAL/OPERATIVE.
  // { topic, section, en, ar }
  private readonly LECTURES: Array<{ topic: string; section: 1 | 2; en: string; ar: string }> = [
    // ── 1. Cardiopulmonary Bypass ──
    { topic: "Cardiopulmonary Bypass", section: 1, en: "physiology of cardiopulmonary bypass", ar: "فسيولوجيا المجازة القلبية الرئوية" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "haemodynamics: physiology and measurement", ar: "الديناميكا الدموية: الفسيولوجيا والقياس" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "haemostasis, thrombosis and bleeding", ar: "الإرقاء والتخثر والنزف" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "pharmacology and drugs used during cardiopulmonary bypass", ar: "الأدوية المستخدمة أثناء المجازة القلبية الرئوية" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "inotropes, vasodilators and vasoconstrictors", ar: "مقويات التقلص العضلي وموسعات وقابضات الأوعية" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "haemostatic drugs", ar: "الأدوية المرقئة" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "antiplatelet, anticoagulant and thrombolytic drugs", ar: "مضادات الصفيحات ومضادات التخثر ومذيبات الجلطات" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "principles and practice of cardiopulmonary bypass", ar: "مبادئ وممارسة المجازة القلبية الرئوية" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "relevant equipment and technology and its application", ar: "المعدات والتقنيات ذات الصلة وتطبيقاتها" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "monitoring during cardiopulmonary bypass", ar: "المراقبة أثناء المجازة القلبية الرئوية" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "inflammatory and pathophysiological response to bypass", ar: "الاستجابة الالتهابية والفيزيولوجية المرضية للمجازة" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "pulsatile and non-pulsatile flow", ar: "التدفق النابض وغير النابض" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "effect of cardiopulmonary bypass on pharmacokinetics", ar: "تأثير المجازة القلبية الرئوية على الحرائك الدوائية" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "priming fluids and haemodilution", ar: "سوائل التعبئة وتخفيف الدم" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "acid base balance - ph and alpha stat", ar: "اتزان الحمض والقاعدة - درجة الحموضة ونظام ألفا-ستات" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "neuropsychological consequences of cardiopulmonary bypass", ar: "العواقب العصبية النفسية للمجازة القلبية الرئوية" },
    { topic: "Cardiopulmonary Bypass", section: 1, en: "cell salvage and blood conservation", ar: "استرداد الخلايا والحفاظ على الدم" },
    { topic: "Cardiopulmonary Bypass", section: 2, en: "median sternotomy - open and close", ar: "شق القص الناصف - الفتح والإغلاق" },
    { topic: "Cardiopulmonary Bypass", section: 2, en: "cannulation and institution of cardiopulmonary bypass", ar: "القنيطة وبدء المجازة القلبية الرئوية" },
    { topic: "Cardiopulmonary Bypass", section: 2, en: "safe conduct of cpb - problem solving and troubleshooting", ar: "الإجراء الآمن للمجازة القلبية الرئوية - حل المشكلات ومعالجة الأعطال" },
    { topic: "Cardiopulmonary Bypass", section: 2, en: "weaning from bypass and decannulation", ar: "الفطام من المجازة ونزع القنية" },
    { topic: "Cardiopulmonary Bypass", section: 2, en: "femoral cannulation and decannulation", ar: "قنيطة الشريان الفخذي ونزعها" },
    { topic: "Cardiopulmonary Bypass", section: 2, en: "repeat sternotomy with pericardial dissection, cardiac mobilisation and cannulation", ar: "إعادة شق القص مع تسليخ التامور وتحرير القلب والقنيطة" },
    // ── 2. Myocardial Protection ──
    { topic: "Myocardial Protection", section: 1, en: "scientific foundations of myocardial preservation", ar: "الأسس العلمية لحفظ عضلة القلب" },
    { topic: "Myocardial Protection", section: 1, en: "principles and practice of myocardial preservation", ar: "مبادئ وممارسة حفظ عضلة القلب" },
    { topic: "Myocardial Protection", section: 1, en: "cardioplegia solutions and delivery modes", ar: "محاليل شل القلب وطرق توصيلها" },
    { topic: "Myocardial Protection", section: 1, en: "non-cardioplegic techniques of preservation", ar: "تقنيات الحفظ غير المعتمدة على شل القلب" },
    { topic: "Myocardial Protection", section: 1, en: "myocardial management throughout the perioperative period", ar: "تدبير عضلة القلب طوال فترة ما حول الجراحة" },
    { topic: "Myocardial Protection", section: 1, en: "ability to adapt preservation technique to clinical situation", ar: "القدرة على تكييف تقنية الحفظ حسب الحالة السريرية" },
    { topic: "Myocardial Protection", section: 2, en: "relevant cannulation techniques and appropriate delivery of cardioplegia", ar: "تقنيات القنيطة المناسبة والتوصيل الملائم لمحلول شل القلب" },
    // ── 3. Circulatory Support ──
    { topic: "Circulatory Support", section: 1, en: "inotropes, vasodilators and vasoconstrictors", ar: "مقويات التقلص العضلي وموسعات وقابضات الأوعية" },
    { topic: "Circulatory Support", section: 1, en: "mechanical circulatory support in the pre-operative, perioperative and post-operative periods", ar: "الدعم الدوري الميكانيكي قبل وأثناء وبعد الجراحة" },
    { topic: "Circulatory Support", section: 1, en: "intra-aortic balloon pump - indications, patient selection and complications", ar: "بالون النبض داخل الأبهر - الدواعي واختيار المريض والمضاعفات" },
    { topic: "Circulatory Support", section: 1, en: "physiology of the intra-aortic balloon pump", ar: "فسيولوجيا بالون النبض داخل الأبهر" },
    { topic: "Circulatory Support", section: 1, en: "understanding of relevant equipment and technology (iabp / vad etc.)", ar: "فهم المعدات والتقنيات ذات الصلة (بالون النبض / أجهزة دعم البطين وغيرها)" },
    { topic: "Circulatory Support", section: 1, en: "ventricular assist devices - indications, patient selection and complications", ar: "أجهزة دعم البطين - الدواعي واختيار المريض والمضاعفات" },
    { topic: "Circulatory Support", section: 1, en: "patient selection for mechanical circulatory support", ar: "اختيار المريض للدعم الدوري الميكانيكي" },
    { topic: "Circulatory Support", section: 1, en: "management of the balloon pump including timing and troubleshooting", ar: "تدبير بالون النبض بما في ذلك التوقيت ومعالجة الأعطال" },
    { topic: "Circulatory Support", section: 1, en: "care of the patient with intra-aortic balloon pump, including recognition and management of complications", ar: "رعاية المريض المزوّد ببالون النبض داخل الأبهر بما في ذلك التعرف على المضاعفات وتدبيرها" },
    { topic: "Circulatory Support", section: 2, en: "insertion and positioning of an intra-aortic balloon pump", ar: "إدخال وتوضيع بالون النبض داخل الأبهر" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    // ── Topics (all 20) ──
    const topicRows = this.TOPICS.map(([en, ar], i) => `('${q(en)}', '${q(ar)}', ${i})`).join(",\n        ");
    await queryRunner.query(`
      INSERT INTO "lecture_topics" ("departmentId", "title", "arTitle", "sortOrder")
      SELECT d."id", v.title, v.ar, v.ord
      FROM "departments" d
      CROSS JOIN (VALUES ${topicRows}) AS v(title, ar, ord)
      WHERE d."code" = 'CTS'
    `);

    // ── Lectures for topics 1–3 (level NULL) ──
    // number = <topicIndex>.<section>.<n>; sortOrder = topicIndex*1e6 + section*1e3 + n
    const topicIndex = new Map(this.TOPICS.map(([en], i) => [en, i + 1]));
    const counters = new Map<string, number>();
    const rows = this.LECTURES.map((l) => {
      const c = topicIndex.get(l.topic)!;
      const key = `${l.topic}|${l.section}`;
      const n = (counters.get(key) ?? 0) + 1;
      counters.set(key, n);
      const num = `${c}.${l.section}.${n}`;
      const ord = c * 1_000_000 + l.section * 1_000 + n;
      return `('${q(l.topic)}', '${q(num)}', '${q(l.en)}', '${q(l.ar)}', ${ord})`;
    });
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).join(",\n          ");
      await queryRunner.query(`
        INSERT INTO "lectures" ("topicId", "lectureNumber", "title", "arTitle", "level", "sortOrder")
        SELECT lt."id", v.number, v.title, v.ar, NULL, v.ord
        FROM (VALUES ${batch}) AS v(topic, number, title, ar, ord)
        JOIN "departments" d ON d."code" = 'CTS'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Deleting the CTS topics cascades to their lectures.
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'CTS'
    `);
  }
}
