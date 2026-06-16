import { MigrationInterface, QueryRunner } from "typeorm";

export class AddCtsMissingDiagnoses1750000000047 implements MigrationInterface {
  name = "AddCtsMissingDiagnoses1750000000047";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Insert new diagnoses ──────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      (
        'BA40',
        'unstable angina',
        'ذبحة صدرية غير مستقرة',
        'Unstable angina is an acute coronary syndrome characterized by chest pain at rest or minimal exertion, representing an intermediate state between stable angina and myocardial infarction and requiring urgent evaluation and surgical revascularization.',
        'الذبحة الصدرية غير المستقرة متلازمة تاجية حادة تتميز بألم صدري في الراحة أو بجهد أدنى، وتمثل حالة بينية بين الذبحة المستقرة واحتشاء عضلة القلب، وتستدعي تقييماً عاجلاً وإعادة تروية جراحية.'
      ),
      (
        'CA22.Z',
        'lung abscess - unspecified',
        'خراج الرئة - غير محدد',
        'Lung abscess is a necrotizing pulmonary infection forming a circumscribed cavity containing pus, resulting from aspiration, pneumonia, or hematogenous spread, and may require surgical drainage or resection when refractory to antibiotics.',
        'خراج الرئة التهاب رئوي نخري يكوّن تجويفاً محدوداً يحتوي على قيح، ناتج عن الاستنشاق أو الالتهاب الرئوي أو الانتشار الدموي، وقد يستلزم التصريف الجراحي أو الاستئصال عند فشل العلاج بالمضادات الحيوية.'
      ),
      (
        'CB24.1',
        'secondary spontaneous pneumothorax',
        'استرواح الصدر التلقائي الثانوي',
        'Secondary spontaneous pneumothorax occurs in patients with underlying lung disease (COPD, asthma, cystic fibrosis, tuberculosis), carries higher morbidity than the primary form, and typically requires chest tube drainage or surgical intervention (VATS bullectomy / pleurodesis).',
        'استرواح الصدر التلقائي الثانوي يحدث في المرضى الذين يعانون من أمراض رئوية كامنة كالانسداد الرئوي المزمن والربو والتليف الكيسي والسل، ويحمل معدل مراضة أعلى من الشكل الأولي ويستلزم عادةً تصريفاً بأنبوب أو تدخلاً جراحياً بالتنظير.'
      ),
      (
        'BB80.Z',
        'acute pericarditis - unspecified',
        'التهاب التأمور الحاد - غير محدد',
        'Acute pericarditis is inflammation of the pericardium presenting with pleuritic chest pain, pericardial friction rub, and characteristic ECG changes. Aetiology may be viral, bacterial, autoimmune, or idiopathic; surgical drainage is required for purulent or large effusions.',
        'التهاب التأمور الحاد حالة التهابية للتأمور تتظاهر بألم صدري جنبي المنشأ واحتكاك تأموري وتغيرات مميزة في تخطيط القلب. قد يكون فيروسياً أو جرثومياً أو مناعياً ذاتياً أو مجهول السبب، ويستلزم التصريف الجراحي في حالات القيحي أو الانصباب الكبير.'
      ),
      (
        'BB82',
        'cardiac tamponade',
        'دكاك القلب',
        'Cardiac tamponade is a life-threatening emergency caused by accumulation of fluid in the pericardial space compressing the heart and causing obstructive shock. It requires urgent pericardiocentesis or surgical drainage (pericardial window / pericardiectomy).',
        'دكاك القلب حالة طارئة مهددة للحياة تنجم عن تراكم السائل في التجويف التأموري مما يسبب ضغطاً على القلب وصدمة انسدادية، وتستلزم بزل التأمور عاجلاً أو التصريف الجراحي بنافذة التأمور أو الاستئصال التأموري.'
      )
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    // ── Link to CTS department ────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
      SELECT dept.id, d.id
      FROM "departments" dept, "diagnoses" d
      WHERE dept.code = 'CTS'
        AND d."icdCode" IN ('BA40','CA22.Z','CB24.1','BB80.Z','BB82')
      ON CONFLICT DO NOTHING
    `);

    // ── Link to main_diags ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id
      FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "diagnoses" d ON d."icdCode" = 'BA40'
      WHERE dept.code = 'CTS' AND md.title = 'coronary artery disease (cad)'
      ON CONFLICT DO NOTHING;

      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id
      FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "diagnoses" d ON d."icdCode" = 'CA22.Z'
      WHERE dept.code = 'CTS' AND md.title = 'benign lung / airway disease'
      ON CONFLICT DO NOTHING;

      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id
      FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "diagnoses" d ON d."icdCode" = 'CB24.1'
      WHERE dept.code = 'CTS' AND md.title = 'pneumothorax & bullous disease'
      ON CONFLICT DO NOTHING;

      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id
      FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "diagnoses" d ON d."icdCode" = 'BB80.Z'
      WHERE dept.code = 'CTS' AND md.title = 'pericardial disease'
      ON CONFLICT DO NOTHING;

      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id
      FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "diagnoses" d ON d."icdCode" = 'BB82'
      WHERE dept.code = 'CTS' AND md.title = 'pericardial disease'
      ON CONFLICT DO NOTHING;
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove CTS main_diag links
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'CTS'
      )
      AND "diagnosisId" IN (
        SELECT id FROM "diagnoses"
        WHERE "icdCode" IN ('BA40','CA22.Z','CB24.1','BB80.Z','BB82')
      )
    `);

    // Remove CTS department links
    await queryRunner.query(`
      DELETE FROM "department_diagnoses"
      WHERE "departmentId" = (SELECT id FROM "departments" WHERE code = 'CTS')
        AND "diagnosisId" IN (
          SELECT id FROM "diagnoses"
          WHERE "icdCode" IN ('BA40','CA22.Z','CB24.1','BB80.Z','BB82')
        )
    `);

    // Remove diagnoses (safe: these codes are only linked to CTS in this migration)
    await queryRunner.query(`
      DELETE FROM "diagnoses"
      WHERE "icdCode" IN ('BA40','CA22.Z','CB24.1','BB80.Z','BB82')
    `);
  }
}
