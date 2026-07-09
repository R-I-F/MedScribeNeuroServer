import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * TRS additional-questions professor authoring — part 2 of 2 (part 1: migration 178).
 * Design record: MEDICAL_CODE_AUDITS/TRS/QUESTIONS_TRS.md.
 *
 * Narrowing so each category only offers its real choices (heart/lung/pancreas/multi-organ
 * donorType is deceased-only — living donation isn't practice; donor hepatectomy has no
 * hand-assisted option; a single-kidney donor/renal-transplant laterality is right or left,
 * never bilateral). 12 donorType + 4 approach + 4 laterality = 20 rows. region un-narrowed
 * (any graft can be involved in a complication or a multi-organ combination).
 */
export class AddTrsQuestionNarrowing1750000000179 implements MigrationInterface {
  name = "AddTrsQuestionNarrowing1750000000179";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const DBD = "deceased donor - brain death (dbd)";
    const DCD = "deceased donor - circulatory death (dcd)";
    const D_OTHER = "other";

    const OPEN = "open";
    const LAP = "laparoscopic";
    const ROBOT = "robotic-assisted";
    const A_OTHER = "other";

    const narrowing: Array<{ key: string; sets: Record<string, string[]> }> = [
      {
        key: "donorType",
        sets: {
          "heart transplant": [DBD, DCD, D_OTHER],
          "lung transplant": [DBD, DCD, D_OTHER],
          "pancreas transplant": [DBD, DCD, D_OTHER],
          "multi-organ transplant": [DBD, DCD, D_OTHER],
        },
      },
      {
        key: "approach",
        sets: {
          "donor hepatectomy": [OPEN, LAP, ROBOT, A_OTHER],
        },
      },
      {
        key: "laterality",
        sets: {
          "donor nephrectomy": ["right", "left"],
          "renal transplant": ["right", "left"],
        },
      },
    ];

    for (const block of narrowing) {
      const rows: string[] = [];
      for (const [title, values] of Object.entries(block.sets)) {
        for (const value of values) {
          rows.push(`('${title.replace(/'/g, "''")}', '${value.replace(/'/g, "''")}')`);
        }
      }
      await queryRunner.query(`
        INSERT INTO "main_diag_question_options" ("mainDiagId", "questionId", "optionId")
        SELECT md."id", q."id", o."id"
        FROM (VALUES ${rows.join(",\n          ")}) AS m(title, value)
        JOIN "departments" d ON d."code" = 'TRS'
        JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
        JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = '${block.key}'
        JOIN "question_options" o ON o."questionId" = q."id" AND o."value" = m.value
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // TRS had zero narrowing rows before this migration — remove them all.
    await queryRunner.query(`
      DELETE FROM "main_diag_question_options" n
      USING "additional_questions" q, "departments" d
      WHERE n."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'TRS'
    `);
  }
}
