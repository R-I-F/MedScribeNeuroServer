import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Add `departmentId` to `arab_procs` — procedures are DEPARTMENT-SCOPED (same pattern as
 * hospitals/equipment/consumables). Kept NULLABLE: unlike hospitals, arab_procs has an active
 * bulk external-import path (`/createArabProcFromExternal`) and may hold cross-department
 * procedures, so a hard NOT NULL is deferred. The 81 prod rows are backfilled to NS by the ETL.
 * Same title may repeat across departments (no name-unique). FK → departments.
 * (AUDIT_MODULE_arabProc.md; dept-scoping judgment call 2026-07-14.)
 */
export class AddArabProcDepartment1783782610010 implements MigrationInterface {
  name = "AddArabProcDepartment1783782610010";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "arab_procs" ADD COLUMN "departmentId" uuid`);
    await queryRunner.query(`
      ALTER TABLE "arab_procs"
      ADD CONSTRAINT "FK_arab_procs_department"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "arab_procs" DROP CONSTRAINT "FK_arab_procs_department"`);
    await queryRunner.query(`ALTER TABLE "arab_procs" DROP COLUMN "departmentId"`);
  }
}
