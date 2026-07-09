import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ORTHO (Orthopedic Surgery) academic lectures — transcribed from the ISCP Trauma & Orthopaedic
 * Surgery Curriculum (Aug 2021), Appendix 2 "Trauma and Orthopaedic Surgery Syllabus", the
 * **Applied Clinical KNOWLEDGE** component. Reference cited in MEDICAL_CODE_AUDITS/ORTHO/LECTURES_ORTHO.md.
 *
 * Part 2: Hip, Spine, Hand, Elbow lectures. Topics created in migration 200.
 *
 * Faithful transcription of the ISCP knowledge-syllabus topics — nothing invented. Each item is a
 * KNOWLEDGE/CLINICAL syllabus entry (numbered `<topic>.1.<n>`). The Applied Clinical SKILLS
 * (Part B, a trainee-logbook procedure list) is intentionally excluded from the lecture curriculum
 * (documented in the audit file). **`level` is NULL** on every row: the ISCP competence numbers
 * (1–4 knowledge depth) are NOT the Egyptian MSc/MD construct, so level is left NULL (sourced later)
 * rather than guessed. Bilingual (EN + AR).
 */
export class AuthorOrthoLecturesHipSpineHandElbow1750000000201 implements MigrationInterface {
  name = "AuthorOrthoLecturesHipSpineHandElbow1750000000201";

  // topic → its index in the 10-topic list (for numbering <idx>.1.<n>)
  private readonly TOPIC_INDEX: Record<string, number> = {
    "hip": 4,
    "spine": 5,
    "hand": 6,
    "elbow": 7,
  };

  // section 1 = KNOWLEDGE/CLINICAL. { topic, en, ar }
  private readonly LECTURES: Array<{ topic: string; en: string; ar: string }> = [
    // ── 4. hip ──
    { topic: "hip", en: "anatomy of the hip and pelvic region and related structures", ar: "تشريح الورك ومنطقة الحوض والبنى ذات الصلة" },
    { topic: "hip", en: "surgical approaches to the hip including arthroscopic access", ar: "المداخل الجراحية للورك بما في ذلك الدخول بالمنظار" },
    { topic: "hip", en: "physiology of nerve function affecting the hip", ar: "فسيولوجيا وظيفة العصب المؤثرة على الورك" },
    { topic: "hip", en: "inflammatory, degenerative and infective conditions of the hip", ar: "الحالات الالتهابية والتنكسية والعدوائية للورك" },
    { topic: "hip", en: "impingement disorders", ar: "اضطرابات الانحشار" },
    { topic: "hip", en: "acquired and developmental deformity around the hip", ar: "التشوه المكتسب والتطوري حول الورك" },
    { topic: "hip", en: "the painful hip", ar: "الورك المؤلم" },
    { topic: "hip", en: "biomechanics of the hip", ar: "الميكانيكا الحيوية للورك" },
    { topic: "hip", en: "biomechanics of hip arthroplasty", ar: "الميكانيكا الحيوية لرأب مفصل الورك" },
    { topic: "hip", en: "radiological investigations to assess the hip", ar: "الفحوص الشعاعية لتقييم الورك" },
    { topic: "hip", en: "diagnostic and guided injections", ar: "الحقن التشخيصي والموجَّه" },
    { topic: "hip", en: "hip arthroscopy", ar: "تنظير مفصل الورك" },
    { topic: "hip", en: "neurophysiology in hip disorders", ar: "الفيزيولوجيا العصبية في اضطرابات الورك" },
    { topic: "hip", en: "history and examination of hip including special clinical tests", ar: "تاريخ وفحص الورك بما في ذلك الاختبارات السريرية الخاصة" },
    { topic: "hip", en: "arthroplasty of the hip", ar: "رأب مفصل الورك" },
    { topic: "hip", en: "arthroscopy of the hip", ar: "تنظير مفصل الورك" },
    { topic: "hip", en: "soft tissue surgery, osteotomy and arthrodesis of the hip", ar: "جراحة الأنسجة الرخوة وقطع العظم وإيثاق مفصل الورك" },
    { topic: "hip", en: "management of tendon, ligament and nerve injuries", ar: "تدبير إصابات الأوتار والأربطة والأعصاب" },
    { topic: "hip", en: "orthoses", ar: "الأجهزة التقويمية" },
    { topic: "hip", en: "failed arthroplasty and soft tissue surgery", ar: "رأب المفصل الفاشل وجراحة الأنسجة الرخوة" },
    // ── 5. spine ──
    { topic: "spine", en: "development of the spine, spinal cord and nerve roots", ar: "تطور العمود الفقري والنخاع الشوكي والجذور العصبية" },
    { topic: "spine", en: "anatomy and principles of surgical approaches: anterior and posterior at each level and endoscopic access", ar: "التشريح ومبادئ المداخل الجراحية: الأمامي والخلفي في كل مستوى والدخول بالمنظار" },
    { topic: "spine", en: "physiology of nerve function affecting the spinal cord and emerging nerves", ar: "فسيولوجيا وظيفة العصب المؤثرة على النخاع الشوكي والأعصاب الخارجة" },
    { topic: "spine", en: "spinal shock and its physiological consequences", ar: "الصدمة النخاعية وعواقبها الفسيولوجية" },
    { topic: "spine", en: "the aging spine and degenerative disease", ar: "العمود الفقري المُسنّ والمرض التنكسي" },
    { topic: "spine", en: "acute and chronic infections of the spine", ar: "عداوى العمود الفقري الحادة والمزمنة" },
    { topic: "spine", en: "metabolic conditions affecting the spine", ar: "الحالات الأيضية المؤثرة على العمود الفقري" },
    { topic: "spine", en: "neuromuscular conditions affecting the spine", ar: "الحالات العصبية العضلية المؤثرة على العمود الفقري" },
    { topic: "spine", en: "deformities of the spine, paediatric and adult, including coronal and sagittal plane deformities", ar: "تشوهات العمود الفقري لدى الأطفال والبالغين بما في ذلك تشوهات المستويين الإكليلي والسهمي" },
    { topic: "spine", en: "causes of the acutely painful back, including referred pain e.g. acute prolapsed disc", ar: "أسباب الظهر المؤلم الحاد بما في ذلك الألم المُحال مثل انزلاق القرص الحاد" },
    { topic: "spine", en: "primary and secondary tumours of the spine", ar: "أورام العمود الفقري الأولية والثانوية" },
    { topic: "spine", en: "biomechanics of the spine", ar: "الميكانيكا الحيوية للعمود الفقري" },
    { topic: "spine", en: "spinal instability as applied to trauma, tumour, infection and spondylolysis/listhesis", ar: "عدم ثبات العمود الفقري كما يُطبَّق على الإصابة والورم والعدوى وانحلال/انزلاق الفقار" },
    { topic: "spine", en: "sagittal balance and the aging spine", ar: "التوازن السهمي والعمود الفقري المُسنّ" },
    { topic: "spine", en: "spinal instrumentation and internal fixation devices", ar: "أجهزة تثبيت العمود الفقري والتثبيت الداخلي" },
    { topic: "spine", en: "radiological investigations (and their interpretation) used to assess common spine conditions", ar: "الفحوص الشعاعية (وتفسيرها) المستخدمة لتقييم حالات العمود الفقري الشائعة" },
    { topic: "spine", en: "role of diagnostic and therapeutic injections", ar: "دور الحقن التشخيصي والعلاجي" },
    { topic: "spine", en: "role of biopsy including routes and complications", ar: "دور الخزعة بما في ذلك المسالك والمضاعفات" },
    { topic: "spine", en: "blood tests", ar: "تحاليل الدم" },
    { topic: "spine", en: "electrophysiological studies (including cord monitoring)", ar: "الدراسات الفيزيولوجية الكهربية (بما في ذلك مراقبة النخاع)" },
    { topic: "spine", en: "cauda equina syndrome", ar: "متلازمة ذيل الفرس" },
    { topic: "spine", en: "spinal trauma - assessment, immediate care and appropriate referral", ar: "إصابة العمود الفقري - التقييم والرعاية الفورية والإحالة المناسبة" },
    { topic: "spine", en: "infections e.g. tuberculosis", ar: "العداوى مثل السل" },
    { topic: "spine", en: "important complications of inflammatory spinal conditions - rheumatoid instability and ankylosing spondylitis", ar: "المضاعفات الهامة للحالات الفقرية الالتهابية - عدم الثبات الروماتويدي والتهاب الفقار المقسِّط" },
    { topic: "spine", en: "metastatic spinal cord compression", ar: "انضغاط النخاع الشوكي النقيلي" },
    { topic: "spine", en: "the painful spine in the child", ar: "العمود الفقري المؤلم لدى الطفل" },
    { topic: "spine", en: "history and examination of the painful and injured spine including special clinical tests", ar: "تاريخ وفحص العمود الفقري المؤلم والمصاب بما في ذلك الاختبارات السريرية الخاصة" },
    { topic: "spine", en: "assessment for non-spinal conditions presenting as back pain (e.g. renal colic or vascular)", ar: "تقييم الحالات غير الفقرية المتظاهرة بألم الظهر (مثل المغص الكلوي أو الوعائية)" },
    { topic: "spine", en: "recognition of somatisation, non-organic drivers of back pain and barriers to recovery (including yellow flags)", ar: "التعرف على الجَسْدنة والمحرّكات غير العضوية لألم الظهر وعوائق الشفاء (بما في ذلك الأعلام الصفراء)" },
    { topic: "spine", en: "indications, options and complications for compressive conditions including radicular, stenotic and myelopathic", ar: "الدواعي والخيارات والمضاعفات للحالات الانضغاطية بما في ذلك الجذرية والتضيقية والنخاعية" },
    { topic: "spine", en: "indications, options and complications of instability of the spine", ar: "دواعي وخيارات ومضاعفات عدم ثبات العمود الفقري" },
    { topic: "spine", en: "principles of management of tumours around the spine", ar: "مبادئ تدبير الأورام حول العمود الفقري" },
    { topic: "spine", en: "principles of management of deformity of the spine", ar: "مبادئ تدبير تشوه العمود الفقري" },
    { topic: "spine", en: "principles of the application of spinal bracing", ar: "مبادئ تطبيق دعامات العمود الفقري" },
    { topic: "spine", en: "scoliosis and kyphosis deformity, idiopathic & congenital", ar: "تشوه الجنف والحداب، مجهول السبب والخلقي" },
    { topic: "spine", en: "painful spine conditions, including kyphosis, spondylolysis and spondylolisthesis", ar: "حالات العمود الفقري المؤلمة بما في ذلك الحداب وانحلال الفقار وانزلاق الفقار" },
    { topic: "spine", en: "non-operative treatment of disorders, such as low back pain, sciatica", ar: "العلاج غير الجراحي للاضطرابات مثل ألم أسفل الظهر وعرق النسا" },
    { topic: "spine", en: "management of spinal fractures including osteoporotic fractures", ar: "تدبير كسور العمود الفقري بما في ذلك كسور هشاشة العظام" },
    { topic: "spine", en: "principles of interventional radiology in the management of spinal problems e.g. vertebroplasty", ar: "مبادئ الأشعة التداخلية في تدبير مشاكل العمود الفقري مثل رأب الفقرة" },
    { topic: "spine", en: "care of the spinal cord injury patient from initial assessment to principles of rehabilitation", ar: "رعاية مريض إصابة النخاع الشوكي من التقييم الأولي إلى مبادئ إعادة التأهيل" },
    { topic: "spine", en: "assessment and management of complications of spinal surgery (e.g. haematoma, neurological deterioration, failed biomechanics)", ar: "تقييم وتدبير مضاعفات جراحة العمود الفقري (مثل الورم الدموي والتدهور العصبي وفشل الميكانيكا الحيوية)" },
    // ── 6. hand ──
    { topic: "hand", en: "anatomy of the wrist and hand and related structures including forearm rotation", ar: "تشريح الرسغ واليد والبنى ذات الصلة بما في ذلك دوران الساعد" },
    { topic: "hand", en: "surgical approaches in the hand and wrist and arthroscopic access", ar: "المداخل الجراحية في اليد والرسغ والدخول بالمنظار" },
    { topic: "hand", en: "physiology of nerve function around the hand", ar: "فسيولوجيا وظيفة العصب حول اليد" },
    { topic: "hand", en: "inflammatory, degenerative and infective conditions of the hand and wrist", ar: "الحالات الالتهابية والتنكسية والعدوائية لليد والرسغ" },
    { topic: "hand", en: "dupuytren's disease", ar: "داء دوبويتران" },
    { topic: "hand", en: "high pressure injection injury", ar: "إصابة الحقن عالي الضغط" },
    { topic: "hand", en: "infection", ar: "العدوى" },
    { topic: "hand", en: "acquired and developmental deformity around the hand and wrist", ar: "التشوه المكتسب والتطوري حول اليد والرسغ" },
    { topic: "hand", en: "complex regional pain syndrome", ar: "متلازمة الألم الناحي المعقد" },
    { topic: "hand", en: "neurectomy", ar: "استئصال العصب" },
    { topic: "hand", en: "biomechanics of the hand and wrist", ar: "الميكانيكا الحيوية لليد والرسغ" },
    { topic: "hand", en: "biomechanics of hand and wrist arthroplasty", ar: "الميكانيكا الحيوية لرأب مفصل اليد والرسغ" },
    { topic: "hand", en: "radiological investigations to assess the hand and wrist", ar: "الفحوص الشعاعية لتقييم اليد والرسغ" },
    { topic: "hand", en: "neurophysiology of the hand and wrist", ar: "الفيزيولوجيا العصبية لليد والرسغ" },
    { topic: "hand", en: "diagnostic and guided injections", ar: "الحقن التشخيصي والموجَّه" },
    { topic: "hand", en: "examination under anaesthetic and arthroscopy", ar: "الفحص تحت التخدير والتنظير المفصلي" },
    { topic: "hand", en: "compartment syndrome", ar: "متلازمة الحيز (متلازمة الحجرة)" },
    { topic: "hand", en: "history and examination of the hand and wrist including special clinical tests", ar: "تاريخ وفحص اليد والرسغ بما في ذلك الاختبارات السريرية الخاصة" },
    { topic: "hand", en: "common clinical hand function tests", ar: "اختبارات وظيفة اليد السريرية الشائعة" },
    { topic: "hand", en: "prosthetic replacement in the hand and wrist", ar: "الاستبدال الصناعي في اليد والرسغ" },
    { topic: "hand", en: "excision arthroplasty in the hand and wrist", ar: "رأب المفصل بالاستئصال في اليد والرسغ" },
    { topic: "hand", en: "arthroscopy of the hand and wrist", ar: "تنظير مفصل اليد والرسغ" },
    { topic: "hand", en: "arthrodesis in hand and wrist", ar: "إيثاق المفصل في اليد والرسغ" },
    { topic: "hand", en: "biomechanics of tendon transfer techniques", ar: "الميكانيكا الحيوية لتقنيات نقل الأوتار" },
    { topic: "hand", en: "entrapment neuropathies", ar: "اعتلالات الأعصاب الانحباسية" },
    { topic: "hand", en: "the rheumatoid hand and wrist", ar: "اليد والرسغ الروماتويدية" },
    { topic: "hand", en: "the congenital hand", ar: "اليد الخلقية" },
    { topic: "hand", en: "rehabilitation of the hand and wrist", ar: "إعادة تأهيل اليد والرسغ" },
    { topic: "hand", en: "orthoses", ar: "الأجهزة التقويمية" },
    { topic: "hand", en: "use of splints", ar: "استخدام الجبائر" },
    { topic: "hand", en: "failed arthroplasty and soft tissue surgery", ar: "رأب المفصل الفاشل وجراحة الأنسجة الرخوة" },
    // ── 7. elbow ──
    { topic: "elbow", en: "anatomy of the elbow region and related structures", ar: "تشريح منطقة المرفق والبنى ذات الصلة" },
    { topic: "elbow", en: "surgical approaches to the elbow and arthroscopic access", ar: "المداخل الجراحية للمرفق والدخول بالمنظار" },
    { topic: "elbow", en: "physiology of nerve function around the elbow", ar: "فسيولوجيا وظيفة العصب حول المرفق" },
    { topic: "elbow", en: "compressive neurological problems around the elbow", ar: "المشاكل العصبية الانضغاطية حول المرفق" },
    { topic: "elbow", en: "instability around the elbow", ar: "عدم الثبات حول المرفق" },
    { topic: "elbow", en: "inflammatory, degenerative and infective conditions of the elbow", ar: "الحالات الالتهابية والتنكسية والعدوائية للمرفق" },
    { topic: "elbow", en: "causes of elbow stiffness", ar: "أسباب تيبّس المرفق" },
    { topic: "elbow", en: "acquired and developmental deformity around the elbow", ar: "التشوه المكتسب والتطوري حول المرفق" },
    { topic: "elbow", en: "the painful elbow", ar: "المرفق المؤلم" },
    { topic: "elbow", en: "biomechanics of the elbow", ar: "الميكانيكا الحيوية للمرفق" },
    { topic: "elbow", en: "biomechanics of elbow arthroplasty", ar: "الميكانيكا الحيوية لرأب مفصل المرفق" },
    { topic: "elbow", en: "radiological investigations to assess the elbow", ar: "الفحوص الشعاعية لتقييم المرفق" },
    { topic: "elbow", en: "diagnostic and guided injections", ar: "الحقن التشخيصي والموجَّه" },
    { topic: "elbow", en: "examination under anaesthetic and arthroscopy", ar: "الفحص تحت التخدير والتنظير المفصلي" },
    { topic: "elbow", en: "neurophysiology in elbow disorders", ar: "الفيزيولوجيا العصبية في اضطرابات المرفق" },
    { topic: "elbow", en: "history and examination of the elbow including special clinical tests", ar: "تاريخ وفحص المرفق بما في ذلك الاختبارات السريرية الخاصة" },
    { topic: "elbow", en: "arthroplasty of the elbow", ar: "رأب مفصل المرفق" },
    { topic: "elbow", en: "arthroscopy of the elbow", ar: "تنظير مفصل المرفق" },
    { topic: "elbow", en: "ligamentous instability", ar: "عدم الثبات الرباطي" },
    { topic: "elbow", en: "entrapment neuropathy", ar: "اعتلال العصب الانحباسي" },
    { topic: "elbow", en: "degenerative and inflammatory arthritis", ar: "التهاب المفاصل التنكسي والالتهابي" },
    { topic: "elbow", en: "soft tissue conditions", ar: "حالات الأنسجة الرخوة" },
    { topic: "elbow", en: "the rheumatoid elbow", ar: "المرفق الروماتويدي" },
    { topic: "elbow", en: "amputation", ar: "البتر" },
    { topic: "elbow", en: "rehabilitation of the elbow", ar: "إعادة تأهيل المرفق" },
    { topic: "elbow", en: "orthoses", ar: "الأجهزة التقويمية" },
    { topic: "elbow", en: "management of the failed arthroplasty and soft tissue surgery", ar: "تدبير رأب المفصل الفاشل وجراحة الأنسجة الرخوة" },
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
        AND lt."title" IN ('hip', 'spine', 'hand', 'elbow')
    `);
  }
}
