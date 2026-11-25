import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Per-event attendance override.
 *
 * Candidates normally self-register only on the event day or the day after. When
 * `attendanceOpen` is true the institute admin has opened registration for this event
 * regardless of the date (e.g. a multi-day conference); setting it back to false returns
 * the event to the normal window. Additive only, every existing row gets false.
 */
export class AddEventAttendanceOpen1783782610370 implements MigrationInterface {
  name = "AddEventAttendanceOpen1783782610370";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "events" ADD COLUMN IF NOT EXISTS "attendanceOpen" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "events" DROP COLUMN IF EXISTS "attendanceOpen"`);
  }
}
