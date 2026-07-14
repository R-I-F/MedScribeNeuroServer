import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Add `departmentId` to the events-branch tables — DEPARTMENT-SCOPED (user 2026-07-14): each department
 * runs its own conferences / journal club / academic events (same rationale as hospitals). NULLABLE
 * during rollout; the ETLs backfill it — `confs`/`journals`/`events` → NS directly (single-institution),
 * `event_attendance` from its candidate (`candidateId → candidates.departmentId` → NS). FK → departments.
 * (AUDIT_MODULE_conf.md / _journal.md / _event.md.)
 */
export class AddEventsBranchDepartment1783782610080 implements MigrationInterface {
  name = "AddEventsBranchDepartment1783782610080";
  private tables = ["confs", "journals", "events", "event_attendance"];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const t of this.tables) {
      await queryRunner.query(`ALTER TABLE "${t}" ADD COLUMN "departmentId" uuid`);
      await queryRunner.query(
        `ALTER TABLE "${t}" ADD CONSTRAINT "FK_${t}_department" ` +
        `FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const t of [...this.tables].reverse()) {
      await queryRunner.query(`ALTER TABLE "${t}" DROP CONSTRAINT "FK_${t}_department"`);
      await queryRunner.query(`ALTER TABLE "${t}" DROP COLUMN "departmentId"`);
    }
  }
}
