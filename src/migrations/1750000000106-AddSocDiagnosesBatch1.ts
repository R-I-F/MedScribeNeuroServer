import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * SOC coverage extension — batch 1 of 2 (categories 1-8: breast, colorectal, gastric,
 * head & neck, hepatocellular/liver, melanoma, metastatic disease, non-melanoma skin).
 * Inserts 22 new diagnoses and links 42 additions (22 new + 20 shared rows owned by
 * GS/PRS/ENT/HBP/ORTHO/NS/PEDSURG) to SOC + their main_diags.
 *
 * All ICD-11 codes verified via icd11_search (see MEDICAL_CODE_AUDITS/SOC/AUDIT_SOC.md,
 * "2D — Candidate diagnoses"). Shared codes already present are skipped by ON CONFLICT and
 * simply linked to SOC. Must run after MIG-A (104): the melanoma merge freed nothing new
 * here, but 2C30.Z is now SOC-linked.
 */
export class AddSocDiagnosesBatch11750000000106 implements MigrationInterface {
  name = "AddSocDiagnosesBatch11750000000106";

  private static readonly CODES = [
    // breast
    "2C61.1", "2E65.0", "2C62", "2C60", "2C6Y", "2C6Z",
    // colorectal
    "2B92.0", "2C00.3", "2B81.2", "2B91.Z", "2B92.1",
    // gastric
    "2B72.0", "2B72.1", "2B70.1", "2B71.Z", "2B70.00",
    // head & neck
    "2D10.1", "2D10.3", "2D10.4", "2C23.Z", "2B6B.1", "2B62.0", "2B60.1", "2B68.Z",
    // liver
    "2C12.00", "2C12.01", "2C12.10", "2B56.3",
    // melanoma
    "2C30.0", "2C30.1", "2C30.2", "2E63.0Z", "2C30.Y",
    // metastatic
    "2D80.0", "2E03", "2D50", "2D70", "2D4Z",
    // non-melanoma skin
    "2C35", "2E64.0Z", "2C34", "2C33",
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
      ('2C62','inflammatory carcinoma of breast','السرطانة الالتهابية للثدي','Aggressive breast cancer presenting with diffuse erythema and peau d''orange from dermal lymphatic invasion; treated with neoadjuvant chemotherapy then mastectomy.','سرطان ثدي عدواني يتظاهر باحمرار منتشر وقشرة برتقالية نتيجة غزو لمفاويات الأدمة؛ يُعالَج بالعلاج الكيميائي قبل الجراحة ثم استئصال الثدي.'),
      ('2C60','carcinoma of breast, specialised type','سرطانة الثدي من النوع المتخصص','Special-type invasive breast carcinoma (tubular, mucinous, cribriform), generally lower grade with better prognosis; treated by breast-conserving surgery or mastectomy.','سرطانة ثدي غازية من نوع متخصص (أنبوبي، مخاطي، غربالي)، غالباً أقل درجة وأفضل إنذاراً؛ تُعالَج بجراحة محافظة على الثدي أو استئصاله.'),
      ('2C6Y','Paget disease of breast','داء باجيت في الثدي','Eczematous change of the nipple-areola complex overlying an underlying ductal carcinoma; managed by central excision or mastectomy with axillary staging.','تغيّر إكزيمي في معقد الحلمة والهالة فوق سرطانة قنوية كامنة؛ يُدار باستئصال مركزي أو استئصال الثدي مع تحديد مرحلة الإبط.'),
      ('2C6Z','malignant neoplasm of breast, unspecified','ورم خبيث في الثدي غير محدد','Breast cancer not otherwise specified, including locally advanced disease; staged and treated by multimodal therapy with surgical resection.','سرطان ثدي غير محدد بخلاف ذلك، بما يشمل المرض الموضعي المتقدم؛ يُحدَّد مرحلته ويُعالَج بعلاج متعدد الوسائط مع الاستئصال الجراحي.'),
      ('2B92.1','neuroendocrine neoplasm of rectum','ورم عصبي صمّي في المستقيم','Rectal neuroendocrine (carcinoid) tumour, often found at endoscopy; small lesions removed endoscopically, larger or higher-grade by radical resection.','ورم عصبي صمّي (سرطاوي) في المستقيم، يُكتشف غالباً بالتنظير؛ تُزال الآفات الصغيرة بالتنظير والأكبر أو الأعلى درجة بالاستئصال الجذري.'),
      ('2B72.0','adenocarcinoma of stomach','السرطانة الغدية للمعدة','The dominant gastric malignancy (intestinal or diffuse type); resected by subtotal or total gastrectomy with D2 lymphadenectomy.','الورم الخبيث الغالب في المعدة (النوع المعوي أو المنتشر)؛ يُستأصل بقطع المعدة الجزئي أو الكلي مع استئصال العقد اللمفية D2.'),
      ('2B72.1','malignant neuroendocrine neoplasm of stomach','الورم العصبي الصمّي الخبيث للمعدة','Gastric neuroendocrine tumour (types 1-3) ranging from indolent to aggressive; managed by endoscopic resection or gastrectomy by type and grade.','ورم عصبي صمّي معدي (الأنواع 1-3) يتراوح من خامل إلى عدواني؛ يُدار بالاستئصال التنظيري أو قطع المعدة حسب النوع والدرجة.'),
      ('2B70.1','squamous cell carcinoma of oesophagus','سرطانة الخلايا الحرشفية للمريء','The commonest oesophageal cancer worldwide, typically of the upper/mid oesophagus; treated by chemoradiotherapy and oesophagectomy.','أشيع سرطان مريئي عالمياً، يصيب عادةً المريء العلوي/الأوسط؛ يُعالَج بالعلاج الكيميائي الإشعاعي واستئصال المريء.'),
      ('2B71.Z','malignant neoplasm of oesophagogastric junction','ورم خبيث في الوصل المريئي المعدي','Adenocarcinoma of the oesophagogastric junction (Siewert classification) straddling the cardia; resected by oesophagectomy or extended gastrectomy.','سرطانة غدية في الوصل المريئي المعدي (تصنيف سيويرت) تمتد حول الفؤاد؛ تُستأصل باستئصال المريء أو قطع معدة موسّع.'),
      ('2B70.00','Barrett adenocarcinoma of oesophagus','السرطانة الغدية للمريء على خلفية باريت','Adenocarcinoma of the distal oesophagus arising in Barrett metaplasia, linked to chronic reflux; treated by endoscopic resection (early) or oesophagectomy.','سرطانة غدية في المريء البعيد تنشأ في حؤول باريت، مرتبطة بالجزر المزمن؛ تُعالَج بالاستئصال التنظيري (المبكر) أو استئصال المريء.'),
      ('2B62.0','squamous cell carcinoma of tongue','سرطانة الخلايا الحرشفية للسان','Squamous cell carcinoma of the oral tongue, a common head-and-neck cancer; treated by wide local excision (glossectomy) with neck dissection and reconstruction.','سرطانة الخلايا الحرشفية للسان الفموي، سرطان شائع في الرأس والعنق؛ يُعالَج بالاستئصال الموضعي الواسع (استئصال اللسان) مع تجريف العنق والترميم.'),
      ('2B60.1','squamous cell carcinoma of lip','سرطانة الخلايا الحرشفية للشفة','Squamous cell carcinoma of the lip, usually the lower lip in sun-exposed patients; excised with wedge or larger resection and reconstruction.','سرطانة الخلايا الحرشفية للشفة، عادةً الشفة السفلى لدى المعرّضين للشمس؛ تُستأصل باستئصال إسفيني أو أوسع مع الترميم.'),
      ('2B68.Z','malignant neoplasm of salivary gland','ورم خبيث في الغدة اللعابية','Malignant salivary-gland tumour (eg mucoepidermoid or adenoid cystic carcinoma) of the parotid or submandibular gland; treated by gland excision with facial-nerve preservation.','ورم خبيث في الغدة اللعابية (مثل السرطانة المخاطية البشروية أو الكيسية الغدّانية) في الغدة النكفية أو تحت الفك؛ يُعالَج باستئصال الغدة مع الحفاظ على العصب الوجهي.'),
      ('2C12.00','combined hepatocellular-cholangiocarcinoma','السرطانة المختلطة الكبدية-الأقنية الصفراوية','Primary liver cancer with both hepatocellular and cholangiocellular differentiation; aggressive, managed by hepatic resection where feasible.','سرطان كبد أولي ذو تمايز خلوي كبدي وقنوي صفراوي معاً؛ عدواني، يُدار بالاستئصال الكبدي حيثما أمكن.'),
      ('2C12.01','hepatoblastoma','الورم الأرومي الكبدي','The commonest primary liver malignancy of childhood, presenting with an abdominal mass and raised alpha-fetoprotein; treated by chemotherapy and hepatectomy.','أشيع ورم كبدي أولي خبيث في الطفولة، يتظاهر بكتلة بطنية وارتفاع البروتين الجنيني ألفا؛ يُعالَج بالعلاج الكيميائي واستئصال الكبد.'),
      ('2C12.10','intrahepatic cholangiocarcinoma','سرطانة الأقنية الصفراوية داخل الكبد','Adenocarcinoma arising from the intrahepatic bile ducts, presenting as a liver mass; treated by major hepatic resection.','سرطانة غدية تنشأ من الأقنية الصفراوية داخل الكبد، تتظاهر بكتلة كبدية؛ تُعالَج باستئصال كبدي كبير.'),
      ('2B56.3','angiosarcoma of liver','الساركوما الوعائية للكبد','A rare aggressive malignant vascular tumour of the liver linked to vinyl chloride/thorotrast exposure; resected when localised.','ورم وعائي خبيث نادر وعدواني في الكبد مرتبط بالتعرّض لكلوريد الفينيل/الثوروتراست؛ يُستأصل عند توضّعه.'),
      ('2C30.0','superficial spreading melanoma','الورم الميلانيني السطحي المنتشر','The commonest melanoma subtype, with a horizontal growth phase and irregular pigmented macule; treated by wide local excision with sentinel-node biopsy.','أشيع أنماط الورم الميلانيني، بطور نمو أفقي ولطخة مصطبغة غير منتظمة؛ يُعالَج بالاستئصال الموضعي الواسع مع خزعة العقدة الخافرة.'),
      ('2C30.1','nodular melanoma','الورم الميلانيني العقدي','An aggressive vertically-growing melanoma presenting as a rapidly enlarging nodule; wide excision with sentinel-node biopsy and staging.','ورم ميلانيني عدواني ذو نمو عمودي يتظاهر بعقيدة سريعة التضخّم؛ استئصال واسع مع خزعة العقدة الخافرة وتحديد المرحلة.'),
      ('2C30.2','lentigo maligna melanoma','الورم الميلانيني العدسي الخبيث','Melanoma arising in lentigo maligna on chronically sun-damaged skin of the elderly; excised with wide margins.','ورم ميلانيني ينشأ في النمش الخبيث على جلد مزمن التضرر الشمسي لدى المسنّين؛ يُستأصل بهوامش واسعة.'),
      ('2E63.0Z','melanoma in situ of skin','الورم الميلانيني اللابد للجلد','Intraepidermal melanoma confined above the basement membrane (in situ), without invasion; cured by complete excision with clear margins.','ورم ميلانيني داخل البشرة محصور فوق الغشاء القاعدي (لابد) دون غزو؛ يُشفى بالاستئصال الكامل بهوامش سليمة.'),
      ('2C30.Y','desmoplastic melanoma','الورم الميلانيني المتليّف','A rare spindle-cell melanoma variant with desmoplastic stroma and neurotropism, prone to local recurrence; wide excision with close surveillance.','نمط نادر من الورم الميلانيني مغزلي الخلايا مع سدى متليّف وميل عصبي، عرضة للنكس الموضعي؛ استئصال واسع مع مراقبة لصيقة.'),
      ('2D70','malignant neoplasm metastasis in lung','ورم خبيث نقيلي في الرئة','Pulmonary metastases from a distant primary (eg colorectal, sarcoma, renal); selected oligometastatic disease treated by metastasectomy.','نقائل رئوية من ورم أولي بعيد (مثل القولون والمستقيم أو الساركوما أو الكلية)؛ يُعالَج المرض قليل النقائل المنتقى باستئصال النقائل.'),
      ('2D4Z','cancer of unknown primary','السرطان مجهول المنشأ الأولي','Metastatic malignancy with no identifiable primary site after work-up; managed by site-directed or empirical therapy with surgical biopsy for diagnosis.','ورم خبيث نقيلي دون موضع أولي محدد بعد الاستقصاء؛ يُدار بعلاج موجّه للموقع أو تجريبي مع خزعة جراحية للتشخيص.'),
      ('2C34','Merkel cell carcinoma','سرطانة خلايا ميركل','An aggressive cutaneous neuroendocrine carcinoma in sun-exposed skin of the elderly, often Merkel-cell-polyomavirus driven; wide excision with sentinel-node biopsy and radiotherapy.','سرطانة عصبية صمّية جلدية عدوانية في الجلد المعرّض للشمس لدى المسنّين، غالباً مدفوعة بفيروس بوليوما خلايا ميركل؛ استئصال واسع مع خزعة العقدة الخافرة والمعالجة الإشعاعية.'),
      ('2C33','adnexal carcinoma of skin','سرطانة ملحقات الجلد','Malignant tumour of cutaneous adnexa (sweat-gland or sebaceous carcinoma); treated by wide local excision.','ورم خبيث في ملحقات الجلد (سرطانة الغدد العرقية أو الدهنية)؛ يُعالَج بالاستئصال الموضعي الواسع.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'SOC' AND d."icdCode" = ANY($1) ON CONFLICT DO NOTHING`,
      [AddSocDiagnosesBatch11750000000106.CODES]);

    await this.linkMain(queryRunner, "breast cancer", ["2C61.1", "2E65.0", "2C62", "2C60", "2C6Y", "2C6Z"]);
    await this.linkMain(queryRunner, "colorectal cancer", ["2B92.0", "2C00.3", "2B81.2", "2B91.Z", "2B92.1"]);
    await this.linkMain(queryRunner, "gastric cancer", ["2B72.0", "2B72.1", "2B70.1", "2B71.Z", "2B70.00"]);
    await this.linkMain(queryRunner, "head & neck cancer", ["2D10.1", "2D10.3", "2D10.4", "2C23.Z", "2B6B.1", "2B62.0", "2B60.1", "2B68.Z"]);
    await this.linkMain(queryRunner, "hepatocellular carcinoma", ["2C12.00", "2C12.01", "2C12.10", "2B56.3"]);
    await this.linkMain(queryRunner, "melanoma", ["2C30.0", "2C30.1", "2C30.2", "2E63.0Z", "2C30.Y"]);
    await this.linkMain(queryRunner, "metastatic disease", ["2D80.0", "2E03", "2D50", "2D70", "2D4Z"]);
    await this.linkMain(queryRunner, "non-melanoma skin cancer", ["2C35", "2E64.0Z", "2C34", "2C33"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddSocDiagnosesBatch11750000000106.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id WHERE dept.code = 'SOC')`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'SOC')`, [codes]);
    // Delete only SOC-introduced rows; shared rows (still linked to another dept) are preserved.
    await queryRunner.query(
      `DELETE FROM "diagnoses" d WHERE d."icdCode" = ANY($1)
         AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = d.id)`, [codes]);
  }
}
