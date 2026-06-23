import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * SOC proc_cpts — batch 2 of 2 (55 procedures). Groups: THYR (thyroid/parathyroid), HNCK
 * (head & neck), SKIN (cutaneous malignancy excision), OVRY (ovarian cytoreduction), HYST
 * (gynae-oncology), SARC (soft-tissue/retroperitoneal sarcoma), NEPH (genitourinary oncology),
 * ADRN (adrenal), LYMP (spleen/lymph nodes), METS (metastasectomy/peritoneal).
 *
 * Every CPT verified current/active against AAPC — see MEDICAL_CODE_AUDITS/SOC/AUDIT_SOC.md "2E".
 * Linked to main_diags by migration 110.
 */
export class ImportSocProcCpts21750000000109 implements MigrationInterface {
  name = "ImportSocProcCpts21750000000109";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      -- ── THYR: thyroid / parathyroid ───────────────────────────────────────
      ('Total thyroidectomy','THYR','60240-00','Complete surgical removal of the entire thyroid gland.','استئصال الغدة الدرقية الكلي','إزالة جراحية كاملة للغدة الدرقية بأكملها.'),
      ('Total thyroidectomy with limited neck dissection','THYR','60252-00','Total thyroidectomy with limited (central-compartment) neck lymph node dissection.','استئصال الغدة الدرقية الكلي مع تجريف عنق محدود','استئصال درقي كلي مع تجريف محدود للعقد العنقية (الحجرة المركزية).'),
      ('Total thyroidectomy with radical neck dissection','THYR','60254-00','Total thyroidectomy with radical lateral neck lymph node dissection for nodal metastases.','استئصال الغدة الدرقية الكلي مع تجريف عنق جذري','استئصال درقي كلي مع تجريف جذري للعقد العنقية الجانبية للنقائل العقدية.'),
      ('Total thyroid lobectomy','THYR','60220-00','Complete removal of one thyroid lobe, with or without the isthmus.','استئصال فص الغدة الدرقية الكامل','إزالة كاملة لأحد فصّي الغدة الدرقية مع أو دون البرزخ.'),
      ('Completion thyroidectomy','THYR','60260-00','Removal of remaining thyroid tissue after a prior partial thyroidectomy.','استئصال الغدة الدرقية المكمّل','إزالة النسيج الدرقي المتبقي بعد استئصال درقي جزئي سابق.'),
      ('Parathyroidectomy','THYR','60500-00','Surgical exploration and removal of a parathyroid gland (eg parathyroid carcinoma/adenoma).','استئصال الغدة جار الدرقية','استكشاف وإزالة جراحية للغدة جار الدرقية (مثل السرطانة/الورم الغدي).'),
      -- ── HNCK: head & neck ─────────────────────────────────────────────────
      ('Radical neck dissection','HNCK','38720-00','Complete cervical lymphadenectomy removing the cervical nodes and associated structures.','تجريف العنق الجذري','استئصال كامل للعقد اللمفية العنقية مع البنى المصاحبة.'),
      ('Modified radical neck dissection','HNCK','38724-00','Cervical lymphadenectomy preserving vital non-lymphatic structures (nerve/vein/muscle).','تجريف العنق الجذري المعدّل','استئصال للعقد العنقية مع الحفاظ على البنى غير اللمفية الحيوية (العصب/الوريد/العضلة).'),
      ('Partial glossectomy with neck dissection','HNCK','41135-00','Partial removal of the tongue with unilateral neck lymph node dissection for tongue cancer.','استئصال اللسان الجزئي مع تجريف العنق','إزالة جزئية للسان مع تجريف العقد العنقية أحادي الجانب لسرطان اللسان.'),
      ('Total glossectomy with radical neck dissection','HNCK','41145-00','Removal of the entire tongue with radical neck dissection, often with tracheostomy.','استئصال اللسان الكلي مع تجريف العنق الجذري','إزالة اللسان بالكامل مع تجريف العنق الجذري، غالباً مع فغر الرغامى.'),
      ('Total parotidectomy with facial nerve dissection','HNCK','42420-00','Removal of the entire parotid gland with dissection and preservation of the facial nerve.','استئصال الغدة النكفية الكلي مع تسليخ العصب الوجهي','إزالة الغدة النكفية بالكامل مع تسليخ العصب الوجهي والحفاظ عليه.'),
      ('Lateral parotidectomy with facial nerve preservation','HNCK','42415-00','Excision of the parotid tumour/lateral lobe with preservation of the facial nerve.','استئصال الغدة النكفية الجانبي مع حفظ العصب الوجهي','استئصال ورم النكفية/الفص الجانبي مع الحفاظ على العصب الوجهي.'),
      ('Total laryngectomy','HNCK','31360-00','Complete removal of the larynx without radical neck dissection for laryngeal cancer.','استئصال الحنجرة الكلي','إزالة كاملة للحنجرة دون تجريف عنق جذري لسرطان الحنجرة.'),
      ('Total laryngectomy with radical neck dissection','HNCK','31365-00','Total laryngectomy combined with radical neck lymph node dissection.','استئصال الحنجرة الكلي مع تجريف العنق الجذري','استئصال الحنجرة الكلي مع تجريف جذري للعقد العنقية.'),
      ('Resection of lip for malignancy','HNCK','40530-00','Excision of more than one-fourth of the lip for a malignant lesion.','استئصال الشفة لورم خبيث','استئصال أكثر من ربع الشفة لآفة خبيثة.'),
      -- ── SKIN: cutaneous malignancy excision ───────────────────────────────
      ('Excision of malignant lesion, trunk/arm/leg, >4 cm','SKIN','11606-00','Wide excision of a malignant skin lesion over 4 cm of the trunk, arms or legs.','استئصال آفة خبيثة، الجذع/الذراع/الساق، >4 سم','استئصال واسع لآفة جلدية خبيثة أكبر من 4 سم في الجذع أو الذراعين أو الساقين.'),
      ('Excision of malignant lesion, scalp/neck, >4 cm','SKIN','11626-00','Wide excision of a malignant skin lesion over 4 cm of the scalp, neck, hands, feet or genitalia.','استئصال آفة خبيثة، الفروة/العنق، >4 سم','استئصال واسع لآفة جلدية خبيثة أكبر من 4 سم في الفروة أو العنق أو اليدين أو القدمين أو الأعضاء التناسلية.'),
      ('Excision of malignant lesion, face/lip, >4 cm','SKIN','11646-00','Wide excision of a malignant skin lesion over 4 cm of the face, ears, eyelids, nose or lips.','استئصال آفة خبيثة، الوجه/الشفة، >4 سم','استئصال واسع لآفة جلدية خبيثة أكبر من 4 سم في الوجه أو الأذنين أو الجفون أو الأنف أو الشفتين.'),
      ('Excision of malignant lesion, trunk/arm/leg, 3.1-4 cm','SKIN','11604-00','Wide excision of a 3.1-4 cm malignant skin lesion of the trunk, arms or legs.','استئصال آفة خبيثة، الجذع/الذراع/الساق، 3.1-4 سم','استئصال واسع لآفة جلدية خبيثة 3.1-4 سم في الجذع أو الذراعين أو الساقين.'),
      ('Excision of malignant lesion, face, 3.1-4 cm','SKIN','11644-00','Wide excision of a 3.1-4 cm malignant skin lesion of the face, ears, eyelids, nose or lips.','استئصال آفة خبيثة، الوجه، 3.1-4 سم','استئصال واسع لآفة جلدية خبيثة 3.1-4 سم في الوجه أو الأذنين أو الجفون أو الأنف أو الشفتين.'),
      -- ── OVRY: ovarian cytoreduction ───────────────────────────────────────
      ('Resection of ovarian malignancy with omentectomy','OVRY','58950-00','Resection of an ovarian, tubal or primary peritoneal malignancy with bilateral salpingo-oophorectomy and omentectomy.','استئصال ورم المبيض الخبيث مع استئصال الثرب','استئصال ورم خبيث في المبيض أو البوق أو الصفاق الأولي مع استئصال البوقين والمبيضين والثرب.'),
      ('Ovarian cytoreduction with TAH and lymphadenectomy','OVRY','58951-00','Ovarian malignancy resection with omentectomy, total hysterectomy and pelvic/para-aortic lymphadenectomy.','حطّ ورم المبيض مع استئصال الرحم والعقد اللمفية','استئصال ورم المبيض مع استئصال الثرب واستئصال الرحم الكامل وتجريف العقد الحوضية وحول الأبهر.'),
      ('Radical ovarian debulking with hysterectomy','OVRY','58953-00','Bilateral salpingo-oophorectomy with omentectomy, hysterectomy and radical tumour debulking.','حطّ ورم المبيض الجذري مع استئصال الرحم','استئصال البوقين والمبيضين مع الثرب واستئصال الرحم وحطّ جذري للورم.'),
      ('Radical ovarian debulking with pelvic lymphadenectomy','OVRY','58954-00','Radical ovarian tumour debulking with hysterectomy, omentectomy and pelvic/para-aortic lymphadenectomy.','حطّ ورم المبيض الجذري مع تجريف العقد الحوضية','حطّ جذري لورم المبيض مع استئصال الرحم والثرب وتجريف العقد الحوضية وحول الأبهر.'),
      ('Second-look laparotomy for ovarian malignancy','OVRY','58960-00','Re-exploratory laparotomy with peritoneal biopsies and node sampling for ovarian-cancer restaging.','فتح البطن الاستكشافي الثاني لورم المبيض','إعادة فتح البطن مع خزعات صفاقية وأخذ عينات من العقد لإعادة تحديد مرحلة سرطان المبيض.'),
      -- ── HYST: gynae-oncology ──────────────────────────────────────────────
      ('Radical hysterectomy with pelvic lymphadenectomy','HYST','58210-00','Radical abdominal hysterectomy (Wertheim) with bilateral pelvic lymphadenectomy and para-aortic sampling.','استئصال الرحم الجذري مع تجريف العقد الحوضية','استئصال رحم بطني جذري (فيرتهايم) مع تجريف العقد الحوضية الثنائي وأخذ عينات حول الأبهر.'),
      ('Total hysterectomy with node sampling','HYST','58200-00','Total abdominal hysterectomy with partial vaginectomy and pelvic/para-aortic node sampling for endometrial cancer.','استئصال الرحم الكامل مع أخذ عينات العقد','استئصال رحم بطني كامل مع استئصال مهبلي جزئي وأخذ عينات من العقد الحوضية وحول الأبهر لسرطان بطانة الرحم.'),
      ('Pelvic exenteration (gynaecological)','HYST','58240-00','En-bloc removal of pelvic organs for recurrent or advanced gynaecological malignancy.','استئصال أعضاء الحوض (نسائي)','إزالة كتلية لأعضاء الحوض لورم نسائي خبيث ناكس أو متقدم.'),
      ('Radical partial vulvectomy with lymphadenectomy','HYST','56631-00','Radical partial vulvectomy with unilateral inguinofemoral lymphadenectomy for vulvar cancer.','استئصال الفرج الجزئي الجذري مع تجريف العقد','استئصال فرج جزئي جذري مع تجريف العقد الإربية الفخذية أحادي الجانب لسرطان الفرج.'),
      ('Radical complete vulvectomy','HYST','56633-00','Radical complete removal of the vulva for malignant disease.','استئصال الفرج الكامل الجذري','إزالة جذرية كاملة للفرج لمرض خبيث.'),
      ('Complete vaginectomy','HYST','57110-00','Complete removal of the vaginal wall for vaginal malignancy.','استئصال المهبل الكامل','إزالة كاملة لجدار المهبل لورم مهبلي خبيث.'),
      -- ── SARC: soft-tissue / retroperitoneal sarcoma ───────────────────────
      ('Excision of intra-abdominal/retroperitoneal tumour, ≤5 cm','SARC','49186-00','Open excision/destruction of one or more intra-abdominal or retroperitoneal tumours up to 5 cm.','استئصال ورم داخل البطن/خلف الصفاق، ≤5 سم','استئصال/إتلاف مفتوح لورم أو أكثر داخل البطن أو خلف الصفاق حتى 5 سم.'),
      ('Excision of intra-abdominal/retroperitoneal tumour, 5.1-10 cm','SARC','49187-00','Open excision/destruction of intra-abdominal or retroperitoneal tumour(s) of 5.1-10 cm.','استئصال ورم داخل البطن/خلف الصفاق، 5.1-10 سم','استئصال/إتلاف مفتوح لورم داخل البطن أو خلف الصفاق بحجم 5.1-10 سم.'),
      ('Excision of giant intra-abdominal/retroperitoneal tumour (>30 cm)','SARC','49190-00','Open excision/destruction of giant intra-abdominal or retroperitoneal tumour(s) exceeding 30 cm.','استئصال ورم عملاق داخل البطن/خلف الصفاق (>30 سم)','استئصال/إتلاف مفتوح لورم عملاق داخل البطن أو خلف الصفاق يتجاوز 30 سم.'),
      ('Radical resection of soft-tissue tumour of thigh/knee','SARC','27329-00','Radical (subfascial) resection of a soft-tissue sarcoma of the thigh or knee region.','الاستئصال الجذري لورم الأنسجة الرخوة في الفخذ/الركبة','استئصال جذري (تحت اللفافة) لساركوما الأنسجة الرخوة في منطقة الفخذ أو الركبة.'),
      ('Radical resection of soft-tissue tumour of abdominal wall','SARC','22904-00','Radical resection of a soft-tissue sarcoma of the abdominal wall.','الاستئصال الجذري لورم الأنسجة الرخوة في جدار البطن','استئصال جذري لساركوما الأنسجة الرخوة في جدار البطن.'),
      -- ── NEPH: genitourinary oncology ──────────────────────────────────────
      ('Radical nephrectomy','NEPH','50230-00','Removal of the kidney with Gerota fascia, perinephric fat and regional nodes for renal cancer.','استئصال الكلية الجذري','إزالة الكلية مع لفافة جيروتا والشحم حول الكلية والعقد الإقليمية لسرطان الكلية.'),
      ('Partial nephrectomy','NEPH','50240-00','Nephron-sparing resection of a renal tumour with preservation of the remaining kidney.','استئصال الكلية الجزئي','استئصال حافظ للنفرونات لورم كلوي مع الحفاظ على بقية الكلية.'),
      ('Radical cystectomy','NEPH','51570-00','Complete removal of the urinary bladder for invasive bladder cancer.','استئصال المثانة الجذري','إزالة كاملة للمثانة البولية لسرطان مثانة غازٍ.'),
      ('Radical cystectomy with ileal conduit','NEPH','51590-00','Radical cystectomy with urinary diversion via an ileal (or sigmoid) conduit.','استئصال المثانة الجذري مع قناة لفائفية','استئصال المثانة الجذري مع تحويل بولي عبر قناة لفائفية (أو سينية).'),
      ('Radical retropubic prostatectomy','NEPH','55840-00','Radical removal of the prostate and surrounding structures via a retropubic approach.','استئصال البروستاتا الجذري خلف العانة','إزالة جذرية للبروستاتا والبنى المحيطة عبر مدخل خلف العانة.'),
      ('Radical inguinal orchiectomy','NEPH','54530-00','Removal of the testis with the spermatic cord via an inguinal approach for testicular tumour.','استئصال الخصية الجذري الإربي','إزالة الخصية مع الحبل المنوي عبر مدخل إربي لورم خصوي.'),
      ('Radical penectomy with inguinal lymphadenectomy','NEPH','54130-00','Complete removal of the penis with bilateral inguinal lymphadenectomy for penile cancer.','استئصال القضيب الجذري مع تجريف العقد الإربية','إزالة كاملة للقضيب مع تجريف العقد الإربية الثنائي لسرطان القضيب.'),
      ('Pelvic lymphadenectomy','NEPH','38770-00','Excision of the pelvic (external iliac, hypogastric, obturator) lymph nodes for staging.','تجريف العقد اللمفية الحوضية','استئصال العقد اللمفية الحوضية (الحرقفية الظاهرة، تحت المعدية، السدادية) لتحديد المرحلة.'),
      ('Retroperitoneal lymphadenectomy (RPLND)','NEPH','38780-00','Extensive excision of retroperitoneal and para-aortic lymph nodes (eg for testicular cancer).','تجريف العقد اللمفية خلف الصفاق','استئصال موسّع للعقد اللمفية خلف الصفاق وحول الأبهر (مثلاً لسرطان الخصية).'),
      -- ── ADRN: adrenal ─────────────────────────────────────────────────────
      ('Open adrenalectomy','ADRN','60540-00','Open exploration and removal of one or both adrenal glands for tumour.','استئصال الكظر المفتوح','استكشاف وإزالة مفتوحة لإحدى الغدتين الكظريتين أو كلتيهما لورم.'),
      ('Adrenalectomy with retroperitoneal tumour excision','ADRN','60545-00','Adrenalectomy with en-bloc excision of an adjacent retroperitoneal tumour.','استئصال الكظر مع ورم خلف الصفاق','استئصال الكظر مع استئصال كتلي لورم مجاور خلف الصفاق.'),
      ('Laparoscopic adrenalectomy','ADRN','60650-00','Laparoscopic partial or complete adrenalectomy for an adrenal tumour.','استئصال الكظر بالمنظار','استئصال كظر جزئي أو كامل بالمنظار لورم كظري.'),
      -- ── LYMP: spleen / lymph nodes ────────────────────────────────────────
      ('Laparoscopic splenectomy','LYMP','38120-00','Laparoscopic complete removal of the spleen (eg for lymphoma or splenic involvement).','استئصال الطحال بالمنظار','إزالة كاملة للطحال بالمنظار (مثلاً للمفوما أو إصابة طحالية).'),
      ('Total splenectomy','LYMP','38100-00','Open complete removal of the spleen.','استئصال الطحال الكلي','إزالة كاملة مفتوحة للطحال.'),
      ('Excision/biopsy of deep cervical lymph node','LYMP','38510-00','Open excision or biopsy of deep cervical (neck) lymph node(s) for diagnosis.','استئصال/خزعة العقدة اللمفية العنقية العميقة','استئصال أو خزعة مفتوحة للعقد اللمفية العنقية العميقة للتشخيص.'),
      ('Excision/biopsy of internal mammary lymph node','LYMP','38530-00','Open excision or biopsy of internal mammary lymph node(s).','استئصال/خزعة العقدة اللمفية الثديية الباطنة','استئصال أو خزعة مفتوحة للعقد اللمفية الثديية الباطنة.'),
      -- ── METS: metastasectomy / peritoneal ─────────────────────────────────
      ('Pulmonary metastasectomy (wedge resection)','METS','32505-00','Thoracotomy with wedge (non-anatomic) resection of pulmonary metastasis, initial.','استئصال النقائل الرئوية (استئصال وتدي)','شق صدري مع استئصال وتدي (غير تشريحي) لنقيلة رئوية، أولي.'),
      ('Omentectomy/peritonectomy for metastatic disease','METS','49255-00','Excision of the omentum/peritoneum for peritoneal carcinomatosis or spreading abdominal cancer.','استئصال الثرب/الصفاق للمرض النقيلي','استئصال الثرب/الصفاق لانتشار السرطان البريتواني أو الورم البطني المنتشر.'),
      ('Intraperitoneal chemotherapy perfusion (HIPEC)','METS','96446-00','Administration of chemotherapy into the peritoneal cavity via catheter/port (eg HIPEC after cytoreduction).','ضخّ العلاج الكيميائي داخل الصفاق (هايبك)','إعطاء العلاج الكيميائي داخل التجويف البريتواني عبر قسطرة/منفذ (مثل هايبك بعد حطّ الورم).')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('THYR','HNCK','SKIN','OVRY','HYST','SARC','NEPH','ADRN','LYMP','METS')`);
  }
}
