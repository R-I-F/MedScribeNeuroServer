import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Flexible per-submission answer store for the dynamic additional-questions framework.
 *
 * Replaces the six fixed inline answer columns on `submissions`
 * (spOrCran/pos/approach/region/clinPres/IntEvents) with one row per answered question,
 * keyed to the mirrored `ref_questions` / `ref_question_options`. Choice answers keep BOTH
 * the resolved `optionId` (when the value matches a mirror option) AND the raw `value`
 * (always) — so nothing is lost even if an option is renamed/removed upstream. Free-text
 * answers carry `value` only.
 *
 * ADDITIVE / dual-read: the six legacy columns stay in place and authoritative until the
 * frontend cutover; this table is backfilled from them (a later data-migration step) and
 * read alongside them. No legacy column is dropped here.
 */
export class AddSubmissionQuestionAnswers1783782610050 implements MigrationInterface {
  name = "AddSubmissionQuestionAnswers1783782610050";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "submission_question_answers" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "submissionId" uuid NOT NULL,
        "questionId" uuid NOT NULL,
        "optionId" uuid,
        "value" text,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_submission_question_answers" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_submission_question" UNIQUE ("submissionId", "questionId"),
        CONSTRAINT "FK_sqa_submission"
          FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_sqa_question"
          FOREIGN KEY ("questionId") REFERENCES "ref_questions"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_sqa_option"
          FOREIGN KEY ("optionId") REFERENCES "ref_question_options"("id") ON DELETE RESTRICT
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_sqa_submission" ON "submission_question_answers" ("submissionId")`);
    await queryRunner.query(`CREATE INDEX "IDX_sqa_question" ON "submission_question_answers" ("questionId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "submission_question_answers"`);
  }
}
