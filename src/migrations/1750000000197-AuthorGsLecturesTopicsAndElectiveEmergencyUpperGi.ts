import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * GS (General Surgery) academic lectures — transcribed from the ISCP General Surgery Curriculum
 * (Aug 2021, version 2 July 2023), Appendix 2 "General Surgery Syllabus". Reference cited in
 * MEDICAL_CODE_AUDITS/GS/LECTURES_GS.md.
 *
 * Part 1 of the GS lecture set: all 11 ISCP syllabus MODULES (into lecture_topics) + the lectures
 * for topics 1–3 (Elective General Surgery, Emergency General Surgery, Upper Gastrointestinal
 * Surgery). Remaining topics 4–11 follow in migrations 198–199.
 *
 * Faithful transcription of the ISCP syllabus items — nothing invented. Each item is a syllabus
 * KNOWLEDGE/CLINICAL entry (numbered `<topic>.1.<n>`) or TECHNICAL SKILL entry (`<topic>.2.<n>`).
 * **`level` is NULL** on every row: the MSc/MD split is a Cairo-University / Egyptian-bylaw
 * construct that ISCP does not carry, so it is left NULL (to be sourced/filled later) rather than
 * guessed. Bilingual (EN + AR).
 */
export class AuthorGsLecturesTopicsAndElectiveEmergencyUpperGi1750000000197 implements MigrationInterface {
  name = "AuthorGsLecturesTopicsAndElectiveEmergencyUpperGi1750000000197";

  // [englishTopic, arabicTopic] — 11 ISCP Appendix-2 modules, in document order
  private readonly TOPICS: Array<[string, string]> = [
    ["elective general surgery", "الجراحة العامة الاختيارية"],
    ["emergency general surgery", "جراحة الطوارئ العامة"],
    ["upper gastrointestinal surgery", "جراحة الجهاز الهضمي العلوي"],
    ["colorectal surgery", "جراحة القولون والمستقيم"],
    ["general surgery of childhood", "الجراحة العامة للأطفال"],
    ["breast surgery", "جراحة الثدي"],
    ["endocrine surgery", "جراحة الغدد الصماء"],
    ["transplantation surgery", "جراحة زرع الأعضاء"],
    ["vascular surgery", "جراحة الأوعية الدموية"],
    ["remote and rural surgery", "الجراحة في المناطق النائية والريفية"],
    ["trauma surgery", "جراحة الإصابات"],
  ];

  // Lectures for topics 1–3. section 1 = KNOWLEDGE/CLINICAL, section 2 = TECHNICAL SKILLS.
  private readonly LECTURES: Array<{ topic: string; section: 1 | 2; en: string; ar: string }> = [
    // ── 1. elective general surgery ──
    { topic: "elective general surgery", section: 1, en: "skin and subcutaneous tissues", ar: "الجلد والأنسجة تحت الجلد" },
    { topic: "elective general surgery", section: 1, en: "abdominal wall", ar: "جدار البطن" },
    { topic: "elective general surgery", section: 1, en: "reticulo-endothelial system", ar: "الجهاز الشبكي البطاني" },
    { topic: "elective general surgery", section: 1, en: "venous thrombosis and embolism", ar: "الخثار الوريدي والانصمام" },
    { topic: "elective general surgery", section: 1, en: "genetic aspects of surgical disease", ar: "الجوانب الوراثية للأمراض الجراحية" },
    { topic: "elective general surgery", section: 1, en: "generic oncology for surgeons", ar: "علم الأورام العام للجراحين" },
    { topic: "elective general surgery", section: 1, en: "elective hernia", ar: "الفتق الاختياري" },
    { topic: "elective general surgery", section: 1, en: "surgical nutrition", ar: "التغذية الجراحية" },
    { topic: "elective general surgery", section: 1, en: "neck swellings", ar: "تورمات الرقبة" },
    { topic: "elective general surgery", section: 1, en: "breast conditions", ar: "أمراض الثدي" },
    { topic: "elective general surgery", section: 1, en: "multidisciplinary team working", ar: "العمل ضمن فريق متعدد التخصصات" },
    { topic: "elective general surgery", section: 2, en: "punch biopsy", ar: "خزعة الوخز" },
    { topic: "elective general surgery", section: 2, en: "excision of skin and subcutaneous lesions", ar: "استئصال آفات الجلد وتحت الجلد" },
    { topic: "elective general surgery", section: 2, en: "evacuation of haematoma", ar: "إخلاء الورم الدموي" },
    { topic: "elective general surgery", section: 2, en: "biopsy - fna of breast, neck, subcutaneous", ar: "الخزعة - الشفط بالإبرة الدقيقة للثدي والرقبة وتحت الجلد" },
    { topic: "elective general surgery", section: 2, en: "lymph node biopsy - groin, axilla and abdomen", ar: "خزعة العقدة الليمفاوية - الأربية والإبطية والبطنية" },
    { topic: "elective general surgery", section: 2, en: "cervical lymph node biopsy", ar: "خزعة العقدة الليمفاوية العنقية" },
    { topic: "elective general surgery", section: 2, en: "insertion of nasogastric tube and confirmation of position", ar: "إدخال الأنبوب الأنفي المعدي وتأكيد موضعه" },
    { topic: "elective general surgery", section: 2, en: "repair of primary abdominal wall hernias", ar: "إصلاح فتوق جدار البطن الأولية" },
    { topic: "elective general surgery", section: 2, en: "repair of incisional or recurrent hernias", ar: "إصلاح الفتوق الشقية أو الناكسة" },

    // ── 2. emergency general surgery ──
    { topic: "emergency general surgery", section: 1, en: "superficial sepsis including necrotising infections", ar: "الإنتان السطحي بما في ذلك العداوى المنخرة" },
    { topic: "emergency general surgery", section: 1, en: "breast infections", ar: "عداوى الثدي" },
    { topic: "emergency general surgery", section: 1, en: "acute abdomen", ar: "البطن الحاد" },
    { topic: "emergency general surgery", section: 1, en: "emergency surgical ambulatory care", ar: "الرعاية الجراحية الإسعافية الطارئة" },
    { topic: "emergency general surgery", section: 1, en: "acute appendicitis", ar: "التهاب الزائدة الدودية الحاد" },
    { topic: "emergency general surgery", section: 1, en: "obstructed and strangulated hernia", ar: "الفتق المنحبس والمختنق" },
    { topic: "emergency general surgery", section: 1, en: "gastrointestinal bleeding", ar: "نزف الجهاز الهضمي" },
    { topic: "emergency general surgery", section: 1, en: "shock", ar: "الصدمة" },
    { topic: "emergency general surgery", section: 1, en: "complications of abdominal surgery", ar: "مضاعفات جراحة البطن" },
    { topic: "emergency general surgery", section: 1, en: "abdominal pain in childhood", ar: "ألم البطن في الطفولة" },
    { topic: "emergency general surgery", section: 1, en: "intussusception", ar: "الانغلاف المعوي" },
    { topic: "emergency general surgery", section: 1, en: "acute groin and scrotal conditions in childhood", ar: "حالات الأربية والصفن الحادة في الطفولة" },
    { topic: "emergency general surgery", section: 1, en: "acute dysphagia", ar: "عسر البلع الحاد" },
    { topic: "emergency general surgery", section: 1, en: "oesophageal varices", ar: "دوالي المريء" },
    { topic: "emergency general surgery", section: 1, en: "oesophageal perforation including boerhaave's", ar: "انثقاب المريء بما في ذلك متلازمة بورهاف" },
    { topic: "emergency general surgery", section: 1, en: "acute gastric dilation", ar: "التوسع المعدي الحاد" },
    { topic: "emergency general surgery", section: 1, en: "acute perforation", ar: "الانثقاب الحاد" },
    { topic: "emergency general surgery", section: 1, en: "acute gastric volvulus", ar: "الانفتال المعدي الحاد" },
    { topic: "emergency general surgery", section: 1, en: "gallstone disease", ar: "مرض الحصوات المرارية" },
    { topic: "emergency general surgery", section: 1, en: "acute pancreatitis", ar: "التهاب البنكرياس الحاد" },
    { topic: "emergency general surgery", section: 1, en: "chronic pancreatitis", ar: "التهاب البنكرياس المزمن" },
    { topic: "emergency general surgery", section: 1, en: "peri-anal sepsis", ar: "الإنتان حول الشرج" },
    { topic: "emergency general surgery", section: 1, en: "acute painful peri-anal conditions", ar: "الحالات المؤلمة الحادة حول الشرج" },
    { topic: "emergency general surgery", section: 1, en: "acute colonic diverticulitis", ar: "التهاب الرتوج القولونية الحاد" },
    { topic: "emergency general surgery", section: 1, en: "colonic volvulus", ar: "الانفتال القولوني" },
    { topic: "emergency general surgery", section: 1, en: "acute colitis", ar: "التهاب القولون الحاد" },
    { topic: "emergency general surgery", section: 1, en: "emergency aneurysm disease", ar: "مرض أم الدم الطارئ" },
    { topic: "emergency general surgery", section: 1, en: "mesenteric vascular disease", ar: "المرض الوعائي المساريقي" },
    { topic: "emergency general surgery", section: 1, en: "acute limb ischaemia", ar: "إقفار الطرف الحاد" },
    { topic: "emergency general surgery", section: 1, en: "trauma principles", ar: "مبادئ الإصابات" },
    { topic: "emergency general surgery", section: 1, en: "abdomen and thorax trauma", ar: "إصابات البطن والصدر" },
    { topic: "emergency general surgery", section: 1, en: "head and neck trauma", ar: "إصابات الرأس والرقبة" },
    { topic: "emergency general surgery", section: 1, en: "extremity and soft tissue trauma", ar: "إصابات الأطراف والأنسجة الرخوة" },
    { topic: "emergency general surgery", section: 1, en: "vascular trauma", ar: "إصابات الأوعية الدموية" },
    { topic: "emergency general surgery", section: 1, en: "colon trauma", ar: "إصابات القولون" },
    { topic: "emergency general surgery", section: 1, en: "anorectal trauma", ar: "إصابات الشرج والمستقيم" },
    { topic: "emergency general surgery", section: 1, en: "pancreatic trauma", ar: "إصابات البنكرياس" },
    { topic: "emergency general surgery", section: 1, en: "liver trauma", ar: "إصابات الكبد" },
    { topic: "emergency general surgery", section: 2, en: "drainage of superficial sepsis", ar: "تصريف الإنتان السطحي" },
    { topic: "emergency general surgery", section: 2, en: "radical excisional surgery of gas gangrene and necrotising infections", ar: "الجراحة الاستئصالية الجذرية للغنغرينا الغازية والعداوى المنخرة" },
    { topic: "emergency general surgery", section: 2, en: "aspiration of breast abscess", ar: "شفط خراج الثدي" },
    { topic: "emergency general surgery", section: 2, en: "open drainage of breast abscess and/or debridement of soft tissue necrosis", ar: "التصريف المفتوح لخراج الثدي و/أو تنضير نخر الأنسجة الرخوة" },
    { topic: "emergency general surgery", section: 2, en: "removal of infected breast implant", ar: "إزالة زرعة الثدي المصابة بالعدوى" },
    { topic: "emergency general surgery", section: 2, en: "appendicectomy - open and laparoscopic, adult and paediatric", ar: "استئصال الزائدة الدودية - مفتوح وبالمنظار، للبالغين والأطفال" },
    { topic: "emergency general surgery", section: 2, en: "repair of any obstructed or strangulated abdominal hernia, including bowel resection", ar: "إصلاح أي فتق بطني منحبس أو مختنق، بما في ذلك استئصال الأمعاء" },
    { topic: "emergency general surgery", section: 2, en: "operation for testicular torsion, adult and paediatric", ar: "عملية انفتال الخصية، للبالغين والأطفال" },
    { topic: "emergency general surgery", section: 2, en: "laparotomy / laparoscopy and damage limitation surgery", ar: "فتح البطن / تنظير البطن وجراحة الحد من الضرر" },
    { topic: "emergency general surgery", section: 2, en: "salvage surgery e.g. packing", ar: "جراحة الإنقاذ مثل الحشو" },
    { topic: "emergency general surgery", section: 2, en: "wash out by laparoscopy/laparotomy", ar: "الغسل بتنظير البطن / فتح البطن" },
    { topic: "emergency general surgery", section: 2, en: "laparotomy and division of adhesions", ar: "فتح البطن وفصل الالتصاقات" },
    { topic: "emergency general surgery", section: 2, en: "small bowel resection", ar: "استئصال الأمعاء الدقيقة" },
    { topic: "emergency general surgery", section: 2, en: "gastrotomy + non-resectional treatment - histology", ar: "بضع المعدة + العلاج غير الاستئصالي - النسيج المرضي" },
    { topic: "emergency general surgery", section: 2, en: "partial gastrectomy", ar: "استئصال المعدة الجزئي" },
    { topic: "emergency general surgery", section: 2, en: "operative management of perforated viscus including primary closure, resection and stoma formation", ar: "التدبير الجراحي للحشى المنثقب بما في ذلك الإغلاق الأولي والاستئصال وتكوين الفغرة" },
    { topic: "emergency general surgery", section: 2, en: "segmental colectomy", ar: "استئصال القولون القطعي" },
    { topic: "emergency general surgery", section: 2, en: "formation of stoma", ar: "تكوين الفغرة" },
    { topic: "emergency general surgery", section: 2, en: "hartmann's procedure", ar: "عملية هارتمان" },
    { topic: "emergency general surgery", section: 2, en: "re-laparotomy for post-operative complication including damage control, bleeding and anastomotic leak", ar: "إعادة فتح البطن لمضاعفة بعد الجراحة بما في ذلك السيطرة على الضرر والنزف وتسرب المفاغرة" },
    { topic: "emergency general surgery", section: 2, en: "indications for and techniques for laparostomy / open abdomen", ar: "دواعي وتقنيات فغر البطن / البطن المفتوح" },
    { topic: "emergency general surgery", section: 2, en: "formation of feeding enterostomy (open / lap)", ar: "تكوين فغرة الأمعاء للتغذية (مفتوح / بالمنظار)" },
    { topic: "emergency general surgery", section: 2, en: "colon - primary repair", ar: "القولون - الإصلاح الأولي" },
    { topic: "emergency general surgery", section: 2, en: "cholecystectomy - lap / open", ar: "استئصال المرارة - بالمنظار / مفتوح" },
    { topic: "emergency general surgery", section: 2, en: "cholecystostomy", ar: "فغر المرارة" },
    { topic: "emergency general surgery", section: 2, en: "eua, rigid sigmoidoscopy, drain perianal haematoma", ar: "الفحص تحت التخدير وتنظير السين الصلب وتصريف الورم الدموي حول الشرج" },
    { topic: "emergency general surgery", section: 2, en: "insertion of flatus tube", ar: "إدخال أنبوب الريح" },
    { topic: "emergency general surgery", section: 2, en: "chest drain insertion", ar: "إدخال أنبوب تصريف الصدر" },
    { topic: "emergency general surgery", section: 2, en: "operative management of visceral injury including splenic conservation, bowel resection, debridement and formation of stoma where indicated", ar: "التدبير الجراحي لإصابة الأحشاء بما في ذلك الحفاظ على الطحال واستئصال الأمعاء والتنضير وتكوين الفغرة عند الحاجة" },
    { topic: "emergency general surgery", section: 2, en: "splenectomy", ar: "استئصال الطحال" },
    { topic: "emergency general surgery", section: 2, en: "cricothyroidotomy", ar: "بضع الغشاء الحلقي الدرقي" },
    { topic: "emergency general surgery", section: 2, en: "wound debridement and lavage", ar: "تنضير الجرح وغسله" },
    { topic: "emergency general surgery", section: 2, en: "fasciotomy - lower leg", ar: "بضع اللفافة - الساق السفلية" },
    { topic: "emergency general surgery", section: 2, en: "application of dressings including topical negative pressure dressings", ar: "تطبيق الضمادات بما في ذلك ضمادات الضغط السلبي الموضعي" },
    { topic: "emergency general surgery", section: 2, en: "vascular control with compression", ar: "السيطرة الوعائية بالضغط" },

    // ── 3. upper gastrointestinal surgery ──
    { topic: "upper gastrointestinal surgery", section: 1, en: "gastro-oesophageal reflux disease", ar: "مرض الجزر المعدي المريئي" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "hiatus hernia", ar: "الفتق الحجابي" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "achalasia and oesophageal motility disorders", ar: "تعذر الارتخاء واضطرابات حركية المريء" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "oesophageal perforation including boerhaave's (specialist)", ar: "انثقاب المريء بما في ذلك متلازمة بورهاف (تخصصي)" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "oesophageal cancer", ar: "سرطان المريء" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "peptic ulcer (specialist)", ar: "القرحة الهضمية (تخصصي)" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "gastric and duodenal polyps", ar: "سلائل المعدة والاثني عشر" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "acute upper gi haemorrhage (specialist)", ar: "نزف الجهاز الهضمي العلوي الحاد (تخصصي)" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "acute gastric dilation and gastric volvulus (specialist)", ar: "التوسع المعدي الحاد والانفتال المعدي (تخصصي)" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "gastric carcinoma", ar: "سرطان المعدة" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "gist and lymphoma", ar: "الأورام اللحمية المعوية المعدية واللمفوما" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "bariatrics", ar: "جراحة السمنة" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "gallstone disease", ar: "مرض الحصوات المرارية" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "acute pancreatitis (specialist)", ar: "التهاب البنكرياس الحاد (تخصصي)" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "chronic pancreatitis (specialist)", ar: "التهاب البنكرياس المزمن (تخصصي)" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "pancreatic cancer / periampullary cancer", ar: "سرطان البنكرياس / السرطان حول المِعصار" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "other pancreatic tumours", ar: "أورام البنكرياس الأخرى" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "pancreatic trauma (specialist)", ar: "إصابات البنكرياس (تخصصي)" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "liver metastases", ar: "النقائل الكبدية" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "primary liver cancer", ar: "سرطان الكبد الأولي" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "cholangiocarcinoma and gallbladder cancer", ar: "سرطان الأقنية الصفراوية وسرطان المرارة" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "benign and cystic tumours of the liver", ar: "أورام الكبد الحميدة والكيسية" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "liver trauma (specialist)", ar: "إصابات الكبد (تخصصي)" },
    { topic: "upper gastrointestinal surgery", section: 1, en: "endoscopy", ar: "التنظير الداخلي" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "endoscopic treatment of achalasia", ar: "العلاج التنظيري لتعذر الارتخاء" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "endoscopic excision including emr", ar: "الاستئصال التنظيري بما في ذلك الاستئصال المخاطي بالمنظار" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "endoscopic palliation including stenting", ar: "التلطيف التنظيري بما في ذلك وضع الدعامات" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "oesophageal dilatation", ar: "توسيع المريء" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "thoracotomy/thoracoscopy and lavage", ar: "بضع الصدر / تنظير الصدر والغسل" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "laparoscopy", ar: "تنظير البطن" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "oesophagectomy", ar: "استئصال المريء" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "oesophagogastrectomy", ar: "استئصال المريء والمعدة" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "partial gastrectomy", ar: "استئصال المعدة الجزئي" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "total gastrectomy", ar: "استئصال المعدة الكلي" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "antireflux surgery", ar: "جراحة مضادة للجزر" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "revisional antireflux surgery", ar: "جراحة مضادة للجزر مراجعة" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "open or laparoscopic hiatus hernia repair", ar: "إصلاح الفتق الحجابي المفتوح أو بالمنظار" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "cardiomyotomy", ar: "بضع عضلة الفؤاد" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "laparoscopic access in the morbidly obese", ar: "الدخول بالمنظار لدى المصابين بالسمنة المفرطة" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "aspiration of lap band port", ar: "شفط منفذ رباط المعدة" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "emergency release of lap band for slippage", ar: "الإفراج الطارئ عن رباط المعدة عند انزلاقه" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "revisional gastric surgery for obesity", ar: "جراحة المعدة المراجعة للسمنة" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "insertion of lap band", ar: "إدخال رباط المعدة" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "repair of internal hernia after gastric bypass", ar: "إصلاح الفتق الداخلي بعد مجازة المعدة" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "bariatric surgery - all options", ar: "جراحة السمنة - جميع الخيارات" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "general surgery for the super morbidly obese patient", ar: "الجراحة العامة للمريض ذي السمنة المفرطة الشديدة" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "gastrotomy + non-resectional treatment - histology", ar: "بضع المعدة + العلاج غير الاستئصالي - النسيج المرضي" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "surgery for peptic ulcer including resection", ar: "جراحة القرحة الهضمية بما في ذلك الاستئصال" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "open excision of gist", ar: "الاستئصال المفتوح للورم اللحمي المعوي المعدي" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "surgery for polyps including resection, procedure depending on site", ar: "جراحة السلائل بما في ذلك الاستئصال، حسب الموقع" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "small bowel resection", ar: "استئصال الأمعاء الدقيقة" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "gastroenterostomy", ar: "مفاغرة المعدة والأمعاء" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "cholecystectomy - lap / open", ar: "استئصال المرارة - بالمنظار / مفتوح" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "cholecystostomy", ar: "فغر المرارة" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "exploration of cbd", ar: "استكشاف القناة الصفراوية المشتركة" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "biliary bypass", ar: "المجازة الصفراوية" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "pancreatic debridement & drainage", ar: "تنضير البنكرياس وتصريفه" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "distal pancreatectomy", ar: "استئصال البنكرياس البعيد" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "pancreatic enucleation", ar: "استئصال ورم البنكرياس بالتقشير" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "necrosectomy", ar: "استئصال النخر" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "pancreaticoduodenectomy", ar: "استئصال البنكرياس والاثني عشر" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "pancreaticojejunostomy", ar: "مفاغرة البنكرياس والصائم" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "pseudocyst drainage", ar: "تصريف الكيس الكاذب" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "liver debridement & hepatectomy", ar: "تنضير الكبد واستئصال الكبد" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "central liver resection", ar: "استئصال الكبد المركزي" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "extended hepatectomy", ar: "استئصال الكبد الموسع" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "liver resection", ar: "استئصال الكبد" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "peripheral wedge or segmental liver resection", ar: "استئصال الكبد الطرفي الوتدي أو القطعي" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "fenestration of liver cyst", ar: "تنفيس كيسة الكبد" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "hepatic artery lymphadenectomy", ar: "استئصال العقد الليمفاوية للشريان الكبدي" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "hepaticodochojejunostomy", ar: "مفاغرة القناة الكبدية والصائم" },
    { topic: "upper gastrointestinal surgery", section: 2, en: "salvage liver surgery e.g. packing", ar: "جراحة إنقاذ الكبد مثل الحشو" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    // ── Topics (all 11) ──
    const topicRows = this.TOPICS.map(([en, ar], i) => `('${q(en)}', '${q(ar)}', ${i})`).join(",\n        ");
    await queryRunner.query(`
      INSERT INTO "lecture_topics" ("departmentId", "title", "arTitle", "sortOrder")
      SELECT d."id", v.title, v.ar, v.ord
      FROM "departments" d
      CROSS JOIN (VALUES ${topicRows}) AS v(title, ar, ord)
      WHERE d."code" = 'GS'
    `);

    // ── Lectures for topics 1–3 (level NULL) ──
    const topicIndex = new Map(this.TOPICS.map(([en], i) => [en, i + 1]));
    const counters = new Map<string, number>();
    const rows = this.LECTURES.map((l) => {
      const c = topicIndex.get(l.topic)!;
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
        JOIN "departments" d ON d."code" = 'GS'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Deleting the GS topics cascades to their lectures (all GS lecture migrations).
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'GS'
    `);
  }
}
