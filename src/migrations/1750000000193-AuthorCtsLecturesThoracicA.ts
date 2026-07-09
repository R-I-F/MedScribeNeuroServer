import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * CTS academic lectures — ISCP Cardiothoracic Surgery Curriculum (Aug 2021), Appendix 2.
 * Part 3 (Thoracic A): topics 8–10 (General Management of a Patient Undergoing Thoracic Surgery,
 * Neoplasms of the Lung, Disorders of the Pleura). Topics created in migration 191.
 * section 1 = KNOWLEDGE/CLINICAL, section 2 = TECHNICAL/OPERATIVE. `level` = NULL (MSc/MD sourced
 * later). Topic-8 knowledge preserves the ISCP sub-category labels (physiology/anatomy/pathology/
 * pharmacology/microbiology/thoracic incisions/bronchoscopy/mediastinal exploration). Faithful.
 */
export class AuthorCtsLecturesThoracicA1750000000193 implements MigrationInterface {
  name = "AuthorCtsLecturesThoracicA1750000000193";

  private readonly TOPIC_INDEX: Record<string, number> = {
    "General Management of a Patient Undergoing Thoracic Surgery": 8,
    "Neoplasms of the Lung": 9,
    "Disorders of the Pleura": 10,
  };

  private readonly LECTURES: Array<{ topic: string; section: 1 | 2; en: string; ar: string }> = [
    // ── 8. General Management of a Patient Undergoing Thoracic Surgery ── (section 1: knowledge+clinical)
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "physiology: pulmonary physiology, ventilation and gas exchange", ar: "الفسيولوجيا: فسيولوجيا الرئة والتهوية وتبادل الغازات" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "physiology: haemostasis, thrombosis and bleeding", ar: "الفسيولوجيا: الإرقاء والتخثر والنزف" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "physiology: acid base balance", ar: "الفسيولوجيا: اتزان الحمض والقاعدة" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "physiology: metabolic response to trauma", ar: "الفسيولوجيا: الاستجابة الأيضية للرض" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "physiology: digestive, renal and hepatic physiology", ar: "الفسيولوجيا: فسيولوجيا الجهاز الهضمي والكلى والكبد" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "physiology: nutrition", ar: "الفسيولوجيا: التغذية" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "anatomy: tracheobronchial tree and lungs", ar: "التشريح: الشجرة الرغامية القصبية والرئتان" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "anatomy: thoracic inlet, neck and mediastinum", ar: "التشريح: مدخل الصدر والرقبة والمنصف" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "anatomy: oesophagus and upper gi tract", ar: "التشريح: المريء والجهاز الهضمي العلوي" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "anatomy: chest wall and diaphragm", ar: "التشريح: جدار الصدر والحجاب الحاجز" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "pathology: inflammation and wound healing", ar: "الباثولوجيا: الالتهاب والتئام الجروح" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "pathology: bronchopulmonary infections", ar: "الباثولوجيا: العداوى القصبية الرئوية" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "pathology: emphysema", ar: "الباثولوجيا: النفاخ الرئوي" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "pathology: pulmonary fibrosis", ar: "الباثولوجيا: التليف الرئوي" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "pathology: pulmonary manifestations of systemic disease", ar: "الباثولوجيا: المظاهر الرئوية للأمراض الجهازية" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "pathology: systemic manifestations of pulmonary disease", ar: "الباثولوجيا: المظاهر الجهازية لأمراض الرئة" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "pathology: benign and malignant tumours of trachea, bronchus and lung parenchyma", ar: "الباثولوجيا: الأورام الحميدة والخبيثة للرغامى والقصبات ونسيج الرئة" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "pharmacology: bronchodilators", ar: "الأدوية: موسعات القصبات" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "pharmacology: h2 antagonists and proton pump inhibitors", ar: "الأدوية: مضادات مستقبلات H2 ومثبطات مضخة البروتون" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "pharmacology: haemostatic drugs", ar: "الأدوية: الأدوية المرقئة" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "pharmacology: analgesics", ar: "الأدوية: المسكنات" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "pharmacology: antibiotics", ar: "الأدوية: المضادات الحيوية" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "pharmacology: anaesthetic agents, local and general", ar: "الأدوية: عوامل التخدير الموضعي والعام" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "microbiology: organisms involved in respiratory infection including tb", ar: "الأحياء الدقيقة: الكائنات المسببة للعدوى التنفسية بما في ذلك السل" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "microbiology: organisms involved in wound infection", ar: "الأحياء الدقيقة: الكائنات المسببة لعدوى الجروح" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "microbiology: antibiotic usage and prophylaxis", ar: "الأحياء الدقيقة: استخدام المضادات الحيوية والوقاية بها" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "microbiology: antisepsis", ar: "الأحياء الدقيقة: التعقيم ومكافحة العدوى" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "microbiology: management of intra-pleural sepsis", ar: "الأحياء الدقيقة: تدبير الإنتان داخل غشاء الجنب" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "thoracic incisions: types of incisions and appropriate use (lateral, anterior, muscle-sparing and video-assisted approaches)", ar: "شقوق الصدر: أنواع الشقوق واستخدامها المناسب (المداخل الوحشية والأمامية والحافظة للعضلات وبمساعدة الفيديو)" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "thoracic incisions: sternotomy", ar: "شقوق الصدر: شق القص" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "thoracic incisions: difficult access and improving exposure", ar: "شقوق الصدر: صعوبة الوصول وتحسين التعرض الجراحي" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "thoracic incisions: early and late complications of thoracic incisions", ar: "شقوق الصدر: المضاعفات المبكرة والمتأخرة لشقوق الصدر" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "thoracic incisions: analgesia - pharmacology, effectiveness, side effects and use in combination regimens", ar: "شقوق الصدر: التسكين - الدواء والفعالية والآثار الجانبية والاستخدام في الأنظمة المركبة" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "thoracic incisions: post-operative analgesia including epidural, pcas and paravertebral catheter techniques", ar: "شقوق الصدر: التسكين بعد الجراحة بما في ذلك تقنيات فوق الجافية وأجهزة التسكين المتحكم بها ذاتيًا والقسطرة جانب الفقرات" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "bronchoscopy: the role of rigid and flexible bronchoscopy in the investigation of airway and pulmonary disease", ar: "تنظير القصبات: دور التنظير الصلب والمرن في فحص أمراض مجرى الهواء والرئة" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "bronchoscopy: anaesthetic, airway and ventilatory management during rigid and flexible bronchoscopy", ar: "تنظير القصبات: تدبير التخدير ومجرى الهواء والتهوية أثناء التنظير الصلب والمرن" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "mediastinal exploration: endoscopic, radiological and surgical approaches to evaluate and diagnose mediastinal disease", ar: "استكشاف المنصف: المداخل التنظيرية والإشعاعية والجراحية لتقييم وتشخيص أمراض المنصف" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "mediastinal exploration: equipment for mediastinal exploration", ar: "استكشاف المنصف: أدوات استكشاف المنصف" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "mediastinal exploration: relevant imaging techniques and influence on surgical approach", ar: "استكشاف المنصف: تقنيات التصوير ذات الصلة وتأثيرها على المدخل الجراحي" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "history and examination: system-specific and general history and examination, including drug history, comorbidity and functional status", ar: "التاريخ والفحص: التاريخ والفحص الخاص بالجهاز والعام بما في ذلك التاريخ الدوائي والأمراض المصاحبة والحالة الوظيفية" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "routine haematology and biochemical investigations", ar: "الفحوص الروتينية الدموية والكيميائية الحيوية" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "chest radiograph and ecg", ar: "صورة الصدر الشعاعية وتخطيط القلب الكهربي" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "ct including contrast-enhanced ct", ar: "التصوير المقطعي المحوسب بما في ذلك المعزز بالتباين" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "interpretation of imaging of the mediastinum", ar: "تفسير تصوير المنصف" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "mri and pet", ar: "التصوير بالرنين المغناطيسي والتصوير المقطعي بالإصدار البوزيتروني" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "respiratory function tests", ar: "اختبارات وظائف التنفس" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "ventilation/perfusion scan", ar: "مسح التهوية/التروية" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "blood gases", ar: "غازات الدم" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "oesophageal function tests and contrast studies", ar: "اختبارات وظائف المريء ودراسات التباين" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "cardiopulmonary resuscitation", ar: "الإنعاش القلبي الرئوي" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "risk assessment, stratification and management of thoracic operations", ar: "تقييم وتصنيف المخاطر وتدبير عمليات الصدر" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "management of patients making an uncomplicated or complicated recovery from thoracic operations", ar: "تدبير المرضى في التعافي غير المعقد والمعقد بعد عمليات الصدر" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "post-operative management of pain control, respiratory failure, sputum retention, haemodynamic instability and low urine output", ar: "التدبير بعد الجراحة للتحكم في الألم والفشل التنفسي واحتباس القشع وعدم استقرار الدورة الدموية وقلة إدرار البول" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "treatment of cardiac arrhythmias", ar: "علاج اضطرابات النظم القلبي" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "pain control", ar: "التحكم في الألم" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "wound infection and disruption", ar: "عدوى الجرح وتفككه" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "blood transfusion and blood products", ar: "نقل الدم ومشتقاته" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "physiotherapy and rehabilitation", ar: "العلاج الطبيعي وإعادة التأهيل" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 1, en: "palliative care", ar: "الرعاية التلطيفية" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 2, en: "tracheostomy", ar: "فغر الرغامى" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 2, en: "fibreoptic bronchoscopy", ar: "تنظير القصبات بالألياف البصرية" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 2, en: "chest aspiration", ar: "بزل الصدر" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 2, en: "chest drain insertion", ar: "إدخال أنبوب الصدر" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 2, en: "chest drain management", ar: "تدبير أنبوب الصدر" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 2, en: "correct positioning of patient for thoracic surgery", ar: "التوضيع الصحيح للمريض لجراحة الصدر" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 2, en: "perform and repair thoracic incisions, including lateral, anterior, muscle-sparing and vats incisions", ar: "إجراء وإصلاح شقوق الصدر بما في ذلك الشقوق الوحشية والأمامية والحافظة للعضلات وشقوق تنظير الصدر" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 2, en: "difficult thoracic access and improving exposure", ar: "صعوبة الوصول الصدري وتحسين التعرض الجراحي" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 2, en: "perform and close sternotomy incision", ar: "إجراء وإغلاق شق القص" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 2, en: "diagnostic and therapeutic bronchoscopy including biopsy - rigid and flexible", ar: "تنظير القصبات التشخيصي والعلاجي بما في ذلك الخزعة - الصلب والمرن" },
    { topic: "General Management of a Patient Undergoing Thoracic Surgery", section: 2, en: "surgical evaluation of the mediastinum using cervical, anterior and vats approaches", ar: "التقييم الجراحي للمنصف باستخدام المداخل الرقبية والأمامية وتنظير الصدر" },
    // ── 9. Neoplasms of the Lung ──
    { topic: "Neoplasms of the Lung", section: 1, en: "benign and malignant tumours of trachea, bronchus and lung parenchyma", ar: "الأورام الحميدة والخبيثة للرغامى والقصبات ونسيج الرئة" },
    { topic: "Neoplasms of the Lung", section: 1, en: "epidemiology, presentation, diagnosis, staging and treatment of lung cancer and lung metastases", ar: "وبائيات وأعراض وتشخيص وتحديد مرحلة وعلاج سرطان الرئة والنقائل الرئوية" },
    { topic: "Neoplasms of the Lung", section: 1, en: "neoadjuvant and adjuvant treatment of lung cancer", ar: "العلاج المساعد الجديد والمساعد لسرطان الرئة" },
    { topic: "Neoplasms of the Lung", section: 1, en: "results of treating thoracic malignancy by surgery, medical or oncological techniques, including multimodality management", ar: "نتائج علاج الأورام الصدرية الخبيثة بالجراحة أو الطرق الطبية أو الأورامية بما في ذلك العلاج متعدد الوسائط" },
    { topic: "Neoplasms of the Lung", section: 1, en: "survival, recurrence rates and relapse patterns after surgical treatment and the investigation and management of relapse", ar: "البقيا ومعدلات النكس وأنماطه بعد العلاج الجراحي وفحص النكس وتدبيره" },
    { topic: "Neoplasms of the Lung", section: 1, en: "knowledge of palliative care techniques", ar: "معرفة تقنيات الرعاية التلطيفية" },
    { topic: "Neoplasms of the Lung", section: 1, en: "treatment of post-operative complications of pulmonary resection such as empyema and bronchopleural fistula", ar: "علاج مضاعفات ما بعد استئصال الرئة مثل الدبيلة والناسور القصبي الجنبي" },
    { topic: "Neoplasms of the Lung", section: 1, en: "role of repeat surgery in recurrent and second primary malignancies of the lung", ar: "دور الجراحة المتكررة في الأورام الخبيثة الناكسة والأولية الثانية للرئة" },
    { topic: "Neoplasms of the Lung", section: 1, en: "medical and surgical options to deal with recurrent or problematic complications of pulmonary resection", ar: "الخيارات الطبية والجراحية للتعامل مع المضاعفات الناكسة أو المستعصية لاستئصال الرئة" },
    { topic: "Neoplasms of the Lung", section: 1, en: "clinical history and examination", ar: "التاريخ المرضي والفحص السريري" },
    { topic: "Neoplasms of the Lung", section: 1, en: "interpretation of laboratory, physiological and imaging techniques", ar: "تفسير التقنيات المخبرية والفسيولوجية والتصويرية" },
    { topic: "Neoplasms of the Lung", section: 1, en: "interpretation of endoscopic findings", ar: "تفسير نتائج التنظير" },
    { topic: "Neoplasms of the Lung", section: 1, en: "patient selection with assessment of function and risk", ar: "اختيار المريض مع تقييم الوظيفة والمخاطر" },
    { topic: "Neoplasms of the Lung", section: 2, en: "bronchoscopic assessment including biopsy", ar: "التقييم بتنظير القصبات بما في ذلك الخزعة" },
    { topic: "Neoplasms of the Lung", section: 2, en: "endoscopic and surgical techniques of lung biopsy", ar: "التقنيات التنظيرية والجراحية لخزعة الرئة" },
    { topic: "Neoplasms of the Lung", section: 2, en: "mediastinal assessment and biopsy", ar: "تقييم المنصف والخزعة" },
    { topic: "Neoplasms of the Lung", section: 2, en: "intraoperative diagnosis and staging", ar: "التشخيص وتحديد المرحلة أثناء الجراحة" },
    { topic: "Neoplasms of the Lung", section: 2, en: "endoscopic management of tumours using laser and stenting", ar: "التدبير التنظيري للأورام باستخدام الليزر والدعامات" },
    { topic: "Neoplasms of the Lung", section: 2, en: "surgery for benign and malignant conditions of the lungs", ar: "جراحة الحالات الحميدة والخبيثة للرئتين" },
    { topic: "Neoplasms of the Lung", section: 2, en: "minimally invasive anatomical lung resection (vats, uniportal or robotic)", ar: "استئصال الرئة التشريحي طفيف التوغل (تنظير الصدر أو أحادي المنفذ أو الروبوتي)" },
    { topic: "Neoplasms of the Lung", section: 2, en: "segmentectomy and lobectomy for benign and malignant disease", ar: "استئصال القطعة والفص للأمراض الحميدة والخبيثة" },
    { topic: "Neoplasms of the Lung", section: 2, en: "redo operations for lung metastases", ar: "عمليات إعادة للنقائل الرئوية" },
    { topic: "Neoplasms of the Lung", section: 2, en: "advanced resections for lung cancer, including sleeve lobectomy, pneumonectomy and extended resections involving chest wall and diaphragm", ar: "الاستئصالات المتقدمة لسرطان الرئة بما في ذلك استئصال الفص الكُمّي واستئصال الرئة والاستئصالات الموسعة التي تشمل جدار الصدر والحجاب الحاجز" },
    { topic: "Neoplasms of the Lung", section: 2, en: "management of post-operative complications such as empyema and bronchopleural fistula", ar: "تدبير مضاعفات ما بعد الجراحة مثل الدبيلة والناسور القصبي الجنبي" },
    // ── 10. Disorders of the Pleura ──
    { topic: "Disorders of the Pleura", section: 1, en: "anatomy and physiology of the pleura", ar: "تشريح وفسيولوجيا غشاء الجنب" },
    { topic: "Disorders of the Pleura", section: 1, en: "inflammatory, infective and malignant disease of the visceral and parietal pleura", ar: "الأمراض الالتهابية والعدوائية والخبيثة لغشاء الجنب الحشوي والجداري" },
    { topic: "Disorders of the Pleura", section: 1, en: "pneumothorax", ar: "استرواح الصدر" },
    { topic: "Disorders of the Pleura", section: 1, en: "pleural effusion", ar: "الانصباب الجنبي" },
    { topic: "Disorders of the Pleura", section: 1, en: "empyema", ar: "الدبيلة الجنبية" },
    { topic: "Disorders of the Pleura", section: 1, en: "mesothelioma", ar: "ورم المتوسطة (الميزوثيليوما)" },
    { topic: "Disorders of the Pleura", section: 1, en: "haemothorax", ar: "تدمي الصدر" },
    { topic: "Disorders of the Pleura", section: 1, en: "chylothorax", ar: "تكيّل الصدر (الصدر الكيلوسي)" },
    { topic: "Disorders of the Pleura", section: 1, en: "conditions of adjacent organs that affect the pleura", ar: "حالات الأعضاء المجاورة التي تؤثر على غشاء الجنب" },
    { topic: "Disorders of the Pleura", section: 1, en: "medical and surgical management of pleural disease, including radiological, open and vats techniques", ar: "التدبير الطبي والجراحي لأمراض غشاء الجنب بما في ذلك التقنيات الإشعاعية والمفتوحة وتنظير الصدر" },
    { topic: "Disorders of the Pleura", section: 1, en: "techniques to deal with failures of primary treatment", ar: "تقنيات التعامل مع فشل العلاج الأولي" },
    { topic: "Disorders of the Pleura", section: 1, en: "advanced techniques for pleural space obliteration such as thoracoplasty and soft-tissue transfer", ar: "التقنيات المتقدمة لطمس الحيز الجنبي مثل رأب الصدر ونقل الأنسجة الرخوة" },
    { topic: "Disorders of the Pleura", section: 1, en: "interpretation of imaging of the pleura", ar: "تفسير تصوير غشاء الجنب" },
    { topic: "Disorders of the Pleura", section: 1, en: "chest drains: insertion, management, removal and treatment of complications", ar: "أنابيب الصدر: الإدخال والتدبير والإزالة وعلاج المضاعفات" },
    { topic: "Disorders of the Pleura", section: 1, en: "management of patients making uncomplicated and complicated recovery from pleural interventions", ar: "تدبير المرضى في التعافي غير المعقد والمعقد بعد تدخلات غشاء الجنب" },
    { topic: "Disorders of the Pleura", section: 2, en: "open procedures for non-complex pleural problems", ar: "الإجراءات المفتوحة لمشاكل غشاء الجنب غير المعقدة" },
    { topic: "Disorders of the Pleura", section: 2, en: "vats procedures for non-complex pleural problems", ar: "إجراءات تنظير الصدر لمشاكل غشاء الجنب غير المعقدة" },
    { topic: "Disorders of the Pleura", section: 2, en: "open and vats procedures for empyema, including techniques for decortication", ar: "الإجراءات المفتوحة وتنظير الصدر للدبيلة بما في ذلك تقنيات تقشير الرئة" },
    { topic: "Disorders of the Pleura", section: 2, en: "open and vats procedures in complex cases", ar: "الإجراءات المفتوحة وتنظير الصدر في الحالات المعقدة" },
    { topic: "Disorders of the Pleura", section: 2, en: "advanced techniques of pleural space obliteration", ar: "التقنيات المتقدمة لطمس الحيز الجنبي" },
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
        AND lt."title" IN ('General Management of a Patient Undergoing Thoracic Surgery', 'Neoplasms of the Lung', 'Disorders of the Pleura')
    `);
  }
}
