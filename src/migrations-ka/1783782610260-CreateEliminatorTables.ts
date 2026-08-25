import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Lecture "eliminator" booking framework: a public, no-login form where a
 * department's supervisors claim open academic lectures against a fixed pool
 * of dates. See src/eliminator/ + docs discussion for the full design.
 *
 * `eliminator_campaigns` - one per department/academic-year run.
 * `eliminator_slots`     - the bookable dates for a campaign (capacity/reservedCount).
 * `eliminator_reservations` - confirmed (lecture, date) claims; UNIQUE(campaignId,
 *   lectureId) is what hard-locks a lecture out of the pool once taken.
 */
export class CreateEliminatorTables1783782610260 implements MigrationInterface {
  name = "CreateEliminatorTables1783782610260";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "eliminator_campaigns" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "label" character varying(120) NOT NULL,
        "departmentId" uuid NOT NULL,
        "slotsPerDay" integer NOT NULL DEFAULT 3,
        "minPerSupervisor" integer NOT NULL DEFAULT 2,
        "maxPerSupervisor" integer NOT NULL DEFAULT 5,
        "onsiteTime" character varying(5) NOT NULL DEFAULT '10:00',
        "onlineTime" character varying(5) NOT NULL DEFAULT '22:00',
        "isActive" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_elim_campaign_department" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT
      )
    `);

    await queryRunner.query(`
      CREATE TABLE "eliminator_slots" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "campaignId" uuid NOT NULL,
        "date" date NOT NULL,
        "isOnline" boolean NOT NULL,
        "capacity" integer NOT NULL DEFAULT 3,
        "reservedCount" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_elim_slot_campaign" FOREIGN KEY ("campaignId") REFERENCES "eliminator_campaigns"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_elim_slot_capacity" CHECK ("reservedCount" >= 0 AND "reservedCount" <= "capacity")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_elim_slot_campaign_date" ON "eliminator_slots" ("campaignId", "date")`
    );

    await queryRunner.query(`
      CREATE TABLE "eliminator_reservations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "campaignId" uuid NOT NULL,
        "slotId" uuid NOT NULL,
        "lectureId" uuid NOT NULL,
        "supervisorId" uuid NOT NULL,
        "eventId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_elim_res_campaign" FOREIGN KEY ("campaignId") REFERENCES "eliminator_campaigns"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_elim_res_slot" FOREIGN KEY ("slotId") REFERENCES "eliminator_slots"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_elim_res_lecture" FOREIGN KEY ("lectureId") REFERENCES "lectures"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_elim_res_supervisor" FOREIGN KEY ("supervisorId") REFERENCES "supervisors"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_elim_res_event" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_elim_res_campaign_lecture" ON "eliminator_reservations" ("campaignId", "lectureId")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_elim_res_campaign_supervisor" ON "eliminator_reservations" ("campaignId", "supervisorId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "eliminator_reservations"`);
    await queryRunner.query(`DROP TABLE "eliminator_slots"`);
    await queryRunner.query(`DROP TABLE "eliminator_campaigns"`);
  }
}
