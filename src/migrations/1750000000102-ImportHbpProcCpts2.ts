import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * HBP proc_cpts — batch 2 of 2 (38 procedures).
 * Groups: PTBD (percutaneous transhepatic biliary), PANC (pancreatic resection/drainage),
 * SPLN (splenic), PORT (portosystemic shunt) and ERCP (therapeutic ERCP).
 *
 * Every CPT verified against AAPC as current/active. The PTBD 47531–47544 family is the
 * 2016 replacement set for the deleted percutaneous-biliary codes 47510/47511/47525/47530/
 * 47560/47561/47630. Links to main_diags are added by migration 103.
 */
export class ImportHbpProcCpts21750000000102 implements MigrationInterface {
  name = "ImportHbpProcCpts21750000000102";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES

      -- ── PTBD: percutaneous transhepatic biliary procedures ───────────────
      ('Percutaneous cholangiography, existing access','PTBD','47531-00','Injection of contrast for percutaneous cholangiography through pre-existing biliary access.','تصوير الأقنية الصفراوية عبر الجلد (وصول قائم)','حقن مادة ظليلة لتصوير الأقنية الصفراوية عبر الجلد من خلال وصول صفراوي قائم.'),
      ('Percutaneous cholangiography, new access','PTBD','47532-00','Percutaneous transhepatic cholangiography requiring new biliary access.','تصوير الأقنية الصفراوية عبر الجلد (وصول جديد)','تصوير الأقنية الصفراوية عبر الكبد بالجلد يتطلب وصولاً صفراوياً جديداً.'),
      ('Percutaneous external biliary drainage','PTBD','47533-00','Percutaneous placement of an external biliary drainage catheter for obstruction.','تصريف صفراوي خارجي عبر الجلد','وضع قسطرة تصريف صفراوي خارجي عبر الجلد للانسداد.'),
      ('Percutaneous internal-external biliary drainage','PTBD','47534-00','Percutaneous placement of an internal-external biliary drainage catheter across an obstruction.','تصريف صفراوي داخلي-خارجي عبر الجلد','وضع قسطرة تصريف صفراوي داخلي-خارجي عبر الجلد عبر الانسداد.'),
      ('Conversion of external to internal-external biliary drainage','PTBD','47535-00','Percutaneous conversion of an external biliary drain to an internal-external catheter.','تحويل التصريف الصفراوي الخارجي إلى داخلي-خارجي','تحويل قسطرة تصريف صفراوي خارجي إلى داخلية-خارجية عبر الجلد.'),
      ('Exchange of biliary drainage catheter','PTBD','47536-00','Percutaneous exchange of an existing biliary drainage catheter.','تبديل قسطرة التصريف الصفراوي','تبديل قسطرة تصريف صفراوي قائمة عبر الجلد.'),
      ('Removal of biliary drainage catheter','PTBD','47537-00','Percutaneous removal of a biliary drainage catheter without replacement.','إزالة قسطرة التصريف الصفراوي','إزالة قسطرة تصريف صفراوي عبر الجلد دون استبدال.'),
      ('Percutaneous biliary stent, existing access','PTBD','47538-00','Percutaneous placement of a biliary stent through existing access.','دعامة صفراوية عبر الجلد (وصول قائم)','وضع دعامة صفراوية عبر الجلد من خلال وصول قائم.'),
      ('Percutaneous biliary stent, new access without drainage','PTBD','47539-00','Percutaneous biliary stent placement through new access without separate drainage catheter.','دعامة صفراوية عبر الجلد (وصول جديد دون تصريف)','وضع دعامة صفراوية عبر الجلد من خلال وصول جديد دون قسطرة تصريف منفصلة.'),
      ('Percutaneous biliary stent, new access with drainage','PTBD','47540-00','Percutaneous biliary stent placement through new access with a separate drainage catheter.','دعامة صفراوية عبر الجلد (وصول جديد مع تصريف)','وضع دعامة صفراوية عبر الجلد من خلال وصول جديد مع قسطرة تصريف منفصلة.'),
      ('Placement of biliary intervention access','PTBD','47541-00','Percutaneous placement of access into the biliary tree to enable subsequent intervention, new access.','إنشاء وصول للتدخل الصفراوي','إنشاء وصول عبر الجلد إلى الشجرة الصفراوية لتمكين تدخل لاحق، وصول جديد.'),
      ('Percutaneous balloon dilation of biliary duct','PTBD','47542-00','Percutaneous balloon dilation of a biliary stricture or sphincteroplasty of the ampulla.','توسيع القناة الصفراوية بالبالون عبر الجلد','توسيع تضيّق صفراوي بالبالون عبر الجلد أو رأب عاصرة الأمبولة.'),
      ('Percutaneous endoluminal biliary biopsy','PTBD','47543-00','Percutaneous endoluminal biopsy of the biliary tree during a transhepatic procedure.','خزعة صفراوية داخل اللمعة عبر الجلد','خزعة داخل لمعة الشجرة الصفراوية عبر الجلد أثناء إجراء عبر الكبد.'),
      ('Percutaneous removal of biliary calculi','PTBD','47544-00','Percutaneous removal of calculi or debris from the biliary ducts and/or gallbladder.','إزالة الحصوات الصفراوية عبر الجلد','إزالة الحصوات أو الفتات من الأقنية الصفراوية و/أو المرارة عبر الجلد.'),

      -- ── PANC: pancreatic resection and drainage ──────────────────────────
      ('Placement of peripancreatic drains','PANC','48000-00','Placement of drains around the pancreas for acute (necrotising) pancreatitis.','وضع مصارف حول البنكرياس','وضع مصارف حول البنكرياس لالتهاب بنكرياس حاد (نخري).'),
      ('Removal of pancreatic calculus','PANC','48020-00','Surgical removal of a calculus from the pancreatic duct.','إزالة حصاة البنكرياس','إزالة حصاة جراحياً من القناة البنكرياسية.'),
      ('Biopsy of pancreas, open','PANC','48100-00','Open biopsy of a pancreatic mass or the pancreatic parenchyma.','خزعة البنكرياس المفتوحة','خزعة مفتوحة لكتلة بنكرياسية أو نسيج البنكرياس.'),
      ('Biopsy of pancreas, percutaneous needle','PANC','48102-00','Image-guided percutaneous needle biopsy of a pancreatic lesion.','خزعة البنكرياس بالإبرة عبر الجلد','خزعة بالإبرة عبر الجلد موجّهة بالتصوير لآفة بنكرياسية.'),
      ('Excision of lesion of pancreas','PANC','48120-00','Local excision or enucleation of a pancreatic lesion (eg neuroendocrine tumour, cyst).','استئصال آفة البنكرياس','استئصال موضعي أو اجتثاث لآفة بنكرياسية (مثل ورم عصبي صمّي أو كيسة).'),
      ('Near-total pancreatectomy (Child)','PANC','48146-00','Near-total (Child-type) pancreatectomy preserving a small rim of pancreatic tissue.','استئصال البنكرياس شبه الكامل (تشايلد)','استئصال بنكرياس شبه كامل (نمط تشايلد) مع الإبقاء على حافة صغيرة من النسيج البنكرياسي.'),
      ('Total pancreatectomy','PANC','48155-00','Resection of the entire pancreas for diffuse malignancy or intractable chronic pancreatitis.','استئصال البنكرياس الكامل','استئصال البنكرياس بالكامل لورم خبيث منتشر أو التهاب بنكرياس مزمن معند.'),
      ('Total pancreatectomy with islet autotransplant','PANC','48160-00','Total pancreatectomy with harvesting and autologous transplantation of pancreatic islet cells.','استئصال البنكرياس الكامل مع زرع الجزيرات الذاتي','استئصال البنكرياس الكامل مع حصاد وزرع ذاتي لخلايا الجزيرات البنكرياسية.'),
      ('Marsupialization of pancreatic cyst','PANC','48500-00','Marsupialization (incision and partial open suturing) of a pancreatic cyst or pseudocyst.','تسقيف الكيسة البنكرياسية','تسقيف (شق وخياطة جزئية مفتوحة) لكيسة أو كيسة كاذبة بنكرياسية.'),
      ('External drainage of pancreatic pseudocyst','PANC','48510-00','Open external drainage of a pancreatic pseudocyst when internal drainage is not feasible.','التصريف الخارجي للكيسة الكاذبة البنكرياسية','تصريف خارجي مفتوح لكيسة كاذبة بنكرياسية عند تعذّر التصريف الداخلي.'),
      ('Pancreaticojejunostomy (Puestow)','PANC','48548-00','Longitudinal side-to-side pancreaticojejunostomy (Puestow) for chronic pancreatitis ductal drainage.','مفاغرة بنكرياسية صائمية (بويستو)','مفاغرة بنكرياسية صائمية طولية جانبية (بويستو) لتصريف القناة في التهاب البنكرياس المزمن.'),

      -- ── SPLN: splenic procedures ─────────────────────────────────────────
      ('Partial splenectomy','SPLN','38101-00','Resection of a portion of the spleen, preserving splenic function.','استئصال الطحال الجزئي','استئصال جزء من الطحال مع الحفاظ على وظيفته.'),
      ('Total splenectomy, en bloc with other procedure','SPLN','38102-00','Total splenectomy performed en bloc as part of another extensive abdominal procedure.','استئصال الطحال الكامل ضمن إجراء آخر','استئصال الطحال الكامل ككتلة واحدة ضمن إجراء بطني موسّع آخر.'),
      ('Repair of ruptured spleen (splenorrhaphy)','SPLN','38115-00','Surgical repair (splenorrhaphy) of a ruptured or injured spleen to preserve splenic tissue.','إصلاح الطحال الممزّق','إصلاح جراحي (خياطة الطحال) لطحال ممزّق أو مصاب للحفاظ على النسيج الطحالي.'),

      -- ── PORT: portosystemic shunt procedures ─────────────────────────────
      ('Portocaval shunt','PORT','37140-00','Open portocaval venous anastomosis to decompress portal hypertension.','مجازة بابية أجوفية','مفاغرة وريدية بابية أجوفية مفتوحة لتخفيف ضغط ارتفاع الوريد البابي.'),
      ('Caval-mesenteric shunt','PORT','37160-00','Open caval-mesenteric venous anastomosis for portal decompression.','مجازة أجوفية مساريقية','مفاغرة وريدية أجوفية مساريقية مفتوحة لتخفيف الضغط البابي.'),
      ('Proximal splenorenal shunt','PORT','37180-00','Open proximal splenorenal venous anastomosis (with splenectomy) for portal hypertension.','مجازة طحالية كلوية قريبة','مفاغرة وريدية طحالية كلوية قريبة مفتوحة (مع استئصال الطحال) لارتفاع الضغط البابي.'),
      ('Distal splenorenal shunt (Warren)','PORT','37181-00','Open distal splenorenal (Warren) selective shunt decompressing varices while preserving portal flow.','مجازة طحالية كلوية بعيدة (وارن)','مفاغرة طحالية كلوية بعيدة انتقائية (وارن) تخفّف الدوالي مع الحفاظ على التدفق البابي.'),
      ('Transjugular intrahepatic portosystemic shunt (TIPS)','PORT','37182-00','Transjugular creation of an intrahepatic portosystemic shunt with stent for portal hypertension.','مجازة بابية جهازية داخل الكبد عبر الوداجي (TIPS)','إنشاء مجازة بابية جهازية داخل الكبد عبر الوريد الوداجي مع دعامة لارتفاع الضغط البابي.'),
      ('Revision of TIPS','PORT','37183-00','Transjugular revision/dilation of a previously placed intrahepatic portosystemic shunt.','مراجعة مجازة TIPS','مراجعة/توسيع مجازة بابية جهازية داخل الكبد موضوعة سابقاً عبر الوداجي.'),

      -- ── ERCP: therapeutic endoscopic retrograde cholangiopancreatography ──
      ('ERCP with biopsy','ERCP','43261-00','Endoscopic retrograde cholangiopancreatography with biopsy of the biliary/pancreatic ducts.','ERCP مع خزعة','تصوير راجع للأقنية الصفراوية والبنكرياسية بالتنظير مع أخذ خزعة.'),
      ('ERCP with sphincterotomy','ERCP','43262-00','ERCP with sphincterotomy/papillotomy of the sphincter of Oddi.','ERCP مع بضع العضلة العاصرة','ERCP مع بضع العضلة العاصرة/الحليمة لعضلة أودي العاصرة.'),
      ('ERCP with removal of duct stones','ERCP','43264-00','ERCP with removal of calculi or debris from the biliary and/or pancreatic ducts.','ERCP مع إزالة حصوات الأقنية','ERCP مع إزالة الحصوات أو الفتات من الأقنية الصفراوية و/أو البنكرياسية.'),
      ('ERCP with stone destruction (lithotripsy)','ERCP','43265-00','ERCP with destruction of ductal calculi by mechanical, electrohydraulic or laser lithotripsy.','ERCP مع تفتيت الحصوات','ERCP مع تفتيت حصوات الأقنية بالطرق الميكانيكية أو الكهرومائية أو الليزر.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PTBD/SPLN/PORT/ERCP are new HBP groups — safe to drop wholesale.
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('PTBD','SPLN','PORT','ERCP')`);
    // PANC is shared with GS — delete ONLY the numCodes this migration added (not GS's rows).
    await queryRunner.query(
      `DELETE FROM "proc_cpts" WHERE "alphaCode" = 'PANC' AND "numCode" = ANY($1)`,
      [["48000-00", "48020-00", "48100-00", "48102-00", "48120-00", "48146-00", "48155-00", "48160-00", "48500-00", "48510-00", "48548-00"]]);
  }
}
