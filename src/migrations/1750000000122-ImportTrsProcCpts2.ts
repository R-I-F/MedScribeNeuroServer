import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * TRS proc_cpts — batch 2 of 2 (43 supporting / complication procedures). New groups: DIAL
 * (dialysis access), BILR (biliary reconstruction & post-transplant biliary complications),
 * VASR (vascular reconstruction & complications), PORT (portal hypertension), IMMB (allograft
 * biopsy / rejection monitoring), COMP (urological, drainage & hernia complications).
 *
 * Every CPT verified current/active against AAPC — see AUDIT_TRS.md "2E" (ERCP 43260-43274,
 * angioplasty/stent 37246/37236, the 2016 percutaneous-biliary 47531-47544 family, and the
 * 2023 anterior-abdominal-hernia 49591-49622 family are all current). Linked by migration 123.
 */
export class ImportTrsProcCpts21750000000122 implements MigrationInterface {
  name = "ImportTrsProcCpts21750000000122";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      -- ── DIAL: dialysis access ─────────────────────────────────────────────
      ('Arteriovenous anastomosis, direct (Cimino fistula)','DIAL','36821-00','Open creation of a direct radiocephalic (Cimino) arteriovenous fistula for haemodialysis.','مفاغرة شريانية وريدية مباشرة (ناسور سيمينو)','إنشاء ناسور شرياني وريدي كعبري رأسي مباشر (سيمينو) للديال الدموي.'),
      ('AV anastomosis, upper arm cephalic vein transposition','DIAL','36818-00','Open arteriovenous fistula by upper-arm cephalic vein transposition.','مفاغرة شريانية وريدية بنقل الوريد الرأسي العضدي','ناسور شرياني وريدي بنقل الوريد الرأسي في أعلى الذراع.'),
      ('AV anastomosis, upper arm basilic vein transposition','DIAL','36819-00','Open arteriovenous fistula by upper-arm basilic vein transposition.','مفاغرة شريانية وريدية بنقل الوريد القاعدي العضدي','ناسور شرياني وريدي بنقل الوريد القاعدي في أعلى الذراع.'),
      ('Creation of AV fistula, autogenous graft','DIAL','36825-00','Creation of an arteriovenous fistula using an autogenous (vein) graft.','إنشاء ناسور شرياني وريدي بطعم ذاتي','إنشاء ناسور شرياني وريدي باستخدام طعم وريدي ذاتي.'),
      ('Creation of AV fistula, nonautogenous graft','DIAL','36830-00','Creation of an arteriovenous fistula using a nonautogenous (synthetic) graft.','إنشاء ناسور شرياني وريدي بطعم صناعي','إنشاء ناسور شرياني وريدي باستخدام طعم غير ذاتي (صناعي).'),
      ('Thrombectomy, open, arteriovenous fistula','DIAL','36831-00','Open thrombectomy of a clotted dialysis arteriovenous fistula without revision.','استئصال خثرة الناسور الشرياني الوريدي، مفتوح','استئصال خثرة مفتوح لناسور ديال شرياني وريدي متجلّط دون مراجعة.'),
      ('Revision, open, AV fistula with thrombectomy','DIAL','36833-00','Open revision of a dialysis arteriovenous fistula with thrombectomy.','مراجعة الناسور الشرياني الوريدي مع استئصال الخثرة','مراجعة مفتوحة لناسور ديال شرياني وريدي مع استئصال الخثرة.'),
      ('Insertion of tunneled CV access device with port','DIAL','36561-00','Insertion of a tunneled centrally-inserted central venous access device with subcutaneous port.','إدخال جهاز وصول وريدي مركزي نفقي بمنفذ','إدخال جهاز وصول وريدي مركزي نفقي مع منفذ تحت الجلد.'),
      ('Insertion of tunneled centrally inserted CV catheter','DIAL','36558-00','Insertion of a tunneled centrally-inserted central venous catheter without a port.','إدخال قسطرة وريدية مركزية نفقية','إدخال قسطرة وريدية مركزية نفقية دون منفذ.'),
      ('Insertion of tunneled intraperitoneal (PD) catheter','DIAL','49421-00','Open insertion of a tunneled intraperitoneal catheter for peritoneal dialysis.','إدخال قسطرة بريتونية نفقية للديال','إدخال مفتوح لقسطرة بريتونية نفقية للديال البريتوني.'),
      -- ── BILR: biliary reconstruction / complication ───────────────────────
      ('Hepaticojejunostomy (Roux-en-Y biliary-enteric anastomosis)','BILR','47780-00','Roux-en-Y anastomosis of the extrahepatic biliary ducts to the jejunum, eg for biliary reconstruction.','مفاغرة كبدية صائمية (رو-إن-واي)','مفاغرة رو-إن-واي للأقنية الصفراوية خارج الكبد بالصائم لإعادة البناء الصفراوي.'),
      ('ERCP, diagnostic','BILR','43260-00','Endoscopic retrograde cholangiopancreatography with contrast injection and imaging.','تنظير الأقنية الصفراوية البنكرياسية بالطريق الراجع، تشخيصي','تصوير الأقنية الصفراوية البنكرياسية بالتنظير الراجع مع حقن الظليل والتصوير.'),
      ('ERCP with sphincterotomy','BILR','43262-00','ERCP with biliary or pancreatic sphincterotomy/papillotomy.','تنظير الأقنية الصفراوية مع بضع المصرّة','تنظير راجع للأقنية الصفراوية مع بضع المصرّة الصفراوية أو البنكرياسية.'),
      ('ERCP with removal of calculi/debris','BILR','43264-00','ERCP with removal of stones or debris from the biliary or pancreatic ducts.','تنظير الأقنية الصفراوية مع إزالة الحصى','تنظير راجع مع إزالة الحصى أو الفتات من الأقنية الصفراوية أو البنكرياسية.'),
      ('ERCP with placement of stent','BILR','43274-00','ERCP with placement of a stent into the biliary or pancreatic duct (eg for anastomotic stricture).','تنظير الأقنية الصفراوية مع وضع دعامة','تنظير راجع مع وضع دعامة في القناة الصفراوية أو البنكرياسية (مثلاً لتضيّق المفاغرة).'),
      ('Conversion of external to internal-external biliary drainage','BILR','47535-00','Percutaneous conversion of an external biliary drainage catheter to an internal-external catheter.','تحويل التصريف الصفراوي الخارجي إلى داخلي-خارجي','تحويل عبر الجلد لقسطرة تصريف صفراوي خارجية إلى قسطرة داخلية-خارجية.'),
      ('Exchange of biliary drainage catheter','BILR','47536-00','Percutaneous exchange of an indwelling biliary drainage catheter.','تبديل قسطرة التصريف الصفراوي','تبديل عبر الجلد لقسطرة تصريف صفراوي مقيمة.'),
      ('Placement of biliary stent, percutaneous','BILR','47538-00','Percutaneous transhepatic placement of a stent into a bile duct.','وضع دعامة صفراوية عبر الجلد','وضع دعامة في القناة الصفراوية عبر الجلد عبر الكبد.'),
      ('Balloon dilation of biliary duct, percutaneous','BILR','47542-00','Percutaneous balloon dilation of a biliary duct stricture.','توسيع القناة الصفراوية بالبالون عبر الجلد','توسيع بالبالون عبر الجلد لتضيّق القناة الصفراوية.'),
      ('Percutaneous transhepatic cholangiography','BILR','47531-00','Percutaneous transhepatic injection for diagnostic cholangiography, existing access or new.','تصوير الأقنية الصفراوية عبر الجلد عبر الكبد','حقن عبر الجلد عبر الكبد لتصوير تشخيصي للأقنية الصفراوية.'),
      -- ── VASR: vascular reconstruction / complication ──────────────────────
      ('Transluminal balloon angioplasty, artery','VASR','37246-00','Percutaneous balloon angioplasty of an artery (eg transplant renal artery stenosis).','رأب الشريان بالبالون عبر اللمعة','رأب بالوني عبر اللمعة لشريان (مثل تضيّق شريان الكلية المزروعة).'),
      ('Transcatheter placement of intravascular stent, artery','VASR','37236-00','Transcatheter placement of an intravascular stent in an artery.','وضع دعامة وعائية شريانية عبر القسطرة','وضع دعامة داخل وعائية في شريان عبر القسطرة.'),
      ('Percutaneous mechanical thrombectomy, dialysis circuit','VASR','36904-00','Percutaneous transluminal mechanical thrombectomy of a dialysis arteriovenous circuit.','استئصال خثرة آلي عبر الجلد لدارة الديال','استئصال خثرة آلي عبر اللمعة لدارة ديال شريانية وريدية عبر الجلد.'),
      ('Percutaneous thrombectomy with angioplasty, dialysis circuit','VASR','36905-00','Percutaneous mechanical thrombectomy with angioplasty of a dialysis circuit.','استئصال خثرة مع رأب لدارة الديال','استئصال خثرة آلي مع رأب بالبالون لدارة الديال عبر الجلد.'),
      ('Percutaneous thrombectomy with stent, dialysis circuit','VASR','36906-00','Percutaneous mechanical thrombectomy with stent placement in a dialysis circuit.','استئصال خثرة مع دعامة لدارة الديال','استئصال خثرة آلي مع وضع دعامة في دارة الديال عبر الجلد.'),
      ('Transluminal balloon angioplasty, central dialysis segment','VASR','36907-00','Percutaneous balloon angioplasty of the central dialysis venous segment.','رأب القطعة الوريدية المركزية للديال بالبالون','رأب بالوني عبر الجلد للقطعة الوريدية المركزية لدارة الديال.'),
      ('Thrombectomy of arterial or venous graft','VASR','35876-00','Thrombectomy of a thrombosed arterial or venous bypass graft (eg transplant vascular graft).','استئصال خثرة طعم شرياني أو وريدي','استئصال خثرة من طعم مجازة شرياني أو وريدي متجلّط (مثل طعم وعائي للزرع).'),
      -- ── PORT: portal hypertension ─────────────────────────────────────────
      ('Insertion of TIPS (transjugular intrahepatic portosystemic shunt)','PORT','37182-00','Transvenous creation of an intrahepatic portosystemic shunt for portal hypertension.','إدخال تحويلة بابية جهازية داخل الكبد عبر الوريد (TIPS)','إنشاء تحويلة بابية جهازية داخل الكبد عبر الوريد لارتفاع ضغط الدم البابي.'),
      ('Revision of TIPS','PORT','37183-00','Transvenous revision of a transjugular intrahepatic portosystemic shunt.','مراجعة التحويلة البابية الجهازية داخل الكبد','مراجعة عبر الوريد للتحويلة البابية الجهازية داخل الكبد.'),
      ('EGD with band ligation of varices','PORT','43244-00','Upper endoscopy with band ligation of oesophageal/gastric varices.','تنظير علوي مع ربط الدوالي بالأشرطة','تنظير هضمي علوي مع ربط دوالي المريء/المعدة بالأشرطة المطاطية.'),
      ('Abdominal paracentesis, without imaging guidance','PORT','49082-00','Diagnostic or therapeutic abdominal paracentesis for ascites, without imaging guidance.','بزل البطن دون توجيه تصويري','بزل بطني تشخيصي أو علاجي للحَبَن دون توجيه تصويري.'),
      ('Abdominal paracentesis, with imaging guidance','PORT','49083-00','Abdominal paracentesis for ascites performed with imaging guidance.','بزل البطن بتوجيه تصويري','بزل بطني للحَبَن بتوجيه تصويري.'),
      -- ── IMMB: allograft biopsy / rejection monitoring ─────────────────────
      ('Endomyocardial biopsy','IMMB','93505-00','Right heart catheterisation with endomyocardial biopsy to monitor cardiac allograft rejection.','خزعة شغاف عضلة القلب','قسطرة قلب يمنى مع خزعة شغافية عضلية لمراقبة رفض طعم القلب.'),
      ('Bronchoscopy with transbronchial lung biopsy','IMMB','31628-00','Flexible bronchoscopy with transbronchial lung biopsy of a single lobe to monitor rejection.','تنظير القصبات مع خزعة رئة عبر القصبات','تنظير قصبات مرن مع خزعة رئة عبر القصبات من فص واحد لمراقبة الرفض.'),
      ('Therapeutic plasmapheresis','IMMB','36514-00','Therapeutic plasma exchange (plasmapheresis), eg for antibody-mediated rejection or desensitisation.','الفصادة البلازمية العلاجية','تبادل بلازمي علاجي (فصادة) مثلاً للرفض المتواسط بالأضداد أو إزالة التحسّس.'),
      -- ── COMP: urological / drainage / hernia complications ────────────────
      ('Image-guided percutaneous fluid collection drainage (lymphocele)','COMP','49406-00','Image-guided percutaneous catheter drainage of a peritoneal/retroperitoneal collection (eg lymphocele).','تصريف تجمّع سائل عبر الجلد بتوجيه تصويري (قيلة لمفية)','تصريف بالقسطرة عبر الجلد بتوجيه تصويري لتجمّع بريتوني/خلف بريتوني (مثل القيلة اللمفية).'),
      ('Laparoscopic drainage of lymphocele','COMP','49323-00','Laparoscopic fenestration/drainage of a lymphocele into the peritoneal cavity.','تصريف القيلة اللمفية بالمنظار','فتح/تصريف القيلة اللمفية بالمنظار إلى التجويف البريتوني.'),
      ('Placement of nephrostomy catheter, percutaneous','COMP','50432-00','Percutaneous placement of a nephrostomy catheter to relieve allograft obstruction.','وضع قسطرة فغر الكلية عبر الجلد','وضع قسطرة فغر كلوي عبر الجلد لتخفيف انسداد الطعم.'),
      ('Placement of ureteral stent, percutaneous','COMP','50693-00','Percutaneous placement of an indwelling ureteral stent (eg for transplant ureteric stricture/leak).','وضع دعامة حالبية عبر الجلد','وضع دعامة حالبية مقيمة عبر الجلد (مثلاً لتضيّق/تسرّب حالب الزرع).'),
      ('Cystourethroscopy with ureteral stent insertion','COMP','52332-00','Cystourethroscopy with insertion of an indwelling ureteral stent.','تنظير المثانة والإحليل مع وضع دعامة حالبية','تنظير مثانة وإحليل مع وضع دعامة حالبية مقيمة.'),
      ('Repair anterior abdominal hernia, initial, reducible, <3cm','COMP','49591-00','Repair of an initial anterior abdominal (incisional) hernia, reducible, less than 3 cm.','إصلاح فتق البطن الأمامي الابتدائي، قابل للرد، أقل من 3 سم','إصلاح فتق بطن أمامي (جراحي) ابتدائي، قابل للرد، أقل من 3 سم.'),
      ('Repair anterior abdominal hernia, initial, reducible, 3-10cm','COMP','49593-00','Repair of an initial anterior abdominal (incisional) hernia, reducible, 3 to 10 cm.','إصلاح فتق البطن الأمامي الابتدائي، قابل للرد، 3-10 سم','إصلاح فتق بطن أمامي (جراحي) ابتدائي، قابل للرد، من 3 إلى 10 سم.'),
      ('Repair anterior abdominal hernia, recurrent, reducible, 3-10cm','COMP','49613-00','Repair of a recurrent anterior abdominal (incisional) hernia, reducible, 3 to 10 cm.','إصلاح فتق البطن الأمامي الناكس، قابل للرد، 3-10 سم','إصلاح فتق بطن أمامي (جراحي) ناكس، قابل للرد، من 3 إلى 10 سم.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('DIAL','BILR','VASR','PORT','IMMB','COMP')`);
  }
}
