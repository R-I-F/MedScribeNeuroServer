import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Mirror tables for the hub's dynamic additional-questions framework (LibelusRefApi).
 *
 * The hub owns per-department question definitions, options, and per-main-diag narrowing,
 * served at /v1/refAdditionalQuestions/*. These four tables are the local mirror (synced by
 * RefMirrorService, hub UUIDs preserved as PKs — same rule as every other mirror table):
 *   - ref_questions               (question definitions, department-scoped)
 *   - ref_question_options        (answer options per question)
 *   - main_diag_questions         (which questions attach to a main_diag, effective isRequired/sortOrder)
 *   - main_diag_question_options  (the narrowed option set per main_diag+question)
 *
 * Named ref_questions/ref_question_options (not additional_questions) to avoid colliding with
 * the legacy six-flag `additional_questions` table, which is retired in a later stage. The
 * two link tables are rebuilt on every sync (like department_diagnoses).
 */
export class MirrorRefQuestions1783782610040 implements MigrationInterface {
  name = "MirrorRefQuestions1783782610040";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "ref_questions" (
        "id" uuid NOT NULL,
        "departmentId" uuid NOT NULL,
        "key" character varying(100) NOT NULL,
        "label" character varying(255) NOT NULL,
        "arLabel" character varying(255),
        "inputType" character varying(20) NOT NULL,
        "isRequired" boolean NOT NULL DEFAULT false,
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ref_questions" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ref_questions_department"
          FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_ref_questions_department" ON "ref_questions" ("departmentId")`);

    await queryRunner.query(`
      CREATE TABLE "ref_question_options" (
        "id" uuid NOT NULL,
        "questionId" uuid NOT NULL,
        "value" character varying(255) NOT NULL,
        "arValue" character varying(255),
        "sortOrder" integer NOT NULL DEFAULT 0,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_ref_question_options" PRIMARY KEY ("id"),
        CONSTRAINT "FK_ref_question_options_question"
          FOREIGN KEY ("questionId") REFERENCES "ref_questions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_ref_question_options_question" ON "ref_question_options" ("questionId")`);

    await queryRunner.query(`
      CREATE TABLE "main_diag_questions" (
        "mainDiagId" uuid NOT NULL,
        "questionId" uuid NOT NULL,
        "isRequired" boolean NOT NULL DEFAULT false,
        "sortOrder" integer NOT NULL DEFAULT 0,
        CONSTRAINT "PK_main_diag_questions" PRIMARY KEY ("mainDiagId", "questionId"),
        CONSTRAINT "FK_main_diag_questions_main_diag"
          FOREIGN KEY ("mainDiagId") REFERENCES "main_diags"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_main_diag_questions_question"
          FOREIGN KEY ("questionId") REFERENCES "ref_questions"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_main_diag_questions_question" ON "main_diag_questions" ("questionId")`);

    await queryRunner.query(`
      CREATE TABLE "main_diag_question_options" (
        "mainDiagId" uuid NOT NULL,
        "questionId" uuid NOT NULL,
        "optionId" uuid NOT NULL,
        CONSTRAINT "PK_main_diag_question_options" PRIMARY KEY ("mainDiagId", "questionId", "optionId"),
        CONSTRAINT "FK_mdqo_main_diag"
          FOREIGN KEY ("mainDiagId") REFERENCES "main_diags"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_mdqo_question"
          FOREIGN KEY ("questionId") REFERENCES "ref_questions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_mdqo_option"
          FOREIGN KEY ("optionId") REFERENCES "ref_question_options"("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_mdqo_option" ON "main_diag_question_options" ("optionId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "main_diag_question_options"`);
    await queryRunner.query(`DROP TABLE "main_diag_questions"`);
    await queryRunner.query(`DROP TABLE "ref_question_options"`);
    await queryRunner.query(`DROP TABLE "ref_questions"`);
  }
}
