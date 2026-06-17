import { MigrationInterface, QueryRunner } from "typeorm";

// 10 confirmed ICD-11 code/label corrections for CTS (all verified via findacode.com 2026-06-17).
//
// 1. BB81.Z "Pericardial effusion" — BB81 = Tricuspid valve insufficiency (parent block).
//    Correct code: BB25 = Pericardial effusion.
//
// 2. BB84.0 "Constrictive pericarditis" — BB84 = Traumatic rupture of tricuspid valve.
//    Correct code: BB22 = Constrictive pericarditis.
//
// 3. INSERT BB23 = Cardiac tamponade (new entry; was missing from DB — mig-062 repurposed
//    BB82 away from tamponade but did not add the correct BB23 entry).
//
// 4. 1F22.0 "Pulmonary aspergilloma" — 1F22 = Blastomycosis (completely different fungus).
//    Correct code: 1F20.1 = Non-invasive aspergillosis (includes aspergilloma).
//
// 5. 1F70.1 "Pulmonary echinococcosis" — 1F70 = Cysticercosis (different parasite).
//    Correct code: 1F73.1 = Echinococcosis of lung (confirmed from 1F73 block).
//
// 6. CA96.0 "Bronchogenic cyst" — CA96 does not exist in any visible ICD-11 chapter.
//    Correct code: LA77 = Congenital cyst of mediastinum (Chapter 20 developmental anomalies).
//
// 7. NB30.0 icdName "Traumatic rupture of thoracic aorta" — too specific; NB30 covers
//    any injury of thoracic aorta, not only rupture. Name corrected; code is valid.
//
// 8. LB71.0 "Pectus excavatum" — LB71 = Facial bone anomalies (wrong chapter).
//    Correct code: LB73.13 = Structural developmental anomalies of sternum (confirmed;
//    LB73.13 has no subcodes — pectus excavatum and carinatum are both inclusions/synonyms).
//
// 9. LB71.1 "Pectus carinatum" — same wrong chapter as above.
//    LB73.13 is already used for excavatum (unique-key constraint). Using LB73.1Y =
//    Other specified structural developmental anomalies of thoracic cage as the closest
//    available terminal code for pectus carinatum within the LB73.1 sternum/thoracic block.
//
// 10. 2E01.3 "Secondary malignant neoplasm of pleura" — 2E01 = Malignant neoplasm
//     metastasis in urinary bladder (wrong organ entirely).
//     Correct code: 2D72 = Malignant neoplasm metastasis in pleura (confirmed from 2D70-2D7Z block).
//
// Still pending (verify when medical-terminologies-mcp is configured):
//   - 2F35.Z "Benign peripheral nerve neoplasm (mediastinal neurogenic tumor)" — 2F35 = urinary
//     organs (confirmed wrong); correct PNS benign neoplasm code not findable via findacode.

export class FixCtsIcdCodeErrors41750000000063 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {

    // ── 1. BB81.Z → BB25 (Pericardial effusion) ──────────────────────────────
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'BB25',
        "icdName"   = 'Pericardial effusion',
        "icdArName" = 'انصباب التامور',
        "embedding" = NULL
      WHERE "icdCode" = 'BB81.Z'
    `);

    // ── 2. BB84.0 → BB22 (Constrictive pericarditis) ─────────────────────────
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'BB22',
        "icdName"   = 'Constrictive pericarditis',
        "icdArName" = 'التهاب التامور القيدي',
        "embedding" = NULL
      WHERE "icdCode" = 'BB84.0'
    `);

    // ── 3. INSERT BB23 = Cardiac tamponade ────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
      VALUES (
        'BB23',
        'Cardiac tamponade',
        'دكاك القلب',
        'Life-threatening compression of the heart by accumulating pericardial fluid, impairing ventricular filling and cardiac output. Presents with Beck''s triad (hypotension, muffled heart sounds, elevated JVP) and pulsus paradoxus. Emergency pericardiocentesis or surgical pericardiostomy (pericardial window) is required. Common causes include malignancy, trauma, post-cardiac surgery, and idiopathic pericarditis.',
        'ضغط مهدد للحياة على القلب جراء تراكم السائل في كيس التامور يُعيق امتلاء البطينين والنتاج القلبي. يتظاهر بثلاثية بيك وتناقض النبض. يُعالج بشكل طارئ ببزل التامور أو إنشاء نافذة تأمورية جراحية.'
      )
      ON CONFLICT ("icdCode") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
      SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND d."icdCode" = 'BB23'
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'pericardial disease'
        AND d."icdCode" = 'BB23'
      ON CONFLICT DO NOTHING
    `);

    // ── 4. 1F22.0 → 1F20.1 (Non-invasive aspergillosis / aspergilloma) ───────
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"       = '1F20.1',
        "icdName"       = 'Non-invasive aspergillosis',
        "icdArName"     = 'الداء الرشاشي غير الغازي',
        "description"   = 'Colonisation of pre-existing pulmonary cavities (emphysematous bullae, old TB cavities, bronchiectasis) by Aspergillus species, forming a fungal ball (aspergilloma) without tissue invasion. Most common presentation is haemoptysis, ranging from minor to life-threatening. CTS indications: surgical resection for recurrent severe haemoptysis or for large cavities. Preoperative bronchial artery embolisation may temporise bleeding.',
        "arDescription" = 'استعمار فطر الرشاشيات لتجاويف رئوية قبلية دون غزو نسيجي، مُكوِّناً كرة فطرية (ورم الرشاشيات). أكثر مظاهره نفث الدم من الطفيف إلى الخطير. يستأصل جراحياً في حالات النفث الدموي الشديد المتكرر أو التجاويف الكبيرة.',
        "embedding"     = NULL
      WHERE "icdCode" = '1F22.0'
    `);

    // ── 5. 1F70.1 → 1F73.1 (Echinococcosis of lung / hydatid cyst) ──────────
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"       = '1F73.1',
        "icdName"       = 'Echinococcosis of lung',
        "icdArName"     = 'داء المشوكات الرئوي',
        "description"   = 'Pulmonary infection with Echinococcus granulosus (hydatid disease) forming cystic lesions (hydatid cysts) in the lung parenchyma, most often in the right lower lobe. Endemic in sheep-farming regions. Surgical excision is the treatment of choice; cyst enucleation (pericystectomy) or capitonnage avoids spillage of scolices. Medical adjunct with albendazole reduces recurrence.',
        "arDescription" = 'إصابة رئوية بطفيلي المشوكات المحبُّبة تُكوِّن أكياساً مائية في الحمة الرئوية. الجراحة هي علاج الاختيار؛ استئصال الكيس أو الرأب الجيبي يتجنب انسكاب الرؤيسات.',
        "embedding"     = NULL
      WHERE "icdCode" = '1F70.1'
    `);

    // ── 6. CA96.0 → LA77 (Congenital cyst of mediastinum / bronchogenic cyst) ─
    // CA96 does not exist in visible ICD-11 sections. LA77 (Chapter 20) is the correct
    // code for congenital mediastinal cysts, of which bronchogenic cyst is the most common type.
    //
    // Deduplication: if LA77 already exists in DB, delete CA96.0 links and row.
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'CA96.0')
        AND EXISTS (SELECT 1 FROM "diagnoses" WHERE "icdCode" = 'LA77')
    `);
    await queryRunner.query(`
      DELETE FROM "department_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'CA96.0')
        AND EXISTS (SELECT 1 FROM "diagnoses" WHERE "icdCode" = 'LA77')
    `);
    await queryRunner.query(`
      DELETE FROM "diagnoses"
      WHERE "icdCode" = 'CA96.0'
        AND EXISTS (SELECT 1 FROM "diagnoses" WHERE "icdCode" = 'LA77')
    `);
    // If LA77 did not exist: rename CA96.0
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"       = 'LA77',
        "icdName"       = 'Congenital cyst of mediastinum',
        "icdArName"     = 'كيسة المنصف الخلقية',
        "description"   = 'Congenital mediastinal cyst arising from abnormal budding of the primitive foregut during embryogenesis (bronchogenic cyst) or other developmental origins (enteric, pericardial, thoracic duct). Most are found in the middle or posterior mediastinum and are usually asymptomatic in adults but may compress adjacent structures. Surgical excision (VATS or open) is recommended to prevent complications and confirm diagnosis.',
        "arDescription" = 'كيسة منصفية خلقية تنشأ من تبرعم شاذ من الأمعاء الأمامية البدائية (كيسة قصبية) أو مصادر نمائية أخرى. تُوجد عادةً في المنصف الأوسط أو الخلفي وقد تضغط على البنى المجاورة. تُستأصل جراحياً بالمنظار أو الجراحة المفتوحة.',
        "embedding"     = NULL
      WHERE "icdCode" = 'CA96.0'
    `);
    // Ensure LA77 is linked to CTS dept + mediastinal mass / thymoma main_diag
    await queryRunner.query(`
      INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
      SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND d."icdCode" = 'LA77'
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'mediastinal mass / thymoma'
        AND d."icdCode" = 'LA77'
      ON CONFLICT DO NOTHING
    `);

    // ── 7. NB30.0 icdName fix (code is valid; name was too specific) ─────────
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdName"   = 'Injury of thoracic aorta',
        "icdArName" = 'إصابة الأبهر الصدري',
        "embedding" = NULL
      WHERE "icdCode" = 'NB30.0'
    `);

    // ── 8. LB71.0 → LB73.13 (Pectus excavatum; LB71 = Facial bone anomalies) ─
    // LB73.13 = Structural developmental anomalies of sternum; pectus excavatum
    // and carinatum are both synonyms/inclusions per WHO ICD-11. Since there are
    // no terminal subcodes, we use LB73.13 for the more common surgical case (excavatum).
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'LB73.13',
        "icdArName" = 'الصدر القمعي',
        "embedding" = NULL
      WHERE "icdCode" = 'LB71.0'
    `);

    // ── 9. LB71.1 → LB73.1Y (Pectus carinatum; LB73.13 is already used above) ─
    // LB73.1Y = Other specified structural developmental anomalies of thoracic cage.
    // Both conditions reside within the LB73.1 (chest wall) block; this is the closest
    // available terminal code when LB73.13 (sternum) is already assigned to excavatum.
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = 'LB73.1Y',
        "icdArName" = 'الصدر الطائري',
        "embedding" = NULL
      WHERE "icdCode" = 'LB71.1'
    `);

    // ── 10. 2E01.3 → 2D72 (Malignant neoplasm metastasis in pleura) ──────────
    // 2E01 = Malignant neoplasm metastasis in urinary bladder (wrong organ).
    // 2D72 = Malignant neoplasm metastasis in pleura (confirmed from 2D70-2D7Z block).
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode"   = '2D72',
        "icdName"   = 'Malignant neoplasm metastasis in pleura',
        "icdArName" = 'ورم خبيث ثانوي في غشاء الجنب',
        "embedding" = NULL
      WHERE "icdCode" = '2E01.3'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reverse in reverse order.

    // 10
    await queryRunner.query(`
      UPDATE "diagnoses" SET "icdCode"='2E01.3', "icdName"='Secondary malignant neoplasm of pleura',
        "icdArName"='ورم خبيث ثانوي في غشاء الجنب', "embedding"=NULL WHERE "icdCode"='2D72'
    `);

    // 9
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='LB71.1', "icdArName"='تشوه صدر القاروص الخلقي', "embedding"=NULL WHERE "icdCode"='LB73.1Y'`);

    // 8
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='LB71.0', "icdArName"='تشوه الصدر القمعي الخلقي', "embedding"=NULL WHERE "icdCode"='LB73.13'`);

    // 7
    await queryRunner.query(`UPDATE "diagnoses" SET "icdName"='Traumatic rupture of thoracic aorta', "icdArName"='تمزق رضحي للأبهر الصدري', "embedding"=NULL WHERE "icdCode"='NB30.0'`);

    // 6
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='CA96.0', "icdName"='Bronchogenic cyst', "icdArName"='الكيسة القصبية', "embedding"=NULL WHERE "icdCode"='LA77'`);

    // 5
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='1F70.1', "icdName"='Pulmonary echinococcosis', "icdArName"='داء المشوكات الرئوي', "embedding"=NULL WHERE "icdCode"='1F73.1'`);

    // 4
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='1F22.0', "icdName"='Pulmonary aspergilloma', "icdArName"='ورم الرشاشيات الرئوي', "embedding"=NULL WHERE "icdCode"='1F20.1'`);

    // 3 — remove BB23
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId"=(SELECT id FROM "diagnoses" WHERE "icdCode"='BB23')`);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId"=(SELECT id FROM "diagnoses" WHERE "icdCode"='BB23')`);
    await queryRunner.query(`DELETE FROM "diagnoses" WHERE "icdCode"='BB23'`);

    // 2
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='BB84.0', "icdName"='Constrictive pericarditis', "icdArName"='التهاب التامور الانقباضي', "embedding"=NULL WHERE "icdCode"='BB22'`);

    // 1
    await queryRunner.query(`UPDATE "diagnoses" SET "icdCode"='BB81.Z', "icdName"='Pericardial effusion', "icdArName"='انصباب التامور', "embedding"=NULL WHERE "icdCode"='BB25'`);
  }
}
