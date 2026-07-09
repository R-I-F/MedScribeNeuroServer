import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * CTS academic lectures — ISCP Cardiothoracic Surgery Curriculum (Aug 2021), Appendix 2.
 * Part 6 (Cross-cutting B, final): topics 19–20 (Critical Care and Post-operative Management,
 * Cardiothoracic Trauma). Topics created in migration 191.
 * section 1 = KNOWLEDGE/CLINICAL, section 2 = TECHNICAL/OPERATIVE. `level` = NULL (MSc/MD sourced
 * later). Topic-19 knowledge preserves the ISCP sub-category labels (physiology/anatomy/pathology/
 * pharmacology/microbiology); three clinical items that are verbatim echoes of knowledge items
 * (management of complications of surgery; blood transfusion and blood products; wound infection
 * and sternal disruption) are deduped. Faithful; competence rating numbers stripped.
 */
export class AuthorCtsLecturesCrossCuttingB1750000000196 implements MigrationInterface {
  name = "AuthorCtsLecturesCrossCuttingB1750000000196";

  private readonly TOPIC_INDEX: Record<string, number> = {
    "Critical Care and Post-operative Management": 19,
    "Cardiothoracic Trauma": 20,
  };

  private readonly LECTURES: Array<{ topic: string; section: 1 | 2; en: string; ar: string }> = [
    // ── 19. Critical Care and Post-operative Management ── (section 1: knowledge + clinical)
    { topic: "Critical Care and Post-operative Management", section: 1, en: "physiology: haemodynamics, physiology and measurement", ar: "الفسيولوجيا: الديناميكا الدموية والفسيولوجيا والقياس" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "physiology: cardiac arrhythmia", ar: "الفسيولوجيا: اضطراب النظم القلبي" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "physiology: haemostasis, thrombosis and bleeding", ar: "الفسيولوجيا: الإرقاء والتخثر والنزف" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "physiology: acid base balance", ar: "الفسيولوجيا: اتزان الحمض والقاعدة" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "physiology: pulmonary physiology, ventilation and gas exchange", ar: "الفسيولوجيا: فسيولوجيا الرئة والتهوية وتبادل الغازات" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "physiology: metabolic response to trauma and surgery", ar: "الفسيولوجيا: الاستجابة الأيضية للرض والجراحة" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "physiology: git, renal and hepatic physiology", ar: "الفسيولوجيا: فسيولوجيا الجهاز الهضمي والكلى والكبد" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "physiology: nutrition", ar: "الفسيولوجيا: التغذية" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "physiology: temperature regulation", ar: "الفسيولوجيا: تنظيم الحرارة" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "anatomy: heart, pericardium and great vessels", ar: "التشريح: القلب والتامور والأوعية الكبيرة" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "anatomy: mediastinum, thoracic inlet and neck", ar: "التشريح: المنصف ومدخل الصدر والرقبة" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "anatomy: tracheobronchial tree and lungs", ar: "التشريح: الشجرة الرغامية القصبية والرئتان" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "anatomy: chest wall and diaphragm", ar: "التشريح: جدار الصدر والحجاب الحاجز" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pathology: inflammation and wound healing", ar: "الباثولوجيا: الالتهاب والتئام الجروح" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pathology: myocardial infarction and complications", ar: "الباثولوجيا: احتشاء عضلة القلب ومضاعفاته" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pathology: endocarditis", ar: "الباثولوجيا: التهاب الشغاف" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pathology: pericarditis", ar: "الباثولوجيا: التهاب التامور" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pathology: systemic inflammatory response syndrome", ar: "الباثولوجيا: متلازمة الاستجابة الالتهابية الجهازية" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pathology: bronchopulmonary infection", ar: "الباثولوجيا: العدوى القصبية الرئوية" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pharmacology: drugs used in the treatment of hypertension, heart failure and angina", ar: "الأدوية: الأدوية المستخدمة في علاج ارتفاع ضغط الدم وقصور القلب والذبحة الصدرية" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pharmacology: inotropes, vasodilators and vasoconstrictors", ar: "الأدوية: مقويات العضلة القلبية وموسعات وقابضات الأوعية" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pharmacology: anti-arrhythmic drugs", ar: "الأدوية: مضادات اضطراب النظم" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pharmacology: haemostatic drugs", ar: "الأدوية: الأدوية المرقئة" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pharmacology: antiplatelet, anticoagulant and thrombolytic drugs", ar: "الأدوية: مضادات الصفيحات ومضادات التخثر وحالّات الخثرة" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pharmacology: analgesics", ar: "الأدوية: المسكنات" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pharmacology: antibiotics", ar: "الأدوية: المضادات الحيوية" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pharmacology: anaesthetic agents, local and general", ar: "الأدوية: عوامل التخدير الموضعي والعام" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "microbiology: organisms involved in cardiorespiratory infection", ar: "الأحياء الدقيقة: الكائنات المسببة للعدوى القلبية التنفسية" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "microbiology: antimicrobial treatment and policies", ar: "الأحياء الدقيقة: العلاج المضاد للميكروبات وسياساته" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "cardiopulmonary resuscitation", ar: "الإنعاش القلبي الرئوي" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "management of cardiac surgical patient", ar: "تدبير مريض جراحة القلب" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "management of thoracic surgical patient", ar: "تدبير مريض جراحة الصدر" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "treatment of cardiac arrhythmia", ar: "علاج اضطراب النظم القلبي" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "management of complications of surgery", ar: "تدبير مضاعفات الجراحة" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "blood transfusion and blood products", ar: "نقل الدم ومشتقاته" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "wound infection and sternal disruption", ar: "عدوى الجرح وتفكك القص" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "neuropsychological consequences of surgery and critical care", ar: "العواقب العصبية النفسية للجراحة والعناية المركزة" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "history and examination of the post-operative and critically ill patient", ar: "التاريخ والفحص للمريض بعد الجراحة والمريض الحرج" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "analysis and interpretation of post-operative and critical care charts and documentation", ar: "تحليل وتفسير مخططات ووثائق ما بعد الجراحة والعناية المركزة" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "routine haematology and biochemical investigations", ar: "الفحوص الروتينية الدموية والكيميائية الحيوية" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "chest radiograph and ecg", ar: "صورة الصدر الشعاعية وتخطيط القلب الكهربي" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "echocardiography including toe", ar: "تخطيط صدى القلب بما في ذلك عبر المريء (TOE)" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "general management of surgical patient", ar: "التدبير العام للمريض الجراحي" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "management of fluid balance and circulating volume", ar: "تدبير توازن السوائل وحجم الدوران" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "pain control", ar: "التحكم في الألم" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "wound management", ar: "تدبير الجروح" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "management of surgical drains", ar: "تدبير المنازح الجراحية" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "antimicrobial policy and prescribing", ar: "سياسة مضادات الميكروبات ووصفها" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "management of postoperative haemorrhage", ar: "تدبير النزف بعد الجراحة" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "cardiopulmonary resuscitation (als)", ar: "الإنعاش القلبي الرئوي (الدعم المتقدم للحياة ALS)" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "recognition, evaluation and treatment of haemodynamic abnormalities", ar: "التعرف على اضطرابات الديناميكا الدموية وتقييمها وعلاجها" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "evaluation and interpretation of haemodynamic data", ar: "تقييم وتفسير البيانات الديناميكية الدموية" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "practical use of inotropes and vasoactive drugs", ar: "الاستخدام العملي لمقويات العضلة القلبية والأدوية الفعالة وعائيًا" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "use of an intra-aortic balloon pump (iabp)", ar: "استخدام مضخة البالون داخل الأبهر (IABP)" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "recognition, evaluation and treatment of cardiac arrhythmias", ar: "التعرف على اضطرابات النظم القلبي وتقييمها وعلاجها" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "interpretation of ecg", ar: "تفسير تخطيط القلب الكهربي" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "use of antiarrhythmic drugs", ar: "استخدام مضادات اضطراب النظم" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "use of defibrillator", ar: "استخدام مزيل الرجفان" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "understanding and use of cardiac pacing", ar: "فهم واستخدام تنظيم ضربات القلب" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "recognition, evaluation and treatment of ventilatory abnormalities", ar: "التعرف على اضطرابات التهوية وتقييمها وعلاجها" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "interpretation of blood gas results", ar: "تفسير نتائج غازات الدم" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "airway management", ar: "تدبير مجرى الهواء" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "understanding of ventilatory techniques and methods", ar: "فهم تقنيات وطرق التهوية" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "understanding of anaesthetic drugs and methods", ar: "فهم أدوية وطرق التخدير" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "recognition, evaluation and treatment of multi-organ dysfunction", ar: "التعرف على الخلل الوظيفي متعدد الأعضاء وتقييمه وعلاجه" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "renal dysfunction and support", ar: "الخلل الوظيفي الكلوي والدعم الكلوي" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "git dysfunction, feeding and nutrition", ar: "الخلل الوظيفي للجهاز الهضمي والإطعام والتغذية" },
    { topic: "Critical Care and Post-operative Management", section: 1, en: "recognition and evaluation of cerebral and neuropsychological problems", ar: "التعرف على المشاكل الدماغية والعصبية النفسية وتقييمها" },
    { topic: "Critical Care and Post-operative Management", section: 2, en: "arterial cannulation", ar: "قنطرة شريانية" },
    { topic: "Critical Care and Post-operative Management", section: 2, en: "central venous cannulation", ar: "قنطرة وريدية مركزية" },
    { topic: "Critical Care and Post-operative Management", section: 2, en: "insertion of swan ganz pa catheter (including measurement of cardiac outputs and interpretation of results)", ar: "إدخال قسطرة سوان-غانز الرئوية (بما في ذلك قياس النتاج القلبي وتفسير النتائج)" },
    { topic: "Critical Care and Post-operative Management", section: 2, en: "iabp insertion", ar: "إدخال مضخة البالون داخل الأبهر" },
    { topic: "Critical Care and Post-operative Management", section: 2, en: "iabp timing and management", ar: "توقيت وتدبير مضخة البالون داخل الأبهر" },
    { topic: "Critical Care and Post-operative Management", section: 2, en: "tracheostomy", ar: "فغر الرغامى" },
    { topic: "Critical Care and Post-operative Management", section: 2, en: "fibreoptic bronchoscopy", ar: "تنظير القصبات بالألياف البصرية" },
    { topic: "Critical Care and Post-operative Management", section: 2, en: "chest aspiration", ar: "بزل الصدر" },
    { topic: "Critical Care and Post-operative Management", section: 2, en: "chest drain insertion", ar: "إدخال أنبوب الصدر" },
    { topic: "Critical Care and Post-operative Management", section: 2, en: "chest drain management", ar: "تدبير أنبوب الصدر" },
    { topic: "Critical Care and Post-operative Management", section: 2, en: "establish an airway", ar: "تأمين مجرى الهواء" },
    { topic: "Critical Care and Post-operative Management", section: 2, en: "internal cardiac massage", ar: "التدليك القلبي الداخلي" },
    { topic: "Critical Care and Post-operative Management", section: 2, en: "re-exploration for bleeding or tamponade", ar: "إعادة الاستكشاف للنزف أو الدكاك" },
    // ── 20. Cardiothoracic Trauma ── (section 1: general trauma knowledge + clinical)
    { topic: "Cardiothoracic Trauma", section: 1, en: "principles of trauma management (as defined by atls®)", ar: "مبادئ تدبير الرضوح (وفقًا لبروتوكول ATLS®)" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "principles of emergency resuscitation following cardiac arrest", ar: "مبادئ الإنعاش الطارئ بعد توقف القلب" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "the mechanism and patterns of injury associated with blunt, penetrating, blast and deceleration injuries to the chest", ar: "آلية وأنماط الإصابة المرتبطة بالرضوح الكليلة والنافذة والانفجارية وإصابات التباطؤ للصدر" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "the post-atls® definitive care of blunt, penetrating and deceleration injuries to the chest", ar: "الرعاية النهائية بعد ATLS® للرضوح الكليلة والنافذة وإصابات التباطؤ للصدر" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "the indications and use of appropriate investigations in thoracic trauma management", ar: "دواعي واستخدام الفحوص المناسبة في تدبير رضوح الصدر" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "pain relief in chest trauma, including epidural anaesthesia", ar: "تخفيف الألم في رضوح الصدر بما في ذلك التخدير فوق الجافية" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "indications for immediate, urgent and delayed thoracotomy in trauma", ar: "دواعي بضع الصدر الفوري والعاجل والمؤجل في الرضوح" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "assessment and management of airway, breathing and circulation", ar: "تقييم وتدبير مجرى الهواء والتنفس والدوران" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "maintenance of an adequate airway and respiratory support", ar: "الحفاظ على مجرى هواء كافٍ والدعم التنفسي" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "protection of the cervical spine", ar: "حماية العمود الفقري العنقي" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "circulatory resuscitation", ar: "الإنعاش الدوراني" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "establishment of appropriate monitoring", ar: "إنشاء مراقبة مناسبة" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "assessment and management of pain and anxiety", ar: "تقييم وتدبير الألم والقلق" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "examination and assessment of the chest, including respiratory, cardiovascular and circulatory systems", ar: "فحص وتقييم الصدر بما في ذلك الأجهزة التنفسية والقلبية الوعائية والدورانية" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "recognition and management of immediately life threatening situations: obstructed airway, tension pneumothorax, massive haemothorax, open chest wound, flail chest and cardiac tamponade", ar: "التعرف على الحالات المهددة للحياة فورًا وتدبيرها: انسداد مجرى الهواء واسترواح الصدر الضاغط وتدمي الصدر الشديد والجرح الصدري المفتوح والصدر المرفرف والدكاك القلبي" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "recognition and management of potentially life threatening situations: lung contusion, bronchial rupture, blunt cardiac injury, intrathoracic bleeding, oesophageal injury, simple pneumothorax and major vascular injury", ar: "التعرف على الحالات المحتملة التهديد للحياة وتدبيرها: كدمة الرئة وتمزق القصبة والإصابة القلبية الكليلة والنزف داخل الصدر وإصابة المريء واسترواح الصدر البسيط والإصابة الوعائية الكبرى" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "recognition of potentially life threatening penetrating injuries to the chest and abdomen", ar: "التعرف على الإصابات النافذة المحتملة التهديد للحياة في الصدر والبطن" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "interpretation of chest x-ray, ecg, arterial blood gases and echocardiography", ar: "تفسير صورة الصدر الشعاعية وتخطيط القلب وغازات الدم الشرياني وتخطيط صدى القلب" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "detection and treatment of cardiac arrhythmias", ar: "كشف وعلاج اضطرابات النظم القلبي" },
    { topic: "Cardiothoracic Trauma", section: 1, en: "management of the widened mediastinum including appropriate investigations and multidisciplinary consultation", ar: "تدبير المنصف المتسع بما في ذلك الفحوص المناسبة والاستشارة متعددة التخصصات" },
    { topic: "Cardiothoracic Trauma", section: 2, en: "establish an emergency airway (surgical and non-surgical)", ar: "تأمين مجرى هواء طارئ (جراحي وغير جراحي)" },
    { topic: "Cardiothoracic Trauma", section: 2, en: "insertion and management of thoracic drains", ar: "إدخال وتدبير أنابيب الصدر" },
    { topic: "Cardiothoracic Trauma", section: 2, en: "establish adequate venous access and monitoring", ar: "تأمين وصول وريدي كافٍ ومراقبة" },
    { topic: "Cardiothoracic Trauma", section: 2, en: "posterolateral thoracotomy, anterolateral thoracotomy and thoracolaparotomy", ar: "بضع الصدر الخلفي الوحشي والأمامي الوحشي وبضع الصدر والبطن" },
    { topic: "Cardiothoracic Trauma", section: 2, en: "bilateral anterior thoracotomy", ar: "بضع الصدر الأمامي الثنائي الجانب" },
    { topic: "Cardiothoracic Trauma", section: 2, en: "median sternotomy and closure", ar: "شق القص المتوسط وإغلاقه" },
    { topic: "Cardiothoracic Trauma", section: 2, en: "repair of cardiac injuries", ar: "إصلاح الإصابات القلبية" },
    { topic: "Cardiothoracic Trauma", section: 2, en: "repair of pulmonary and bronchial injuries", ar: "إصلاح الإصابات الرئوية والقصبية" },
    { topic: "Cardiothoracic Trauma", section: 2, en: "operative management of fractured ribs and flail chest", ar: "التدبير الجراحي لكسور الأضلاع والصدر المرفرف" },
    { topic: "Cardiothoracic Trauma", section: 2, en: "management of the complications of chest trauma, including retained haemothorax and empyema", ar: "تدبير مضاعفات رضوح الصدر بما في ذلك تدمي الصدر المحتبس والدبيلة" },
    { topic: "Cardiothoracic Trauma", section: 2, en: "repair of oesophageal injuries", ar: "إصلاح إصابات المريء" },
    { topic: "Cardiothoracic Trauma", section: 2, en: "treatment of aortic transection", ar: "علاج القطع الأبهري" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");
    const counters = new Map<string, number>();
    const rows = this.LECTURES.map((l) => {
      const c = this.TOPIC_INDEX[l.topic];
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
    await queryRunner.query(`
      DELETE FROM "lectures" lx
      USING "lecture_topics" lt, "departments" d
      WHERE lx."topicId" = lt."id" AND lt."departmentId" = d."id" AND d."code" = 'CTS'
        AND lt."title" IN ('Critical Care and Post-operative Management', 'Cardiothoracic Trauma')
    `);
  }
}
