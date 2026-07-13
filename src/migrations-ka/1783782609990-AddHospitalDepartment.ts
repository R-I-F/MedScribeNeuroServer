import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Add `departmentId` to `hospitals` — hospitals/units are DEPARTMENT-SCOPED (user decision
 * 2026-07-13): each department has its own hospitals, and the same name may repeat across
 * departments (so NO name-unique). Added nullable here for the backfill; the follow-up
 * `HospitalDepartmentNotNull` migration flips it to NOT NULL after the 7 prod hospitals are
 * stamped NS. FK → departments. (AUDIT_MODULE_hospital.md.)
 */
export class AddHospitalDepartment1783782609990 implements MigrationInterface {
  name = "AddHospitalDepartment1783782609990";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hospitals" ADD COLUMN "departmentId" uuid`);
    await queryRunner.query(`
      ALTER TABLE "hospitals"
      ADD CONSTRAINT "FK_hospitals_department"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "hospitals" DROP CONSTRAINT "FK_hospitals_department"`);
    await queryRunner.query(`ALTER TABLE "hospitals" DROP COLUMN "departmentId"`);
  }
}
