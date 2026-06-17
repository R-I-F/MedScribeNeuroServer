import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Extends GS proc_cpts from 65 to 100 by adding 35 procedures across new
 * alpha-code groups (BILI, PANC, OESO, GASTR) and additions to existing
 * groups (ENDO, LAPR, COLO, NECK, BREA, THYR, ABDO).
 */
export class ExtendGsProcCpts1750000000069 implements MigrationInterface {
  name = "ExtendGsProcCpts1750000000069";

  private async link(
    runner: QueryRunner,
    mainDiagTitle: string,
    pairs: [string, string][]
  ): Promise<void> {
    for (const [alphaCode, numCode] of pairs) {
      await runner.query(
        `INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
         SELECT md.id, p.id
         FROM "main_diags" md
         JOIN "departments" dept ON md."departmentId" = dept.id
         JOIN "proc_cpts" p ON p."alphaCode" = $1 AND p."numCode" = $2
         WHERE dept.code = 'GS' AND md.title = $3
         ON CONFLICT DO NOTHING`,
        [alphaCode, numCode, mainDiagTitle]
      );
    }
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Insert 35 new proc_cpts ────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES

      -- ── BILI: biliary and hepatic procedures ─────────────────────────────
      (
        'Percutaneous cholecystostomy',
        'BILI','47490-00',
        'Image-guided (US/CT) percutaneous gallbladder drainage via catheter; temporising measure for acute cholecystitis in high-risk surgical patients unfit for immediate cholecystectomy; allows gallbladder decompression and sepsis control pending definitive surgery.',
        'تصريف المرارة عبر الجلد',
        'تصريف المرارة عبر الجلد بتوجيه التصوير بإدخال قسطرة عبر جدار البطن؛ إجراء مؤقت لالتهاب المرارة الحاد في المرضى عالي الخطورة غير الصالحين لاستئصال المرارة الفوري؛ يُتيح فك ضغط المرارة وضبط الإنتان ريثما يجرى التدخل الجراحي الجذري.'
      ),
      (
        'Hepaticojejunostomy (Roux-en-Y biliary reconstruction)',
        'BILI','47760-00',
        'Anastomosis of the common hepatic or bile duct to a Roux-en-Y jejunal loop to restore biliary-enteric continuity; performed for benign/malignant biliary stricture, post-cholecystectomy duct injury, and as standard reconstruction after pancreaticoduodenectomy or bile duct resection for cholangiocarcinoma.',
        'مفاغرة القناة الكبدية مع الصائم (رو-آن-واي)',
        'مفاغرة بين القناة الكبدية المشتركة أو الصفراوية وحلقة صائمية رو-آن-واي لاستعادة الاستمرارية الصفراوية-المعوية؛ تُجرى للتضيّق الصفراوي الحميد والخبيث وإصابة القناة بعد استئصال المرارة وإعادة البناء المعيارية بعد ويبل.'
      ),
      (
        'Choledochoduodenostomy (biliary-enteric bypass)',
        'BILI','47720-00',
        'Anastomosis between the common bile duct and duodenum to bypass biliary obstruction; performed for choledocholithiasis not amenable to endoscopic extraction or benign distal CBD stricture; simpler than Roux-en-Y reconstruction but risks sump syndrome (debris accumulation in CBD).',
        'مفاغرة القناة الصفراوية مع الاثني عشر',
        'مفاغرة بين القناة الصفراوية المشتركة والاثني عشر لتحويل الانسداد الصفراوي؛ تُجرى في حصوات القناة غير القابلة للاستخراج بالتنظير والتضيّق الحميد البعيد؛ أبسط من رو-آن-واي لكنها تحمل خطر متلازمة الحوض.'
      ),
      (
        'Partial hepatectomy (open)',
        'BILI','47120-00',
        'Surgical resection of part of the liver (less than a lobe) for HCC, colorectal liver metastases, cholangiocarcinoma, or benign lesions (hydatid cyst, hepatic abscess); planned along Couinaud segments; requires adequate remnant liver volume (≥25% normal, ≥40% cirrhotic); portal vein embolisation may augment remnant volume pre-operatively.',
        'استئصال الكبد الجزئي (مفتوح)',
        'استئصال جراحي لجزء من الكبد للأورام الخبيثة (سرطان الكبد ونقائل القولون وسرطان الأقنية) أو الآفات الحميدة (كيس أكياسي وخراج كبدي)؛ يُخطَّط على أساس قطاعات كوينو؛ يتطلب حجماً كافياً للكبد المتبقي؛ قد يُسبقه انصمام الوريد البابي.'
      ),
      (
        'Percutaneous ablation of liver tumour (RFA/MWA)',
        'BILI','47382-00',
        'Image-guided percutaneous thermal ablation of hepatic tumours using radiofrequency (RFA) or microwave (MWA) probes; applicable for HCC meeting ablation criteria (≤3 nodules ≤3 cm, or single ≤5 cm) or colorectal liver metastases in patients unfit for resection; lower morbidity than surgery; higher local recurrence for tumours >3 cm.',
        'إجهاد ورم الكبد عبر الجلد (تردد لاسلكي/موجات دقيقة)',
        'إجهاد حراري موجّه بالتصوير لأورام الكبد عبر الجلد بالتردد اللاسلكي أو الموجات الدقيقة؛ مناسب لسرطان الكبد المستوفي معايير الإجهاد أو نقائل القولون في المرضى غير الصالحين للجراحة؛ مراضة أقل من الاستئصال؛ تكرار موضعي أعلى للأورام >3 سم.'
      ),
      (
        'ERCP with biliary stent placement',
        'BILI','43274-00',
        'ERCP with placement of a plastic or self-expanding metallic stent (SEMS) across a biliary stricture; performed for malignant biliary obstruction (cholangiocarcinoma, pancreatic head carcinoma) as palliation, or benign stricture as bridge to surgery; SEMS preferred for malignant obstruction (longer patency); plastic stents for benign disease or pre-operative drainage.',
        'ERCP مع وضع دعامة صفراوية',
        'ERCP مع وضع دعامة بلاستيكية أو معدنية ذاتية التمدد عبر تضيّق صفراوي؛ يُجرى للانسداد الصفراوي الخبيث كعلاج تلطيفي أو للتضيّق الحميد كجسر للجراحة؛ الدعامة المعدنية مُفضَّلة في الانسداد الخبيث؛ البلاستيكية للحالات الحميدة.'
      ),

      -- ── PANC: pancreatic procedures ──────────────────────────────────────
      (
        'Pancreaticoduodenectomy (Whipple procedure)',
        'PANC','48150-00',
        'En bloc resection of the pancreatic head, duodenum, distal CBD, and gallbladder with pancreaticojejunostomy, hepaticojejunostomy, and gastrojejunostomy reconstruction; curative-intent operation for periampullary malignancies (pancreatic adenocarcinoma, ampullary carcinoma, distal cholangiocarcinoma); major complications include pancreatic fistula, delayed gastric emptying, and post-pancreatectomy haemorrhage.',
        'الاستئصال البنكرياسي الاثني عشري (عملية ويبل)',
        'استئصال شامل لرأس البنكرياس والاثني عشر وجزء من القناة الصفراوية والمرارة مع إعادة بناء مفاغرية؛ عملية شافية لأورام محيط الحليمة الخبيثة؛ مضاعفاتها الناسور البنكرياسي وتأخر إفراغ المعدة والنزيف بعد الاستئصال.'
      ),
      (
        'Pylorus-preserving pancreaticoduodenectomy (PPPD)',
        'PANC','48154-00',
        'Modification of the classic Whipple procedure preserving the pylorus and 2–3 cm of the proximal duodenum; equivalent oncological outcomes for resectable periampullary cancers; reduces dumping syndrome and improves nutritional outcomes; delayed gastric emptying remains the most common complication; contraindicated when tumour involves the proximal duodenum.',
        'الاستئصال البنكرياسي الاثني عشري مع الحفاظ على البواب',
        'تعديل على ويبل الكلاسيكية مع الحفاظ على البواب و2–3 سم من الاثني عشر القريب؛ نتائج أورامية مكافئة مع انخفاض متلازمة الإغراق؛ تأخر إفراغ المعدة أكثر مضاعفة شيوعاً؛ موانعه إصابة الاثني عشر القريب بالورم.'
      ),
      (
        'Distal pancreatectomy (open)',
        'PANC','48140-00',
        'Resection of the body and tail of the pancreas, usually with splenectomy; performed for adenocarcinoma, neuroendocrine tumours, mucinous cystic neoplasms, IPMN of the body/tail, and chronic pancreatitis; major complications include pancreatic fistula (15–25%) and post-splenectomy infection risk (vaccinations required); spleen-preserving variant possible for benign lesions.',
        'استئصال البنكرياس البعيد (مفتوح)',
        'استئصال جسم وذيل البنكرياس عادةً مع استئصال الطحال؛ يُجرى للسرطان الغدي وأورام الغدد الصم العصبية والأورام الكيسية المخاطية والتهاب البنكرياس المزمن؛ المضاعفات الكبرى الناسور البنكرياسي وخطر العدوى بعد استئصال الطحال.'
      ),
      (
        'Internal drainage of pancreatic pseudocyst (cystojejunostomy)',
        'PANC','48520-00',
        'Surgical anastomosis between a mature pancreatic pseudocyst and a Roux-en-Y jejunal loop (cystojejunostomy) or posterior stomach (cystogastrostomy); performed for symptomatic pseudocysts >6 cm failing or not amenable to percutaneous/endoscopic drainage; pseudocyst wall must be mature (≥6 weeks); EUS-guided endoscopic cystogastrostomy is now preferred when feasible.',
        'تصريف داخلي للكيس البنكرياسي الكاذب (كيس-صائم)',
        'مفاغرة جراحية بين كيس بنكرياسي كاذب ناضج وحلقة صائمية رو-آن-واي أو الجدار الخلفي للمعدة؛ يُجرى للأكياس العرضية >6 سم الفاشلة في التصريف؛ يجب أن يكون الجدار ناضجاً (≥6 أسابيع)؛ التصريف بتوجيه EUS مُفضَّل عند الإمكان.'
      ),
      (
        'Open pancreatic necrosectomy',
        'PANC','48105-00',
        'Surgical debridement of infected pancreatic and peripancreatic necrotic tissue in necrotising pancreatitis; indicated when minimally invasive approaches (endoscopic/percutaneous) fail; performed via laparotomy or retroperitoneal flank approach; associated with high morbidity; step-up approach (percutaneous drain → minimally invasive → open) is preferred to delay or avoid open surgery.',
        'إزالة النخر البنكرياسي المفتوحة',
        'تنظيف جراحي للأنسجة البنكرياسية المنخورة المصابة بعدوى؛ مُشارٌ إليها عند فشل المناهج الأقل توغلاً؛ تُجرى عبر فتح البطن أو نهج الخاصرة خلف الصفاقي؛ مرتبطة بمراضة عالية؛ نهج التصعيد التدريجي مُفضَّل لتجنب الجراحة المفتوحة.'
      ),

      -- ── OESO: oesophageal procedures ─────────────────────────────────────
      (
        'Transhiatal oesophagectomy',
        'OESO','43107-00',
        'Total/near-total oesophageal resection via abdominal and cervical incisions without thoracotomy; oesophagus mobilised by blunt dissection through the diaphragmatic hiatus; stomach used as conduit with cervical anastomosis; preferred for middle/lower oesophageal carcinoma when thoracotomy is best avoided; higher anastomotic leak and recurrent laryngeal nerve injury rates than Ivor Lewis.',
        'استئصال المريء عبر الحجاب الحاجز',
        'استئصال كلي أو شبه كلي للمريء عبر شقوق بطنية وعنقية دون فتح الصدر؛ تُستخدم المعدة كقناة مع مفاغرة عنقية؛ مُفضَّل لسرطانات المريء الوسطى والسفلى عند تجنّب فتح الصدر؛ معدل تسرب المفاغرة أعلى من إيفور لويس.'
      ),
      (
        'Ivor Lewis oesophagectomy (right thoracotomy)',
        'OESO','43117-00',
        'Two-phase oesophagectomy combining abdominal mobilisation with right thoracotomy and intrathoracic oesophagogastric anastomosis; preferred approach for mid/lower thoracic oesophageal adenocarcinoma; better mediastinal lymph node access and proximal margin than transhiatal; higher anastomotic leak rates, but a thoracic leak is better tolerated than cervical.',
        'استئصال المريء بطريقة إيفور لويس (فتح الصدر الأيمن)',
        'استئصال المريء ثنائي الطور بدمج تحرير بطني مع فتح صدر أيمن ومفاغرة معدية-مريئية داخل الصدر؛ مُفضَّل لسرطان غدي المريء الصدري المتوسط والسفلي؛ رؤية أفضل للعقد المنصفية وهامش قريب أفضل من النهج عبر الحجاب.'
      ),
      (
        'EGD with percutaneous endoscopic gastrostomy (PEG)',
        'OESO','43246-00',
        'Endoscopic placement of a gastrostomy feeding tube through the abdominal wall (pull or push technique) for long-term enteral nutrition in patients unable to swallow (neurological dysphagia, oesophageal obstruction, head-and-neck cancer, prolonged ventilation); preferred over surgical gastrostomy when feasible; contraindications include ascites and prior gastrectomy.',
        'تنظير علوي مع أنبوب التغذية المعدي عبر الجلد (PEG)',
        'وضع أنبوب تغذية معدي بالتنظير عبر جدار البطن للتغذية المعوية طويلة الأمد في المرضى العاجزين عن البلع؛ مُفضَّل على فغر المعدة الجراحي؛ موانعه الاستسقاء واستئصال المعدة السابق وعدم إمكانية إضاءة جدار البطن.'
      ),
      (
        'EGD with balloon dilation of oesophageal stricture',
        'OESO','43248-00',
        'Endoscopic dilation of oesophageal stricture using a TTS balloon dilator (≥30 mm) or Savary-Gilliard bougie over a guidewire; performed for benign strictures (peptic, anastomotic, radiation-induced, eosinophilic oesophagitis); may require repeated sessions; perforation risk ~0.1–0.4%; malignant strictures may be dilated prior to stent placement.',
        'تنظير علوي مع توسيع ضيق المريء بالبالون',
        'توسيع ضيق المريء الحميد بالتنظير بموسّع بالون (≥30 مم) أو موسّع سافاري-جيليار؛ يُجرى للتضيّقات الحمضية والمفاغرية والإشعاعية؛ قد يستلزم جلسات متكررة؛ خطر الانثقاب ~0.1–0.4%؛ التضيّقات الخبيثة قد تُوسَّع قبل الدعامة.'
      ),

      -- ── GASTR: gastric resection procedures ──────────────────────────────
      (
        'Total gastrectomy with oesophagojejunostomy',
        'GASTR','43620-00',
        'Complete stomach removal with end-to-side/end-to-end oesophagojejunostomy (Roux-en-Y or omega loop); performed for proximal gastric cancer, total stomach involvement, or gastric GIST; Roux-en-Y reconstruction prevents alkaline reflux; jejunal J-pouch reservoir optional; requires lifelong B12 supplementation.',
        'استئصال المعدة الكلي مع مفاغرة المريء-الصائم',
        'استئصال كامل للمعدة مع مفاغرة مريئية-صائمية؛ يُجرى لسرطان المعدة القريب وإصابة المعدة الكاملة وأورام GIST؛ إعادة البناء رو-آن-واي تمنع الارتجاع القلوي؛ تتطلب تكملة B12 مدى الحياة.'
      ),
      (
        'Total gastrectomy with Roux-en-Y reconstruction',
        'GASTR','43621-00',
        'Total stomach removal with Roux-en-Y oesophagojejunostomy; the 40–60 cm Roux limb minimises alkaline reflux; appropriate for proximal, diffuse, or linitis plastica-type gastric adenocarcinoma; D2 lymphadenectomy performed with curative intent; preferred reconstruction to reduce biliary reflux oesophagitis and improve quality of life post-gastrectomy.',
        'استئصال المعدة الكلي مع إعادة بناء رو-آن-واي',
        'استئصال كامل للمعدة مع مفاغرة مريئية-صائمية رو-آن-واي؛ طرف رو بطول 40–60 سم يقلل الارتجاع القلوي؛ مناسب لسرطان المعدة القريب والمنتشر؛ تشريح عقد D2 بقصد شافٍ؛ إعادة بناء مُفضَّلة لتقليل الارتجاع الصفراوي.'
      ),
      (
        'Subtotal gastrectomy with Billroth I (gastroduodenostomy)',
        'GASTR','43631-00',
        'Resection of the distal two-thirds of the stomach with direct gastroduodenostomy; performed for distal gastric cancer, antral GIST, or peptic gastric outlet obstruction; preserves physiological duodenal passage; contraindicated when duodenum is involved by tumour or extensively scarred; lower operative mortality than total gastrectomy; dumping syndrome may occur.',
        'استئصال معدة جزئي مع مفاغرة بيلروث I (معدة-اثني عشر)',
        'استئصال الثلثين البعيديين من المعدة مع مفاغرة مباشرة للاثني عشر؛ يُجرى لسرطان المعدة البعيد وأورام GIST وانسداد مخرج المعدة الهضمي؛ يحافظ على المسار الفيزيولوجي للاثني عشر؛ وفاة جراحية أقل من الاستئصال الكلي.'
      ),
      (
        'Subtotal gastrectomy with Billroth II (gastrojejunostomy)',
        'GASTR','43632-00',
        'Resection of the distal two-thirds of the stomach with gastrojejunostomy and closure of the duodenal stump; performed when Billroth I is not feasible (inflamed/scarred duodenum); higher risk of alkaline reflux gastritis and dumping than Billroth I; afferent loop syndrome may complicate a long afferent limb; Roux-en-Y conversion manages persistent alkaline reflux.',
        'استئصال معدة جزئي مع مفاغرة بيلروث II (معدة-صائم)',
        'استئصال الثلثين البعيديين من المعدة مع مفاغرة معدية-صائمية وإغلاق جذر الاثني عشر؛ يُجرى عند عدم إمكانية بيلروث I؛ خطر أعلى لالتهاب المعدة الارتجاعي ومتلازمة الإغراق؛ التحويل لرو-آن-واي يعالج الارتجاع القلوي المستمر.'
      ),
      (
        'Biliopancreatic diversion with duodenal switch',
        'GASTR','43845-00',
        'Malabsorptive bariatric procedure combining sleeve gastrectomy with duodenal switch: duodenum divided distal to pylorus, Roux limb carries food to distal ileum (150–250 cm), biliopancreatic limb to a short common channel (50–100 cm); most powerful bariatric-metabolic procedure; highest risk of protein malnutrition and fat-soluble vitamin deficiency; reserved for BMI ≥50 or severe metabolic disease.',
        'تحويل صفراوي-بنكرياسي مع تحويل الاثني عشر',
        'إجراء سوء امتصاص لعلاج السمنة يجمع استئصال الأمعاء بالقسطرة مع تحويل الاثني عشر؛ أقوى إجراء لعلاج السمنة من حيث إنقاص الوزن وتحسّن الأيض؛ أعلى خطر لنقص البروتين والفيتامينات القابلة للدهن؛ محجوز للسمنة الفائقة (BMI ≥50).'
      ),

      -- ── ENDO additions ───────────────────────────────────────────────────
      (
        'EGD with variceal band ligation',
        'ENDO','43244-00',
        'Endoscopic rubber-band ligation of oesophageal or gastric varices to induce ischaemic thrombosis; performed for acute variceal haemorrhage or primary/secondary prophylaxis in portal hypertension; superior to sclerotherapy for bleeding control and secondary prophylaxis; sessions every 2–4 weeks until variceal eradication; combined with vasoactive drugs and antibiotics for acute bleeds.',
        'تنظير علوي مع ربط دوالي المريء بالحلقات المطاطية',
        'وضع حلقات مطاطية حول دوالي المريء أو المعدة لإحداث خنق إقفاري وتجلّط؛ يُجرى للنزيف الوريدي الحاد أو للوقاية في ارتفاع ضغط الوريد البابي؛ جلسات كل 2–4 أسابيع حتى استئصال الدوالي؛ يُدمج مع الأدوية الوعائية والمضادات الحيوية للنزيف الحاد.'
      ),
      (
        'EGD with endoscopic mucosal resection (EMR)',
        'ENDO','43254-00',
        'Endoscopic resection of flat/sessile mucosal lesions of the upper GI tract using snare after submucosal injection (inject-and-cut); performed for early gastric cancer (T1a), Barrett''s oesophagus with high-grade dysplasia, early oesophageal SCC, and large gastric polyps; curative for lesions confined to the mucosa without lymphovascular invasion; ESD preferred for lesions >2 cm.',
        'تنظير علوي مع قطع الغشاء المخاطي بالتنظير (EMR)',
        'استئصال تنظيري لآفات مخاطية مسطحة في الجهاز الهضمي العلوي بعد حقن تحت المخاطية؛ يُجرى لسرطان المعدة المبكر وخلل التنسج عالي الدرجة في مريء باريت وسرطان المريء المبكر؛ شافٍ للآفات المحصورة في الغشاء دون غزو وعائي؛ ESD مُفضَّل للآفات >2 سم.'
      ),

      -- ── LAPR additions ───────────────────────────────────────────────────
      (
        'Laparoscopic ablation of liver tumour',
        'LAPR','47370-00',
        'Laparoscopic thermal ablation of hepatic tumours using RFA or MWA probes under direct laparoscopic vision; advantages over percutaneous approach include better visualisation, protection of adjacent structures, and concurrent staging laparoscopy; performed for HCC meeting ablation criteria or unresectable colorectal liver metastases; may be combined with laparoscopic hepatic resection.',
        'إجهاد ورم الكبد بالمنظار',
        'إجهاد حراري لأورام الكبد بالتردد اللاسلكي أو الموجات الدقيقة تحت الرؤية المنظارية المباشرة؛ مزايا على النهج عبر الجلد تشمل رؤية أفضل وحماية التراكيب المجاورة وتنظيراً تصنيفياً متزامناً؛ مناسب لسرطان الكبد أو نقائل القولون غير القابلة للاستئصال.'
      ),
      (
        'Laparoscopic distal pancreatectomy',
        'LAPR','48145-00',
        'Minimally invasive laparoscopic resection of the body and tail of the pancreas, with or without splenectomy; oncologically equivalent to open for benign and low-grade pancreatic lesions; associated with less blood loss, shorter hospital stay, and earlier recovery; technically demanding near the splenic hilum and superior mesenteric vein; spleen-preserving variants (Kimura or Warshaw technique) used for benign lesions.',
        'استئصال البنكرياس البعيد بالمنظار',
        'استئصال طفيف التوغل لجسم وذيل البنكرياس مع أو بدون استئصال الطحال؛ مكافئ أورامياً للمفتوح للآفات الحميدة؛ نزيف أقل وإقامة أقصر وتعافٍ أسرع؛ تقنياً صعب قرب هيلة الطحال؛ يمكن الحفاظ على الطحال بتقنيتي كيمورا أو وارشو.'
      ),
      (
        'Laparoscopic distal gastrectomy with Roux-en-Y reconstruction',
        'LAPR','43633-00',
        'Minimally invasive laparoscopic resection of the distal two-thirds of the stomach with Roux-en-Y or Billroth II gastrojejunostomy; performed for distal gastric adenocarcinoma (D1+ or D2 lymphadenectomy), large antral GIST, or complicated peptic ulcer; non-inferior oncological outcomes to open confirmed in randomised trials (KLASS-01, COACT1001); reduces blood loss, hospital stay, and improves quality of life.',
        'استئصال المعدة الجزئي البعيد بالمنظار مع إعادة بناء رو-آن-واي',
        'استئصال طفيف التوغل للثلثين البعيديين من المعدة مع مفاغرة رو-آن-واي أو بيلروث II؛ يُجرى لسرطان المعدة البعيد وأورام GIST وقرحة معقدة؛ نتائج أورامية غير دون مؤكّدة في تجارب عشوائية كبيرة؛ نزيف أقل وإقامة أقصر وجودة حياة أفضل.'
      ),

      -- ── COLO additions ───────────────────────────────────────────────────
      (
        'Total abdominal colectomy with ileorectal anastomosis',
        'COLO','44150-00',
        'Resection of the entire colon with end-to-end ileorectal anastomosis (IRA); performed for Lynch syndrome or FAP with rectal sparing, synchronous multicentric colorectal cancer, and refractory ulcerative/Crohn''s colitis when rectal preservation is possible; bowel frequency increases (4–8/day); lifelong surveillance sigmoidoscopy required for the residual rectum.',
        'استئصال القولون الكلي مع مفاغرة لفائفي-مستقيمي',
        'استئصال القولون بأكمله مع مفاغرة لفائفي-مستقيمية؛ يُجرى في متلازمة لينش وداء السلائل العائلي مع الحفاظ على المستقيم، وسرطان القولون المتزامن المتعدد، والتهاب القولون المزمن المقاوم؛ تكرار التغوّط يزيد؛ مراقبة المستقيم مدى الحياة ضرورية.'
      ),
      (
        'Total proctocolectomy with ileal pouch-anal anastomosis (IPAA)',
        'COLO','44157-00',
        'Complete removal of the colon and rectum with ileal J-pouch construction and anastomosis to the anal canal above the dentate line; curative for ulcerative colitis, FAP, and selected Lynch syndrome cases; avoids permanent stoma; typically staged with a temporary loop ileostomy; complications include pouchitis (50% at 5 years), pouch failure, and anastomotic leak.',
        'استئصال القولون والمستقيم الكلي مع مفاغرة جيب اللفائفي-شرجي (IPAA)',
        'استئصال كامل للقولون والمستقيم مع تشييد جيب لفائفي J ومفاغرته بالقناة الشرجية؛ شافٍ للتهاب القولون التقرحي وداء السلائل العائلي؛ يتجنّب الفغرة الدائمة؛ مُنجَّم مع فغرة تحويلية مؤقتة؛ المضاعفات: التهاب الجيب وفشله وتسرب المفاغرة.'
      ),

      -- ── NECK: cervical lymphadenectomy / neck dissection ─────────────────
      (
        'Modified radical neck dissection (selective cervical lymphadenectomy)',
        'NECK','38724-00',
        'Removal of cervical lymph nodes at levels I–V while preserving one or more non-lymphatic structures (sternocleidomastoid, internal jugular vein, spinal accessory nerve); performed for metastatic thyroid carcinoma (papillary, medullary) to lateral cervical nodes, or regional nodal metastases from head-and-neck and breast cancers; superior functional outcomes to radical dissection.',
        'تشريح الرقبة الجذري المعدّل (استئصال العقد الرقبية المنتقى)',
        'إزالة منهجية للغدد اللمفاوية الرقبية في المستويات I–V مع الحفاظ على التراكيب غير الليمفاوية؛ يُجرى لنقائل سرطان الغدة الدرقية الجانبية أو نقائل سرطانات الرأس والعنق والثدي؛ نتائج وظيفية أفضل من التشريح الجذري.'
      ),
      (
        'Radical neck dissection with thyroidectomy',
        'NECK','60605-00',
        'Combined total thyroidectomy and radical/modified radical neck dissection in a single operation for advanced or locally invasive thyroid carcinoma with extensive cervical nodal involvement; radical dissection removes sternocleidomastoid, internal jugular vein, and spinal accessory nerve when directly invaded; used primarily for invasive medullary or papillary carcinoma with bulky nodal disease.',
        'تشريح الرقبة الجذري مع استئصال الغدة الدرقية',
        'استئصال كلي للغدة الدرقية مع تشريح الرقبة الجذري في عملية واحدة لسرطان الغدة الدرقية المتقدم مع إصابة واسعة للغدد الرقبية؛ يُستخدم أساساً للسرطان النخاعي أو الحليمي الغازي مع مرض عقلي ضخم أو امتداد خارج العقدة.'
      ),

      -- ── BREA additions ───────────────────────────────────────────────────
      (
        'Subcutaneous mastectomy for gynaecomastia',
        'BREA','19300-00',
        'Surgical removal of glandular breast tissue through a periareolar or inframammary incision preserving the skin and nipple-areola complex; performed for symptomatic or cosmetically significant gynaecomastia refractory to medical management; specimen sent for histopathology to exclude malignancy; liposuction may be combined for the fatty component; complications include haematoma, seroma, and nipple necrosis.',
        'استئصال الثدي تحت الجلد لعلاج التثدي الرجالي',
        'استئصال النسيج الغدي للثدي عبر شق حول الهالة أو أسفل الثدي مع الحفاظ على الجلد ومجمع الحلمة-الهالة؛ يُجرى للتثدي الرجالي المقاوم للعلاج الدوائي؛ الفحص النسيجي لاستبعاد الخباثة؛ الشفط الدهني قد يُدمج؛ مضاعفاته ورم دموي ومصلي ونخر الحلمة.'
      ),
      (
        'Breast reconstruction with tissue expander',
        'BREA','19357-00',
        'Immediate or delayed placement of an inflatable silicone tissue expander in the sub-pectoral space at or after mastectomy; gradually inflated with saline via a subcutaneous port over weeks to months; subsequently exchanged for a permanent implant in a second-stage procedure; most common reconstruction method; irradiation significantly increases complication rates (capsular contracture, implant loss).',
        'ترميم الثدي بموسّع الأنسجة',
        'وضع موسّع الأنسجة السيليكوني القابل للنفخ في الفضاء تحت الصدرية فوري أو متأخر بعد الاستئصال؛ يُنفَّخ تدريجياً بالمحلول الملحي ثم يُستبدل بغرسة دائمة؛ أكثر طرق ترميم الثدي شيوعاً؛ الإشعاع يزيد مضاعفاته بشكل ملحوظ.'
      ),

      -- ── THYR addition ────────────────────────────────────────────────────
      (
        'Parathyroid autotransplantation',
        'THYR','60512-00',
        'Intraoperative technique performed during total thyroidectomy or parathyroidectomy: devascularised parathyroid glands confirmed by frozen section are minced into 1 mm fragments and implanted into pockets in the sternocleidomastoid muscle; prevents permanent hypoparathyroidism; graft viability confirmed by intraoperative PTH measurement; temporary hypocalcaemia is expected post-operatively.',
        'زراعة الغدة جارة الدرقية ذاتياً',
        'تقنية أثناء العملية خلال استئصال الغدة الدرقية: الغدد جارة الدرقية المقطوعة التروية تُقطَّع إلى قطع 1 مم وتُزرع في عضلة القصية الترقوية؛ تمنع قصور الغدة الدائم؛ قابلية الطعم تُؤكَّد بقياس PTH أثناء الجراحة؛ انخفاض الكالسيوم المؤقت متوقع.'
      ),

      -- ── ABDO additions ───────────────────────────────────────────────────
      (
        'Reopening of recent laparotomy (re-laparotomy)',
        'ABDO','49002-00',
        'Planned or emergency re-opening of the abdomen after a recent laparotomy; indications include damage control second-look (bowel viability assessment after packing), post-operative haemorrhage, anastomotic leak, bowel ischaemia, and abdominal compartment syndrome; in damage control, the abdomen may be left open under vacuum-assisted closure (VAC) pending physiological correction.',
        'إعادة فتح البطن (فتح بطن ثانٍ)',
        'إعادة فتح البطن المخططة أو الطارئة بعد فتح بطن حديث؛ المؤشرات تشمل ضبط الأضرار ونظرة ثانية لتقييم حيوية الأمعاء والنزيف وتسرب المفاغرة ومتلازمة القسم البطني؛ في ضبط الأضرار قد يُترك البطن مفتوحاً تحت الشفط السلبي.'
      ),
      (
        'Open drainage of peritoneal or intra-abdominal abscess',
        'ABDO','49020-00',
        'Surgical incision and drainage of a loculated intra-abdominal abscess (subphrenic, pelvic, paracolic, or interloop) via laparotomy when percutaneous CT/US-guided drainage has failed or is not feasible, or when the abscess requires concomitant surgical management; cultures taken; drains left in situ; most abscesses now managed percutaneously.',
        'تصريف خراج بريتوني أو داخل البطن المفتوح',
        'شق وتصريف خراج داخل البطن عبر فتح البطن عند فشل التصريف عبر الجلد أو عدم جدواه أو ارتباطه بحالة جراحية حادة؛ تُؤخذ زراعات بكتيرية وتُترك المصارف في موضعها؛ معظم الخراجات تُعالج بالتصريف عبر الجلد.'
      ),
      (
        'Exclusion of small intestine (intestinal bypass)',
        'ABDO','44700-00',
        'Surgical exclusion of a diseased small bowel segment from intestinal transit by creating a side-to-side enteroenteric bypass around the obstructed/diseased segment; performed for unresectable malignant small bowel obstruction (palliative), radiation enteritis with dense adhesions, complex Crohn''s fistula, or volvulus when bowel length preservation is critical.',
        'إقصاء قطعة من الأمعاء الدقيقة (تجاوز الأمعاء)',
        'إقصاء قطعة مريضة من الأمعاء الدقيقة بإنشاء مفاغرة معوية جانبية حول الانسداد أو الآفة؛ يُجرى للانسداد الخبيث غير القابل للاستئصال (تلطيفي) والتهاب الأمعاء الإشعاعي والناسور المعوي المعقد عند ضرورة الحفاظ على طول الأمعاء.'
      )

      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);

    // ── 2. Link proc_cpts to GS main_diags ───────────────────────────────

    await this.link(queryRunner, "cholecystitis & cholelithiasis", [
      ["BILI", "47490-00"], // percutaneous cholecystostomy
      ["BILI", "47760-00"], // hepaticojejunostomy
      ["BILI", "47720-00"], // choledochoduodenostomy
      ["BILI", "47120-00"], // partial hepatectomy
      ["BILI", "47382-00"], // percutaneous ablation
      ["BILI", "43274-00"], // ERCP with stent
      ["PANC", "48150-00"], // Whipple
      ["PANC", "48154-00"], // PPPD
      ["PANC", "48140-00"], // distal pancreatectomy
      ["PANC", "48520-00"], // pseudocyst drainage
      ["PANC", "48105-00"], // necrosectomy
      ["LAPR", "47370-00"], // lap liver ablation
      ["LAPR", "48145-00"], // lap distal pancreatectomy
    ]);

    await this.link(queryRunner, "colorectal polyps & masses", [
      ["BILI", "47120-00"], // partial hepatectomy (colorectal liver mets / HCC)
      ["BILI", "47382-00"], // percutaneous ablation (colorectal liver mets)
      ["LAPR", "47370-00"], // lap liver ablation
      ["ENDO", "43254-00"], // EMR
      ["COLO", "44150-00"], // total abdominal colectomy
      ["COLO", "44157-00"], // total proctocolectomy IPAA
    ]);

    await this.link(queryRunner, "peptic ulcer disease", [
      ["OESO", "43107-00"], // transhiatal oesophagectomy
      ["OESO", "43117-00"], // Ivor Lewis oesophagectomy
      ["OESO", "43246-00"], // PEG
      ["OESO", "43248-00"], // oesophageal dilation
      ["GASTR", "43620-00"], // total gastrectomy
      ["GASTR", "43621-00"], // total gastrectomy Roux-en-Y
      ["GASTR", "43631-00"], // subtotal Billroth I
      ["GASTR", "43632-00"], // subtotal Billroth II
      ["ENDO", "43244-00"],  // variceal band ligation
      ["ENDO", "43254-00"],  // EMR
      ["LAPR", "43633-00"],  // lap distal gastrectomy
    ]);

    await this.link(queryRunner, "bariatric conditions", [
      ["GASTR", "43845-00"], // duodenal switch
    ]);

    await this.link(queryRunner, "acute abdomen", [
      ["PANC", "48150-00"], // Whipple
      ["PANC", "48520-00"], // pseudocyst drainage
      ["PANC", "48105-00"], // necrosectomy
      ["OESO", "43246-00"], // PEG
      ["ENDO", "43244-00"], // variceal band ligation
      ["ABDO", "49002-00"], // reoperation
      ["ABDO", "49020-00"], // abscess drainage
    ]);

    await this.link(queryRunner, "abdominal trauma", [
      ["ABDO", "49002-00"], // reoperation / damage control
      ["ABDO", "49020-00"], // abscess drainage
    ]);

    await this.link(queryRunner, "perforated viscus", [
      ["ABDO", "49002-00"], // reoperation
    ]);

    await this.link(queryRunner, "bowel obstruction", [
      ["ABDO", "44700-00"], // small intestine bypass
    ]);

    await this.link(queryRunner, "thyroid nodules", [
      ["NECK", "38724-00"], // modified radical neck dissection
      ["NECK", "60605-00"], // radical neck dissection + thyroidectomy
      ["THYR", "60512-00"], // parathyroid autotransplantation
    ]);

    await this.link(queryRunner, "breast lumps & cancer", [
      ["NECK", "38724-00"], // modified radical neck dissection (regional mets)
      ["BREA", "19300-00"], // subcutaneous mastectomy for gynaecomastia
      ["BREA", "19357-00"], // breast reconstruction with tissue expander
    ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const pairs: [string, string][] = [
      ["BILI", "47490-00"], ["BILI", "47760-00"], ["BILI", "47720-00"],
      ["BILI", "47120-00"], ["BILI", "47382-00"], ["BILI", "43274-00"],
      ["PANC", "48150-00"], ["PANC", "48154-00"], ["PANC", "48140-00"],
      ["PANC", "48520-00"], ["PANC", "48105-00"],
      ["OESO", "43107-00"], ["OESO", "43117-00"], ["OESO", "43246-00"], ["OESO", "43248-00"],
      ["GASTR", "43620-00"], ["GASTR", "43621-00"], ["GASTR", "43631-00"],
      ["GASTR", "43632-00"], ["GASTR", "43845-00"],
      ["ENDO", "43244-00"], ["ENDO", "43254-00"],
      ["LAPR", "47370-00"], ["LAPR", "48145-00"], ["LAPR", "43633-00"],
      ["COLO", "44150-00"], ["COLO", "44157-00"],
      ["NECK", "38724-00"], ["NECK", "60605-00"],
      ["BREA", "19300-00"], ["BREA", "19357-00"],
      ["THYR", "60512-00"],
      ["ABDO", "49002-00"], ["ABDO", "49020-00"], ["ABDO", "44700-00"],
    ];

    for (const [alphaCode, numCode] of pairs) {
      await queryRunner.query(
        `DELETE FROM "main_diag_procs"
         WHERE "procCptId" IN (SELECT id FROM "proc_cpts" WHERE "alphaCode" = $1 AND "numCode" = $2)`,
        [alphaCode, numCode]
      );
    }

    for (const [alphaCode, numCode] of pairs) {
      await queryRunner.query(
        `DELETE FROM "proc_cpts" WHERE "alphaCode" = $1 AND "numCode" = $2`,
        [alphaCode, numCode]
      );
    }
  }
}
