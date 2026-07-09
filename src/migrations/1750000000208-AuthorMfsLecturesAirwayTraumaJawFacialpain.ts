import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * MFS (Maxillofacial Surgery) academic lectures — transcribed from the ISCP Oral and Maxillofacial
 * Surgery Curriculum (Aug 2021), Appendix 2 "Oral and Maxillofacial Surgery Syllabus". Reference
 * cited in MEDICAL_CODE_AUDITS/MFS/LECTURES_MFS.md.
 *
 * Part 1: all 12 ISCP OMFS syllabus MODULES (topics) + lectures for Airway, Craniofacial Trauma, Jaw Deformity, Facial Pain & TMJ.
 *
 * The syllabus's 12 clinical MODULES map to lecture_topics; each module's competence-graded
 * syllabus topic-lines map to lectures (numbered <topic>.1.<n>). The generic "Common Content Module"
 * (Core Surgical Training Phase-1 basic science, shared across all surgical specialties) is excluded
 * as non-OMFS-specific (documented in the audit file). Faithful transcription — nothing invented.
 * **`level` is NULL** on every row: the ISCP P2/P3/SI competence markers are training-phase tiers,
 * NOT the Egyptian MSc/MD construct, so level is left NULL (sourced later) not guessed. Bilingual.
 */
export class AuthorMfsLecturesAirwayTraumaJawFacialpain1750000000208 implements MigrationInterface {
  name = "AuthorMfsLecturesAirwayTraumaJawFacialpain1750000000208";

  // [englishTopic, arabicTopic] — 12 ISCP OMFS clinical modules, in document order
  private readonly TOPICS: Array<[string, string]> = [
    ["airway", "مجرى الهواء"],
    ["craniofacial trauma", "إصابات القحف والوجه"],
    ["jaw deformity", "تشوه الفكين"],
    ["facial pain and tmj", "ألم الوجه والمفصل الفكي الصدغي"],
    ["head and neck", "الرأس والرقبة"],
    ["conditions of the salivary glands", "حالات الغدد اللعابية"],
    ["conditions of the oral mucosa", "حالات الغشاء المخاطي للفم"],
    ["conditions of the skin", "حالات الجلد"],
    ["restoration of normal aesthetic form and function", "استعادة الشكل والوظيفة الجمالية الطبيعية"],
    ["cleft lip and palate", "الشفة الأرنبية وشق الحنك"],
    ["craniofacial", "القحف والوجه"],
    ["dentoalveolar", "السنخي السني"],
  ];

  // section 1 = KNOWLEDGE/CLINICAL. { topic, en, ar }
  private readonly LECTURES: Array<{ topic: string; en: string; ar: string }> = [
    // ── 1. airway ──
    { topic: "airway", en: "applied anatomy of airway, anterior neck", ar: "التشريح التطبيقي لمجرى الهواء والعنق الأمامي" },
    { topic: "airway", en: "applied anatomy of needle and surgical cricothyroidostomy", ar: "التشريح التطبيقي لفغر الغشاء الحلقي الدرقي بالإبرة والجراحي" },
    { topic: "airway", en: "applied anatomy of surgical tracheostomy (temporary or permanent)", ar: "التشريح التطبيقي لفغر الرغامى الجراحي (المؤقت أو الدائم)" },
    { topic: "airway", en: "applied anatomy of percutaneous tracheostomy", ar: "التشريح التطبيقي لفغر الرغامى عبر الجلد" },
    { topic: "airway", en: "anatomical abnormalities/alterations (craniofacial, paediatrics, trauma, cervico-fascial infection, obesity)", ar: "الشذوذات/التغيرات التشريحية (القحفية الوجهية، الأطفال، الإصابات، العدوى العنقية اللفافية، السمنة)" },
    { topic: "airway", en: "glasgow coma scale (relevance to need for definitive airway)", ar: "مقياس غلاسكو للغيبوبة (صلته بالحاجة لمجرى هواء نهائي)" },
    { topic: "airway", en: "asa classification; asa and/or atls difficult airway algorithm", ar: "تصنيف ASA؛ خوارزمية مجرى الهواء الصعب ASA و/أو ATLS" },
    { topic: "airway", en: "classification systems (e.g. mallampati, lemon, upper lip bite test),", ar: "أنظمة التصنيف (مثل مالامباتي، LEMON، اختبار عض الشفة العلوية)" },
    { topic: "airway", en: "criteria for decannulation", ar: "معايير إزالة القنية" },
    { topic: "airway", en: "congenital (e.g. craniofacial syndromes) and acquired diseases or conditions (e.g. obesity, infection, epiglottitis, previous surgery/radiotherapy) with potential to compromise/alter the airway", ar: "الأمراض أو الحالات الخلقية (مثل المتلازمات القحفية الوجهية) والمكتسبة (مثل السمنة والعدوى والتهاب لسان المزمار والجراحة/العلاج الإشعاعي السابق) القادرة على إضعاف/تغيير مجرى الهواء" },
    { topic: "airway", en: "physiology of speech and swallowing", ar: "فسيولوجيا الكلام والبلع" },
    { topic: "airway", en: "physiology of cough reflex", ar: "فسيولوجيا منعكس السعال" },
    { topic: "airway", en: "pulse oximetry and capnography", ar: "قياس التأكسج النبضي وقياس ثاني أكسيد الكربون" },
    { topic: "airway", en: "criteria for safe extubation (air leak test, imaging, examination)", ar: "معايير نزع الأنبوب الآمن (اختبار تسرب الهواء والتصوير والفحص)" },
    { topic: "airway", en: "ventilation (volume, pressure)", ar: "التهوية (الحجم والضغط)" },
    { topic: "airway", en: "airway adjuncts (e.g. guedel, nasopharyngeal, laryngeal mask)", ar: "ملحقات مجرى الهواء (مثل غيدل والبلعومي الأنفي والقناع الحنجري)" },
    { topic: "airway", en: "emergency cricothyroidostomy equipment", ar: "معدات فغر الغشاء الحلقي الدرقي الطارئ" },
    { topic: "airway", en: "tracheostomy kit", ar: "عدة فغر الرغامى" },
    { topic: "airway", en: "factors contributing to, and prediction of airway complications", ar: "العوامل المساهمة في مضاعفات مجرى الهواء والتنبؤ بها" },
    { topic: "airway", en: "management strategies for potential complications", ar: "استراتيجيات تدبير المضاعفات المحتملة" },
    { topic: "airway", en: "complications of emergency surgical airway airways", ar: "مضاعفات مجرى الهواء الجراحي الطارئ" },
    { topic: "airway", en: "cervico-fascial infection", ar: "العدوى العنقية اللفافية" },
    { topic: "airway", en: "trauma (supra- and sub-glottic; including burns)", ar: "الإصابات (فوق وتحت المزمار؛ بما في ذلك الحروق)" },
    { topic: "airway", en: "tumour", ar: "الورم" },
    { topic: "airway", en: "moral and medico-legal competence", ar: "الكفاءة الأخلاقية والطبية القانونية" },
    { topic: "airway", en: "clinical examination (e.g. thyro-mental distance, scars, cervical spine), supine patient with maxillofacial injuries", ar: "الفحص السريري (مثل المسافة الدرقية الذقنية والندبات والعمود الفقري العنقي) للمريض المستلقي المصاب بإصابات الوجه والفكين" },
    { topic: "airway", en: "recognition of need for airway intervention/definitive airway", ar: "التعرف على الحاجة للتدخل في مجرى الهواء / مجرى الهواء النهائي" },
    { topic: "airway", en: "recognition of need for ventilation", ar: "التعرف على الحاجة للتهوية" },
    { topic: "airway", en: "protecting airway during cervical spine collar placement", ar: "حماية مجرى الهواء أثناء وضع طوق العمود الفقري العنقي" },
    { topic: "airway", en: "principles, indications and interpretation of imaging modalities (e.g. ct, mri, soft tissue radiography)", ar: "مبادئ ودواعي وتفسير طرائق التصوير (مثل المقطعية والرنين وتصوير الأنسجة الرخوة)" },
    { topic: "airway", en: "endoscopy", ar: "التنظير الداخلي" },
    { topic: "airway", en: "management of shared airway with anaesthesia colleagues", ar: "تدبير مجرى الهواء المشترك مع زملاء التخدير" },
    { topic: "airway", en: "chin lift", ar: "رفع الذقن" },
    { topic: "airway", en: "insertion of airway adjuncts (e.g. oro-/naso-pharyngeal airway, lma)", ar: "إدخال ملحقات مجرى الهواء (مثل المجرى الفموي/الأنفي البلعومي والقناع الحنجري)" },
    { topic: "airway", en: "endotracheal intubation", ar: "التنبيب الرغامي" },
    { topic: "airway", en: "needle cricothyroidotomy", ar: "بضع الغشاء الحلقي الدرقي بالإبرة" },
    { topic: "airway", en: "tracheostomy changes", ar: "تغييرات فغر الرغامى" },
    { topic: "airway", en: "use of bougies", ar: "استخدام الموسّعات (البوجي)" },
    { topic: "airway", en: "percutaneous tracheostomy * (open surgical and percutaneous)", ar: "فغر الرغامى عبر الجلد * (الجراحي المفتوح وعبر الجلد)" },
    { topic: "airway", en: "tracheostomy", ar: "فغر الرغامى" },
    { topic: "airway", en: "submental intubation", ar: "التنبيب تحت الذقن" },
    // ── 2. craniofacial trauma ──
    { topic: "craniofacial trauma", en: "applied anatomy of the hard tissues of the head and neck", ar: "التشريح التطبيقي للأنسجة الصلبة للرأس والرقبة" },
    { topic: "craniofacial trauma", en: "applied anatomy of the soft tissues of the head and neck", ar: "التشريح التطبيقي للأنسجة الرخوة للرأس والرقبة" },
    { topic: "craniofacial trauma", en: "intra-oral approaches to the facial skeleton", ar: "المداخل داخل الفموية للهيكل الوجهي" },
    { topic: "craniofacial trauma", en: "extra-oral approaches to the facial skeleton", ar: "المداخل خارج الفموية للهيكل الوجهي" },
    { topic: "craniofacial trauma", en: "mechanism of facial fractures", ar: "آلية كسور الوجه" },
    { topic: "craniofacial trauma", en: "principles of wound healing", ar: "مبادئ التئام الجروح" },
    { topic: "craniofacial trauma", en: "principles of fracture healing", ar: "مبادئ التئام الكسور" },
    { topic: "craniofacial trauma", en: "principles of nerve healing", ar: "مبادئ التئام العصب" },
    { topic: "craniofacial trauma", en: "principles of shock", ar: "مبادئ الصدمة" },
    { topic: "craniofacial trauma", en: "metabolic and immunological response to trauma", ar: "الاستجابة الأيضية والمناعية للإصابة" },
    { topic: "craniofacial trauma", en: "principles of head injury", ar: "مبادئ إصابة الرأس" },
    { topic: "craniofacial trauma", en: "physiology of sight", ar: "فسيولوجيا الإبصار" },
    { topic: "craniofacial trauma", en: "physiology of the nasal cavity", ar: "فسيولوجيا التجويف الأنفي" },
    { topic: "craniofacial trauma", en: "physiology of the naso-lacrimal system", ar: "فسيولوجيا الجهاز الأنفي الدمعي" },
    { topic: "craniofacial trauma", en: "principles, indications and interpretation of imaging modalities", ar: "مبادئ ودواعي وتفسير طرائق التصوير" },
    { topic: "craniofacial trauma", en: "principles, indications and interpretation of electrophysiological investigations", ar: "مبادئ ودواعي وتفسير الفحوص الفيزيولوجية الكهربية" },
    { topic: "craniofacial trauma", en: "classification of facial fractures", ar: "تصنيف كسور الوجه" },
    { topic: "craniofacial trauma", en: "classification of soft tissue injuries", ar: "تصنيف إصابات الأنسجة الرخوة" },
    { topic: "craniofacial trauma", en: "classification of nerve injuries", ar: "تصنيف إصابات الأعصاب" },
    { topic: "craniofacial trauma", en: "classification of dento-alveolar injuries", ar: "تصنيف الإصابات السنخية السنية" },
    { topic: "craniofacial trauma", en: "pain and pain relief in the trauma patient", ar: "الألم وتسكينه لدى مريض الإصابات" },
    { topic: "craniofacial trauma", en: "psychological effects and management of the trauma patient", ar: "الآثار النفسية وتدبير مريض الإصابات" },
    { topic: "craniofacial trauma", en: "biomechanics of musculoskeletal tissues", ar: "الميكانيكا الحيوية للأنسجة العضلية الهيكلية" },
    { topic: "craniofacial trauma", en: "biomechanics of fracture fixation", ar: "الميكانيكا الحيوية لتثبيت الكسور" },
    { topic: "craniofacial trauma", en: "properties of biomaterials including plates, autografts, allografts, sutures", ar: "خصائص المواد الحيوية بما في ذلك الصفائح والطعوم الذاتية والطعوم الخيفية والخيوط الجراحية" },
    { topic: "craniofacial trauma", en: "factors contributing to and prediction of potential complications and risks", ar: "العوامل المساهمة في المضاعفات والمخاطر المحتملة والتنبؤ بها" },
    { topic: "craniofacial trauma", en: "management strategies for potential complications", ar: "استراتيجيات تدبير المضاعفات المحتملة" },
    { topic: "craniofacial trauma", en: "acute airway obstruction", ar: "انسداد مجرى الهواء الحاد" },
    { topic: "craniofacial trauma", en: "retro-bulbar haemorrhage", ar: "النزف خلف المقلة" },
    { topic: "craniofacial trauma", en: "life-threatening haemorrhage", ar: "النزف المهدد للحياة" },
    { topic: "craniofacial trauma", en: "moral and medico-legal competence", ar: "الكفاءة الأخلاقية والطبية القانونية" },
    { topic: "craniofacial trauma", en: "soft tissue injury", ar: "إصابة الأنسجة الرخوة" },
    { topic: "craniofacial trauma", en: "neurovascular injury", ar: "الإصابة العصبية الوعائية" },
    { topic: "craniofacial trauma", en: "dento-alveolar injury", ar: "الإصابة السنخية السنية" },
    { topic: "craniofacial trauma", en: "fractures of the cranio-facial skeleton", ar: "كسور الهيكل القحفي الوجهي" },
    { topic: "craniofacial trauma", en: "multiply-injured patient", ar: "المريض متعدد الإصابات" },
    { topic: "craniofacial trauma", en: "management of the airway", ar: "تدبير مجرى الهواء" },
    { topic: "craniofacial trauma", en: "infiltration and nerve blocks for local anaesthesia", ar: "التسريب وحصر الأعصاب للتخدير الموضعي" },
    { topic: "craniofacial trauma", en: "soft tissue wound repair *", ar: "إصلاح جرح الأنسجة الرخوة *" },
    { topic: "craniofacial trauma", en: "neurovascular tissue tissue repair", ar: "إصلاح النسيج العصبي الوعائي" },
    { topic: "craniofacial trauma", en: "naso-lacrimal system", ar: "الجهاز الأنفي الدمعي" },
    { topic: "craniofacial trauma", en: "parotid duct injury", ar: "إصابة القناة النكفية" },
    { topic: "craniofacial trauma", en: "dental injury and dento-alveolar fractures", ar: "الإصابة السنية والكسور السنخية السنية" },
    { topic: "craniofacial trauma", en: "techniques for removal of damaged teeth", ar: "تقنيات إزالة الأسنان التالفة" },
    { topic: "craniofacial trauma", en: "closed reduction and fixation of the facial skeleton (incl. intermaxillary fixation)", ar: "الرد المغلق وتثبيت الهيكل الوجهي (بما في ذلك التثبيت بين الفكين)" },
    { topic: "craniofacial trauma", en: "fractures of the mandible *", ar: "كسور الفك السفلي *" },
    { topic: "craniofacial trauma", en: "fractures of the zygoma *", ar: "كسور عظم الوجنة *" },
    { topic: "craniofacial trauma", en: "fractures of the orbital floor and walls *", ar: "كسور أرضية وجدران الحجاج *" },
    { topic: "craniofacial trauma", en: "fractures of the nasal bones", ar: "كسور عظام الأنف" },
    { topic: "craniofacial trauma", en: "fractures of the naso-orbital complex", ar: "كسور المركب الأنفي الحجاجي" },
    { topic: "craniofacial trauma", en: "management of le fort fractures *", ar: "تدبير كسور لوفور *" },
    { topic: "craniofacial trauma", en: "management of frontal bone fractures", ar: "تدبير كسور العظم الجبهي" },
    { topic: "craniofacial trauma", en: "management of pan-facial fractures", ar: "تدبير الكسور الوجهية الشاملة" },
    { topic: "craniofacial trauma", en: "lateral canthopexy", ar: "تثبيت الملتقى الجفني الجانبي" },
    { topic: "craniofacial trauma", en: "tracheostomy", ar: "فغر الرغامى" },
    { topic: "craniofacial trauma", en: "packing of the anterior and posterior nasal cavities", ar: "حشو التجويفين الأنفيين الأمامي والخلفي" },
    // ── 3. jaw deformity ──
    { topic: "jaw deformity", en: "applied anatomy of the hard tissues of the head and neck", ar: "التشريح التطبيقي للأنسجة الصلبة للرأس والرقبة" },
    { topic: "jaw deformity", en: "applied anatomy of the soft tissues of the head and neck", ar: "التشريح التطبيقي للأنسجة الرخوة للرأس والرقبة" },
    { topic: "jaw deformity", en: "intra-oral approaches to the facial skeleton", ar: "المداخل داخل الفموية للهيكل الوجهي" },
    { topic: "jaw deformity", en: "extra-oral approaches to the facial skeleton", ar: "المداخل خارج الفموية للهيكل الوجهي" },
    { topic: "jaw deformity", en: "abnormalities of condylar growth", ar: "شذوذات نمو اللقمة" },
    { topic: "jaw deformity", en: "mandibular asymmetry, hemi-mandibular hyperplasia / hypertrophy", ar: "لا تناظر الفك السفلي، فرط تنسج/ضخامة نصف الفك السفلي" },
    { topic: "jaw deformity", en: "aetiology of anterior open bite", ar: "مسببات العضة المفتوحة الأمامية" },
    { topic: "jaw deformity", en: "hemi-facial microsomia", ar: "صغر نصف الوجه" },
    { topic: "jaw deformity", en: "treacher-collins syndrome", ar: "متلازمة تريتشر-كولينز" },
    { topic: "jaw deformity", en: "craniofacial syndromes (aperts, crouzons) and their relationship to facial deformity", ar: "المتلازمات القحفية الوجهية (أبير، كروزون) وعلاقتها بتشوه الوجه" },
    { topic: "jaw deformity", en: "principles of bone healing", ar: "مبادئ التئام العظم" },
    { topic: "jaw deformity", en: "principles of distraction osteogenesis", ar: "مبادئ تكوين العظم بالإطالة (التشتيت)" },
    { topic: "jaw deformity", en: "classification of occlusal relationships", ar: "تصنيف العلاقات الإطباقية" },
    { topic: "jaw deformity", en: "vertical jaw relationships", ar: "العلاقات الرأسية للفك" },
    { topic: "jaw deformity", en: "transverse relationships", ar: "العلاقات المستعرضة" },
    { topic: "jaw deformity", en: "principles of occlusal compensation", ar: "مبادئ التعويض الإطباقي" },
    { topic: "jaw deformity", en: "principles of arch co-ordination and decompensation in treatment planning", ar: "مبادئ تنسيق القوس وفك التعويض في تخطيط العلاج" },
    { topic: "jaw deformity", en: "role of dental extractions including third molars in treatment planning", ar: "دور القلع السني بما في ذلك أضراس العقل في تخطيط العلاج" },
    { topic: "jaw deformity", en: "principles of orthodontic management of open bite in the orthognathic patient", ar: "مبادئ التدبير التقويمي للعضة المفتوحة لدى مريض تقويم الفكين" },
    { topic: "jaw deformity", en: "role of post-operative orthodontic management", ar: "دور التدبير التقويمي بعد الجراحة" },
    { topic: "jaw deformity", en: "options for non-surgical approach to management", ar: "خيارات المدخل غير الجراحي للتدبير" },
    { topic: "jaw deformity", en: "dentofacial norms including racial variations", ar: "المعايير السنية الوجهية بما في ذلك التباينات العرقية" },
    { topic: "jaw deformity", en: "cephalometric norms", ar: "المعايير القياسية القحفية" },
    { topic: "jaw deformity", en: "role of imaging modalities in diagnosis and treatment planning", ar: "دور طرائق التصوير في التشخيص وتخطيط العلاج" },
    { topic: "jaw deformity", en: "principles of treatment planning", ar: "مبادئ تخطيط العلاج" },
    { topic: "jaw deformity", en: "principles of model surgery, virtual planning systems and wafer construction", ar: "مبادئ جراحة النماذج وأنظمة التخطيط الافتراضي وبناء الجبيرة" },
    { topic: "jaw deformity", en: "role of patient specific implants in treatment planning", ar: "دور الغرسات الخاصة بالمريض في تخطيط العلاج" },
    { topic: "jaw deformity", en: "biomechanics of fixation", ar: "الميكانيكا الحيوية للتثبيت" },
    { topic: "jaw deformity", en: "properties of biomaterials including plates, autografts, allografts, sutures", ar: "خصائص المواد الحيوية بما في ذلك الصفائح والطعوم الذاتية والطعوم الخيفية والخيوط الجراحية" },
    { topic: "jaw deformity", en: "hierarchy of stability of orthognathic procedures", ar: "تسلسل ثبات إجراءات تقويم الفكين" },
    { topic: "jaw deformity", en: "principles of orthodontic and surgical relapse", ar: "مبادئ الانتكاس التقويمي والجراحي" },
    { topic: "jaw deformity", en: "risk factors predisposing to relapse", ar: "عوامل الخطر المهيئة للانتكاس" },
    { topic: "jaw deformity", en: "orthognathic principles as they apply to post-traumatic deformity", ar: "مبادئ تقويم الفكين كما تُطبَّق على التشوه بعد الإصابة" },
    { topic: "jaw deformity", en: "identification and assessment of soft tissue deformity", ar: "تحديد وتقييم تشوه الأنسجة الرخوة" },
    { topic: "jaw deformity", en: "assessment of mid-face and zygomatic deformity", ar: "تقييم تشوه منتصف الوجه والوجنة" },
    { topic: "jaw deformity", en: "identification and assessment of orbital dystopia/enophthalmos", ar: "تحديد وتقييم سوء موضع الحجاج / غؤور المقلة" },
    { topic: "jaw deformity", en: "management of scars", ar: "تدبير الندبات" },
    { topic: "jaw deformity", en: "factors contributing to and prediction of potential complications and risks", ar: "العوامل المساهمة في المضاعفات والمخاطر المحتملة والتنبؤ بها" },
    { topic: "jaw deformity", en: "management strategies for potential complications", ar: "استراتيجيات تدبير المضاعفات المحتملة" },
    { topic: "jaw deformity", en: "clinical assessment and diagnosis of facial/jaw deformity including psychosocial issues", ar: "التقييم السريري وتشخيص تشوه الوجه/الفك بما في ذلك القضايا النفسية الاجتماعية" },
    { topic: "jaw deformity", en: "clinical assessment and diagnosis of relevant psychosocial issues", ar: "التقييم السريري وتشخيص القضايا النفسية الاجتماعية ذات الصلة" },
    { topic: "jaw deformity", en: "assessment of dental and periodontal condition appropriate to orthognathic treatment", ar: "تقييم الحالة السنية واللثوية الملائمة لعلاج تقويم الفكين" },
    { topic: "jaw deformity", en: "undertaking of relevant dental and face bow records", ar: "إجراء السجلات السنية وقوس الوجه ذات الصلة" },
    { topic: "jaw deformity", en: "formulation of comprehensive, holistic treatment plan in the mdt setting", ar: "صياغة خطة علاج شاملة كلية ضمن إطار الفريق متعدد التخصصات" },
    { topic: "jaw deformity", en: "moral and medico-legal competence", ar: "الكفاءة الأخلاقية والطبية القانونية" },
    { topic: "jaw deformity", en: "procedure specific complications of surgical procedures", ar: "المضاعفات النوعية للإجراءات الجراحية" },
    { topic: "jaw deformity", en: "intra-oral approaches to maxilla & mandible", ar: "المداخل داخل الفموية للفك العلوي والسفلي" },
    { topic: "jaw deformity", en: "extra-oral approaches to mandible", ar: "المداخل خارج الفموية للفك السفلي" },
    { topic: "jaw deformity", en: "sub-mental approach to chin", ar: "المدخل تحت الذقن إلى الذقن" },
    { topic: "jaw deformity", en: "cutaneous approaches to mid-face", ar: "المداخل الجلدية إلى منتصف الوجه" },
    { topic: "jaw deformity", en: "coronal flap", ar: "الرفرف التاجي (الإكليلي)" },
    { topic: "jaw deformity", en: "le fort 1 *", ar: "لوفور 1 *" },
    { topic: "jaw deformity", en: "variants of le fort 1", ar: "متغيرات لوفور 1" },
    { topic: "jaw deformity", en: "le fort 1 with mid-line expansion", ar: "لوفور 1 مع التوسيع بالخط المتوسط" },
    { topic: "jaw deformity", en: "segmental le fort 1 osteotomy (anterior and lateral segments)", ar: "قطع عظم لوفور 1 القطعي (القطع الأمامية والجانبية)" },
    { topic: "jaw deformity", en: "le fort 2 osteotomy", ar: "قطع عظم لوفور 2" },
    { topic: "jaw deformity", en: "le fort 3 osteotomy", ar: "قطع عظم لوفور 3" },
    { topic: "jaw deformity", en: "surgically assisted rapid palatal expansion", ar: "التوسيع الحنكي السريع بمساعدة جراحية" },
    { topic: "jaw deformity", en: "sagittal split osteotomy of mandibular ramus *", ar: "قطع العظم الانشقاقي السهمي لفرع الفك السفلي *" },
    { topic: "jaw deformity", en: "vertical sub-sigmoid osteotomy intra-oral & extra-oral", ar: "قطع العظم الرأسي تحت السيني داخل وخارج الفم" },
    { topic: "jaw deformity", en: "inverted “l” osteotomy of mandible", ar: "قطع عظم الفك السفلي على شكل حرف L المقلوب" },
    { topic: "jaw deformity", en: "body osteotomy of mandible", ar: "قطع عظم جسم الفك السفلي" },
    { topic: "jaw deformity", en: "genioplasty", ar: "رأب الذقن" },
    { topic: "jaw deformity", en: "costo-chondral graft to mandible", ar: "الطعم الضلعي الغضروفي للفك السفلي" },
    { topic: "jaw deformity", en: "harvest of iliac crest bone", ar: "حصاد عظم العرف الحرقفي" },
    { topic: "jaw deformity", en: "harvest of costo-chondral graft", ar: "حصاد الطعم الضلعي الغضروفي" },
    { topic: "jaw deformity", en: "exteriorisation of the inferior dental nerve", ar: "تخريج العصب السني السفلي" },
    // ── 4. facial pain and tmj ──
    { topic: "facial pain and tmj", en: "neuroanatomy of orofacial sensation, secretomotor function & taste", ar: "التشريح العصبي للإحساس الفموي الوجهي والوظيفة الإفرازية الحركية والتذوق" },
    { topic: "facial pain and tmj", en: "applied anatomy of the craniofacial skeleton and soft tissues", ar: "التشريح التطبيقي للهيكل القحفي الوجهي والأنسجة الرخوة" },
    { topic: "facial pain and tmj", en: "applied anatomy of the oral cavity and mucosa", ar: "التشريح التطبيقي للتجويف الفموي والغشاء المخاطي" },
    { topic: "facial pain and tmj", en: "physiology of pain", ar: "فسيولوجيا الألم" },
    { topic: "facial pain and tmj", en: "physiology of the oral mucosa", ar: "فسيولوجيا الغشاء المخاطي للفم" },
    { topic: "facial pain and tmj", en: "physiology of the temporomandibular joint and associated structures", ar: "فسيولوجيا المفصل الفكي الصدغي والبنى المرتبطة به" },
    { topic: "facial pain and tmj", en: "dental pain", ar: "الألم السني" },
    { topic: "facial pain and tmj", en: "neuropathic pain conditions affecting the oro-facial region", ar: "حالات الألم العصبي المؤثرة على المنطقة الفموية الوجهية" },
    { topic: "facial pain and tmj", en: "headache types affecting the facial region", ar: "أنواع الصداع المؤثرة على المنطقة الوجهية" },
    { topic: "facial pain and tmj", en: "orofacial pain syndromes", ar: "متلازمات الألم الفموي الوجهي" },
    { topic: "facial pain and tmj", en: "disorders affecting the temporomandibular joint", ar: "الاضطرابات المؤثرة على المفصل الفكي الصدغي" },
    { topic: "facial pain and tmj", en: "vasculitis", ar: "التهاب الأوعية" },
    { topic: "facial pain and tmj", en: "principles, indications and interpretation of imaging modalities", ar: "مبادئ ودواعي وتفسير طرائق التصوير" },
    { topic: "facial pain and tmj", en: "principles, indications and interpretation of haematological investigations", ar: "مبادئ ودواعي وتفسير الفحوص الدموية" },
    { topic: "facial pain and tmj", en: "indications and risks of analgesia in the treatment of orofacial pain", ar: "دواعي ومخاطر التسكين في علاج الألم الفموي الوجهي" },
    { topic: "facial pain and tmj", en: "role and indications of medication in the treatment of orofacial pain", ar: "دور ودواعي الأدوية في علاج الألم الفموي الوجهي" },
    { topic: "facial pain and tmj", en: "drug interactions affecting orofacial sensation", ar: "التداخلات الدوائية المؤثرة على الإحساس الفموي الوجهي" },
    { topic: "facial pain and tmj", en: "indications for bite raising appliances", ar: "دواعي أجهزة رفع العضة" },
    { topic: "facial pain and tmj", en: "role and indications for physiotherapy", ar: "دور ودواعي العلاج الطبيعي" },
    { topic: "facial pain and tmj", en: "indications for total tmj replacement", ar: "دواعي الاستبدال الكلي للمفصل الفكي الصدغي" },
    { topic: "facial pain and tmj", en: "psychological effects influencing orofacial pain", ar: "الآثار النفسية المؤثرة على الألم الفموي الوجهي" },
    { topic: "facial pain and tmj", en: "role and indications for psychological input", ar: "دور ودواعي المدخلات النفسية" },
    { topic: "facial pain and tmj", en: "the role of other specialties and healthcare teams in management", ar: "دور التخصصات الأخرى وفرق الرعاية الصحية في التدبير" },
    { topic: "facial pain and tmj", en: "role of non-omfs procedures in pain management e.g. radiofrequency ablation", ar: "دور الإجراءات غير جراحة الوجه والفكين في تدبير الألم مثل الاجتثاث بالترددات الراديوية" },
    { topic: "facial pain and tmj", en: "comprehensive taking of pain history", ar: "الأخذ الشامل لتاريخ الألم" },
    { topic: "facial pain and tmj", en: "accurate diagnosis.", ar: "التشخيص الدقيق" },
    { topic: "facial pain and tmj", en: "counselling of patient with chronic pain", ar: "إرشاد المريض المصاب بألم مزمن" },
    { topic: "facial pain and tmj", en: "appropriate involvement of and referral to other disciplines.", ar: "الإشراك المناسب والإحالة إلى التخصصات الأخرى" },
    { topic: "facial pain and tmj", en: "ability to perform an appropriate head & neck, neurological and locomotor examination", ar: "القدرة على إجراء فحص مناسب للرأس والرقبة والعصبي والحركي" },
    { topic: "facial pain and tmj", en: "moral and medico-legal competence", ar: "الكفاءة الأخلاقية والطبية القانونية" },
    { topic: "facial pain and tmj", en: "temporal artery biopsy", ar: "خزعة الشريان الصدغي" },
    { topic: "facial pain and tmj", en: "injection of neurotoxin to muscles of mastication", ar: "حقن السم العصبي في عضلات المضغ" },
    { topic: "facial pain and tmj", en: "injection into joint", ar: "الحقن داخل المفصل" },
    { topic: "facial pain and tmj", en: "arthrocentesis of the temporomandibular joint*", ar: "بزل المفصل الفكي الصدغي *" },
    { topic: "facial pain and tmj", en: "arthroscopy of the temporomandibular joint", ar: "تنظير المفصل الفكي الصدغي" },
    { topic: "facial pain and tmj", en: "eminectomy", ar: "استئصال الحدبة المفصلية" },
    { topic: "facial pain and tmj", en: "condylar shave", ar: "تسوية اللقمة" },
    { topic: "facial pain and tmj", en: "discectomy", ar: "استئصال القرص" },
    { topic: "facial pain and tmj", en: "disc plication", ar: "طيّ القرص" },
    { topic: "facial pain and tmj", en: "total replacement of the temporomandibular joint", ar: "الاستبدال الكلي للمفصل الفكي الصدغي" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    const topicRows = this.TOPICS.map(([en, ar], i) => `('${q(en)}', '${q(ar)}', ${i})`).join(",\n        ");
    await queryRunner.query(`
      INSERT INTO "lecture_topics" ("departmentId", "title", "arTitle", "sortOrder")
      SELECT d."id", v.title, v.ar, v.ord
      FROM "departments" d
      CROSS JOIN (VALUES ${topicRows}) AS v(title, ar, ord)
      WHERE d."code" = 'MFS'
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
        JOIN "departments" d ON d."code" = 'MFS'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'MFS'
    `);
  }
}
