import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Fixes Arabic terminology hallucination: AI used "دماغ" (colloquial) instead of
 * "مخ" (correct medical term) throughout NS diagnoses and proc_cpts.
 * All word forms are covered by a single substring replacement:
 *   دماغ → مخ  (also fixes: الدماغ→المخ, دماغي→مخي, دماغية→مخية, etc.)
 * Embeddings are nulled on every changed row so the backfill re-embeds fresh text.
 */
export class FixNsBrainArabicTerminology1750000000051 implements MigrationInterface {
  name = "FixNsBrainArabicTerminology1750000000051";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── diagnoses: fix icdArName and arDescription ────────────────────────
    await queryRunner.query(`
      UPDATE "diagnoses"
      SET
        "icdArName"     = REPLACE("icdArName",     'دماغ', 'مخ'),
        "arDescription" = REPLACE("arDescription", 'دماغ', 'مخ'),
        "embedding"     = NULL
      WHERE "icdArName" LIKE '%دماغ%' OR "arDescription" LIKE '%دماغ%'
    `);

    // ── proc_cpts: fix ar_title and ar_description ────────────────────────
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET
        "ar_title"       = REPLACE("ar_title",       'دماغ', 'مخ'),
        "ar_description" = REPLACE("ar_description", 'دماغ', 'مخ'),
        "embedding"      = NULL
      WHERE "ar_title" LIKE '%دماغ%' OR "ar_description" LIKE '%دماغ%'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "diagnoses"
      SET
        "icdArName"     = REPLACE("icdArName",     'مخ', 'دماغ'),
        "arDescription" = REPLACE("arDescription", 'مخ', 'دماغ'),
        "embedding"     = NULL
      WHERE "icdArName" LIKE '%مخ%' OR "arDescription" LIKE '%مخ%'
    `);

    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET
        "ar_title"       = REPLACE("ar_title",       'مخ', 'دماغ'),
        "ar_description" = REPLACE("ar_description", 'مخ', 'دماغ'),
        "embedding"      = NULL
      WHERE "ar_title" LIKE '%مخ%' OR "ar_description" LIKE '%مخ%'
    `);
  }
}
