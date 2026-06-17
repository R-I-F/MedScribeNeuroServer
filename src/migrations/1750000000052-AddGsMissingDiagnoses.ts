import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGsMissingDiagnoses1750000000052 implements MigrationInterface {
  name = "AddGsMissingDiagnoses1750000000052";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Insert new diagnoses ───────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      (
        'DB31.1',
        'duodenal ulcer',
        'قرحة الاثني عشر',
        'Mucosal ulceration of the duodenum, most commonly due to Helicobacter pylori infection or NSAID use, presenting with epigastric pain relieved by food; complications include upper GI bleeding, perforation, and gastric outlet obstruction.',
        'تقرح مخاطي في الاثني عشر، ينجم في الغالب عن عدوى بكتيريا الحلزونية البوابية أو استخدام مضادات الالتهاب غير الستيرويدية، يتظاهر بألم شرسوفي يتحسن بتناول الطعام؛ مضاعفاته تشمل نزيف الجهاز الهضمي العلوي والانثقاب وانسداد مخرج المعدة.'
      ),
      (
        '2D10.1',
        'follicular carcinoma of thyroid',
        'سرطان الغدة الدرقية الجريبي',
        'Malignant thyroid tumour arising from follicular epithelium, characterised by capsular and vascular invasion rather than lymphatic spread; typically presents as a solitary cold thyroid nodule; haematogenous metastasis to lung and bone is characteristic; treated by total thyroidectomy followed by radioiodine ablation.',
        'ورم خبيث في الغدة الدرقية ينشأ من الظهارة الجريبية، يتميز بالغزو الكبسولي والوعائي بدلاً من الانتشار اللمفاوي؛ يتظاهر عادةً كعقيدة درقية منفردة بادرة؛ الانتشار الدموي إلى الرئتين والعظام هو السمة المميزة؛ يُعالج باستئصال الغدة الدرقية الكامل مع الإبلاد باليود المشع.'
      ),
      (
        'DC10.0',
        'acute acalculous cholecystitis',
        'التهاب المرارة الحاد اللاحصوي',
        'Acute inflammation of the gallbladder occurring without gallstones, typically complicating critical illness (ICU patients, post-major surgery, polytrauma, burns, or prolonged parenteral nutrition); caused by gallbladder ischaemia, bile stasis, and secondary bacterial infection; managed by urgent cholecystectomy or percutaneous cholecystostomy in high-risk patients.',
        'التهاب حاد في المرارة يحدث في غياب الحصوات، يُصيب عادةً المرضى الحرجين (المنومين في وحدة العناية المركزة، وما بعد الجراحة الكبرى، والرضح المتعدد، والحروق، أو التغذية الوريدية الطويلة)؛ تسببه نقص تروية المرارة وركود الصفراء والعدوى البكتيرية الثانوية؛ يُعالج باستئصال المرارة الطارئ أو التصريف عبر الجلد في المرضى عالي الخطورة.'
      )
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    // ── 2. Link to GS department ──────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
      SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND d."icdCode" IN ('DB31.1','2D10.1','DC10.0')
      ON CONFLICT DO NOTHING
    `);

    // ── 3. Link to main_diags ─────────────────────────────────────────────

    // DB31.1 → peptic ulcer disease
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'peptic ulcer disease' AND d."icdCode" = 'DB31.1'
      ON CONFLICT DO NOTHING
    `);

    // 2D10.1 → thyroid nodules
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'thyroid nodules' AND d."icdCode" = '2D10.1'
      ON CONFLICT DO NOTHING
    `);

    // DC10.0 → cholecystitis & cholelithiasis
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'cholecystitis & cholelithiasis' AND d."icdCode" = 'DC10.0'
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" IN ('DB31.1','2D10.1','DC10.0'))
    `);
    await queryRunner.query(`
      DELETE FROM "department_diagnoses"
      WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" IN ('DB31.1','2D10.1','DC10.0'))
    `);
    await queryRunner.query(`
      DELETE FROM "diagnoses" WHERE "icdCode" IN ('DB31.1','2D10.1','DC10.0')
    `);
  }
}
