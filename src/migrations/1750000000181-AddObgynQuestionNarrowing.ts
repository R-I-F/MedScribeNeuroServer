import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OBGYN additional-questions professor authoring — part 2 of 2 (part 1: migration 180).
 * Design record: MEDICAL_CODE_AUDITS/OBGYN/QUESTIONS_OBGYN.md.
 *
 * Narrowing so each category only offers its real choices (an ectopic offers laparoscopic/
 * open — never hysteroscopic; SUI offers the vaginal sling routes; miscarriage is first/
 * second trimester only; a C-section is a third-trimester event). 29 approach + 2 laterality
 * + 9 gestationalAge = 40 rows. uterine fibroids approach un-narrowed (all routes real);
 * the SOC-reused onc keys are single-category so un-narrowed.
 */
export class AddObgynQuestionNarrowing1750000000181 implements MigrationInterface {
  name = "AddObgynQuestionNarrowing1750000000181";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const ABD = "abdominal (open)";
    const LAP = "laparoscopic";
    const ROBOT = "robotic-assisted";
    const VAG = "vaginal";
    const OTHER = "other";

    const T1 = "first trimester";
    const T2 = "second trimester";
    const PRETERM = "third trimester - preterm";
    const TERM = "third trimester - term";

    const narrowing: Array<{ key: string; sets: Record<string, string[]> }> = [
      {
        key: "approach",
        sets: {
          "ectopic pregnancy": [LAP, ABD, OTHER],
          "endometriosis": [LAP, ROBOT, ABD, OTHER],
          "gynecologic cancer": [ABD, LAP, ROBOT, VAG, OTHER],
          "ovarian cysts & masses": [LAP, ABD, ROBOT, OTHER],
          "pelvic mass": [LAP, ABD, ROBOT, OTHER],
          "stress urinary incontinence": [VAG, LAP, ABD, OTHER],
          "uterine prolapse": [VAG, LAP, ABD, ROBOT, OTHER],
        },
      },
      {
        key: "laterality",
        sets: {
          "ectopic pregnancy": ["right", "left"],
        },
      },
      {
        key: "gestationalAge",
        sets: {
          "miscarriage": [T1, T2],
          "cesarean section": [PRETERM, TERM],
          "placental abnormalities": [T2, PRETERM, TERM],
          "vaginal delivery complications": [PRETERM, TERM],
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
        JOIN "departments" d ON d."code" = 'OBGYN'
        JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
        JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = '${block.key}'
        JOIN "question_options" o ON o."questionId" = q."id" AND o."value" = m.value
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // OBGYN had zero narrowing rows before this migration — remove them all.
    await queryRunner.query(`
      DELETE FROM "main_diag_question_options" n
      USING "additional_questions" q, "departments" d
      WHERE n."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'OBGYN'
    `);
  }
}
