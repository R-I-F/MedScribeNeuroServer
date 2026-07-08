import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * GS additional-questions professor authoring — part 2 of 2 (part 1: migration 162).
 * Design record: MEDICAL_CODE_AUDITS/GS/QUESTIONS_GS.md.
 *
 * Narrowing rows so each category only offers its own approaches/sites (a cholecystectomy
 * must not offer "open - inguinal incision"; a thyroid case must not offer "rectum").
 * 52 approach rows + 13 region rows = 65. No narrowing for urgency/woundClass/stomaFormed
 * (small, generally-applicable lists).
 */
export class AddGsQuestionNarrowing1750000000163 implements MigrationInterface {
  name = "AddGsQuestionNarrowing1750000000163";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const LAP = "laparoscopic";
    const CONV = "laparoscopic converted to open";
    const ROBOT = "robotic-assisted";
    const MID = "open - midline laparotomy";
    const GRID = "open - gridiron / lanz incision";
    const KOCH = "open - kocher (subcostal) incision";
    const ING = "open - inguinal incision";
    const ENDO = "endoscopic";
    const OTHER = "other";

    const narrowing: Array<{ key: string; sets: Record<string, string[]> }> = [
      {
        key: "approach",
        sets: {
          "abdominal trauma": [LAP, CONV, MID, OTHER],
          "acute abdomen": [LAP, CONV, MID, OTHER],
          "appendicitis": [LAP, CONV, GRID, MID, OTHER],
          "bariatric conditions": [LAP, CONV, ROBOT, MID, OTHER],
          "bowel obstruction": [LAP, CONV, MID, OTHER],
          "cholecystitis & cholelithiasis": [LAP, CONV, KOCH, MID, OTHER],
          "colorectal polyps & masses": [LAP, CONV, ROBOT, MID, ENDO, OTHER],
          "diverticulitis": [LAP, CONV, MID, OTHER],
          "hernias": [ING, LAP, CONV, ROBOT, MID, OTHER],
          "peptic ulcer disease": [LAP, CONV, MID, ENDO, OTHER],
          "perforated viscus": [LAP, CONV, MID, OTHER],
        },
      },
      {
        key: "region",
        sets: {
          "breast lumps & cancer": ["right breast", "left breast", "bilateral"],
          "thyroid nodules": ["right thyroid lobe", "left thyroid lobe", "thyroid isthmus", "bilateral"],
          "colorectal polyps & masses": [
            "caecum / ascending colon", "transverse colon", "descending colon",
            "sigmoid colon", "rectum", "anal canal",
          ],
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
        JOIN "departments" d ON d."code" = 'GS'
        JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
        JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = '${block.key}'
        JOIN "question_options" o ON o."questionId" = q."id" AND o."value" = m.value
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // GS had zero narrowing rows before this migration — remove them all.
    await queryRunner.query(`
      DELETE FROM "main_diag_question_options" n
      USING "additional_questions" q, "departments" d
      WHERE n."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'GS'
    `);
  }
}
