import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * HBP proc_cpts — batch 1 of 2 (37 procedures).
 * Groups: LIVR (liver resection/ablation/transplant) and BILE (open biliary surgery).
 *
 * Every CPT verified against AAPC (aapc.com/codes/cpt-codes/<code>) as current/active. The
 * deleted code 47802 (U-tube hepaticoenterostomy, deleted 2025-01-01) was excluded. Core HBP
 * operations already present as shared GS rows (cholecystectomy 47600, partial hepatectomy
 * 47120, Whipple 48150 etc.) are reused, not duplicated, and are linked by migration 103.
 */
export class ImportHbpProcCpts11750000000101 implements MigrationInterface {
  name = "ImportHbpProcCpts11750000000101";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES

      -- ── LIVR: liver resection, ablation and transplantation ───────────────
      ('Percutaneous needle biopsy of liver','LIVR','47000-00','Image-guided percutaneous core-needle biopsy of the liver for diagnosis of a focal lesion or diffuse parenchymal disease.','خزعة الكبد بالإبرة عبر الجلد','خزعة كبدية بالإبرة الموجّهة بالتصوير عبر الجلد لتشخيص آفة بؤرية أو مرض حُمَوي منتشر.'),
      ('Open drainage of hepatic abscess or cyst','LIVR','47010-00','Open laparotomy drainage of a hepatic abscess or cyst when percutaneous drainage is not feasible.','تصريف مفتوح لخراج أو كيسة كبدية','تصريف بفتح البطن لخراج أو كيسة كبدية عند تعذّر التصريف عبر الجلد.'),
      ('Percutaneous drainage of hepatic abscess/cyst','LIVR','47011-00','Image-guided percutaneous catheter drainage of a hepatic abscess or cyst.','تصريف عبر الجلد لخراج/كيسة كبدية','تصريف بالقسطرة عبر الجلد موجّه بالتصوير لخراج أو كيسة كبدية.'),
      ('Laparotomy for hepatic (hydatid) cyst aspiration/injection','LIVR','47015-00','Laparotomy with aspiration/injection and management of a hepatic parasitic (hydatid) cyst or abscess.','فتح البطن لشفط/حقن الكيسة الكبدية (المائية)','فتح البطن لشفط/حقن ومعالجة كيسة كبدية طفيلية (مائية) أو خراج.'),
      ('Wedge biopsy of liver, open','LIVR','47100-00','Open wedge (incisional) biopsy of the liver for histological diagnosis.','خزعة وتدية مفتوحة للكبد','خزعة وتدية مفتوحة من الكبد للتشخيص النسيجي.'),
      ('Hepatic trisegmentectomy (extended hepatectomy)','LIVR','47122-00','Extended hepatic resection of three or more Couinaud sections for hepatic malignancy.','استئصال الكبد الموسّع (ثلاثي القطاعات)','استئصال كبدي موسّع لثلاثة قطاعات أو أكثر لورم كبدي خبيث.'),
      ('Hepatic lobectomy, left lobe','LIVR','47125-00','Resection of the left hepatic lobe for tumour or other indication.','استئصال الفص الكبدي الأيسر','استئصال الفص الكبدي الأيسر لورم أو دواعٍ أخرى.'),
      ('Hepatic lobectomy, right lobe','LIVR','47130-00','Resection of the right hepatic lobe for tumour or other indication.','استئصال الفص الكبدي الأيمن','استئصال الفص الكبدي الأيمن لورم أو دواعٍ أخرى.'),
      ('Donor hepatectomy, cadaver donor','LIVR','47133-00','Procurement (total hepatectomy) of the liver from a deceased (cadaver) donor for transplantation.','استئصال الكبد من متبرع متوفّى','حصاد الكبد (استئصال كامل) من متبرع متوفّى لأغراض الزرع.'),
      ('Liver allotransplantation, orthotopic','LIVR','47135-00','Orthotopic transplantation of a whole or partial liver allograft into a recipient.','زرع الكبد المثلي (في موضعه)','زرع طعم كبدي كامل أو جزئي في موضعه لدى المتلقّي.'),
      ('Living-donor left lateral segmentectomy','LIVR','47140-00','Living-donor hepatectomy resecting the left lateral segment for transplantation.','استئصال القطعة الجانبية اليسرى من متبرع حي','استئصال القطعة الجانبية اليسرى للكبد من متبرع حي لأغراض الزرع.'),
      ('Living-donor total left lobectomy','LIVR','47141-00','Living-donor hepatectomy resecting the total left lobe for transplantation.','استئصال الفص الأيسر الكامل من متبرع حي','استئصال الفص الأيسر الكامل للكبد من متبرع حي لأغراض الزرع.'),
      ('Living-donor total right lobectomy','LIVR','47142-00','Living-donor hepatectomy resecting the total right lobe for transplantation.','استئصال الفص الأيمن الكامل من متبرع حي','استئصال الفص الأيمن الكامل للكبد من متبرع حي لأغراض الزرع.'),
      ('Hepatorrhaphy (suture of liver wound)','LIVR','47350-00','Management of liver haemorrhage by suture (hepatorrhaphy) of a liver wound or injury.','خياطة جرح الكبد','ضبط نزف الكبد بخياطة جرح أو إصابة كبدية.'),
      ('Complex hepatic wound repair','LIVR','47360-00','Repair of a complex hepatic wound or injury, with hepatic artery ligation if required.','إصلاح جرح كبدي معقّد','إصلاح جرح أو إصابة كبدية معقّدة، مع ربط الشريان الكبدي عند اللزوم.'),
      ('Re-exploration of hepatic wound for haemorrhage','LIVR','47362-00','Re-exploration of a hepatic wound to control recurrent or persistent haemorrhage.','إعادة استكشاف جرح الكبد للنزف','إعادة استكشاف جرح كبدي لضبط نزف متكرر أو مستمر.'),
      ('Laparoscopic cryoablation of liver tumour(s)','LIVR','47371-00','Laparoscopic cryosurgical ablation of one or more hepatic tumours.','استئصال ورم الكبد بالتبريد بالمنظار','استئصال بالتبريد بالمنظار لورم كبدي واحد أو أكثر.'),
      ('Open radiofrequency ablation of liver tumour','LIVR','47380-00','Open (laparotomy) radiofrequency ablation of one or more hepatic tumours.','الاستئصال المفتوح لورم الكبد بالتردد الراديوي','استئصال مفتوح بالتردد الراديوي لورم كبدي واحد أو أكثر.'),
      ('Open cryoablation of liver tumour(s)','LIVR','47381-00','Open (laparotomy) cryosurgical ablation of one or more hepatic tumours.','الاستئصال المفتوح لورم الكبد بالتبريد','استئصال مفتوح بالتبريد لورم كبدي واحد أو أكثر.'),
      ('Percutaneous cryoablation of liver tumour(s)','LIVR','47383-00','Image-guided percutaneous cryosurgical ablation of one or more hepatic tumours.','الاستئصال عبر الجلد لورم الكبد بالتبريد','استئصال بالتبريد عبر الجلد موجّه بالتصوير لورم كبدي واحد أو أكثر.'),

      -- ── BILE: open biliary surgery ───────────────────────────────────────
      ('Open cholecystostomy with stone removal','BILE','47480-00','Open cholecystotomy/cholecystostomy with removal of calculus, with or without cholangiography.','فغر المرارة المفتوح مع إزالة الحصاة','شق/فغر المرارة المفتوح مع إزالة الحصاة، مع أو بدون تصوير الأقنية الصفراوية.'),
      ('Biliary endoscopy during biliary surgery','BILE','47550-00','Intraoperative biliary endoscopy (choledochoscopy) performed during open or laparoscopic biliary surgery.','تنظير الأقنية الصفراوية أثناء الجراحة','تنظير صفراوي (تنظير القناة الجامعة) يُجرى أثناء جراحة صفراوية مفتوحة أو بالمنظار.'),
      ('Cholecystectomy with cholangiography','BILE','47605-00','Open cholecystectomy with intraoperative cholangiography of the biliary tree.','استئصال المرارة مع تصوير الأقنية الصفراوية','استئصال مرارة مفتوح مع تصوير الأقنية الصفراوية أثناء العملية.'),
      ('Cholecystectomy with common bile duct exploration','BILE','47610-00','Open cholecystectomy with exploration of the common bile duct and clearance of stones.','استئصال المرارة مع استكشاف القناة الصفراوية المشتركة','استئصال مرارة مفتوح مع استكشاف القناة الصفراوية المشتركة وإزالة الحصوات.'),
      ('Cholecystectomy with choledochoenterostomy','BILE','47612-00','Open cholecystectomy with common-bile-duct exploration and choledochoenterostomy drainage.','استئصال المرارة مع مفاغرة القناة الصفراوية المعوية','استئصال مرارة مفتوح مع استكشاف القناة الصفراوية ومفاغرتها بالأمعاء.'),
      ('Cholecystectomy with CBD exploration and sphincterotomy','BILE','47620-00','Open cholecystectomy with common-duct exploration and transduodenal sphincterotomy/sphincteroplasty.','استئصال المرارة مع استكشاف القناة وبضع العضلة العاصرة','استئصال مرارة مفتوح مع استكشاف القناة الجامعة وبضع/رأب العاصرة عبر الاثني عشر.'),
      ('Exploration for congenital biliary atresia','BILE','47700-00','Surgical exploration of the biliary system in congenital biliary atresia without repair (diagnostic).','استكشاف رتق القنوات الصفراوية الخلقي','استكشاف جراحي للجهاز الصفراوي في رتق القنوات الصفراوية الخلقي دون إصلاح (تشخيصي).'),
      ('Excision of extrahepatic bile duct tumour','BILE','47711-00','Excision of a bile-duct tumour of the extrahepatic ducts with reconstruction.','استئصال ورم القناة الصفراوية خارج الكبد','استئصال ورم في الأقنية الصفراوية خارج الكبد مع إعادة البناء.'),
      ('Excision of intrahepatic bile duct tumour','BILE','47712-00','Excision of a bile-duct tumour of the intrahepatic ducts with reconstruction.','استئصال ورم القناة الصفراوية داخل الكبد','استئصال ورم في الأقنية الصفراوية داخل الكبد مع إعادة البناء.'),
      ('Excision of choledochal cyst','BILE','47715-00','Excision of a choledochal cyst, usually with Roux-en-Y hepaticojejunostomy reconstruction.','استئصال كيس القناة الصفراوية المشتركة','استئصال كيس القناة الصفراوية المشتركة، عادةً مع مفاغرة كبدية صائمية رو-آن-واي.'),
      ('Cholecystoenterostomy with gastroenterostomy','BILE','47721-00','Anastomosis of the gallbladder to the intestine with a concurrent gastroenterostomy.','مفاغرة المرارة بالأمعاء مع مفاغرة معدية معوية','مفاغرة المرارة بالأمعاء مع مفاغرة معدية معوية متزامنة.'),
      ('Cholecystoenterostomy, Roux-en-Y','BILE','47740-00','Roux-en-Y anastomosis of the gallbladder to the small intestine for biliary diversion.','مفاغرة المرارة بالأمعاء رو-آن-واي','مفاغرة المرارة بالأمعاء الدقيقة بطريقة رو-آن-واي لتحويل الصفراء.'),
      ('Anastomosis of intrahepatic ducts to bowel','BILE','47765-00','Anastomosis of the intrahepatic bile ducts to the gastrointestinal tract for biliary drainage.','مفاغرة الأقنية داخل الكبد بالأمعاء','مفاغرة الأقنية الصفراوية داخل الكبد بالجهاز الهضمي لتصريف الصفراء.'),
      ('Roux-en-Y hepaticojejunostomy','BILE','47780-00','Roux-en-Y anastomosis of the extrahepatic bile ducts to the jejunum for biliary reconstruction.','مفاغرة كبدية صائمية رو-آن-واي','مفاغرة الأقنية الصفراوية خارج الكبد بالصائم بطريقة رو-آن-واي لإعادة البناء الصفراوي.'),
      ('Reconstruction of bile ducts, end-to-end','BILE','47800-00','Plastic reconstruction of the extrahepatic biliary ducts by end-to-end anastomosis (eg after injury/stricture).','إعادة بناء الأقنية الصفراوية نهاية لنهاية','إعادة بناء الأقنية الصفراوية خارج الكبد بمفاغرة نهاية لنهاية (مثلاً بعد إصابة/تضيّق).'),
      ('Placement of bile duct (choledochal) stent','BILE','47801-00','Surgical placement of a stent within the bile duct to maintain biliary drainage.','وضع دعامة في القناة الصفراوية','وضع دعامة جراحياً داخل القناة الصفراوية للحفاظ على التصريف الصفراوي.'),
      ('Suture repair of bile duct injury','BILE','47900-00','Suture (primary repair) of the extrahepatic biliary duct for a pre-existing injury.','إصلاح إصابة القناة الصفراوية بالخياطة','إصلاح أولي بالخياطة للقناة الصفراوية خارج الكبد لإصابة سابقة.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('LIVR','BILE')`);
  }
}
