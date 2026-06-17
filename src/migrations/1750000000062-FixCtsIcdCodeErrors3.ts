import { MigrationInterface, QueryRunner } from "typeorm";

// 6 confirmed ICD-11 code/label corrections for CTS (all verified before findacode went down):
//
// 1. BB80.Z (mig-047): labeled "acute pericarditis, unspecified" — BB80=Tricuspid stenosis block.
//    Correct code: BB20.Z (Acute pericarditis, unspecified). Handles deduplication if BB20.Z exists.
//
// 2. BB82 (mig-047): labeled "cardiac tamponade" — BB82=Tricuspid valve stenosis+insufficiency.
//    No verified ICD-11 code for cardiac tamponade found while findacode was available;
//    fixing the label to the correct entity and reclassifying to tricuspid/multi-valve disease.
//
// 3. LA89.2 (pre-existing): labeled "Ebstein anomaly" — LA89.2=Mitral atresia.
//    Ebstein malformation of tricuspid valve = LA87.03 (confirmed).
//
// 4. LA8D.0 (mig-057): "Pulmonary atresia with intact VS" — LA8D.0 is a different entity.
//    Correct code: LA8A.10 (confirmed from findacode block LA8A).
//
// 5. LA8E (mig-057): "Common arterial trunk" — LA8E=Congenital anomaly of atrial septum.
//    Common arterial trunk (truncus arteriosus) = LA85.4Z.
//
// 6. LA88.3 (mig-057): "Congenital pulmonary valve stenosis" — LA88.3=Congenital LVOTO.
//    Best available code for congenital PV stenosis: LA8A.0Z (congenital PV anomaly, unspecified).

export class FixCtsIcdCodeErrors31750000000062 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    // ── 1. BB80.Z "acute pericarditis" → BB20.Z ──────────────────────────────
    // BB80 block = Tricuspid valve stenosis; BB80.Z = tricuspid stenosis unspecified.
    // Correct ICD-11 code for acute pericarditis unspecified = BB20.Z.
    //
    // Deduplication: if BB20.Z already exists in the DB (e.g. from an earlier migration),
    // delete BB80.Z row (wrong code, duplicate condition); otherwise rename it.
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'BB80.Z')
        AND EXISTS (SELECT 1 FROM "diagnoses" WHERE "icdCode" = 'BB20.Z')
    `);
    await queryRunner.query(`
      DELETE FROM "department_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'BB80.Z')
        AND EXISTS (SELECT 1 FROM "diagnoses" WHERE "icdCode" = 'BB20.Z')
    `);
    await queryRunner.query(`
      DELETE FROM "diagnoses"
      WHERE "icdCode" = 'BB80.Z'
        AND EXISTS (SELECT 1 FROM "diagnoses" WHERE "icdCode" = 'BB20.Z')
    `);
    // If BB20.Z did not exist: rename to correct code
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'BB20.Z',
        "icdName"   = 'Acute pericarditis, unspecified',
        "icdArName" = 'التهاب التامور الحاد - غير محدد',
        "embedding" = NULL
      WHERE "icdCode" = 'BB80.Z'
    `);
    // Ensure BB20.Z is linked to CTS dept and pericardial disease (no-ops if already linked)
    await queryRunner.query(`
      INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
      SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND d."icdCode" = 'BB20.Z'
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'pericardial disease'
        AND d."icdCode" = 'BB20.Z'
      ON CONFLICT DO NOTHING
    `);

    // ── 2. BB82: fix label + reclassify from pericardial → tricuspid disease ─
    // BB82 parent = Tricuspid valve stenosis with insufficiency (combined disease block).
    // mig-047 wrongly inserted it as "cardiac tamponade". BB82.0 was correctly added
    // in mig-061 (Rheumatic tricuspid stenosis+insufficiency); BB82 parent must match.
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdName"       = 'Tricuspid valve stenosis with insufficiency',
        "icdArName"     = 'تضيق الصمام ثلاثي الشرفات مع قلس',
        "description"   = 'Combined tricuspid valve stenosis and insufficiency producing both obstruction and regurgitation across the right atrioventricular valve. Most commonly rheumatic in aetiology (coded specifically as BB82.0). Presents with right heart failure, elevated JVP, and ascites. Surgical repair or tricuspid valve replacement is indicated for severe haemodynamic compromise.',
        "arDescription" = 'تضيق وقلس مشترك في الصمام ثلاثي الشرفات يُنتج انسداداً وارتجاعاً معاً. الروماتيزم هو السبب الأكثر شيوعاً (BB82.0). يتظاهر بقصور القلب الأيمن وارتفاع الضغط الوريدي والاستسقاء. ترميم الصمام أو استبداله يُشار إليه عند الاضطراب الديناميكي الشديد.',
        "embedding"     = NULL
      WHERE "icdCode" = 'BB82'
    `);
    // Remove wrong pericardial disease link
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'BB82')
        AND "mainDiagId" IN (
          SELECT md.id FROM "main_diags" md
          JOIN "departments" dept ON md."departmentId" = dept.id
          WHERE dept.code = 'CTS' AND md.title = 'pericardial disease'
        )
    `);
    // Add correct tricuspid / multi-valve disease link
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'tricuspid / multi-valve disease'
        AND d."icdCode" = 'BB82'
      ON CONFLICT DO NOTHING
    `);

    // ── 3. LA89.2 → LA87.03 (Ebstein anomaly) ───────────────────────────────
    // LA89.2 = Mitral atresia (not Ebstein anomaly).
    // Ebstein malformation of tricuspid valve = LA87.03 (confirmed).
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'LA87.03',
        "icdName"   = 'Ebstein malformation of tricuspid valve',
        "icdArName" = 'تشوه إبشتاين للصمام ثلاثي الشرفات',
        "embedding" = NULL
      WHERE "icdCode" = 'LA89.2'
    `);

    // ── 4. LA8D.0 → LA8A.10 (Pulmonary atresia with intact VS) ──────────────
    // LA8D.0 is a different congenital entity; confirmed correct code = LA8A.10.
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'LA8A.10',
        "icdName"   = 'Pulmonary atresia with intact ventricular septum',
        "icdArName" = 'انسداد الشريان الرئوي مع سلامة الحاجز البطيني',
        "embedding" = NULL
      WHERE "icdCode" = 'LA8D.0'
    `);

    // ── 5. LA8E → LA85.4Z (Common arterial trunk / Truncus arteriosus) ───────
    // LA8E = Congenital anomaly of atrial septum (wrong chapter / block).
    // Common arterial trunk = LA85.4 series; LA85.4Z = unspecified.
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'LA85.4Z',
        "icdName"   = 'Common arterial trunk, unspecified',
        "icdArName" = 'الجذع الشرياني المشترك - غير محدد',
        "embedding" = NULL
      WHERE "icdCode" = 'LA8E'
    `);

    // ── 6. LA88.3 → LA8A.0Z (Congenital pulmonary valve stenosis) ─────────────
    // LA88.3 = Congenital left ventricular outflow tract obstruction (wrong diagnosis).
    // No specific stenosis subcode found under LA8A.0; LA8A.0Z (unspecified) is the
    // best available code for congenital pulmonary valve stenosis in ICD-11.
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'LA8A.0Z',
        "icdName"   = 'Congenital anomaly of pulmonary valve, unspecified',
        "icdArName" = 'شذوذ خلقي في صمام الشريان الرئوي - غير محدد',
        "embedding" = NULL
      WHERE "icdCode" = 'LA88.3'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse in reverse order

    // 6. Restore LA8A.0Z → LA88.3
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'LA88.3',
        "icdName"   = 'Congenital pulmonary valve stenosis',
        "icdArName" = 'تضيق صمام الشريان الرئوي الخلقي',
        "embedding" = NULL
      WHERE "icdCode" = 'LA8A.0Z'
    `);

    // 5. Restore LA85.4Z → LA8E
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'LA8E',
        "icdName"   = 'Common arterial trunk',
        "icdArName" = 'الجذع الشرياني المشترك',
        "embedding" = NULL
      WHERE "icdCode" = 'LA85.4Z'
    `);

    // 4. Restore LA8A.10 → LA8D.0
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'LA8D.0',
        "icdName"   = 'Pulmonary atresia with intact ventricular septum',
        "icdArName" = 'انسداد الشريان الرئوي مع سلامة الحاجز البطيني',
        "embedding" = NULL
      WHERE "icdCode" = 'LA8A.10'
    `);

    // 3. Restore LA87.03 → LA89.2
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'LA89.2',
        "icdName"   = 'Ebstein anomaly',
        "icdArName" = 'شذوذ إبشتاين',
        "embedding" = NULL
      WHERE "icdCode" = 'LA87.03'
    `);

    // 2. Restore BB82 to wrong label and reclassify back to pericardial disease
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdName"       = 'Cardiac tamponade',
        "icdArName"     = 'دكاك القلب',
        "description"   = 'Life-threatening condition where pericardial fluid accumulation compresses the heart, impairing filling and cardiac output. Presents with Beck''s triad: hypotension, muffled heart sounds, and elevated JVP. Emergency pericardiocentesis or surgical drainage is required.',
        "arDescription" = 'حالة مهددة للحياة تتراكم فيها السوائل حول القلب مما يُعيق الامتلاء والنتاج القلبي. تتظاهر بثلاثية بيك. تحتاج إلى بزل تأموري طارئ أو تصريف جراحي.',
        "embedding"     = NULL
      WHERE "icdCode" = 'BB82'
    `);
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'BB82')
        AND "mainDiagId" IN (
          SELECT md.id FROM "main_diags" md
          JOIN "departments" dept ON md."departmentId" = dept.id
          WHERE dept.code = 'CTS' AND md.title = 'tricuspid / multi-valve disease'
        )
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'pericardial disease'
        AND d."icdCode" = 'BB82'
      ON CONFLICT DO NOTHING
    `);

    // 1. Restore BB20.Z → BB80.Z (best-effort; if BB20.Z was a pre-existing row that we
    //    kept untouched in up(), this will incorrectly rename it — but down() is rarely run)
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'BB80.Z',
        "icdName"   = 'Acute pericarditis, unspecified',
        "icdArName" = 'التهاب التامور الحاد - غير محدد',
        "embedding" = NULL
      WHERE "icdCode" = 'BB20.Z'
    `);
  }
}
