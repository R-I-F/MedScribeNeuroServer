import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * SOC audit — MIG-B/C: adds 4 new main_diag categories (12 → 16) and applies the two
 * structural fixes that depend on MIG-A (104) having recoded the rows:
 *  - resolve the orphaned bladder row (2C90.0 → 2C94.2 in MIG-A) by linking it to the new
 *    "genitourinary cancer" category;
 *  - move adrenocortical carcinoma (2C73.1 → 2D11.Z in MIG-A) out of the mis-fitting
 *    "metastatic disease" category into the new "endocrine & adrenal tumours" category.
 * Created before the diagnosis-add migrations (106-107) so those can link rows to the
 * new categories.
 */
export class AddSocMainDiagsAndStructural1750000000105 implements MigrationInterface {
  name = "AddSocMainDiagsAndStructural1750000000105";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── New main_diag categories ────────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "main_diags" ("title","arTitle","departmentId")
      SELECT v.title, v.arTitle, dept.id
      FROM "departments" dept
      CROSS JOIN (VALUES
        ('genitourinary cancer',            'سرطان الجهاز البولي التناسلي'),
        ('endocrine & adrenal tumours',     'أورام الغدد الصماء والكظرية'),
        ('gynaecological cancer',           'سرطان الجهاز التناسلي الأنثوي'),
        ('biliary tract & gallbladder cancer','سرطان القناة الصفراوية والمرارة')
      ) AS v(title, arTitle)
      WHERE dept.code = 'SOC'
      ON CONFLICT ("title","departmentId") DO NOTHING
    `);

    // ── Structural fix 1: link orphaned bladder row to genitourinary cancer ─────────
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'SOC' AND md.title = 'genitourinary cancer' AND d."icdCode" = '2C94.2'
      ON CONFLICT DO NOTHING
    `);

    // ── Structural fix 2: move adrenocortical carcinoma metastatic → endocrine ──────
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = '2D11.Z')
        AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
                            WHERE dept.code = 'SOC' AND md.title = 'metastatic disease')
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'SOC' AND md.title = 'endocrine & adrenal tumours' AND d."icdCode" = '2D11.Z'
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // reverse structural fix 2
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = '2D11.Z')
        AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
                            WHERE dept.code = 'SOC' AND md.title = 'endocrine & adrenal tumours')
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'SOC' AND md.title = 'metastatic disease' AND d."icdCode" = '2D11.Z'
      ON CONFLICT DO NOTHING
    `);
    // reverse structural fix 1
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = '2C94.2')
        AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
                            WHERE dept.code = 'SOC' AND md.title = 'genitourinary cancer')
    `);
    // drop new categories
    await queryRunner.query(`
      DELETE FROM "main_diags"
      WHERE "departmentId" = (SELECT id FROM "departments" WHERE code = 'SOC')
        AND "title" IN ('genitourinary cancer','endocrine & adrenal tumours','gynaecological cancer','biliary tract & gallbladder cancer')
    `);
  }
}
