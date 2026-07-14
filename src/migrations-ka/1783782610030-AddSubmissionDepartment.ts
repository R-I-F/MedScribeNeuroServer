import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Add `departmentId` to `submissions` — submissions are DEPARTMENT-SCOPED (user 2026-07-14).
 * NULLABLE during rollout; the ETL backfills it from each submission's candidate
 * (`candDocId → candidates.departmentId`), falling back to the supervisor's department for the
 * 5 supervisor-type submissions (candDocId NULL). Existing 3,599 resolve to NS. FK → departments.
 * (AUDIT_MODULE_sub.md.)
 */
export class AddSubmissionDepartment1783782610030 implements MigrationInterface {
  name = "AddSubmissionDepartment1783782610030";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "submissions" ADD COLUMN "departmentId" uuid`);
    await queryRunner.query(`
      ALTER TABLE "submissions"
      ADD CONSTRAINT "FK_submissions_department"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "submissions" DROP CONSTRAINT "FK_submissions_department"`);
    await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN "departmentId"`);
  }
}
