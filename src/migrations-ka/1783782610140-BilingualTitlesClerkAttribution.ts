import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Bilingual clerk-proc titles + clerk attribution + delta-sync state
 * (docs/CLERK_PROCS_BILINGUAL_TITLES_AND_DELTA_SYNC_PLAN.md, Stage A).
 *
 *   clerk_procs: + titleAr/titleEn — the clerk's phrase in both languages. The typed-language
 *     slot is the raw phrase verbatim; the other slot is an aiAgent TRANSLATION (meaning,
 *     unlike patient names which are transliterated). NULL = pending/failed, retryable.
 *   cal_surgs: + clerkId FK → clerks. Per user directive (plan §4.4) ALL source rows are
 *     NS-scoped and belong to clerk 45eb7fb8-… unless uploaded by someone else — no uploader
 *     evidence exists in the source, so the backfill applies the default to every row.
 *   clerk_procs.clerkId: the 81 legacy rows are re-attributed to the same clerk (plan Q9,
 *     superseding the parent plan's NULL decision).
 *   prod_sync_state: watermark table for the incremental prod→ka delta sync (plan §4.2).
 */
export class BilingualTitlesClerkAttribution1783782610140 implements MigrationInterface {
  name = "BilingualTitlesClerkAttribution1783782610140";

  /** The single existing clerk (Mohamed Ismail) — verified the only ka clerks row. */
  private static readonly DEFAULT_CLERK_ID = "45eb7fb8-b9af-4bdd-90c8-8519cb4ce472";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const clerkId = BilingualTitlesClerkAttribution1783782610140.DEFAULT_CLERK_ID;

    // Guard: the directive's clerk must exist (FK would fail later anyway — fail loud here).
    const clerk = await queryRunner.query(`SELECT "id" FROM "clerks" WHERE "id" = $1`, [clerkId]);
    if (!clerk?.length) {
      throw new Error(`Default clerk ${clerkId} not found in clerks — refusing to backfill attribution`);
    }

    await queryRunner.query(`ALTER TABLE "clerk_procs" ADD COLUMN "titleAr" text`);
    await queryRunner.query(`ALTER TABLE "clerk_procs" ADD COLUMN "titleEn" text`);

    await queryRunner.query(`ALTER TABLE "cal_surgs" ADD COLUMN "clerkId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "cal_surgs" ADD CONSTRAINT "FK_cal_surgs_clerk" FOREIGN KEY ("clerkId") REFERENCES "clerks"("id") ON DELETE SET NULL`
    );
    await queryRunner.query(`UPDATE "cal_surgs" SET "clerkId" = $1 WHERE "clerkId" IS NULL`, [clerkId]);
    await queryRunner.query(`UPDATE "clerk_procs" SET "clerkId" = $1 WHERE "clerkId" IS NULL`, [clerkId]);

    await queryRunner.query(
      `CREATE TABLE "prod_sync_state" (
        "tableName" varchar(64) NOT NULL,
        "lastProdUpdatedAt" TIMESTAMP,
        "lastRunAt" TIMESTAMP,
        "lastReport" jsonb,
        CONSTRAINT "PK_prod_sync_state" PRIMARY KEY ("tableName")
      )`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const clerkId = BilingualTitlesClerkAttribution1783782610140.DEFAULT_CLERK_ID;
    await queryRunner.query(`DROP TABLE "prod_sync_state"`);
    // NB: at up() time every clerk_procs.clerkId was NULL (verified), so this revert is exact.
    await queryRunner.query(`UPDATE "clerk_procs" SET "clerkId" = NULL WHERE "clerkId" = $1`, [clerkId]);
    await queryRunner.query(`ALTER TABLE "cal_surgs" DROP CONSTRAINT "FK_cal_surgs_clerk"`);
    await queryRunner.query(`ALTER TABLE "cal_surgs" DROP COLUMN "clerkId"`);
    await queryRunner.query(`ALTER TABLE "clerk_procs" DROP COLUMN "titleEn"`);
    await queryRunner.query(`ALTER TABLE "clerk_procs" DROP COLUMN "titleAr"`);
  }
}
