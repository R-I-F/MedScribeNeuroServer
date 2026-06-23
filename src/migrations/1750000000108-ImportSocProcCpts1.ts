import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * SOC proc_cpts — batch 1 of 2 (46 procedures). Groups: BRST (breast), AXIL (axillary/
 * sentinel node), COLR (colorectal resection), GAST (gastric), ESOG (oesophageal), HEPB
 * (hepatic resection/ablation), BILI (biliary resection), PANC (pancreatic resection).
 *
 * SOC previously had ZERO proc_cpts. Every CPT verified current/active against AAPC
 * (aapc.com/codes/cpt-codes/<code>) — see MEDICAL_CODE_AUDITS/SOC/AUDIT_SOC.md "2E". Linked
 * to main_diags by migration 110.
 */
export class ImportSocProcCpts11750000000108 implements MigrationInterface {
  name = "ImportSocProcCpts11750000000108";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      -- ── BRST: breast surgery ──────────────────────────────────────────────
      ('Partial mastectomy (lumpectomy)','BRST','19301-00','Breast-conserving excision of a malignant breast lesion (segment/quadrant) with surrounding margins.','استئصال الثدي الجزئي (استئصال الكتلة)','استئصال محافظ على الثدي لآفة ثدي خبيثة (قطعة/ربع) مع هوامش محيطة.'),
      ('Partial mastectomy with axillary lymphadenectomy','BRST','19302-00','Breast-conserving resection of a malignant lesion combined with removal of axillary lymph nodes.','استئصال الثدي الجزئي مع استئصال العقد الإبطية','استئصال محافظ على الثدي لآفة خبيثة مع إزالة العقد اللمفية الإبطية.'),
      ('Total (simple) mastectomy','BRST','19303-00','Complete removal of the breast preserving the pectoral muscles and axillary nodes.','استئصال الثدي الكامل (البسيط)','إزالة كاملة للثدي مع الحفاظ على عضلات الصدر والعقد الإبطية.'),
      ('Radical mastectomy','BRST','19305-00','Halsted radical mastectomy removing the breast, pectoral muscles and axillary lymph nodes en bloc.','استئصال الثدي الجذري','استئصال جذري (هالستد) يزيل الثدي وعضلات الصدر والعقد الإبطية ككتلة واحدة.'),
      ('Modified radical mastectomy','BRST','19307-00','Removal of the whole breast with axillary lymph nodes, preserving the pectoralis major muscle.','استئصال الثدي الجذري المعدّل','إزالة الثدي بالكامل مع العقد الإبطية والحفاظ على العضلة الصدرية الكبرى.'),
      ('Open excision of breast lesion','BRST','19120-00','Open surgical excision of one or more suspicious or benign breast lesions.','استئصال مفتوح لآفة الثدي','استئصال جراحي مفتوح لآفة أو أكثر مشتبهة أو حميدة في الثدي.'),
      ('Excision of breast lesion with preoperative marker','BRST','19125-00','Open excision of a non-palpable breast lesion localised by a preoperative radiological marker/wire.','استئصال آفة الثدي بعلامة قبل الجراحة','استئصال مفتوح لآفة ثدي غير مجسوسة مُحدَّدة بعلامة/سلك إشعاعي قبل الجراحة.'),
      -- ── AXIL: axillary / sentinel node ────────────────────────────────────
      ('Excision of deep axillary lymph nodes','AXIL','38525-00','Open excision of deep axillary lymph nodes for staging or treatment of breast/torso tumours.','استئصال العقد اللمفية الإبطية العميقة','استئصال مفتوح للعقد اللمفية الإبطية العميقة لتحديد المرحلة أو علاج أورام الثدي/الجذع.'),
      ('Axillary lymphadenectomy, superficial','AXIL','38740-00','Excision of the superficial axillary lymph nodes below the axillary vein.','استئصال العقد الإبطية السطحية','استئصال العقد اللمفية الإبطية السطحية أسفل الوريد الإبطي.'),
      ('Axillary lymphadenectomy, complete','AXIL','38745-00','Complete axillary node dissection removing superficial and deep nodes below the axillary vein.','استئصال العقد الإبطية الكامل','تجريف إبطي كامل يزيل العقد السطحية والعميقة أسفل الوريد الإبطي.'),
      ('Sentinel node identification (tracer injection)','AXIL','38792-00','Injection of radioactive tracer to map and identify the sentinel lymph node before excision.','تحديد العقدة الخافرة (حقن الكاشف)','حقن كاشف مُشِع لرسم وتحديد العقدة اللمفية الخافرة قبل الاستئصال.'),
      ('Intraoperative sentinel node mapping (dye)','AXIL','38900-00','Intraoperative injection of vital dye to identify the sentinel lymph node and drainage pattern.','رسم العقدة الخافرة أثناء العملية (الصبغة)','حقن صبغة حيوية أثناء العملية لتحديد العقدة اللمفية الخافرة ونمط التصريف.'),
      -- ── COLR: colorectal resection ────────────────────────────────────────
      ('Partial colectomy with anastomosis','COLR','44140-00','Open resection of a colonic segment with primary anastomosis for malignancy.','استئصال القولون الجزئي مع المفاغرة','استئصال مفتوح لقطعة من القولون مع مفاغرة أولية لورم خبيث.'),
      ('Partial colectomy with colostomy','COLR','44141-00','Colonic resection with formation of a colostomy/cecostomy when anastomosis is unsafe.','استئصال القولون الجزئي مع فغرة القولون','استئصال قولوني مع إنشاء فغرة قولون عند تعذّر المفاغرة الآمنة.'),
      ('Colectomy with end colostomy (Hartmann)','COLR','44143-00','Resection of the diseased colon with an end colostomy and closed distal stump (Hartmann procedure).','استئصال القولون مع فغرة قولون نهائية (هارتمان)','استئصال القولون المصاب مع فغرة قولون نهائية وإغلاق الجذمور البعيد (عملية هارتمان).'),
      ('Total abdominal colectomy with ileostomy','COLR','44150-00','Removal of the entire colon with end ileostomy or ileorectal anastomosis.','استئصال القولون الكلي مع فغرة لفائفية','إزالة القولون بالكامل مع فغرة لفائفية نهائية أو مفاغرة لفائفية مستقيمية.'),
      ('Ileocolic resection (right hemicolectomy)','COLR','44160-00','Resection of the terminal ileum and right colon with ileocolic anastomosis.','استئصال لفائفي قولوني (استئصال القولون الأيمن)','استئصال اللفائفي النهائي والقولون الأيمن مع مفاغرة لفائفية قولونية.'),
      ('Abdominoperineal resection of rectum (APR)','COLR','45110-00','Removal of the rectum, distal colon and anal sphincter with permanent colostomy for low rectal cancer.','الاستئصال البطني العجاني للمستقيم','إزالة المستقيم والقولون البعيد والمعصرة الشرجية مع فغرة قولون دائمة لسرطان المستقيم المنخفض.'),
      ('Proctectomy with coloanal anastomosis','COLR','45112-00','Resection of the rectum with sphincter preservation and coloanal anastomosis for rectal cancer.','استئصال المستقيم مع المفاغرة القولونية الشرجية','استئصال المستقيم مع الحفاظ على المعصرة ومفاغرة قولونية شرجية لسرطان المستقيم.'),
      ('Laparoscopic proctectomy with colostomy','COLR','45395-00','Laparoscopic abdominoperineal resection of the rectum with colostomy.','استئصال المستقيم بالمنظار مع فغرة قولون','استئصال بطني عجاني للمستقيم بالمنظار مع فغرة قولون.'),
      ('Pelvic exenteration for colorectal malignancy','COLR','45126-00','En-bloc removal of pelvic organs for locally advanced or recurrent colorectal cancer.','استئصال أعضاء الحوض لورم القولون والمستقيم','إزالة كتلية لأعضاء الحوض لسرطان قولون ومستقيم موضعي متقدم أو ناكس.'),
      ('Laparoscopic partial colectomy with anastomosis','COLR','44204-00','Laparoscopic resection of a colonic segment with primary anastomosis.','استئصال القولون الجزئي بالمنظار مع المفاغرة','استئصال قطعة من القولون بالمنظار مع مفاغرة أولية.'),
      ('Transanal excision of rectal tumour (partial thickness)','COLR','45171-00','Transanal local excision of a rectal tumour not including the muscularis propria.','الاستئصال عبر الشرج لورم المستقيم (سماكة جزئية)','استئصال موضعي عبر الشرج لورم مستقيمي لا يشمل الطبقة العضلية الخاصة.'),
      ('Transanal excision of rectal tumour (full thickness)','COLR','45172-00','Transanal full-thickness local excision of a rectal tumour including the muscularis propria.','الاستئصال عبر الشرج لورم المستقيم (سماكة كاملة)','استئصال موضعي كامل السماكة عبر الشرج لورم مستقيمي يشمل الطبقة العضلية الخاصة.'),
      -- ── GAST: gastric resection ───────────────────────────────────────────
      ('Total gastrectomy with oesophagoenterostomy','GAST','43620-00','Removal of the whole stomach with anastomosis of the oesophagus to the intestine.','استئصال المعدة الكلي مع مفاغرة مريئية معوية','إزالة المعدة بالكامل مع مفاغرة المريء بالأمعاء.'),
      ('Total gastrectomy with Roux-en-Y reconstruction','GAST','43621-00','Total gastrectomy with Roux-en-Y oesophagojejunal reconstruction for gastric cancer.','استئصال المعدة الكلي مع إعادة بناء رو-آن-واي','استئصال المعدة الكلي مع إعادة بناء مريئية صائمية بطريقة رو-آن-واي لسرطان المعدة.'),
      ('Distal gastrectomy (Billroth I)','GAST','43631-00','Distal gastrectomy with gastroduodenostomy (Billroth I reconstruction).','استئصال المعدة البعيد (بيلروث I)','استئصال المعدة البعيد مع مفاغرة معدية اثني عشرية (إعادة بناء بيلروث I).'),
      ('Distal gastrectomy (Billroth II)','GAST','43632-00','Distal gastrectomy with gastrojejunostomy (Billroth II reconstruction).','استئصال المعدة البعيد (بيلروث II)','استئصال المعدة البعيد مع مفاغرة معدية صائمية (إعادة بناء بيلروث II).'),
      ('Distal gastrectomy with Roux-en-Y','GAST','43633-00','Distal gastrectomy with Roux-en-Y gastrojejunostomy.','استئصال المعدة البعيد مع رو-آن-واي','استئصال المعدة البعيد مع مفاغرة معدية صائمية بطريقة رو-آن-واي.'),
      -- ── ESOG: oesophageal resection ───────────────────────────────────────
      ('Transhiatal total oesophagectomy','ESOG','43107-00','Total/near-total oesophagectomy without thoracotomy and gastric pull-up reconstruction.','استئصال المريء الكلي عبر الفرجة','استئصال مريئي كلي/شبه كلي دون شق صدري مع إعادة بناء بسحب المعدة.'),
      ('Partial oesophagectomy (Ivor Lewis)','ESOG','43117-00','Partial oesophagectomy via abdominal and right thoracic incisions with intrathoracic anastomosis.','استئصال المريء الجزئي (آيفور لويس)','استئصال مريئي جزئي عبر شقوق بطنية وصدرية يمنى مع مفاغرة داخل الصدر.'),
      ('Total oesophagectomy without reconstruction','ESOG','43124-00','Total/partial oesophagectomy with cervical oesophagostomy when reconstruction is deferred.','استئصال المريء الكلي دون إعادة بناء','استئصال مريئي كلي/جزئي مع فغرة مريئية عنقية عند تأجيل إعادة البناء.'),
      -- ── HEPB: hepatic resection / ablation ────────────────────────────────
      ('Partial hepatectomy (lobectomy)','HEPB','47120-00','Partial hepatic resection (lobectomy/sectionectomy) for primary or metastatic liver tumour.','استئصال الكبد الجزئي (الفص)','استئصال كبدي جزئي (فص/قطاع) لورم كبدي أولي أو نقيلي.'),
      ('Hepatic trisegmentectomy (extended hepatectomy)','HEPB','47122-00','Extended hepatic resection of three or more Couinaud sections for liver malignancy.','استئصال الكبد الموسّع (ثلاثي القطاعات)','استئصال كبدي موسّع لثلاثة قطاعات أو أكثر لورم كبدي خبيث.'),
      ('Total right hepatic lobectomy','HEPB','47130-00','Resection of the entire right hepatic lobe for tumour.','استئصال الفص الكبدي الأيمن الكامل','استئصال الفص الكبدي الأيمن بالكامل لورم.'),
      ('Wedge biopsy of liver, open','HEPB','47100-00','Open wedge (incisional) biopsy of the liver for histological diagnosis.','خزعة وتدية مفتوحة للكبد','خزعة وتدية مفتوحة من الكبد للتشخيص النسيجي.'),
      ('Laparoscopic ablation of liver tumour (RFA)','HEPB','47370-00','Laparoscopic radiofrequency ablation of one or more liver tumours.','استئصال ورم الكبد بالمنظار (التردد الراديوي)','استئصال بالتردد الراديوي بالمنظار لورم كبدي واحد أو أكثر.'),
      -- ── BILI: biliary resection ───────────────────────────────────────────
      ('Excision of extrahepatic bile duct tumour','BILI','47711-00','Resection of a tumour of the extrahepatic bile duct with biliary repair/reconstruction.','استئصال ورم القناة الصفراوية خارج الكبد','استئصال ورم في القناة الصفراوية خارج الكبد مع إصلاح/إعادة بناء صفراوية.'),
      ('Excision of intrahepatic bile duct tumour','BILI','47712-00','Resection of a tumour of the intrahepatic bile duct with biliary repair as needed.','استئصال ورم القناة الصفراوية داخل الكبد','استئصال ورم في القناة الصفراوية داخل الكبد مع إصلاح صفراوي عند اللزوم.'),
      ('Hepaticojejunostomy (biliary-enteric anastomosis)','BILI','47765-00','Anastomosis of the intrahepatic/extrahepatic bile ducts to the small intestine.','مفاغرة كبدية صائمية (صفراوية معوية)','مفاغرة الأقنية الصفراوية داخل/خارج الكبد بالأمعاء الدقيقة.'),
      -- ── PANC: pancreatic resection ────────────────────────────────────────
      ('Pancreaticoduodenectomy (Whipple)','PANC','48150-00','Whipple resection of the pancreatic head, duodenum, distal bile duct and distal stomach with pancreatojejunostomy.','استئصال البنكرياس والاثني عشر (ويبل)','استئصال (ويبل) لرأس البنكرياس والاثني عشر والقناة الصفراوية البعيدة والمعدة البعيدة مع مفاغرة بنكرياسية صائمية.'),
      ('Pylorus-preserving pancreaticoduodenectomy (PPPD)','PANC','48153-00','Proximal pancreatectomy with near-total duodenectomy preserving the pylorus, with reconstruction.','استئصال البنكرياس والاثني عشر مع حفظ البواب','استئصال بنكرياس قريب مع استئصال شبه كامل للاثني عشر مع حفظ البواب وإعادة البناء.'),
      ('Distal pancreatectomy ± splenectomy','PANC','48140-00','Resection of the distal pancreas with or without splenectomy for body/tail tumours.','استئصال البنكرياس البعيد ± الطحال','استئصال البنكرياس البعيد مع أو دون استئصال الطحال لأورام الجسم/الذيل.'),
      ('Distal pancreatectomy with pancreatojejunostomy','PANC','48145-00','Distal pancreatectomy with drainage of the pancreatic remnant by pancreatojejunostomy.','استئصال البنكرياس البعيد مع مفاغرة بنكرياسية صائمية','استئصال البنكرياس البعيد مع تصريف البقية البنكرياسية بمفاغرة بنكرياسية صائمية.'),
      ('Total pancreatectomy','PANC','48155-00','Removal of the entire pancreas for diffuse or multifocal malignancy.','استئصال البنكرياس الكلي','إزالة البنكرياس بالكامل لورم خبيث منتشر أو متعدد البؤر.'),
      ('Excision of pancreatic lesion','PANC','48120-00','Local excision/enucleation of a discrete pancreatic lesion.','استئصال آفة البنكرياس','استئصال/اجتثاث موضعي لآفة بنكرياسية محدّدة.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('BRST','AXIL','COLR','GAST','ESOG','HEPB','BILI','PANC')`);
  }
}
