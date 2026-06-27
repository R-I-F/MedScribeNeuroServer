import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OBGYN proc_cpts — batch 1 of 2 (49 procedures). New groups: CSEC (cesarean), VDEL (vaginal
 * delivery), ECTO (ectopic pregnancy surgery), HYST (hysterectomy), MYOM (myomectomy), HYSC
 * (hysteroscopy).
 *
 * OBGYN previously had ZERO proc_cpts. Every CPT verified current/active against AAPC — see
 * AUDIT_OBGYN.md "2E". Linked to main_diags by migration 130.
 */
export class ImportObgynProcCpts11750000000128 implements MigrationInterface {
  name = "ImportObgynProcCpts11750000000128";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      -- ── CSEC: cesarean section ────────────────────────────────────────────
      ('Routine obstetric care with cesarean delivery','CSEC','59510-00','Global obstetric care including antepartum care, cesarean delivery and postpartum care.','رعاية توليدية شاملة مع ولادة قيصرية','رعاية توليدية شاملة تشمل ما قبل الولادة والولادة القيصرية وما بعدها.'),
      ('Cesarean delivery only','CSEC','59514-00','Cesarean delivery of the fetus only, without antepartum or postpartum care.','الولادة القيصرية فقط','ولادة الجنين بالقيصرية فقط دون رعاية ما قبل أو بعد الولادة.'),
      ('Cesarean delivery including postpartum care','CSEC','59515-00','Cesarean delivery with postpartum care.','الولادة القيصرية مع رعاية ما بعد الولادة','ولادة قيصرية مع رعاية ما بعد الولادة.'),
      ('Cesarean hysterectomy (after cesarean delivery)','CSEC','59525-00','Subtotal or total hysterectomy performed after a cesarean delivery (eg for placenta accreta or atony).','استئصال الرحم القيصري','استئصال رحم جزئي أو كلي بعد الولادة القيصرية (مثلاً للمشيمة الملتصقة أو الوَنى).'),
      ('Routine obstetric care with cesarean after attempted VBAC','CSEC','59618-00','Global care with cesarean delivery following a failed trial of labour after previous cesarean.','رعاية توليدية مع قيصرية بعد محاولة ولادة مهبلية بعد قيصرية','رعاية شاملة مع ولادة قيصرية بعد فشل محاولة المخاض عقب قيصرية سابقة.'),
      ('Cesarean delivery only, after attempted VBAC','CSEC','59620-00','Cesarean delivery only after a failed trial of labour following previous cesarean.','الولادة القيصرية فقط بعد محاولة ولادة مهبلية بعد قيصرية','ولادة قيصرية فقط بعد فشل محاولة المخاض عقب قيصرية سابقة.'),
      -- ── VDEL: vaginal delivery ────────────────────────────────────────────
      ('Routine obstetric care with vaginal delivery','VDEL','59400-00','Global obstetric care including antepartum care, vaginal delivery and postpartum care.','رعاية توليدية شاملة مع ولادة مهبلية','رعاية توليدية شاملة تشمل ما قبل الولادة والولادة المهبلية وما بعدها.'),
      ('Vaginal delivery only','VDEL','59409-00','Vaginal delivery of the fetus only, without antepartum or postpartum care.','الولادة المهبلية فقط','ولادة الجنين مهبلياً فقط دون رعاية ما قبل أو بعد الولادة.'),
      ('Vaginal delivery including postpartum care','VDEL','59410-00','Vaginal delivery with postpartum care.','الولادة المهبلية مع رعاية ما بعد الولادة','ولادة مهبلية مع رعاية ما بعد الولادة.'),
      ('External cephalic version','VDEL','59412-00','Manual turning of a breech fetus to cephalic presentation through the maternal abdomen.','التدوير الخارجي للجنين','تدوير الجنين المقعدي يدوياً إلى المجيء الرأسي عبر بطن الأم.'),
      ('Delivery of placenta','VDEL','59414-00','Delivery or manual removal of the placenta as a separate procedure.','إخراج المشيمة','إخراج المشيمة أو إزالتها يدوياً كإجراء منفصل.'),
      ('Antepartum care only (4-6 visits)','VDEL','59425-00','Antepartum care only, comprising four to six visits.','رعاية ما قبل الولادة فقط (4-6 زيارات)','رعاية ما قبل الولادة فقط تتضمن أربع إلى ست زيارات.'),
      ('Postpartum care only','VDEL','59430-00','Postpartum care only following delivery.','رعاية ما بعد الولادة فقط','رعاية ما بعد الولادة فقط عقب الولادة.'),
      ('Repair of obstetric perineal laceration','VDEL','59300-00','Episiotomy or repair of a perineal laceration by a provider other than the attending.','إصلاح تمزّق العجان الولادي','بضع الفرج أو إصلاح تمزّق العجان بمقدّم خدمة غير الطبيب المُولِّد.'),
      ('Multifetal pregnancy reduction','VDEL','59866-00','Transabdominal reduction of a multifetal pregnancy to reduce maternal and fetal risk.','تخفيض الحمل المتعدد','تخفيض الحمل المتعدد عبر البطن لتقليل خطر الأم والجنين.'),
      -- ── ECTO: ectopic pregnancy surgery ───────────────────────────────────
      ('Surgical treatment of ectopic pregnancy with salpingectomy/oophorectomy','ECTO','59120-00','Open treatment of tubal or ovarian ectopic pregnancy requiring salpingectomy and/or oophorectomy.','معالجة الحمل الهاجر مع استئصال البوق/المبيض','معالجة مفتوحة لحمل هاجر أنبوبي أو مبيضي تتطلب استئصال البوق و/أو المبيض.'),
      ('Surgical treatment of ectopic pregnancy without salpingectomy','ECTO','59121-00','Open treatment of tubal or ovarian ectopic pregnancy without salpingectomy/oophorectomy (salpingostomy).','معالجة الحمل الهاجر دون استئصال البوق','معالجة مفتوحة لحمل هاجر أنبوبي أو مبيضي دون استئصال البوق/المبيض (فتح البوق).'),
      ('Surgical treatment of abdominal ectopic pregnancy','ECTO','59130-00','Open surgical treatment of an abdominal ectopic pregnancy.','معالجة الحمل الهاجر البطني','معالجة جراحية مفتوحة لحمل هاجر بطني.'),
      ('Treatment of interstitial ectopic pregnancy with total hysterectomy','ECTO','59135-00','Treatment of an interstitial uterine ectopic pregnancy requiring total hysterectomy.','معالجة الحمل الهاجر الخلالي مع استئصال الرحم الكلي','معالجة حمل هاجر رحمي خلالي يتطلب استئصال الرحم الكلي.'),
      ('Treatment of interstitial ectopic pregnancy with partial uterine resection','ECTO','59136-00','Treatment of an interstitial uterine ectopic pregnancy with partial resection of the uterus (cornual resection).','معالجة الحمل الهاجر الخلالي مع استئصال جزئي للرحم','معالجة حمل هاجر رحمي خلالي مع استئصال جزئي للرحم (استئصال القرن).'),
      ('Treatment of cervical ectopic pregnancy with evacuation','ECTO','59140-00','Treatment of a cervical ectopic pregnancy with evacuation.','معالجة الحمل الهاجر العنقي مع الإفراغ','معالجة حمل هاجر عنقي مع الإفراغ.'),
      ('Laparoscopic treatment of ectopic pregnancy without salpingectomy','ECTO','59150-00','Laparoscopic treatment of a tubal ectopic pregnancy without salpingectomy/oophorectomy.','المعالجة بالمنظار للحمل الهاجر دون استئصال البوق','معالجة بالمنظار لحمل هاجر أنبوبي دون استئصال البوق/المبيض.'),
      ('Laparoscopic treatment of ectopic pregnancy with salpingectomy','ECTO','59151-00','Laparoscopic treatment of a tubal ectopic pregnancy with salpingectomy/oophorectomy.','المعالجة بالمنظار للحمل الهاجر مع استئصال البوق','معالجة بالمنظار لحمل هاجر أنبوبي مع استئصال البوق/المبيض.'),
      -- ── HYST: hysterectomy ────────────────────────────────────────────────
      ('Total abdominal hysterectomy','HYST','58150-00','Total abdominal hysterectomy, with or without removal of tubes and ovaries.','استئصال الرحم البطني الكلي','استئصال الرحم البطني الكلي مع أو دون استئصال البوقين والمبيضين.'),
      ('Supracervical (subtotal) abdominal hysterectomy','HYST','58180-00','Supracervical abdominal hysterectomy preserving the cervix.','استئصال الرحم البطني فوق العنقي','استئصال الرحم البطني فوق العنقي مع الحفاظ على عنق الرحم.'),
      ('Vaginal hysterectomy (uterus ≤250 g)','HYST','58260-00','Vaginal hysterectomy for a uterus weighing 250 g or less.','استئصال الرحم المهبلي (≤250غ)','استئصال الرحم المهبلي لرحم وزنه 250 غرام أو أقل.'),
      ('Vaginal hysterectomy with removal of tubes/ovaries','HYST','58262-00','Vaginal hysterectomy (≤250 g) with removal of tubes and/or ovaries.','استئصال الرحم المهبلي مع البوقين/المبيضين','استئصال الرحم المهبلي (≤250غ) مع استئصال البوقين و/أو المبيضين.'),
      ('Vaginal hysterectomy (uterus >250 g)','HYST','58290-00','Vaginal hysterectomy for a uterus weighing more than 250 g.','استئصال الرحم المهبلي (>250غ)','استئصال الرحم المهبلي لرحم وزنه أكثر من 250 غرام.'),
      ('Vaginal hysterectomy (>250 g) with removal of tubes/ovaries','HYST','58291-00','Vaginal hysterectomy (>250 g) with removal of tubes and/or ovaries.','استئصال الرحم المهبلي (>250غ) مع البوقين/المبيضين','استئصال الرحم المهبلي (>250غ) مع استئصال البوقين و/أو المبيضين.'),
      ('Laparoscopic supracervical hysterectomy (≤250 g)','HYST','58541-00','Laparoscopic supracervical hysterectomy for a uterus 250 g or less.','استئصال الرحم فوق العنقي بالمنظار (≤250غ)','استئصال الرحم فوق العنقي بالمنظار لرحم 250 غرام أو أقل.'),
      ('Laparoscopic supracervical hysterectomy with removal of tubes/ovaries','HYST','58542-00','Laparoscopic supracervical hysterectomy (≤250 g) with removal of tubes/ovaries.','استئصال الرحم فوق العنقي بالمنظار مع البوقين/المبيضين','استئصال الرحم فوق العنقي بالمنظار (≤250غ) مع البوقين/المبيضين.'),
      ('Laparoscopic-assisted vaginal hysterectomy (≤250 g)','HYST','58550-00','Laparoscopy with vaginal hysterectomy for a uterus 250 g or less.','استئصال الرحم المهبلي بمساعدة المنظار (≤250غ)','تنظير البطن مع استئصال الرحم المهبلي لرحم 250 غرام أو أقل.'),
      ('Laparoscopic-assisted vaginal hysterectomy with removal of tubes/ovaries','HYST','58552-00','Laparoscopy with vaginal hysterectomy (≤250 g) with removal of tubes/ovaries.','استئصال الرحم المهبلي بمساعدة المنظار مع البوقين/المبيضين','تنظير البطن مع استئصال الرحم المهبلي (≤250غ) مع البوقين/المبيضين.'),
      ('Total laparoscopic hysterectomy (≤250 g)','HYST','58570-00','Total laparoscopic hysterectomy for a uterus 250 g or less.','استئصال الرحم الكلي بالمنظار (≤250غ)','استئصال الرحم الكلي بالمنظار لرحم 250 غرام أو أقل.'),
      ('Total laparoscopic hysterectomy with removal of tubes/ovaries','HYST','58571-00','Total laparoscopic hysterectomy (≤250 g) with removal of tubes/ovaries.','استئصال الرحم الكلي بالمنظار مع البوقين/المبيضين','استئصال الرحم الكلي بالمنظار (≤250غ) مع البوقين/المبيضين.'),
      -- ── MYOM: myomectomy ──────────────────────────────────────────────────
      ('Abdominal myomectomy, 1-4 myomas','MYOM','58140-00','Abdominal removal of one to four leiomyomata.','استئصال الورم العضلي البطني، 1-4 أورام','استئصال بطني لعدد واحد إلى أربعة أورام عضلية ملساء.'),
      ('Abdominal myomectomy, 5 or more myomas','MYOM','58146-00','Abdominal removal of five or more leiomyomata.','استئصال الورم العضلي البطني، 5 أورام أو أكثر','استئصال بطني لخمسة أورام عضلية ملساء أو أكثر.'),
      ('Vaginal myomectomy','MYOM','58145-00','Vaginal removal of leiomyomata.','استئصال الورم العضلي المهبلي','استئصال الأورام العضلية الملساء عبر المهبل.'),
      ('Laparoscopic myomectomy, 1-4 myomas','MYOM','58545-00','Laparoscopic removal of one to four leiomyomata.','استئصال الورم العضلي بالمنظار، 1-4 أورام','استئصال بالمنظار لعدد واحد إلى أربعة أورام عضلية ملساء.'),
      ('Laparoscopic myomectomy, 5 or more myomas','MYOM','58546-00','Laparoscopic removal of five or more leiomyomata or those over 250 g.','استئصال الورم العضلي بالمنظار، 5 أورام أو أكثر','استئصال بالمنظار لخمسة أورام أو أكثر أو ما يزيد عن 250 غرام.'),
      ('Hysteroscopic myomectomy (removal of leiomyomata)','MYOM','58561-00','Hysteroscopy with removal of submucous leiomyomata.','استئصال الورم العضلي بتنظير الرحم','تنظير الرحم مع استئصال الأورام العضلية تحت المخاطية.'),
      ('Uterine artery embolization','MYOM','37243-00','Transcatheter vascular embolization of the uterine arteries for fibroids or haemorrhage.','إصمام الشريان الرحمي','إصمام وعائي للشرايين الرحمية عبر القسطرة للأورام الليفية أو النزف.'),
      -- ── HYSC: hysteroscopy ────────────────────────────────────────────────
      ('Diagnostic hysteroscopy','HYSC','58555-00','Diagnostic hysteroscopy to inspect the uterine cavity.','تنظير الرحم التشخيصي','تنظير الرحم التشخيصي لفحص تجويف الرحم.'),
      ('Hysteroscopy with biopsy, polypectomy or curettage','HYSC','58558-00','Hysteroscopy with sampling/removal of endometrium, polyps or curettage.','تنظير الرحم مع خزعة أو استئصال سَليلة أو كشط','تنظير الرحم مع أخذ عينة/إزالة بطانة الرحم أو السَّلائل أو الكشط.'),
      ('Hysteroscopy with lysis of intrauterine adhesions','HYSC','58559-00','Hysteroscopic division of intrauterine adhesions (Asherman syndrome).','تنظير الرحم مع تحرير الالتصاقات داخل الرحم','تحرير الالتصاقات داخل الرحم بالتنظير (متلازمة آشرمان).'),
      ('Hysteroscopy with division of uterine septum','HYSC','58560-00','Hysteroscopic division/resection of a uterine septum.','تنظير الرحم مع شقّ الحاجز الرحمي','شقّ/استئصال الحاجز الرحمي بالتنظير.'),
      ('Hysteroscopy with removal of impacted foreign body','HYSC','58562-00','Hysteroscopic removal of an impacted foreign body (eg retained IUD).','تنظير الرحم مع إزالة جسم غريب منحشر','إزالة جسم غريب منحشر بالتنظير (مثل لولب محتبس).'),
      ('Hysteroscopy with endometrial ablation','HYSC','58563-00','Hysteroscopic endometrial ablation for abnormal uterine bleeding.','تنظير الرحم مع كي بطانة الرحم','كي بطانة الرحم بالتنظير للنزف الرحمي الشاذ.'),
      ('Hysteroscopic sterilization (tubal occlusion)','HYSC','58565-00','Hysteroscopy with bilateral fallopian tube cannulation and placement of permanent implants for sterilization.','التعقيم بتنظير الرحم (سدّ البوقين)','تنظير الرحم مع قَنْيَلة البوقين ووضع زرعات دائمة للتعقيم.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('CSEC','VDEL','ECTO','HYST','MYOM','HYSC')`);
  }
}
