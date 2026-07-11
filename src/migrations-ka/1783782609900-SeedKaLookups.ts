import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Seeds the KA lookup tables (positions / approaches / regions — same lists the
 * legacy 1735000110002 MySQL migration seeded for the production tenants) and
 * creates the single-row `ref_sync_state` table used by the reference-mirror sync
 * (KA-spoke plan Stage D) to record the last synced hub dataVersion.
 */

const POSITIONS = ["supine", "prone", "lateral", "concorde", "other"] as const;

const APPROACHES = [
  "pterional",
  "endonasal",
  "suboccipital",
  "retrosigmoid",
  "petrosal",
  "supraorbital",
  "transventricular (callosal)",
  "transventricular (frontal)",
  "subfrontal",
  "occipital",
  "laminectomy",
  "laminoplasty",
  "transoral",
  "transthoracic",
  "other",
] as const;

const REGIONS = ["craniocervical", "cervical", "dorsal", "lumbar"] as const;

export class SeedKaLookups1783782609900 implements MigrationInterface {
  name = "SeedKaLookups1783782609900";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const name of POSITIONS) {
      await queryRunner.query(
        `INSERT INTO "positions" ("id", "position") VALUES (gen_random_uuid()::text, $1)`,
        [name]
      );
    }
    for (const name of APPROACHES) {
      await queryRunner.query(
        `INSERT INTO "approaches" ("id", "approach") VALUES (gen_random_uuid()::text, $1)`,
        [name]
      );
    }
    for (const name of REGIONS) {
      await queryRunner.query(
        `INSERT INTO "regions" ("id", "region") VALUES (gen_random_uuid()::text, $1)`,
        [name]
      );
    }

    await queryRunner.query(`
      CREATE TABLE "ref_sync_state" (
        "id" smallint PRIMARY KEY DEFAULT 1 CHECK ("id" = 1),
        "dataVersion" character varying(50),
        "syncedAt" TIMESTAMP
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "ref_sync_state"`);
    await queryRunner.query(`DELETE FROM "regions" WHERE "region" = ANY($1)`, [
      [...REGIONS],
    ]);
    await queryRunner.query(`DELETE FROM "approaches" WHERE "approach" = ANY($1)`, [
      [...APPROACHES],
    ]);
    await queryRunner.query(`DELETE FROM "positions" WHERE "position" = ANY($1)`, [
      [...POSITIONS],
    ]);
  }
}
