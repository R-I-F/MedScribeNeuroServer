import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Seeds the REAL six-flag values for the KA (NS) additional_questions config rows.
 *
 * Source of truth: production `kasr-el-ainy` MySQL database, captured READ-ONLY on
 * 2026-07-11 (`SELECT md.title, aq.* FROM additional_questions aq JOIN main_diags md`).
 * Cross-checked: the 14 nonzero flags match the scaled-framework capture of the same
 * production truth (hub migration 1750000000158 — "NS = 14 links", 2026-07-08).
 *
 * Title-keyed (not id-keyed) so it applies to the mirror rows regardless of hub UUIDs.
 * The mirror sync only INSERTs missing all-zero rows (ON CONFLICT DO NOTHING) and never
 * overwrites, so these values survive re-syncs.
 */

const FLAGS: Record<
  string,
  { spOrCran: number; pos: number; approach: number; region: number; clinPres: number; intEvents: number }
> = {
  "cns infection": { spOrCran: 0, pos: 0, approach: 0, region: 0, clinPres: 0, intEvents: 1 },
  "cns tumors": { spOrCran: 1, pos: 1, approach: 1, region: 0, clinPres: 0, intEvents: 1 },
  "congenital anomalies, infantile hydrocephalus": { spOrCran: 0, pos: 0, approach: 0, region: 0, clinPres: 0, intEvents: 1 },
  "cranial trauma": { spOrCran: 0, pos: 0, approach: 0, region: 0, clinPres: 0, intEvents: 1 },
  "csf disorders- other than infantile hydrocephalus": { spOrCran: 0, pos: 0, approach: 0, region: 0, clinPres: 0, intEvents: 1 },
  "functional neurosurgery": { spOrCran: 0, pos: 0, approach: 0, region: 0, clinPres: 1, intEvents: 1 },
  "neuro-vascular diseases": { spOrCran: 0, pos: 0, approach: 0, region: 0, clinPres: 1, intEvents: 0 },
  "peripheral nerve diseases": { spOrCran: 0, pos: 0, approach: 0, region: 0, clinPres: 0, intEvents: 0 },
  "spinal degenerative diseases": { spOrCran: 0, pos: 0, approach: 0, region: 1, clinPres: 0, intEvents: 1 },
  "spinal trauma": { spOrCran: 0, pos: 0, approach: 0, region: 0, clinPres: 0, intEvents: 1 },
};

export class SeedKaSixFlags1783782609910 implements MigrationInterface {
  name = "SeedKaSixFlags1783782609910";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [title, f] of Object.entries(FLAGS)) {
      const result = await queryRunner.query(
        `UPDATE "additional_questions" aq
            SET "spOrCran" = $1, "pos" = $2, "approach" = $3,
                "region" = $4, "clinPres" = $5, "intEvents" = $6
           FROM "main_diags" md
          WHERE aq."mainDiagDocId" = md."id"::text AND md."title" = $7`,
        [f.spOrCran, f.pos, f.approach, f.region, f.clinPres, f.intEvents, title]
      );
      // result shape: [rows, affectedCount] for UPDATE via pg driver
      const affected = Array.isArray(result) ? result[1] : undefined;
      if (affected === 0) {
        console.warn(`[SeedKaSixFlags] no additional_questions row matched title "${title}" — skipped`);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const title of Object.keys(FLAGS)) {
      await queryRunner.query(
        `UPDATE "additional_questions" aq
            SET "spOrCran" = 0, "pos" = 0, "approach" = 0,
                "region" = 0, "clinPres" = 0, "intEvents" = 0
           FROM "main_diags" md
          WHERE aq."mainDiagDocId" = md."id"::text AND md."title" = $1`,
        [title]
      );
    }
  }
}
