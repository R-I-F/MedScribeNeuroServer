import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * VASC dept-audit — Phase 2B fix: 18 ICD-11 code corrections (17 ❌ wrong + 1 ⚠️ leaf).
 *
 * The VASC reference data was heavily corrupted: sequential fabricated codes
 * (BA80.x aneurysms, BD53.x cluster) and cross-concept mis-assignments
 * (BD51.0 = carotid-aneurysm code used for DVT; GB60.0 = acute-kidney-failure
 * code used for ESRD; BD52.0 in the arterial block used for venous insufficiency).
 *
 * - 16 simple code corrections (VASC-only or shared rows where the new code
 *   improves every linked dept): see `codeFixes`.
 * - mesenteric ischaemia: code + name refined (generic → acute, matching DD30.1).
 * - gangrene (BD53.1): MERGE — the correct code MC85 already exists as a
 *   PRS-owned shared row, so we delete VASC's wrong BD53.1 row and link VASC to
 *   the existing MC85 row (UPDATE would violate the unique "icdCode" constraint).
 *
 * Shared-row corrections that also benefit other depts:
 *   BD50.Z → BD50.3Y&XA01A6 (CTS + VASC), GB60.0 → GB61.5 (TRS + UROL + VASC).
 * The BD50.3 → BD50.3Z leaf refinement was intentionally skipped (shared with
 * CTS; the parent category code is clinically acceptable).
 *
 * Every changed row sets "embedding" = NULL so the backfill re-embeds it.
 */
export class FixVascIcdCodes1750000000085 implements MigrationInterface {
  // [oldCode, newCode] — code-only corrections (name/description unchanged)
  private readonly codeFixes: [string, string][] = [
    ["BA80.0", "BD50.4Z"],          // abdominal aortic aneurysm
    ["BA80.1", "BD50.41"],          // ruptured abdominal aortic aneurysm
    ["BA41.0", "BD55"],             // carotid artery stenosis (flagged-open)
    ["BD53.4", "2F9A"],             // carotid body tumour
    ["BA80.3", "BD51.6&XA44K1"],    // popliteal artery aneurysm
    ["BA80.4", "BD51.6&XA2JF3"],    // femoral artery aneurysm
    ["BD10.4", "8B22.A"],           // subclavian artery stenosis (flagged-open)
    ["BD4Z", "BD40.0"],             // critical limb ischaemia
    ["BD53.2", "BD53.Y"],           // diabetic peripheral vascular disease
    ["BD53.3", "8B91.Z"],           // thoracic outlet syndrome
    ["BD50.Z", "BD50.3Y&XA01A6"],   // aneurysm of aortic root (shared CTS+VASC)
    ["BD74.1", "BD74.1Z"],          // varicose veins of lower extremity (leaf)
    ["GB60.0", "GB61.5"],           // end-stage renal disease (shared TRS+UROL+VASC)
    ["BD51.0", "BD71.4"],           // deep vein thrombosis
    ["BD52.0", "BD74.Z"],           // chronic venous insufficiency
    ["BD53.0", "BD93.Z"],           // lymphoedema
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [oldCode, newCode] of this.codeFixes) {
      await queryRunner.query(
        `UPDATE "diagnoses" SET "icdCode" = $1, "embedding" = NULL WHERE "icdCode" = $2`,
        [newCode, oldCode],
      );
    }

    // mesenteric: code + name refinement (generic → acute, matching DD30.1)
    await queryRunner.query(
      `UPDATE "diagnoses" SET
         "icdCode"   = 'DD30.1',
         "icdName"   = 'acute mesenteric arterial ischaemia',
         "icdArName" = 'نقص التروية الحاد في الشريان المساريقي',
         "embedding" = NULL
       WHERE "icdCode" = 'BD40.Y'`,
    );

    // gangrene merge: drop VASC's BD53.1 row, link VASC to the existing MC85 row
    await queryRunner.query(
      `DELETE FROM "main_diag_diagnoses"
       WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'BD53.1')`,
    );
    await queryRunner.query(
      `DELETE FROM "department_diagnoses"
       WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'BD53.1')`,
    );
    await queryRunner.query(`DELETE FROM "diagnoses" WHERE "icdCode" = 'BD53.1'`);
    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'VASC' AND d."icdCode" = 'MC85'
       ON CONFLICT DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md
       JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'VASC' AND md.title = 'peripheral artery disease'
         AND d."icdCode" = 'MC85'
       ON CONFLICT DO NOTHING`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [oldCode, newCode] of this.codeFixes) {
      await queryRunner.query(
        `UPDATE "diagnoses" SET "icdCode" = $1, "embedding" = NULL WHERE "icdCode" = $2`,
        [oldCode, newCode],
      );
    }

    await queryRunner.query(
      `UPDATE "diagnoses" SET
         "icdCode"   = 'BD40.Y',
         "icdName"   = 'mesenteric artery ischaemia',
         "icdArName" = 'نقص التروية في شريان المساريقا',
         "embedding" = NULL
       WHERE "icdCode" = 'DD30.1'`,
    );

    // reverse gangrene merge: unlink VASC from MC85, recreate the BD53.1 row
    await queryRunner.query(
      `DELETE FROM "main_diag_diagnoses"
       WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'MC85')
         AND "mainDiagId" = (
           SELECT md.id FROM "main_diags" md
           JOIN "departments" dept ON md."departmentId" = dept.id
           WHERE dept.code = 'VASC' AND md.title = 'peripheral artery disease')`,
    );
    await queryRunner.query(
      `DELETE FROM "department_diagnoses"
       WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'MC85')
         AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'VASC')`,
    );
    await queryRunner.query(
      `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
       VALUES ('BD53.1','gangrene','الغنغرينا',
         'Tissue death resulting from inadequate blood supply or infection, requiring urgent surgical debridement or amputation.',
         'نخر الأنسجة الناجم عن عدم كفاية إمداد الدم أو العدوى، يستلزم تدخلًا جراحيًا عاجلًا لاستئصال الأنسجة الميتة أو البتر.')
       ON CONFLICT ("icdCode") DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'VASC' AND d."icdCode" = 'BD53.1'
       ON CONFLICT DO NOTHING`,
    );
    await queryRunner.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md
       JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'VASC' AND md.title = 'peripheral artery disease'
         AND d."icdCode" = 'BD53.1'
       ON CONFLICT DO NOTHING`,
    );
  }
}
