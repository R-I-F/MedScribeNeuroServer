import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * GS academic lectures — ISCP General Surgery Curriculum (Aug 2021), Appendix 2.
 * Part 2: topics 4–6 (Colorectal Surgery, General Surgery of Childhood, Breast Surgery). Topics
 * were created in migration 197; this adds their lectures. section 1 = KNOWLEDGE/CLINICAL syllabus
 * items, section 2 = TECHNICAL SKILLS. `level` = NULL (MSc/MD not derivable from ISCP — sourced
 * later). Faithful transcription; nothing invented.
 *
 * Note: the ISCP "Gastrointestinal and General Surgery of Childhood" module re-lists Upper-GI +
 * Colorectal items for the childhood pathway; those duplicates are already covered by topics 3–4,
 * so topic 5 carries only the genuinely child-specific objectives + childhood technical skills.
 */
export class AuthorGsLecturesColorectalChildhoodBreast1750000000198 implements MigrationInterface {
  name = "AuthorGsLecturesColorectalChildhoodBreast1750000000198";

  private readonly TOPIC_INDEX: Record<string, number> = {
    "colorectal surgery": 4,
    "general surgery of childhood": 5,
    "breast surgery": 6,
  };

  private readonly LECTURES: Array<{ topic: string; section: 1 | 2; en: string; ar: string }> = [
    // ── 4. colorectal surgery ──
    { topic: "colorectal surgery", section: 1, en: "pilonidal disease", ar: "المرض الشعري (الناسور العصعصي)" },
    { topic: "colorectal surgery", section: 1, en: "benign anal conditions", ar: "الحالات الشرجية الحميدة" },
    { topic: "colorectal surgery", section: 1, en: "benign colorectal conditions", ar: "حالات القولون والمستقيم الحميدة" },
    { topic: "colorectal surgery", section: 1, en: "rectal bleeding", ar: "النزف المستقيمي" },
    { topic: "colorectal surgery", section: 1, en: "anorectal trauma (specialist)", ar: "إصابات الشرج والمستقيم (تخصصي)" },
    { topic: "colorectal surgery", section: 1, en: "colorectal neoplasia", ar: "أورام القولون والمستقيم" },
    { topic: "colorectal surgery", section: 1, en: "rectal neoplasia", ar: "أورام المستقيم" },
    { topic: "colorectal surgery", section: 1, en: "miscellaneous colorectal malignant lesions", ar: "آفات القولون والمستقيم الخبيثة المتنوعة" },
    { topic: "colorectal surgery", section: 1, en: "anal neoplasia", ar: "أورام الشرج" },
    { topic: "colorectal surgery", section: 1, en: "presacral lesions", ar: "الآفات أمام العجز" },
    { topic: "colorectal surgery", section: 1, en: "faecal incontinence", ar: "سلس البراز" },
    { topic: "colorectal surgery", section: 1, en: "rectal prolapse", ar: "هبوط المستقيم" },
    { topic: "colorectal surgery", section: 1, en: "constipation", ar: "الإمساك" },
    { topic: "colorectal surgery", section: 1, en: "irritable bowel syndrome", ar: "متلازمة القولون العصبي" },
    { topic: "colorectal surgery", section: 1, en: "inflammatory bowel disease", ar: "مرض الأمعاء الالتهابي" },
    { topic: "colorectal surgery", section: 1, en: "other colitides", ar: "التهابات القولون الأخرى" },
    { topic: "colorectal surgery", section: 1, en: "stomas", ar: "الفغرات" },
    { topic: "colorectal surgery", section: 1, en: "endoscopy", ar: "التنظير الداخلي" },
    { topic: "colorectal surgery", section: 2, en: "pilonidal sinus - lay open", ar: "الجيب الشعري - الفتح" },
    { topic: "colorectal surgery", section: 2, en: "pilonidal sinus - excision + suture", ar: "الجيب الشعري - الاستئصال والخياطة" },
    { topic: "colorectal surgery", section: 2, en: "pilonidal sinus - graft or flap", ar: "الجيب الشعري - الطعم أو الرفرف" },
    { topic: "colorectal surgery", section: 2, en: "haemorrhoids - outpatient treatment", ar: "البواسير - العلاج في العيادة الخارجية" },
    { topic: "colorectal surgery", section: 2, en: "haemorrhoidectomy - operative treatments", ar: "استئصال البواسير - العلاجات الجراحية" },
    { topic: "colorectal surgery", section: 2, en: "lateral sphincterotomy", ar: "بضع المصرة الجانبي" },
    { topic: "colorectal surgery", section: 2, en: "anal advancement flap", ar: "رفرف التقدم الشرجي" },
    { topic: "colorectal surgery", section: 2, en: "operations for fistula-in-ano including lay open, placement and choice of seton", ar: "عمليات الناسور الشرجي بما في ذلك الفتح ووضع واختيار السيتون" },
    { topic: "colorectal surgery", section: 2, en: "fistula - operation for rectovaginal fistula", ar: "الناسور - عملية الناسور المستقيمي المهبلي" },
    { topic: "colorectal surgery", section: 2, en: "anal skin tags/warts - excision", ar: "الزوائد الجلدية / الثآليل الشرجية - الاستئصال" },
    { topic: "colorectal surgery", section: 2, en: "sigmoidoscopy - rigid", ar: "تنظير السين - الصلب" },
    { topic: "colorectal surgery", section: 2, en: "rectum - operation for trauma", ar: "المستقيم - عملية الإصابة" },
    { topic: "colorectal surgery", section: 2, en: "segmental colectomy", ar: "استئصال القولون القطعي" },
    { topic: "colorectal surgery", section: 2, en: "hartmann's procedure", ar: "عملية هارتمان" },
    { topic: "colorectal surgery", section: 2, en: "hartmann's reversal", ar: "عكس عملية هارتمان" },
    { topic: "colorectal surgery", section: 2, en: "colectomy - total + ileostomy", ar: "استئصال القولون - الكلي مع فغر اللفائفي" },
    { topic: "colorectal surgery", section: 2, en: "colectomy - total + ileorectal anastomosis", ar: "استئصال القولون - الكلي مع مفاغرة اللفائفي المستقيمي" },
    { topic: "colorectal surgery", section: 2, en: "rectum - panproctocolectomy + ileostomy", ar: "المستقيم - استئصال القولون والمستقيم الكامل مع فغر اللفائفي" },
    { topic: "colorectal surgery", section: 2, en: "ileoanal anastomosis + creation of pouch", ar: "مفاغرة اللفائفي الشرجية مع تكوين الكيس" },
    { topic: "colorectal surgery", section: 2, en: "crohn's - ileocaecectomy", ar: "كرون - استئصال اللفائفي والأعور" },
    { topic: "colorectal surgery", section: 2, en: "strictureplasty - crohn's", ar: "رأب التضيق - كرون" },
    { topic: "colorectal surgery", section: 2, en: "en-bloc resections of adjacent organs", ar: "الاستئصال الكتلي للأعضاء المجاورة" },
    { topic: "colorectal surgery", section: 2, en: "extended resections to include total abdominal colectomy", ar: "الاستئصالات الموسعة لتشمل استئصال القولون البطني الكلي" },
    { topic: "colorectal surgery", section: 2, en: "transanal microsurgery", ar: "الجراحة المجهرية عبر الشرج" },
    { topic: "colorectal surgery", section: 2, en: "per anal excision of rectal lesion", ar: "الاستئصال عبر الشرج لآفة المستقيم" },
    { topic: "colorectal surgery", section: 2, en: "rectum - posterior approach", ar: "المستقيم - المدخل الخلفي" },
    { topic: "colorectal surgery", section: 2, en: "rectum - high anterior resection", ar: "المستقيم - الاستئصال الأمامي العالي" },
    { topic: "colorectal surgery", section: 2, en: "rectum - low anterior resection +/- coloanal anastomosis", ar: "المستقيم - الاستئصال الأمامي المنخفض مع أو بدون مفاغرة قولونية شرجية" },
    { topic: "colorectal surgery", section: 2, en: "rectum - ap excision (including elape)", ar: "المستقيم - الاستئصال البطني العجاني (بما في ذلك ELAPE)" },
    { topic: "colorectal surgery", section: 2, en: "posterior pelvic clearance", ar: "التنظيف الحوضي الخلفي" },
    { topic: "colorectal surgery", section: 2, en: "pelvic exenteration", ar: "الاستئصال الحوضي الشامل" },
    { topic: "colorectal surgery", section: 2, en: "reoperation - pelvic malignancy", ar: "إعادة الجراحة - الورم الخبيث الحوضي" },
    { topic: "colorectal surgery", section: 2, en: "anal tumour - local excision", ar: "ورم الشرج - الاستئصال الموضعي" },
    { topic: "colorectal surgery", section: 2, en: "anal tumour - ap excision", ar: "ورم الشرج - الاستئصال البطني العجاني" },
    { topic: "colorectal surgery", section: 2, en: "inguinal lymph node dissection", ar: "تشريح العقد الليمفاوية الأربية" },
    { topic: "colorectal surgery", section: 2, en: "anal sphincter repair including postanal repair, anterior sphincter repair", ar: "إصلاح المصرة الشرجية بما في ذلك الإصلاح خلف الشرج وإصلاح المصرة الأمامي" },
    { topic: "colorectal surgery", section: 2, en: "anal sphincter - artificial sphincter/sacral nerve stimulation", ar: "المصرة الشرجية - المصرة الاصطناعية / تنبيه العصب العجزي" },
    { topic: "colorectal surgery", section: 2, en: "prolapse - abdominal rectopexy", ar: "الهبوط - تثبيت المستقيم البطني" },
    { topic: "colorectal surgery", section: 2, en: "prolapse - rectopexy + sigmoid resection", ar: "الهبوط - تثبيت المستقيم مع استئصال السين" },
    { topic: "colorectal surgery", section: 2, en: "prolapse - perineal repair", ar: "الهبوط - الإصلاح العجاني" },
    { topic: "colorectal surgery", section: 2, en: "starr procedure", ar: "عملية STARR (الاستئصال المستقيمي عبر الشرج بالتدبيس)" },
    { topic: "colorectal surgery", section: 2, en: "ventral mesh rectopexy", ar: "تثبيت المستقيم بالشبكة البطنية" },
    { topic: "colorectal surgery", section: 2, en: "rectocele repair", ar: "إصلاح القيلة المستقيمية" },
    { topic: "colorectal surgery", section: 2, en: "gastroenterostomy", ar: "مفاغرة المعدة والأمعاء" },
    { topic: "colorectal surgery", section: 2, en: "intestinal fistula operation", ar: "عملية الناسور المعوي" },
    { topic: "colorectal surgery", section: 2, en: "ileostomy - construction", ar: "فغر اللفائفي - التكوين" },
    { topic: "colorectal surgery", section: 2, en: "colostomy - construction", ar: "فغر القولون - التكوين" },
    { topic: "colorectal surgery", section: 2, en: "ileostomy - closure", ar: "فغر اللفائفي - الإغلاق" },
    { topic: "colorectal surgery", section: 2, en: "colostomy - closure", ar: "فغر القولون - الإغلاق" },
    { topic: "colorectal surgery", section: 2, en: "colostomy - revision", ar: "فغر القولون - المراجعة" },
    { topic: "colorectal surgery", section: 2, en: "ileostomy - revision", ar: "فغر اللفائفي - المراجعة" },

    // ── 5. general surgery of childhood ──
    { topic: "general surgery of childhood", section: 1, en: "child with vomiting", ar: "الطفل المصاب بالقيء" },
    { topic: "general surgery of childhood", section: 1, en: "constipation", ar: "الإمساك" },
    { topic: "general surgery of childhood", section: 1, en: "abdominal wall conditions", ar: "حالات جدار البطن" },
    { topic: "general surgery of childhood", section: 1, en: "child with groin condition", ar: "الطفل المصاب بحالة أربية" },
    { topic: "general surgery of childhood", section: 1, en: "urological conditions", ar: "الحالات البولية" },
    { topic: "general surgery of childhood", section: 1, en: "head and neck swellings", ar: "تورمات الرأس والرقبة" },
    { topic: "general surgery of childhood", section: 1, en: "miscellaneous skin conditions", ar: "الحالات الجلدية المتنوعة" },
    { topic: "general surgery of childhood", section: 2, en: "pyloromyotomy", ar: "بضع عضلة البواب" },
    { topic: "general surgery of childhood", section: 2, en: "manual evacuation", ar: "الإخلاء اليدوي" },
    { topic: "general surgery of childhood", section: 2, en: "repair of epigastric, supra-umbilical and abdominal wall hernia", ar: "إصلاح الفتق الشرسوفي وفوق السري وفتق جدار البطن" },
    { topic: "general surgery of childhood", section: 2, en: "orchidopexy", ar: "تثبيت الخصية" },
    { topic: "general surgery of childhood", section: 2, en: "circumcision", ar: "الختان" },
    { topic: "general surgery of childhood", section: 2, en: "inguinal hernia (not neonatal) operation", ar: "عملية الفتق الأربي (غير الوليدي)" },
    { topic: "general surgery of childhood", section: 2, en: "hydrocele operation", ar: "عملية القيلة المائية" },
    { topic: "general surgery of childhood", section: 2, en: "suprapubic catheter insertion", ar: "إدخال القسطرة فوق العانة" },
    { topic: "general surgery of childhood", section: 2, en: "lymph node biopsy", ar: "خزعة العقدة الليمفاوية" },
    { topic: "general surgery of childhood", section: 2, en: "abscess drainage", ar: "تصريف الخراج" },
    { topic: "general surgery of childhood", section: 2, en: "ingrowing toenail operation", ar: "عملية ظفر القدم الغائر" },

    // ── 6. breast surgery ──
    { topic: "breast surgery", section: 1, en: "breast and axillary assessment", ar: "تقييم الثدي والإبط" },
    { topic: "breast surgery", section: 1, en: "breast infections", ar: "عداوى الثدي" },
    { topic: "breast surgery", section: 1, en: "breast cancer", ar: "سرطان الثدي" },
    { topic: "breast surgery", section: 1, en: "principles of oncoplastic breast surgery", ar: "مبادئ جراحة الثدي الأورامية التجميلية" },
    { topic: "breast surgery", section: 1, en: "implant based/assisted reconstruction", ar: "إعادة البناء المعتمدة على الزرعات" },
    { topic: "breast surgery", section: 1, en: "autologous reconstruction", ar: "إعادة البناء الذاتية" },
    { topic: "breast surgery", section: 1, en: "benign surgery of the breast", ar: "جراحة الثدي الحميدة" },
    { topic: "breast surgery", section: 2, en: "nipple smear", ar: "مسحة الحلمة" },
    { topic: "breast surgery", section: 2, en: "punch biopsy of skin / nipple", ar: "خزعة الوخز للجلد / الحلمة" },
    { topic: "breast surgery", section: 2, en: "nipple surgery", ar: "جراحة الحلمة" },
    { topic: "breast surgery", section: 2, en: "palpable core biopsy of the breast", ar: "الخزعة الأساسية للكتلة المجسوسة في الثدي" },
    { topic: "breast surgery", section: 2, en: "laying open breast fistula", ar: "فتح ناسور الثدي" },
    { topic: "breast surgery", section: 2, en: "removal of infected breast implant and skin envelope revision", ar: "إزالة زرعة الثدي المصابة ومراجعة الغلاف الجلدي" },
    { topic: "breast surgery", section: 2, en: "surgical debridement of soft tissue necrosis - complex wound management", ar: "التنضير الجراحي لنخر الأنسجة الرخوة - تدبير الجرح المعقد" },
    { topic: "breast surgery", section: 2, en: "salvage implant revision", ar: "مراجعة إنقاذ الزرعة" },
    { topic: "breast surgery", section: 2, en: "exploration of donor site complication", ar: "استكشاف مضاعفة موقع المتبرع" },
    { topic: "breast surgery", section: 2, en: "partial and full thickness skin graft", ar: "طعم الجلد الجزئي وكامل السماكة" },
    { topic: "breast surgery", section: 2, en: "breast conservation - palpable", ar: "الحفاظ على الثدي - الكتلة المجسوسة" },
    { topic: "breast surgery", section: 2, en: "breast conservation - impalpable & image guided", ar: "الحفاظ على الثدي - غير المجسوسة وموجهة بالتصوير" },
    { topic: "breast surgery", section: 2, en: "oncoplastic wide local excision", ar: "الاستئصال الموضعي الواسع الأورامي التجميلي" },
    { topic: "breast surgery", section: 2, en: "mammoplasty wle using either reduction, displacement or replacement techniques", ar: "الاستئصال الموضعي الواسع برأب الثدي بتقنيات التصغير أو الإزاحة أو الاستبدال" },
    { topic: "breast surgery", section: 2, en: "mastectomy - simple", ar: "استئصال الثدي - البسيط" },
    { topic: "breast surgery", section: 2, en: "mastectomy - skin sparing +/- nipple preserving", ar: "استئصال الثدي - الحافظ للجلد مع أو بدون الحفاظ على الحلمة" },
    { topic: "breast surgery", section: 2, en: "mastectomy - skin reducing", ar: "استئصال الثدي - المصغّر للجلد" },
    { topic: "breast surgery", section: 2, en: "axillary surgery - lymph node biopsy", ar: "جراحة الإبط - خزعة العقدة الليمفاوية" },
    { topic: "breast surgery", section: 2, en: "axillary clearance - primary, level 1-3", ar: "تفريغ الإبط - الأولي، المستويات 1-3" },
    { topic: "breast surgery", section: 2, en: "axillary clearance - completion (delayed)", ar: "تفريغ الإبط - المكمّل (المؤجل)" },
    { topic: "breast surgery", section: 2, en: "axillary surgery - repeat (recurrence)", ar: "جراحة الإبط - المتكررة (النكس)" },
    { topic: "breast surgery", section: 2, en: "slnb (any technique)", ar: "خزعة العقدة الليمفاوية الخافرة (أي تقنية)" },
    { topic: "breast surgery", section: 2, en: "preoperative marking of patient for oncoplastic procedures and breast reconstruction", ar: "التعليم قبل الجراحة للمريض للإجراءات الأورامية التجميلية وإعادة بناء الثدي" },
    { topic: "breast surgery", section: 2, en: "minimising infection: antibiotics, drains, changing gloves, laminar theatres etc", ar: "تقليل العدوى: المضادات الحيوية والمصارف وتغيير القفازات وغرف العمليات ذات التدفق الصفائحي وغيرها" },
    { topic: "breast surgery", section: 2, en: "lipomodelling techniques in oncoplastic & reconstructive breast surgery", ar: "تقنيات نمذجة الدهون في جراحة الثدي الأورامية والترميمية" },
    { topic: "breast surgery", section: 2, en: "planning, execution and closing incisions on the breast with reference to aesthetic principles and sub units", ar: "تخطيط وتنفيذ وإغلاق الشقوق على الثدي وفق المبادئ الجمالية والوحدات الفرعية" },
    { topic: "breast surgery", section: 2, en: "nipple reconstruction techniques", ar: "تقنيات إعادة بناء الحلمة" },
    { topic: "breast surgery", section: 2, en: "nipple free graft", ar: "طعم الحلمة الحر" },
    { topic: "breast surgery", section: 2, en: "creation and closure of sub-pectoral pocket", ar: "تكوين وإغلاق الجيب تحت العضلة الصدرية" },
    { topic: "breast surgery", section: 2, en: "orient devices and prepare appropriately", ar: "توجيه الأجهزة والتحضير الملائم" },
    { topic: "breast surgery", section: 2, en: "two stage reconstruction using tex and subsequent exchange for fvi", ar: "إعادة البناء على مرحلتين باستخدام موسّع الأنسجة ثم استبداله بزرعة دائمة" },
    { topic: "breast surgery", section: 2, en: "single stage reconstruction using fvi/tex and biological & non biological mesh", ar: "إعادة البناء بمرحلة واحدة باستخدام الزرعة الدائمة / الموسّع والشبكة البيولوجية وغير البيولوجية" },
    { topic: "breast surgery", section: 2, en: "inferior dermal sling to achieve implant cover", ar: "الحمالة الأدمية السفلية لتغطية الزرعة" },
    { topic: "breast surgery", section: 2, en: "pre pectoral pocket", ar: "الجيب أمام العضلة الصدرية" },
    { topic: "breast surgery", section: 2, en: "techniques in capsulotomy, capsulectomy and revision implant surgery", ar: "تقنيات بضع المحفظة واستئصالها وجراحة مراجعة الزرعة" },
    { topic: "breast surgery", section: 2, en: "raising and insetting pedicled autologous tram flap", ar: "رفع وتثبيت رفرف TRAM الذاتي المعنقد" },
    { topic: "breast surgery", section: 2, en: "raising and insetting pedicled autologous ld flap (including implant assisted ld)", ar: "رفع وتثبيت رفرف الظهرية العريضة الذاتي المعنقد (بما في ذلك المدعوم بالزرعة)" },
    { topic: "breast surgery", section: 2, en: "raising and insetting a local perforator flap", ar: "رفع وتثبيت رفرف مثقّب موضعي" },
    { topic: "breast surgery", section: 2, en: "free-flap techniques", ar: "تقنيات الرفرف الحر" },
    { topic: "breast surgery", section: 2, en: "scar revision in aesthetic breast surgery", ar: "مراجعة الندبة في جراحة الثدي التجميلية" },
    { topic: "breast surgery", section: 2, en: "correction of the inverted nipple (various techniques)", ar: "تصحيح الحلمة المقلوبة (تقنيات مختلفة)" },
    { topic: "breast surgery", section: 2, en: "bilateral breast reduction by various patterns and techniques", ar: "تصغير الثديين الثنائي بأنماط وتقنيات مختلفة" },
    { topic: "breast surgery", section: 2, en: "bilateral breast augmentation by various routes, in various planes", ar: "تكبير الثديين الثنائي عبر مسارات ومستويات مختلفة" },
    { topic: "breast surgery", section: 2, en: "bilateral mastopexy by various patterns and techniques", ar: "رفع الثديين الثنائي بأنماط وتقنيات مختلفة" },
    { topic: "breast surgery", section: 2, en: "excision of gynaecomastia, incorporating various forms of liposuction as appropriate", ar: "استئصال التثدي عند الرجال، مع دمج أشكال شفط الدهون المختلفة عند الحاجة" },
    { topic: "breast surgery", section: 2, en: "unilateral or differential breast augmentation to attain symmetry", ar: "تكبير الثدي أحادي الجانب أو التفاضلي لتحقيق التناظر" },
    { topic: "breast surgery", section: 2, en: "unilateral or asymmetric breast reduction in pattern or volume to attain symmetry", ar: "تصغير الثدي أحادي الجانب أو غير المتناظر في النمط أو الحجم لتحقيق التناظر" },
    { topic: "breast surgery", section: 2, en: "synchronous mastopexy and breast augmentation in several patterns", ar: "رفع الثدي وتكبيره المتزامن بعدة أنماط" },
    { topic: "breast surgery", section: 2, en: "correction of tuberous breast by combinations of mastopexy, augmentation or tissue expansion", ar: "تصحيح الثدي الدرني بمزيج من الرفع أو التكبير أو توسيع الأنسجة" },
    { topic: "breast surgery", section: 2, en: "revision procedures following previous aesthetic surgery of the breast", ar: "إجراءات المراجعة بعد جراحة الثدي التجميلية السابقة" },
    { topic: "breast surgery", section: 2, en: "aesthetic surgery of the breast in patients with previous breast cancer or irradiation", ar: "جراحة الثدي التجميلية لدى مرضى سرطان الثدي أو التشعيع السابق" },
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
        AND lt."title" IN ('colorectal surgery', 'general surgery of childhood', 'breast surgery')
    `);
  }
}
