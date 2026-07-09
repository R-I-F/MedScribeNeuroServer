import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Backfills Arabic titles (`arTitle`) for the NS lecture curriculum — 10 lecture_topics + 152
 * lectures — which migration 189 left NULL (the production source has no Arabic). Medical Arabic
 * follows the reference-data style; per user convention **brain = مخ** (not دماغ). CNS =
 * الجهاز العصبي المركزي, cerebral = مخي, spine = العمود الفقري, nerve = عصب.
 *
 * Matched by (NS department, topic title, English lecture title) — unique across the 152 rows
 * (the two repeated numbers 3.6.5 / 2.3.1 carry distinct English titles). English `title` values
 * here must match the migration-189 stripped titles verbatim.
 */
export class BackfillNsLectureArTitles1750000000190 implements MigrationInterface {
  name = "BackfillNsLectureArTitles1750000000190";

  // [englishTopic, arabicTopic]
  private readonly TOPIC_AR: Array<[string, string]> = [
    ["adult hydrocephalus", "استسقاء الرأس عند البالغين"],
    ["cns tumors", "أورام الجهاز العصبي المركزي"],
    ["ethics & regulations", "الأخلاقيات واللوائح"],
    ["functional", "جراحة المخ الوظيفية"],
    ["infections", "عدوى الجهاز العصبي"],
    ["pediatrics", "جراحة المخ والأعصاب للأطفال"],
    ["peripheral nerves", "الأعصاب الطرفية"],
    ["spine", "العمود الفقري"],
    ["trauma & neurocritical care", "الإصابات والرعاية العصبية الحرجة"],
    ["vascular", "الأمراض الوعائية العصبية"],
  ];

  // [englishTopic, englishTitle, arabicTitle]
  private readonly LECTURE_AR: Array<[string, string, string]> = [
    ["adult hydrocephalus", "chiari malformations", "تشوهات كياري"],
    ["adult hydrocephalus", "clinical manifestations of bih", "المظاهر السريرية لفرط ضغط المخ الحميد (BIH)"],
    ["adult hydrocephalus", "clinical manifestations of nph", "المظاهر السريرية لاستسقاء الرأس سوي الضغط (NPH)"],
    ["adult hydrocephalus", "pathophysiology and management of bih, nph", "الفيزيولوجيا المرضية وعلاج فرط ضغط المخ الحميد واستسقاء الرأس سوي الضغط"],
    ["adult hydrocephalus", "new trends in management of bih, nph", "الاتجاهات الحديثة في علاج فرط ضغط المخ الحميد واستسقاء الرأس سوي الضغط"],
    ["adult hydrocephalus", "arachnoid cysts", "الأكياس العنكبوتية"],
    ["adult hydrocephalus", "dandy walker malformation", "تشوه داندي ووكر"],
    ["cns tumors", "cortical surface anatomy and craniometric points", "تشريح سطح القشرة المخية والنقاط القياسية للجمجمة"],
    ["cns tumors", "general management of gliomas", "التدبير العام للأورام الدبقية"],
    ["cns tumors", "new trends in glioma management", "الاتجاهات الحديثة في علاج الأورام الدبقية"],
    ["cns tumors", "anatomy of the pineal region, circumventricular organs", "تشريح المنطقة الصنوبرية والأعضاء المحيطة بالبطين"],
    ["cns tumors", "lesions of the pineal region", "آفات المنطقة الصنوبرية"],
    ["cns tumors", "surgical approaches to the pineal region", "المداخل الجراحية للمنطقة الصنوبرية"],
    ["cns tumors", "types and pathology of craniopharyngiomas", "أنواع وباثولوجيا الأورام القحفية البلعومية"],
    ["cns tumors", "management of craniopharyngioma", "علاج الورم القحفي البلعومي"],
    ["cns tumors", "new trends in craniopharyngioma", "الاتجاهات الحديثة في الورم القحفي البلعومي"],
    ["cns tumors", "clinical examination of cranial nerves", "الفحص السريري للأعصاب القحفية"],
    ["cns tumors", "types new classification and manifestations of pituitary adenomas", "الأنواع والتصنيف الحديث ومظاهر أورام الغدة النخامية"],
    ["cns tumors", "management of pituitary adenomas", "علاج أورام الغدة النخامية"],
    ["cns tumors", "new trends in management of pituitary adenomas", "الاتجاهات الحديثة في علاج أورام الغدة النخامية"],
    ["cns tumors", "anatomy of cranial nerves ( except 7,8)", "تشريح الأعصاب القحفية (عدا 7 و8)"],
    ["cns tumors", "types of genetic syndromes involving the cns", "أنواع المتلازمات الوراثية المؤثرة على الجهاز العصبي المركزي"],
    ["cns tumors", "normal basalis interna and externa anatomy, anatomy of the cranial fossas", "التشريح الطبيعي لقاعدة الجمجمة الداخلية والخارجية وتشريح الحفر القحفية"],
    ["cns tumors", "location and manifestations of skull base meningiomas", "مواضع ومظاهر الأورام السحائية بقاعدة الجمجمة"],
    ["cns tumors", "surgical approaches to the skull base: anterior cranial fossa", "المداخل الجراحية لقاعدة الجمجمة: الحفرة القحفية الأمامية"],
    ["cns tumors", "surgical approaches to the skull base", "المداخل الجراحية لقاعدة الجمجمة"],
    ["cns tumors", "new trends in management of skull base lesions", "الاتجاهات الحديثة في علاج آفات قاعدة الجمجمة"],
    ["cns tumors", "anatomy of the facial and vc nerves, anatomy of the cpa", "تشريح العصب الوجهي والعصب الدهليزي القوقعي وتشريح الزاوية الجسرية المخيخية"],
    ["cns tumors", "types and manifestations of cpa lesions", "أنواع ومظاهر آفات الزاوية الجسرية المخيخية"],
    ["cns tumors", "surgical approaches to the cpa", "المداخل الجراحية للزاوية الجسرية المخيخية"],
    ["cns tumors", "new trends in management of cpa lesions", "الاتجاهات الحديثة في علاج آفات الزاوية الجسرية المخيخية"],
    ["cns tumors", "radiological anatomy of the brain", "التشريح الإشعاعي للمخ"],
    ["cns tumors", "manifestations, pathology and management of cns lymphoma", "مظاهر وباثولوجيا وعلاج لمفوما الجهاز العصبي المركزي"],
    ["cns tumors", "decision making in management of cns metastasis", "اتخاذ القرار في علاج النقائل الورمية للجهاز العصبي المركزي"],
    ["cns tumors", "new trends in mets and lymphoma management", "الاتجاهات الحديثة في علاج النقائل واللمفوما"],
    ["cns tumors", "anatomy of the ventricles and surgical approaches", "تشريح البطينات والمداخل الجراحية"],
    ["cns tumors", "types and pathology of intraventricular tumors", "أنواع وباثولوجيا الأورام داخل البطينية"],
    ["cns tumors", "new trends in management of intraventricular tumors", "الاتجاهات الحديثة في علاج الأورام داخل البطينية"],
    ["cns tumors", "anatomy of the white matter", "تشريح المادة البيضاء"],
    ["cns tumors", "diagnosis and management of radiation necrosis", "تشخيص وعلاج النخر الإشعاعي"],
    ["cns tumors", "stereotactic radiosurgery and cyber knife", "الجراحة الإشعاعية التوضيعية والسايبر نايف"],
    ["ethics & regulations", "taking patients' history", "أخذ التاريخ المرضي للمرضى"],
    ["ethics & regulations", "how to take an informed consent in emergency and elective neurosurgical procedures", "كيفية أخذ الموافقة المستنيرة في العمليات العصبية الطارئة والاختيارية"],
    ["ethics & regulations", "rules of thumb in staff rounds", "القواعد الأساسية في المرور على المرضى"],
    ["ethics & regulations", "organizing m and m meetings", "تنظيم اجتماعات المراضة والوفيات (M&M)"],
    ["functional", "functional areas of the brain", "المناطق الوظيفية للمخ"],
    ["functional", "basics and principals of stereotactic surgery", "أساسيات ومبادئ الجراحة التوضيعية"],
    ["functional", "new trends in stereotactic surgeries", "الاتجاهات الحديثة في الجراحات التوضيعية"],
    ["functional", "classification of seizures, management of status epilepticus", "تصنيف النوبات وعلاج الحالة الصرعية"],
    ["functional", "seizure syndromes and anti-seizure medications", "متلازمات النوبات وأدوية مضادات الصرع"],
    ["functional", "indications, types and techniques of epilepsy surgery", "دواعي وأنواع وتقنيات جراحة الصرع"],
    ["functional", "new trends in epilepsy surgery", "الاتجاهات الحديثة في جراحة الصرع"],
    ["functional", "anatomy of the trigeminal and facial nerves", "تشريح العصب الثلاثي التوائم والعصب الوجهي"],
    ["functional", "management of trigeminal neuralgia, hemi-facial spasm", "علاج ألم العصب الثلاثي التوائم والتشنج نصف الوجهي"],
    ["functional", "technique of microvascular decompression surgeries", "تقنية جراحات إزالة الضغط الوعائي الدقيق"],
    ["functional", "new trends in management of neuro-vascular compression", "الاتجاهات الحديثة في علاج الانضغاط العصبي الوعائي"],
    ["functional", "mechanism and physiology of pain", "آلية وفسيولوجيا الألم"],
    ["functional", "medical management of pain and radiofrequency", "العلاج الدوائي للألم والتردد الحراري"],
    ["functional", "surgical pain procedures and spine injection techniques", "إجراءات الألم الجراحية وتقنيات حقن العمود الفقري"],
    ["functional", "new trends in pain management", "الاتجاهات الحديثة في علاج الألم"],
    ["infections", "meningitis and ventriculitis", "التهاب السحايا والتهاب البطينات"],
    ["infections", "brain abscess", "خراج المخ"],
    ["infections", "subdural empeyma", "الدبيلة تحت الجافية"],
    ["infections", "neurotuberculosis", "السل العصبي"],
    ["infections", "viral infections of the brain", "العدوى الفيروسية للمخ"],
    ["infections", "fungal infections of the cns", "العدوى الفطرية للجهاز العصبي المركزي"],
    ["infections", "amebic infectioons of the cns", "العدوى الأميبية للجهاز العصبي المركزي"],
    ["pediatrics", "anatomy of the ventricles", "تشريح البطينات"],
    ["pediatrics", "evaluation and management of hydrocephalus", "تقييم وعلاج استسقاء الرأس"],
    ["pediatrics", "endoscopic third ventriculostomy", "فغر البطين الثالث بالمنظار"],
    ["pediatrics", "new trends in management of hcp", "الاتجاهات الحديثة في علاج استسقاء الرأس"],
    ["pediatrics", "embryology of the cranium development", "علم الأجنة لتطور الجمجمة"],
    ["pediatrics", "evaluation and management of arachnoid cysts", "تقييم وعلاج الأكياس العنكبوتية"],
    ["pediatrics", "evaluation and management of craniosynostosis", "تقييم وعلاج تعظم الدروز الباكر"],
    ["pediatrics", "embryology of the spine and cranio-cervical junction", "علم الأجنة للعمود الفقري والوصل القحفي العنقي"],
    ["pediatrics", "management of spina bifida", "علاج السنسنة المشقوقة"],
    ["pediatrics", "lipomyeloschesis and tethered cord syndrome", "الشحمانية النخاعية ومتلازمة الحبل الشوكي المشدود"],
    ["pediatrics", "new trends in management of developmental spinal anomalies", "الاتجاهات الحديثة في علاج التشوهات النمائية للعمود الفقري"],
    ["pediatrics", "pathophysiology of syrinx", "الفيزيولوجيا المرضية للكهف النخاعي"],
    ["pediatrics", "types and diagnosis of chiari malformation", "أنواع وتشخيص تشوه كياري"],
    ["pediatrics", "surgical management of chiari malformation", "العلاج الجراحي لتشوه كياري"],
    ["peripheral nerves", "anatomy of the peripheral nerves (upper limb)", "تشريح الأعصاب الطرفية (الطرف العلوي)"],
    ["peripheral nerves", "anatomy of the peripheral nerve (lowerlimb)", "تشريح الأعصاب الطرفية (الطرف السفلي)"],
    ["peripheral nerves", "physiology of muscle innervation", "فسيولوجيا التعصيب العضلي"],
    ["peripheral nerves", "peripheral nerve injuries", "إصابات الأعصاب الطرفية"],
    ["peripheral nerves", "brachial plexus injury", "إصابة الضفيرة العضدية"],
    ["peripheral nerves", "nerve entrapment syndromes", "متلازمات انحباس الأعصاب"],
    ["spine", "anatomy of the spine and blood supply of the spinal cord", "تشريح العمود الفقري والإمداد الدموي للنخاع الشوكي"],
    ["spine", "history, examination and management of lumbar disc prolapse and cauda equina syndrome", "التاريخ المرضي والفحص وعلاج الانزلاق الغضروفي القطني ومتلازمة ذيل الفرس"],
    ["spine", "interbody fusion types and techniques", "أنواع وتقنيات الدمج بين الأجسام الفقرية"],
    ["spine", "new trends in management of degenerative lumbar disease", "الاتجاهات الحديثة في علاج الأمراض التنكسية القطنية"],
    ["spine", "internal structures of the spinal cord and tractography", "التراكيب الداخلية للنخاع الشوكي وتصوير المسالك العصبية"],
    ["spine", "evaluation and approaches and management of the thoracic disc", "تقييم ومداخل وعلاج الانزلاق الغضروفي الصدري"],
    ["spine", "anatomy of the cervical vertebrae and the cranio-cervical junction", "تشريح الفقرات العنقية والوصل القحفي العنقي"],
    ["spine", "myelopathy and evaluation of degenerative cervical disease", "اعتلال النخاع وتقييم الأمراض التنكسية العنقية"],
    ["spine", "approaches and techniques of cervical fusion surgeries", "مداخل وتقنيات جراحات الدمج العنقي"],
    ["spine", "introduction to minimally invasive spine surgeries", "مقدمة في جراحات العمود الفقري قليلة التوغل"],
    ["spine", "types of minimally invasive spine surgeries", "أنواع جراحات العمود الفقري قليلة التوغل"],
    ["spine", "techniques, tips and tricks of minimally invasive spine surgeries", "تقنيات ونصائح وحيل جراحات العمود الفقري قليلة التوغل"],
    ["spine", "new trends in minimally invasive spine surgeries", "الاتجاهات الحديثة في جراحات العمود الفقري قليلة التوغل"],
    ["spine", "anatomy and biomechanics of the spine", "تشريح والميكانيكا الحيوية للعمود الفقري"],
    ["spine", "spine measurements and angles", "قياسات وزوايا العمود الفقري"],
    ["spine", "surgical management of sagittal imbalance and degenerative scoliosis", "العلاج الجراحي لاختلال التوازن السهمي والجنف التنكسي"],
    ["spine", "new trends in sagittal balance and degenerative scoliosos", "الاتجاهات الحديثة في التوازن السهمي والجنف التنكسي"],
    ["spine", "embryology of the spine and cord", "علم الأجنة للعمود الفقري والنخاع الشوكي"],
    ["spine", "evaluation and diagnosis of ais", "تقييم وتشخيص الجنف مجهول السبب لدى المراهقين (AIS)"],
    ["spine", "decision making and management of ais", "اتخاذ القرار وعلاج الجنف مجهول السبب لدى المراهقين (AIS)"],
    ["spine", "new trends in idiopathic scoliosis", "الاتجاهات الحديثة في الجنف مجهول السبب"],
    ["spine", "sacral chordomas, management", "أورام الحبل الظهري العجزية والعلاج"],
    ["spine", "new trends in sacroilitis managment", "الاتجاهات الحديثة في علاج التهاب المفصل العجزي الحرقفي"],
    ["spine", "management of spine metastasis", "علاج النقائل الورمية للعمود الفقري"],
    ["spine", "paget's disease of the spine, rheumatoid arthritis and ankylosing spondylitis", "داء باجيت في العمود الفقري والتهاب المفاصل الروماتويدي والتهاب الفقار اللاصق"],
    ["spine", "new trends in special conditions affecting the spine", "الاتجاهات الحديثة في الحالات الخاصة المؤثرة على العمود الفقري"],
    ["trauma & neurocritical care", "management of extradural hematomas", "علاج النزف فوق الجافية"],
    ["trauma & neurocritical care", "compound depressed fractures", "الكسور المنخسفة المركبة"],
    ["trauma & neurocritical care", "acute and chronic subdural hematoma (including mma embolisation)", "النزف تحت الجافية الحاد والمزمن (بما في ذلك إصمام الشريان السحائي الأوسط)"],
    ["trauma & neurocritical care", "skull base repair in csf leak", "إصلاح قاعدة الجمجمة في تسرب السائل النخاعي"],
    ["trauma & neurocritical care", "levels of consciousness, glasgow coma scale", "مستويات الوعي ومقياس غلاسكو للغيبوبة"],
    ["trauma & neurocritical care", "measures to monitor and control intracranial pressure in comatosed patient", "إجراءات مراقبة والتحكم في الضغط داخل القحف لدى المريض الغائب عن الوعي"],
    ["trauma & neurocritical care", "herniation syndromes", "متلازمات الانفتاق المخي"],
    ["trauma & neurocritical care", "brain death criteria in adults and children", "معايير موت المخ في البالغين والأطفال"],
    ["trauma & neurocritical care", "sodium homeostasis and osmolality", "اتزان الصوديوم والأسمولالية"],
    ["trauma & neurocritical care", "atlantooccipital disclocation", "خلع المفصل الأطلسي القذالي"],
    ["trauma & neurocritical care", "occipital condyle fractures", "كسور اللقمة القذالية"],
    ["trauma & neurocritical care", "atlantoaxial subluxation", "الخلع الجزئي الأطلسي المحوري"],
    ["trauma & neurocritical care", "atlas 1 fractures", "كسور الفقرة الأطلسية (C1)"],
    ["trauma & neurocritical care", "axis c2 fractures", "كسور الفقرة المحورية (C2)"],
    ["trauma & neurocritical care", "combination of c1 and c2 fractures", "الكسور المجتمعة للفقرتين C1 وC2"],
    ["trauma & neurocritical care", "cervical fractures", "الكسور العنقية"],
    ["vascular", "anatomy of the vertebrobasilar system (part 1)", "تشريح الجهاز الفقري القاعدي (الجزء 1)"],
    ["vascular", "initial management of patient with sah", "العلاج الأولي لمريض النزف تحت العنكبوتية"],
    ["vascular", "sah grading and sequelae", "تصنيف النزف تحت العنكبوتية وعواقبه"],
    ["vascular", "diagnosis and management of cerebral vasospasm", "تشخيص وعلاج التشنج الوعائي المخي"],
    ["vascular", "new trends in management of sah", "الاتجاهات الحديثة في علاج النزف تحت العنكبوتية"],
    ["vascular", "anatomy of the carotid", "تشريح الشريان السباتي"],
    ["vascular", "types and approaches to intracranial aneurysms", "أنواع ومداخل تمددات الأوعية داخل القحف"],
    ["vascular", "management of giant aneurysms", "علاج التمددات الوعائية العملاقة"],
    ["vascular", "new trends in aneurysmal management", "الاتجاهات الحديثة في علاج التمددات الوعائية"],
    ["vascular", "anatomy of the aca, mca", "تشريح الشريان المخي الأمامي والشريان المخي الأوسط"],
    ["vascular", "grading and management of avm", "تصنيف وعلاج التشوه الشرياني الوريدي"],
    ["vascular", "management of cavernomas", "علاج الأورام الوعائية الكهفية"],
    ["vascular", "new trends in management of brain stem cavernomas", "الاتجاهات الحديثة في علاج الأورام الوعائية الكهفية بجذع المخ"],
    ["vascular", "anatomy of the venous system", "تشريح الجهاز الوريدي"],
    ["vascular", "moya moya disease", "داء مويا مويا"],
    ["vascular", "management of cerebral artery dissection", "علاج تسلخ الشريان المخي"],
    ["vascular", "new trends in bypass surgeries", "الاتجاهات الحديثة في جراحات المجازة الوعائية"],
    ["vascular", "anatomy of the vertebrobasilar system (part 2)", "تشريح الجهاز الفقري القاعدي (الجزء 2)"],
    ["vascular", "basic principles of 4 vessel angiography", "المبادئ الأساسية لتصوير الأوعية الأربعة"],
    ["vascular", "endovascular management of cns vascular lesion", "العلاج بالتدخل الوعائي لآفات أوعية الجهاز العصبي المركزي"],
    ["vascular", "new trends in endovascular management of intracranial aneurysms", "الاتجاهات الحديثة في العلاج بالتدخل الوعائي لتمددات الأوعية داخل القحف"],
    ["vascular", "managment of dural av fistulas", "علاج النواسير الشريانية الوريدية الجافوية"],
    ["vascular", "managment of spinal avm", "علاج التشوه الشرياني الوريدي النخاعي"],
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    // ── Topics ──────────────────────────────────────────────────────────────
    const topicRows = this.TOPIC_AR.map(([en, ar]) => `('${q(en)}', '${q(ar)}')`).join(",\n        ");
    await queryRunner.query(`
      UPDATE "lecture_topics" lt
      SET "arTitle" = v.ar, "updatedAt" = NOW()
      FROM (VALUES ${topicRows}) AS v(title, ar)
      JOIN "departments" d ON d."code" = 'NS'
      WHERE lt."departmentId" = d."id" AND lt."title" = v.title
    `);

    // ── Lectures (batched) ───────────────────────────────────────────────────
    const batchSize = 50;
    for (let i = 0; i < this.LECTURE_AR.length; i += batchSize) {
      const batch = this.LECTURE_AR.slice(i, i + batchSize);
      const rows = batch
        .map(([topic, en, ar]) => `('${q(topic)}', '${q(en)}', '${q(ar)}')`)
        .join(",\n          ");
      await queryRunner.query(`
        UPDATE "lectures" lx
        SET "arTitle" = v.ar, "updatedAt" = NOW()
        FROM (VALUES ${rows}) AS v(topic, en, ar)
        JOIN "departments" d ON d."code" = 'NS'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
        WHERE lx."topicId" = lt."id" AND lx."title" = v.en
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "lectures" lx SET "arTitle" = NULL
      FROM "lecture_topics" lt, "departments" d
      WHERE lx."topicId" = lt."id" AND lt."departmentId" = d."id" AND d."code" = 'NS'
    `);
    await queryRunner.query(`
      UPDATE "lecture_topics" lt SET "arTitle" = NULL
      FROM "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'NS'
    `);
  }
}
