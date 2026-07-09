import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * UROL additional-questions professor authoring — part 2 of 2 (part 1: migration 186).
 * Design record: MEDICAL_CODE_AUDITS/UROL/QUESTIONS_UROL.md.
 *
 * Narrowing so each category only offers its real choices (a TURP is transurethral/open —
 * never percutaneous; a renal transplant graft goes right/left iliac fossa — not bilateral;
 * urologic nodal surgery is regional/radical LND — never SLNB; neoadjuvant differs per cancer).
 * 41 approach + 2 laterality + 12 nodalSurgery + 10 neoadjuvant = 65 rows.
 * ureteral obstruction approach un-narrowed (all 6 modalities real).
 */
export class AddUrolQuestionNarrowing1750000000187 implements MigrationInterface {
  name = "AddUrolQuestionNarrowing1750000000187";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const OPEN = "open";
    const LAP = "laparoscopic";
    const ROBOT = "robotic-assisted";
    const TUR = "transurethral (endoscopic)";
    const PERC = "percutaneous";
    const A_OTHER = "other";

    const N_NONE = "none";
    const REGIONAL = "regional lymphadenectomy";
    const RADICAL = "radical / extended lymphadenectomy";

    const NEO_NONE = "none";
    const CHEMO = "chemotherapy";
    const RADIO = "radiotherapy";
    const IMMUNO = "immunotherapy / targeted therapy";
    const HORMONE = "hormonal therapy";

    const narrowing: Array<{ key: string; sets: Record<string, string[]> }> = [
      {
        key: "approach",
        sets: {
          "benign prostatic hyperplasia": [TUR, OPEN, LAP, ROBOT, A_OTHER],
          "bladder cancer": [TUR, OPEN, ROBOT, LAP, A_OTHER],
          "erectile dysfunction": [OPEN, A_OTHER],
          "male infertility": [OPEN, A_OTHER],
          "nephrolithiasis": [TUR, PERC, LAP, OPEN, A_OTHER],
          "penile pathology": [OPEN, A_OTHER],
          "prostate cancer": [ROBOT, OPEN, LAP, A_OTHER],
          "renal cancer": [LAP, ROBOT, OPEN, PERC, A_OTHER],
          "renal transplantation": [OPEN, A_OTHER],
          "testicular cancer": [OPEN, LAP, A_OTHER],
          "urinary incontinence": [OPEN, TUR, A_OTHER],
          "urinary retention": [TUR, OPEN, A_OTHER],
        },
      },
      {
        key: "laterality",
        sets: {
          "renal transplantation": ["right", "left"],
        },
      },
      {
        key: "nodalSurgery",
        sets: {
          "bladder cancer": [N_NONE, REGIONAL, RADICAL],
          "prostate cancer": [N_NONE, REGIONAL, RADICAL],
          "renal cancer": [N_NONE, REGIONAL, RADICAL],
          "testicular cancer": [N_NONE, REGIONAL, RADICAL],
        },
      },
      {
        key: "neoadjuvant",
        sets: {
          "bladder cancer": [NEO_NONE, CHEMO, IMMUNO],
          "prostate cancer": [NEO_NONE, HORMONE, RADIO],
          "renal cancer": [NEO_NONE, IMMUNO],
          "testicular cancer": [NEO_NONE, CHEMO],
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
        JOIN "departments" d ON d."code" = 'UROL'
        JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
        JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = '${block.key}'
        JOIN "question_options" o ON o."questionId" = q."id" AND o."value" = m.value
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // UROL had zero narrowing rows before this migration — remove them all.
    await queryRunner.query(`
      DELETE FROM "main_diag_question_options" n
      USING "additional_questions" q, "departments" d
      WHERE n."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'UROL'
    `);
  }
}
