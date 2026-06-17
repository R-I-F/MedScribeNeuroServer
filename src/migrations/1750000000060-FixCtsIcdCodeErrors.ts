import { MigrationInterface, QueryRunner } from "typeorm";

// Fixes discovered after ICD-11 verification via findacode.com:
//
// 1. BC81 = Supraventricular tachyarrhythmia (parent block). Sub-codes:
//    BC81.2 = Macro reentrant atrial tachycardia (= atrial flutter)
//    BC81.4 = Wolff-Parkinson-White syndrome  ← was wrongly named "Atrial flutter" in mig-057
//    BC72   = does not exist in ICD-11         ← was wrongly inserted as WPW in mig-057
//
// 2. 2C25 uses HISTOLOGICAL sub-codes (not anatomical lobe codes as in ICD-10):
//    2C25.0 = Adenocarcinoma           (was "upper lobe" — wrong name from mig-001 era)
//    2C25.1 = Small cell carcinoma     (was "middle lobe" — wrong name)
//    2C25.2 = Squamous cell carcinoma  (was "lower lobe" — wrong name)
//    2C25.3 = Large cell carcinoma     (was "Small cell carcinoma" — wrong name in mig-057)
//    2C25.4 = Carcinoid / neuroendocrine (was "Squamous cell carcinoma" — wrong name in mig-057)
//    2C25.5 = Unspecified malignant epithelial neoplasm (was "Adenocarcinoma" — wrong name in mig-057)

export class FixCtsIcdCodeErrors1750000000060 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Fix BC81.4: rename from "Atrial flutter" → "Wolff-Parkinson-White syndrome" ──
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdName"       = 'Wolff-Parkinson-White syndrome',
        "icdArName"     = 'متلازمة ولف-باركنسون-وايت',
        "description"   = 'Ventricular pre-excitation syndrome caused by a congenital accessory atrioventricular pathway (Bundle of Kent) producing delta waves, shortened PR interval, and widened QRS on ECG. Presents with paroxysmal supraventricular tachycardia or, rarely, sudden cardiac death via rapid conduction of atrial fibrillation. Catheter or surgical ablation of the accessory pathway is curative.',
        "arDescription" = 'متلازمة الإثارة البطينية المبكرة الناجمة عن مسار أذيني بطيني إضافي خلقي يُنتج موجات دلتا وتقصيراً للمقطع PR. تتظاهر بتسرع قلبي انتيابي فوق بطيني؛ الإزالة بالقسطرة أو الجراحة علاج شافٍ.',
        "embedding"     = NULL
      WHERE "icdCode" = 'BC81.4'
    `);

    // ── 2. Remove wrong BC81.4→mitral valve disease link (WPW doesn't belong there) ──
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'BC81.4')
        AND "mainDiagId" IN (
          SELECT md.id FROM "main_diags" md
          JOIN "departments" dept ON md."departmentId" = dept.id
          WHERE dept.code = 'CTS' AND md.title = 'mitral valve disease'
        )
    `);

    // ── 3. Delete BC72 (non-existent ICD-11 code) ────────────────────────
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'BC72')
    `);
    await queryRunner.query(`
      DELETE FROM "department_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'BC72')
    `);
    await queryRunner.query(`DELETE FROM "diagnoses" WHERE "icdCode" = 'BC72'`);

    // ── 4. Add BC81.2 — Macro reentrant atrial tachycardia (atrial flutter) ──
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
      VALUES (
        'BC81.2',
        'Macro reentrant atrial tachycardia',
        'تسرع القلب الأذيني الكبير التشكيل',
        'Organised atrial tachyarrhythmia driven by a large macro-reentrant circuit, producing the classic sawtooth flutter waves at 250–350 bpm (typical cavotricuspid isthmus-dependent flutter, BC81.20). Associated with structural heart disease, mitral valve disease, and atrial dilation. Surgical Maze procedure or catheter ablation is performed concurrently with cardiac surgery.',
        'اضطراب نظم أذيني منظم ناجم عن دائرة كبيرة إعادة الدخول ينتج موجات الرفيف المميزة بمعدل 250–350 نبضة/دقيقة. مرتبط بأمراض القلب البنيوية وتوسع الأذين. يُعالج بإجراء المتاهة الجراحية أو الاستئصال بالقسطرة.'
      )
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    // Link BC81.2 to CTS department
    await queryRunner.query(`
      INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
      SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND d."icdCode" = 'BC81.2'
      ON CONFLICT DO NOTHING
    `);

    // Link BC81.2 to cardiac arrhythmias and mitral valve disease
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS'
        AND md.title IN ('cardiac arrhythmias', 'mitral valve disease')
        AND d."icdCode" = 'BC81.2'
      ON CONFLICT DO NOTHING
    `);

    // ── 5. Fix 2C25.0–2C25.5: correct names from anatomical → histological ──

    // 2C25.0: "upper lobe" → Adenocarcinoma
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdName"       = 'Adenocarcinoma of bronchus or lung',
        "icdArName"     = 'سرطان الغدة في القصبة أو الرئة',
        "description"   = 'The most common peripheral lung malignancy arising from alveolar type II cells or bronchial glandular epithelium. More prevalent in non-smokers and women. Peripheral location favours early detection by CT. Surgical lobectomy or segmentectomy is standard for resectable disease.',
        "arDescription" = 'أكثر الأورام الرئوية الطرفية شيوعاً ينشأ من الظهارة الغدية. شائع في غير المدخنين. الاستئصال الجراحي للفص أو القطعة هو المعيار للمرض القابل للاستئصال.',
        "embedding"     = NULL
      WHERE "icdCode" = '2C25.0'
    `);

    // 2C25.1: "middle lobe" → Small cell carcinoma
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdName"       = 'Small cell carcinoma of bronchus or lung',
        "icdArName"     = 'سرطان الخلايا الصغيرة للقصبة أو الرئة',
        "description"   = 'Aggressive high-grade neuroendocrine carcinoma with rapid doubling time, early haematogenous metastasis, and frequent paraneoplastic syndromes. Predominantly central tumour. Limited-stage disease may be considered for surgical resection combined with chemoradiotherapy.',
        "arDescription" = 'سرطان عصبي صماوي عالي الدرجة سريع التضاعف والانتشار. المراحل المحدودة قد تستفيد من الجراحة مع العلاج الكيميائي الإشعاعي.',
        "embedding"     = NULL
      WHERE "icdCode" = '2C25.1'
    `);

    // 2C25.2: "lower lobe" → Squamous cell carcinoma
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdName"       = 'Squamous cell carcinoma of bronchus or lung',
        "icdArName"     = 'سرطان الخلايا الحرشفية للقصبة أو الرئة',
        "description"   = 'Central bronchogenic malignancy arising from squamous metaplasia of bronchial epithelium, closely associated with tobacco smoking. Presents with haemoptysis, obstructive pneumonia, or central airway obstruction. Surgical lobectomy or pneumonectomy offers the best outcomes in early resectable disease.',
        "arDescription" = 'سرطان قصبي مركزي ينشأ من حؤول حرشفي لظهارة القصبات مرتبط بالتدخين. يتظاهر بنفث الدم وانسداد المجرى الهوائي. الاستئصال الجراحي يُعطي أفضل نتائج في المراحل المبكرة.',
        "embedding"     = NULL
      WHERE "icdCode" = '2C25.2'
    `);

    // 2C25.3: was "Small cell carcinoma" → Large cell carcinoma
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdName"       = 'Large cell carcinoma of bronchus or lung',
        "icdArName"     = 'سرطان الخلايا الكبيرة للقصبة أو الرئة',
        "description"   = 'Undifferentiated non-small cell lung carcinoma lacking the morphological features of adenocarcinoma or squamous cell carcinoma. Typically peripheral and large at presentation. Surgical resection is the treatment of choice for resectable disease.',
        "arDescription" = 'سرطان غير صغير الخلايا غير متمايز يفتقر إلى الميزات المورفولوجية للسرطان الغدي أو الحرشفي. الاستئصال الجراحي هو العلاج المفضل في المرض القابل للاستئصال.',
        "embedding"     = NULL
      WHERE "icdCode" = '2C25.3'
    `);

    // 2C25.4: was "Squamous cell carcinoma" → Carcinoid / neuroendocrine
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdName"       = 'Carcinoid or other malignant neuroendocrine neoplasms of bronchus or lung',
        "icdArName"     = 'الأورام العصبية الصماوية الخبيثة للقصبة أو الرئة',
        "description"   = 'Spectrum of neuroendocrine tumours of the lung including typical carcinoid (low-grade), atypical carcinoid (intermediate), and large cell neuroendocrine carcinoma (high-grade). Typical carcinoids are well-treated by surgical bronchoplastic resection or lobectomy.',
        "arDescription" = 'طيف من الأورام العصبية الصماوية للرئة من النموذجية الحميدة إلى الكارسينويد اللانموذجي والسرطان العصبي الصماوي كبير الخلايا. الاستئصال الجراحي هو خيار العلاج.',
        "embedding"     = NULL
      WHERE "icdCode" = '2C25.4'
    `);

    // 2C25.5: was "Adenocarcinoma" → Unspecified malignant epithelial neoplasm
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdName"       = 'Unspecified malignant epithelial neoplasm of bronchus or lung',
        "icdArName"     = 'الورم الظهاري الخبيث للقصبة أو الرئة - غير محدد',
        "description"   = 'Malignant epithelial neoplasm of the lung or bronchus where histological subtype cannot be determined from available biopsy material. Used when definitive classification as adenocarcinoma, squamous, small cell, or large cell is not possible.',
        "arDescription" = 'ورم ظهاري خبيث في الرئة أو القصبة لا يمكن تصنيفه نسيجياً بشكل قاطع من العينات المتاحة.',
        "embedding"     = NULL
      WHERE "icdCode" = '2C25.5'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore BC81.4 to incorrect "Atrial flutter" state (as inserted in mig-057)
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdName"   = 'Atrial flutter',
        "icdArName" = 'الرفيف الأذيني',
        "embedding" = NULL
      WHERE "icdCode" = 'BC81.4'
    `);
    // Re-add BC81.4→mitral valve disease link
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'mitral valve disease' AND d."icdCode" = 'BC81.4'
      ON CONFLICT DO NOTHING
    `);
    // Remove BC81.2
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'BC81.2')`);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'BC81.2')`);
    await queryRunner.query(`DELETE FROM "diagnoses" WHERE "icdCode" = 'BC81.2'`);
    // Restore 2C25.0-2C25.5 to wrong names (as they were before this migration)
    await queryRunner.query(`UPDATE "diagnoses" SET "icdName"='Malignant neoplasms of upper lobe bronchus or lung', "icdArName"='الأورام الخبيثة للفص العلوي من القصبة أو الرئة', "embedding"=NULL WHERE "icdCode"='2C25.0'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdName"='Malignant neoplasms of middle lobe bronchus or lung', "icdArName"='الأورام الخبيثة للفص الأوسط من القصبة أو الرئة', "embedding"=NULL WHERE "icdCode"='2C25.1'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdName"='Malignant neoplasms of lower lobe bronchus or lung', "icdArName"='الأورام الخبيثة للفص السفلي من القصبة أو الرئة', "embedding"=NULL WHERE "icdCode"='2C25.2'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdName"='Small cell carcinoma of bronchus or lung', "icdArName"='سرطان الخلايا الصغيرة للقصبة أو الرئة', "embedding"=NULL WHERE "icdCode"='2C25.3'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdName"='Squamous cell carcinoma of bronchus or lung', "icdArName"='سرطان الخلايا الحرشفية للقصبة أو الرئة', "embedding"=NULL WHERE "icdCode"='2C25.4'`);
    await queryRunner.query(`UPDATE "diagnoses" SET "icdName"='Adenocarcinoma of lung', "icdArName"='سرطان الغدة في الرئة', "embedding"=NULL WHERE "icdCode"='2C25.5'`);
  }
}
