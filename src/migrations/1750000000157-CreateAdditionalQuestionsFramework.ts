import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Scaled additional-questions framework (defaultdb reference data).
 *
 * Replaces the legacy per-tenant six-flag model (spOrCran/pos/approach/region/clinPres/intEvents
 * columns + tenant-global positions/approaches/regions tables) with a generic, per-department,
 * per-mainDiag question framework: QUESTIONS ARE ROWS, NOT COLUMNS.
 *
 *  - additional_questions        question definitions, owned by a department (stable camelCase
 *                                "key" e.g. surgicalDomain/position/approach/region/
 *                                clinicalPresentation/intraopEvents; bilingual label; inputType
 *                                single_choice | multi_choice | free_text)
 *  - question_options            bilingual answer choices per question (free_text → no rows)
 *  - main_diag_questions         which questions appear for a main_diag (replaces the six flags),
 *                                with optional per-diag isRequired/sortOrder overrides
 *  - main_diag_question_options  optional per-mainDiag option narrowing: no rows for a
 *                                (mainDiag, question) = ALL of the question's options apply;
 *                                rows present = only that subset
 *
 * Integrity rule enforced at app/seed level (no trigger): a linked question and main_diag must
 * belong to the same department.
 *
 * Full design: docs/ADDITIONAL_QUESTIONS_SCALED_FRAMEWORK_PLAN.md
 */
export class CreateAdditionalQuestionsFramework1750000000157 implements MigrationInterface {
  name = "CreateAdditionalQuestionsFramework1750000000157";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "additional_questions" (
        "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
        "departmentId" UUID NOT NULL,
        "key"          VARCHAR(50) NOT NULL,
        "label"        VARCHAR(200) NOT NULL,
        "arLabel"      VARCHAR(200),
        "inputType"    VARCHAR(20) NOT NULL,
        "isRequired"   BOOLEAN NOT NULL DEFAULT FALSE,
        "sortOrder"    INTEGER NOT NULL DEFAULT 0,
        "isActive"     BOOLEAN NOT NULL DEFAULT TRUE,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_additional_questions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_additional_questions_dept_key" UNIQUE ("departmentId", "key"),
        CONSTRAINT "FK_additional_questions_department" FOREIGN KEY ("departmentId")
          REFERENCES "departments" ("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_additional_questions_inputType"
          CHECK ("inputType" IN ('single_choice', 'multi_choice', 'free_text'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_additional_questions_departmentId" ON "additional_questions" ("departmentId")
    `);

    await queryRunner.query(`
      CREATE TABLE "question_options" (
        "id"         UUID NOT NULL DEFAULT gen_random_uuid(),
        "questionId" UUID NOT NULL,
        "value"      VARCHAR(200) NOT NULL,
        "arValue"    VARCHAR(200),
        "sortOrder"  INTEGER NOT NULL DEFAULT 0,
        "isActive"   BOOLEAN NOT NULL DEFAULT TRUE,
        CONSTRAINT "PK_question_options" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_question_options_question_value" UNIQUE ("questionId", "value"),
        CONSTRAINT "FK_question_options_question" FOREIGN KEY ("questionId")
          REFERENCES "additional_questions" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_question_options_questionId" ON "question_options" ("questionId")
    `);

    await queryRunner.query(`
      CREATE TABLE "main_diag_questions" (
        "mainDiagId" UUID NOT NULL,
        "questionId" UUID NOT NULL,
        "isRequired" BOOLEAN,
        "sortOrder"  INTEGER,
        CONSTRAINT "PK_main_diag_questions" PRIMARY KEY ("mainDiagId", "questionId"),
        CONSTRAINT "FK_main_diag_questions_main_diag" FOREIGN KEY ("mainDiagId")
          REFERENCES "main_diags" ("id") ON DELETE CASCADE,
        CONSTRAINT "FK_main_diag_questions_question" FOREIGN KEY ("questionId")
          REFERENCES "additional_questions" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_main_diag_questions_questionId" ON "main_diag_questions" ("questionId")
    `);

    await queryRunner.query(`
      CREATE TABLE "main_diag_question_options" (
        "mainDiagId" UUID NOT NULL,
        "questionId" UUID NOT NULL,
        "optionId"   UUID NOT NULL,
        CONSTRAINT "PK_main_diag_question_options" PRIMARY KEY ("mainDiagId", "questionId", "optionId"),
        CONSTRAINT "FK_main_diag_question_options_link" FOREIGN KEY ("mainDiagId", "questionId")
          REFERENCES "main_diag_questions" ("mainDiagId", "questionId") ON DELETE CASCADE,
        CONSTRAINT "FK_main_diag_question_options_option" FOREIGN KEY ("optionId")
          REFERENCES "question_options" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_main_diag_question_options_optionId" ON "main_diag_question_options" ("optionId")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "main_diag_question_options"`);
    await queryRunner.query(`DROP TABLE "main_diag_questions"`);
    await queryRunner.query(`DROP TABLE "question_options"`);
    await queryRunner.query(`DROP TABLE "additional_questions"`);
  }
}
