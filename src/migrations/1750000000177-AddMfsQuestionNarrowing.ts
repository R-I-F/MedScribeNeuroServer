import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * MFS additional-questions professor authoring — part 2 of 2 (part 1: migration 176).
 * Design record: MEDICAL_CODE_AUDITS/MFS/QUESTIONS_MFS.md.
 *
 * Narrowing so each category only offers its real choices (an orthognathic case offers
 * maxilla/mandible/bimaxillary — not "parotid gland"; TMJ approach is arthroscopy or
 * preauricular extraoral — never plain intraoral; midface trauma fixation has no
 * MMF-primary option). 22 region + 17 approach + 6 laterality + 4 fixationMethod = 49.
 */
export class AddMfsQuestionNarrowing1750000000177 implements MigrationInterface {
  name = "AddMfsQuestionNarrowing1750000000177";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const INTRA = "intraoral";
    const EXTRA = "extraoral (transcervical / facial)";
    const COMBINED = "combined intraoral + extraoral";
    const ENDO = "endoscopic-assisted";
    const OTHER = "other";

    const narrowing: Array<{ key: string; sets: Record<string, string[]> }> = [
      {
        key: "region",
        sets: {
          "facial trauma": [
            "zygomaticomaxillary complex", "orbital floor / rim", "nasal / naso-orbito-ethmoid",
            "frontal bone / sinus", "maxilla (le fort)", "panfacial",
          ],
          "jaw fractures": [
            "mandible - condyle / subcondylar", "mandible - angle / ramus",
            "mandible - body / symphysis", "maxilla (le fort)",
          ],
          "jaw cysts & pathology": ["maxilla", "mandible"],
          "impacted teeth": ["maxilla", "mandible"],
          "dental implants": ["maxilla", "mandible"],
          "orthognathic surgery": ["maxilla", "mandible", "bimaxillary"],
          "salivary gland pathology": ["parotid gland", "submandibular gland", "sublingual / minor glands"],
        },
      },
      {
        key: "approach",
        sets: {
          "temporomandibular joint disorders": [ENDO, EXTRA, OTHER],
          "salivary gland pathology": [EXTRA, INTRA, OTHER],
          "oral cancer": [INTRA, COMBINED, EXTRA, OTHER],
          "benign oral tumors": [INTRA, EXTRA, COMBINED, OTHER],
          "jaw cysts & pathology": [INTRA, EXTRA, OTHER],
        },
      },
      {
        key: "laterality",
        sets: {
          "temporomandibular joint disorders": ["right", "left", "bilateral"],
          "salivary gland pathology": ["right", "left", "bilateral"],
        },
      },
      {
        key: "fixationMethod",
        sets: {
          "facial trauma": [
            "orif - miniplates / screws", "conservative / no fixation", "external fixation", "other",
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
        JOIN "departments" d ON d."code" = 'MFS'
        JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
        JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = '${block.key}'
        JOIN "question_options" o ON o."questionId" = q."id" AND o."value" = m.value
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // MFS had zero narrowing rows before this migration — remove them all.
    await queryRunner.query(`
      DELETE FROM "main_diag_question_options" n
      USING "additional_questions" q, "departments" d
      WHERE n."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'MFS'
    `);
  }
}
