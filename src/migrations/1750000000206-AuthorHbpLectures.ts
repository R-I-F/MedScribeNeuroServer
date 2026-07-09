import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * HBP (Hepatobiliary & Pancreatic Surgery) academic lectures — transcribed from the IHPBA
 * "Curriculum for Hepato-Pancreato-Biliary Surgery Fellowships" (International Hepato-Pancreato-
 * Biliary Association, 2008). Reference cited in MEDICAL_CODE_AUDITS/HBP/LECTURES_HBP.md.
 *
 * The curriculum's "7 Major Units, some with Subunits" structure maps onto the framework:
 * lecture_topics = the 7 UNITS, lectures = the top-level Content study-areas of each leaf unit (the
 * source defines Content as "the specific areas of study"). The deeper Content sub-bullets and the
 * per-unit Clinical Skills are lecture content, not separate lectures. Faithful transcription —
 * nothing invented. Each lecture is section 1 (KNOWLEDGE/CLINICAL), numbered `<topic>.1.<n>`.
 * **`level` is NULL** on every row: the IHPBA fellowship curriculum has no MSc/MD tiering, so level
 * is left NULL (sourced later) not guessed. Bilingual (EN + AR).
 */
export class AuthorHbpLectures1750000000206 implements MigrationInterface {
  name = "AuthorHbpLectures1750000000206";

  // [englishTopic, arabicTopic] — 7 IHPBA units, in document order
  private readonly TOPICS: Array<[string, string]> = [
    ["the liver", "الكبد"],
    ["the biliary tract including gallbladder", "القناة الصفراوية بما في ذلك المرارة"],
    ["the pancreas and duodenum", "البنكرياس والاثني عشر"],
    ["imaging", "التصوير"],
    ["oncology", "علم الأورام"],
    ["trauma", "الإصابات"],
    ["transplantation", "زراعة الأعضاء"],
  ];

  // section 1 = KNOWLEDGE/CLINICAL. { topic, en, ar } — Content study-areas in document order.
  private readonly LECTURES: Array<{ topic: string; en: string; ar: string }> = [
    // ── 1. the liver ──
    { topic: "the liver", en: "embryology of the liver", ar: "أجنّة الكبد" },
    { topic: "the liver", en: "extrahepatic anatomy of the liver", ar: "التشريح خارج الكبدي للكبد" },
    { topic: "the liver", en: "anatomy of the porta", ar: "تشريح سرة الكبد" },
    { topic: "the liver", en: "anatomy of the retrohepatic space", ar: "تشريح الحيز خلف الكبدي" },
    { topic: "the liver", en: "intrahepatic anatomy", ar: "التشريح داخل الكبدي" },
    { topic: "the liver", en: "physiology of the liver", ar: "فسيولوجيا الكبد" },
    { topic: "the liver", en: "hematologic, biochemical, and histologic testing (assessment) of the liver", ar: "الفحوص الدموية والكيميائية الحيوية والنسيجية (تقييم) للكبد" },
    { topic: "the liver", en: "imaging of the liver", ar: "تصوير الكبد" },
    { topic: "the liver", en: "application of investigations to hepatic surgery", ar: "تطبيق الفحوص على جراحة الكبد" },
    { topic: "the liver", en: "pediatric liver diseases", ar: "أمراض الكبد لدى الأطفال" },
    { topic: "the liver", en: "liver cysts and abscesses", ar: "كيسات وخراجات الكبد" },
    { topic: "the liver", en: "liver failure", ar: "الفشل الكبدي" },
    { topic: "the liver", en: "benign neoplasms of the liver", ar: "الأورام الحميدة في الكبد" },
    { topic: "the liver", en: "primary malignancies of the liver", ar: "الأورام الخبيثة الأولية في الكبد" },
    { topic: "the liver", en: "secondary malignancies of the liver", ar: "الأورام الخبيثة الثانوية في الكبد" },
    { topic: "the liver", en: "types of liver resection", ar: "أنواع استئصال الكبد" },
    { topic: "the liver", en: "preoperative assessment and the cumulative risks to the proposed procedure", ar: "التقييم قبل الجراحة والمخاطر التراكمية للإجراء المقترح" },
    { topic: "the liver", en: "preoperative management", ar: "التدبير قبل الجراحة" },
    { topic: "the liver", en: "liver resection", ar: "استئصال الكبد" },
    { topic: "the liver", en: "postoperative management", ar: "التدبير بعد الجراحة" },
    // ── 2. the biliary tract including gallbladder ──
    { topic: "the biliary tract including gallbladder", en: "embryology of the biliary tract", ar: "أجنّة القناة الصفراوية" },
    { topic: "the biliary tract including gallbladder", en: "anatomy of the hepatic duct and biliary plate", ar: "تشريح القناة الكبدية والصفيحة الصفراوية" },
    { topic: "the biliary tract including gallbladder", en: "anatomy of the gallbladder and cystic duct", ar: "تشريح المرارة والقناة المرارية" },
    { topic: "the biliary tract including gallbladder", en: "anatomy of the bile duct", ar: "تشريح القناة الصفراوية" },
    { topic: "the biliary tract including gallbladder", en: "bile metabolism and biliary physiology", ar: "استقلاب الصفراء وفسيولوجيا القنوات الصفراوية" },
    { topic: "the biliary tract including gallbladder", en: "biochemical investigation", ar: "الفحص الكيميائي الحيوي" },
    { topic: "the biliary tract including gallbladder", en: "imaging", ar: "التصوير" },
    { topic: "the biliary tract including gallbladder", en: "congenital and pediatric", ar: "الحالات الخلقية وحالات الأطفال" },
    { topic: "the biliary tract including gallbladder", en: "gallstones", ar: "الحصوات المرارية" },
    { topic: "the biliary tract including gallbladder", en: "benign strictures", ar: "التضيقات الحميدة" },
    { topic: "the biliary tract including gallbladder", en: "intrahepatic stones", ar: "الحصوات داخل الكبدية" },
    { topic: "the biliary tract including gallbladder", en: "gallbladder", ar: "المرارة" },
    { topic: "the biliary tract including gallbladder", en: "bile duct", ar: "القناة الصفراوية" },
    // ── 3. the pancreas and duodenum ──
    { topic: "the pancreas and duodenum", en: "embryology of the pancreas and duodenum", ar: "أجنّة البنكرياس والاثني عشر" },
    { topic: "the pancreas and duodenum", en: "anatomy of the pancreas", ar: "تشريح البنكرياس" },
    { topic: "the pancreas and duodenum", en: "anatomy of the pancreatic duct", ar: "تشريح القناة البنكرياسية" },
    { topic: "the pancreas and duodenum", en: "anatomy of the duodenum", ar: "تشريح الاثني عشر" },
    { topic: "the pancreas and duodenum", en: "pancreatic metabolism and physiology", ar: "استقلاب وفسيولوجيا البنكرياس" },
    { topic: "the pancreas and duodenum", en: "duodenal physiology", ar: "فسيولوجيا الاثني عشر" },
    { topic: "the pancreas and duodenum", en: "biochemical testing", ar: "الفحوص الكيميائية الحيوية" },
    { topic: "the pancreas and duodenum", en: "imaging", ar: "التصوير" },
    { topic: "the pancreas and duodenum", en: "application of testing and imaging to pancreatic and duodenal surgery", ar: "تطبيق الفحوص والتصوير على جراحة البنكرياس والاثني عشر" },
    { topic: "the pancreas and duodenum", en: "pancreatitis", ar: "التهاب البنكرياس" },
    { topic: "the pancreas and duodenum", en: "pancreas divisum", ar: "البنكرياس المنقسم" },
    { topic: "the pancreas and duodenum", en: "annular pancreas", ar: "البنكرياس الحلقي" },
    { topic: "the pancreas and duodenum", en: "benign cysts and neoplasms of the pancreas", ar: "الكيسات والأورام الحميدة في البنكرياس" },
    { topic: "the pancreas and duodenum", en: "malignancies of the pancreas", ar: "الأورام الخبيثة في البنكرياس" },
    { topic: "the pancreas and duodenum", en: "congenital disorders of the duodenum", ar: "الاضطرابات الخلقية للاثني عشر" },
    { topic: "the pancreas and duodenum", en: "duodenal ulcer disease", ar: "مرض قرحة الاثني عشر" },
    { topic: "the pancreas and duodenum", en: "crohn's disease", ar: "داء كرون" },
    { topic: "the pancreas and duodenum", en: "benign neoplasms", ar: "الأورام الحميدة" },
    { topic: "the pancreas and duodenum", en: "malignant neoplasms of the duodenum", ar: "الأورام الخبيثة في الاثني عشر" },
    // ── 4. imaging ──
    { topic: "imaging", en: "the applied physics and technology of ultrasound and doppler, ct scan, mri scan, pet scan and the other nuclear medicine imaging procedures", ar: "الفيزياء التطبيقية وتقنية الموجات فوق الصوتية والدوبلر والتصوير المقطعي والرنين المغناطيسي والإصدار البوزيتروني وإجراءات الطب النووي الأخرى" },
    { topic: "imaging", en: "the clinical protocols available for each technology", ar: "البروتوكولات السريرية المتاحة لكل تقنية" },
    { topic: "imaging", en: "imaging algorithm for the investigation of hepatobiliary and pancreatic lesions", ar: "خوارزمية التصوير لفحص آفات الكبد والقنوات الصفراوية والبنكرياس" },
    // ── 5. oncology ──
    { topic: "oncology", en: "basic pathophysiology of neoplasia", ar: "الفيزيولوجيا المرضية الأساسية للأورام" },
    { topic: "oncology", en: "chemotherapy", ar: "العلاج الكيميائي" },
    { topic: "oncology", en: "radiation therapy", ar: "العلاج الإشعاعي" },
    { topic: "oncology", en: "multidisciplinary management", ar: "التدبير متعدد التخصصات" },
    // ── 6. trauma ──
    { topic: "trauma", en: "liver trauma", ar: "إصابات الكبد" },
    { topic: "trauma", en: "biliary tract and portal structures", ar: "القناة الصفراوية والبنى البابية" },
    { topic: "trauma", en: "pancreatic and duodenal trauma", ar: "إصابات البنكرياس والاثني عشر" },
    // ── 7. transplantation ──
    { topic: "transplantation", en: "organ procurement", ar: "الحصول على الأعضاء" },
    { topic: "transplantation", en: "organ preservation", ar: "حفظ الأعضاء" },
    { topic: "transplantation", en: "transplantation", ar: "زراعة الأعضاء" },
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
      WHERE d."code" = 'HBP'
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
        JOIN "departments" d ON d."code" = 'HBP'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Deleting the HBP topics cascades to their lectures.
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'HBP'
    `);
  }
}
