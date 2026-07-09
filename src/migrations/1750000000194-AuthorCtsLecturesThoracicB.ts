import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * CTS academic lectures — ISCP Cardiothoracic Surgery Curriculum (Aug 2021), Appendix 2.
 * Part 4 (Thoracic B): topics 11–16 (Disorders of the Chest Wall, Disorders of the Diaphragm,
 * Emphysema and Bullae, Disorders of the Pericardium, Disorders of the Mediastinum, Disorders
 * of the Airway). Topics created in migration 191.
 * section 1 = KNOWLEDGE/CLINICAL, section 2 = TECHNICAL/OPERATIVE. `level` = NULL (MSc/MD sourced
 * later). Faithful transcription of each topic's KNOWLEDGE + CLINICAL SKILLS (section 1) and
 * TECHNICAL SKILLS AND PROCEDURES (section 2) items; nothing invented.
 */
export class AuthorCtsLecturesThoracicB1750000000194 implements MigrationInterface {
  name = "AuthorCtsLecturesThoracicB1750000000194";

  private readonly TOPIC_INDEX: Record<string, number> = {
    "Disorders of the Chest Wall": 11,
    "Disorders of the Diaphragm": 12,
    "Emphysema and Bullae": 13,
    "Disorders of the Pericardium": 14,
    "Disorders of the Mediastinum": 15,
    "Disorders of the Airway": 16,
  };

  private readonly LECTURES: Array<{ topic: string; section: 1 | 2; en: string; ar: string }> = [
    // ── 11. Disorders of the Chest Wall ── (section 1: knowledge + clinical)
    { topic: "Disorders of the Chest Wall", section: 1, en: "anatomy of the chest wall", ar: "تشريح جدار الصدر" },
    { topic: "Disorders of the Chest Wall", section: 1, en: "congenital, inflammatory, infective and neoplastic conditions that can affect the components of the chest wall", ar: "الحالات الخلقية والالتهابية والعدوائية والورمية التي تصيب مكونات جدار الصدر" },
    { topic: "Disorders of the Chest Wall", section: 1, en: "clinical, laboratory and imaging techniques used in the evaluation of chest wall pathology", ar: "التقنيات السريرية والمخبرية والتصويرية المستخدمة في تقييم أمراض جدار الصدر" },
    { topic: "Disorders of the Chest Wall", section: 1, en: "techniques used in the diagnosis of chest wall disease, including aspiration and core biopsy, and incision and excision biopsy", ar: "التقنيات المستخدمة في تشخيص أمراض جدار الصدر بما في ذلك البزل والخزعة الأسطوانية وخزعة الشق والاستئصال" },
    { topic: "Disorders of the Chest Wall", section: 1, en: "pectus deformities: aetiology, physiological and psychological consequences, and surgical options for correction", ar: "تشوهات القص: الأسباب والعواقب الفسيولوجية والنفسية والخيارات الجراحية للتصحيح" },
    { topic: "Disorders of the Chest Wall", section: 1, en: "techniques used to resect the sternum and chest wall, physiological and cosmetic sequelae", ar: "التقنيات المستخدمة لاستئصال القص وجدار الصدر والعقابيل الفسيولوجية والتجميلية" },
    { topic: "Disorders of the Chest Wall", section: 1, en: "prosthetic materials used in chest wall surgery", ar: "المواد التعويضية المستخدمة في جراحة جدار الصدر" },
    { topic: "Disorders of the Chest Wall", section: 1, en: "the role of repeat surgery to deal with recurrent conditions and the complications of previous surgery", ar: "دور الجراحة المتكررة للتعامل مع الحالات الناكسة ومضاعفات الجراحة السابقة" },
    { topic: "Disorders of the Chest Wall", section: 1, en: "techniques of complex chest wall reconstruction involving thoracoplasty or soft-tissue reconstruction", ar: "تقنيات إعادة بناء جدار الصدر المعقدة التي تشمل رأب الصدر أو إعادة بناء الأنسجة الرخوة" },
    { topic: "Disorders of the Chest Wall", section: 1, en: "clinical history and examination", ar: "التاريخ المرضي والفحص السريري" },
    { topic: "Disorders of the Chest Wall", section: 1, en: "interpretation of laboratory, physiological and imaging techniques", ar: "تفسير التقنيات المخبرية والفسيولوجية والتصويرية" },
    { topic: "Disorders of the Chest Wall", section: 1, en: "patient selection with assessment of function and risk", ar: "اختيار المريض مع تقييم الوظيفة والمخاطر" },
    { topic: "Disorders of the Chest Wall", section: 2, en: "chest wall biopsy and choice of appropriate technique", ar: "خزعة جدار الصدر واختيار التقنية المناسبة" },
    { topic: "Disorders of the Chest Wall", section: 2, en: "open and excision biopsy and resection of the chest wall for benign and malignant conditions", ar: "الخزعة المفتوحة والاستئصالية واستئصال جدار الصدر للحالات الحميدة والخبيثة" },
    { topic: "Disorders of the Chest Wall", section: 2, en: "chest wall resection in combination with resection of the underlying lung", ar: "استئصال جدار الصدر مع استئصال الرئة الكامنة" },
    { topic: "Disorders of the Chest Wall", section: 2, en: "selection and insertion of prosthetic materials, and selection of cases in which such materials are required", ar: "اختيار وإدخال المواد التعويضية واختيار الحالات التي تتطلب هذه المواد" },
    { topic: "Disorders of the Chest Wall", section: 2, en: "pectus correction, by both open and minimally-invasive techniques, including post-operative care and complications", ar: "تصحيح تشوه القص بالتقنيات المفتوحة وطفيفة التوغل بما في ذلك الرعاية بعد الجراحة والمضاعفات" },
    { topic: "Disorders of the Chest Wall", section: 2, en: "surgery for the complications of chest wall resection, and repeat surgery to resect recurrent chest wall conditions", ar: "جراحة مضاعفات استئصال جدار الصدر والجراحة المتكررة لاستئصال الحالات الناكسة لجدار الصدر" },
    { topic: "Disorders of the Chest Wall", section: 2, en: "complex chest wall reconstruction", ar: "إعادة بناء جدار الصدر المعقدة" },
    // ── 12. Disorders of the Diaphragm ──
    { topic: "Disorders of the Diaphragm", section: 1, en: "anatomy and physiology of the diaphragm", ar: "تشريح وفسيولوجيا الحجاب الحاجز" },
    { topic: "Disorders of the Diaphragm", section: 1, en: "pathology of the diaphragm", ar: "باثولوجيا الحجاب الحاجز" },
    { topic: "Disorders of the Diaphragm", section: 1, en: "clinical, physiological and imaging techniques in the assessment of diaphragmatic abnormalities", ar: "التقنيات السريرية والفسيولوجية والتصويرية في تقييم شذوذات الحجاب الحاجز" },
    { topic: "Disorders of the Diaphragm", section: 1, en: "physiological consequences of diaphragmatic herniation or paresis", ar: "العواقب الفسيولوجية لفتق الحجاب الحاجز أو شلله الجزئي" },
    { topic: "Disorders of the Diaphragm", section: 1, en: "surgical techniques used to biopsy and resect diaphragmatic tumours", ar: "التقنيات الجراحية المستخدمة لخزعة واستئصال أورام الحجاب الحاجز" },
    { topic: "Disorders of the Diaphragm", section: 1, en: "situations in which replacement of the diaphragm is required, the materials used and their value and limitations", ar: "الحالات التي تتطلب استبدال الحجاب الحاجز والمواد المستخدمة وقيمتها وحدودها" },
    { topic: "Disorders of the Diaphragm", section: 1, en: "complications of diaphragmatic resection and their management", ar: "مضاعفات استئصال الحجاب الحاجز وتدبيرها" },
    { topic: "Disorders of the Diaphragm", section: 1, en: "techniques used to electrically pace the diaphragm, and the conditions in which such treatment is appropriate", ar: "التقنيات المستخدمة لتنظيم الحجاب الحاجز كهربائيًا والحالات التي يكون فيها هذا العلاج مناسبًا" },
    { topic: "Disorders of the Diaphragm", section: 1, en: "clinical history and examination", ar: "التاريخ المرضي والفحص السريري" },
    { topic: "Disorders of the Diaphragm", section: 1, en: "interpretation of laboratory, physiological and imaging techniques", ar: "تفسير التقنيات المخبرية والفسيولوجية والتصويرية" },
    { topic: "Disorders of the Diaphragm", section: 1, en: "patient selection with assessment of function and risk", ar: "اختيار المريض مع تقييم الوظيفة والمخاطر" },
    { topic: "Disorders of the Diaphragm", section: 1, en: "management of patients making an uncomplicated or complicated recovery from diaphragmatic resection", ar: "تدبير المرضى في التعافي غير المعقد والمعقد بعد استئصال الحجاب الحاجز" },
    { topic: "Disorders of the Diaphragm", section: 2, en: "resection and repair of the diaphragm and adjacent structures", ar: "استئصال وإصلاح الحجاب الحاجز والبنى المجاورة" },
    { topic: "Disorders of the Diaphragm", section: 2, en: "complications of diaphragmatic resection", ar: "مضاعفات استئصال الحجاب الحاجز" },
    { topic: "Disorders of the Diaphragm", section: 2, en: "management of diaphragmatic trauma", ar: "تدبير رضّ الحجاب الحاجز" },
    // ── 13. Emphysema and Bullae ──
    { topic: "Emphysema and Bullae", section: 1, en: "aetiology, pathology and physiology of chronic obstructive airways disease (copd)", ar: "أسباب وباثولوجيا وفسيولوجيا الداء الرئوي الانسدادي المزمن (COPD)" },
    { topic: "Emphysema and Bullae", section: 1, en: "epidemiology and public health issues", ar: "الوبائيات وقضايا الصحة العامة" },
    { topic: "Emphysema and Bullae", section: 1, en: "smoking cessation measures", ar: "تدابير الإقلاع عن التدخين" },
    { topic: "Emphysema and Bullae", section: 1, en: "clinical, laboratory, physiological and imaging techniques", ar: "التقنيات السريرية والمخبرية والفسيولوجية والتصويرية" },
    { topic: "Emphysema and Bullae", section: 1, en: "medical and surgical management of copd and its complications", ar: "التدبير الطبي والجراحي للداء الرئوي الانسدادي المزمن ومضاعفاته" },
    { topic: "Emphysema and Bullae", section: 1, en: "selection criteria and pre-operative preparation", ar: "معايير الاختيار والتحضير قبل الجراحة" },
    { topic: "Emphysema and Bullae", section: 1, en: "surgical techniques used in the treatment of emphysema and bullae and the results of surgical treatment including relevant clinical trials", ar: "التقنيات الجراحية المستخدمة في علاج النفاخ والفقاعات ونتائج العلاج الجراحي بما في ذلك التجارب السريرية ذات الصلة" },
    { topic: "Emphysema and Bullae", section: 1, en: "lung volume reduction surgery: techniques, complications and management of complications", ar: "جراحة تصغير حجم الرئة: التقنيات والمضاعفات وتدبير المضاعفات" },
    { topic: "Emphysema and Bullae", section: 1, en: "endobronchial lung volume reduction", ar: "تصغير حجم الرئة عبر القصبات" },
    { topic: "Emphysema and Bullae", section: 1, en: "experimental and developmental techniques in lung volume reduction surgery", ar: "التقنيات التجريبية والتطويرية في جراحة تصغير حجم الرئة" },
    { topic: "Emphysema and Bullae", section: 1, en: "clinical history and examination", ar: "التاريخ المرضي والفحص السريري" },
    { topic: "Emphysema and Bullae", section: 1, en: "interpretation of laboratory, physiological and imaging techniques", ar: "تفسير التقنيات المخبرية والفسيولوجية والتصويرية" },
    { topic: "Emphysema and Bullae", section: 1, en: "patient selection with assessment of function and risk", ar: "اختيار المريض مع تقييم الوظيفة والمخاطر" },
    { topic: "Emphysema and Bullae", section: 1, en: "post-operative management of patients making an uncomplicated recovery from surgery for emphysema or the complications of such diseases", ar: "التدبير بعد الجراحة للمرضى في التعافي غير المعقد بعد جراحة النفاخ أو مضاعفات هذه الأمراض" },
    { topic: "Emphysema and Bullae", section: 1, en: "management of patients following lung volume reduction surgery", ar: "تدبير المرضى بعد جراحة تصغير حجم الرئة" },
    { topic: "Emphysema and Bullae", section: 2, en: "procedures to deal with secondary pneumothorax and bullae by open techniques", ar: "إجراءات التعامل مع استرواح الصدر الثانوي والفقاعات بالتقنيات المفتوحة" },
    { topic: "Emphysema and Bullae", section: 2, en: "procedures to deal with secondary pneumothorax and bullae by vats techniques", ar: "إجراءات التعامل مع استرواح الصدر الثانوي والفقاعات بتقنيات تنظير الصدر" },
    { topic: "Emphysema and Bullae", section: 2, en: "lung volume reduction surgery using open and vats techniques", ar: "جراحة تصغير حجم الرئة باستخدام التقنيات المفتوحة وتنظير الصدر" },
    // ── 14. Disorders of the Pericardium ──
    { topic: "Disorders of the Pericardium", section: 1, en: "anatomy of the pericardium", ar: "تشريح التامور" },
    { topic: "Disorders of the Pericardium", section: 1, en: "pathology of the pericardium", ar: "باثولوجيا التامور" },
    { topic: "Disorders of the Pericardium", section: 1, en: "pathophysiological consequences of pericardial constriction and tamponade", ar: "العواقب الفيزيولوجية المرضية لتضيّق التامور والدكاك القلبي" },
    { topic: "Disorders of the Pericardium", section: 1, en: "clinical, echocardiographic and imaging techniques used to detect pericardial disease and assess its consequences", ar: "التقنيات السريرية والتخطيطية الصدوية والتصويرية المستخدمة لكشف أمراض التامور وتقييم عواقبها" },
    { topic: "Disorders of the Pericardium", section: 1, en: "techniques for pericardial drainage using guided needle aspiration", ar: "تقنيات تصريف التامور باستخدام البزل بالإبرة الموجهة" },
    { topic: "Disorders of the Pericardium", section: 1, en: "surgical drainage by subxiphoid, thoracotomy or vats approaches", ar: "التصريف الجراحي عبر المداخل تحت الرهابة أو بضع الصدر أو تنظير الصدر" },
    { topic: "Disorders of the Pericardium", section: 1, en: "surgical techniques for pericardiectomy", ar: "التقنيات الجراحية لاستئصال التامور" },
    { topic: "Disorders of the Pericardium", section: 1, en: "materials used for pericardial replacement, their value and limitations and the situations in which used", ar: "المواد المستخدمة لاستبدال التامور وقيمتها وحدودها والحالات التي تستخدم فيها" },
    { topic: "Disorders of the Pericardium", section: 1, en: "post-operative complications following resection of the pericardium and its prosthetic replacement", ar: "مضاعفات ما بعد الجراحة بعد استئصال التامور واستبداله التعويضي" },
    { topic: "Disorders of the Pericardium", section: 1, en: "clinical history and examination", ar: "التاريخ المرضي والفحص السريري" },
    { topic: "Disorders of the Pericardium", section: 1, en: "interpretation of laboratory, physiological and imaging techniques, including echocardiography", ar: "تفسير التقنيات المخبرية والفسيولوجية والتصويرية بما في ذلك تخطيط صدى القلب" },
    { topic: "Disorders of the Pericardium", section: 1, en: "recognition and assessment of pericardial tamponade and constriction", ar: "التعرف على الدكاك القلبي وتضيّق التامور وتقييمهما" },
    { topic: "Disorders of the Pericardium", section: 1, en: "techniques for pericardial drainage using guided needle aspiration (clinical)", ar: "تقنيات تصريف التامور باستخدام البزل بالإبرة الموجهة (سريري)" },
    { topic: "Disorders of the Pericardium", section: 1, en: "recognition of pericardial herniation and cardiac strangulation", ar: "التعرف على فتق التامور واختناق القلب" },
    { topic: "Disorders of the Pericardium", section: 1, en: "patient selection with assessment of function and risk", ar: "اختيار المريض مع تقييم الوظيفة والمخاطر" },
    { topic: "Disorders of the Pericardium", section: 2, en: "non-complex pericardial fenestration procedures", ar: "إجراءات نافذة التامور غير المعقدة" },
    { topic: "Disorders of the Pericardium", section: 2, en: "pericardial fenestration in complex cases", ar: "نافذة التامور في الحالات المعقدة" },
    { topic: "Disorders of the Pericardium", section: 2, en: "pericardiectomy for relief of constriction", ar: "استئصال التامور لتخفيف التضيّق" },
    { topic: "Disorders of the Pericardium", section: 2, en: "resection of the pericardium and replacement with prosthetic materials", ar: "استئصال التامور واستبداله بالمواد التعويضية" },
    // ── 15. Disorders of the Mediastinum ──
    { topic: "Disorders of the Mediastinum", section: 1, en: "anatomy of the mediastinum", ar: "تشريح المنصف" },
    { topic: "Disorders of the Mediastinum", section: 1, en: "congenital, benign, infective and malignant (primary and secondary) conditions of the mediastinum", ar: "الحالات الخلقية والحميدة والعدوائية والخبيثة (الأولية والثانوية) للمنصف" },
    { topic: "Disorders of the Mediastinum", section: 1, en: "systemic conditions associated with the mediastinum", ar: "الحالات الجهازية المرتبطة بالمنصف" },
    { topic: "Disorders of the Mediastinum", section: 1, en: "clinical, laboratory, electromyographic and imaging techniques used in the diagnosis and assessment of patients with mediastinal disease", ar: "التقنيات السريرية والمخبرية وتخطيط كهربية العضل والتصويرية المستخدمة في تشخيص وتقييم مرضى أمراض المنصف" },
    { topic: "Disorders of the Mediastinum", section: 1, en: "myasthenia gravis: medical, surgical and perioperative management", ar: "الوهن العضلي الوبيل: التدبير الطبي والجراحي وحول الجراحي" },
    { topic: "Disorders of the Mediastinum", section: 1, en: "staging of thymoma and grading of myasthenia", ar: "تحديد مرحلة الورم التوتي وتصنيف درجة الوهن العضلي" },
    { topic: "Disorders of the Mediastinum", section: 1, en: "benign and malignant conditions, which do not require surgical biopsy or resection", ar: "الحالات الحميدة والخبيثة التي لا تتطلب خزعة أو استئصالًا جراحيًا" },
    { topic: "Disorders of the Mediastinum", section: 1, en: "oncological treatment of malignant diseases of the mediastinum, including multidisciplinary care", ar: "العلاج الورامي للأمراض الخبيثة للمنصف بما في ذلك الرعاية متعددة التخصصات" },
    { topic: "Disorders of the Mediastinum", section: 1, en: "surgical techniques for the treatment of myasthenia gravis, mediastinal cysts and tumours, complications and results", ar: "التقنيات الجراحية لعلاج الوهن العضلي الوبيل وكيسات وأورام المنصف والمضاعفات والنتائج" },
    { topic: "Disorders of the Mediastinum", section: 1, en: "retrosternal goitre and its management", ar: "الدُّراق خلف القصي وتدبيره" },
    { topic: "Disorders of the Mediastinum", section: 1, en: "clinical history and examination", ar: "التاريخ المرضي والفحص السريري" },
    { topic: "Disorders of the Mediastinum", section: 1, en: "interpretation of laboratory, physiological and imaging techniques", ar: "تفسير التقنيات المخبرية والفسيولوجية والتصويرية" },
    { topic: "Disorders of the Mediastinum", section: 1, en: "patient selection with assessment of function and risk", ar: "اختيار المريض مع تقييم الوظيفة والمخاطر" },
    { topic: "Disorders of the Mediastinum", section: 1, en: "post-operative management of patients including recognition and management of post-operative complications", ar: "التدبير بعد الجراحة للمرضى بما في ذلك التعرف على مضاعفات ما بعد الجراحة وتدبيرها" },
    { topic: "Disorders of the Mediastinum", section: 2, en: "biopsy of mediastinal masses using appropriate techniques", ar: "خزعة كتل المنصف باستخدام التقنيات المناسبة" },
    { topic: "Disorders of the Mediastinum", section: 2, en: "excision of the thymus", ar: "استئصال الغدة التوتية" },
    { topic: "Disorders of the Mediastinum", section: 2, en: "isolated resection of mediastinal cysts and tumours", ar: "الاستئصال المعزول لكيسات وأورام المنصف" },
    { topic: "Disorders of the Mediastinum", section: 2, en: "resection of mediastinal cysts and tumours, including extended resections involving adjacent structures", ar: "استئصال كيسات وأورام المنصف بما في ذلك الاستئصالات الموسعة التي تشمل البنى المجاورة" },
    // ── 16. Disorders of the Airway ──
    { topic: "Disorders of the Airway", section: 1, en: "anatomy of the larynx, trachea and bronchus", ar: "تشريح الحنجرة والرغامى والقصبة" },
    { topic: "Disorders of the Airway", section: 1, en: "physiology of the normal airway", ar: "فسيولوجيا مجرى الهواء الطبيعي" },
    { topic: "Disorders of the Airway", section: 1, en: "pathophysiology of disease and its effects on lung function", ar: "الفيزيولوجيا المرضية للمرض وتأثيراته على وظيفة الرئة" },
    { topic: "Disorders of the Airway", section: 1, en: "endoscopic appearances in health and disease", ar: "المظاهر التنظيرية في الصحة والمرض" },
    { topic: "Disorders of the Airway", section: 1, en: "congenital, inflammatory, infective, benign and neoplastic diseases of the airways", ar: "الأمراض الخلقية والالتهابية والعدوائية والحميدة والورمية لمجاري الهواء" },
    { topic: "Disorders of the Airway", section: 1, en: "symptoms, signs of airway disease", ar: "أعراض وعلامات أمراض مجرى الهواء" },
    { topic: "Disorders of the Airway", section: 1, en: "clinical, physiological and imaging tests undertaken to diagnose and assess airway disease", ar: "الفحوص السريرية والفسيولوجية والتصويرية لتشخيص وتقييم أمراض مجرى الهواء" },
    { topic: "Disorders of the Airway", section: 1, en: "techniques for surgical resection of the trachea", ar: "تقنيات الاستئصال الجراحي للرغامى" },
    { topic: "Disorders of the Airway", section: 1, en: "bronchoplastic procedures and the limitations of these techniques", ar: "إجراءات رأب القصبات وحدود هذه التقنيات" },
    { topic: "Disorders of the Airway", section: 1, en: "medical and oncological treatments available to deal with airway diseases", ar: "العلاجات الطبية والورامية المتاحة للتعامل مع أمراض مجرى الهواء" },
    { topic: "Disorders of the Airway", section: 1, en: "endoscopic techniques used to deal with benign and malignant conditions, including disobliteration and stenting", ar: "التقنيات التنظيرية المستخدمة للتعامل مع الحالات الحميدة والخبيثة بما في ذلك إزالة الانسداد ووضع الدعامات" },
    { topic: "Disorders of the Airway", section: 1, en: "presentation, investigation and management of anastomotic complications following airway surgery", ar: "أعراض وفحص وتدبير مضاعفات المفاغرة بعد جراحة مجرى الهواء" },
    { topic: "Disorders of the Airway", section: 1, en: "presentation, evaluation and treatment of fistulae in the aerodigestive tract, due to benign, malignant and iatrogenic causes", ar: "أعراض وتقييم وعلاج النواسير في السبيل الهوائي الهضمي الناتجة عن أسباب حميدة وخبيثة وعلاجية المنشأ" },
    { topic: "Disorders of the Airway", section: 1, en: "role of open and endoscopic procedures in dealing with problems", ar: "دور الإجراءات المفتوحة والتنظيرية في التعامل مع المشاكل" },
    { topic: "Disorders of the Airway", section: 1, en: "clinical history and examination", ar: "التاريخ المرضي والفحص السريري" },
    { topic: "Disorders of the Airway", section: 1, en: "interpretation of laboratory, physiological and imaging techniques", ar: "تفسير التقنيات المخبرية والفسيولوجية والتصويرية" },
    { topic: "Disorders of the Airway", section: 1, en: "recognition, diagnosis and assessment of airway obstruction", ar: "التعرف على انسداد مجرى الهواء وتشخيصه وتقييمه" },
    { topic: "Disorders of the Airway", section: 1, en: "patient selection with assessment of function and risk", ar: "اختيار المريض مع تقييم الوظيفة والمخاطر" },
    { topic: "Disorders of the Airway", section: 1, en: "post-operative care of patients making an uncomplicated recovery from major airway surgery", ar: "الرعاية بعد الجراحة للمرضى في التعافي غير المعقد بعد جراحة مجرى الهواء الكبرى" },
    { topic: "Disorders of the Airway", section: 1, en: "post-operative care of patients making a complicated recovery from airway surgery", ar: "الرعاية بعد الجراحة للمرضى في التعافي المعقد بعد جراحة مجرى الهواء" },
    { topic: "Disorders of the Airway", section: 2, en: "endoscopic assessment of a patient with airways disease", ar: "التقييم التنظيري للمريض المصاب بأمراض مجاري الهواء" },
    { topic: "Disorders of the Airway", section: 2, en: "sleeve resection of the trachea for simple benign conditions", ar: "الاستئصال الكُمّي للرغامى للحالات الحميدة البسيطة" },
    { topic: "Disorders of the Airway", section: 2, en: "sleeve resection of the main bronchi, including lobectomy where appropriate, for malignant disease", ar: "الاستئصال الكُمّي للقصبات الرئيسية بما في ذلك استئصال الفص عند الاقتضاء للأمراض الخبيثة" },
    { topic: "Disorders of the Airway", section: 2, en: "techniques for the relief of major airways obstruction including stenting", ar: "تقنيات تخفيف انسداد مجاري الهواء الكبرى بما في ذلك وضع الدعامات" },
    { topic: "Disorders of the Airway", section: 2, en: "airway resection for tumours and complex benign conditions and techniques for airway reconstruction and anastomosis", ar: "استئصال مجرى الهواء للأورام والحالات الحميدة المعقدة وتقنيات إعادة بناء مجرى الهواء والمفاغرة" },
    { topic: "Disorders of the Airway", section: 2, en: "repeat resections for recurrence and the complications of prior resection", ar: "الاستئصالات المتكررة للنكس ومضاعفات الاستئصال السابق" },
    { topic: "Disorders of the Airway", section: 2, en: "management of fistulae in the aerodigestive tract by surgical and endoscopic techniques", ar: "تدبير النواسير في السبيل الهوائي الهضمي بالتقنيات الجراحية والتنظيرية" },
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
        AND lt."title" IN ('Disorders of the Chest Wall', 'Disorders of the Diaphragm', 'Emphysema and Bullae', 'Disorders of the Pericardium', 'Disorders of the Mediastinum', 'Disorders of the Airway')
    `);
  }
}
