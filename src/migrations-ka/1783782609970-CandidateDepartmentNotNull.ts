import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Make `candidates.departmentId` NOT NULL — every candidate must belong to a department.
 *
 * The 110 prod candidates were already backfilled to the NS department id (0 NULL departmentId,
 * verified) by the earlier candidates ETL. From here on, creating a candidate without a department
 * is rejected at the DB level. (AUDIT_MODULE_cand.md; user decision 2026-07-12 — parity with
 * supervisors.departmentId NOT NULL.)
 */
export class CandidateDepartmentNotNull1783782609970 implements MigrationInterface {
  name = "CandidateDepartmentNotNull1783782609970";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "candidates" ALTER COLUMN "departmentId" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "candidates" ALTER COLUMN "departmentId" DROP NOT NULL`);
  }
}
