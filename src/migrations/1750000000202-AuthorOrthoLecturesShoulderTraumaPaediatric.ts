import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ORTHO (Orthopedic Surgery) academic lectures — transcribed from the ISCP Trauma & Orthopaedic
 * Surgery Curriculum (Aug 2021), Appendix 2 "Trauma and Orthopaedic Surgery Syllabus", the
 * **Applied Clinical KNOWLEDGE** component. Reference cited in MEDICAL_CODE_AUDITS/ORTHO/LECTURES_ORTHO.md.
 *
 * Part 3 (final): Shoulder, Trauma, Paediatric Orthopaedic Surgery lectures.
 *
 * Faithful transcription of the ISCP knowledge-syllabus topics — nothing invented. Each item is a
 * KNOWLEDGE/CLINICAL syllabus entry (numbered `<topic>.1.<n>`). The Applied Clinical SKILLS
 * (Part B, a trainee-logbook procedure list) is intentionally excluded from the lecture curriculum
 * (documented in the audit file). **`level` is NULL** on every row: the ISCP competence numbers
 * (1–4 knowledge depth) are NOT the Egyptian MSc/MD construct, so level is left NULL (sourced later)
 * rather than guessed. Bilingual (EN + AR).
 */
export class AuthorOrthoLecturesShoulderTraumaPaediatric1750000000202 implements MigrationInterface {
  name = "AuthorOrthoLecturesShoulderTraumaPaediatric1750000000202";

  // topic → its index in the 10-topic list (for numbering <idx>.1.<n>)
  private readonly TOPIC_INDEX: Record<string, number> = {
    "shoulder": 8,
    "trauma": 9,
    "paediatric orthopaedic surgery": 10,
  };

  // section 1 = KNOWLEDGE/CLINICAL. { topic, en, ar }
  private readonly LECTURES: Array<{ topic: string; en: string; ar: string }> = [
    // ── 8. shoulder ──
    { topic: "shoulder", en: "anatomy of the shoulder girdle and related structures", ar: "تشريح حزام الكتف والبنى ذات الصلة" },
    { topic: "shoulder", en: "surgical approaches to the shoulder girdle including arthroscopic access", ar: "المداخل الجراحية لحزام الكتف بما في ذلك الدخول بالمنظار" },
    { topic: "shoulder", en: "physiology of nerve function around the shoulder", ar: "فسيولوجيا وظيفة العصب حول الكتف" },
    { topic: "shoulder", en: "impingement and rotator cuff disorders", ar: "اضطرابات الانحشار والكفة المدورة" },
    { topic: "shoulder", en: "instability and labral pathology of the shoulder", ar: "عدم الثبات وأمراض الشفا (الحلقة الغضروفية) في الكتف" },
    { topic: "shoulder", en: "inflammatory, degenerative and infective conditions of the shoulder girdle", ar: "الحالات الالتهابية والتنكسية والعدوائية لحزام الكتف" },
    { topic: "shoulder", en: "shoulder stiffness", ar: "تيبّس الكتف" },
    { topic: "shoulder", en: "acquired and developmental deformity around the shoulder", ar: "التشوه المكتسب والتطوري حول الكتف" },
    { topic: "shoulder", en: "the painful shoulder", ar: "الكتف المؤلم" },
    { topic: "shoulder", en: "biomechanics of the shoulder girdle", ar: "الميكانيكا الحيوية لحزام الكتف" },
    { topic: "shoulder", en: "biomechanics of shoulder arthroplasty", ar: "الميكانيكا الحيوية لرأب مفصل الكتف" },
    { topic: "shoulder", en: "radiological investigations to assess the shoulder", ar: "الفحوص الشعاعية لتقييم الكتف" },
    { topic: "shoulder", en: "diagnostic and guided injections", ar: "الحقن التشخيصي والموجَّه" },
    { topic: "shoulder", en: "examination under anaesthetic and arthroscopy", ar: "الفحص تحت التخدير والتنظير المفصلي" },
    { topic: "shoulder", en: "neurophysiology in shoulder and brachial plexus disorders", ar: "الفيزيولوجيا العصبية في اضطرابات الكتف والضفيرة العضدية" },
    { topic: "shoulder", en: "history and examination of the shoulder girdle, including special clinical tests", ar: "تاريخ وفحص حزام الكتف بما في ذلك الاختبارات السريرية الخاصة" },
    { topic: "shoulder", en: "examination of the brachial plexus", ar: "فحص الضفيرة العضدية" },
    { topic: "shoulder", en: "arthroplasty of the shoulder", ar: "رأب مفصل الكتف" },
    { topic: "shoulder", en: "arthroscopy of the shoulder", ar: "تنظير مفصل الكتف" },
    { topic: "shoulder", en: "soft tissue disorders of the shoulder girdle", ar: "اضطرابات الأنسجة الرخوة لحزام الكتف" },
    { topic: "shoulder", en: "arthrodesis, osteotomy and excision arthroplasty", ar: "الإيثاق وقطع العظم ورأب المفصل بالاستئصال" },
    { topic: "shoulder", en: "reconstructive surgery for brachial plexus and other neurological disorders", ar: "الجراحة الترميمية للضفيرة العضدية والاضطرابات العصبية الأخرى" },
    { topic: "shoulder", en: "amputation", ar: "البتر" },
    // ── 9. trauma ──
    { topic: "trauma", en: "regional anatomy for trauma", ar: "التشريح الناحي للإصابات" },
    { topic: "trauma", en: "surgical approaches for bone and soft tissue injuries", ar: "المداخل الجراحية لإصابات العظم والأنسجة الرخوة" },
    { topic: "trauma", en: "approaches for hip fractures", ar: "المداخل لكسور الورك" },
    { topic: "trauma", en: "approaches for weber b ankle fractures", ar: "المداخل لكسور الكاحل من نوع Weber B" },
    { topic: "trauma", en: "physiological response to trauma", ar: "الاستجابة الفسيولوجية للإصابة" },
    { topic: "trauma", en: "delayed and non-union", ar: "التأخر في الالتئام وعدم الالتئام" },
    { topic: "trauma", en: "fractures in abnormal bone", ar: "الكسور في العظم غير الطبيعي" },
    { topic: "trauma", en: "mal-union of fractures", ar: "سوء التئام الكسور" },
    { topic: "trauma", en: "pain relief in trauma patients", ar: "تسكين الألم لدى مرضى الإصابات" },
    { topic: "trauma", en: "principles of open reduction and internal fixation/external fixation of fractures", ar: "مبادئ الرد المفتوح والتثبيت الداخلي/التثبيت الخارجي للكسور" },
    { topic: "trauma", en: "splintage and traction", ar: "التجبير والشد" },
    { topic: "trauma", en: "principles of casting", ar: "مبادئ التجبير الجبسي" },
    { topic: "trauma", en: "radiological investigations to assess the injured patient", ar: "الفحوص الشعاعية لتقييم المريض المصاب" },
    { topic: "trauma", en: "compartment syndrome", ar: "متلازمة الحيز (متلازمة الحجرة)" },
    { topic: "trauma", en: "neurovascular injuries", ar: "الإصابات العصبية الوعائية" },
    { topic: "trauma", en: "necrotising fasciitis", ar: "التهاب اللفافة المنخر" },
    { topic: "trauma", en: "rehabilitation of the shoulder", ar: "إعادة تأهيل الكتف" },
    { topic: "trauma", en: "orthoses", ar: "الأجهزة التقويمية" },
    { topic: "trauma", en: "management of failed arthroplasty and soft tissue surgery", ar: "تدبير رأب المفصل الفاشل وجراحة الأنسجة الرخوة" },
    { topic: "trauma", en: "initial clinical assessment of the polytrauma patient", ar: "التقييم السريري الأولي لمريض الإصابات المتعددة" },
    { topic: "trauma", en: "priorities of treatment and identification of life/limb-threatening injuries", ar: "أولويات العلاج وتحديد الإصابات المهددة للحياة أو الطرف" },
    { topic: "trauma", en: "ongoing management of polytrauma patient in first week, including prioritisation of treatment and multi-disciplinary care", ar: "التدبير المستمر لمريض الإصابات المتعددة في الأسبوع الأول بما في ذلك ترتيب أولويات العلاج والرعاية متعددة التخصصات" },
    { topic: "trauma", en: "assessment of the limb at risk, including decision re limb salvage vs. amputation", ar: "تقييم الطرف المعرض للخطر بما في ذلك قرار إنقاذ الطرف مقابل البتر" },
    { topic: "trauma", en: "the trauma team & multidisciplinary collaboration", ar: "فريق الإصابات والتعاون متعدد التخصصات" },
    { topic: "trauma", en: "management of closed/open diaphyseal fractures", ar: "تدبير الكسور الجدلية المغلقة/المفتوحة" },
    { topic: "trauma", en: "management of closed/open peri-articular fractures", ar: "تدبير الكسور حول المفصلية المغلقة/المفتوحة" },
    { topic: "trauma", en: "management of complex open fractures requiring bone/soft tissue reconstruction", ar: "تدبير الكسور المفتوحة المعقدة التي تتطلب إعادة بناء العظم/الأنسجة الرخوة" },
    { topic: "trauma", en: "management of multiple injuries in a polytrauma patient", ar: "تدبير الإصابات المتعددة لدى مريض الإصابات المتعددة" },
    { topic: "trauma", en: "management of peri-prosthetic fractures", ar: "تدبير الكسور حول المفصل الصناعي" },
    { topic: "trauma", en: "amputation", ar: "البتر" },
    { topic: "trauma", en: "management of isolated soft tissue injuries", ar: "تدبير إصابات الأنسجة الرخوة المعزولة" },
    { topic: "trauma", en: "non-operative management of fractures", ar: "التدبير غير الجراحي للكسور" },
    { topic: "trauma", en: "rehabilitation of the injured patient", ar: "إعادة تأهيل المريض المصاب" },
    { topic: "trauma", en: "management of psychosocial aspects of care", ar: "تدبير الجوانب النفسية الاجتماعية للرعاية" },
    { topic: "trauma", en: "principles of limb reconstruction in non-unions/mal-unions/bone infection", ar: "مبادئ إعادة بناء الطرف في عدم الالتئام/سوء الالتئام/عدوى العظم" },
    { topic: "trauma", en: "the acute fracture and dislocation", ar: "الكسر والخلع الحاد" },
    { topic: "trauma", en: "spinal shock and cord syndromes", ar: "الصدمة النخاعية ومتلازمات النخاع" },
    { topic: "trauma", en: "pelvic/acetabular fracture stabilisation", ar: "تثبيت كسر الحوض/الحُق" },
    { topic: "trauma", en: "recognition of visceral/neurovascular damage", ar: "التعرف على الأذية الحشوية/العصبية الوعائية" },
    { topic: "trauma", en: "clavicle fractures", ar: "كسور الترقوة" },
    { topic: "trauma", en: "proximal humeral fractures", ar: "كسور عضد الطرف القريبة" },
    { topic: "trauma", en: "the dislocated shoulder", ar: "الكتف المخلوع" },
    { topic: "trauma", en: "brachial plexus and other nerve injuries", ar: "إصابات الضفيرة العضدية والأعصاب الأخرى" },
    { topic: "trauma", en: "humeral shaft fractures", ar: "كسور جسم العضد" },
    { topic: "trauma", en: "proximal ulnar fractures", ar: "كسور الزند القريبة" },
    { topic: "trauma", en: "distal humeral fractures", ar: "كسور العضد البعيدة" },
    { topic: "trauma", en: "proximal radial injuries", ar: "إصابات الكعبرة القريبة" },
    { topic: "trauma", en: "radius and ulnar shaft fractures", ar: "كسور جسم الكعبرة والزند" },
    { topic: "trauma", en: "distal radius fractures", ar: "كسور الكعبرة البعيدة" },
    { topic: "trauma", en: "scaphoid fractures", ar: "كسور العظم الزورقي" },
    { topic: "trauma", en: "carpal injuries", ar: "إصابات الرسغ" },
    { topic: "trauma", en: "metacarpal & phalangeal fractures", ar: "كسور مشط اليد والسلاميات" },
    { topic: "trauma", en: "the mangled hand", ar: "اليد المهروسة" },
    { topic: "trauma", en: "fingertip injuries", ar: "إصابات أطراف الأصابع" },
    { topic: "trauma", en: "nerve injuries", ar: "إصابات الأعصاب" },
    { topic: "trauma", en: "flexor tendon injuries", ar: "إصابات الأوتار القابضة" },
    { topic: "trauma", en: "extensor tendon injuries", ar: "إصابات الأوتار الباسطة" },
    { topic: "trauma", en: "proximal femoral fractures", ar: "كسور الفخذ القريبة" },
    { topic: "trauma", en: "femoral shaft fractures", ar: "كسور جسم الفخذ" },
    { topic: "trauma", en: "periarticular fractures around the knee", ar: "الكسور حول المفصلية حول الركبة" },
    { topic: "trauma", en: "tibial shaft fractures", ar: "كسور جسم الظنبوب" },
    { topic: "trauma", en: "periarticular fractures around the ankle", ar: "الكسور حول المفصلية حول الكاحل" },
    { topic: "trauma", en: "weber b ankle fractures", ar: "كسور الكاحل من نوع Weber B" },
    { topic: "trauma", en: "hindfoot injuries", ar: "إصابات مؤخرة القدم" },
    { topic: "trauma", en: "midfoot injuries", ar: "إصابات وسط القدم" },
    { topic: "trauma", en: "forefoot injuries", ar: "إصابات مقدمة القدم" },
    { topic: "trauma", en: "the crushed foot", ar: "القدم المهروسة" },
    { topic: "trauma", en: "management of fractures around prostheses and implants", ar: "تدبير الكسور حول المفاصل الصناعية والغرسات" },
    // ── 10. paediatric orthopaedic surgery ──
    { topic: "paediatric orthopaedic surgery", en: "embryology and growth of bones, physeal anatomy and its application to fracture types/pathological processes and infection in particular", ar: "أجنّة ونمو العظام وتشريح الصفيحة المشاشية وتطبيقه على أنواع الكسور والعمليات المرضية والعدوى بوجه خاص" },
    { topic: "paediatric orthopaedic surgery", en: "anatomy of bones and joints in the growing child and its application to growth and deformity", ar: "تشريح العظام والمفاصل في الطفل النامي وتطبيقه على النمو والتشوه" },
    { topic: "paediatric orthopaedic surgery", en: "conditions in childhood resulting in deformity e.g. spina bifida, cerebral palsy and muscular dystrophy", ar: "الحالات في الطفولة المؤدية للتشوه مثل السنسنة المشقوقة والشلل الدماغي والحثل العضلي" },
    { topic: "paediatric orthopaedic surgery", en: "genetic aspects of orthopaedic conditions", ar: "الجوانب الوراثية للحالات العظمية" },
    { topic: "paediatric orthopaedic surgery", en: "normal variants in paediatric orthopaedics", ar: "المتغيرات الطبيعية في عظام الأطفال" },
    { topic: "paediatric orthopaedic surgery", en: "diseases affecting bones in childhood, including infection", ar: "الأمراض المؤثرة على العظام في الطفولة بما في ذلك العدوى" },
    { topic: "paediatric orthopaedic surgery", en: "history and examination of the child", ar: "تاريخ وفحص الطفل" },
    { topic: "paediatric orthopaedic surgery", en: "involving the parents in the assessment", ar: "إشراك الوالدين في التقييم" },
    { topic: "paediatric orthopaedic surgery", en: "assessing the child with a disability", ar: "تقييم الطفل ذي الإعاقة" },
    { topic: "paediatric orthopaedic surgery", en: "assessing the child with possible non-accidental injury", ar: "تقييم الطفل المحتمل تعرضه لإصابة غير عرضية" },
    { topic: "paediatric orthopaedic surgery", en: "indications for and interpretation of plain x-ray, arthrogram, ct, mri in children", ar: "دواعي وتفسير الأشعة السينية البسيطة وتصوير المفصل والمقطعية والرنين لدى الأطفال" },
    { topic: "paediatric orthopaedic surgery", en: "indications for the use of ultrasound, isotope and nuclear imaging", ar: "دواعي استخدام الموجات فوق الصوتية والنظائر والتصوير النووي" },
    { topic: "paediatric orthopaedic surgery", en: "the painful hip in a child", ar: "الورك المؤلم لدى الطفل" },
    { topic: "paediatric orthopaedic surgery", en: "painful spine in a child", ar: "العمود الفقري المؤلم لدى الطفل" },
    { topic: "paediatric orthopaedic surgery", en: "compartment syndrome", ar: "متلازمة الحيز (متلازمة الحجرة)" },
    { topic: "paediatric orthopaedic surgery", en: "neurovascular injury", ar: "الإصابة العصبية الوعائية" },
    { topic: "paediatric orthopaedic surgery", en: "primary musculo-skeletal malignancy", ar: "الورم الخبيث العضلي الهيكلي الأولي" },
    { topic: "paediatric orthopaedic surgery", en: "fractures (including non-accidental injury), growth plate injuries and sequelae", ar: "الكسور (بما في ذلك الإصابة غير العرضية) وإصابات الصفيحة النامية وعواقبها" },
    { topic: "paediatric orthopaedic surgery", en: "bone and joint infection in a growing skeleton", ar: "عدوى العظم والمفصل في الهيكل النامي" },
    { topic: "paediatric orthopaedic surgery", en: "common childhood orthopaedic conditions, e.g. irritable hip, anterior knee pain", ar: "الحالات العظمية الشائعة في الطفولة مثل الورك المتهيج وألم الركبة الأمامي" },
    { topic: "paediatric orthopaedic surgery", en: "slipped upper femoral epiphysis", ar: "انزلاق المشاشة الفخذية العلوية" },
    { topic: "paediatric orthopaedic surgery", en: "legg-calve-perthes' disease", ar: "داء ليغ-كالفيه-بيرثيس" },
    { topic: "paediatric orthopaedic surgery", en: "developmental dysplasia of the hip", ar: "خلل التنسج التطوري للورك" },
    { topic: "paediatric orthopaedic surgery", en: "congenital talipes equino-varus (ctev)", ar: "حنف القدم الروحاء الأفحج الخلقي (CTEV)" },
    { topic: "paediatric orthopaedic surgery", en: "scoliosis and kyphosis deformity, idiopathic & congenital", ar: "تشوه الجنف والحداب، مجهول السبب والخلقي" },
    { topic: "paediatric orthopaedic surgery", en: "painful spine conditions, including kyphosis, spondylolysis and spondylolisthesis", ar: "حالات العمود الفقري المؤلمة بما في ذلك الحداب وانحلال الفقار وانزلاق الفقار" },
    { topic: "paediatric orthopaedic surgery", en: "forefoot deformities", ar: "تشوهات مقدمة القدم" },
    { topic: "paediatric orthopaedic surgery", en: "congenital hand abnormalities", ar: "تشوهات اليد الخلقية" },
    { topic: "paediatric orthopaedic surgery", en: "osteogenesis imperfecta", ar: "تكوّن العظم الناقص" },
    { topic: "paediatric orthopaedic surgery", en: "skeletal dysplasias", ar: "خلل التنسج الهيكلي" },
    { topic: "paediatric orthopaedic surgery", en: "tarsal coalitions", ar: "الالتحامات الرصغية" },
    { topic: "paediatric orthopaedic surgery", en: "torticollis", ar: "الصعر (اعوجاج العنق)" },
    { topic: "paediatric orthopaedic surgery", en: "leg length discrepancy", ar: "تفاوت طول الساقين" },
    { topic: "paediatric orthopaedic surgery", en: "metabolic and endocrine abnormalities", ar: "الاضطرابات الأيضية والصماوية" },
    { topic: "paediatric orthopaedic surgery", en: "syndromes of paediatric orthopaedic importance", ar: "المتلازمات ذات الأهمية في عظام الأطفال" },
    { topic: "paediatric orthopaedic surgery", en: "localised disorder of the skin & soft tissue in paediatric orthopaedics", ar: "الاضطراب الموضعي للجلد والأنسجة الرخوة في عظام الأطفال" },
    { topic: "paediatric orthopaedic surgery", en: "diseases of the haematopoetic system in paediatric orthopaedics", ar: "أمراض الجهاز المكوّن للدم في عظام الأطفال" },
    { topic: "paediatric orthopaedic surgery", en: "juvenile idiopathic arthritis", ar: "التهاب المفاصل مجهول السبب اليفعي" },
    { topic: "paediatric orthopaedic surgery", en: "musculoskeletal infections", ar: "العداوى العضلية الهيكلية" },
    { topic: "paediatric orthopaedic surgery", en: "bone & soft tissue tumours", ar: "أورام العظم والأنسجة الرخوة" },
    { topic: "paediatric orthopaedic surgery", en: "cerebral palsy", ar: "الشلل الدماغي" },
    { topic: "paediatric orthopaedic surgery", en: "spina bifida, neural tube defects including myelomeningocele", ar: "السنسنة المشقوقة وعيوب الأنبوب العصبي بما في ذلك القيلة النخاعية السحائية" },
    { topic: "paediatric orthopaedic surgery", en: "neuromuscular disorders", ar: "الاضطرابات العصبية العضلية" },
    { topic: "paediatric orthopaedic surgery", en: "the treatment of normal variants such as knock knees, flat feet, femoral anteversion", ar: "علاج المتغيرات الطبيعية مثل الركبة الروحاء والقدم المسطحة والانقلاب الأمامي للفخذ" },
    { topic: "paediatric orthopaedic surgery", en: "orthoses", ar: "الأجهزة التقويمية" },
    { topic: "paediatric orthopaedic surgery", en: "rehabilitation of the child", ar: "إعادة تأهيل الطفل" },
    { topic: "paediatric orthopaedic surgery", en: "determining physical disability", ar: "تحديد الإعاقة الجسدية" },
    { topic: "paediatric orthopaedic surgery", en: "screening for congenital abnormalities", ar: "المسح الكشفي للتشوهات الخلقية" },
    { topic: "paediatric orthopaedic surgery", en: "sports medicine in the growing child", ar: "طب الرياضة لدى الطفل النامي" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");
    const topicIndex = new Map(Object.entries(this.TOPIC_INDEX));

    // ── Lectures (section 1, level NULL) ──
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
        JOIN "departments" d ON d."code" = 'ORTHO'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "lectures" lx
      USING "lecture_topics" lt, "departments" d
      WHERE lx."topicId" = lt."id" AND lt."departmentId" = d."id" AND d."code" = 'ORTHO'
        AND lt."title" IN ('shoulder', 'trauma', 'paediatric orthopaedic surgery')
    `);
  }
}
