import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * GS academic lectures — ISCP General Surgery Curriculum (Aug 2021), Appendix 2.
 * Part 3 (final): topics 7–11 (Endocrine, Transplantation, Vascular, Remote & Rural, Trauma). Topics
 * were created in migration 197; this adds their lectures. section 1 = KNOWLEDGE/CLINICAL syllabus
 * items, section 2 = TECHNICAL SKILLS. `level` = NULL (MSc/MD not derivable from ISCP — sourced
 * later). Faithful transcription; nothing invented.
 */
export class AuthorGsLecturesEndocrineTransplantVascularRemoteTrauma1750000000199 implements MigrationInterface {
  name = "AuthorGsLecturesEndocrineTransplantVascularRemoteTrauma1750000000199";

  private readonly TOPIC_INDEX: Record<string, number> = {
    "endocrine surgery": 7,
    "transplantation surgery": 8,
    "vascular surgery": 9,
    "remote and rural surgery": 10,
    "trauma surgery": 11,
  };

  private readonly LECTURES: Array<{ topic: string; section: 1 | 2; en: string; ar: string }> = [
    // ── 7. endocrine surgery ──
    { topic: "endocrine surgery", section: 1, en: "thyroid", ar: "الغدة الدرقية" },
    { topic: "endocrine surgery", section: 1, en: "parathyroid", ar: "الغدة جارة الدرقية" },
    { topic: "endocrine surgery", section: 1, en: "adrenal", ar: "الغدة الكظرية" },
    { topic: "endocrine surgery", section: 1, en: "pancreatic endocrine", ar: "الغدد الصماء البنكرياسية" },
    { topic: "endocrine surgery", section: 1, en: "genetic syndromes", ar: "المتلازمات الوراثية" },
    { topic: "endocrine surgery", section: 2, en: "thyroid lobectomy", ar: "استئصال فص الغدة الدرقية" },
    { topic: "endocrine surgery", section: 2, en: "subtotal thyroidectomy", ar: "استئصال الغدة الدرقية شبه الكلي" },
    { topic: "endocrine surgery", section: 2, en: "total thyroidectomy", ar: "استئصال الغدة الدرقية الكلي" },
    { topic: "endocrine surgery", section: 2, en: "thyroidectomy - toxic goitre", ar: "استئصال الغدة الدرقية - الدراق السمي" },
    { topic: "endocrine surgery", section: 2, en: "thyroidectomy - total + cervical node dissection - central and lateral compartments", ar: "استئصال الغدة الدرقية - الكلي مع تشريح العقد العنقية - الحجرتان المركزية والجانبية" },
    { topic: "endocrine surgery", section: 2, en: "thyroid surgery - reoperation", ar: "جراحة الغدة الدرقية - إعادة الجراحة" },
    { topic: "endocrine surgery", section: 2, en: "cervical approach to retrosternal goitre", ar: "المدخل العنقي للدراق خلف القص" },
    { topic: "endocrine surgery", section: 2, en: "sternotomy for retrosternal goitre", ar: "شق القص للدراق خلف القص" },
    { topic: "endocrine surgery", section: 2, en: "thymectomy - transcervical approach", ar: "استئصال التوتة - المدخل عبر العنق" },
    { topic: "endocrine surgery", section: 2, en: "direct laryngoscopy", ar: "تنظير الحنجرة المباشر" },
    { topic: "endocrine surgery", section: 2, en: "parathyroidectomy", ar: "استئصال الغدة جارة الدرقية" },
    { topic: "endocrine surgery", section: 2, en: "parathyroid surgery - reoperation", ar: "جراحة الغدة جارة الدرقية - إعادة الجراحة" },
    { topic: "endocrine surgery", section: 2, en: "laparoscopic/retroperitoneal adrenalectomy", ar: "استئصال الكظر بالمنظار / خلف الصفاق" },
    { topic: "endocrine surgery", section: 2, en: "open adrenalectomy", ar: "استئصال الكظر المفتوح" },

    // ── 8. transplantation surgery ──
    { topic: "transplantation surgery", section: 1, en: "access for dialysis", ar: "الوصول لغسيل الكلى" },
    { topic: "transplantation surgery", section: 1, en: "kidney transplant", ar: "زرع الكلى" },
    { topic: "transplantation surgery", section: 1, en: "paediatric kidney transplantation", ar: "زرع الكلى للأطفال" },
    { topic: "transplantation surgery", section: 1, en: "principles of transplantation", ar: "مبادئ زرع الأعضاء" },
    { topic: "transplantation surgery", section: 1, en: "pancreatic transplantation", ar: "زرع البنكرياس" },
    { topic: "transplantation surgery", section: 1, en: "liver transplantation", ar: "زرع الكبد" },
    { topic: "transplantation surgery", section: 1, en: "organ retrieval", ar: "استرجاع الأعضاء" },
    { topic: "transplantation surgery", section: 2, en: "insert central venous dialysis catheter (tunnelled)", ar: "إدخال قسطرة غسيل الكلى الوريدية المركزية (المنفقة)" },
    { topic: "transplantation surgery", section: 2, en: "insert and remove peritoneal catheters", ar: "إدخال وإزالة القساطر البريتونية" },
    { topic: "transplantation surgery", section: 2, en: "a-v fistula ligation", ar: "ربط الناسور الشرياني الوريدي" },
    { topic: "transplantation surgery", section: 2, en: "construct a-v fistula - radio-cephalic, brachio-cephalic, brachio-basilic, basilic vein transposition", ar: "تكوين الناسور الشرياني الوريدي - الكعبري الرأسي والعضدي الرأسي والعضدي القاعدي ونقل الوريد القاعدي" },
    { topic: "transplantation surgery", section: 2, en: "access - secondary vascular", ar: "الوصول - الوعائي الثانوي" },
    { topic: "transplantation surgery", section: 2, en: "upper & lower limb ptfe graft", ar: "طعم PTFE للطرف العلوي والسفلي" },
    { topic: "transplantation surgery", section: 2, en: "on-table fistulogram/plasty", ar: "تصوير / رأب الناسور على الطاولة" },
    { topic: "transplantation surgery", section: 2, en: "graft thrombectomy and revision", ar: "استئصال خثرة الطعم ومراجعته" },
    { topic: "transplantation surgery", section: 2, en: "ligation and excision of fistula / graft", ar: "ربط واستئصال الناسور / الطعم" },
    { topic: "transplantation surgery", section: 2, en: "management of steal syndrome", ar: "تدبير متلازمة السرقة" },
    { topic: "transplantation surgery", section: 2, en: "complex revision procedures", ar: "إجراءات المراجعة المعقدة" },
    { topic: "transplantation surgery", section: 2, en: "kidney transplant - benchwork preparation", ar: "زرع الكلى - التحضير على الطاولة الخلفية" },
    { topic: "transplantation surgery", section: 2, en: "kidney transplant - donor operation - deceased", ar: "زرع الكلى - عملية المتبرع - المتوفى" },
    { topic: "transplantation surgery", section: 2, en: "kidney transplant - donor operation - live donor", ar: "زرع الكلى - عملية المتبرع - المتبرع الحي" },
    { topic: "transplantation surgery", section: 2, en: "kidney transplant - complete operation - deceased donor", ar: "زرع الكلى - العملية الكاملة - المتبرع المتوفى" },
    { topic: "transplantation surgery", section: 2, en: "kidney transplant - complete operation - live donor", ar: "زرع الكلى - العملية الكاملة - المتبرع الحي" },
    { topic: "transplantation surgery", section: 2, en: "kidney transplant - complete operation - regraft on side of previous transplant", ar: "زرع الكلى - العملية الكاملة - إعادة الزرع في جانب الزرع السابق" },
    { topic: "transplantation surgery", section: 2, en: "paediatric kidney transplant (live donor and deceased donor)", ar: "زرع الكلى للأطفال (متبرع حي ومتبرع متوفى)" },
    { topic: "transplantation surgery", section: 2, en: "pancreas transplant - benchwork preparation of pancreas for implantation", ar: "زرع البنكرياس - التحضير على الطاولة الخلفية للبنكرياس للزرع" },
    { topic: "transplantation surgery", section: 2, en: "pancreatic transplant - donor pancreatectomy", ar: "زرع البنكرياس - استئصال بنكرياس المتبرع" },
    { topic: "transplantation surgery", section: 2, en: "pancreatic transplant - implant graft", ar: "زرع البنكرياس - زرع الطعم" },
    { topic: "transplantation surgery", section: 2, en: "bench preparation of liver allograft for implantation", ar: "التحضير على الطاولة الخلفية للطعم الكبدي للزرع" },
    { topic: "transplantation surgery", section: 2, en: "recipient hepatectomy", ar: "استئصال كبد المتلقي" },
    { topic: "transplantation surgery", section: 2, en: "deceased donor liver transplant (implantation)", ar: "زرع كبد المتبرع المتوفى (الزرع)" },
    { topic: "transplantation surgery", section: 2, en: "living donor liver transplant (implantation)", ar: "زرع كبد المتبرع الحي (الزرع)" },
    { topic: "transplantation surgery", section: 2, en: "re-do deceased liver transplant", ar: "إعادة زرع كبد المتبرع المتوفى" },
    { topic: "transplantation surgery", section: 2, en: "liver resection", ar: "استئصال الكبد" },
    { topic: "transplantation surgery", section: 2, en: "kidney retrieval - donor: deceased", ar: "استرجاع الكلى - المتبرع: المتوفى" },
    { topic: "transplantation surgery", section: 2, en: "kidney retrieval - donor: live", ar: "استرجاع الكلى - المتبرع: الحي" },
    { topic: "transplantation surgery", section: 2, en: "liver retrieval - donation after brain death (dbd)", ar: "استرجاع الكبد - التبرع بعد الموت الدماغي (DBD)" },
    { topic: "transplantation surgery", section: 2, en: "liver retrieval - donation after circulatory death (dcd)", ar: "استرجاع الكبد - التبرع بعد الموت الدوري (DCD)" },
    { topic: "transplantation surgery", section: 2, en: "pancreas retrieval - donation after brain death (dbd)", ar: "استرجاع البنكرياس - التبرع بعد الموت الدماغي (DBD)" },
    { topic: "transplantation surgery", section: 2, en: "pancreas retrieval - donation after cardiac death (dcd)", ar: "استرجاع البنكرياس - التبرع بعد الموت القلبي (DCD)" },
    { topic: "transplantation surgery", section: 2, en: "multiorgan retrieval after brain death (dbd)", ar: "استرجاع الأعضاء المتعددة بعد الموت الدماغي (DBD)" },

    // ── 9. vascular surgery ──
    { topic: "vascular surgery", section: 1, en: "exposure and control of major peripheral arteries", ar: "كشف والسيطرة على الشرايين الطرفية الكبرى" },
    { topic: "vascular surgery", section: 2, en: "exposure and control of major peripheral arteries", ar: "كشف والسيطرة على الشرايين الطرفية الكبرى" },
    { topic: "vascular surgery", section: 2, en: "basic techniques for repair of major peripheral arteries", ar: "التقنيات الأساسية لإصلاح الشرايين الطرفية الكبرى" },
    { topic: "vascular surgery", section: 2, en: "shunting", ar: "التحويلة" },

    // ── 10. remote and rural surgery ──
    { topic: "remote and rural surgery", section: 1, en: "management of head injured patients", ar: "تدبير مرضى إصابات الرأس" },
    { topic: "remote and rural surgery", section: 1, en: "facial fractures", ar: "كسور الوجه" },
    { topic: "remote and rural surgery", section: 1, en: "obstetrics", ar: "التوليد" },
    { topic: "remote and rural surgery", section: 1, en: "gynaecology", ar: "أمراض النساء" },
    { topic: "remote and rural surgery", section: 1, en: "ophthalmology", ar: "طب العيون" },
    { topic: "remote and rural surgery", section: 1, en: "paediatric otolaryngology", ar: "طب أنف وأذن وحنجرة الأطفال" },
    { topic: "remote and rural surgery", section: 1, en: "head and neck", ar: "الرأس والرقبة" },
    { topic: "remote and rural surgery", section: 1, en: "otology", ar: "طب الأذن" },
    { topic: "remote and rural surgery", section: 1, en: "rhinology", ar: "طب الأنف" },
    { topic: "remote and rural surgery", section: 1, en: "plastic surgery", ar: "الجراحة التجميلية" },
    { topic: "remote and rural surgery", section: 1, en: "trauma", ar: "الإصابات" },
    { topic: "remote and rural surgery", section: 1, en: "orthopaedics", ar: "جراحة العظام" },
    { topic: "remote and rural surgery", section: 1, en: "stone disease", ar: "مرض الحصوات" },
    { topic: "remote and rural surgery", section: 1, en: "urinary tract obstruction", ar: "انسداد المسالك البولية" },
    { topic: "remote and rural surgery", section: 1, en: "urinary tract infections", ar: "عداوى المسالك البولية" },
    { topic: "remote and rural surgery", section: 1, en: "urological oncology", ar: "أورام المسالك البولية" },
    { topic: "remote and rural surgery", section: 1, en: "andrology", ar: "طب الذكورة" },
    { topic: "remote and rural surgery", section: 1, en: "emergency urology", ar: "طوارئ المسالك البولية" },
    { topic: "remote and rural surgery", section: 1, en: "trauma to the urinary tract", ar: "إصابات المسالك البولية" },
    { topic: "remote and rural surgery", section: 2, en: "craniotomy for supratentorial extradural haematoma", ar: "بضع القحف للورم الدموي فوق الجافية فوق الخيمة" },
    { topic: "remote and rural surgery", section: 2, en: "closed manipulation of nasal bones and septum", ar: "الرد المغلق لعظام الأنف والحاجز" },
    { topic: "remote and rural surgery", section: 2, en: "emergency lscs", ar: "العملية القيصرية الطارئة" },
    { topic: "remote and rural surgery", section: 2, en: "manual removal of retained placenta", ar: "الإزالة اليدوية للمشيمة المحتبسة" },
    { topic: "remote and rural surgery", section: 2, en: "exploration of genital tract, cervical laceration repair", ar: "استكشاف القناة التناسلية وإصلاح تمزق عنق الرحم" },
    { topic: "remote and rural surgery", section: 2, en: "eua, repair perineal trauma", ar: "الفحص تحت التخدير وإصلاح إصابة العجان" },
    { topic: "remote and rural surgery", section: 2, en: "evacuation of retained products of conception", ar: "إخلاء نواتج الحمل المحتبسة" },
    { topic: "remote and rural surgery", section: 2, en: "laparoscopic and open salpingectomy for ectopic pregnancy", ar: "استئصال البوق بالمنظار والمفتوح للحمل خارج الرحم" },
    { topic: "remote and rural surgery", section: 2, en: "diagnostic laparoscopy", ar: "تنظير البطن التشخيصي" },
    { topic: "remote and rural surgery", section: 2, en: "laparoscopy and open oophorectomy for torsion", ar: "استئصال المبيض بالمنظار والمفتوح للانفتال" },
    { topic: "remote and rural surgery", section: 2, en: "nasal cautery", ar: "كي الأنف" },
    { topic: "remote and rural surgery", section: 2, en: "eua nose", ar: "الفحص تحت التخدير للأنف" },
    { topic: "remote and rural surgery", section: 2, en: "appropriate nasal packing in a child", ar: "الحشو الأنفي الملائم لدى الطفل" },
    { topic: "remote and rural surgery", section: 2, en: "endotracheal intubation", ar: "التنبيب الرغامي" },
    { topic: "remote and rural surgery", section: 2, en: "suturing of pinna", ar: "خياطة صيوان الأذن" },
    { topic: "remote and rural surgery", section: 2, en: "split skin graft", ar: "طعم الجلد المنقسم" },
    { topic: "remote and rural surgery", section: 2, en: "manipulation under anaesthetic of appropriate fracture", ar: "الرد تحت التخدير للكسر المناسب" },
    { topic: "remote and rural surgery", section: 2, en: "reduction of dislocations dependent on site", ar: "رد الخلوع حسب الموقع" },
    { topic: "remote and rural surgery", section: 2, en: "trigger finger release", ar: "تحرير الإصبع القافزة" },
    { topic: "remote and rural surgery", section: 2, en: "aspiration / injection of knee joint", ar: "شفط / حقن مفصل الركبة" },
    { topic: "remote and rural surgery", section: 2, en: "ingrowing toenail operation", ar: "عملية ظفر القدم الغائر" },
    { topic: "remote and rural surgery", section: 2, en: "endoscopic fragmentation of bladder calculi", ar: "التفتيت التنظيري لحصوات المثانة" },
    { topic: "remote and rural surgery", section: 2, en: "open removal of bladder calculi", ar: "الإزالة المفتوحة لحصوات المثانة" },
    { topic: "remote and rural surgery", section: 2, en: "rigid cystoscopy, retrograde ureterogram, insertion of jj stent", ar: "تنظير المثانة الصلب وتصوير الحالب الرجوعي وإدخال دعامة JJ" },
    { topic: "remote and rural surgery", section: 2, en: "bladder neck incision", ar: "شق عنق المثانة" },
    { topic: "remote and rural surgery", section: 2, en: "percutaneous insertion of suprapubic catheter", ar: "الإدخال عبر الجلد للقسطرة فوق العانة" },
    { topic: "remote and rural surgery", section: 2, en: "optical urethrotomy", ar: "بضع الإحليل البصري" },
    { topic: "remote and rural surgery", section: 2, en: "turp", ar: "استئصال البروستاتا عبر الإحليل" },
    { topic: "remote and rural surgery", section: 2, en: "flexible cystoscopy", ar: "تنظير المثانة المرن" },
    { topic: "remote and rural surgery", section: 2, en: "trus & biopsy", ar: "الأمواج فوق الصوتية عبر المستقيم والخزعة" },
    { topic: "remote and rural surgery", section: 2, en: "cystoscopy and biopsy", ar: "تنظير المثانة والخزعة" },
    { topic: "remote and rural surgery", section: 2, en: "cystoscopy and diathermy of bladder lesion", ar: "تنظير المثانة والكي الكهربائي لآفة المثانة" },
    { topic: "remote and rural surgery", section: 2, en: "vasectomy", ar: "قطع القناة الناقلة (المنوية)" },
    { topic: "remote and rural surgery", section: 2, en: "surgical exploration for torsion of testis, with fixation", ar: "الاستكشاف الجراحي لانفتال الخصية مع التثبيت" },
    { topic: "remote and rural surgery", section: 2, en: "circumcision", ar: "الختان" },

    // ── 11. trauma surgery ──
    { topic: "trauma surgery", section: 1, en: "general principles", ar: "المبادئ العامة" },
    { topic: "trauma surgery", section: 1, en: "abdomen and thorax", ar: "البطن والصدر" },
    { topic: "trauma surgery", section: 1, en: "head and neck", ar: "الرأس والرقبة" },
    { topic: "trauma surgery", section: 1, en: "extremity and soft tissue trauma", ar: "إصابات الأطراف والأنسجة الرخوة" },
    { topic: "trauma surgery", section: 1, en: "vascular trauma", ar: "إصابات الأوعية الدموية" },
    { topic: "trauma surgery", section: 1, en: "system specific trauma", ar: "الإصابات الخاصة بالأجهزة" },
    { topic: "trauma surgery", section: 1, en: "ongoing care of injured patients", ar: "الرعاية المستمرة للمرضى المصابين" },
    { topic: "trauma surgery", section: 1, en: "trauma system management", ar: "إدارة نظام الإصابات" },
    { topic: "trauma surgery", section: 2, en: "arrest haemorrhage by suture/ligation/packing", ar: "إيقاف النزف بالخياطة / الربط / الحشو" },
    { topic: "trauma surgery", section: 2, en: "chest drain insertion", ar: "إدخال أنبوب تصريف الصدر" },
    { topic: "trauma surgery", section: 2, en: "lateral thoracotomy", ar: "بضع الصدر الجانبي" },
    { topic: "trauma surgery", section: 2, en: "median sternotomy", ar: "شق القص الناصف" },
    { topic: "trauma surgery", section: 2, en: "clamshell thoracotomy", ar: "بضع الصدر المحاري" },
    { topic: "trauma surgery", section: 2, en: "hilar control of massive pulmonary haemorrhage", ar: "السيطرة على السرة الرئوية للنزف الرئوي الجسيم" },
    { topic: "trauma surgery", section: 2, en: "non-segmental lung resection", ar: "استئصال الرئة غير القطعي" },
    { topic: "trauma surgery", section: 2, en: "pulmonary tractotomy using staplers", ar: "بضع مسار الرئة باستخدام المدبسات" },
    { topic: "trauma surgery", section: 2, en: "pericardotomy", ar: "بضع التامور" },
    { topic: "trauma surgery", section: 2, en: "control and suture of myocardial laceration", ar: "السيطرة على تمزق عضلة القلب وخياطته" },
    { topic: "trauma surgery", section: 2, en: "laparotomy - trauma", ar: "فتح البطن - الإصابة" },
    { topic: "trauma surgery", section: 2, en: "packing / debridement of liver trauma", ar: "حشو / تنضير إصابة الكبد" },
    { topic: "trauma surgery", section: 2, en: "splenectomy", ar: "استئصال الطحال" },
    { topic: "trauma surgery", section: 2, en: "splenic repair", ar: "إصلاح الطحال" },
    { topic: "trauma surgery", section: 2, en: "small bowel resection", ar: "استئصال الأمعاء الدقيقة" },
    { topic: "trauma surgery", section: 2, en: "distal pancreatectomy", ar: "استئصال البنكرياس البعيد" },
    { topic: "trauma surgery", section: 2, en: "pancreatic debridement and drainage", ar: "تنضير البنكرياس وتصريفه" },
    { topic: "trauma surgery", section: 2, en: "mobilisation and repair of the duodenum", ar: "تحرير وإصلاح الاثني عشر" },
    { topic: "trauma surgery", section: 2, en: "medial rotation of left hemicolon and colectomy when appropriate", ar: "التدوير الإنسي للقولون الأيسر واستئصاله عند الاقتضاء" },
    { topic: "trauma surgery", section: 2, en: "medial rotation of right hemicolon and colectomy when appropriate", ar: "التدوير الإنسي للقولون الأيمن واستئصاله عند الاقتضاء" },
    { topic: "trauma surgery", section: 2, en: "hartmann's procedure", ar: "عملية هارتمان" },
    { topic: "trauma surgery", section: 2, en: "nephrectomy", ar: "استئصال الكلية" },
    { topic: "trauma surgery", section: 2, en: "bladder repair", ar: "إصلاح المثانة" },
    { topic: "trauma surgery", section: 2, en: "stoma formation", ar: "تكوين الفغرة" },
    { topic: "trauma surgery", section: 2, en: "temporary abdominal closure - bogota bag or topical negative pressure dressing", ar: "الإغلاق البطني المؤقت - كيس بوغوتا أو ضمادة الضغط السلبي الموضعي" },
    { topic: "trauma surgery", section: 2, en: "exposure, control and repair of vascular, airway or gi tract structures in the neck", ar: "كشف والسيطرة وإصلاح الأبنية الوعائية أو الهوائية أو الهضمية في الرقبة" },
    { topic: "trauma surgery", section: 2, en: "cricothyroidotomy", ar: "بضع الغشاء الحلقي الدرقي" },
    { topic: "trauma surgery", section: 2, en: "formal tracheostomy", ar: "فغر الرغامى الرسمي" },
    { topic: "trauma surgery", section: 2, en: "burr holes", ar: "ثقوب النقب" },
    { topic: "trauma surgery", section: 2, en: "craniotomy/craniectomy", ar: "بضع القحف / استئصال القحف" },
    { topic: "trauma surgery", section: 2, en: "evacuation of extradural/subdural haematoma", ar: "إخلاء الورم الدموي فوق / تحت الجافية" },
    { topic: "trauma surgery", section: 2, en: "debridement of injured brain", ar: "تنضير المخ المصاب" },
    { topic: "trauma surgery", section: 2, en: "lateral canthotomy for orbital decompression", ar: "بضع الملتقى الجفني الجانبي لتخفيف ضغط الحجاج" },
    { topic: "trauma surgery", section: 2, en: "proximal arterial control - femoral", ar: "السيطرة الشريانية القريبة - الفخذي" },
    { topic: "trauma surgery", section: 2, en: "proximal arterial control - brachial", ar: "السيطرة الشريانية القريبة - العضدي" },
    { topic: "trauma surgery", section: 2, en: "proximal arterial control - subclavian", ar: "السيطرة الشريانية القريبة - تحت الترقوة" },
    { topic: "trauma surgery", section: 2, en: "wound debridement and lavage", ar: "تنضير الجرح وغسله" },
    { topic: "trauma surgery", section: 2, en: "fasciotomy - lower leg", ar: "بضع اللفافة - الساق السفلية" },
    { topic: "trauma surgery", section: 2, en: "fasciotomy - thigh", ar: "بضع اللفافة - الفخذ" },
    { topic: "trauma surgery", section: 2, en: "fasciotomy - upper limb", ar: "بضع اللفافة - الطرف العلوي" },
    { topic: "trauma surgery", section: 2, en: "application of dressings", ar: "تطبيق الضمادات" },
    { topic: "trauma surgery", section: 2, en: "application of topical negative pressure dressings", ar: "تطبيق ضمادات الضغط السلبي الموضعي" },
    { topic: "trauma surgery", section: 2, en: "split skin grafting", ar: "طعم الجلد المنقسم" },
    { topic: "trauma surgery", section: 2, en: "control with compression", ar: "السيطرة بالضغط" },
    { topic: "trauma surgery", section: 2, en: "exposure and control of major vessels - thoracic aorta", ar: "كشف والسيطرة على الأوعية الكبرى - الأبهر الصدري" },
    { topic: "trauma surgery", section: 2, en: "exposure and control of major vessels - abdominal aorta (infra and supra renal)", ar: "كشف والسيطرة على الأوعية الكبرى - الأبهر البطني (تحت وفوق الكلوي)" },
    { topic: "trauma surgery", section: 2, en: "exposure and control of major vessels - subclavian and axillary arteries", ar: "كشف والسيطرة على الأوعية الكبرى - الشريانان تحت الترقوة والإبطي" },
    { topic: "trauma surgery", section: 2, en: "exposure and control of major vessels - femoral and popliteal arteries", ar: "كشف والسيطرة على الأوعية الكبرى - الشريانان الفخذي والمأبضي" },
    { topic: "trauma surgery", section: 2, en: "use of shunts", ar: "استخدام التحويلات" },
    { topic: "trauma surgery", section: 2, en: "ligation", ar: "الربط" },
    { topic: "trauma surgery", section: 2, en: "direct suture repair", ar: "الإصلاح بالخياطة المباشرة" },
    { topic: "trauma surgery", section: 2, en: "end to end anastomosis", ar: "المفاغرة الطرفية الطرفية" },
    { topic: "trauma surgery", section: 2, en: "interposition vein / prosthetic graft", ar: "الطعم الوريدي البيني / الطعم الاصطناعي" },
    { topic: "trauma surgery", section: 2, en: "panel / spiral grafts", ar: "الطعوم اللوحية / الحلزونية" },
    { topic: "trauma surgery", section: 2, en: "fasciotomy", ar: "بضع اللفافة" },
    { topic: "trauma surgery", section: 2, en: "intra-operative imaging techniques", ar: "تقنيات التصوير أثناء الجراحة" },
    { topic: "trauma surgery", section: 2, en: "options for control of bleeding", ar: "خيارات السيطرة على النزف" },
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
        JOIN "departments" d ON d."code" = 'GS'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "lectures" lx
      USING "lecture_topics" lt, "departments" d
      WHERE lx."topicId" = lt."id" AND lt."departmentId" = d."id" AND d."code" = 'GS'
        AND lt."title" IN ('endocrine surgery', 'transplantation surgery', 'vascular surgery', 'remote and rural surgery', 'trauma surgery')
    `);
  }
}
