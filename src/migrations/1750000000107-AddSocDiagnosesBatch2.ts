import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * SOC coverage extension — batch 2 of 2 (categories 9-16: ovarian, pancreatic, soft tissue
 * sarcoma, surgical lymphoma, genitourinary [new], endocrine & adrenal [new], gynaecological
 * [new], biliary tract & gallbladder [new]). Inserts 20 new diagnoses and links 34 additions
 * (20 new + 14 shared rows owned by GS/HBP/PEDSURG/UROL/NS) to SOC + their main_diags.
 *
 * Must run after MIG-A (104), which freed 2C90.0 (→RCC) and 2C73.1 (→dysgerminoma) and
 * merged the old 2C77.0 melanoma row away (→cervix SCC). All codes verified via icd11_search;
 * dual-linked rows (2C16.0 pancreatic+biliary, 2C12.10 liver+biliary, 2D10.4 head&neck+endocrine)
 * appear once and are linked into both categories. See MEDICAL_CODE_AUDITS/SOC/AUDIT_SOC.md.
 */
export class AddSocDiagnosesBatch21750000000107 implements MigrationInterface {
  name = "AddSocDiagnosesBatch21750000000107";

  private static readonly CODES = [
    // ovarian
    "2C73.02", "2C73.01", "2C73.00", "2C73.2", "2C73.1",
    // pancreatic
    "2C16.0", "2B80.00", "2C10.Y",
    // soft tissue sarcoma
    "2B55.Z", "2B5B.Z", "2B59.Z", "2B5A.0",
    // surgical lymphoma
    "2A85.6", "2A80.Z", "2A85.1", "2A85.5",
    // genitourinary
    "2C90.0", "2C82.0", "2C80.2", "2C90.Y", "2C81.0",
    // endocrine & adrenal
    "2D11.1", "2D12.Z", "2D12.Y", "2D10.4",
    // gynaecological
    "2C77.0", "2C76.3", "2C70.2", "2C71.2", "2C75.0",
    // biliary tract & gallbladder
    "2C18.0", "2C17.0", "2C12.10", "2C13.Z",
  ];

  private async linkMain(r: QueryRunner, mainDiag: string, codes: string[]): Promise<void> {
    await r.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md
       JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'SOC' AND md.title = $1 AND d."icdCode" = ANY($2)
       ON CONFLICT DO NOTHING`, [mainDiag, codes]);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      ('2C73.02','low grade serous adenocarcinoma of ovary','السرطانة الغدية المصلية منخفضة الدرجة في المبيض','Low-grade serous ovarian carcinoma with indolent behaviour and relative chemoresistance; treated by cytoreductive surgery.','سرطانة مبيضية مصلية منخفضة الدرجة ذات سلوك خامل ومقاومة نسبية للعلاج الكيميائي؛ تُعالَج بالجراحة الحاطّة للورم.'),
      ('2C73.01','endometrioid adenocarcinoma of ovary','السرطانة الغدية البطانية الرحمية في المبيض','Endometrioid ovarian carcinoma, often associated with endometriosis and a synchronous endometrial cancer; treated by surgical staging and debulking.','سرطانة مبيضية بطانية رحمية، ترتبط غالباً بالانتباذ البطاني الرحمي وسرطان بطانة رحم متزامن؛ تُعالَج بالتحديد الجراحي للمرحلة وحطّ الورم.'),
      ('2C73.00','clear cell adenocarcinoma of ovary','السرطانة الغدية صافية الخلايا في المبيض','Clear cell ovarian carcinoma, linked to endometriosis with a poorer prognosis and chemoresistance; treated by cytoreductive surgery.','سرطانة مبيضية صافية الخلايا مرتبطة بالانتباذ البطاني الرحمي بإنذار أسوأ ومقاومة للعلاج الكيميائي؛ تُعالَج بالجراحة الحاطّة للورم.'),
      ('2C73.2','granulosa cell malignant tumour of ovary','الورم الخبيث للخلايا الحبيبية في المبيض','A malignant sex-cord stromal ovarian tumour secreting oestrogen and presenting with abnormal bleeding; treated by surgical resection with long-term follow-up.','ورم سدوي حبلي جنسي خبيث في المبيض يفرز الإستروجين ويتظاهر بنزف شاذ؛ يُعالَج بالاستئصال الجراحي مع متابعة طويلة الأمد.'),
      ('2C73.1','dysgerminoma of ovary','الورم المنتبذ (الديسجيرمينوما) في المبيض','The commonest malignant ovarian germ-cell tumour of young women, highly chemosensitive; treated by fertility-sparing surgery and chemotherapy.','أشيع ورم خبيث في الخلايا الجنسية للمبيض لدى الشابات، شديد الحساسية للعلاج الكيميائي؛ يُعالَج بجراحة حافظة للخصوبة وعلاج كيميائي.'),
      ('2B59.Z','liposarcoma','الساركوما الشحمية','The commonest soft-tissue sarcoma in adults (well-differentiated to dedifferentiated/myxoid), often retroperitoneal or in the limb; treated by wide en-bloc resection.','أشيع ساركوما للأنسجة الرخوة لدى البالغين (من جيدة التمايز إلى منزوعة التمايز/مخاطية)، غالباً خلف الصفاق أو في الطرف؛ تُعالَج بالاستئصال الكتلي الواسع.'),
      ('2B5A.0','synovial sarcoma','الساركوما الزليلية','An aggressive soft-tissue sarcoma of young adults, typically near joints of the extremity, with SS18 translocation; treated by wide excision and radiotherapy.','ساركوما أنسجة رخوة عدوانية لدى البالغين الشباب، تظهر عادةً قرب مفاصل الأطراف، مع انتقال جيني SS18؛ تُعالَج بالاستئصال الواسع والمعالجة الإشعاعية.'),
      ('2A80.Z','follicular lymphoma','اللمفوما الجريبية','The commonest indolent non-Hodgkin lymphoma; usually nodal and incurable but slow-growing, with surgery mainly for diagnostic excisional biopsy.','أشيع لمفوما لا هودجكينية خاملة؛ عقدية عادةً وغير قابلة للشفاء لكنها بطيئة النمو، ودور الجراحة أساساً للخزعة الاستئصالية التشخيصية.'),
      ('2A85.1','extranodal marginal zone (MALT) lymphoma','لمفوما المنطقة الهامشية خارج العقد (مالت)','Indolent B-cell lymphoma of mucosa-associated lymphoid tissue (commonly gastric, H. pylori-associated); gastric disease often regresses with eradication therapy.','لمفوما خلايا بائية خاملة في النسيج اللمفاوي المرتبط بالغشاء المخاطي (معدية شائعاً ومرتبطة بالملوية البوابية)؛ غالباً ما يتراجع المرض المعدي بعلاج الاستئصال الجرثومي.'),
      ('2A85.5','mantle cell lymphoma','لمفوما الخلايا الوشاحية','An aggressive B-cell non-Hodgkin lymphoma with t(11;14)/cyclin D1 overexpression, often with GI involvement (lymphomatous polyposis); diagnosed by excisional/endoscopic biopsy.','لمفوما لا هودجكينية بائية عدوانية مع انتقال t(11;14) وفرط تعبير سيكلين D1، غالباً بإصابة هضمية (داء البوليبات اللمفومي)؛ تُشخَّص بالخزعة الاستئصالية/التنظيرية.'),
      ('2C90.0','renal cell carcinoma','سرطانة الخلايا الكلوية','The commonest kidney cancer in adults (clear-cell and other subtypes), often found incidentally; treated by partial or radical nephrectomy.','أشيع سرطان كلوي لدى البالغين (صافي الخلايا وأنماط أخرى)، يُكتشف غالباً عرضياً؛ يُعالَج باستئصال كلية جزئي أو جذري.'),
      ('2C81.0','squamous cell carcinoma of penis','سرطانة الخلايا الحرشفية للقضيب','Penile squamous cell carcinoma, HPV-related or from chronic inflammation; treated by penis-sparing excision or partial/total penectomy with inguinal staging.','سرطانة حرشفية قضيبية، مرتبطة بفيروس الورم الحليمي أو بالتهاب مزمن؛ تُعالَج باستئصال حافظ للقضيب أو استئصال قضيبي جزئي/كلي مع تحديد مرحلة العقد الإربية.'),
      ('2D11.1','malignant phaeochromocytoma of adrenal gland','ورم القواتم الخبيث للغدة الكظرية','A catecholamine-secreting malignant adrenal medullary tumour causing paroxysmal hypertension; resected by adrenalectomy after alpha-blockade.','ورم خبيث في لب الكظر يفرز الكاتيكولامينات مسبباً ارتفاع ضغط نوبياً؛ يُستأصل باستئصال الكظر بعد الحصار الألفي.'),
      ('2D12.Z','parathyroid carcinoma','سرطانة الغدة جار الدرقية','A rare cause of severe primary hyperparathyroidism with a palpable neck mass and very high calcium; treated by en-bloc resection with the ipsilateral thyroid lobe.','سبب نادر لفرط نشاط جارات الدرق الأولي الشديد مع كتلة عنقية مجسوسة وارتفاع كالسيوم شديد؛ تُعالَج بالاستئصال الكتلي مع فص الدرق المماثل.'),
      ('2C77.0','squamous cell carcinoma of cervix uteri','سرطانة الخلايا الحرشفية لعنق الرحم','The commonest cervical cancer, HPV-driven; treated by radical hysterectomy and/or chemoradiotherapy by stage.','أشيع سرطان عنق الرحم، مدفوع بفيروس الورم الحليمي؛ يُعالَج باستئصال رحم جذري و/أو علاج كيميائي إشعاعي حسب المرحلة.'),
      ('2C76.3','endometrial serous adenocarcinoma','السرطانة الغدية المصلية لبطانة الرحم','An aggressive type-2 endometrial carcinoma (high grade, p53-abnormal) prone to extrauterine spread; treated by hysterectomy, staging and adjuvant therapy.','سرطانة بطانة رحم عدوانية من النوع الثاني (عالية الدرجة، شذوذ p53) عرضة للانتشار خارج الرحم؛ تُعالَج باستئصال الرحم وتحديد المرحلة والعلاج المساعد.'),
      ('2C70.2','squamous cell carcinoma of vulva','سرطانة الخلايا الحرشفية للفرج','The commonest vulvar cancer, HPV-related or from lichen sclerosus; treated by wide local excision or vulvectomy with inguinofemoral node assessment.','أشيع سرطان فرجي، مرتبط بفيروس الورم الحليمي أو بالحزاز المتصلب؛ يُعالَج بالاستئصال الموضعي الواسع أو استئصال الفرج مع تقييم العقد الإربية الفخذية.'),
      ('2C71.2','squamous cell carcinoma of vagina','سرطانة الخلايا الحرشفية للمهبل','A rare HPV-associated vaginal malignancy; treated by chemoradiotherapy or surgical resection by stage and location.','ورم مهبلي خبيث نادر مرتبط بفيروس الورم الحليمي؛ يُعالَج بالعلاج الكيميائي الإشعاعي أو الاستئصال الجراحي حسب المرحلة والموقع.'),
      ('2C75.0','gestational choriocarcinoma','السرطانة المشيمائية الحملية','A malignant gestational trophoblastic neoplasm following molar pregnancy, abortion or term delivery, with markedly raised beta-hCG; highly chemosensitive.','ورم أرومي غاذي حملي خبيث يلي الحمل العنقودي أو الإجهاض أو الولادة، مع ارتفاع شديد في موجهة الغدد التناسلية المشيمائية بيتا؛ شديد الحساسية للعلاج الكيميائي.'),
      ('2C13.Z','malignant neoplasm of gallbladder','ورم خبيث في المرارة','Gallbladder cancer, frequently discovered incidentally after cholecystectomy; treated by radical (extended) cholecystectomy with liver-bed and nodal clearance.','سرطان المرارة، يُكتشف غالباً عرضياً بعد استئصال المرارة؛ يُعالَج باستئصال مرارة جذري (موسّع) مع إزالة سرير الكبد والعقد.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'SOC' AND d."icdCode" = ANY($1) ON CONFLICT DO NOTHING`,
      [AddSocDiagnosesBatch21750000000107.CODES]);

    await this.linkMain(queryRunner, "ovarian cancer", ["2C73.02", "2C73.01", "2C73.00", "2C73.2", "2C73.1"]);
    await this.linkMain(queryRunner, "pancreatic cancer", ["2C16.0", "2B80.00", "2C10.Y"]);
    await this.linkMain(queryRunner, "soft tissue sarcoma", ["2B55.Z", "2B5B.Z", "2B59.Z", "2B5A.0"]);
    await this.linkMain(queryRunner, "surgical lymphoma", ["2A85.6", "2A80.Z", "2A85.1", "2A85.5"]);
    await this.linkMain(queryRunner, "genitourinary cancer", ["2C90.0", "2C82.0", "2C80.2", "2C90.Y", "2C81.0"]);
    await this.linkMain(queryRunner, "endocrine & adrenal tumours", ["2D11.1", "2D12.Z", "2D12.Y", "2D10.4"]);
    await this.linkMain(queryRunner, "gynaecological cancer", ["2C77.0", "2C76.3", "2C70.2", "2C71.2", "2C75.0"]);
    await this.linkMain(queryRunner, "biliary tract & gallbladder cancer", ["2C18.0", "2C17.0", "2C16.0", "2C12.10", "2C13.Z"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddSocDiagnosesBatch21750000000107.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id WHERE dept.code = 'SOC')`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'SOC')`, [codes]);
    await queryRunner.query(
      `DELETE FROM "diagnoses" d WHERE d."icdCode" = ANY($1)
         AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = d.id)`, [codes]);
  }
}
