import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Seeds the NS "2026-2027" lecture-eliminator campaign: one campaign row +
 * the 38 bookable Thursdays (with their online/on-site flag), sourced verbatim
 * from the user-supplied schedule sheet (column A = date, column F = online
 * Yes/No; column C deliberately ignored per the user). Two intentional gaps
 * in the Thursday sequence (11-Mar-2027, 20-May-2027) are preserved as-is -
 * not bugs, the source sheet skips them (holidays).
 *
 * The campaign id is a fixed, pre-generated UUID (not `gen_random_uuid()`) so
 * the public booking link can be handed out before this migration even runs:
 * https://<frontend>/eliminator/a378463f-ae99-4549-bda7-0febd1feec43
 */
const CAMPAIGN_ID = "a378463f-ae99-4549-bda7-0febd1feec43";

const SLOTS: Array<[string, boolean]> = [
  ["2026-09-24", true],
  ["2026-10-01", false],
  ["2026-10-08", true],
  ["2026-10-15", false],
  ["2026-10-22", false],
  ["2026-10-29", true],
  ["2026-11-05", false],
  ["2026-11-12", false],
  ["2026-11-19", false],
  ["2026-11-26", true],
  ["2026-12-03", false],
  ["2026-12-10", false],
  ["2026-12-17", false],
  ["2026-12-24", true],
  ["2026-12-31", false],
  ["2027-01-07", true],
  ["2027-01-14", false],
  ["2027-01-21", false],
  ["2027-02-04", false],
  ["2027-02-11", true],
  ["2027-02-18", true],
  ["2027-02-25", true],
  ["2027-03-04", true],
  ["2027-03-18", false],
  ["2027-03-25", true],
  ["2027-04-01", false],
  ["2027-04-08", false],
  ["2027-04-15", false],
  ["2027-04-22", false],
  ["2027-04-29", true],
  ["2027-05-06", true],
  ["2027-05-13", false],
  ["2027-05-27", true],
  ["2027-06-03", false],
  ["2027-06-10", true],
  ["2027-06-17", false],
  ["2027-06-24", false],
  ["2027-07-01", true],
];

export class SeedNsEliminatorCampaign20261783782610270 implements MigrationInterface {
  name = "SeedNsEliminatorCampaign20261783782610270";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const deptRows = await queryRunner.query(
      `SELECT "id" FROM "departments" WHERE "code" = 'NS'`
    );
    const departmentId = deptRows[0]?.id;
    if (!departmentId) {
      throw new Error("SeedNsEliminatorCampaign2026: NS department not found in mirror");
    }

    await queryRunner.query(
      `INSERT INTO "eliminator_campaigns" ("id", "label", "departmentId")
       VALUES ($1, $2, $3)`,
      [CAMPAIGN_ID, "NS Academic Year 2026-2027", departmentId]
    );

    for (const [date, isOnline] of SLOTS) {
      await queryRunner.query(
        `INSERT INTO "eliminator_slots" ("campaignId", "date", "isOnline")
         VALUES ($1, $2, $3)`,
        [CAMPAIGN_ID, date, isOnline]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Reservations (if any were made) block a plain campaign delete via FK RESTRICT
    // on eliminator_reservations - CASCADE on eliminator_campaigns handles slots, but
    // reservations reference the campaign too, so wipe them explicitly first.
    await queryRunner.query(`DELETE FROM "eliminator_reservations" WHERE "campaignId" = $1`, [
      CAMPAIGN_ID,
    ]);
    await queryRunner.query(`DELETE FROM "eliminator_campaigns" WHERE "id" = $1`, [CAMPAIGN_ID]);
  }
}
