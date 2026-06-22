import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PEDSURG proc_cpts — batch 1 of 2 (49 procedures).
 * Groups: AWAL (abdominal-wall-defect closure), APDX (appendectomy), DIAF (diaphragm),
 * ESOP (oesophageal), GUSX (genitourinary/scrotal), ANOR (anorectal), HERN (hernia).
 *
 * Every CPT verified against AAPC (aapc.com/codes/cpt-codes/<code>). The 2023 anterior-
 * abdominal-hernia restructure was handled: the deleted umbilical/epigastric codes
 * 49570/49572/49580/49585 are replaced by 49591/49592/49593/49613; 46700 (adult anoplasty)
 * was replaced by the infant code 46705. Links to main_diags are added by migration 097.
 */
export class ImportPedsurgProcCpts11750000000095 implements MigrationInterface {
  name = "ImportPedsurgProcCpts11750000000095";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES

      -- ── AWAL: abdominal-wall-defect closure ──────────────────────────────
      ('Repair of small omphalocele, primary closure','AWAL','49600-00','Primary surgical closure of a small omphalocele by direct suture of the abdominal-wall defect.','إصلاح قيلة سرّية صغيرة بالإغلاق الأولي','إغلاق جراحي أولي لقيلة سرّية صغيرة بخياطة مباشرة لعيب جدار البطن.'),
      ('Repair of large omphalocele or gastroschisis','AWAL','49605-00','Repair of a large omphalocele or gastroschisis, with or without prosthesis, reducing the viscera into the abdomen.','إصلاح قيلة سرّية كبيرة أو انفلاق بطني','إصلاح قيلة سرّية كبيرة أو انفلاق بطني، مع أو بدون طعم، مع رد الأحشاء إلى البطن.'),
      ('Repair of large omphalocele/gastroschisis with prosthesis removal and closure','AWAL','49606-00','Staged final reduction and abdominal-wall closure after removal of a previously placed prosthetic silo.','إصلاح قيلة سرّية/انفلاق كبير مع إزالة الطعم والإغلاق','الرد النهائي المرحلي وإغلاق جدار البطن بعد إزالة طعم صناعي موضوع سابقاً.'),
      ('Gross-type omphalocele operation, first stage','AWAL','49610-00','First stage of a staged (Gross-type) skin-flap repair of an omphalocele.','عملية غروس للقيلة السرّية، المرحلة الأولى','المرحلة الأولى من إصلاح القيلة السرّية المرحلي بشرائح جلدية (طريقة غروس).'),
      ('Gross-type omphalocele operation, second stage','AWAL','49611-00','Second-stage closure of the ventral hernia following a Gross-type omphalocele repair.','عملية غروس للقيلة السرّية، المرحلة الثانية','إغلاق الفتق البطني في المرحلة الثانية بعد إصلاح القيلة السرّية بطريقة غروس.'),
      ('Closure of bladder exstrophy','AWAL','51940-00','Surgical closure of bladder exstrophy with reconstruction of the bladder and lower abdominal wall.','إغلاق انقلاب المثانة','إغلاق جراحي لانقلاب المثانة مع إعادة بناء المثانة وجدار البطن السفلي.'),
      ('Secondary suture of abdominal wall (dehiscence/evisceration)','AWAL','49900-00','Secondary resuture of an abdominal wound that has dehisced, with or without evisceration.','خياطة ثانوية لجدار البطن (التفزّر/خروج الأحشاء)','إعادة خياطة ثانوية لجرح بطني متفزّر، مع أو بدون خروج الأحشاء.'),

      -- ── APDX: appendectomy ───────────────────────────────────────────────
      ('Laparoscopic appendectomy','APDX','44970-00','Laparoscopic removal of an inflamed appendix.','استئصال الزائدة بالمنظار','استئصال الزائدة الملتهبة بالمنظار البطني.'),
      ('Open appendectomy','APDX','44950-00','Open removal of an inflamed appendix through a right iliac-fossa incision.','استئصال الزائدة المفتوح','استئصال الزائدة الملتهبة بشق مفتوح في الحفرة الحرقفية اليمنى.'),
      ('Appendectomy for ruptured appendix with peritonitis','APDX','44960-00','Open appendectomy for a perforated appendix with generalised peritonitis, including peritoneal lavage.','استئصال الزائدة المنثقبة مع التهاب الصفاق','استئصال زائدة مفتوح لزائدة منثقبة مع التهاب صفاق معمم، شاملاً الغسيل الصفاقي.'),
      ('Open drainage of appendiceal abscess','APDX','44900-00','Open incision and drainage of an appendiceal abscess.','تصريف مفتوح لخراج الزائدة','شق وتصريف مفتوح لخراج الزائدة الدودية.'),
      ('Image-guided percutaneous drainage of intra-abdominal abscess','APDX','49406-00','Percutaneous image-guided catheter drainage of a peritoneal or retroperitoneal abscess.','تصريف عبر الجلد موجّه بالتصوير لخراج بطني','تصريف بالقسطرة عبر الجلد موجّه بالتصوير لخراج صفاقي أو خلف الصفاق.'),
      ('Right hemicolectomy','APDX','44160-00','Resection of the terminal ileum and right colon with anastomosis, eg, for an appendiceal carcinoid.','استئصال القولون الأيمن','استئصال اللفائفي النهائي والقولون الأيمن مع المفاغرة، مثلاً لورم سرطاوي بالزائدة.'),

      -- ── DIAF: diaphragm ──────────────────────────────────────────────────
      ('Repair of neonatal diaphragmatic hernia','DIAF','39503-00','Repair of a congenital diaphragmatic hernia in the newborn, reducing the herniated viscera and closing the defect.','إصلاح الفتق الحجابي عند حديثي الولادة','إصلاح فتق حجابي خلقي عند الوليد، مع رد الأحشاء المنفتقة وإغلاق العيب.'),
      ('Repair of diaphragmatic hernia, acute traumatic','DIAF','39540-00','Repair of an acute traumatic diaphragmatic hernia.','إصلاح الفتق الحجابي الرضحي الحاد','إصلاح فتق حجابي رضحي حاد.'),
      ('Repair of diaphragmatic hernia, chronic/recurrent traumatic','DIAF','39541-00','Repair of a chronic or recurrent traumatic diaphragmatic hernia.','إصلاح الفتق الحجابي الرضحي المزمن (الناكس)','إصلاح فتق حجابي رضحي مزمن أو ناكس.'),
      ('Imbrication (plication) of diaphragm for eventration','DIAF','39545-00','Plication of an eventrated or paralysed hemidiaphragm to restore its dome.','طيّ الحجاب الحاجز (لارتخائه)','طيّ نصف الحجاب الحاجز المرتخي أو المشلول لاستعادة قبّته.'),
      ('Resection of diaphragm with complex reconstruction','DIAF','39561-00','Resection of diaphragm with complex reconstruction using a prosthesis or muscle flap.','استئصال الحجاب الحاجز مع إعادة بناء معقّدة','استئصال الحجاب الحاجز مع إعادة بناء معقّدة بطعم صناعي أو شريحة عضلية.'),

      -- ── ESOP: oesophageal ────────────────────────────────────────────────
      ('Esophagoplasty for congenital atresia, thoracic, without TEF repair','ESOP','43313-00','Thoracic plastic repair of congenital oesophageal atresia without tracheo-oesophageal fistula.','رأب المريء للرتق الخلقي عبر الصدر دون إصلاح الناسور','رأب صدري لرتق المريء الخلقي دون ناسور رغامي مريئي.'),
      ('Esophagoplasty for atresia with TEF repair, thoracic','ESOP','43314-00','Thoracic repair of oesophageal atresia with division of the tracheo-oesophageal fistula and primary anastomosis.','رأب المريء للرتق مع إصلاح الناسور عبر الصدر','إصلاح صدري لرتق المريء مع قطع الناسور الرغامي المريئي والمفاغرة الأولية.'),
      ('Repair of tracheo-oesophageal fistula','ESOP','43312-00','Surgical division and repair of a tracheo-oesophageal fistula.','إصلاح الناسور الرغامي المريئي','قطع وإصلاح جراحي للناسور الرغامي المريئي.'),
      ('Oesophageal reconstruction/replacement, thoracic','ESOP','43360-00','Gastrointestinal reconstruction of the oesophagus (eg, gastric pull-up) for long-gap atresia or stricture.','إعادة بناء/استبدال المريء عبر الصدر','إعادة بناء المريء (مثل سحب المعدة) لرتق طويل الفجوة أو تضيّق.'),
      ('Dilation of oesophagus by bougie','ESOP','43450-00','Dilation of an oesophageal stricture by passing progressively larger bougies.','توسيع المريء بالمبزل','توسيع تضيّق المريء بتمرير مبازل متزايدة الحجم.'),
      ('Oesophagoscopy with balloon dilation','ESOP','43220-00','Flexible oesophagoscopy with balloon dilation (under 30 mm) of an oesophageal stricture.','تنظير المريء مع التوسيع بالبالون','تنظير مريء مرن مع توسيع بالبالون (أقل من 30 مم) لتضيّق المريء.'),

      -- ── GUSX: genitourinary / scrotal ────────────────────────────────────
      ('Hydrocelectomy, unilateral','GUSX','55040-00','Excision of a unilateral scrotal hydrocele.','استئصال القيلة المائية أحادي الجانب','استئصال قيلة مائية صفنية أحادية الجانب.'),
      ('Hydrocelectomy, bilateral','GUSX','55041-00','Excision of bilateral scrotal hydroceles.','استئصال القيلة المائية ثنائي الجانب','استئصال قيلتين مائيتين صفنيتين ثنائيتي الجانب.'),
      ('Orchidopexy, inguinal approach','GUSX','54640-00','Mobilisation and scrotal fixation of an undescended testis through an inguinal approach.','تثبيت الخصية بالمدخل الإربي','تحرير الخصية غير النازلة وتثبيتها في الصفن عبر مدخل إربي.'),
      ('Orchidopexy, abdominal approach (Fowler-Stephens)','GUSX','54650-00','Orchidopexy for an intra-abdominal testis, often as a Fowler-Stephens procedure.','تثبيت الخصية بالمدخل البطني (فاولر-ستيفنز)','تثبيت خصية داخل بطنية، غالباً بعملية فاولر-ستيفنز.'),
      ('Excision of varicocele / spermatic vein ligation','GUSX','55530-00','Excision of a varicocele or ligation of the spermatic veins.','استئصال القيلة الدوالية / ربط الأوردة المنوية','استئصال قيلة دوالية أو ربط الأوردة المنوية.'),
      ('Reduction of testicular torsion','GUSX','54600-00','Surgical detorsion of a torted testis with assessment of viability.','رد انفتال الخصية','فك التواء الخصية المنفتلة جراحياً مع تقييم حيويتها.'),
      ('Orchidopexy of contralateral testis (fixation)','GUSX','54620-00','Fixation of the contralateral testis to prevent future torsion.','تثبيت الخصية المقابلة','تثبيت الخصية المقابلة للوقاية من الانفتال المستقبلي.'),
      ('One-stage distal hypospadias repair','GUSX','54322-00','One-stage repair of distal hypospadias with urethroplasty and chordee correction.','إصلاح المبال التحتاني القاصي بمرحلة واحدة','إصلاح المبال التحتاني القاصي بمرحلة واحدة مع رأب الإحليل وتصحيح الانحناء.'),

      -- ── ANOR: anorectal ──────────────────────────────────────────────────
      ('Repair of cloacal anomaly, sacroperineal','ANOR','46744-00','Sacroperineal reconstruction of a female anorectal/vaginal (cloacal) malformation.','إصلاح تشوه المذرق بالمدخل العجزي العجاني','إعادة بناء عجزية عجانية لتشوه شرجي مستقيمي مهبلي (مذرقي) أنثوي.'),
      ('Repair of high imperforate anus with fistula','ANOR','46742-00','Combined abdominoperineal repair of a high imperforate anus with a rectourethral or rectovaginal fistula.','إصلاح رتق الشرج العالي مع الناسور','إصلاح بطني عجاني مشترك لرتق شرج عالٍ مع ناسور مستقيمي إحليلي أو مهبلي.'),
      ('Repair of low imperforate anus (perineal fistula)','ANOR','46715-00','Perineal repair of a low imperforate anus with closure of the perineal fistula and anoplasty.','إصلاح رتق الشرج المنخفض (الناسور العجاني)','إصلاح عجاني لرتق شرج منخفض مع إغلاق الناسور العجاني ورأب الشرج.'),
      ('Anoplasty for anal stricture, infant','ANOR','46705-00','Anoplasty to relieve an anal stricture in an infant.','رأب الشرج لتضيّق الشرج عند الرضيع','رأب الشرج لتخفيف تضيّق الشرج عند الرضيع.'),
      ('Creation of colostomy','ANOR','44320-00','Creation of a colostomy to divert the faecal stream.','إنشاء فغر القولون','إنشاء فغر قولوني لتحويل مجرى البراز.'),
      ('Closure of enterostomy with anastomosis','ANOR','44625-00','Closure of a colostomy or enterostomy with resection and re-anastomosis of bowel.','إغلاق الفغر المعوي مع المفاغرة','إغلاق الفغر القولوني أو المعوي مع استئصال وإعادة مفاغرة الأمعاء.'),

      -- ── HERN: hernia (inguinal/femoral/umbilical/epigastric/urachal) ──────
      ('Repair of inguinal hernia, preterm infant','HERN','49491-00','Repair of a reducible inguinal hernia in a preterm infant (up to 50 weeks post-conception).','إصلاح الفتق الإربي عند الخديج','إصلاح فتق إربي قابل للرد عند خديج (حتى 50 أسبوعاً بعد الحمل).'),
      ('Repair of inguinal hernia, age 6 months to under 5 years','HERN','49500-00','Repair of an initial reducible inguinal hernia in a child 6 months to under 5 years, with or without hydrocelectomy.','إصلاح الفتق الإربي بعمر 6 أشهر حتى أقل من 5 سنوات','إصلاح فتق إربي أولي قابل للرد لطفل بعمر 6 أشهر حتى أقل من 5 سنوات، مع أو بدون استئصال القيلة المائية.'),
      ('Repair of inguinal hernia, age 5 years or older','HERN','49505-00','Repair of an initial reducible inguinal hernia in a patient 5 years or older.','إصلاح الفتق الإربي بعمر 5 سنوات فأكثر','إصلاح فتق إربي أولي قابل للرد لمريض بعمر 5 سنوات فأكثر.'),
      ('Repair of incarcerated inguinal hernia, infant under 6 months','HERN','49496-00','Repair of an incarcerated or strangulated inguinal hernia in an infant under 6 months.','إصلاح الفتق الإربي المحتبس عند الرضيع دون 6 أشهر','إصلاح فتق إربي محتبس أو مختنق عند رضيع دون 6 أشهر.'),
      ('Laparoscopic inguinal hernia repair','HERN','49650-00','Laparoscopic repair of an initial inguinal hernia.','إصلاح الفتق الإربي بالمنظار','إصلاح فتق إربي أولي بالمنظار.'),
      ('Repair of femoral hernia','HERN','49550-00','Open repair of a reducible femoral hernia.','إصلاح الفتق الفخذي','إصلاح مفتوح لفتق فخذي قابل للرد.'),
      ('Excision of urachal cyst or sinus','HERN','51500-00','Excision of a urachal cyst or sinus, with or without umbilical hernia repair.','استئصال كيس أو ناسور القناة السرّية','استئصال كيس أو ناسور القناة السرّية، مع أو بدون إصلاح الفتق السري.'),
      ('Anterior abdominal (umbilical/epigastric) hernia repair, initial under 3 cm, reducible','HERN','49591-00','Repair of an initial reducible anterior abdominal-wall hernia (umbilical/epigastric) under 3 cm.','إصلاح فتق جدار البطن الأمامي (سرّي/شرسوفي) أولي أقل من 3 سم قابل للرد','إصلاح فتق أولي قابل للرد بجدار البطن الأمامي (سرّي/شرسوفي) أقل من 3 سم.'),
      ('Anterior abdominal hernia repair, initial under 3 cm, incarcerated','HERN','49592-00','Repair of an incarcerated or strangulated anterior abdominal-wall hernia under 3 cm.','إصلاح فتق جدار البطن الأمامي أولي أقل من 3 سم محتبس','إصلاح فتق محتبس أو مختنق بجدار البطن الأمامي أقل من 3 سم.'),
      ('Anterior abdominal hernia repair, initial 3-10 cm, reducible','HERN','49593-00','Repair of an initial reducible anterior abdominal-wall hernia 3-10 cm, with or without mesh.','إصلاح فتق جدار البطن الأمامي أولي 3-10 سم قابل للرد','إصلاح فتق أولي قابل للرد بجدار البطن الأمامي 3-10 سم، مع أو بدون شبكة.'),
      ('Anterior abdominal hernia repair, recurrent under 3 cm','HERN','49613-00','Repair of a recurrent anterior abdominal-wall hernia under 3 cm.','إصلاح فتق جدار البطن الأمامي الناكس أقل من 3 سم','إصلاح فتق ناكس بجدار البطن الأمامي أقل من 3 سم.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('AWAL','APDX','DIAF','ESOP','GUSX','ANOR','HERN')`);
  }
}
