import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * `cal_surgs` — department scoping + modern procedure link.
 *
 * - `departmentId` uuid FK → departments: surgeries are DEPARTMENT-SCOPED (user 2026-07-14; the
 *   existing 5,578 are all NS). NULLABLE during rollout (an active bulk external-import path,
 *   `/postAllFromExternal`, would break under NOT NULL). Backfilled NS by the ETL.
 * - `procCptId` uuid FK → proc_cpts: the MODERN procedure link, replacing the legacy
 *   `arabProcId` → arab_procs. NULLABLE (many surgeries have no procedure; existing rows are
 *   backfilled later from the reviewed semantic mapping of the 73 legacy procedures → proc_cpts,
 *   via the hub's procedure-search). `arabProcId` is kept transitionally until arab_procs retires.
 * (AUDIT_MODULE_calSurg.md.)
 */
export class AddCalSurgDepartmentAndProcCpt1783782610020 implements MigrationInterface {
  name = "AddCalSurgDepartmentAndProcCpt1783782610020";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cal_surgs" ADD COLUMN "departmentId" uuid`);
    await queryRunner.query(`
      ALTER TABLE "cal_surgs"
      ADD CONSTRAINT "FK_cal_surgs_department"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`ALTER TABLE "cal_surgs" ADD COLUMN "procCptId" uuid`);
    await queryRunner.query(`
      ALTER TABLE "cal_surgs"
      ADD CONSTRAINT "FK_cal_surgs_proc_cpt"
      FOREIGN KEY ("procCptId") REFERENCES "proc_cpts"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cal_surgs" DROP CONSTRAINT "FK_cal_surgs_proc_cpt"`);
    await queryRunner.query(`ALTER TABLE "cal_surgs" DROP COLUMN "procCptId"`);
    await queryRunner.query(`ALTER TABLE "cal_surgs" DROP CONSTRAINT "FK_cal_surgs_department"`);
    await queryRunner.query(`ALTER TABLE "cal_surgs" DROP COLUMN "departmentId"`);
  }
}
