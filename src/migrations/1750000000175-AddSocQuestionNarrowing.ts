import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * SOC additional-questions professor authoring — part 2 of 2 (part 1: migration 174).
 * Design record: MEDICAL_CODE_AUDITS/SOC/QUESTIONS_SOC.md.
 *
 * Narrowing so each cancer only offers its real choices (breast nodal surgery is
 * none/sentinel/ALND — never "nodal sampling"; ovarian neoadjuvant is chemotherapy only;
 * a colorectal stoma list has no urostomy; GU's stoma list is none/urostomy).
 * 37 nodalSurgery + 28 neoadjuvant + 20 region + 9 stomaFormed = 94 rows.
 * surgicalIntent and approach deliberately un-narrowed.
 */
export class AddSocQuestionNarrowing1750000000175 implements MigrationInterface {
  name = "AddSocQuestionNarrowing1750000000175";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const N_NONE = "none";
    const SAMPLE = "nodal sampling";
    const SLNB = "sentinel lymph node biopsy";
    const REGIONAL = "regional lymphadenectomy";
    const RADICAL = "radical / extended lymphadenectomy";

    const NEO_NONE = "none";
    const CHEMO = "chemotherapy";
    const RADIO = "radiotherapy";
    const CRT = "chemoradiotherapy";
    const IMMUNO = "immunotherapy / targeted therapy";
    const HORMONE = "hormonal therapy";

    const narrowing: Array<{ key: string; sets: Record<string, string[]> }> = [
      {
        key: "nodalSurgery",
        sets: {
          "breast cancer": [N_NONE, SLNB, REGIONAL],
          "melanoma": [N_NONE, SLNB, REGIONAL],
          "non-melanoma skin cancer": [N_NONE, SLNB, REGIONAL],
          "gastric cancer": [N_NONE, SAMPLE, REGIONAL, RADICAL],
          "colorectal cancer": [N_NONE, REGIONAL, RADICAL],
          "head & neck cancer": [N_NONE, REGIONAL, RADICAL],
          "endocrine & adrenal tumours": [N_NONE, REGIONAL, RADICAL],
          "genitourinary cancer": [N_NONE, REGIONAL, RADICAL],
          "gynaecological cancer": [N_NONE, SAMPLE, REGIONAL],
          "ovarian cancer": [N_NONE, SAMPLE, REGIONAL],
          "pancreatic cancer": [N_NONE, REGIONAL, RADICAL],
          "biliary tract & gallbladder cancer": [N_NONE, REGIONAL, RADICAL],
        },
      },
      {
        key: "neoadjuvant",
        sets: {
          "colorectal cancer": [NEO_NONE, CHEMO, RADIO, CRT],
          "gastric cancer": [NEO_NONE, CHEMO, CRT],
          "pancreatic cancer": [NEO_NONE, CHEMO, CRT],
          "head & neck cancer": [NEO_NONE, CHEMO, RADIO, CRT],
          "ovarian cancer": [NEO_NONE, CHEMO],
          "soft tissue sarcoma": [NEO_NONE, CHEMO, RADIO, CRT],
          "gynaecological cancer": [NEO_NONE, CHEMO, RADIO, CRT],
          "genitourinary cancer": [NEO_NONE, CHEMO, IMMUNO, HORMONE],
        },
      },
      {
        key: "region",
        sets: {
          "melanoma": ["head & neck", "trunk / torso", "upper limb", "lower limb"],
          "non-melanoma skin cancer": ["head & neck", "trunk / torso", "upper limb", "lower limb"],
          "soft tissue sarcoma": ["upper limb", "lower limb", "trunk / torso", "retroperitoneum", "head & neck"],
          "metastatic disease": ["liver", "lung / thoracic", "intra-abdominal / peritoneal"],
          "surgical lymphoma": ["cervical nodes", "axillary nodes", "inguinal nodes", "intra-abdominal / peritoneal"],
        },
      },
      {
        key: "stomaFormed",
        sets: {
          "colorectal cancer": [
            "none", "loop ileostomy", "end ileostomy", "loop colostomy",
            "end colostomy (hartmann)", "other",
          ],
          "genitourinary cancer": ["none", "urostomy (ileal conduit)", "other"],
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
        JOIN "departments" d ON d."code" = 'SOC'
        JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
        JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = '${block.key}'
        JOIN "question_options" o ON o."questionId" = q."id" AND o."value" = m.value
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // SOC had zero narrowing rows before this migration — remove them all.
    await queryRunner.query(`
      DELETE FROM "main_diag_question_options" n
      USING "additional_questions" q, "departments" d
      WHERE n."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'SOC'
    `);
  }
}
