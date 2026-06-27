import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ENT audit — MIG-D batch 3 of 3: head & neck cancer / thyroid & parathyroid / salivary gland
 * diagnoses (21 rows). Many onco/thyroid rows are shared (SOC/MFS/GS-owned) — INSERT
 * ON CONFLICT("icdCode") DO NOTHING then link ENT. 2B67.Z (parotid ca) dual-linked to
 * "head & neck cancer" + "salivary gland disease".
 */
export class AddEntDiagnosesBatch3750000000135 implements MigrationInterface {
  name = "AddEntDiagnosesBatch3750000000135";

  private async add(r: QueryRunner, code: string, en: string, ar: string, enD: string, arD: string, mds: string[]): Promise<void> {
    await r.query(
      `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("icdCode") DO NOTHING`, [code, en, ar, enD, arD]);
    await r.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'ENT' AND d."icdCode" = $1 ON CONFLICT DO NOTHING`, [code]);
    for (const md of mds) {
      await r.query(
        `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
         SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
         CROSS JOIN "diagnoses" d
         WHERE dept.code = 'ENT' AND md.title = $2 AND d."icdCode" = $1 ON CONFLICT DO NOTHING`, [code, md]);
    }
  }

  private async remove(r: QueryRunner, code: string): Promise<void> {
    await r.query(
      `DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
         AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'ENT')`, [code]);
    await r.query(
      `DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
         AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'ENT')`, [code]);
    await r.query(
      `DELETE FROM "diagnoses" WHERE "icdCode" = $1
         AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1))`, [code]);
  }

  public async up(q: QueryRunner): Promise<void> {
    // ── head & neck cancer ──────────────────────────────────────────────────────────
    await this.add(q, "2B66.0", "squamous cell carcinoma of mouth", "سرطانة الخلايا الحرشفية للفم",
      "Oral-cavity SCC linked to tobacco, alcohol and betel; treated by resection, neck dissection and reconstruction.",
      "سرطانة حرشفية لجوف الفم مرتبطة بالتبغ والكحول والتنبول؛ تُعالَج بالاستئصال وتشريح العنق وإعادة البناء.",
      ["head & neck cancer"]);
    await this.add(q, "2B62.Z", "malignant neoplasm of tongue", "ورم خبيث في اللسان",
      "Tongue carcinoma, usually SCC of the oral tongue; managed by glossectomy with neck dissection.",
      "سرطانة اللسان، عادة حرشفية للسان الفموي؛ تُدار باستئصال اللسان مع تشريح العنق.",
      ["head & neck cancer"]);
    await this.add(q, "2B69.Z", "malignant neoplasm of tonsil", "ورم خبيث في اللوزة",
      "Oropharyngeal tonsillar carcinoma, frequently HPV-associated; treated with chemoradiation or transoral surgery.",
      "سرطانة لوزة بلعومية فموية، غالباً مرتبطة بفيروس الورم الحليمي؛ تُعالَج بالكيمياإشعاع أو الجراحة عبر الفم.",
      ["head & neck cancer"]);
    await this.add(q, "2B6D.Z", "malignant neoplasm of hypopharynx", "ورم خبيث في البلعوم السفلي",
      "Hypopharyngeal carcinoma presenting late with dysphagia and nodal disease; poor prognosis.",
      "سرطانة البلعوم السفلي تتظاهر متأخرة بعسر البلع ومرض عقدي؛ إنذار سيئ.",
      ["head & neck cancer"]);
    await this.add(q, "2C22.Z", "malignant neoplasm of accessory (maxillary) sinus", "ورم خبيث في الجيب الإضافي (الفكي)",
      "Sinonasal carcinoma of the maxillary antrum; managed by craniofacial/endoscopic resection and radiotherapy.",
      "سرطانة أنفية جيبية للجيب الفكي؛ تُدار بالاستئصال القحفي الوجهي/بالمنظار والعلاج الإشعاعي.",
      ["head & neck cancer"]);
    await this.add(q, "2C20.Z", "malignant neoplasm of nasal cavity", "ورم خبيث في جوف الأنف",
      "Nasal-cavity malignancy including SCC and esthesioneuroblastoma; resected with adjuvant therapy.",
      "ورم خبيث في جوف الأنف يشمل السرطانة الحرشفية والورم الأرومي العصبي الشمي؛ يُستأصل مع علاج مساعد.",
      ["head & neck cancer"]);
    await this.add(q, "2B67.Z", "malignant neoplasm of parotid gland", "ورم خبيث في الغدة النكفية",
      "Parotid carcinoma (mucoepidermoid, adenoid cystic); parotidectomy with facial-nerve preservation when possible.",
      "سرطانة نكفية (مخاطية بشروية، كيسية غدّانية)؛ استئصال النكفة مع الحفاظ على العصب الوجهي عند الإمكان.",
      ["head & neck cancer", "salivary gland disease"]);
    await this.add(q, "2B60.1", "squamous cell carcinoma of lip", "سرطانة الخلايا الحرشفية للشفة",
      "Lower-lip SCC related to sun exposure; excised with vermilionectomy or wedge resection.",
      "سرطانة حرشفية للشفة السفلية مرتبطة بالتعرض الشمسي؛ تُستأصل برأب الحُمرة أو الاستئصال الإسفيني.",
      ["head & neck cancer"]);
    await this.add(q, "DA01.00", "oral leukoplakia", "الطلاوة الفموية",
      "Potentially malignant white oral lesion; biopsied to grade dysplasia and monitored or excised.",
      "آفة فموية بيضاء محتملة الخباثة؛ تُخزَع لتدريج خلل التنسج وتُراقَب أو تُستأصل.",
      ["head & neck cancer"]);
    await this.add(q, "2D6Z", "metastatic malignant neoplasm to lymph node", "ورم خبيث نقيلي إلى العقدة اللمفية",
      "Cervical nodal metastasis, often the presenting sign of an occult head-and-neck primary; worked up by FNA/imaging.",
      "نقيلة عقدية عنقية، غالباً أول علامة لورم رأس وعنق أولي خفي؛ يُقيَّم بالرشف بالإبرة الدقيقة والتصوير.",
      ["head & neck cancer"]);

    // ── thyroid & parathyroid diseases ──────────────────────────────────────────────
    await this.add(q, "2D10.4", "medullary carcinoma of thyroid", "السرطانة النخاعية للغدة الدرقية",
      "Parafollicular C-cell tumour secreting calcitonin; may be familial (MEN2), treated by total thyroidectomy.",
      "ورم خلايا C جنيب الجريبية يفرز الكالسيتونين؛ قد يكون عائلياً (MEN2)، يُعالَج باستئصال الدرق الكامل.",
      ["thyroid & parathyroid diseases"]);
    await this.add(q, "2D10.3", "undifferentiated (anaplastic) carcinoma of thyroid", "السرطانة غير المتمايزة (الكشمية) للغدة الدرقية",
      "Highly aggressive thyroid malignancy of the elderly with rapid airway compromise; generally palliative.",
      "ورم درقي عدواني للغاية عند المسنين مع اختلال سريع للمجرى الهوائي؛ ملطّف عموماً.",
      ["thyroid & parathyroid diseases"]);
    await this.add(q, "2D10.0", "follicular carcinoma of thyroid", "السرطانة الجريبية للغدة الدرقية",
      "Differentiated thyroid cancer spreading haematogenously; treated by thyroidectomy and radioiodine.",
      "سرطان درقي متمايز ينتشر دموياً؛ يُعالَج باستئصال الدرق واليود المشع.",
      ["thyroid & parathyroid diseases"]);
    await this.add(q, "DA05.Y&XA0SH3", "thyroglossal duct cyst", "كيسة القناة الدرقية اللسانية",
      "Midline neck cyst moving with swallowing; excised by the Sistrunk procedure including the mid-hyoid body.",
      "كيسة عنقية متوسطة تتحرك مع البلع؛ تُستأصل بإجراء سيسترَنك متضمناً جسم العظم اللامي.",
      ["thyroid & parathyroid diseases"]);
    await this.add(q, "5A03.20", "Hashimoto thyroiditis", "التهاب الغدة الدرقية لهاشيموتو",
      "Autoimmune chronic lymphocytic thyroiditis, the commonest cause of hypothyroidism; rarely needs surgery.",
      "التهاب درقي لمفاوي مزمن مناعي ذاتي، أشيع أسباب قصور الدرق؛ نادراً ما يحتاج جراحة.",
      ["thyroid & parathyroid diseases"]);
    await this.add(q, "5A03.1", "subacute thyroiditis", "التهاب الغدة الدرقية تحت الحاد",
      "De Quervain granulomatous thyroiditis, painful and post-viral, with transient thyrotoxicosis; self-limiting.",
      "التهاب درقي حبيبومي دو كيرفان، مؤلم وبعد فيروسي، مع فرط درقية عابر؛ محدود ذاتياً.",
      ["thyroid & parathyroid diseases"]);
    await this.add(q, "2F37.Y", "parathyroid adenoma", "ورم غدّي في جارة الدرقية",
      "Benign parathyroid tumour, the leading cause of primary hyperparathyroidism; cured by parathyroidectomy.",
      "ورم حميد لجارة الدرقية، السبب الرئيسي لفرط نشاط جارات الدرقية الأولي؛ يُشفى باستئصال جارة الدرقية.",
      ["thyroid & parathyroid diseases"]);

    // ── salivary gland disease ──────────────────────────────────────────────────────
    await this.add(q, "2E91.0", "pleomorphic adenoma of parotid", "الورم الغدّي متعدد الأشكال للنكفة",
      "Commonest benign salivary tumour; excised by superficial parotidectomy because of malignant-transformation risk.",
      "أشيع ورم لعابي حميد؛ يُستأصل باستئصال النكفة السطحي بسبب خطر التحول الخبيث.",
      ["salivary gland disease"]);
    await this.add(q, "2E91.Z", "Warthin tumour", "ورم وارثين",
      "Benign cystic salivary tumour (adenolymphoma), often bilateral and smoking-related; parotid-tail location.",
      "ورم لعابي كيسي حميد (ورم غدّي لمفي)، غالباً ثنائي ومرتبط بالتدخين؛ في ذيل النكفة.",
      ["salivary gland disease"]);
    await this.add(q, "DA04.2", "sialoadenitis", "التهاب الغدة اللعابية",
      "Acute or chronic salivary-gland inflammation, often with ductal obstruction; treated medically or by sialendoscopy.",
      "التهاب حاد أو مزمن للغدة اللعابية، غالباً مع انسداد قنوي؛ يُعالَج طبياً أو بتنظير اللعاب.",
      ["salivary gland disease"]);
    await this.add(q, "DA04.5", "mucocele or ranula of salivary gland", "قيلة مخاطية أو ضفدعة الغدة اللعابية",
      "Mucus-retention/extravasation cyst; a ranula in the floor of mouth is excised with the sublingual gland.",
      "كيسة احتباس/تسرب مخاطي؛ تُستأصل الضفدعة في أرضية الفم مع الغدة تحت اللسان.",
      ["salivary gland disease"]);
  }

  public async down(q: QueryRunner): Promise<void> {
    for (const code of [
      "2B66.0", "2B62.Z", "2B69.Z", "2B6D.Z", "2C22.Z", "2C20.Z", "2B67.Z", "2B60.1", "DA01.00", "2D6Z",
      "2D10.4", "2D10.3", "2D10.0", "DA05.Y&XA0SH3", "5A03.20", "5A03.1", "2F37.Y",
      "2E91.0", "2E91.Z", "DA04.2", "DA04.5",
    ]) {
      await this.remove(q, code);
    }
  }
}
