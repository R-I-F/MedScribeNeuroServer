import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Make `supervisors.departmentId` NOT NULL — every supervisor must belong to a department.
 *
 * Runs AFTER the supervisors ETL (which stamped all 56 migrated rows with the NS department id,
 * verified 0 NULL departmentId). From here on, creating a supervisor without a department is
 * rejected at the DB level. (AUDIT_MODULE_supervisor.md §7 step 5; user decision 2026-07-12.)
 */
export class SupervisorDepartmentNotNull1783782609960 implements MigrationInterface {
  name = "SupervisorDepartmentNotNull1783782609960";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "supervisors" ALTER COLUMN "departmentId" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "supervisors" ALTER COLUMN "departmentId" DROP NOT NULL`);
  }
}
