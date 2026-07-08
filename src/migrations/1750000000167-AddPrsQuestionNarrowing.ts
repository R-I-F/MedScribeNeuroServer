import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PRS additional-questions professor authoring — part 2 of 2 (part 1: migration 166).
 * Design record: MEDICAL_CODE_AUDITS/PRS/QUESTIONS_PRS.md.
 *
 * Narrowing so each category only offers its own sites/ladder rungs (a pressure-ulcer case
 * offers sacrum/ischium/trochanter/heel — not "face"; breast reconstruction offers flaps and
 * expansion — not "healing by secondary intention"). 35 region + 43 reconstructionMethod +
 * 9 laterality = 87 rows. tumor-reconstruction reconstructionMethod deliberately un-narrowed
 * (the whole ladder applies); cleft/congenital/contractures laterality un-narrowed (midline
 * is real there). No narrowing for urgency.
 */
export class AddPrsQuestionNarrowing1750000000167 implements MigrationInterface {
  name = "AddPrsQuestionNarrowing1750000000167";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const PRIM = "primary closure";
    const SECOND = "healing by secondary intention";
    const STSG = "split-thickness skin graft";
    const FTSG = "full-thickness skin graft";
    const LOCAL = "local flap";
    const PEDIC = "regional / pedicled flap";
    const FREE = "free flap (microvascular)";
    const EXPAND = "tissue expansion";
    const OTHER = "other";

    const narrowing: Array<{ key: string; sets: Record<string, string[]> }> = [
      {
        key: "region",
        sets: {
          "contractures": ["neck", "axilla", "hand", "upper limb", "lower limb", "face"],
          "pressure ulcers": ["sacrum", "ischium", "trochanter", "heel"],
          "scar revision": ["face", "scalp", "neck", "trunk", "breast", "upper limb", "hand", "lower limb"],
          "traumatic lacerations & avulsions": ["face", "scalp", "neck", "trunk", "upper limb", "hand", "lower limb", "foot"],
          "tumor reconstruction": ["face", "scalp", "neck", "trunk", "breast", "upper limb", "hand", "lower limb", "foot"],
        },
      },
      {
        key: "reconstructionMethod",
        sets: {
          "breast reconstruction": [PEDIC, FREE, EXPAND, OTHER],
          "burn injuries": [STSG, FTSG, SECOND, LOCAL, OTHER],
          "congenital anomalies": [PRIM, FTSG, LOCAL, STSG, OTHER],
          "contractures": [LOCAL, STSG, FTSG, PEDIC, EXPAND, OTHER],
          "hand trauma": [PRIM, LOCAL, PEDIC, STSG, FTSG, FREE, OTHER],
          "pressure ulcers": [LOCAL, PEDIC, SECOND, PRIM, OTHER],
          "scar revision": [PRIM, LOCAL, EXPAND, FTSG, OTHER],
          "traumatic lacerations & avulsions": [PRIM, STSG, LOCAL, FTSG, PEDIC, OTHER],
        },
      },
      {
        key: "laterality",
        sets: {
          "breast reconstruction": ["right", "left", "bilateral"],
          "hand trauma": ["right", "left", "bilateral"],
          "nerve injuries": ["right", "left", "bilateral"],
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
        JOIN "departments" d ON d."code" = 'PRS'
        JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
        JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = '${block.key}'
        JOIN "question_options" o ON o."questionId" = q."id" AND o."value" = m.value
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // PRS had zero narrowing rows before this migration — remove them all.
    await queryRunner.query(`
      DELETE FROM "main_diag_question_options" n
      USING "additional_questions" q, "departments" d
      WHERE n."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'PRS'
    `);
  }
}
