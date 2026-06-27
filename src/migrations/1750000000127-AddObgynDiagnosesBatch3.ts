import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OBGYN coverage extension — diagnoses batch 3 of 3 (uterine fibroids/AUB, uterine prolapse,
 * stress urinary incontinence). Inserts 16 new diagnoses. GA15.0 (polyp of cervix) reuses a
 * code freed by MIG-A (124) to its correct WHO meaning. All ICD-11 codes verified via
 * icd11_search (AUDIT_OBGYN.md 2D). Runs after batch 2 (126).
 */
export class AddObgynDiagnosesBatch31750000000127 implements MigrationInterface {
  name = "AddObgynDiagnosesBatch31750000000127";

  private static readonly CODES = [
    "GA16.Y", "GA20.50", "GA2Z", "GA15.0", "GA16.2",
    "GC40.0Z", "GC40.1Z", "GC40.2Z", "GC71", "GC04.16", "GC40.Z", "GC40.34",
    "MF50.21", "GC50.0", "MF50.22", "GC40.50",
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
      ('GA16.Y','endometrial polyp','سَليلة بطانة الرحم','Localised overgrowth of the endometrium causing abnormal bleeding; removed by hysteroscopic polypectomy.','فرط نمو موضعي لبطانة الرحم يسبب نزفاً شاذاً؛ يُزال بالاستئصال التنظيري للسَّليلة.'),
      ('GA20.50','heavy menstrual bleeding (menorrhagia)','النزف الطمثي الغزير','Excessive menstrual blood loss impairing quality of life; managed medically or by ablation/hysterectomy.','فقد دموي طمثي مفرط يضرّ بجودة الحياة؛ يُدار طبياً أو بالكي/استئصال الرحم.'),
      ('GA2Z','abnormal uterine bleeding','النزف الرحمي الشاذ','Abnormal uterine or vaginal bleeding of structural or non-structural cause; investigated by ultrasound and biopsy.','نزف رحمي أو مهبلي شاذ ذو سبب بنيوي أو غير بنيوي؛ يُستقصى بالموجات فوق الصوتية والخزعة.'),
      ('GA15.0','polyp of cervix uteri','سَليلة عنق الرحم','Benign growth of the endocervix causing bleeding or discharge; removed by simple polypectomy.','نمو حميد لباطن عنق الرحم يسبب نزفاً أو إفرازاً؛ يُزال باستئصال بسيط للسَّليلة.'),
      ('GA16.2','intrauterine synechiae (Asherman syndrome)','الالتصاقات داخل الرحم (متلازمة آشرمان)','Intrauterine adhesions usually following curettage, causing amenorrhoea and infertility; treated by hysteroscopic adhesiolysis.','التصاقات داخل الرحم غالباً بعد الكشط، تسبب انقطاع الطمث والعقم؛ تُعالَج بتحرير الالتصاقات بالمنظار.'),
      ('GC40.0Z','cystocele (prolapse of anterior vaginal wall)','القيلة المثانية (هبوط الجدار المهبلي الأمامي)','Descent of the bladder into the anterior vaginal wall; repaired by anterior colporrhaphy.','نزول المثانة إلى الجدار المهبلي الأمامي؛ يُصلَح برأب المهبل الأمامي.'),
      ('GC40.1Z','rectocele (prolapse of posterior vaginal wall)','القيلة المستقيمية (هبوط الجدار المهبلي الخلفي)','Herniation of the rectum into the posterior vaginal wall; repaired by posterior colporrhaphy.','فتق المستقيم إلى الجدار المهبلي الخلفي؛ يُصلَح برأب المهبل الخلفي.'),
      ('GC40.2Z','enterocele / prolapse of vaginal apex','القيلة المعوية / هبوط قمّة المهبل','Herniation of small bowel into the vaginal apex; repaired by enterocele repair or apical suspension.','فتق الأمعاء الدقيقة إلى قمّة المهبل؛ يُصلَح بإصلاح القيلة المعوية أو التعليق القمّي.'),
      ('GC71','prolapse of vaginal vault after hysterectomy','هبوط قبّة المهبل بعد استئصال الرحم','Apical prolapse of the vaginal vault following hysterectomy; repaired by sacrocolpopexy or sacrospinous fixation.','هبوط قمّي لقبّة المهبل بعد استئصال الرحم؛ يُصلَح بالتثبيت العجزي المهبلي أو الشوكي العجزي.'),
      ('GC04.16','rectovaginal fistula','الناسور المستقيمي المهبلي','Abnormal communication between the rectum and vagina from obstetric injury, surgery or disease; repaired surgically.','اتصال شاذ بين المستقيم والمهبل بسبب إصابة ولادية أو جراحة أو مرض؛ يُصلَح جراحياً.'),
      ('GC40.Z','pelvic organ prolapse, unspecified','هبوط أعضاء الحوض غير المحدّد','Descent of pelvic organs through the vagina due to pelvic floor weakness; managed by pessary or reconstructive surgery.','نزول أعضاء الحوض عبر المهبل بسبب ضعف قاع الحوض؛ يُدار بالفرزجة أو الجراحة الترميمية.'),
      ('GC40.34','complete uterovaginal prolapse (procidentia)','هبوط الرحم والمهبل التام (السقوط)','Total procidentia with the uterus prolapsing outside the introitus; managed by vaginal hysterectomy with apical support.','سقوط تام للرحم خارج فتحة المهبل؛ يُدار باستئصال الرحم المهبلي مع دعم قمّي.'),
      ('MF50.21','urge urinary incontinence','سلس البول الإلحاحي','Involuntary urine loss with urgency from detrusor overactivity; managed by behavioural therapy and antimuscarinics.','فقد لا إرادي للبول مع إلحاح بسبب فرط نشاط العضلة الدافعة؛ يُدار بالعلاج السلوكي ومضادات المسكارين.'),
      ('GC50.0','overactive bladder','المثانة المفرطة النشاط','Urinary urgency with frequency and nocturia, with or without incontinence; managed medically or by neuromodulation.','إلحاح بولي مع تكرّر وتبوّل ليلي، بسلس أو دونه؛ يُدار طبياً أو بالتعديل العصبي.'),
      ('MF50.22','mixed urinary incontinence','سلس البول المختلط','Combination of stress and urge urinary incontinence; managed by combined behavioural, medical and surgical measures.','مزيج من السلس الجهدي والإلحاحي؛ يُدار بتدابير سلوكية ودوائية وجراحية مشتركة.'),
      ('GC40.50','stress incontinence associated with pelvic organ prolapse','سلس البول الجهدي المصاحب لهبوط أعضاء الحوض','Stress urinary incontinence occurring with pelvic organ prolapse; addressed at prolapse repair with a continence procedure.','سلس بول جهدي يحدث مع هبوط أعضاء الحوض؛ يُعالَج عند إصلاح الهبوط مع إجراء للتحكّم البولي.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'OBGYN' AND d."icdCode" = ANY($1) ON CONFLICT DO NOTHING`,
      [AddObgynDiagnosesBatch31750000000127.CODES]);

    await this.linkMain(queryRunner, "uterine fibroids", ["GA16.Y", "GA20.50", "GA2Z", "GA15.0", "GA16.2"]);
    await this.linkMain(queryRunner, "uterine prolapse",
      ["GC40.0Z", "GC40.1Z", "GC40.2Z", "GC71", "GC04.16", "GC40.Z", "GC40.34"]);
    await this.linkMain(queryRunner, "stress urinary incontinence", ["MF50.21", "GC50.0", "MF50.22", "GC40.50"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddObgynDiagnosesBatch31750000000127.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id WHERE dept.code = 'OBGYN')`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'OBGYN')`, [codes]);
    await queryRunner.query(`DELETE FROM "diagnoses" d WHERE d."icdCode" = ANY($1) AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = d.id)`, [codes]);
  }
}
