import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Make `hospitals.departmentId` NOT NULL — every hospital/unit belongs to a department.
 * Runs AFTER the hospitals ETL (7 prod hospitals stamped NS, verified 0 NULL). From here on,
 * creating a hospital without a department is rejected at the DB level; `POST /hospital`
 * requires `departmentId`. (AUDIT_MODULE_hospital.md; user decision 2026-07-13.)
 */
export class HospitalDepartmentNotNull1783782610000 implements MigrationInterface {
  name = "HospitalDepartmentNotNull1783782610000";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hospitals" ALTER COLUMN "departmentId" SET NOT NULL`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hospitals" ALTER COLUMN "departmentId" DROP NOT NULL`);
  }
}
