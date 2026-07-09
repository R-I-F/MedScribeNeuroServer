import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ORTHO (Orthopedic Surgery) academic lectures — transcribed from the ISCP Trauma & Orthopaedic
 * Surgery Curriculum (Aug 2021), Appendix 2 "Trauma and Orthopaedic Surgery Syllabus", the
 * **Applied Clinical KNOWLEDGE** component. Reference cited in MEDICAL_CODE_AUDITS/ORTHO/LECTURES_ORTHO.md.
 *
 * Part 1: all 10 ISCP T&O syllabus TOPICS + lectures for Applied Basic Science, Foot & Ankle, Knee.
 *
 * Faithful transcription of the ISCP knowledge-syllabus topics — nothing invented. Each item is a
 * KNOWLEDGE/CLINICAL syllabus entry (numbered `<topic>.1.<n>`). The Applied Clinical SKILLS
 * (Part B, a trainee-logbook procedure list) is intentionally excluded from the lecture curriculum
 * (documented in the audit file). **`level` is NULL** on every row: the ISCP competence numbers
 * (1–4 knowledge depth) are NOT the Egyptian MSc/MD construct, so level is left NULL (sourced later)
 * rather than guessed. Bilingual (EN + AR).
 */
export class AuthorOrthoLecturesTopicsBasicFootKnee1750000000200 implements MigrationInterface {
  name = "AuthorOrthoLecturesTopicsBasicFootKnee1750000000200";

  // [englishTopic, arabicTopic] — 10 ISCP Appendix-2 knowledge modules, in document order
  private readonly TOPICS: Array<[string, string]> = [
    ["applied clinical (basic) science", "العلوم السريرية التطبيقية (الأساسية)"],
    ["foot and ankle", "القدم والكاحل"],
    ["knee", "الركبة"],
    ["hip", "الورك"],
    ["spine", "العمود الفقري"],
    ["hand", "اليد"],
    ["elbow", "المرفق"],
    ["shoulder", "الكتف"],
    ["trauma", "الإصابات"],
    ["paediatric orthopaedic surgery", "جراحة عظام الأطفال"],
  ];

  // section 1 = KNOWLEDGE/CLINICAL. { topic, en, ar }
  private readonly LECTURES: Array<{ topic: string; en: string; ar: string }> = [
    // ── 1. applied clinical (basic) science ──
    { topic: "applied clinical (basic) science", en: "clinical and functional anatomy with pathological and operative relevance", ar: "التشريح السريري والوظيفي ذو الصلة المرضية والجراحية" },
    { topic: "applied clinical (basic) science", en: "surgical approaches to the limbs and axial skeleton", ar: "المداخل الجراحية للأطراف والهيكل المحوري" },
    { topic: "applied clinical (basic) science", en: "embryology of musculoskeletal system", ar: "أجنّة الجهاز العضلي الهيكلي" },
    { topic: "applied clinical (basic) science", en: "bone", ar: "العظم" },
    { topic: "applied clinical (basic) science", en: "cartilage - articular, meniscal", ar: "الغضروف - المفصلي والهلالي" },
    { topic: "applied clinical (basic) science", en: "muscle and tendon", ar: "العضلة والوتر" },
    { topic: "applied clinical (basic) science", en: "synovium", ar: "الغشاء الزليلي" },
    { topic: "applied clinical (basic) science", en: "ligament", ar: "الرباط" },
    { topic: "applied clinical (basic) science", en: "nerve", ar: "العصب" },
    { topic: "applied clinical (basic) science", en: "intervertebral disc", ar: "القرص بين الفقري" },
    { topic: "applied clinical (basic) science", en: "thromboembolism and prophylaxis", ar: "الانصمام الخثاري والوقاية منه" },
    { topic: "applied clinical (basic) science", en: "principles of fracture healing", ar: "مبادئ التئام الكسور" },
    { topic: "applied clinical (basic) science", en: "biology of wound healing", ar: "بيولوجيا التئام الجروح" },
    { topic: "applied clinical (basic) science", en: "tendon and ligament injury and healing", ar: "إصابة الأوتار والأربطة والتئامها" },
    { topic: "applied clinical (basic) science", en: "nerve injury and regeneration", ar: "إصابة العصب وتجدده" },
    { topic: "applied clinical (basic) science", en: "shock - types, physiology, recognition and treatment", ar: "الصدمة - الأنواع والفسيولوجيا والتعرف والعلاج" },
    { topic: "applied clinical (basic) science", en: "metabolism and hormonal regulation", ar: "الأيض والتنظيم الهرموني" },
    { topic: "applied clinical (basic) science", en: "metabolic and immunological response to trauma", ar: "الاستجابة الأيضية والمناعية للإصابة" },
    { topic: "applied clinical (basic) science", en: "blood loss in trauma/surgery, fluid balance and blood transfusion", ar: "فقد الدم في الإصابة/الجراحة وتوازن السوائل ونقل الدم" },
    { topic: "applied clinical (basic) science", en: "osteoarthritis", ar: "الفصال العظمي (خشونة المفاصل)" },
    { topic: "applied clinical (basic) science", en: "osteoporosis", ar: "هشاشة العظام" },
    { topic: "applied clinical (basic) science", en: "metabolic bone disease", ar: "أمراض العظام الأيضية" },
    { topic: "applied clinical (basic) science", en: "rheumatoid arthritis and other arthropathies (inflammatory, crystal, etc.)", ar: "التهاب المفاصل الروماتويدي واعتلالات المفاصل الأخرى (الالتهابية والبلورية وغيرها)" },
    { topic: "applied clinical (basic) science", en: "haemophilia", ar: "الناعور (الهيموفيليا)" },
    { topic: "applied clinical (basic) science", en: "inherited musculoskeletal disorders", ar: "الاضطرابات العضلية الهيكلية الوراثية" },
    { topic: "applied clinical (basic) science", en: "neuromuscular disorders - inherited and acquired", ar: "الاضطرابات العصبية العضلية - الوراثية والمكتسبة" },
    { topic: "applied clinical (basic) science", en: "mechanisms and classification of failure of joint replacement and of periprosthetic fractures", ar: "آليات وتصنيف فشل استبدال المفصل والكسور حول المفصل الصناعي" },
    { topic: "applied clinical (basic) science", en: "osteonecrosis", ar: "النخر العظمي" },
    { topic: "applied clinical (basic) science", en: "osteochondritis", ar: "التهاب العظم والغضروف" },
    { topic: "applied clinical (basic) science", en: "heterotopic ossification", ar: "التعظم المنتبذ" },
    { topic: "applied clinical (basic) science", en: "infection of bone, joint, soft tissue, including tuberculosis, and their prophylaxis", ar: "عدوى العظم والمفصل والأنسجة الرخوة بما في ذلك السل والوقاية منها" },
    { topic: "applied clinical (basic) science", en: "prosthetic infection", ar: "عدوى المفصل الصناعي" },
    { topic: "applied clinical (basic) science", en: "surgery in high risk and immuno- compromised patients", ar: "الجراحة لدى المرضى عاليي الخطورة ومنقوصي المناعة" },
    { topic: "applied clinical (basic) science", en: "principles of design", ar: "مبادئ التصميم" },
    { topic: "applied clinical (basic) science", en: "prescription and fitting of standard orthoses", ar: "وصف وتركيب الأجهزة التقويمية القياسية" },
    { topic: "applied clinical (basic) science", en: "principles of orthotic bracing for control of disease, deformity and instability", ar: "مبادئ الدعامات التقويمية للسيطرة على المرض والتشوه وعدم الثبات" },
    { topic: "applied clinical (basic) science", en: "anaesthesia - principles and practice of local and regional anaesthesia and principles of general anaesthesia", ar: "التخدير - مبادئ وممارسة التخدير الموضعي والناحي ومبادئ التخدير العام" },
    { topic: "applied clinical (basic) science", en: "pain management programmes and management of complex regional pain syndrome", ar: "برامج تدبير الألم وتدبير متلازمة الألم الناحي المعقد" },
    { topic: "applied clinical (basic) science", en: "pain and pain relief", ar: "الألم وتسكينه" },
    { topic: "applied clinical (basic) science", en: "behavioural dysfunction and somatization", ar: "الخلل السلوكي والجَسْدنة" },
    { topic: "applied clinical (basic) science", en: "presentation, radiological features, pathological features, treatment and outcome for common benign and malignant tumours", ar: "التظاهر والملامح الشعاعية والمرضية والعلاج والمآل للأورام الحميدة والخبيثة الشائعة" },
    { topic: "applied clinical (basic) science", en: "principles of management of patients with metastatic bone disease in terms of investigation, prophylactic and definitive fixation of pathological fractures and oncological management", ar: "مبادئ تدبير مرضى المرض العظمي النقيلي من حيث الفحص والتثبيت الوقائي والنهائي للكسور المرضية والتدبير الأورامي" },
    { topic: "applied clinical (basic) science", en: "presenting features, management and outcome of soft tissue swellings, including primary musculo-skeletal malignancy", ar: "الملامح السريرية وتدبير ومآل تورمات الأنسجة الرخوة بما في ذلك الأورام الخبيثة العضلية الهيكلية الأولية" },
    { topic: "applied clinical (basic) science", en: "bone grafts, bone banking and tissue transplantation", ar: "طعوم العظم وبنوك العظام وزرع الأنسجة" },
    { topic: "applied clinical (basic) science", en: "biomechanics of musculoskeletal tissues", ar: "الميكانيكا الحيوية للأنسجة العضلية الهيكلية" },
    { topic: "applied clinical (basic) science", en: "biomechanics of fracture fixation", ar: "الميكانيكا الحيوية لتثبيت الكسور" },
    { topic: "applied clinical (basic) science", en: "tribology of natural and artificial joints", ar: "علم الاحتكاك للمفاصل الطبيعية والصناعية" },
    { topic: "applied clinical (basic) science", en: "design of implants and factors associated with implant failure (wear, loosening)", ar: "تصميم الغرسات والعوامل المرتبطة بفشلها (التآكل والارتخاء)" },
    { topic: "applied clinical (basic) science", en: "biomaterials", ar: "المواد الحيوية" },
    { topic: "applied clinical (basic) science", en: "application/relevance of modern genomics to orthopaedic disease and treatment", ar: "تطبيق/صلة علم الجينوم الحديث بأمراض العظام وعلاجها" },
    { topic: "applied clinical (basic) science", en: "molecular genomics and molecular biology in t&o", ar: "الجينوم الجزيئي والبيولوجيا الجزيئية في جراحة العظام والإصابات" },
    { topic: "applied clinical (basic) science", en: "cell biology in t&o", ar: "بيولوجيا الخلية في جراحة العظام والإصابات" },
    { topic: "applied clinical (basic) science", en: "cellular and molecular basis of wound healing", ar: "الأساس الخلوي والجزيئي لالتئام الجروح" },
    { topic: "applied clinical (basic) science", en: "musculoskeletal imaging: x-ray, contrast studies, ct, mr, ultrasound, radioisotope studies", ar: "تصوير الجهاز العضلي الهيكلي: الأشعة السينية ودراسات التباين والتصوير المقطعي والرنين والموجات فوق الصوتية والنظائر المشعة" },
    { topic: "applied clinical (basic) science", en: "assessment of bone mass and fracture risk", ar: "تقييم كتلة العظم وخطر الكسر" },
    { topic: "applied clinical (basic) science", en: "effects of radiation", ar: "آثار الإشعاع" },
    { topic: "applied clinical (basic) science", en: "blood tests", ar: "تحاليل الدم" },
    { topic: "applied clinical (basic) science", en: "kinematics and gait analysis", ar: "علم الحركة وتحليل المشية" },
    { topic: "applied clinical (basic) science", en: "electrophysiological investigations", ar: "الفحوص الفيزيولوجية الكهربية" },
    { topic: "applied clinical (basic) science", en: "design of theatres", ar: "تصميم غرف العمليات" },
    { topic: "applied clinical (basic) science", en: "tourniquets", ar: "العاصبات" },
    { topic: "applied clinical (basic) science", en: "sterilisation", ar: "التعقيم" },
    { topic: "applied clinical (basic) science", en: "infection prevention and control", ar: "الوقاية من العدوى ومكافحتها" },
    { topic: "applied clinical (basic) science", en: "patient warming methods and rationale", ar: "طرق تدفئة المريض ومبرراتها" },
    { topic: "applied clinical (basic) science", en: "skin preparation", ar: "تحضير الجلد" },
    { topic: "applied clinical (basic) science", en: "duty of care", ar: "واجب الرعاية" },
    { topic: "applied clinical (basic) science", en: "informed consent", ar: "الموافقة المستنيرة" },
    { topic: "applied clinical (basic) science", en: "data analysis and statistics - principles and applications", ar: "تحليل البيانات والإحصاء - المبادئ والتطبيقات" },
    { topic: "applied clinical (basic) science", en: "principles of epidemiology", ar: "مبادئ علم الأوبئة" },
    { topic: "applied clinical (basic) science", en: "design and conduct of clinical trials", ar: "تصميم وإجراء التجارب السريرية" },
    { topic: "applied clinical (basic) science", en: "quality improvement projects including principles, methods and reporting", ar: "مشاريع تحسين الجودة بما في ذلك المبادئ والطرق والإبلاغ" },
    { topic: "applied clinical (basic) science", en: "audit", ar: "التدقيق (المراجعة السريرية)" },
    { topic: "applied clinical (basic) science", en: "clinical governance", ar: "الحوكمة السريرية" },
    // ── 2. foot and ankle ──
    { topic: "foot and ankle", en: "anatomy of the foot and ankle and related structures", ar: "تشريح القدم والكاحل والبنى ذات الصلة" },
    { topic: "foot and ankle", en: "surgical approaches: ankle, subtalar joint, mid-tarsal joint and forefoot and arthroscopic access", ar: "المداخل الجراحية: الكاحل والمفصل تحت الكاحل والمفصل الرصغي الأوسط ومقدمة القدم والدخول بالمنظار" },
    { topic: "foot and ankle", en: "surgical approach to weber b ankle fractures", ar: "المدخل الجراحي لكسور الكاحل من نوع Weber B" },
    { topic: "foot and ankle", en: "physiology of nerve function around the foot and ankle", ar: "فسيولوجيا وظيفة العصب حول القدم والكاحل" },
    { topic: "foot and ankle", en: "inflammatory, degenerative and infective conditions of the foot and ankle", ar: "الحالات الالتهابية والتنكسية والعدوائية للقدم والكاحل" },
    { topic: "foot and ankle", en: "instability of the foot and ankle", ar: "عدم ثبات القدم والكاحل" },
    { topic: "foot and ankle", en: "the neuropathic foot", ar: "القدم العصبية (اعتلال الأعصاب)" },
    { topic: "foot and ankle", en: "acquired and developmental deformities of the foot and ankle", ar: "التشوهات المكتسبة والتطورية للقدم والكاحل" },
    { topic: "foot and ankle", en: "causes of foot pain", ar: "أسباب ألم القدم" },
    { topic: "foot and ankle", en: "biomechanics of the foot and ankle", ar: "الميكانيكا الحيوية للقدم والكاحل" },
    { topic: "foot and ankle", en: "biomechanics of tendon transfer techniques", ar: "الميكانيكا الحيوية لتقنيات نقل الأوتار" },
    { topic: "foot and ankle", en: "biomechanics of the various types of ankle and first ray prostheses including the factors influencing design, wear and loosening", ar: "الميكانيكا الحيوية لمختلف أنواع مفاصل الكاحل والشعاع الأول الصناعية بما في ذلك العوامل المؤثرة في التصميم والتآكل والارتخاء" },
    { topic: "foot and ankle", en: "the functional role of orthotic devices", ar: "الدور الوظيفي للأجهزة التقويمية" },
    { topic: "foot and ankle", en: "radiological investigations to assess foot and ankle conditions", ar: "الفحوص الشعاعية لتقييم حالات القدم والكاحل" },
    { topic: "foot and ankle", en: "role of diagnostic and guided injections of the foot and ankle", ar: "دور الحقن التشخيصي والموجَّه للقدم والكاحل" },
    { topic: "foot and ankle", en: "role of examination under anaesthetic and diagnostic arthroscopy", ar: "دور الفحص تحت التخدير والتنظير المفصلي التشخيصي" },
    { topic: "foot and ankle", en: "neurophysiology in foot and ankle disorders", ar: "الفيزيولوجيا العصبية في اضطرابات القدم والكاحل" },
    { topic: "foot and ankle", en: "compartment syndrome", ar: "متلازمة الحيز (متلازمة الحجرة)" },
    { topic: "foot and ankle", en: "diabetic foot", ar: "القدم السكرية" },
    { topic: "foot and ankle", en: "necrotising fasciitis", ar: "التهاب اللفافة المنخر" },
    { topic: "foot and ankle", en: "history and examination of the foot and ankle including special clinical tests", ar: "تاريخ وفحص القدم والكاحل بما في ذلك الاختبارات السريرية الخاصة" },
    { topic: "foot and ankle", en: "prosthetic replacement in the foot and ankle", ar: "الاستبدال الصناعي في القدم والكاحل" },
    { topic: "foot and ankle", en: "arthroscopy of the foot and ankle", ar: "تنظير مفصل القدم والكاحل" },
    { topic: "foot and ankle", en: "amputations in the foot and ankle", ar: "البتر في القدم والكاحل" },
    { topic: "foot and ankle", en: "arthrodesis in the foot and ankle", ar: "إيثاق المفصل في القدم والكاحل" },
    { topic: "foot and ankle", en: "excision arthroplasty", ar: "رأب المفصل بالاستئصال" },
    { topic: "foot and ankle", en: "first ray surgery", ar: "جراحة الشعاع الأول" },
    { topic: "foot and ankle", en: "lesser toe surgery", ar: "جراحة الأصابع الصغرى للقدم" },
    { topic: "foot and ankle", en: "ligament reconstruction in the foot and ankle", ar: "إعادة بناء الرباط في القدم والكاحل" },
    { topic: "foot and ankle", en: "the rheumatoid foot and ankle", ar: "القدم والكاحل الروماتويدية" },
    { topic: "foot and ankle", en: "management of tendon, ligament and nerve injuries", ar: "تدبير إصابات الأوتار والأربطة والأعصاب" },
    { topic: "foot and ankle", en: "footwear modifications, orthoses and total contact casting", ar: "تعديلات الأحذية والأجهزة التقويمية والتجبير كامل التماس" },
    { topic: "foot and ankle", en: "rehabilitation of the foot and ankle", ar: "إعادة تأهيل القدم والكاحل" },
    { topic: "foot and ankle", en: "management of failed arthroplasty and management of failed soft tissue surgery", ar: "تدبير رأب المفصل الفاشل وجراحة الأنسجة الرخوة الفاشلة" },
    // ── 3. knee ──
    { topic: "knee", en: "anatomy of the knee joint and related structures", ar: "تشريح مفصل الركبة والبنى ذات الصلة" },
    { topic: "knee", en: "surgical approaches to the knee and arthroscopic access", ar: "المداخل الجراحية للركبة والدخول بالمنظار" },
    { topic: "knee", en: "physiology of nerve function around the knee", ar: "فسيولوجيا وظيفة العصب حول الركبة" },
    { topic: "knee", en: "inflammatory, degenerative and infective conditions of the knee", ar: "الحالات الالتهابية والتنكسية والعدوائية للركبة" },
    { topic: "knee", en: "instability of the knee, including the patellofemoral joint", ar: "عدم ثبات الركبة بما في ذلك المفصل الرضفي الفخذي" },
    { topic: "knee", en: "acquired and developmental deformities of the knee", ar: "التشوهات المكتسبة والتطورية للركبة" },
    { topic: "knee", en: "causes of the painful knee", ar: "أسباب الركبة المؤلمة" },
    { topic: "knee", en: "benign and malignant conditions in the knee and surrounding structures", ar: "الحالات الحميدة والخبيثة في الركبة والبنى المحيطة" },
    { topic: "knee", en: "biomechanics of the knee", ar: "الميكانيكا الحيوية للركبة" },
    { topic: "knee", en: "biomechanics of knee arthroplasty", ar: "الميكانيكا الحيوية لرأب مفصل الركبة" },
    { topic: "knee", en: "radiological investigation to assess the knee", ar: "الفحص الشعاعي لتقييم الركبة" },
    { topic: "knee", en: "diagnostic aspiration", ar: "الشفط التشخيصي" },
    { topic: "knee", en: "therapeutic injection", ar: "الحقن العلاجي" },
    { topic: "knee", en: "examination under anaesthetic and arthroscopy", ar: "الفحص تحت التخدير والتنظير المفصلي" },
    { topic: "knee", en: "neurophysiology in knee disorders", ar: "الفيزيولوجيا العصبية في اضطرابات الركبة" },
    { topic: "knee", en: "neurovascular injuries", ar: "الإصابات العصبية الوعائية" },
    { topic: "knee", en: "primary and secondary musculo-skeletal malignancy around the knee", ar: "الأورام الخبيثة العضلية الهيكلية الأولية والثانوية حول الركبة" },
    { topic: "knee", en: "history and examination of the knee joint including special clinical tests", ar: "تاريخ وفحص مفصل الركبة بما في ذلك الاختبارات السريرية الخاصة" },
    { topic: "knee", en: "arthroplasty of the knee", ar: "رأب مفصل الركبة" },
    { topic: "knee", en: "arthroscopy of the knee", ar: "تنظير مفصل الركبة" },
    { topic: "knee", en: "ligamentous instability of the knee", ar: "عدم الثبات الرباطي للركبة" },
    { topic: "knee", en: "patello-femoral disorders", ar: "اضطرابات المفصل الرضفي الفخذي" },
    { topic: "knee", en: "meniscal pathology", ar: "أمراض الغضروف الهلالي" },
    { topic: "knee", en: "degenerative and inflammatory arthritis", ar: "التهاب المفاصل التنكسي والالتهابي" },
    { topic: "knee", en: "principles of revision surgery for failed arthroplasty", ar: "مبادئ جراحة المراجعة لرأب المفصل الفاشل" },
    { topic: "knee", en: "therapeutic injection of the knee", ar: "الحقن العلاجي للركبة" },
    { topic: "knee", en: "techniques available to repair and replace articular cartilage", ar: "التقنيات المتاحة لإصلاح واستبدال الغضروف المفصلي" },
    { topic: "knee", en: "management of tendon, ligament and nerve injuries", ar: "تدبير إصابات الأوتار والأربطة والأعصاب" },
    { topic: "knee", en: "orthoses", ar: "الأجهزة التقويمية" },
    { topic: "knee", en: "rehabilitation of the knee", ar: "إعادة تأهيل الركبة" },
    { topic: "knee", en: "failed arthroplasty and soft tissue surgery", ar: "رأب المفصل الفاشل وجراحة الأنسجة الرخوة" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    // ── Topics (all 10) ──
    const topicRows = this.TOPICS.map(([en, ar], i) => `('${q(en)}', '${q(ar)}', ${i})`).join(",\n        ");
    await queryRunner.query(`
      INSERT INTO "lecture_topics" ("departmentId", "title", "arTitle", "sortOrder")
      SELECT d."id", v.title, v.ar, v.ord
      FROM "departments" d
      CROSS JOIN (VALUES ${topicRows}) AS v(title, ar, ord)
      WHERE d."code" = 'ORTHO'
    `);
    const topicIndex = new Map(this.TOPICS.map(([en], i) => [en, i + 1]));

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
    // Deleting the ORTHO topics cascades to their lectures (all ORTHO lecture migrations).
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'ORTHO'
    `);
  }
}
