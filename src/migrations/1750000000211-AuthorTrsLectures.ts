import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * TRS (Transplant Surgery) academic lectures — transcribed from the UEMS Section of Surgery,
 * Division of Transplantation "Curriculum and Syllabus — Transplantation" (European Board of
 * Surgery / EBSQ in Transplant Surgery, 2021). Reference cited in
 * MEDICAL_CODE_AUDITS/TRS/LECTURES_TRS.md.
 *
 * TRS is a subspecialty (not a standalone ISCP specialty); the UEMS EBSQ curriculum is the
 * authoritative European specialty-board curriculum. Its 4 MODULES map to lecture_topics; each
 * module's Knowledge (section 1) + Clinical skills (section 2) bullets map to lectures
 * (numbered <topic>.<section>.<n>). The generic Professional-skills competency overlay (communication,
 * teamwork, audit, medico-legal, databases — repeated verbatim per module) and the Subject objectives
 * are excluded as non-module-specific (documented in the audit file). Faithful transcription —
 * nothing invented. **`level` is NULL**: the UEMS curriculum has no MSc/MD tiering, so level is left
 * NULL (sourced later) not guessed. Bilingual (EN + AR).
 */
export class AuthorTrsLectures1750000000211 implements MigrationInterface {
  name = "AuthorTrsLectures1750000000211";

  // [englishTopic, arabicTopic] — 4 UEMS transplant modules, in document order
  private readonly TOPICS: Array<[string, string]> = [
    ["multi-organ retrieval", "استئصال الأعضاء المتعددة للزرع"],
    ["kidney transplantation", "زراعة الكلى"],
    ["pancreas transplantation", "زراعة البنكرياس"],
    ["liver transplantation", "زراعة الكبد"],
  ];

  // section 1 = KNOWLEDGE, section 2 = CLINICAL SKILLS. { topic, section, en, ar }
  private readonly LECTURES: Array<{ topic: string; section: 1 | 2; en: string; ar: string }> = [
    // ── 1. multi-organ retrieval — knowledge ──
    { topic: "multi-organ retrieval", section: 1, en: "evaluation of donor/organs suitability (including non-heart beating donors)", ar: "تقييم ملاءمة المتبرع/الأعضاء (بما في ذلك المتبرعون غير النابضي القلب)" },
    { topic: "multi-organ retrieval", section: 1, en: "contraindications to organ donation: general, organ-specific", ar: "موانع التبرع بالأعضاء: العامة والنوعية للعضو" },
    { topic: "multi-organ retrieval", section: 1, en: "criteria for brain/brainstem death", ar: "معايير موت الدماغ/جذع الدماغ" },
    { topic: "multi-organ retrieval", section: 1, en: "pathophysiology of brain/brainstem death", ar: "الفيزيولوجيا المرضية لموت الدماغ/جذع الدماغ" },
    { topic: "multi-organ retrieval", section: 1, en: "principles of donor management and organ preservation", ar: "مبادئ تدبير المتبرع وحفظ الأعضاء" },
    { topic: "multi-organ retrieval", section: 1, en: "surgical anatomy of multi-organ retrieval", ar: "التشريح الجراحي لاستئصال الأعضاء المتعددة" },
    { topic: "multi-organ retrieval", section: 1, en: "donor transmitted diseases", ar: "الأمراض المنقولة من المتبرع" },
    // ── 1. multi-organ retrieval — clinical skills ──
    { topic: "multi-organ retrieval", section: 2, en: "assessment and management of organ donors (including live and non-heart beating donors)", ar: "تقييم وتدبير متبرعي الأعضاء (بما في ذلك المتبرعون الأحياء وغير النابضي القلب)" },
    { topic: "multi-organ retrieval", section: 2, en: "kidney retrieval from deceased donor", ar: "استئصال الكلية من المتبرع المتوفى" },
    { topic: "multi-organ retrieval", section: 2, en: "liver retrieval from deceased donor", ar: "استئصال الكبد من المتبرع المتوفى" },
    { topic: "multi-organ retrieval", section: 2, en: "pancreatic retrieval from deceased donor", ar: "استئصال البنكرياس من المتبرع المتوفى" },
    { topic: "multi-organ retrieval", section: 2, en: "kidney retrieval from live donor", ar: "استئصال الكلية من المتبرع الحي" },

    // ── 2. kidney transplantation — knowledge ──
    { topic: "kidney transplantation", section: 1, en: "acute and chronic renal failure: causes, complications, pathophysiology, treatment options", ar: "الفشل الكلوي الحاد والمزمن: الأسباب والمضاعفات والفيزيولوجيا المرضية وخيارات العلاج" },
    { topic: "kidney transplantation", section: 1, en: "anatomy: implantation site, kidney anatomy (including variations and anomalies)", ar: "التشريح: موقع الزرع وتشريح الكلية (بما في ذلك التباينات والشذوذات)" },
    { topic: "kidney transplantation", section: 1, en: "immunology: abo compatibility, cytotoxic cross match, flow cytometry, hla matching, immunosuppression, rejection", ar: "المناعة: توافق ABO والمطابقة المتصالبة السمية للخلايا وقياس التدفق الخلوي ومطابقة HLA وكبت المناعة والرفض" },
    { topic: "kidney transplantation", section: 1, en: "indications and contraindications for: deceased and live kidney donation and transplantation", ar: "دواعي وموانع: التبرع بالكلى وزرعها من المتوفى والحي" },
    { topic: "kidney transplantation", section: 1, en: "principles of pre-op preparation and post-op management", ar: "مبادئ التحضير قبل الجراحة والتدبير بعدها" },
    { topic: "kidney transplantation", section: 1, en: "principles of organ allocation", ar: "مبادئ توزيع الأعضاء" },
    // ── 2. kidney transplantation — clinical skills ──
    { topic: "kidney transplantation", section: 2, en: "evaluation of donor/organ suitability (including non-heart beating donors)", ar: "تقييم ملاءمة المتبرع/العضو (بما في ذلك المتبرعون غير النابضي القلب)" },
    { topic: "kidney transplantation", section: 2, en: "select appropriate patient from the waiting list", ar: "اختيار المريض المناسب من قائمة الانتظار" },
    { topic: "kidney transplantation", section: 2, en: "kidney retrieval from deceased donor", ar: "استئصال الكلية من المتبرع المتوفى" },
    { topic: "kidney transplantation", section: 2, en: "kidney retrieval from live donor", ar: "استئصال الكلية من المتبرع الحي" },
    { topic: "kidney transplantation", section: 2, en: "kidney transplantation: bench preparation, prepare implant site, perform vascular and ureteric anastomoses", ar: "زرع الكلى: التحضير على الطاولة وتحضير موقع الزرع وإجراء المفاغرات الوعائية والحالبية" },
    { topic: "kidney transplantation", section: 2, en: "manage post-op care: drug therapy, fluid management, laboratory and imaging investigations, renal biopsy", ar: "تدبير الرعاية بعد الجراحة: العلاج الدوائي وتدبير السوائل والفحوص المخبرية والتصويرية وخزعة الكلية" },
    { topic: "kidney transplantation", section: 2, en: "identify and treat post-op complications: drug side effects, infection, rejection, vascular and ureteric complications", ar: "تحديد وعلاج مضاعفات ما بعد الجراحة: الآثار الجانبية للأدوية والعدوى والرفض والمضاعفات الوعائية والحالبية" },
    { topic: "kidney transplantation", section: 2, en: "post-transplant graft nephrectomy", ar: "استئصال الطعم الكلوي بعد الزرع" },
    { topic: "kidney transplantation", section: 2, en: "vascular access, vascular surgery and microsurgery experience or attendance of training course", ar: "خبرة الوصول الوعائي وجراحة الأوعية والجراحة المجهرية أو حضور دورة تدريبية" },

    // ── 3. pancreas transplantation — knowledge ──
    { topic: "pancreas transplantation", section: 1, en: "diabetes: causes, complications, pathophysiology, treatment options (including islet transplantation)", ar: "السكري: الأسباب والمضاعفات والفيزيولوجيا المرضية وخيارات العلاج (بما في ذلك زرع الجزر)" },
    { topic: "pancreas transplantation", section: 1, en: "indications and contraindications for pancreatic donation: simultaneous kidney and pancreas transplant, pancreas after kidney transplant, pancreas transplantation alone", ar: "دواعي وموانع التبرع بالبنكرياس: الزرع المتزامن للكلى والبنكرياس، والبنكرياس بعد زرع الكلى، وزرع البنكرياس وحده" },
    { topic: "pancreas transplantation", section: 1, en: "anatomy: pancreatic graft and implantation site", ar: "التشريح: الطعم البنكرياسي وموقع الزرع" },
    { topic: "pancreas transplantation", section: 1, en: "immunology: abo compatibility, cytotoxic cross match, flow cytometry, hla matching, immunosuppression, rejection", ar: "المناعة: توافق ABO والمطابقة المتصالبة السمية للخلايا وقياس التدفق الخلوي ومطابقة HLA وكبت المناعة والرفض" },
    { topic: "pancreas transplantation", section: 1, en: "principles of pre-op preparation and post-op management", ar: "مبادئ التحضير قبل الجراحة والتدبير بعدها" },
    { topic: "pancreas transplantation", section: 1, en: "knowledge regarding kidney transplantation", ar: "المعرفة المتعلقة بزرع الكلى" },
    // ── 3. pancreas transplantation — clinical skills ──
    { topic: "pancreas transplantation", section: 2, en: "evaluation of donor/organ suitability (including non-heart beating donors)", ar: "تقييم ملاءمة المتبرع/العضو (بما في ذلك المتبرعون غير النابضي القلب)" },
    { topic: "pancreas transplantation", section: 2, en: "pancreatic graft retrieval", ar: "استئصال الطعم البنكرياسي" },
    { topic: "pancreas transplantation", section: 2, en: "select appropriate patient from the waiting list", ar: "اختيار المريض المناسب من قائمة الانتظار" },
    { topic: "pancreas transplantation", section: 2, en: "pancreatic graft bench preparation and implantation", ar: "التحضير على الطاولة للطعم البنكرياسي وزرعه" },
    { topic: "pancreas transplantation", section: 2, en: "manage post-op care: drug therapy, fluid management, laboratory and imaging investigations, pancreatic graft biopsy", ar: "تدبير الرعاية بعد الجراحة: العلاج الدوائي وتدبير السوائل والفحوص المخبرية والتصويرية وخزعة الطعم البنكرياسي" },
    { topic: "pancreas transplantation", section: 2, en: "identify and treat post-op complications: drug side effects, infection, rejection, vascular complications, pancreatic fistula, graft pancreatitis", ar: "تحديد وعلاج مضاعفات ما بعد الجراحة: الآثار الجانبية للأدوية والعدوى والرفض والمضاعفات الوعائية والناسور البنكرياسي والتهاب الطعم البنكرياسي" },
    { topic: "pancreas transplantation", section: 2, en: "post-transplant graft pancreatectomy", ar: "استئصال الطعم البنكرياسي بعد الزرع" },

    // ── 4. liver transplantation — knowledge ──
    { topic: "liver transplantation", section: 1, en: "acute and chronic liver failure: causes, complications, pathophysiology and treatment options", ar: "الفشل الكبدي الحاد والمزمن: الأسباب والمضاعفات والفيزيولوجيا المرضية وخيارات العلاج" },
    { topic: "liver transplantation", section: 1, en: "immunology: immunosuppression, rejection", ar: "المناعة: كبت المناعة والرفض" },
    { topic: "liver transplantation", section: 1, en: "indications and contraindications for: deceased and live liver donation, liver transplantation and re-transplantation", ar: "دواعي وموانع: التبرع بالكبد من المتوفى والحي وزرع الكبد وإعادة الزرع" },
    { topic: "liver transplantation", section: 1, en: "liver anatomy: anatomical variants, surgical anatomy for splitting/reduction/live donation", ar: "تشريح الكبد: التباينات التشريحية والتشريح الجراحي للتقسيم/التصغير/التبرع الحي" },
    { topic: "liver transplantation", section: 1, en: "principles of pre-op preparation and post-op management", ar: "مبادئ التحضير قبل الجراحة والتدبير بعدها" },
    { topic: "liver transplantation", section: 1, en: "complications of liver transplantation and their management", ar: "مضاعفات زرع الكبد وتدبيرها" },
    // ── 4. liver transplantation — clinical skills ──
    { topic: "liver transplantation", section: 2, en: "evaluation of donor/organ suitability (including non-heart beating donors)", ar: "تقييم ملاءمة المتبرع/العضو (بما في ذلك المتبرعون غير النابضي القلب)" },
    { topic: "liver transplantation", section: 2, en: "select appropriate patient from the waiting list", ar: "اختيار المريض المناسب من قائمة الانتظار" },
    { topic: "liver transplantation", section: 2, en: "deceased donor liver retrieval", ar: "استئصال الكبد من المتبرع المتوفى" },
    { topic: "liver transplantation", section: 2, en: "split liver procedure", ar: "إجراء تقسيم الكبد" },
    { topic: "liver transplantation", section: 2, en: "deceased donor liver transplantation including: bench work preparation, common intra-operative challenges and variations", ar: "زرع كبد المتبرع المتوفى بما في ذلك: التحضير على الطاولة والتحديات والتباينات الشائعة أثناء الجراحة" },
    { topic: "liver transplantation", section: 2, en: "split liver transplantation or attendance of training course", ar: "زرع الكبد المقسّم أو حضور دورة تدريبية" },
    { topic: "liver transplantation", section: 2, en: "manage post-op care: drug therapy, fluid management, laboratory and imaging investigations, liver biopsy", ar: "تدبير الرعاية بعد الجراحة: العلاج الدوائي وتدبير السوائل والفحوص المخبرية والتصويرية وخزعة الكبد" },
    { topic: "liver transplantation", section: 2, en: "identify and treat post-op complications: drug side-effects, infection, rejection, vascular complications, biliary complications, recurrent disease, hepatitis", ar: "تحديد وعلاج مضاعفات ما بعد الجراحة: الآثار الجانبية للأدوية والعدوى والرفض والمضاعفات الوعائية والصفراوية والمرض الناكس والتهاب الكبد" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    // ── Topics (all 4) ──
    const topicRows = this.TOPICS.map(([en, ar], i) => `('${q(en)}', '${q(ar)}', ${i})`).join(",\n        ");
    await queryRunner.query(`
      INSERT INTO "lecture_topics" ("departmentId", "title", "arTitle", "sortOrder")
      SELECT d."id", v.title, v.ar, v.ord
      FROM "departments" d
      CROSS JOIN (VALUES ${topicRows}) AS v(title, ar, ord)
      WHERE d."code" = 'TRS'
    `);

    // ── Lectures (level NULL); number = <topicIdx>.<section>.<n> ──
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
        JOIN "departments" d ON d."code" = 'TRS'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Deleting the TRS topics cascades to their lectures.
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'TRS'
    `);
  }
}
