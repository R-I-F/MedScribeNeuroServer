import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Fixes NS main_diags missing the MNR 00001-00 (basic surgical step) link.
 * MIG-041 tried to link MNR 12001-00 which does not exist; the correct
 * numCode is 00001-00. Loops all NS main_diags to add the correct link.
 */
export class FixNsBasicStepLink1750000000056 implements MigrationInterface {
  name = "FixNsBasicStepLink1750000000056";

  private readonly nsTitles = [
    "brain tumours",
    "cerebrovascular disease",
    "congenital anomalies",
    "epilepsy & seizures",
    "hydrocephalus",
    "infections of the CNS",
    "movement disorders",
    "nerve & plexus injuries",
    "pain management",
    "pituitary & skull base",
    "spinal cord tumours",
    "spinal degenerative disease",
    "spine trauma",
    "traumatic brain injury",
    "ventricular & CSF disorders",
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const title of this.nsTitles) {
      await queryRunner.query(
        `INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
         SELECT md.id, p.id
         FROM "main_diags" md
         JOIN "departments" dept ON md."departmentId" = dept.id
         JOIN "proc_cpts" p ON p."alphaCode" = 'MNR' AND p."numCode" = '00001-00'
         WHERE dept.code = 'NS' AND md.title = $1
         ON CONFLICT DO NOTHING`,
        [title]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "procCptId" IN (
        SELECT id FROM "proc_cpts"
        WHERE "alphaCode" = 'MNR' AND "numCode" = '00001-00'
      )
      AND "mainDiagId" IN (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'NS'
      )
    `);
  }
}
