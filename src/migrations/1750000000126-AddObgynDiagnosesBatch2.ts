import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OBGYN coverage extension — diagnoses batch 2 of 3 (gynaecologic cancer, ovarian cysts &
 * masses, pelvic mass, endometriosis). Inserts 27 new diagnoses (several oncology codes
 * — 2C70.Z/2C71.Z/2C74.Z/2C73.x/2B58.1 — may already exist as shared SOC rows; ON CONFLICT
 * links OBGYN only). All ICD-11 codes verified via icd11_search (AUDIT_OBGYN.md 2D).
 * Runs after batch 1 (125).
 */
export class AddObgynDiagnosesBatch21750000000126 implements MigrationInterface {
  name = "AddObgynDiagnosesBatch21750000000126";

  private static readonly CODES = [
    "2C70.Z", "2C71.Z", "2C74.Z", "2C75.0", "2B58.1", "2C73.2", "2C73.1", "2C73.3", "2E66.2", "2E67.12",
    "2E67.0", "GA16.0", "JA02.0", "JA02.1", "2F76&XA90F8",
    "2F32.Y", "2F32.3", "GA18.1", "GA18.0", "GA10.B5", "GA32.0", "GA18.Y",
    "GA05.3", "GA17.2",
    "GA10.C2", "GA10.B2", "GA10.C1",
  ];

  private async linkMain(r: QueryRunner, mainDiag: string, codes: string[]): Promise<void> {
    await r.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'OBGYN' AND md.title = $1 AND d."icdCode" = ANY($2) ON CONFLICT DO NOTHING`, [mainDiag, codes]);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      ('2C70.Z','carcinoma of vulva','سرطانة الفرج','Malignant neoplasm of the vulva, usually squamous; managed by wide local excision or vulvectomy with groin node assessment.','ورم خبيث في الفرج، غالباً حرشفي؛ يُدار بالاستئصال الموضعي الواسع أو استئصال الفرج مع تقييم عقد الأربية.'),
      ('2C71.Z','carcinoma of vagina','سرطانة المهبل','Primary malignant neoplasm of the vagina; managed by surgery and/or chemoradiation depending on stage.','ورم خبيث أولي في المهبل؛ يُدار بالجراحة و/أو العلاج الكيميائي الإشعاعي حسب المرحلة.'),
      ('2C74.Z','carcinoma of fallopian tube','سرطانة قناة فالوب','Malignant neoplasm of the fallopian tube, often part of the tubo-ovarian cancer spectrum; managed by cytoreductive surgery.','ورم خبيث في قناة فالوب، غالباً ضمن طيف سرطان البوق والمبيض؛ يُدار بجراحة تصغير الورم.'),
      ('2C75.0','gestational choriocarcinoma','السرطانة المشيمائية الحملية','Malignant gestational trophoblastic neoplasm with rapid metastasis but high chemosensitivity; managed by chemotherapy.','ورم أرومة غاذية حملي خبيث سريع الانتقال لكنه عالي الاستجابة للعلاج الكيميائي؛ يُدار بالعلاج الكيميائي.'),
      ('2B58.1','leiomyosarcoma of uterus','الساركومة العضلية الملساء للرحم','Aggressive malignant smooth-muscle tumour of the uterus, sometimes presenting as a rapidly growing fibroid; managed by hysterectomy.','ورم خبيث عدواني للعضلات الملساء الرحمية، يتظاهر أحياناً كورم ليفي سريع النمو؛ يُدار باستئصال الرحم.'),
      ('2C73.2','granulosa cell malignant tumour of ovary','الورم الخبيث للخلايا الحُبيبية بالمبيض','Sex-cord stromal ovarian malignancy producing oestrogen; managed by surgical staging and resection.','ورم خبيث سدوي حبلي جنسي بالمبيض مُنتج للإستروجين؛ يُدار بالتدريج الجراحي والاستئصال.'),
      ('2C73.1','dysgerminoma of ovary','الورم المنتبذ (الديسجرمينوما) للمبيض','The commonest malignant ovarian germ cell tumour in young women; highly chemosensitive, managed with fertility-sparing surgery.','أشيع ورم خبيث للخلايا الجرثومية بالمبيض لدى الشابات؛ عالي الاستجابة للكيماوي، يُدار بجراحة حافظة للخصوبة.'),
      ('2C73.3','malignant (immature) teratoma of ovary','الورم المسخي الخبيث (غير الناضج) للمبيض','Malignant germ cell ovarian tumour containing immature tissue; managed by surgery and chemotherapy.','ورم خبيث للخلايا الجرثومية بالمبيض يحوي نسيجاً غير ناضج؛ يُدار بالجراحة والعلاج الكيميائي.'),
      ('2E66.2','high grade squamous intraepithelial lesion of cervix (CIN 2/3)','الآفة الحرشفية داخل الظهارة عالية الدرجة لعنق الرحم','High-grade cervical pre-cancer (CIN 2/3); treated by excision (LEEP/cone) to prevent invasive carcinoma.','سَلائف سرطانية عنقية عالية الدرجة؛ تُعالَج بالاستئصال (LEEP/المخروط) لمنع السرطانة الغازية.'),
      ('2E67.12','vulvar intraepithelial neoplasia','الورم داخل الظهارة الفرجي','Pre-invasive squamous lesion of the vulva; managed by local excision or topical therapy.','آفة حرشفية قبل غازية في الفرج؛ تُدار بالاستئصال الموضعي أو العلاج الموضعي.'),
      ('2E67.0','carcinoma in situ of endometrium','السرطانة اللابدة لبطانة الرحم','Endometrial intraepithelial neoplasia (atypical hyperplasia); managed by hysterectomy or progestins.','ورم داخل ظهارة بطانة الرحم (فرط تنسّج لانمطي)؛ يُدار باستئصال الرحم أو البروجستينات.'),
      ('GA16.0','endometrial hyperplasia','فرط تنسّج بطانة الرحم','Glandular proliferation of the endometrium; with atypia it is a precursor to endometrial carcinoma.','تكاثر غدّي لبطانة الرحم؛ مع اللانمطية يُعدّ سَلَفاً لسرطانة بطانة الرحم.'),
      ('JA02.0','complete hydatidiform mole','الرحى العدارية الكاملة','Complete molar pregnancy with diffuse trophoblastic proliferation; managed by suction evacuation and hCG follow-up.','حمل رحوي كامل مع تكاثر أرومة غاذية منتشر؛ يُدار بالإفراغ بالشفط ومتابعة موجهة الغدد المشيمية.'),
      ('JA02.1','incomplete or partial hydatidiform mole','الرحى العدارية الجزئية','Partial molar pregnancy with focal trophoblastic change and a fetus; managed by evacuation and hCG surveillance.','حمل رحوي جزئي مع تغيّر بؤري للأرومة الغاذية ووجود جنين؛ يُدار بالإفراغ ومراقبة موجهة الغدد المشيمية.'),
      ('2F76&XA90F8','invasive hydatidiform mole','الرحى العدارية الغازية','Molar pregnancy invading the myometrium (a gestational trophoblastic neoplasm); managed by chemotherapy.','حمل رحوي يغزو عضلة الرحم (ورم أرومة غاذية حملي)؛ يُدار بالعلاج الكيميائي.'),
      ('2F32.Y','mature cystic teratoma (dermoid cyst) of ovary','الورم المسخي الكيسي الناضج (الكيسة الجلدانية) للمبيض','Benign ovarian germ cell tumour containing mature tissue; the commonest ovarian neoplasm in young women, managed by cystectomy.','ورم حميد للخلايا الجرثومية بالمبيض يحوي نسيجاً ناضجاً؛ أشيع أورام المبيض لدى الشابات، يُدار باستئصال الكيسة.'),
      ('2F32.3','serous ovarian cystadenoma','الورم الغدّي الكيسي المصلي للمبيض','Benign epithelial ovarian cyst; managed by ovarian cystectomy or oophorectomy when symptomatic.','كيسة مبيضية ظهارية حميدة؛ تُدار باستئصال كيسة المبيض أو المبيض عند ظهور الأعراض.'),
      ('GA18.1','corpus luteum cyst','كيسة الجسم الأصفر','Functional ovarian cyst from the corpus luteum; may rupture or haemorrhage causing acute pain.','كيسة مبيضية وظيفية من الجسم الأصفر؛ قد تتمزّق أو تنزف مسبّبة ألماً حاداً.'),
      ('GA18.0','follicular cyst of ovary','الكيسة الجُريبية للمبيض','Functional ovarian cyst from a non-ruptured follicle; usually resolves spontaneously.','كيسة مبيضية وظيفية من جُريب غير متمزّق؛ تتراجع تلقائياً غالباً.'),
      ('GA10.B5','ovarian endometrioma (chocolate cyst)','بطانة الرحم المهاجرة المبيضية (الكيسة الشوكولاتية)','Endometriotic ovarian cyst filled with altered blood; managed by laparoscopic cystectomy.','كيسة مبيضية بطانية الرحم ممتلئة بدم متغيّر؛ تُدار باستئصال الكيسة بالمنظار.'),
      ('GA32.0','ovarian hyperstimulation syndrome','متلازمة فرط تنبيه المبيض','Iatrogenic ovarian enlargement with fluid shifts after ovulation induction; can be severe and life-threatening.','تضخّم مبيضي علاجي المنشأ مع انتقال السوائل بعد تحريض الإباضة؛ قد يكون شديداً ومهدّداً للحياة.'),
      ('GA18.Y','nontraumatic rupture of ovary (ruptured ovarian cyst)','تمزّق المبيض غير الرضحي (تمزّق كيسة المبيض)','Rupture of an ovarian cyst causing acute pelvic pain and possible haemoperitoneum; managed conservatively or surgically.','تمزّق كيسة مبيضية مسبّباً ألماً حوضياً حاداً واحتمال نزف بريتوني؛ يُدار تحفّظياً أو جراحياً.'),
      ('GA05.3','tubo-ovarian abscess','خراج البوق والمبيض','Inflammatory adnexal mass complicating pelvic inflammatory disease; managed by antibiotics and drainage or surgery.','كتلة ملحقية التهابية تعقّد مرض التهاب الحوض؛ تُدار بالمضادات الحيوية والتصريف أو الجراحة.'),
      ('GA17.2','hydrosalpinx','استسقاء البوق','Distally occluded, fluid-filled fallopian tube from prior infection; a cause of infertility, managed by salpingectomy.','قناة فالوب مسدودة بعيدياً وممتلئة بالسائل بسبب عدوى سابقة؛ سبب للعقم، تُدار باستئصال البوق.'),
      ('GA10.C2','endometriosis of pelvic peritoneum','بطانة الرحم المهاجرة في الصفاق الحوضي','Superficial peritoneal endometriotic implants causing pelvic pain and infertility; ablated or excised laparoscopically.','زرعات بطانية رحمية سطحية على الصفاق الحوضي تسبب ألماً حوضياً وعقماً؛ تُكوى أو تُستأصل بالمنظار.'),
      ('GA10.B2','endometriosis of rectovaginal septum or vagina','بطانة الرحم المهاجرة في الحاجز المستقيمي المهبلي أو المهبل','Deep infiltrating endometriosis of the rectovaginal septum causing dyspareunia and dyschezia; managed by excisional surgery.','بطانة رحم مهاجرة عميقة متسلّلة في الحاجز المستقيمي المهبلي تسبب عُسر الجماع والتغوّط؛ تُدار بالجراحة الاستئصالية.'),
      ('GA10.C1','endometriosis of intestine','بطانة الرحم المهاجرة المعوية','Bowel endometriosis (commonly rectosigmoid) causing cyclical GI symptoms; may require bowel resection.','بطانة رحم مهاجرة معوية (غالباً المستقيم السيني) تسبب أعراضاً هضمية دورية؛ قد تتطلّب استئصالاً معوياً.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'OBGYN' AND d."icdCode" = ANY($1) ON CONFLICT DO NOTHING`,
      [AddObgynDiagnosesBatch21750000000126.CODES]);

    await this.linkMain(queryRunner, "gynecologic cancer",
      ["2C70.Z", "2C71.Z", "2C74.Z", "2C75.0", "2B58.1", "2C73.2", "2C73.1", "2C73.3", "2E66.2", "2E67.12", "2E67.0", "GA16.0", "JA02.0", "JA02.1", "2F76&XA90F8"]);
    await this.linkMain(queryRunner, "ovarian cysts & masses",
      ["2F32.Y", "2F32.3", "GA18.1", "GA18.0", "GA10.B5", "GA32.0", "GA18.Y", "2C73.1", "2C73.2", "2C73.3"]);
    await this.linkMain(queryRunner, "pelvic mass", ["GA05.3", "GA17.2", "2F32.Y"]);
    await this.linkMain(queryRunner, "endometriosis", ["GA10.C2", "GA10.B2", "GA10.C1", "GA10.B5"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddObgynDiagnosesBatch21750000000126.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id WHERE dept.code = 'OBGYN')`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'OBGYN')`, [codes]);
    await queryRunner.query(`DELETE FROM "diagnoses" d WHERE d."icdCode" = ANY($1) AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = d.id)`, [codes]);
  }
}
