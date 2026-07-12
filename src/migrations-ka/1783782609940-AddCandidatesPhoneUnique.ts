import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Restore the production UNIQUE(phoneNum) on `candidates`.
 *
 * Production MySQL (`kasr-el-ainy`) enforces unique `email` AND `phoneNum`; the KA-spoke
 * entity pass carried over email-unique but dropped phone-unique. This puts it back so the
 * WA-bot phone lookup (`getCandByPhoneDigits`, `.getOne()`) is safe. Created only AFTER the
 * candidates ETL, which loaded the 110 prod rows and verified 0 duplicate phone numbers.
 * (AUDIT_MODULE_cand.md §7 step 3.)
 */
export class AddCandidatesPhoneUnique1783782609940 implements MigrationInterface {
  name = "AddCandidatesPhoneUnique1783782609940";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE UNIQUE INDEX "UQ_candidates_phoneNum" ON "candidates" ("phoneNum")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "UQ_candidates_phoneNum"`);
  }
}
