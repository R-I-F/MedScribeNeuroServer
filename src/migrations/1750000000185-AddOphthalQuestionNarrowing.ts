import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OPHTHAL additional-questions professor authoring — part 2 of 2 (part 1: migration 184).
 * Design record: MEDICAL_CODE_AUDITS/OPHTHAL/QUESTIONS_OPHTHAL.md.
 *
 * Narrowing anesthesiaType so each category only offers its real anaesthesia options — the
 * surface / lid-infiltration / orbital-block / GA distinction (eyelid & orbital cases use
 * local infiltration or GA, not the intraocular blocks; intraocular cases use topical/blocks;
 * paediatric strabismus is GA). 47 rows. laterality and urgency left un-narrowed.
 */
export class AddOphthalQuestionNarrowing1750000000185 implements MigrationInterface {
  name = "AddOphthalQuestionNarrowing1750000000185";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const TOP = "topical";
    const SUBCONJ = "subconjunctival";
    const INFIL = "local infiltration";
    const TENON = "sub-tenon";
    const PERI = "peribulbar";
    const RETRO = "retrobulbar";
    const GA = "general anaesthesia";
    const OTHER = "other";

    const narrowing: Array<{ key: string; sets: Record<string, string[]> }> = [
      {
        key: "anesthesiaType",
        sets: {
          "cataract": [TOP, TENON, PERI, GA, OTHER],
          "corneal disease & scarring": [TOP, PERI, TENON, GA, OTHER],
          "diabetic retinopathy": [TOP, TENON, PERI, RETRO, GA, OTHER],
          "eyelid pathology": [INFIL, GA, OTHER],
          "glaucoma": [TOP, TENON, PERI, GA, OTHER],
          "macular degeneration": [TOP, SUBCONJ, TENON, OTHER],
          "ocular trauma": [GA, PERI, OTHER],
          "orbital pathology": [GA, INFIL, OTHER],
          "pterygium": [TOP, SUBCONJ, TENON, PERI, OTHER],
          "retinal detachment": [PERI, RETRO, TENON, GA, OTHER],
          "strabismus": [GA, TENON, OTHER],
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
        JOIN "departments" d ON d."code" = 'OPHTHAL'
        JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
        JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = '${block.key}'
        JOIN "question_options" o ON o."questionId" = q."id" AND o."value" = m.value
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // OPHTHAL had zero narrowing rows before this migration — remove them all.
    await queryRunner.query(`
      DELETE FROM "main_diag_question_options" n
      USING "additional_questions" q, "departments" d
      WHERE n."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'OPHTHAL'
    `);
  }
}
