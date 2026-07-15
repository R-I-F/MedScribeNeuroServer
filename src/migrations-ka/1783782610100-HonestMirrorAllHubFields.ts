import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Make the reference mirror an HONEST 1:1 mirror of the hub (user directive 2026-07-15):
 * the sync previously projected away six hub fields. Add them so every field the hub
 * serves is stored locally — the legacy API responses are unaffected (they select
 * explicit columns).
 *
 *   main_diags:  + arTitle
 *   diagnoses:   + icdArName, description, arDescription
 *   proc_cpts:   + arTitle, arDescription
 *
 * All nullable text; values land on the next mirror resync.
 */
export class HonestMirrorAllHubFields1783782610100 implements MigrationInterface {
  name = "HonestMirrorAllHubFields1783782610100";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "main_diags" ADD COLUMN "arTitle" text`);
    await queryRunner.query(`ALTER TABLE "diagnoses" ADD COLUMN "icdArName" text`);
    await queryRunner.query(`ALTER TABLE "diagnoses" ADD COLUMN "description" text`);
    await queryRunner.query(`ALTER TABLE "diagnoses" ADD COLUMN "arDescription" text`);
    await queryRunner.query(`ALTER TABLE "proc_cpts" ADD COLUMN "arTitle" text`);
    await queryRunner.query(`ALTER TABLE "proc_cpts" ADD COLUMN "arDescription" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "proc_cpts" DROP COLUMN "arDescription"`);
    await queryRunner.query(`ALTER TABLE "proc_cpts" DROP COLUMN "arTitle"`);
    await queryRunner.query(`ALTER TABLE "diagnoses" DROP COLUMN "arDescription"`);
    await queryRunner.query(`ALTER TABLE "diagnoses" DROP COLUMN "description"`);
    await queryRunner.query(`ALTER TABLE "diagnoses" DROP COLUMN "icdArName"`);
    await queryRunner.query(`ALTER TABLE "main_diags" DROP COLUMN "arTitle"`);
  }
}
