import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Remove the legacy additional-questions system entirely (staged rebuild).
 *
 * The six-flag `additional_questions` config table and the 6 inline answer columns on
 * `submissions` (spOrCran/pos/approach/region/clinPres/IntEvents) are fully superseded by
 * the hub's dynamic-questions framework (ref_questions / ref_question_options /
 * main_diag_questions / main_diag_question_options) and the flexible answer store
 * (submission_question_answers, already backfilled). Nothing reads these anymore — the
 * report/AI consumers resolve the named values from the answer store at read time.
 */
export class DropLegacyAdditionalQuestions1783782610060 implements MigrationInterface {
  name = "DropLegacyAdditionalQuestions1783782610060";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN IF EXISTS "spOrCran"`);
    await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN IF EXISTS "pos"`);
    await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN IF EXISTS "approach"`);
    await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN IF EXISTS "region"`);
    await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN IF EXISTS "clinPres"`);
    await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN IF EXISTS "IntEvents"`);
    await queryRunner.query(`DROP TABLE IF EXISTS "additional_questions"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Re-create the six-flag config table (structure only) and the 6 answer columns.
    await queryRunner.query(`
      CREATE TABLE IF NOT EXISTS "additional_questions" (
        "mainDiagDocId" uuid NOT NULL,
        "spOrCran" smallint NOT NULL DEFAULT 0,
        "pos" smallint NOT NULL DEFAULT 0,
        "approach" smallint NOT NULL DEFAULT 0,
        "region" smallint NOT NULL DEFAULT 0,
        "clinPres" smallint NOT NULL DEFAULT 0,
        "intEvents" smallint NOT NULL DEFAULT 0,
        CONSTRAINT "PK_additional_questions" PRIMARY KEY ("mainDiagDocId")
      )
    `);
    await queryRunner.query(`ALTER TABLE "submissions" ADD "IntEvents" text`);
    await queryRunner.query(`ALTER TABLE "submissions" ADD "spOrCran" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "submissions" ADD "pos" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "submissions" ADD "approach" character varying(255)`);
    await queryRunner.query(`ALTER TABLE "submissions" ADD "clinPres" text`);
    await queryRunner.query(`ALTER TABLE "submissions" ADD "region" character varying(50)`);
  }
}
