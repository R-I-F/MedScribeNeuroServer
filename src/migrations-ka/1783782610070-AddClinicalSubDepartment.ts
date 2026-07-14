import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Add `departmentId` to `clinical_sub` — clinical (non-surgical) submissions are DEPARTMENT-SCOPED
 * (user 2026-07-14), same pattern as `submissions`. NULLABLE during rollout; the ETL backfills it from
 * each row's candidate (`candDocId → candidates.departmentId`), falling back to the supervisor's
 * department. Existing 86 resolve to NS. FK → departments. (AUDIT_MODULE_clinicalSub.md.)
 */
export class AddClinicalSubDepartment1783782610070 implements MigrationInterface {
  name = "AddClinicalSubDepartment1783782610070";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "clinical_sub" ADD COLUMN "departmentId" uuid`);
    await queryRunner.query(`
      ALTER TABLE "clinical_sub"
      ADD CONSTRAINT "FK_clinical_sub_department"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "clinical_sub" DROP CONSTRAINT "FK_clinical_sub_department"`);
    await queryRunner.query(`ALTER TABLE "clinical_sub" DROP COLUMN "departmentId"`);
  }
}
