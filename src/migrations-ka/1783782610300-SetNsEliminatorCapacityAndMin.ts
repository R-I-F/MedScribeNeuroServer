import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Two user-requested rule changes to the NS 2026-2027 eliminator round, applied to the
 * CAMPAIGN (not to a form): both public entry points - the base campaign link and the
 * "New Lectures Only" form - read the same campaign row and the same slot pool, so a
 * single update here governs both, and a date filled through either one is gone from
 * both.
 *
 * 1. A Thursday now holds 2 lectures instead of 3, then drops out of the pool
 *    (`eliminator_slots.capacity`, enforced by the conditional
 *    `UPDATE ... WHERE "reservedCount" < "capacity"` seat claim). 38 dates x 2 = 76
 *    bookable seats for the academic year, down from 114.
 * 2. The soft floor a first-time supervisor must clear in one submission drops from 2
 *    lectures to 1 (`eliminator_campaigns.minPerSupervisor`). The maximum stays 5.
 *
 * `slotsPerDay` on the campaign is descriptive (the per-slot `capacity` column is what
 * the booking path actually enforces), but it is moved in step so the row cannot be read
 * two ways.
 *
 * Capacity is lowered to GREATEST(2, "reservedCount"): a date that had somehow already
 * taken 3 bookings keeps room for them rather than violating CHK_elim_slot_capacity or
 * implying a booking should be cancelled. At the time of writing the campaign has 0
 * reservations, so every one of the 38 dates lands on exactly 2.
 *
 * The `eliminator_campaigns`/`eliminator_slots` column DEFAULTS (3) are deliberately left
 * alone: they only seed a FUTURE campaign, whose own numbers should be a fresh decision.
 */
const CAMPAIGN_ID = "a378463f-ae99-4549-bda7-0febd1feec43";

const NEW_CAPACITY = 2;
const NEW_MIN_PER_SUPERVISOR = 1;

const OLD_CAPACITY = 3;
const OLD_MIN_PER_SUPERVISOR = 2;

async function applyRules(
  queryRunner: QueryRunner,
  capacity: number,
  slotsPerDay: number,
  minPerSupervisor: number
): Promise<void> {
  // Plain SELECT rather than UPDATE ... RETURNING: query() wraps a RETURNING result as
  // [rows, affectedCount], which is easy to misread into a check that never fires.
  const existing = await queryRunner.query(
    `SELECT "id" FROM "eliminator_campaigns" WHERE "id" = $1`,
    [CAMPAIGN_ID]
  );
  if (existing.length === 0) {
    throw new Error(`SetNsEliminatorCapacityAndMin: campaign ${CAMPAIGN_ID} not found`);
  }

  await queryRunner.query(
    `UPDATE "eliminator_campaigns"
        SET "slotsPerDay" = $2, "minPerSupervisor" = $3, "updatedAt" = now()
      WHERE "id" = $1`,
    [CAMPAIGN_ID, slotsPerDay, minPerSupervisor]
  );

  await queryRunner.query(
    `UPDATE "eliminator_slots"
        SET "capacity" = GREATEST($2, "reservedCount")
      WHERE "campaignId" = $1`,
    [CAMPAIGN_ID, capacity]
  );

  const [totals] = await queryRunner.query(
    `SELECT count(*)::int AS slots, sum("capacity")::int AS seats, sum("reservedCount")::int AS reserved
       FROM "eliminator_slots" WHERE "campaignId" = $1`,
    [CAMPAIGN_ID]
  );
  console.log(
    `[SetNsEliminatorCapacityAndMin] ${totals.slots} dates, ${totals.seats} seats ` +
      `(${capacity}/date requested), ${totals.reserved} already reserved, min ${minPerSupervisor}`
  );
}

export class SetNsEliminatorCapacityAndMin1783782610300 implements MigrationInterface {
  name = "SetNsEliminatorCapacityAndMin1783782610300";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await applyRules(queryRunner, NEW_CAPACITY, NEW_CAPACITY, NEW_MIN_PER_SUPERVISOR);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await applyRules(queryRunner, OLD_CAPACITY, OLD_CAPACITY, OLD_MIN_PER_SUPERVISOR);
  }
}
