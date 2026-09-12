import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Journal-club eliminator: the candidate-facing twin of the supervisor lecture
 * eliminator (src/eliminator/). Candidates claim one journal each against the
 * SAME pool of dates the lecture eliminator uses, so a Thursday's date and its
 * on-site/online mode are stated once and can never drift between the two.
 *
 * The two bookings are independent dimensions of the same date: a Thursday can
 * hold `capacity` lectures AND `journalCapacity` journals. That is why this adds
 * a second counter to `eliminator_slots` rather than a parallel slots table.
 *
 * `journalsOpen` is the super-admin switch, and it defaults to FALSE: enabling a
 * new public booking surface must be a deliberate act, never a side effect of
 * running a migration.
 */
export class CreateJournalEliminator1783782610320 implements MigrationInterface {
  name = "CreateJournalEliminator1783782610320";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "eliminator_campaigns" ADD COLUMN "journalsOpen" boolean NOT NULL DEFAULT false`
    );

    // Per-date journal capacity. Lives on the slot row (not as a schema default the
    // app relies on) so a single Thursday can later be raised to 2 with a one-row
    // UPDATE, the same way the lecture capacity is managed.
    await queryRunner.query(
      `ALTER TABLE "eliminator_slots" ADD COLUMN "journalCapacity" integer NOT NULL DEFAULT 1`
    );
    await queryRunner.query(
      `ALTER TABLE "eliminator_slots" ADD COLUMN "journalReservedCount" integer NOT NULL DEFAULT 0`
    );
    await queryRunner.query(
      `ALTER TABLE "eliminator_slots" ADD CONSTRAINT "CHK_elim_slot_journal_capacity"
         CHECK ("journalReservedCount" >= 0 AND "journalReservedCount" <= "journalCapacity")`
    );

    await queryRunner.query(`
      CREATE TABLE "journal_reservations" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "campaignId" uuid NOT NULL,
        "slotId" uuid NOT NULL,
        "journalId" uuid NOT NULL,
        "candidateId" uuid NOT NULL,
        "eventId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_jelim_res_campaign" FOREIGN KEY ("campaignId") REFERENCES "eliminator_campaigns"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_jelim_res_slot" FOREIGN KEY ("slotId") REFERENCES "eliminator_slots"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_jelim_res_journal" FOREIGN KEY ("journalId") REFERENCES "journals"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_jelim_res_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_jelim_res_event" FOREIGN KEY ("eventId") REFERENCES "events"("id") ON DELETE SET NULL
      )
    `);

    // These two UNIQUE indexes ARE the elimination rules, enforced by the database so
    // two concurrent submits can never both win:
    //   - a journal, once claimed, is gone from every other candidate's list
    //   - a candidate holds at most one journal in a campaign
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_jelim_res_campaign_journal" ON "journal_reservations" ("campaignId", "journalId")`
    );
    await queryRunner.query(
      `CREATE UNIQUE INDEX "IDX_jelim_res_campaign_candidate" ON "journal_reservations" ("campaignId", "candidateId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "journal_reservations"`);
    await queryRunner.query(
      `ALTER TABLE "eliminator_slots" DROP CONSTRAINT "CHK_elim_slot_journal_capacity"`
    );
    await queryRunner.query(`ALTER TABLE "eliminator_slots" DROP COLUMN "journalReservedCount"`);
    await queryRunner.query(`ALTER TABLE "eliminator_slots" DROP COLUMN "journalCapacity"`);
    await queryRunner.query(`ALTER TABLE "eliminator_campaigns" DROP COLUMN "journalsOpen"`);
  }
}
