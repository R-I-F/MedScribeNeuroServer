import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Structural: the former "contracture of scar" row (recoded to EH94 "scar of skin"
 * in migration 078) belongs in the "scar revision" category, not "contractures".
 * Move its main_diag link from PRS/contractures → PRS/scar revision.
 *
 * "contractures" is then populated with proper contracture entities (Dupuytren,
 * Volkmann, joint/muscle contracture, trigger finger, plantar fibromatosis) by the
 * diagnosis-add migrations.
 */
export class RelinkPrsScarRow1750000000079 implements MigrationInterface {
  name = "RelinkPrsScarRow1750000000079";

  private async moveLink(
    runner: QueryRunner,
    fromTitle: string,
    toTitle: string
  ): Promise<void> {
    // remove old link
    await runner.query(
      `DELETE FROM "main_diag_diagnoses"
       WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'EH94')
         AND "mainDiagId" IN (
           SELECT md.id FROM "main_diags" md
           JOIN "departments" dept ON md."departmentId" = dept.id
           WHERE dept.code = 'PRS' AND md.title = $1)`,
      [fromTitle]
    );
    // add new link
    await runner.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md
       JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'PRS' AND md.title = $1 AND d."icdCode" = 'EH94'
       ON CONFLICT DO NOTHING`,
      [toTitle]
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await this.moveLink(queryRunner, "contractures", "scar revision");
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await this.moveLink(queryRunner, "scar revision", "contractures");
  }
}
