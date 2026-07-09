import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OBGYN (Obstetrics & Gynaecology) academic lectures — transcribed from the RCOG "MRCOG Syllabus and
 * Knowledge Requirements for Core Curriculum" (Royal College of Obstetricians and Gynaecologists),
 * the "Detailed Knowledge Requirements" of its 15 core Knowledge Areas. Reference cited in
 * MEDICAL_CODE_AUDITS/OBGYN/LECTURES_OBGYN.md.
 *
 * Part 1: all 13 MRCOG clinical Knowledge-Area TOPICS + lectures for Core Surgical Skills, Postoperative Care, Antenatal Care, Maternal Medicine, Management of Labour.
 *
 * lecture_topics = the MRCOG Knowledge Areas; lectures = their Detailed Knowledge Requirement topics
 * (numbered <topic>.1.<n>). The two generic professional Knowledge Areas (Clinical skills; Teaching
 * and research) are excluded as non-OBGYN-specific competency content (documented in the audit file).
 * Faithful transcription — nothing invented (repeated "understand the epidemiology … of" boilerplate
 * reduced to the condition name). **`level` is NULL** on every row: MRCOG uses Part 1/2/3 competence
 * levels, NOT the Egyptian MSc/MD construct, so level is left NULL (sourced later) not guessed. Bilingual.
 */
export class AuthorObgynLecturesSurgicalAntenatalMaternalLabour1750000000212 implements MigrationInterface {
  name = "AuthorObgynLecturesSurgicalAntenatalMaternalLabour1750000000212";

  // [englishTopic, arabicTopic] — 13 MRCOG clinical Knowledge Areas, in document order
  private readonly TOPICS: Array<[string, string]> = [
    ["core surgical skills", "المهارات الجراحية الأساسية"],
    ["postoperative care", "الرعاية بعد الجراحة"],
    ["antenatal care", "الرعاية قبل الولادة"],
    ["maternal medicine", "طب الأمومة"],
    ["management of labour", "تدبير المخاض"],
    ["management of delivery", "تدبير الولادة"],
    ["postpartum problems", "مشاكل ما بعد الولادة"],
    ["gynaecological problems", "المشاكل النسائية"],
    ["subfertility", "نقص الخصوبة"],
    ["sexual and reproductive health", "الصحة الجنسية والإنجابية"],
    ["early pregnancy care", "رعاية الحمل المبكر"],
    ["gynaecological oncology", "أورام النساء"],
    ["urogynaecology and pelvic floor problems", "طب المسالك البولية النسائية ومشاكل قاع الحوض"],
  ];

  // section 1 = KNOWLEDGE. { topic, en, ar }
  private readonly LECTURES: Array<{ topic: string; en: string; ar: string }> = [
    // ── 1. core surgical skills ──
    { topic: "core surgical skills", en: "legal issues around consent to surgical procedures, including consent of children, adults with incapacity and adults and children in emergency situations", ar: "القضايا القانونية المتعلقة بالموافقة على الإجراءات الجراحية بما في ذلك موافقة الأطفال والبالغين عديمي الأهلية والبالغين والأطفال في حالات الطوارئ" },
    { topic: "core surgical skills", en: "name and mode of use of common surgical instruments and sutures", ar: "اسم وطريقة استخدام الأدوات الجراحية والخيوط الشائعة" },
    { topic: "core surgical skills", en: "complications of surgery", ar: "مضاعفات الجراحة" },
    { topic: "core surgical skills", en: "regional anatomy and histology", ar: "التشريح الناحي والنسج" },
    { topic: "core surgical skills", en: "commonly encountered infections, including an understanding of the principles of infection control", ar: "العداوى الشائعة بما في ذلك فهم مبادئ مكافحة العدوى" },
    { topic: "core surgical skills", en: "knowledge of the nhs improvement programme enhanced recovery principles to enhance patient safety and optimise pre, intra and postoperative care", ar: "معرفة مبادئ التعافي المعزز لبرنامج تحسين الخدمة الصحية لتعزيز سلامة المريض وتحسين الرعاية قبل وأثناء وبعد الجراحة" },
    { topic: "core surgical skills", en: "principles of nutrition, water; electrolyte and acid base balance and cell biology", ar: "مبادئ التغذية والماء وتوازن الكهارل والحمض والقاعدة وبيولوجيا الخلية" },
    { topic: "core surgical skills", en: "appropriate use of blood and blood products", ar: "الاستخدام الملائم للدم ومشتقاته" },
    { topic: "core surgical skills", en: "general pathological principles", ar: "المبادئ الباثولوجية العامة" },
    { topic: "core surgical skills", en: "knowledge of the nhs improvement programme enhanced recovery principles to enhance patient safety and ensure", ar: "معرفة مبادئ التعافي المعزز لبرنامج تحسين الخدمة الصحية لتعزيز سلامة المريض" },
    { topic: "core surgical skills", en: "legal issues around consent to surgical procedures, including consent of minors (and fraser competency), adults with incapacity and adults and children in emergency situations", ar: "القضايا القانونية المتعلقة بالموافقة على الإجراءات الجراحية بما في ذلك موافقة القاصرين (وأهلية فريزر) والبالغين عديمي الأهلية والبالغين والأطفال في حالات الطوارئ" },
    { topic: "core surgical skills", en: "name and mode of use of common surgical instruments", ar: "اسم وطريقة استخدام الأدوات الجراحية الشائعة" },
    { topic: "core surgical skills", en: "knowledge of sutures and their appropriate use", ar: "معرفة الخيوط الجراحية واستخدامها الملائم" },
    { topic: "core surgical skills", en: "prevention and complications of surgery including", ar: "الوقاية من مضاعفات الجراحة وتدبيرها" },
    { topic: "core surgical skills", en: "venous thromboembolism", ar: "الانصمام الخثاري الوريدي" },
    { topic: "core surgical skills", en: "infection (wound, urinary tract, respiratory, intra-abdominal and pelvic)", ar: "العدوى (الجرح والمسالك البولية والتنفسية وداخل البطن والحوض)" },
    { topic: "core surgical skills", en: "primary and secondary haemorrhage (intraoperative and postoperative)", ar: "النزف الأولي والثانوي (أثناء وبعد الجراحة)" },
    { topic: "core surgical skills", en: "relevant clinical anatomy", ar: "التشريح السريري ذو الصلة" },
    { topic: "core surgical skills", en: "relevant bones, joints, muscles, blood vessels, lymphatics, nerve supply and histology", ar: "العظام والمفاصل والعضلات والأوعية الدموية واللمفاويات والتعصيب والنسج ذات الصلة" },
    { topic: "core surgical skills", en: "characteristics, recognition, prevention, eradication and pathological effects of all commonly encountered bacteria, viruses, rickettsia, fungi, protozoa, parasites and toxins, including an understanding of the principles of infection control", ar: "خصائص وتمييز والوقاية والقضاء والآثار المرضية لجميع الجراثيم والفيروسات والريكتسيا والفطريات والأوالي والطفيليات والسموم الشائعة بما في ذلك فهم مبادئ مكافحة العدوى" },
    { topic: "core surgical skills", en: "principles of nutrition, water, electrolyte and acid base balance and cell biology", ar: "مبادئ التغذية والماء والكهارل وتوازن الحمض والقاعدة وبيولوجيا الخلية" },
    { topic: "core surgical skills", en: "knowledge and awareness of anaesthesia", ar: "المعرفة والوعي بالتخدير" },
    { topic: "core surgical skills", en: "general pathological principles including general, tissue and cellular responses to trauma, infection, inflammation, therapeutic intervention (especially by the use of irradiation, cytotoxic drugs and hormones), disturbances in blood flow, loss of body fluids, hyperplasia and neoplasia", ar: "المبادئ الباثولوجية العامة بما في ذلك الاستجابات العامة والنسيجية والخلوية للإصابة والعدوى والالتهاب والتدخل العلاجي (خاصة باستخدام الإشعاع والأدوية السامة للخلايا والهرمونات) واضطرابات تدفق الدم وفقد سوائل الجسم وفرط التنسج والتورم" },
    { topic: "core surgical skills", en: "knowledge and awareness of use in complications of diathermy and other energy sources", ar: "المعرفة والوعي باستخدام ومضاعفات الإنفاذ الحراري ومصادر الطاقة الأخرى" },
    { topic: "core surgical skills", en: "relevant basic sciences", ar: "العلوم الأساسية ذات الصلة" },
    { topic: "core surgical skills", en: "knowledge of instruments and sutures", ar: "معرفة الأدوات والخيوط الجراحية" },
    // ── 2. postoperative care ──
    { topic: "postoperative care", en: "knowledge of the nhs improvement programme enhanced recovery principles to enhance patient safety and ensure patients experience optimal post-operative rehabilitation", ar: "معرفة مبادئ التعافي المعزز لبرنامج تحسين الخدمة الصحية لتعزيز سلامة المريض وضمان إعادة تأهيل مثلى بعد الجراحة" },
    { topic: "postoperative care", en: "general pathological principles of postoperative care", ar: "المبادئ الباثولوجية العامة للرعاية بعد الجراحة" },
    { topic: "postoperative care", en: "postoperative complications related to obstetric, gynaecological and non- gynaecological procedures", ar: "مضاعفات ما بعد الجراحة المتعلقة بالإجراءات التوليدية والنسائية وغير النسائية" },
    { topic: "postoperative care", en: "fluid/electrolyte balance", ar: "توازن السوائل والكهارل" },
    { topic: "postoperative care", en: "wound healing", ar: "التئام الجروح" },
    { topic: "postoperative care", en: "late postoperative complications, including secondary haemorrhage", ar: "المضاعفات المتأخرة بعد الجراحة بما في ذلك النزف الثانوي" },
    // ── 3. antenatal care ──
    { topic: "antenatal care", en: "recognition of signs of domestic violence", ar: "التعرف على علامات العنف المنزلي" },
    { topic: "antenatal care", en: "problems of teenage pregnancy", ar: "مشاكل حمل المراهقات" },
    { topic: "antenatal care", en: "awareness of drug and alcohol misuse", ar: "الوعي بإساءة استخدام المخدرات والكحول" },
    { topic: "antenatal care", en: "management of normal pregnancy, birth and puerperium", ar: "تدبير الحمل والولادة والنفاس الطبيعي" },
    { topic: "antenatal care", en: "placental abnormalities and diseases", ar: "شذوذات وأمراض المشيمة" },
    { topic: "antenatal care", en: "genetic modes of inheritance, common genetic conditions the importance of screening and the diagnosis thereof", ar: "أنماط الوراثة الجينية والحالات الوراثية الشائعة وأهمية المسح الكشفي وتشخيصها" },
    { topic: "antenatal care", en: "social and cultural factors", ar: "العوامل الاجتماعية والثقافية" },
    { topic: "antenatal care", en: "immunology and immunological disorders affecting pregnancy", ar: "المناعة والاضطرابات المناعية المؤثرة على الحمل" },
    { topic: "antenatal care", en: "preconception care", ar: "الرعاية قبل الحمل" },
    { topic: "antenatal care", en: "purposes and practice of antenatal care", ar: "أغراض وممارسة الرعاية قبل الولادة" },
    { topic: "antenatal care", en: "immunology", ar: "المناعة" },
    { topic: "antenatal care", en: "preterm premature rupture of membranes", ar: "التمزق الباكر المبكر للأغشية" },
    { topic: "antenatal care", en: "haemorrhage", ar: "النزف" },
    { topic: "antenatal care", en: "physiology and management of normal", ar: "فسيولوجيا وتدبير الحمل الطبيعي" },
    { topic: "antenatal care", en: "placental", ar: "المشيمة" },
    { topic: "antenatal care", en: "multiple pregnancy", ar: "الحمل المتعدد" },
    { topic: "antenatal care", en: "malpresentation", ar: "سوء المجيء" },
    { topic: "antenatal care", en: "fetal growth restriction", ar: "تقييد نمو الجنين" },
    { topic: "antenatal care", en: "hypotensive disorders", ar: "اضطرابات انخفاض ضغط الدم" },
    { topic: "antenatal care", en: "genetic", ar: "الوراثة" },
    { topic: "antenatal care", en: "pregnancy induced hypertension", ar: "ارتفاع ضغط الدم المحرَّض بالحمل" },
    { topic: "antenatal care", en: "fetal haemolysis", ar: "انحلال الدم الجنيني" },
    { topic: "antenatal care", en: "prolonged pregnancy", ar: "الحمل المطوّل" },
    { topic: "antenatal care", en: "congenital malformation", ar: "التشوه الخلقي" },
    { topic: "antenatal care", en: "specific abnormalities", ar: "الشذوذات النوعية" },
    { topic: "antenatal care", en: "invasive procedures", ar: "الإجراءات الباضعة" },
    // ── 4. maternal medicine ──
    { topic: "maternal medicine", en: "hypertension", ar: "ارتفاع ضغط الدم" },
    { topic: "maternal medicine", en: "kidney disease", ar: "أمراض الكلى" },
    { topic: "maternal medicine", en: "heart disease", ar: "أمراض القلب" },
    { topic: "maternal medicine", en: "liver disease", ar: "أمراض الكبد" },
    { topic: "maternal medicine", en: "circulatory disorders", ar: "اضطرابات الدورة الدموية" },
    { topic: "maternal medicine", en: "pulmonary diseases", ar: "الأمراض الرئوية" },
    { topic: "maternal medicine", en: "neurological disorders", ar: "الاضطرابات العصبية" },
    { topic: "maternal medicine", en: "bone and joint disorders", ar: "اضطرابات العظام والمفاصل" },
    { topic: "maternal medicine", en: "psychiatric disorders", ar: "الاضطرابات النفسية" },
    { topic: "maternal medicine", en: "haemoglobinopathies", ar: "اعتلالات الهيموغلوبين" },
    { topic: "maternal medicine", en: "connective tissue diseases", ar: "أمراض النسيج الضام" },
    { topic: "maternal medicine", en: "disorders of carbohydrate metabolism", ar: "اضطرابات استقلاب الكربوهيدرات" },
    { topic: "maternal medicine", en: "gastrointestinal disorders", ar: "الاضطرابات الهضمية" },
    { topic: "maternal medicine", en: "neoplasia", ar: "الأورام" },
    { topic: "maternal medicine", en: "endocrinopathies", ar: "اعتلالات الغدد الصماء" },
    { topic: "maternal medicine", en: "infectious diseases", ar: "الأمراض العدوائية" },
    { topic: "maternal medicine", en: "maternal complications due to pregnancy", ar: "المضاعفات الأمومية الناجمة عن الحمل" },
    { topic: "maternal medicine", en: "sheehan’s syndrome", ar: "متلازمة شيهان" },
    // ── 5. management of labour ──
    { topic: "management of labour", en: "mechanisms of normal labour and delivery", ar: "آليات المخاض والولادة الطبيعية" },
    { topic: "management of labour", en: "induction and augmentation of labour", ar: "تحريض المخاض وتعزيزه" },
    { topic: "management of labour", en: "drugs acting upon the myometrium", ar: "الأدوية المؤثرة على عضلة الرحم" },
    { topic: "management of labour", en: "fluid balance in labour", ar: "توازن السوائل أثناء المخاض" },
    { topic: "management of labour", en: "blood products", ar: "مشتقات الدم" },
    { topic: "management of labour", en: "regional anaesthesia, analgesia and sedation", ar: "التخدير الناحي والتسكين والتهدئة" },
    { topic: "management of labour", en: "fetal wellbeing and compromise", ar: "سلامة الجنين واختلالها" },
    { topic: "management of labour", en: "prolonged labour", ar: "المخاض المطوّل" },
    { topic: "management of labour", en: "emergency policies/maternal collapse/haemorrhage", ar: "سياسات الطوارئ / الانهيار الأمومي / النزف" },
    { topic: "management of labour", en: "pre-term labour/ premature rupture of membranes", ar: "المخاض المبكر / التمزق المبكر للأغشية" },
    { topic: "management of labour", en: "cervical cerclage", ar: "تطويق عنق الرحم" },
    { topic: "management of labour", en: "multiple pregnancy in labour", ar: "الحمل المتعدد أثناء المخاض" },
    { topic: "management of labour", en: "severe pre-eclampsia and eclampsia", ar: "ما قبل الارتعاج الشديد والارتعاج" },
    { topic: "management of labour", en: "in-utero fetal death (iufd), including legal issues", ar: "موت الجنين داخل الرحم بما في ذلك القضايا القانونية" },
    { topic: "management of labour", en: "acute abdominal pain", ar: "الألم البطني الحاد" },
    { topic: "management of labour", en: "mechanisms of normal and abnormal labour", ar: "آليات المخاض الطبيعي وغير الطبيعي" },
    { topic: "management of labour", en: "mechanism of spontaneous vaginal delivery", ar: "آلية الولادة المهبلية التلقائية" },
    { topic: "management of labour", en: "methods of induction of labour; indications, contraindications and complications", ar: "طرق تحريض المخاض؛ الدواعي وموانع الاستخدام والمضاعفات" },
    { topic: "management of labour", en: "methods of augmentation of labour; indications, contra-indications and complications", ar: "طرق تعزيز المخاض؛ الدواعي وموانع الاستخدام والمضاعفات" },
    { topic: "management of labour", en: "drugs acting upon the myometrium and cervix", ar: "الأدوية المؤثرة على عضلة الرحم وعنق الرحم" },
    { topic: "management of labour", en: "transfusion", ar: "نقل الدم" },
    { topic: "management of labour", en: "types and methods of action of regional anaesthesia including epidural (lumbar, caudal), spinal, pudendal nerve block; indications and contra-indications", ar: "أنواع وآليات عمل التخدير الناحي بما في ذلك فوق الجافية (القطني والعجزي) والنخاعي وحصر العصب الفرجي؛ الدواعي وموانع الاستخدام" },
    { topic: "management of labour", en: "types and methods of action of analgesia and sedation including narcotics, hypnotics, psychotropics, non-steroidal anti-inflammatory drugs; indications, contra- indications", ar: "أنواع وآليات عمل التسكين والتهدئة بما في ذلك المخدرات والمنومات والمؤثرات النفسية ومضادات الالتهاب غير الستيرويدية؛ الدواعي وموانع الاستخدام" },
    { topic: "management of labour", en: "complications of anaesthesia and analgesia including cardiac arrest, respiratory arrest, aspiration, drug reactions", ar: "مضاعفات التخدير والتسكين بما في ذلك توقف القلب وتوقف التنفس والاستنشاق وردود الفعل الدوائية" },
    { topic: "management of labour", en: "assessment of fetal wellbeing using fetal heart rate monitoring, acid/base balance, and fetal scalp blood sampling", ar: "تقييم سلامة الجنين باستخدام مراقبة معدل ضربات قلب الجنين وتوازن الحمض/القاعدة وأخذ عينة دم من فروة الجنين" },
    { topic: "management of labour", en: "causes and management of fetal compromise including cord prolapse and intra- uterine fetal death", ar: "أسباب وتدبير اختلال سلامة الجنين بما في ذلك تدلي الحبل السري وموت الجنين داخل الرحم" },
    { topic: "management of labour", en: "iufd – legalities regarding registration and disposal of fetal tissue", ar: "موت الجنين داخل الرحم – الجوانب القانونية المتعلقة بتسجيل النسيج الجنيني والتخلص منه" },
    { topic: "management of labour", en: "causes and management of prolonged labour", ar: "أسباب وتدبير المخاض المطوّل" },
    { topic: "management of labour", en: "causes and management of maternal collapse including massive haemorrhage, cardiac problems, pulmonary and amniotic embolism, drug reactions, trauma", ar: "أسباب وتدبير الانهيار الأمومي بما في ذلك النزف الجسيم والمشاكل القلبية والانصمام الرئوي والسلوي وردود الفعل الدوائية والإصابة" },
    { topic: "management of labour", en: "emergency guidelines and procedures", ar: "إرشادات وإجراءات الطوارئ" },
    { topic: "management of labour", en: "ante andintra partum haemorrhage including, placenta praevia, vasa praevia, ruptured uterus, coagulation defects, iatrogenic causes", ar: "النزف قبل وأثناء الولادة بما في ذلك المشيمة المنزاحة والأوعية المنزاحة وتمزق الرحم وعيوب التخثر والأسباب علاجية المنشأ" },
    { topic: "management of labour", en: "causes, mechanisms of action and complications of pre-term labour/ premature rupture of membranes including fetal pulmonary maturity, infection risks", ar: "أسباب وآليات ومضاعفات المخاض المبكر / التمزق المبكر للأغشية بما في ذلك نضج رئة الجنين ومخاطر العدوى" },
    { topic: "management of labour", en: "preterm labour including therapy (antibiotics, steroids, tocolysis), consultation with neonatologists, in-utero transfer, methods of delivery (induction of labour, timing, mode), outcomes, risks", ar: "المخاض المبكر بما في ذلك العلاج (المضادات الحيوية والستيرويدات وحال المخاض) واستشارة أطباء حديثي الولادة والنقل داخل الرحم وطرق الولادة (التحريض والتوقيت والنمط) والنتائج والمخاطر" },
    { topic: "management of labour", en: "role and types of cervical cerclage", ar: "دور وأنواع تطويق عنق الرحم" },
    { topic: "management of labour", en: "placental abruption", ar: "انفصال المشيمة الباكر" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    const topicRows = this.TOPICS.map(([en, ar], i) => `('${q(en)}', '${q(ar)}', ${i})`).join(",\n        ");
    await queryRunner.query(`
      INSERT INTO "lecture_topics" ("departmentId", "title", "arTitle", "sortOrder")
      SELECT d."id", v.title, v.ar, v.ord
      FROM "departments" d
      CROSS JOIN (VALUES ${topicRows}) AS v(title, ar, ord)
      WHERE d."code" = 'OBGYN'
    `);
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
        JOIN "departments" d ON d."code" = 'OBGYN'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'OBGYN'
    `);
  }
}
