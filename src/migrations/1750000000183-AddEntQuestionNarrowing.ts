import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ENT additional-questions professor authoring — part 2 of 2 (part 1: migration 182).
 * Design record: MEDICAL_CODE_AUDITS/ENT/QUESTIONS_ENT.md.
 *
 * Narrowing so each category only offers its real approaches (a mastoidectomy is
 * postauricular/transcanal — never transoral; sinus surgery is endonasal; thyroid is
 * transcervical; a thyroid neck dissection is selective/modified-radical, not SLNB).
 * 35 approach + 3 nodalSurgery = 38 rows. laterality/region/urgency/intent/neo un-narrowed.
 */
export class AddEntQuestionNarrowing1750000000183 implements MigrationInterface {
  name = "AddEntQuestionNarrowing1750000000183";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const ENDO = "endoscopic (endonasal)";
    const TORAL = "transoral";
    const TCERV = "transcervical (open neck)";
    const TCANAL = "transcanal";
    const POSTAUR = "postauricular";
    const LARYNGO = "direct laryngoscopy / microlaryngoscopy";
    const EXT = "external / open";
    const OTHER = "other";

    const narrowing: Array<{ key: string; sets: Record<string, string[]> }> = [
      {
        key: "approach",
        sets: {
          "hearing loss": [TCANAL, POSTAUR, OTHER],
          "mastoiditis": [POSTAUR, TCANAL, OTHER],
          "tympanic membrane perforation": [TCANAL, POSTAUR, OTHER],
          "chronic sinusitis": [ENDO, EXT, OTHER],
          "deviated septum": [ENDO, OTHER],
          "nasal polyps": [ENDO, OTHER],
          "laryngeal pathology": [LARYNGO, TORAL, TCERV, OTHER],
          "obstructive sleep apnea": [TORAL, ENDO, OTHER],
          "tonsillitis & adenoid hypertrophy": [TORAL, OTHER],
          "head & neck cancer": [TORAL, TCERV, ENDO, EXT, OTHER],
          "salivary gland disease": [TCERV, TORAL, OTHER],
          "thyroid & parathyroid diseases": [TCERV, OTHER],
        },
      },
      {
        key: "nodalSurgery",
        sets: {
          "thyroid & parathyroid diseases": [
            "none", "selective neck dissection", "modified radical neck dissection",
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
        JOIN "departments" d ON d."code" = 'ENT'
        JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
        JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = '${block.key}'
        JOIN "question_options" o ON o."questionId" = q."id" AND o."value" = m.value
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ENT had zero narrowing rows before this migration — remove them all.
    await queryRunner.query(`
      DELETE FROM "main_diag_question_options" n
      USING "additional_questions" q, "departments" d
      WHERE n."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'ENT'
    `);
  }
}
