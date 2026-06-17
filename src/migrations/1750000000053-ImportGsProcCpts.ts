import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Imports 64 General Surgery proc_cpts across 6 alpha-code groups:
 *   ABDO (18) — open abdominal procedures
 *   LAPR (12) — laparoscopic procedures
 *   ENDO  (8) — endoscopic procedures
 *   COLO (13) — colorectal and anorectal procedures
 *   BREA  (7) — breast procedures
 *   THYR  (6) — thyroid / parathyroid procedures
 */
export class ImportGsProcCpts1750000000053 implements MigrationInterface {
  name = "ImportGsProcCpts1750000000053";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES

      -- ── ABDO: open abdominal procedures ──────────────────────────────────
      (
        'Exploratory laparotomy',
        'ABDO','49000-00',
        'Open surgical exploration of the abdominal cavity for diagnostic or therapeutic purposes, typically performed in blunt/penetrating trauma, peritonitis, or acute abdomen with unclear aetiology.',
        'فتح البطن الاستكشافي',
        'استكشاف جراحي مفتوح للتجويف البطني لأغراض تشخيصية أو علاجية، يُجرى عادةً في حالات الرضح الكليل أو النافذ أو التهاب الصفاق أو البطن الحاد غير محدد السبب.'
      ),
      (
        'Open appendectomy',
        'ABDO','44950-00',
        'Surgical removal of the vermiform appendix via an open abdominal incision (McBurney or Lanz); standard approach when laparoscopy is unavailable or contraindicated.',
        'استئصال الزائدة الدودية المفتوح',
        'استئصال جراحي للزائدة الدودية عبر شق بطني مفتوح (ماك بيرني أو لانز)؛ النهج القياسي عند عدم إمكانية المنظار أو وجود موانع.'
      ),
      (
        'Open cholecystectomy',
        'ABDO','47600-00',
        'Surgical removal of the gallbladder via open laparotomy; performed when laparoscopic approach is contraindicated (severe adhesions, unclear anatomy, perforation, or conversion).',
        'استئصال المرارة المفتوح',
        'استئصال المرارة جراحياً عبر شق بطني مفتوح؛ يُجرى عند وجود موانع لمنظار البطن (التصاقات شديدة، أو تشريح غير واضح، أو انثقاب، أو التحويل من المنظار).'
      ),
      (
        'Repair of perforated peptic ulcer (Graham patch)',
        'ABDO','43840-00',
        'Surgical closure of a perforated gastric or duodenal ulcer using an omental (Graham) patch to seal the perforation and prevent ongoing peritoneal contamination.',
        'ترميم ثقب القرحة الهضمية (رقعة غراهام)',
        'إغلاق جراحي لثقب في القرحة المعدية أو الاثني عشرية باستخدام رقعة من الثرب (رقعة غراهام) لسد الثقب ومنع التلوث الصفاقي المستمر.'
      ),
      (
        'Small bowel resection',
        'ABDO','44120-00',
        'Resection of a segment of small intestine with primary end-to-end anastomosis or stoma formation, performed for bowel obstruction, ischaemia, Crohn''s disease, or small bowel neoplasm.',
        'استئصال الأمعاء الدقيقة',
        'استئصال جزء من الأمعاء الدقيقة مع مفاغرة نهاية لنهاية أولية أو إنشاء فغرة، يُجرى لانسداد معوي أو نقص تروية أو مرض كرون أو ورم الأمعاء الدقيقة.'
      ),
      (
        'Enterolysis (open lysis of peritoneal adhesions)',
        'ABDO','44005-00',
        'Open surgical division of peritoneal adhesions to relieve mechanical small bowel obstruction; carried out when conservative management fails or when strangulation is suspected.',
        'تحرير الالتصاقات البريتونية المفتوح',
        'تحرير جراحي مفتوح للالتصاقات البريتونية لإزالة انسداد الأمعاء الدقيقة الميكانيكي؛ يُجرى عند فشل العلاج المحافظ أو الاشتباه في الاختناق.'
      ),
      (
        'Open total splenectomy',
        'ABDO','38100-00',
        'Open surgical removal of the entire spleen; performed for splenic trauma, haematologic conditions (ITP, hereditary spherocytosis), splenic abscess, or hypersplenism.',
        'استئصال الطحال الكامل المفتوح',
        'استئصال جراحي مفتوح للطحال بالكامل؛ يُجرى لصدمة الطحال أو الأمراض الدموية (فرفرية نقص الصفيحات المناعية، الكروية الوراثية) أو خراج الطحال أو فرط نشاط الطحال.'
      ),
      (
        'Colostomy formation',
        'ABDO','44320-00',
        'Surgical creation of a colostomy by bringing a loop or divided end of colon to the abdominal wall surface; may be temporary (loop) or permanent (end), performed for left-sided obstruction, perforation, or rectal excision.',
        'فغر القولون',
        'إنشاء جراحي لفغر القولون بإخراج حلقة أو نهاية مقطوعة من القولون إلى سطح جدار البطن؛ قد يكون مؤقتاً (حلقياً) أو دائماً (طرفياً)، يُجرى لانسداد القولون الأيسر أو الانثقاب أو استئصال المستقيم.'
      ),
      (
        'Ileostomy formation',
        'ABDO','44310-00',
        'Surgical creation of an ileostomy by exteriorising the distal ileum to the abdominal wall; performed as a diverting stoma after ileal or colorectal anastomosis, or for inflammatory bowel disease.',
        'فغر الدقاق',
        'إنشاء جراحي لفغر الدقاق بإخراج الدقاق البعيد إلى جدار البطن؛ يُجرى كفغرة انصرافية بعد مفاغرة دقاقية أو قولونية مستقيمية، أو لمرض الأمعاء الالتهابي.'
      ),
      (
        'Closure of enterostomy (stoma takedown)',
        'ABDO','44620-00',
        'Surgical closure and reversal of a loop or end ileostomy or colostomy to restore intestinal continuity once the distal anastomosis has healed.',
        'إغلاق فغرة الأمعاء',
        'إغلاق جراحي وعكس فغر الدقاق الحلقي أو الطرفي أو فغر القولون لاستعادة استمرارية الأمعاء بعد شفاء المفاغرة البعيدة.'
      ),
      (
        'Meckel''s diverticulectomy',
        'ABDO','44800-00',
        'Excision of a Meckel''s diverticulum by simple diverticulectomy or ileal wedge resection; performed for symptomatic disease (bleeding, obstruction, perforation, intussusception).',
        'استئصال رتج ميكل',
        'استئصال رتج ميكل بالقطع المباشر للرتج أو بالاستئصال الوتدي من الدقاق؛ يُجرى للمرض المصحوب بأعراض (نزيف، انسداد، انثقاب، انسياخ).'
      ),
      (
        'Open gastrostomy',
        'ABDO','43830-00',
        'Surgical creation of a gastrostomy for long-term enteral feeding access via an open approach (Stamm technique); performed when percutaneous endoscopic gastrostomy is not feasible.',
        'فغر المعدة المفتوح',
        'إنشاء جراحي مفتوح لفغر المعدة للتغذية المعوية طويلة الأمد (تقنية ستام)؛ يُجرى عند عدم إمكانية فغر المعدة التنظيري عبر الجلد.'
      ),
      (
        'Open inguinal hernia repair (initial)',
        'ABDO','49505-00',
        'Open surgical repair of an initial (non-recurrent) inguinal hernia using mesh reinforcement (Lichtenstein tension-free technique) or primary tissue repair (Bassini/Shouldice).',
        'ترميم الفتق الإربي المفتوح (أولي)',
        'ترميم جراحي مفتوح للفتق الإربي غير المتكرر بتعزيز شبكي (تقنية ليشتنشتاين عديمة التوتر) أو ترميم نسيجي أولي (باسيني / شولديس).'
      ),
      (
        'Open inguinal hernia repair (recurrent)',
        'ABDO','49507-00',
        'Open surgical repair of a recurrent inguinal hernia with prosthetic mesh reinforcement; technically more challenging due to scarring from prior repair.',
        'ترميم الفتق الإربي المفتوح (متكرر)',
        'ترميم جراحي مفتوح للفتق الإربي المتكرر بتعزيز شبكي اصطناعي؛ أصعب تقنياً بسبب الندبات من الترميم السابق.'
      ),
      (
        'Open femoral hernia repair',
        'ABDO','49550-00',
        'Open surgical repair of a femoral hernia via an inguinal, low anterior (Lockwood), or high (McEvedy) approach; femoral hernias carry high risk of strangulation.',
        'ترميم الفتق الفخذي المفتوح',
        'ترميم جراحي مفتوح للفتق الفخذي عبر نهج إربي أو أمامي سفلي (لوكووود) أو علوي (ماك إيفيدي)؛ تحمل الفتوق الفخذية خطراً عالياً للاختناق.'
      ),
      (
        'Open incisional hernia repair',
        'ABDO','49560-00',
        'Open surgical repair of a ventral incisional hernia using prosthetic mesh (onlay, sublay, or component separation), performed for symptomatic or enlarging defects.',
        'ترميم الفتق الجرحي المفتوح',
        'ترميم جراحي مفتوح للفتق الجرحي البطني بشبكة اصطناعية (سطحية أو تحت العضلية أو فصل المكونات)، يُجرى للعيوب ذات الأعراض أو المتوسعة.'
      ),
      (
        'Open epigastric or umbilical hernia repair',
        'ABDO','49570-00',
        'Open surgical repair of an epigastric or umbilical hernia with primary suture or mesh reinforcement, depending on defect size.',
        'ترميم الفتق الشرسوفي أو السري المفتوح',
        'ترميم جراحي مفتوح للفتق الشرسوفي أو السري بخيوط أولية أو تعزيز شبكي بحسب حجم العيب.'
      ),
      (
        'Drainage of appendiceal abscess',
        'ABDO','44900-00',
        'Incision and drainage of a periappendiceal abscess, either surgically or percutaneously under imaging guidance; usually followed by interval appendectomy after resolution of inflammation.',
        'تصريف خراج الزائدة الدودية',
        'شق وتصريف خراج محيط الزائدة الدودية، إما جراحياً أو عبر الجلد بتوجيه التصوير؛ يُتبع عادةً باستئصال الزائدة المؤجل بعد زوال الالتهاب.'
      ),

      -- ── LAPR: laparoscopic procedures ────────────────────────────────────
      (
        'Laparoscopic cholecystectomy',
        'LAPR','47562-00',
        'Minimally invasive laparoscopic removal of the gallbladder using four-port technique; the gold-standard procedure for symptomatic cholelithiasis and acute cholecystitis.',
        'استئصال المرارة بالمنظار',
        'استئصال المرارة بأقل التدخل الجراحي باستخدام المنظار بتقنية الأربعة منافذ؛ المعيار الذهبي لحصوات المرارة ذات الأعراض والتهاب المرارة الحاد.'
      ),
      (
        'Laparoscopic cholecystectomy with intraoperative cholangiogram',
        'LAPR','47563-00',
        'Laparoscopic cholecystectomy with simultaneous fluoroscopic imaging of the biliary tree to detect unsuspected choledocholithiasis or delineate biliary anatomy before cystic duct division.',
        'استئصال المرارة بالمنظار مع تصوير القنوات الصفراوية أثناء الجراحة',
        'استئصال المرارة بالمنظار مع تصوير شعاعي فوري لشجرة القنوات الصفراوية للكشف عن حصوات قناة الصفراء المشتركة غير المشتبه بها أو تحديد التشريح الصفراوي قبل قطع القناة الكيسية.'
      ),
      (
        'Laparoscopic appendectomy',
        'LAPR','44970-00',
        'Laparoscopic removal of the inflamed appendix using three-port technique; preferred approach for acute appendicitis offering faster recovery and lower wound infection rate.',
        'استئصال الزائدة الدودية بالمنظار',
        'استئصال الزائدة الدودية الملتهبة بالمنظار باستخدام تقنية ثلاثة منافذ؛ النهج المفضل لالتهاب الزائدة الدودية الحاد لتحقيق تعافٍ أسرع ومعدل أدنى للعدوى الجرحية.'
      ),
      (
        'Laparoscopic enterolysis (lysis of adhesions)',
        'LAPR','44202-00',
        'Laparoscopic division of peritoneal adhesions causing small bowel obstruction; preferred in selected patients as it avoids laparotomy and reduces risk of future adhesion formation.',
        'تحرير الالتصاقات البريتونية بالمنظار',
        'تحرير الالتصاقات البريتونية المسببة لانسداد الأمعاء الدقيقة بالمنظار؛ مفضل في مرضى مختارين لتجنب فتح البطن وتقليل خطر تكون التصاقات مستقبلية.'
      ),
      (
        'Laparoscopic splenectomy',
        'LAPR','38120-00',
        'Minimally invasive laparoscopic removal of the spleen; preferred approach for elective splenectomy in haematologic conditions (ITP, hereditary spherocytosis) in eligible patients.',
        'استئصال الطحال بالمنظار',
        'استئصال الطحال بأقل التدخل الجراحي باستخدام المنظار؛ النهج المفضل للاستئصال الاختياري للطحال في الأمراض الدموية (فرفرية نقص الصفيحات المناعية، الكروية الوراثية) لدى المرضى المؤهلين.'
      ),
      (
        'Laparoscopic Roux-en-Y gastric bypass',
        'LAPR','43644-00',
        'Laparoscopic creation of a 15–30 mL gastric pouch with Roux-en-Y small bowel reconstruction (biliopancreatic limb 75–150 cm, alimentary limb 150 cm); the gold-standard bariatric-metabolic procedure for morbid obesity with or without type 2 diabetes.',
        'مجازة المعدة بتقنية روكس-أن-واي بالمنظار',
        'إنشاء كيس معدي 15–30 مل بالمنظار مع إعادة بناء الأمعاء الدقيقة بتقنية روكس-أن-واي (الذراع الصفراوي البنكرياسي 75–150 سم، الذراع الغذائي 150 سم)؛ المعيار الذهبي للجراحة الاستقلابية لعلاج السمنة المرضية مع أو بدون داء السكري النوع الثاني.'
      ),
      (
        'Laparoscopic sleeve gastrectomy',
        'LAPR','43775-00',
        'Laparoscopic resection of approximately 75–80% of the stomach along the greater curvature over a bougie (36–40 Fr), creating a sleeve-shaped gastric tube; a restrictive bariatric procedure for morbid obesity.',
        'تكميم المعدة بالمنظار',
        'استئصال حوالي 75–80% من المعدة على طول الانحناء الأكبر فوق موسّع بالمنظار (36–40 فرنسي)، مما ينشئ أنبوب معدي على شكل كم؛ عملية تقييدية لعلاج السمنة المرضية.'
      ),
      (
        'Laparoscopic adjustable gastric band',
        'LAPR','43770-00',
        'Laparoscopic placement of an adjustable silicone band around the upper stomach just below the gastroesophageal junction, connected to a subcutaneous port for volume adjustment to restrict food intake.',
        'ربط المعدة القابل للتعديل بالمنظار',
        'تركيب شريط سيليكون قابل للتعديل حول الجزء العلوي من المعدة أسفل الوصل المعدي المريئي مباشرةً بالمنظار، موصول بمنفذ تحت الجلد لتعديل الحجم للحد من تناول الطعام.'
      ),
      (
        'Laparoscopic inguinal hernia repair (TEP/TAPP)',
        'LAPR','49650-00',
        'Laparoscopic repair of inguinal hernia via totally extraperitoneal (TEP) or transabdominal preperitoneal (TAPP) approach with prosthetic mesh placement; avoids entry into the peritoneal cavity (TEP) and allows bilateral repair through same ports.',
        'ترميم الفتق الإربي بالمنظار (TEP/TAPP)',
        'ترميم الفتق الإربي بالمنظار عبر تقنية خارج الصفاق الكلي (TEP) أو العبر بطني قبل الصفاقي (TAPP) بوضع شبكة اصطناعية؛ يتجنب الدخول لتجويف الصفاق (TEP) ويتيح ترميم الفتق الثنائي عبر نفس المنافذ.'
      ),
      (
        'Laparoscopic repair of umbilical or ventral hernia',
        'LAPR','49652-00',
        'Laparoscopic intraperitoneal onlay mesh (IPOM) repair of an umbilical or primary ventral hernia; mesh placed intraperitoneally and secured with tacks and sutures.',
        'ترميم الفتق السري أو البطني بالمنظار',
        'ترميم الفتق السري أو البطني الأولي بالمنظار بوضع شبكة داخل الصفاق (IPOM)؛ تُوضع الشبكة داخل الصفاق وتثبَّت بالمشابك والخيوط.'
      ),
      (
        'Laparoscopic repair of incisional hernia',
        'LAPR','49654-00',
        'Laparoscopic repair of an incisional (ventral) hernia with intraperitoneal mesh placement (IPOM technique); effective for defects up to 10 cm with lower surgical site infection risk than open repair.',
        'ترميم الفتق الجرحي بالمنظار',
        'ترميم الفتق الجرحي بالمنظار بوضع شبكة داخل الصفاق (تقنية IPOM)؛ فعّال للعيوب حتى 10 سم مع انخفاض خطر عدوى موقع الجراحة مقارنةً بالترميم المفتوح.'
      ),
      (
        'Laparoscopic Nissen fundoplication (anti-reflux)',
        'LAPR','43280-00',
        'Laparoscopic 360-degree posterior fundoplication wrapping the gastric fundus around the distal oesophagus to restore lower oesophageal sphincter competence; performed for refractory GORD or hiatal hernia.',
        'تثنية قاع المعدة الكاملة بالمنظار (نيسين)',
        'تثنية خلفية كاملة 360 درجة لقاع المعدة حول المريء البعيد بالمنظار لاستعادة كفاءة العاصرة المريئية السفلية؛ يُجرى لداء ارتداد المريء المستعصي على العلاج أو الفتق الحجابي.'
      ),

      -- ── ENDO: endoscopic procedures ──────────────────────────────────────
      (
        'Upper GI endoscopy (diagnostic EGD)',
        'ENDO','43235-00',
        'Diagnostic oesophago-gastro-duodenoscopy (EGD) for evaluation of upper gastrointestinal pathology including peptic ulceration, varices, malignancy, and dysphagia.',
        'تنظير الجهاز الهضمي العلوي التشخيصي',
        'تنظير تشخيصي للمريء والمعدة والاثني عشر لتقييم أمراض الجهاز الهضمي العلوي بما في ذلك القرحة الهضمية والدوالي والأورام وعسر البلع.'
      ),
      (
        'EGD with biopsy',
        'ENDO','43239-00',
        'Upper GI endoscopy with targeted mucosal biopsy for histopathological diagnosis of gastric pathology, H. pylori testing, or surveillance of Barrett''s oesophagus.',
        'تنظير الجهاز الهضمي العلوي مع خزعة',
        'تنظير الجهاز الهضمي العلوي مع أخذ خزعة مخاطية موجهة للتشخيص النسيجي المرضي لأمراض المعدة أو اختبار الحلزونية البوابية أو مراقبة مريء باريت.'
      ),
      (
        'EGD with haemostasis',
        'ENDO','43255-00',
        'Upper GI endoscopy with endoscopic haemostasis for active upper gastrointestinal bleeding using injection (adrenaline), mechanical clipping, thermal coagulation, or band ligation of varices.',
        'تنظير الجهاز الهضمي العلوي مع وقف النزيف',
        'تنظير الجهاز الهضمي العلوي مع إيقاف النزيف بالتنظير في حالات نزيف الجهاز الهضمي العلوي النشط باستخدام الحقن (أدرينالين) أو المشابك الميكانيكية أو التخثير الحراري أو ربط دوالي المريء.'
      ),
      (
        'ERCP (endoscopic retrograde cholangiopancreatography)',
        'ENDO','43260-00',
        'Combined fluoroscopic and endoscopic procedure for diagnosis and treatment of biliary and pancreatic duct pathology, including stone extraction, sphincterotomy, stenting, and tissue sampling.',
        'التصوير الراجع للبنكرياس والقنوات الصفراوية بالتنظير (ERCP)',
        'إجراء يجمع بين التصوير الشعاعي والتنظير لتشخيص وعلاج أمراض القنوات الصفراوية والبنكرياسية، بما في ذلك استخراج الحصوات وبضع العضلة العاصرة والتجسير وأخذ عينات الأنسجة.'
      ),
      (
        'Diagnostic colonoscopy',
        'ENDO','45378-00',
        'Endoscopic visualisation of the entire colon from rectum to caecum and terminal ileum for colorectal cancer screening, diagnostic workup of lower GI bleeding, or inflammatory bowel disease surveillance.',
        'منظار القولون التشخيصي',
        'تنظير بصري للقولون بالكامل من المستقيم حتى الأعور والدقاق الطرفي لفحص سرطان القولون أو التشخيص في نزيف الجهاز الهضمي السفلي أو مراقبة مرض الأمعاء الالتهابي.'
      ),
      (
        'Colonoscopy with biopsy',
        'ENDO','45380-00',
        'Colonoscopy with targeted mucosal biopsy for histopathological diagnosis of colorectal lesions, inflammatory bowel disease, or colitis.',
        'منظار القولون مع خزعة',
        'تنظير القولون مع أخذ خزعة مخاطية موجهة للتشخيص النسيجي المرضي لآفات القولون أو مرض الأمعاء الالتهابي أو التهاب القولون.'
      ),
      (
        'Colonoscopy with polypectomy',
        'ENDO','45385-00',
        'Colonoscopy with endoscopic removal of one or more colorectal polyps by snare polypectomy, hot biopsy forceps, or endoscopic mucosal resection (EMR); key procedure for colorectal cancer prevention.',
        'منظار القولون مع استئصال السليلة',
        'تنظير القولون مع إزالة واحد أو أكثر من السلائل القولونية بالحلقة أو ملاقط الخزعة الحرارية أو الاستئصال المخاطي بالتنظير (EMR)؛ إجراء أساسي للوقاية من سرطان القولون.'
      ),
      (
        'Flexible sigmoidoscopy',
        'ENDO','45330-00',
        'Endoscopic examination of the rectum and sigmoid colon using a flexible sigmoidoscope; used for lower GI bleeding workup, haemorrhoid evaluation, or post-treatment surveillance.',
        'تنظير السيني المرن',
        'فحص تنظيري للمستقيم والقولون السيني باستخدام منظار سيني مرن؛ يُستخدم في تقييم نزيف الجهاز الهضمي السفلي أو تقييم البواسير أو المتابعة بعد العلاج.'
      ),

      -- ── COLO: colorectal and anorectal procedures ──────────────────────
      (
        'Partial colectomy (open)',
        'COLO','44140-00',
        'Open resection of a segment of the colon with primary colorectal or colo-colic anastomosis; performed for colon cancer, complicated diverticular disease, colonic ischaemia, or volvulus.',
        'استئصال القولون الجزئي المفتوح',
        'استئصال مفتوح لجزء من القولون مع مفاغرة قولونية مستقيمية أو قولونية قولونية أولية؛ يُجرى لسرطان القولون أو مرض الرتج المعقد أو نقص التروية أو الالتواء.'
      ),
      (
        'Hartmann''s procedure',
        'COLO','44143-00',
        'Sigmoid colectomy with formation of an end colostomy and closure of the rectal stump (Hartmann pouch), performed for perforated diverticulitis or obstructing left-sided colon cancer when primary anastomosis is unsafe.',
        'عملية هارتمان',
        'استئصال القولون السيني مع إنشاء فغر قولوني طرفي وإغلاق جذع المستقيم (حقيبة هارتمان)، يُجرى لانثقاب الرتج أو سرطان القولون الأيسر المسبب للانسداد عند عدم أمان المفاغرة الأولية.'
      ),
      (
        'Low anterior resection (open)',
        'COLO','44145-00',
        'Open anterior resection of the rectosigmoid junction and upper or mid-rectum with colorectal anastomosis, performed for mid or upper rectal cancer or rectosigmoid tumour; may require a temporary diverting ileostomy.',
        'الاستئصال الأمامي المنخفض المفتوح',
        'استئصال أمامي مفتوح لمنطقة التقاء السيني بالمستقيم والمستقيم العلوي أو المتوسط مع مفاغرة قولونية مستقيمية، يُجرى لسرطان المستقيم المتوسط أو العلوي أو ورم السيني المستقيم؛ قد يستلزم فغر دقاق انصرافي مؤقت.'
      ),
      (
        'Abdominoperineal resection (APR)',
        'COLO','45110-00',
        'Combined abdominal and perineal excision of the entire rectum and anus with creation of a permanent end sigmoid colostomy; performed for low rectal cancer or anal canal cancer where sphincter preservation is not feasible.',
        'الاستئصال البطني العجاني',
        'استئصال مشترك بطني وعجاني للمستقيم بالكامل والشرج مع إنشاء فغر قولوني سيني طرفي دائم؛ يُجرى لسرطان المستقيم السفلي أو قناة الشرج حيث لا يمكن الحفاظ على العاصرة.'
      ),
      (
        'Laparoscopic partial colectomy',
        'COLO','44204-00',
        'Minimally invasive laparoscopic resection of a segment of the colon with anastomosis or stoma; offers faster recovery and lower morbidity than open colectomy for colon cancer or diverticular disease.',
        'استئصال القولون الجزئي بالمنظار',
        'استئصال بالمنظار لجزء من القولون مع مفاغرة أو فغرة؛ يوفر تعافياً أسرع ومضاعفات أقل من الاستئصال المفتوح لسرطان القولون أو مرض الرتج.'
      ),
      (
        'Laparoscopic low anterior resection',
        'COLO','44207-00',
        'Laparoscopic anterior resection of the rectosigmoid and rectum with total mesorectal excision (TME) and colorectal or coloanal anastomosis; standard curative approach for mid and upper rectal cancer.',
        'الاستئصال الأمامي المنخفض بالمنظار',
        'استئصال أمامي للمستقيم والسيني بالمنظار مع استئصال كامل للمساريق المستقيمية (TME) ومفاغرة قولونية مستقيمية أو قولونية شرجية؛ النهج العلاجي القياسي لسرطان المستقيم المتوسط والعلوي.'
      ),
      (
        'Transanal excision of rectal tumour',
        'COLO','45171-00',
        'Transanal local excision of a small, superficial rectal tumour or adenoma using conventional transanal technique or transanal endoscopic microsurgery (TEM); appropriate for selected early-stage rectal cancers and large adenomas.',
        'الاستئصال العبر الشرجي لورم المستقيم',
        'استئصال موضعي عبر الشرج لورم مستقيمي صغير سطحي أو ورم غدي باستخدام التقنية الشرجية التقليدية أو الجراحة المجهرية بالتنظير الشرجي (TEM)؛ مناسب لسرطانات المستقيم المبكرة المختارة والأورام الغدية الكبيرة.'
      ),
      (
        'Haemorrhoidectomy',
        'COLO','46250-00',
        'Surgical excision of symptomatic internal and external haemorrhoids; performed by Ferguson closed technique (primary suture closure) or Milligan-Morgan open technique (wounds left open); for grade III–IV or thrombosed haemorrhoids failing conservative treatment.',
        'استئصال البواسير',
        'استئصال جراحي للبواسير الداخلية والخارجية ذات الأعراض؛ يُجرى بتقنية فيرغسون المغلقة (إغلاق بالخيوط الأولية) أو تقنية ميليغان-مورغان المفتوحة (الجروح مفتوحة)؛ للبواسير من الدرجة الثالثة أو الرابعة أو المخثرة التي فشل علاجها المحافظ.'
      ),
      (
        'Lateral internal sphincterotomy',
        'COLO','46910-00',
        'Division of the internal anal sphincter in the lateral position to reduce anal hypertonia and promote healing of chronic anal fissure; the definitive surgical treatment for chronic anal fissure refractory to botulinum toxin or topical therapy.',
        'شق العضلة العاصرة الداخلية الجانبي',
        'شق العضلة الشرجية الداخلية في الوضع الجانبي لتقليل فرط توتر الشرج وتعزيز شفاء الشق الشرجي المزمن؛ العلاج الجراحي الجذري للشق الشرجي المزمن المقاوم لحقن البوتولينوم أو العلاج الموضعي.'
      ),
      (
        'Incision and drainage of perianal or ischiorectal abscess',
        'COLO','46040-00',
        'Surgical incision and drainage of a perianal or ischiorectal abscess under anaesthesia; the initial treatment to decompress the abscess and prevent spread; approximately 30–50% will subsequently develop an anal fistula.',
        'شق وتصريف الخراج الشرجي أو الإسكي المستقيمي',
        'شق جراحي وتصريف الخراج الشرجي أو الإسكي المستقيمي تحت التخدير؛ العلاج الأولي لتفريغ الخراج ومنع الانتشار؛ يتطور حوالي 30–50% منهم لاحقاً إلى ناسور شرجي.'
      ),
      (
        'Fistulotomy (laying open of anal fistula)',
        'COLO','46060-00',
        'Surgical laying open of a simple low-level intersphincteric or low transsphincteric anal fistula, dividing the fistula tract and allowing healing by secondary intention; not appropriate for high or complex fistulas due to continence risk.',
        'فتح الناسور الشرجي',
        'فتح جراحي لناسور شرجي بسيط منخفض بين العاصرتين أو عبر العاصرة السفلي بشق مسار الناسور والسماح بالشفاء بالنية الثانوية؛ غير مناسب للنواسير المرتفعة أو المعقدة بسبب خطر الاستمساك.'
      ),
      (
        'Seton placement for complex anal fistula',
        'COLO','46020-00',
        'Placement of a non-cutting seton (silk or silastic thread) through a high or complex transsphincteric anal fistula tract to promote chronic drainage, fibrous induration of the tract, and staged sphincter-sparing division.',
        'وضع الخيط للناسور الشرجي المعقد',
        'وضع خيط غير قاطع (حرير أو خيط مطاطي) عبر مسار ناسور شرجي عبر العاصرة المرتفع أو المعقد لتعزيز التصريف المزمن وتليف المسار وشقه المتدرج مع الحفاظ على العاصرة.'
      ),
      (
        'Excision of pilonidal cyst or sinus',
        'COLO','11770-00',
        'Surgical excision of a pilonidal cyst or sinus with either primary midline closure, off-midline closure (Karydakis or Bascom flap), or open wound management; performed for recurrent or symptomatic pilonidal disease.',
        'استئصال الكيس أو الجيب الشعري العجزي',
        'استئصال جراحي للكيس أو الجيب الشعري العجزي مع إغلاق خط الوسط الأولي أو الإغلاق خارج خط الوسط (رفرف كاريداكيس أو باسكوم) أو معالجة الجرح المفتوح؛ يُجرى للمرض المتكرر أو ذي الأعراض.'
      ),

      -- ── BREA: breast procedures ───────────────────────────────────────────
      (
        'Excision of breast lesion (wide local excision)',
        'BREA','19120-00',
        'Surgical excision of a benign or suspicious breast lesion (fibroadenoma, cyst, papilloma, or non-palpable lesion guided by wire localisation) with a rim of normal breast tissue.',
        'الاستئصال الموضعي الواسع لآفة الثدي',
        'استئصال جراحي لآفة الثدي الحميدة أو المشتبه بها (ورم ليفي غدي، كيس، ورم حليمي، أو آفة غير ملموسة بتوجيه التثبيت السلكي) مع هامش من نسيج الثدي الطبيعي.'
      ),
      (
        'Partial mastectomy (breast-conserving surgery)',
        'BREA','19301-00',
        'Wide local excision of breast cancer with adequate margins (≥1 mm) while preserving the breast; the preferred surgical approach for early-stage breast cancer, combined with adjuvant radiotherapy.',
        'الاستئصال الجزئي للثدي (الجراحة الحافظة)',
        'استئصال موضعي واسع لسرطان الثدي مع هامش كافٍ (≥1 مم) مع الحفاظ على الثدي؛ النهج الجراحي المفضل لسرطان الثدي المبكر، يُدمج مع العلاج الإشعاعي المساعد.'
      ),
      (
        'Simple total mastectomy',
        'BREA','19303-00',
        'Surgical removal of the entire breast including skin, nipple-areola complex, and breast tissue, without axillary node dissection; performed for DCIS, prophylactic mastectomy, or palliation.',
        'استئصال الثدي الكامل البسيط',
        'استئصال جراحي للثدي بالكامل بما في ذلك الجلد والحلمة والهالة ونسيج الثدي دون تشريح العقد الإبطية؛ يُجرى لسرطان القنوات في الموضع أو الاستئصال الوقائي أو التلطيف.'
      ),
      (
        'Modified radical mastectomy',
        'BREA','19307-00',
        'En bloc removal of the entire breast with level I and II axillary lymph node dissection, preserving the pectoralis major muscle; the standard surgical treatment for locally advanced breast cancer.',
        'استئصال الثدي الجذري المعدل',
        'استئصال كتلة واحدة للثدي بالكامل مع تشريح العقد الليمفاوية الإبطية من المستوى الأول والثاني مع الحفاظ على عضلة الصدر الكبرى؛ العلاج الجراحي القياسي لسرطان الثدي المتقدم محلياً.'
      ),
      (
        'Incision and drainage of breast abscess',
        'BREA','19020-00',
        'Surgical incision and drainage of a breast abscess under local or general anaesthesia; may be supplemented with ultrasound-guided aspiration for smaller abscesses; specimens sent for culture and sensitivity.',
        'شق وتصريف خراج الثدي',
        'شق جراحي وتصريف خراج الثدي تحت التخدير الموضعي أو العام؛ يمكن استكماله بالشفط الموجه بالموجات فوق الصوتية للخراجات الأصغر؛ تُرسل العينات للزرع وتحديد الحساسية.'
      ),
      (
        'Axillary lymph node dissection',
        'BREA','38525-00',
        'Surgical removal of axillary lymph nodes at levels I, II, and III for staging or treatment of breast cancer with known axillary nodal involvement; may be performed concurrently with mastectomy or breast-conserving surgery.',
        'تشريح العقد الليمفاوية الإبطية',
        'استئصال جراحي للعقد الليمفاوية الإبطية من المستويات الأول والثاني والثالث لتحديد مرحلة سرطان الثدي أو علاجه مع معرفة إصابة العقد الإبطية؛ يمكن إجراؤه مصاحباً للاستئصال الكامل أو الجراحة الحافظة.'
      ),
      (
        'Sentinel lymph node biopsy',
        'BREA','38900-00',
        'Intraoperative identification and selective biopsy of the first-draining (sentinel) axillary lymph node(s) using blue dye and/or radioisotope (technetium-99m), to determine axillary node status and guide the need for full axillary dissection in clinically node-negative breast cancer.',
        'خزعة العقدة الليمفاوية الحارسة',
        'تحديد وأخذ خزعة انتقائية من أولى العقد الليمفاوية الإبطية الصارفة (الحارسة) أثناء العملية باستخدام الصبغة الزرقاء والنظير الراديوي (التكنيشيوم-99م)، لتحديد حالة العقد الإبطية وتوجيه الحاجة لتشريح إبطي كامل في سرطان الثدي السلبي العقدي سريرياً.'
      ),

      -- ── THYR: thyroid and parathyroid procedures ──────────────────────
      (
        'Thyroid biopsy (FNA)',
        'THYR','60100-00',
        'Fine needle aspiration cytology (FNAC) of a thyroid nodule under ultrasound guidance for cytological classification (Bethesda system) to guide surgical decision-making.',
        'خزعة الغدة الدرقية (بالإبرة الدقيقة)',
        'سحب خلايا بالإبرة الدقيقة من عقيدة الغدة الدرقية بتوجيه الموجات فوق الصوتية للتصنيف الخلوي (نظام بيثيسدا) لتوجيه القرار الجراحي.'
      ),
      (
        'Partial thyroidectomy',
        'THYR','60210-00',
        'Surgical removal of part of one thyroid lobe, preserving the remainder; performed for small benign thyroid nodule or isthmus nodule when diagnostic lobectomy is not required.',
        'استئصال الغدة الدرقية الجزئي',
        'استئصال جراحي لجزء من فص الغدة الدرقية مع الحفاظ على الباقي؛ يُجرى لعقيدة درقية حميدة صغيرة أو عقيدة البرزخ عند عدم الحاجة لاستئصال الفص التشخيصي.'
      ),
      (
        'Total thyroid lobectomy (hemithyroidectomy)',
        'THYR','60220-00',
        'Complete surgical removal of one thyroid lobe and the isthmus; the standard operation for a solitary thyroid nodule with indeterminate cytology (Bethesda III–IV) or confirmed differentiated thyroid cancer in a low-risk patient.',
        'استئصال فص الغدة الدرقية الكامل (إزالة نصف الغدة)',
        'استئصال جراحي كامل لفص الغدة الدرقية والبرزخ؛ العملية القياسية لعقيدة درقية منفردة ذات خلوية غير محددة (بيثيسدا III–IV) أو سرطان درقي متمايز مؤكد في مريض منخفض الخطورة.'
      ),
      (
        'Total thyroidectomy',
        'THYR','60240-00',
        'Complete surgical removal of both thyroid lobes and the isthmus; performed for thyroid malignancy, large multinodular goitre with compressive symptoms, Graves'' disease refractory to medical therapy, or thyroid cancer of significant risk.',
        'استئصال الغدة الدرقية الكامل',
        'استئصال جراحي كامل لكلا فصي الغدة الدرقية والبرزخ؛ يُجرى لورم الغدة الدرقية الخبيث أو تضخم عقيدي متعدد كبير مصحوب بأعراض ضغطية أو مرض غريفز المقاوم للعلاج الدوائي أو سرطان درقي عالي الخطورة.'
      ),
      (
        'Total thyroidectomy with central neck dissection',
        'THYR','60252-00',
        'Total thyroidectomy with concurrent level VI (central compartment) lymph node dissection, performed for differentiated thyroid carcinoma with suspected or proven nodal disease in the central neck.',
        'استئصال الغدة الدرقية الكامل مع تشريح الرقبة المركزي',
        'استئصال الغدة الدرقية الكامل مع تشريح متزامن للعقد الليمفاوية المركزية (مستوى VI)، يُجرى لسرطان الغدة الدرقية المتمايز مع اشتباه أو إثبات إصابة عقدية في وسط الرقبة.'
      ),
      (
        'Parathyroidectomy',
        'THYR','60500-00',
        'Surgical removal of one or more parathyroid glands; performed for primary hyperparathyroidism (single adenoma via focused approach or multigland disease via bilateral exploration) causing hypercalcaemia and end-organ complications.',
        'استئصال الغدة جارة الدرقية',
        'استئصال جراحي لواحدة أو أكثر من الغدد جارة الدرقية؛ يُجرى لفرط نشاط الغدة جارة الدرقية الأولي (ورم حميد منفرد عبر نهج موجه أو مرض متعدد الغدد عبر استكشاف ثنائي) المسبب لارتفاع الكالسيوم ومضاعفات الأعضاء الطرفية.'
      )

      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "proc_cpts"
      WHERE "alphaCode" IN ('ABDO','LAPR','ENDO','COLO','BREA','THYR')
    `);
  }
}
