import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PEDSURG audit — adds 2 new main_diag categories so the 2 orphaned diagnoses
 * (epidermoid cyst, fournier gangrene) and common paediatric soft-tissue / thoracic
 * lesions have a proper home. Created first so the later ICD-fix and diagnosis-add
 * migrations (092-094) can link rows to them.
 */
export class AddPedsurgMainDiags1750000000091 implements MigrationInterface {
  name = "AddPedsurgMainDiags1750000000091";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "main_diags" ("title","arTitle","departmentId")
      SELECT v.title, v.arTitle, dept.id
      FROM "departments" dept
      CROSS JOIN (VALUES
        ('soft tissue & skin lesions', 'آفات الأنسجة الرخوة والجلد'),
        ('thoracic & lung anomalies',  'شذوذات الصدر والرئة')
      ) AS v(title, arTitle)
      WHERE dept.code = 'PEDSURG'
      ON CONFLICT ("title","departmentId") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "main_diags"
      WHERE "departmentId" = (SELECT id FROM "departments" WHERE code = 'PEDSURG')
        AND "title" IN ('soft tissue & skin lesions', 'thoracic & lung anomalies')
    `);
  }
}
