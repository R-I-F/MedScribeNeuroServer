import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds creator attribution to events (docs/ACTIVE_USERS_ANALYTICS_PLAN.md, Stage A3).
 * `events` had no creator column, so CM/clerk event-creation could not be attributed.
 * Stamped from the JWT at POST /event going forward; legacy rows stay NULL and are
 * excluded from the `event_create` activity signal (never guessed).
 */
export class AddEventCreator1783782610190 implements MigrationInterface {
  name = "AddEventCreator1783782610190";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" ADD "createdBy" uuid`);
    await queryRunner.query(
      `ALTER TABLE "events" ADD "createdByRole" character varying(32)`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_events_createdBy" ON "events" ("createdBy")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_events_createdBy"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "createdByRole"`);
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN "createdBy"`);
  }
}
