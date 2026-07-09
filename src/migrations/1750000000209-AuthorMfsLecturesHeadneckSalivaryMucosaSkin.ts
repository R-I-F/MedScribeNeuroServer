import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * MFS (Maxillofacial Surgery) academic lectures — transcribed from the ISCP Oral and Maxillofacial
 * Surgery Curriculum (Aug 2021), Appendix 2 "Oral and Maxillofacial Surgery Syllabus". Reference
 * cited in MEDICAL_CODE_AUDITS/MFS/LECTURES_MFS.md.
 *
 * Part 2: Head & Neck, Salivary Glands, Oral Mucosa, Skin lectures. Topics created in migration 208.
 *
 * The syllabus's 12 clinical MODULES map to lecture_topics; each module's competence-graded
 * syllabus topic-lines map to lectures (numbered <topic>.1.<n>). The generic "Common Content Module"
 * (Core Surgical Training Phase-1 basic science, shared across all surgical specialties) is excluded
 * as non-OMFS-specific (documented in the audit file). Faithful transcription — nothing invented.
 * **`level` is NULL** on every row: the ISCP P2/P3/SI competence markers are training-phase tiers,
 * NOT the Egyptian MSc/MD construct, so level is left NULL (sourced later) not guessed. Bilingual.
 */
export class AuthorMfsLecturesHeadneckSalivaryMucosaSkin1750000000209 implements MigrationInterface {
  name = "AuthorMfsLecturesHeadneckSalivaryMucosaSkin1750000000209";

  // topic → its index in the 12-topic list (for numbering <idx>.1.<n>)
  private readonly TOPIC_INDEX: Record<string, number> = {
    "head and neck": 5,
    "conditions of the salivary glands": 6,
    "conditions of the oral mucosa": 7,
    "conditions of the skin": 8,
  };

  // section 1 = KNOWLEDGE/CLINICAL. { topic, en, ar }
  private readonly LECTURES: Array<{ topic: string; en: string; ar: string }> = [
    // ── 5. head and neck ──
    { topic: "head and neck", en: "applied surgical anatomy of the hard & soft tissues of the head and neck", ar: "التشريح الجراحي التطبيقي للأنسجة الصلبة والرخوة للرأس والرقبة" },
    { topic: "head and neck", en: "surgical access approaches to the oropharynx, facial skeleton and skull base", ar: "مداخل الوصول الجراحي إلى البلعوم الفموي والهيكل الوجهي وقاعدة الجمجمة" },
    { topic: "head and neck", en: "pathology and classification of benign tumours of the head and neck", ar: "باثولوجيا وتصنيف الأورام الحميدة للرأس والرقبة" },
    { topic: "head and neck", en: "molecular pathology of h&n cancer", ar: "الباثولوجيا الجزيئية لسرطان الرأس والرقبة" },
    { topic: "head and neck", en: "aetiology and risk factors for h&n cancer", ar: "مسببات وعوامل خطر سرطان الرأس والرقبة" },
    { topic: "head and neck", en: "staging for h&n cancer (relevant subsites & tumour types)", ar: "تدريج سرطان الرأس والرقبة (المواقع الفرعية وأنواع الأورام ذات الصلة)" },
    { topic: "head and neck", en: "prognostic features in h&n cancer", ar: "الملامح الإنذارية في سرطان الرأس والرقبة" },
    { topic: "head and neck", en: "systemic effects of malignancy", ar: "الآثار الجهازية للورم الخبيث" },
    { topic: "head and neck", en: "role and relevance of immune system in cancer (and its management)", ar: "دور وأهمية الجهاز المناعي في السرطان (وتدبيره)" },
    { topic: "head and neck", en: "pathological techniques and relevance to diagnostic process", ar: "التقنيات الباثولوجية وصلتها بعملية التشخيص" },
    { topic: "head and neck", en: "classification of thyroid tumours", ar: "تصنيف أورام الغدة الدرقية" },
    { topic: "head and neck", en: "pathology of thyroid and parathyroid tumours", ar: "باثولوجيا أورام الغدة الدرقية وجارة الدرقية" },
    { topic: "head and neck", en: "role of ultrasound and fnac in diagnosis of thyroid tumours", ar: "دور الموجات فوق الصوتية والشفط بالإبرة الدقيقة في تشخيص أورام الغدة الدرقية" },
    { topic: "head and neck", en: "staging of thyroid cancers", ar: "تدريج سرطانات الغدة الدرقية" },
    { topic: "head and neck", en: "physiology of speech and swallowing", ar: "فسيولوجيا الكلام والبلع" },
    { topic: "head and neck", en: "physiology of healing tissues (hard & soft tissues)", ar: "فسيولوجيا الأنسجة الملتئمة (الأنسجة الصلبة والرخوة)" },
    { topic: "head and neck", en: "physiology of thyroid and parathyroid glands", ar: "فسيولوجيا الغدة الدرقية وجارة الدرقية" },
    { topic: "head and neck", en: "principles, indications and interpretation of imaging modalities", ar: "مبادئ ودواعي وتفسير طرائق التصوير" },
    { topic: "head and neck", en: "principles, indications and interpretation of surgical-adjunctive imaging (inc ultrasound, sentinel lymph node biopsy/scintigraphy)", ar: "مبادئ ودواعي وتفسير التصوير الجراحي المساعد (بما في ذلك الموجات فوق الصوتية وخزعة/ومضان العقدة الليمفاوية الخافرة)" },
    { topic: "head and neck", en: "classification of midfacial/maxillary defect", ar: "تصنيف عيب منتصف الوجه/الفك العلوي" },
    { topic: "head and neck", en: "classification of mandibular defect", ar: "تصنيف عيب الفك السفلي" },
    { topic: "head and neck", en: "classification of osteoradionecrosis", ar: "تصنيف النخر العظمي الإشعاعي" },
    { topic: "head and neck", en: "psychological effects and management of the oncology patient", ar: "الآثار النفسية وتدبير مريض الأورام" },
    { topic: "head and neck", en: "properties of biomaterials including plates, autografts, allografts, sutures", ar: "خصائص المواد الحيوية بما في ذلك الصفائح والطعوم الذاتية والطعوم الخيفية والخيوط الجراحية" },
    { topic: "head and neck", en: "osseointegration", ar: "الاندماج العظمي" },
    { topic: "head and neck", en: "pre-treatment assessment of risk", ar: "تقييم الخطر قبل العلاج" },
    { topic: "head and neck", en: "mitigation of risk in oncology patient", ar: "تخفيف الخطر لدى مريض الأورام" },
    { topic: "head and neck", en: "acute airway obstruction", ar: "انسداد مجرى الهواء الحاد" },
    { topic: "head and neck", en: "life-threatening haemorrhage", ar: "النزف المهدد للحياة" },
    { topic: "head and neck", en: "malignancy of the head and neck (diagnosis and appropriate initial management)", ar: "الورم الخبيث للرأس والرقبة (التشخيص والتدبير الأولي المناسب)" },
    { topic: "head and neck", en: "surgical armamentarium (incl. laser, diathermy, harmonic scalpel, etc.)", ar: "العتاد الجراحي (بما في ذلك الليزر والإنفاذ الحراري والمشرط التوافقي وغيرها)" },
    { topic: "head and neck", en: "critical equipment (operative microscope & instruments, microvascular adjuncts; coupler, doppler – handheld and implantable etc.)", ar: "المعدات الحرجة (المجهر الجراحي والأدوات، ملحقات الأوعية الدقيقة؛ الموصّل والدوبلر – المحمول والقابل للزرع وغيرها)" },
    { topic: "head and neck", en: "reconstructive adjuncts in planning & surgical treatment (customisation, preplanned reconstruction)", ar: "الملحقات الترميمية في التخطيط والعلاج الجراحي (التخصيص وإعادة البناء المخطط مسبقًا)" },
    { topic: "head and neck", en: "pharmaceutical aids in microvascular reconstruction", ar: "المساعدات الدوائية في إعادة البناء بالأوعية الدقيقة" },
    { topic: "head and neck", en: "physiology, biology and risks of radiotherapy, chemotherapy and immune therapies including principles of planning, implementation and complications.", ar: "فسيولوجيا وبيولوجيا ومخاطر العلاج الإشعاعي والكيميائي والمناعي بما في ذلك مبادئ التخطيط والتنفيذ والمضاعفات" },
    { topic: "head and neck", en: "role of allied health professionals in multidisciplinary care of oncology patient", ar: "دور المهنيين الصحيين المساعدين في الرعاية متعددة التخصصات لمريض الأورام" },
    { topic: "head and neck", en: "tumours confined to soft tissues of h&n", ar: "الأورام المحصورة في الأنسجة الرخوة للرأس والرقبة" },
    { topic: "head and neck", en: "tumours involving facial skeleton/mandible", ar: "الأورام المصيبة للهيكل الوجهي/الفك السفلي" },
    { topic: "head and neck", en: "salivary tumours", ar: "الأورام اللعابية" },
    { topic: "head and neck", en: "management of the airway in h&n oncology patients", ar: "تدبير مجرى الهواء لدى مرضى أورام الرأس والرقبة" },
    { topic: "head and neck", en: "moral, ethical and medico-legal competence", ar: "الكفاءة الأخلاقية والأدبية والطبية القانونية" },
    { topic: "head and neck", en: "examination under anaesthesia & pan-endoscopy of upper aerodigestive tract", ar: "الفحص تحت التخدير والتنظير الشامل للسبيل الهوائي الهضمي العلوي" },
    { topic: "head and neck", en: "tracheostomy*", ar: "فغر الرغامى *" },
    { topic: "head and neck", en: "neck dissection*", ar: "تشريح العنق *" },
    { topic: "head and neck", en: "cervical lymph node biopsy*", ar: "خزعة العقدة الليمفاوية العنقية *" },
    { topic: "head and neck", en: "submandibular &/or sublingual gland removal*", ar: "إزالة الغدة تحت الفك و/أو تحت اللسان *" },
    { topic: "head and neck", en: "parotidectomy, partial parotidectomy and extracapsular dissection*", ar: "استئصال النكفة والاستئصال الجزئي للنكفة والتشريح خارج المحفظة *" },
    { topic: "head and neck", en: "surgical access to the oropharynx, facial skeleton and skull base", ar: "الوصول الجراحي إلى البلعوم الفموي والهيكل الوجهي وقاعدة الجمجمة" },
    { topic: "head and neck", en: "intraoral resection of soft tissue-based malignancy*", ar: "الاستئصال داخل الفموي للورم الخبيث في الأنسجة الرخوة *" },
    { topic: "head and neck", en: "mandibular rim resection*", ar: "استئصال حافة الفك السفلي *" },
    { topic: "head and neck", en: "segmental mandibulectomy*", ar: "استئصال الفك السفلي القطعي *" },
    { topic: "head and neck", en: "maxillectomy/extended maxillectomy*", ar: "استئصال الفك العلوي / الاستئصال الموسع للفك العلوي *" },
    { topic: "head and neck", en: "local flap reconstruction", ar: "إعادة البناء بالرفرف الموضعي" },
    { topic: "head and neck", en: "pedicle flap reconstruction", ar: "إعادة البناء بالرفرف المعنقد" },
    { topic: "head and neck", en: "radial forearm free flap*", ar: "الرفرف الحر للساعد الكعبري *" },
    { topic: "head and neck", en: "anterolateral thigh free flap*", ar: "الرفرف الحر للفخذ الأمامي الجانبي *" },
    { topic: "head and neck", en: "fibula free flap*", ar: "الرفرف الحر للشظية *" },
    { topic: "head and neck", en: "deep circumflex iliac artery flap*", ar: "رفرف الشريان الحرقفي المنعطف العميق *" },
    { topic: "head and neck", en: "sub-scapular/thoraco-dorsal artery flap*", ar: "رفرف الشريان تحت الكتفي/الصدري الظهري *" },
    { topic: "head and neck", en: "recipient vessel preparation and microvascular setup", ar: "تحضير الوعاء المتلقي والإعداد المجهري الوعائي" },
    { topic: "head and neck", en: "arterial anastomosis*", ar: "المفاغرة الشريانية *" },
    { topic: "head and neck", en: "venous anastomosis*", ar: "المفاغرة الوريدية *" },
    { topic: "head and neck", en: "neural anastomosis", ar: "المفاغرة العصبية" },
    // ── 6. conditions of the salivary glands ──
    { topic: "conditions of the salivary glands", en: "applied anatomy of the major salivary glands", ar: "التشريح التطبيقي للغدد اللعابية الكبرى" },
    { topic: "conditions of the salivary glands", en: "applied anatomy of the oral cavity and lingual nerve", ar: "التشريح التطبيقي للتجويف الفموي والعصب اللساني" },
    { topic: "conditions of the salivary glands", en: "intra-oral approaches to the salivary ducts", ar: "المداخل داخل الفموية للقنوات اللعابية" },
    { topic: "conditions of the salivary glands", en: "extra-oral approaches to the salivary glands", ar: "المداخل خارج الفموية للغدد اللعابية" },
    { topic: "conditions of the salivary glands", en: "anatomy of the facial nerve", ar: "تشريح العصب الوجهي" },
    { topic: "conditions of the salivary glands", en: "pathology of obstructive salivary gland disease", ar: "باثولوجيا مرض الغدة اللعابية الانسدادي" },
    { topic: "conditions of the salivary glands", en: "pathology of salivary gland tumours", ar: "باثولوجيا أورام الغدة اللعابية" },
    { topic: "conditions of the salivary glands", en: "pathology of mucous cysts of the sublingual salivary gland/ ranula", ar: "باثولوجيا الكيسات المخاطية للغدة اللعابية تحت اللسان / الضفدعة" },
    { topic: "conditions of the salivary glands", en: "pathology of inflammatory disease of the salivary glands", ar: "باثولوجيا المرض الالتهابي للغدد اللعابية" },
    { topic: "conditions of the salivary glands", en: "pathology of facial nerve weakness", ar: "باثولوجيا ضعف العصب الوجهي" },
    { topic: "conditions of the salivary glands", en: "physiology of salivary gland function", ar: "فسيولوجيا وظيفة الغدة اللعابية" },
    { topic: "conditions of the salivary glands", en: "principles, indications and interpretation of imaging modalities", ar: "مبادئ ودواعي وتفسير طرائق التصوير" },
    { topic: "conditions of the salivary glands", en: "principles, indications and interpretation of electrophysiological investigations", ar: "مبادئ ودواعي وتفسير الفحوص الفيزيولوجية الكهربية" },
    { topic: "conditions of the salivary glands", en: "principles, indications and interpretation of haematological investigations", ar: "مبادئ ودواعي وتفسير الفحوص الدموية" },
    { topic: "conditions of the salivary glands", en: "principles, indications for fnac technique", ar: "مبادئ ودواعي تقنية الشفط بالإبرة الدقيقة" },
    { topic: "conditions of the salivary glands", en: "classification of obstructive salivary gland disease", ar: "تصنيف مرض الغدة اللعابية الانسدادي" },
    { topic: "conditions of the salivary glands", en: "classification of salivary gland tumours", ar: "تصنيف أورام الغدة اللعابية" },
    { topic: "conditions of the salivary glands", en: "classification of inflammatory conditions of the salivary glands", ar: "تصنيف الحالات الالتهابية للغدد اللعابية" },
    { topic: "conditions of the salivary glands", en: "pain and pain relief in patients with salivary gland infection", ar: "الألم وتسكينه لدى مرضى عدوى الغدة اللعابية" },
    { topic: "conditions of the salivary glands", en: "the role of rheumatology in the management of sjogren’s syndrome and other inflammatory conditions of the salivary glands", ar: "دور طب الروماتيزم في تدبير متلازمة شوغرن والحالات الالتهابية الأخرى للغدد اللعابية" },
    { topic: "conditions of the salivary glands", en: "principles, indications and interpretation of radiological imaging of the salivary glands", ar: "مبادئ ودواعي وتفسير التصوير الشعاعي للغدد اللعابية" },
    { topic: "conditions of the salivary glands", en: "principles, indications and interpretation of sialography", ar: "مبادئ ودواعي وتفسير تصوير القنوات اللعابية" },
    { topic: "conditions of the salivary glands", en: "factors contributing to and prediction of potential complications and risks", ar: "العوامل المساهمة في المضاعفات والمخاطر المحتملة والتنبؤ بها" },
    { topic: "conditions of the salivary glands", en: "malignancy of the head and neck (diagnosis and appropriate initial managment)", ar: "الورم الخبيث للرأس والرقبة (التشخيص والتدبير الأولي المناسب)" },
    { topic: "conditions of the salivary glands", en: "salivary gland stones", ar: "حصوات الغدة اللعابية" },
    { topic: "conditions of the salivary glands", en: "salivary gland strictures", ar: "تضيقات الغدة اللعابية" },
    { topic: "conditions of the salivary glands", en: "salivary gland tumours", ar: "أورام الغدة اللعابية" },
    { topic: "conditions of the salivary glands", en: "sialadenitis", ar: "التهاب الغدة اللعابية" },
    { topic: "conditions of the salivary glands", en: "ranula/ mucocele", ar: "الضفدعة / القيلة المخاطية" },
    { topic: "conditions of the salivary glands", en: "parotid duct injury", ar: "إصابة القناة النكفية" },
    { topic: "conditions of the salivary glands", en: "inflammatory conditions of the salivary glands", ar: "الحالات الالتهابية للغدد اللعابية" },
    { topic: "conditions of the salivary glands", en: "moral and medico-legal competence", ar: "الكفاءة الأخلاقية والطبية القانونية" },
    { topic: "conditions of the salivary glands", en: "neurovascular repair", ar: "الإصلاح العصبي الوعائي" },
    { topic: "conditions of the salivary glands", en: "parotid duct injury", ar: "إصابة القناة النكفية" },
    { topic: "conditions of the salivary glands", en: "removal of a stone from the submandibular duct", ar: "إزالة حصاة من القناة تحت الفكية" },
    { topic: "conditions of the salivary glands", en: "excision of a neoplasm of a minor salivary gland", ar: "استئصال ورم في غدة لعابية صغرى" },
    { topic: "conditions of the salivary glands", en: "sublingual gland excision", ar: "استئصال الغدة تحت اللسان" },
    { topic: "conditions of the salivary glands", en: "submandibular gland excision", ar: "استئصال الغدة تحت الفك" },
    { topic: "conditions of the salivary glands", en: "partial/superficial parotidectomy*", ar: "استئصال النكفة الجزئي/السطحي *" },
    { topic: "conditions of the salivary glands", en: "total conservative parotidectomy", ar: "استئصال النكفة المحافظ الكلي" },
    { topic: "conditions of the salivary glands", en: "radical parotidectomy", ar: "استئصال النكفة الجذري" },
    { topic: "conditions of the salivary glands", en: "extra capsular dissection*", ar: "التشريح خارج المحفظة *" },
    { topic: "conditions of the salivary glands", en: "parotid strictures and megaduct", ar: "تضيقات النكفة والقناة العملاقة" },
    { topic: "conditions of the salivary glands", en: "sublingual gland mucous cyst/ ranula", ar: "الكيسة المخاطية للغدة تحت اللسان / الضفدعة" },
    { topic: "conditions of the salivary glands", en: "endoscopic management of salivary stone/stricture", ar: "التدبير التنظيري لحصاة/تضيق الغدة اللعابية" },
    // ── 7. conditions of the oral mucosa ──
    { topic: "conditions of the oral mucosa", en: "applied anatomy of the oral mucosa", ar: "التشريح التطبيقي للغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "applied anatomy of the lymphatic drainage of the oral mucosa", ar: "التشريح التطبيقي للتصريف الليمفاوي للغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "applied anatomy of major & minor salivary glands", ar: "التشريح التطبيقي للغدد اللعابية الكبرى والصغرى" },
    { topic: "conditions of the oral mucosa", en: "applied neuroanatomy of the sensory, sympathetic & parasympathetic & taste of the mouth", ar: "التشريح العصبي التطبيقي للحس والودي ونظير الودي والتذوق في الفم" },
    { topic: "conditions of the oral mucosa", en: "pathology of benign oral mucosal disease", ar: "باثولوجيا مرض الغشاء المخاطي الفموي الحميد" },
    { topic: "conditions of the oral mucosa", en: "pathology of vesicular bullous disease affecting the oral cavity", ar: "باثولوجيا المرض الحويصلي الفقاعي المصيب للتجويف الفموي" },
    { topic: "conditions of the oral mucosa", en: "pathology of malignant oral mucosal lesions", ar: "باثولوجيا آفات الغشاء المخاطي الفموي الخبيثة" },
    { topic: "conditions of the oral mucosa", en: "pathology of infective diseases of the oral mucosa", ar: "باثولوجيا الأمراض العدوائية للغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "pathology of localised & systemic inflammatory disease of the oral mucosa", ar: "باثولوجيا المرض الالتهابي الموضعي والجهازي للغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "pathology of skin manifestations of disease affecting the oral mucosa", ar: "باثولوجيا التظاهرات الجلدية للمرض المصيب للغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "the functions of the oral mucosa", ar: "وظائف الغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "the functions of saliva", ar: "وظائف اللعاب" },
    { topic: "conditions of the oral mucosa", en: "the physiology of sensation and pain affecting the mouth and face", ar: "فسيولوجيا الإحساس والألم المؤثر على الفم والوجه" },
    { topic: "conditions of the oral mucosa", en: "principles, indications and interpretation of microbiological investigations", ar: "مبادئ ودواعي وتفسير الفحوص الميكروبيولوجية" },
    { topic: "conditions of the oral mucosa", en: "principles, indications and interpretation of cytology and histology", ar: "مبادئ ودواعي وتفسير علم الخلايا والنسج" },
    { topic: "conditions of the oral mucosa", en: "principles, indications and interpretation of radiological investigations", ar: "مبادئ ودواعي وتفسير الفحوص الشعاعية" },
    { topic: "conditions of the oral mucosa", en: "principles, indications and interpretation of haematological investigations", ar: "مبادئ ودواعي وتفسير الفحوص الدموية" },
    { topic: "conditions of the oral mucosa", en: "classification of ulcerative conditions affecting the oral mucosa", ar: "تصنيف الحالات التقرحية المصيبة للغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "classification of vesicular bullous conditions affecting the oral mucosa", ar: "تصنيف الحالات الحويصلية الفقاعية المصيبة للغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "classification of pre-malignant oral mucosal lesions", ar: "تصنيف آفات الغشاء المخاطي الفموي سابقة التسرطن" },
    { topic: "conditions of the oral mucosa", en: "classification of malignant oral mucosal lesions", ar: "تصنيف آفات الغشاء المخاطي الفموي الخبيثة" },
    { topic: "conditions of the oral mucosa", en: "classification of infective diseases of the oral mucosa", ar: "تصنيف الأمراض العدوائية للغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "classification of inflammatory disease of the oral mucosa", ar: "تصنيف المرض الالتهابي للغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "classification of skin manifestations affecting the oral mucosa", ar: "تصنيف التظاهرات الجلدية المصيبة للغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "the role of the multidisciplinary team including primary care", ar: "دور الفريق متعدد التخصصات بما في ذلك الرعاية الأولية" },
    { topic: "conditions of the oral mucosa", en: "psychological effects and management of the patient with an oral mucosal condition", ar: "الآثار النفسية وتدبير المريض المصاب بحالة في الغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "pain relief in the patient with conditions of the oral mucosa", ar: "تسكين الألم لدى المريض المصاب بحالات في الغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "principles, indications and interpretation of imaging of salivary glands", ar: "مبادئ ودواعي وتفسير تصوير الغدد اللعابية" },
    { topic: "conditions of the oral mucosa", en: "pharmacology of drugs causing xerostomia", ar: "علم أدوية العقاقير المسببة لجفاف الفم" },
    { topic: "conditions of the oral mucosa", en: "pharmacology of drugs causing oral mucosal disease", ar: "علم أدوية العقاقير المسببة لمرض الغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "pharmacology of drugs causing bone disease", ar: "علم أدوية العقاقير المسببة لمرض العظم" },
    { topic: "conditions of the oral mucosa", en: "malignancy of the oral mucosa (diagnosis and appropriate initial management)", ar: "الورم الخبيث للغشاء المخاطي للفم (التشخيص والتدبير الأولي المناسب)" },
    { topic: "conditions of the oral mucosa", en: "oral ulceration", ar: "التقرح الفموي" },
    { topic: "conditions of the oral mucosa", en: "vesicular bullous lesions", ar: "الآفات الحويصلية الفقاعية" },
    { topic: "conditions of the oral mucosa", en: "white patches and leukoplakia", ar: "البقع البيضاء والطلاوة" },
    { topic: "conditions of the oral mucosa", en: "infective disease of the oral mucosa", ar: "المرض العدوائي للغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "inflammatory disease of oral mucosa", ar: "المرض الالتهابي للغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "skin manifestations of conditions of the oral mucosa", ar: "التظاهرات الجلدية لحالات الغشاء المخاطي للفم" },
    { topic: "conditions of the oral mucosa", en: "oral manifestations of systemic disease", ar: "التظاهرات الفموية للمرض الجهازي" },
    { topic: "conditions of the oral mucosa", en: "moral and medico-legal competence", ar: "الكفاءة الأخلاقية والطبية القانونية" },
    { topic: "conditions of the oral mucosa", en: "prescribing topical oral mucosal medication, baseline investigations, exclusion criteria, monitoring requirements", ar: "وصف الأدوية الموضعية للغشاء المخاطي الفموي والفحوص الأساسية ومعايير الاستبعاد ومتطلبات المراقبة" },
    { topic: "conditions of the oral mucosa", en: "prescribing systemic steroids, baseline investigations, exclusion criteria, monitoring requirements", ar: "وصف الستيرويدات الجهازية والفحوص الأساسية ومعايير الاستبعاد ومتطلبات المراقبة" },
    { topic: "conditions of the oral mucosa", en: "prescribing systemic immune suppressants, baseline investigations, exclusion criteria, monitoring requirements", ar: "وصف مثبطات المناعة الجهازية والفحوص الأساسية ومعايير الاستبعاد ومتطلبات المراقبة" },
    { topic: "conditions of the oral mucosa", en: "infiltration and nerve blocks for local anaesthesia", ar: "التسريب وحصر الأعصاب للتخدير الموضعي" },
    { topic: "conditions of the oral mucosa", en: "surgical excision & biopsy of oral mucosal lesions *", ar: "الاستئصال الجراحي وخزعة آفات الغشاء المخاطي للفم *" },
    { topic: "conditions of the oral mucosa", en: "biopsy of the minor and major salivary glands", ar: "خزعة الغدد اللعابية الصغرى والكبرى" },
    // ── 8. conditions of the skin ──
    { topic: "conditions of the skin", en: "applied anatomy of the skin", ar: "التشريح التطبيقي للجلد" },
    { topic: "conditions of the skin", en: "applied anatomy of the lymphatic drainage of the skin of the head and neck", ar: "التشريح التطبيقي للتصريف الليمفاوي لجلد الرأس والرقبة" },
    { topic: "conditions of the skin", en: "applied anatomy of structures deep to the skin of the head and neck", ar: "التشريح التطبيقي للبنى العميقة تحت جلد الرأس والرقبة" },
    { topic: "conditions of the skin", en: "pathology of benign skin lesions", ar: "باثولوجيا آفات الجلد الحميدة" },
    { topic: "conditions of the skin", en: "pathology of pre-malignant skin lesions", ar: "باثولوجيا آفات الجلد سابقة التسرطن" },
    { topic: "conditions of the skin", en: "pathology of malignant skin lesions", ar: "باثولوجيا آفات الجلد الخبيثة" },
    { topic: "conditions of the skin", en: "pathology of infective diseases of the skin", ar: "باثولوجيا الأمراض العدوائية للجلد" },
    { topic: "conditions of the skin", en: "pathology of inflammatory disease of the skin of the head and neck", ar: "باثولوجيا المرض الالتهابي لجلد الرأس والرقبة" },
    { topic: "conditions of the skin", en: "pathology of skin manifestations of oral medicine conditions of the oral mucosa", ar: "باثولوجيا التظاهرات الجلدية لحالات طب الفم في الغشاء المخاطي للفم" },
    { topic: "conditions of the skin", en: "the functions of the skin", ar: "وظائف الجلد" },
    { topic: "conditions of the skin", en: "principles, indications and interpretation of dermoscopy", ar: "مبادئ ودواعي وتفسير تنظير الجلد" },
    { topic: "conditions of the skin", en: "principles, indications and interpretation of cytology and histology", ar: "مبادئ ودواعي وتفسير علم الخلايا والنسج" },
    { topic: "conditions of the skin", en: "principles, indications and interpretation of radiological investigations", ar: "مبادئ ودواعي وتفسير الفحوص الشعاعية" },
    { topic: "conditions of the skin", en: "principles, indications and interpretation of haematological investigations", ar: "مبادئ ودواعي وتفسير الفحوص الدموية" },
    { topic: "conditions of the skin", en: "classification of benign skin lesions", ar: "تصنيف آفات الجلد الحميدة" },
    { topic: "conditions of the skin", en: "classification of pre-malignant skin lesions", ar: "تصنيف آفات الجلد سابقة التسرطن" },
    { topic: "conditions of the skin", en: "classification of malignant skin lesions", ar: "تصنيف آفات الجلد الخبيثة" },
    { topic: "conditions of the skin", en: "classification of infective diseases of the skin", ar: "تصنيف الأمراض العدوائية للجلد" },
    { topic: "conditions of the skin", en: "classification of inflammatory disease of the skin of the head and neck", ar: "تصنيف المرض الالتهابي لجلد الرأس والرقبة" },
    { topic: "conditions of the skin", en: "classification of skin manifestations of oral medicine conditions of the oral mucosa", ar: "تصنيف التظاهرات الجلدية لحالات طب الفم في الغشاء المخاطي للفم" },
    { topic: "conditions of the skin", en: "psychological effects and management of the patient with a skin condition", ar: "الآثار النفسية وتدبير المريض المصاب بحالة جلدية" },
    { topic: "conditions of the skin", en: "pain relief in the patient with a condition of the skin", ar: "تسكين الألم لدى المريض المصاب بحالة جلدية" },
    { topic: "conditions of the skin", en: "the non- surgical management of lesions and conditions of the skin", ar: "التدبير غير الجراحي لآفات وحالات الجلد" },
    { topic: "conditions of the skin", en: "principles, indications and interpretation of imaging of primary malignant skin lesions", ar: "مبادئ ودواعي وتفسير تصوير آفات الجلد الخبيثة الأولية" },
    { topic: "conditions of the skin", en: "principles, indications and interpretation of imaging of malignant skin lesions for regional metastasis", ar: "مبادئ ودواعي وتفسير تصوير آفات الجلد الخبيثة للنقائل الناحية" },
    { topic: "conditions of the skin", en: "principles, indications and interpretation of imaging of distant metastatic skin malignancy", ar: "مبادئ ودواعي وتفسير تصوير الورم الجلدي الخبيث النقيلي البعيد" },
    { topic: "conditions of the skin", en: "principles and indication for radiotherapy in skin conditions", ar: "مبادئ ودواعي العلاج الإشعاعي في الحالات الجلدية" },
    { topic: "conditions of the skin", en: "role of chemotherapy, targeted therapy and immunotherapy in skin cancer management", ar: "دور العلاج الكيميائي والموجه والمناعي في تدبير سرطان الجلد" },
    { topic: "conditions of the skin", en: "factors contributing to and prediction of potential complications and risks", ar: "العوامل المساهمة في المضاعفات والمخاطر المحتملة والتنبؤ بها" },
    { topic: "conditions of the skin", en: "management strategies for potential complications", ar: "استراتيجيات تدبير المضاعفات المحتملة" },
    { topic: "conditions of the skin", en: "sepsis of the head and neck (cellulitis, necrotising fasciitis, post-operative infections)", ar: "إنتان الرأس والرقبة (التهاب النسيج الخلوي والتهاب اللفافة المنخر والعداوى بعد الجراحة)" },
    { topic: "conditions of the skin", en: "malignancy of the skin of the head and neck including lip", ar: "الورم الخبيث لجلد الرأس والرقبة بما في ذلك الشفة" },
    { topic: "conditions of the skin", en: "national guidelines on the management of skin cancer", ar: "الإرشادات الوطنية لتدبير سرطان الجلد" },
    { topic: "conditions of the skin", en: "benign skin lesions", ar: "آفات الجلد الحميدة" },
    { topic: "conditions of the skin", en: "pre-malignant skin lesions", ar: "آفات الجلد سابقة التسرطن" },
    { topic: "conditions of the skin", en: "malignant skin lesions (including staging)", ar: "آفات الجلد الخبيثة (بما في ذلك التدريج)" },
    { topic: "conditions of the skin", en: "infective diseases of the skin", ar: "الأمراض العدوائية للجلد" },
    { topic: "conditions of the skin", en: "inflammatory disease of the skin of the head and neck", ar: "المرض الالتهابي لجلد الرأس والرقبة" },
    { topic: "conditions of the skin", en: "skin manifestations of conditions of the oral mucosa", ar: "التظاهرات الجلدية لحالات الغشاء المخاطي للفم" },
    { topic: "conditions of the skin", en: "moral and medico-legal competence", ar: "الكفاءة الأخلاقية والطبية القانونية" },
    { topic: "conditions of the skin", en: "infiltration and nerve blocks for local anaesthesia", ar: "التسريب وحصر الأعصاب للتخدير الموضعي" },
    { topic: "conditions of the skin", en: "surgical excision of skin lesions *", ar: "الاستئصال الجراحي لآفات الجلد *" },
    { topic: "conditions of the skin", en: "reconstruction of skin defects with partial thickness skin graft *", ar: "إعادة بناء عيوب الجلد بطعم جلدي جزئي السماكة *" },
    { topic: "conditions of the skin", en: "mohs surgical excision of skin lesions", ar: "استئصال آفات الجلد الجراحي بطريقة موه" },
    { topic: "conditions of the skin", en: "reconstruction of skin defects with full thickness skin graft *", ar: "إعادة بناء عيوب الجلد بطعم جلدي كامل السماكة *" },
    { topic: "conditions of the skin", en: "reconstruction of skin defects with local flaps *", ar: "إعادة بناء عيوب الجلد بالرفارف الموضعية *" },
    { topic: "conditions of the skin", en: "parotid/cervical lymph node biopsy *", ar: "خزعة العقدة الليمفاوية النكفية/العنقية *" },
    { topic: "conditions of the skin", en: "sentinel node biopsy", ar: "خزعة العقدة الخافرة" },
    { topic: "conditions of the skin", en: "therapeutic lymphadenectomy for regional metastatic skin cancer *", ar: "استئصال العقد الليمفاوية العلاجي لسرطان الجلد النقيلي الناحي *" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");
    const topicIndex = new Map(Object.entries(this.TOPIC_INDEX));

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
      DELETE FROM "lectures" lx
      USING "lecture_topics" lt, "departments" d
      WHERE lx."topicId" = lt."id" AND lt."departmentId" = d."id" AND d."code" = 'MFS'
        AND lt."title" IN ('head and neck', 'conditions of the salivary glands', 'conditions of the oral mucosa', 'conditions of the skin')
    `);
  }
}
