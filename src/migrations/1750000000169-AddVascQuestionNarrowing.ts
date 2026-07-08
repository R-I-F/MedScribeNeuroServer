import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * VASC additional-questions professor authoring — part 2 of 2 (part 1: migration 168).
 * Design record: MEDICAL_CODE_AUDITS/VASC/QUESTIONS_VASC.md.
 *
 * Narrowing so each category only offers its own vessels/conduits (an AAA never offers
 * "drug-coated balloon"; a carotid case offers patch/bare-stent/none — not dacron tube
 * grafts; varicose veins never offer "hybrid"). 15 region + 39 graftType + 3 approach = 57.
 */
export class AddVascQuestionNarrowing1750000000169 implements MigrationInterface {
  name = "AddVascQuestionNarrowing1750000000169";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const VEIN = "autologous vein";
    const PTFE = "prosthetic graft - ptfe";
    const DACRON = "prosthetic graft - dacron";
    const COVERED = "stent-graft (covered)";
    const BARE = "bare-metal stent";
    const DCB = "drug-coated balloon / stent";
    const PATCH = "patch angioplasty";
    const NONE = "none (primary repair / native)";
    const OTHER = "other";

    const narrowing: Array<{ key: string; sets: Record<string, string[]> }> = [
      {
        key: "region",
        sets: {
          "peripheral artery disease": [
            "aortoiliac segment", "femoropopliteal segment", "infrapopliteal (tibial) segment",
          ],
          "peripheral aneurysms": [
            "popliteal artery", "femoral artery", "iliac artery", "visceral arteries", "upper limb vessels",
          ],
          "arterial trauma": [
            "neck vessels", "upper limb vessels", "lower limb vessels", "abdominal / pelvic vessels",
          ],
          "venous thromboembolism": ["ivc / iliac veins", "lower limb vessels", "upper limb vessels"],
        },
      },
      {
        key: "graftType",
        sets: {
          "abdominal aortic aneurysm": [DACRON, COVERED, PTFE, OTHER],
          "aortic dissection": [COVERED, DACRON, OTHER],
          "thoracic aortic aneurysm": [DACRON, COVERED, OTHER],
          "arterial trauma": [VEIN, PTFE, PATCH, NONE, OTHER],
          "arteriovenous fistula": [VEIN, PTFE, NONE, OTHER],
          "carotid artery disease": [PATCH, BARE, NONE, OTHER],
          "peripheral aneurysms": [VEIN, PTFE, DACRON, COVERED, OTHER],
          "peripheral artery disease": [VEIN, PTFE, DACRON, BARE, DCB, COVERED, OTHER],
          "renal artery disease": [BARE, VEIN, DACRON, OTHER],
        },
      },
      {
        key: "approach",
        sets: {
          "varicose veins": ["open surgery", "endovascular", "other"],
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
        JOIN "departments" d ON d."code" = 'VASC'
        JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
        JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = '${block.key}'
        JOIN "question_options" o ON o."questionId" = q."id" AND o."value" = m.value
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // VASC had zero narrowing rows before this migration — remove them all.
    await queryRunner.query(`
      DELETE FROM "main_diag_question_options" n
      USING "additional_questions" q, "departments" d
      WHERE n."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'VASC'
    `);
  }
}
