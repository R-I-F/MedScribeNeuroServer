import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCtsBasicStepLink1750000000050 implements MigrationInterface {
  name = "FixCtsBasicStepLink1750000000050";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // MNR basic surgical step is stored as numCode '00001-00', not '12001-00'.
    // Migration 049 linked '12001-00' which produced no rows. Fix by linking '00001-00'.
    const mainDiags = [
      "aortic valve disease",
      "benign lung / airway disease",
      "cardiac arrhythmias",
      "chest wall deformities / tumors",
      "congenital acyanotic heart defect",
      "congenital cyanotic heart defect",
      "coronary artery disease (cad)",
      "heart failure & cardiomyopathy",
      "mediastinal mass / thymoma",
      "metastatic/secondary lung disease",
      "mitral valve disease",
      "pericardial disease",
      "pleural effusion & empyema",
      "pneumothorax & bullous disease",
      "primary lung cancer",
      "thoracic aortic aneurysm / dissection",
      "tricuspid / multi-valve disease",
    ];

    for (const title of mainDiags) {
      await queryRunner.query(`
        INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
        SELECT md.id, p.id
        FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        JOIN "proc_cpts" p ON p."alphaCode" = 'MNR' AND p."numCode" = '00001-00'
        WHERE dept.code = 'CTS' AND md.title = '${title}'
        ON CONFLICT DO NOTHING
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "procCptId" = (
        SELECT id FROM "proc_cpts"
        WHERE "alphaCode" = 'MNR' AND "numCode" = '00001-00'
      )
      AND "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'CTS'
      )
    `);
  }
}
