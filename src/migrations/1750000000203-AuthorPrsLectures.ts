import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PRS (Plastic & Reconstructive Surgery) academic lectures — transcribed from the ISCP Plastic
 * Surgery Curriculum (Aug 2021), Appendix 2 "Plastic Surgery Syllabus". Reference cited in
 * MEDICAL_CODE_AUDITS/PRS/LECTURES_PRS.md.
 *
 * The reference's own "Summary of Plastic Surgery Syllabus: Module | Sub-section" table maps
 * directly onto the framework: lecture_topics = the 19 MODULES, lectures = the 63 SUB-SECTIONS
 * (each has its own OBJECTIVE — a discrete teachable unit). The per-sub-section KNOWLEDGE/CLINICAL/
 * TECHNICAL competency bullets are lecture content, not separate lectures. Faithful transcription —
 * nothing invented. Each lecture is section 1 (KNOWLEDGE/CLINICAL), numbered `<topic>.1.<n>`.
 * **`level` is NULL** on every row: the ISCP Basic/Intermediate/Advanced tiers are complexity
 * levels, NOT the Egyptian MSc/MD construct, so level is left NULL (sourced later) not guessed.
 * Bilingual (EN + AR).
 */
export class AuthorPrsLectures1750000000203 implements MigrationInterface {
  name = "AuthorPrsLectures1750000000203";

  // [englishTopic, arabicTopic] — 19 ISCP Appendix-2 modules, in Summary-table order
  private readonly TOPICS: Array<[string, string]> = [
    ["aesthetic", "الجراحة التجميلية"],
    ["breast surgery", "جراحة الثدي"],
    ["burns", "الحروق"],
    ["chest wall reconstruction", "إعادة بناء جدار الصدر"],
    ["cleft", "الشقوق (الشفة والحنك)"],
    ["complex wound", "الجروح المعقدة"],
    ["craniofacial", "الجراحة القحفية الوجهية"],
    ["craniomaxillofacial trauma", "إصابات القحف والوجه والفكين"],
    ["ear reconstruction", "إعادة بناء الأذن"],
    ["genitourinary reconstruction", "إعادة البناء البولي التناسلي"],
    ["hand", "اليد"],
    ["head & neck", "الرأس والرقبة"],
    ["lower limb", "الطرف السفلي"],
    ["oncoplastic breast", "جراحة الثدي الأورامية التجميلية"],
    ["pelvic floor reconstruction", "إعادة بناء قاع الحوض"],
    ["skin surgery", "جراحة الجلد"],
    ["vascular anomalies", "التشوهات الوعائية"],
    ["sarcoma", "الساركوما (الأورام اللحمية)"],
    ["psychological aspect of plastic surgery", "الجانب النفسي لجراحة التجميل"],
  ];

  // section 1 = KNOWLEDGE/CLINICAL. { topic, en, ar } — sub-sections in Summary-table order.
  private readonly LECTURES: Array<{ topic: string; en: string; ar: string }> = [
    // ── 1. aesthetic ──
    { topic: "aesthetic", en: "aesthetic surgery of face, orbit & neck", ar: "الجراحة التجميلية للوجه والحجاج والرقبة" },
    { topic: "aesthetic", en: "rhinoplasty and otoplasty", ar: "رأب الأنف ورأب الأذن" },
    { topic: "aesthetic", en: "rejuvenation/restoration of the trunk, body contouring, liposuction & fat grafting", ar: "تجديد/استعادة الجذع ونحت الجسم وشفط الدهون وترقيع الدهون" },
    // ── 2. breast surgery ──
    { topic: "breast surgery", en: "surgery of the breast", ar: "جراحة الثدي" },
    { topic: "breast surgery", en: "non-surgical rejuvenation", ar: "التجديد غير الجراحي" },
    // ── 3. burns ──
    { topic: "burns", en: "burns classification, primary management and transfer", ar: "تصنيف الحروق والتدبير الأولي والنقل" },
    { topic: "burns", en: "burns resuscitation and critical care", ar: "إنعاش الحروق والرعاية الحرجة" },
    { topic: "burns", en: "burns early surgery", ar: "الجراحة المبكرة للحروق" },
    { topic: "burns", en: "burns late surgery", ar: "الجراحة المتأخرة للحروق" },
    { topic: "burns", en: "burns infection and other complications", ar: "عدوى الحروق والمضاعفات الأخرى" },
    { topic: "burns", en: "paediatric burns", ar: "حروق الأطفال" },
    // ── 4. chest wall reconstruction ──
    { topic: "chest wall reconstruction", en: "chest wall reconstruction", ar: "إعادة بناء جدار الصدر" },
    // ── 5. cleft ──
    { topic: "cleft", en: "primary management of cleft lip and nose", ar: "التدبير الأولي لشق الشفة والأنف" },
    { topic: "cleft", en: "secondary repair of cleft lip and nose", ar: "الإصلاح الثانوي لشق الشفة والأنف" },
    { topic: "cleft", en: "primary repair of cleft palate", ar: "الإصلاح الأولي لشق الحنك" },
    { topic: "cleft", en: "secondary speech surgery", ar: "جراحة النطق الثانوية" },
    { topic: "cleft", en: "dento-alveolar defect including alveolar bone grafting", ar: "العيب السنخي السني بما في ذلك ترقيع العظم السنخي" },
    { topic: "cleft", en: "orthognathic surgery / working with the cleft mdt", ar: "جراحة تقويم الفكين / العمل ضمن فريق الشقوق متعدد التخصصات" },
    // ── 6. complex wound ──
    { topic: "complex wound", en: "complex wound", ar: "الجرح المعقد" },
    // ── 7. craniofacial ──
    { topic: "craniofacial", en: "craniofacial general principles", ar: "المبادئ العامة للجراحة القحفية الوجهية" },
    { topic: "craniofacial", en: "craniosynostosis", ar: "تعظُّم الدروز الباكر" },
    { topic: "craniofacial", en: "craniofacial tumours in adults and children", ar: "الأورام القحفية الوجهية لدى البالغين والأطفال" },
    { topic: "craniofacial", en: "craniofacial syndromes of tissue deficiency", ar: "المتلازمات القحفية الوجهية لنقص النسيج" },
    { topic: "craniofacial", en: "craniofacial overgrowth syndromes", ar: "متلازمات فرط النمو القحفية الوجهية" },
    { topic: "craniofacial", en: "orbital surgery", ar: "جراحة الحجاج" },
    // ── 8. craniomaxillofacial trauma ──
    { topic: "craniomaxillofacial trauma", en: "craniomaxillofacial trauma", ar: "إصابات القحف والوجه والفكين" },
    // ── 9. ear reconstruction ──
    { topic: "ear reconstruction", en: "ear deformities and ear reconstruction", ar: "تشوهات الأذن وإعادة بناء الأذن" },
    // ── 10. genitourinary reconstruction ──
    { topic: "genitourinary reconstruction", en: "hypospadias and allied conditions", ar: "الإحليل التحتي والحالات المرتبطة به" },
    { topic: "genitourinary reconstruction", en: "epispadias, anomalies of female genitalia, ambiguous genitalia and acquired perineal defects", ar: "الإحليل الفوقي وتشوهات الأعضاء التناسلية الأنثوية والأعضاء التناسلية الملتبسة والعيوب العجانية المكتسبة" },
    { topic: "genitourinary reconstruction", en: "genital reassignment", ar: "تغيير الجنس (إعادة تحديد الجنس)" },
    // ── 11. hand ──
    { topic: "hand", en: "skin / soft tissue / microsurgery / dupuytren's disease", ar: "الجلد / الأنسجة الرخوة / الجراحة المجهرية / داء دوبويتران" },
    { topic: "hand", en: "fractures and joint injuries including wrist instability", ar: "الكسور وإصابات المفاصل بما في ذلك عدم ثبات الرسغ" },
    { topic: "hand", en: "osteoarthritis and inflammatory arthritis", ar: "الفصال العظمي والتهاب المفاصل الالتهابي" },
    { topic: "hand", en: "tendon and tendon-related disorders", ar: "الأوتار والاضطرابات المتعلقة بها" },
    { topic: "hand", en: "nerve and nerve-related disorders", ar: "الأعصاب والاضطرابات المتعلقة بها" },
    { topic: "hand", en: "the child's hand, vascular disorders and tumours", ar: "يد الطفل والاضطرابات الوعائية والأورام" },
    // ── 12. head & neck ──
    { topic: "head & neck", en: "basic sciences", ar: "العلوم الأساسية" },
    { topic: "head & neck", en: "skin-related neoplasia of the head & neck", ar: "أورام الرأس والرقبة المتعلقة بالجلد" },
    { topic: "head & neck", en: "non skin-related neoplasia of the head & neck", ar: "أورام الرأس والرقبة غير المتعلقة بالجلد" },
    { topic: "head & neck", en: "techniques for reconstruction of the head & neck", ar: "تقنيات إعادة بناء الرأس والرقبة" },
    { topic: "head & neck", en: "reconstruction of specific head and neck sites", ar: "إعادة بناء مواقع محددة في الرأس والرقبة" },
    { topic: "head & neck", en: "facial reanimation", ar: "إعادة تحريك الوجه" },
    // ── 13. lower limb ──
    { topic: "lower limb", en: "assessment and primary management lower limb injuries", ar: "تقييم إصابات الطرف السفلي وتدبيرها الأولي" },
    { topic: "lower limb", en: "debridement, stabilisation and compartment syndrome", ar: "التنضير والتثبيت ومتلازمة الحيز" },
    { topic: "lower limb", en: "soft tissue reconstruction", ar: "إعادة بناء الأنسجة الرخوة" },
    { topic: "lower limb", en: "vascular injuries and amputation", ar: "الإصابات الوعائية والبتر" },
    { topic: "lower limb", en: "complications", ar: "المضاعفات" },
    { topic: "lower limb", en: "paediatric injuries and outcome measures", ar: "إصابات الأطفال ومقاييس النتائج" },
    // ── 14. oncoplastic breast ──
    { topic: "oncoplastic breast", en: "basic sciences", ar: "العلوم الأساسية" },
    { topic: "oncoplastic breast", en: "breast cancer", ar: "سرطان الثدي" },
    { topic: "oncoplastic breast", en: "benign breast conditions", ar: "حالات الثدي الحميدة" },
    { topic: "oncoplastic breast", en: "breast reconstruction – implant based techniques", ar: "إعادة بناء الثدي – التقنيات المعتمدة على الزرعات" },
    { topic: "oncoplastic breast", en: "reconstruction – autologous tissue based techniques", ar: "إعادة البناء – التقنيات المعتمدة على النسيج الذاتي" },
    // ── 15. pelvic floor reconstruction ──
    { topic: "pelvic floor reconstruction", en: "pelvic reconstruction", ar: "إعادة بناء الحوض" },
    // ── 16. skin surgery ──
    { topic: "skin surgery", en: "basic sciences & skin assessment", ar: "العلوم الأساسية وتقييم الجلد" },
    { topic: "skin surgery", en: "primary treatment of skin-related neoplasia", ar: "العلاج الأولي لأورام الجلد" },
    { topic: "skin surgery", en: "treatment of recurrent and chronic skin tumours", ar: "علاج أورام الجلد الناكسة والمزمنة" },
    { topic: "skin surgery", en: "reconstructive techniques for skin surgery", ar: "التقنيات الترميمية لجراحة الجلد" },
    { topic: "skin surgery", en: "scarring, wounds and other surgical conditions of the skin", ar: "الندبات والجروح والحالات الجراحية الأخرى للجلد" },
    { topic: "skin surgery", en: "multidisciplinary team workings, allied professionals, palliative care and follow up regimes, trials, research and national guidelines", ar: "العمل ضمن فريق متعدد التخصصات والمهنيون المساعدون والرعاية التلطيفية وأنظمة المتابعة والتجارب والبحث والإرشادات الوطنية" },
    // ── 17. vascular anomalies ──
    { topic: "vascular anomalies", en: "vascular anomalies", ar: "التشوهات الوعائية" },
    // ── 18. sarcoma ──
    { topic: "sarcoma", en: "sarcoma", ar: "الساركوما (الورم اللحمي)" },
    // ── 19. psychological aspect of plastic surgery ──
    { topic: "psychological aspect of plastic surgery", en: "dealing with patients impacted by disfigurement and loss of form and function", ar: "التعامل مع المرضى المتأثرين بالتشوه وفقدان الشكل والوظيفة" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    // ── Topics (all 19) ──
    const topicRows = this.TOPICS.map(([en, ar], i) => `('${q(en)}', '${q(ar)}', ${i})`).join(",\n        ");
    await queryRunner.query(`
      INSERT INTO "lecture_topics" ("departmentId", "title", "arTitle", "sortOrder")
      SELECT d."id", v.title, v.ar, v.ord
      FROM "departments" d
      CROSS JOIN (VALUES ${topicRows}) AS v(title, ar, ord)
      WHERE d."code" = 'PRS'
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
        JOIN "departments" d ON d."code" = 'PRS'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Deleting the PRS topics cascades to their lectures.
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'PRS'
    `);
  }
}
