import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Restore the production UNIQUE(phoneNum) on `supervisors`.
 *
 * Production MySQL (`kasr-el-ainy`) enforces unique `email` AND `phoneNum`; the KA-spoke
 * entity pass carried over email-unique but dropped phone-unique. This puts it back so the
 * WA-bot phone lookup (`getSupervisorByPhoneDigits`, `.getOne()`) is safe. Created only AFTER the
 * supervisors ETL, which loaded the 56 prod rows and verified 0 duplicate phone numbers.
 * (AUDIT_MODULE_supervisor.md §7 step 3.)
 */
export class AddSupervisorsPhoneUnique1783782609950 implements MigrationInterface {
  name = "AddSupervisorsPhoneUnique1783782609950";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_supervisors_phoneNum" ON "supervisors" ("phoneNum")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_supervisors_phoneNum"`);
  }
}
