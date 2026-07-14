import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Conform the `lectures` mirror to the hub's scaled lectures framework (LibelusRefApi migration 188)
 * and finish removing the legacy per-tenant lecture system (user 2026-07-14):
 *   - drop `google_uid` (legacy Google-sheet key; hub dropped it) and its unique index
 *   - drop `mainTopic` (now derived from the topic via `topicId`)
 *   - rename `lectureTitle` → `title`
 *
 * The PK is already the hub UUID (kept as-is). Lecture CRUD is removed from the app; attendance
 * bulk-import now resolves lectures by `lectureNumber`/`title` instead of `google_uid`.
 */
export class ConformLecturesToHubSchema1783782610090 implements MigrationInterface {
  name = "ConformLecturesToHubSchema1783782610090";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lectures" DROP COLUMN IF EXISTS "google_uid"`);
    await queryRunner.query(`ALTER TABLE "lectures" DROP COLUMN IF EXISTS "mainTopic"`);
    await queryRunner.query(`ALTER TABLE "lectures" RENAME COLUMN "lectureTitle" TO "title"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "lectures" RENAME COLUMN "title" TO "lectureTitle"`);
    await queryRunner.query(`ALTER TABLE "lectures" ADD COLUMN "mainTopic" text`);
    await queryRunner.query(`ALTER TABLE "lectures" ADD COLUMN "google_uid" varchar(255)`);
    await queryRunner.query(`ALTER TABLE "lectures" ADD CONSTRAINT "UQ_lectures_google_uid" UNIQUE ("google_uid")`);
  }
}
