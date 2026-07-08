import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ORTHO additional-questions professor authoring — part 2 of 2 (part 1: migration 164).
 * Design record: MEDICAL_CODE_AUDITS/ORTHO/QUESTIONS_ORTHO.md.
 *
 * Narrowing so each category only offers its own approaches/positions/sites/fixations
 * (a carpal-tunnel case must not offer "arthroscopic-assisted mini-open"; a spine fracture
 * must not offer "hemiarthroplasty"). 42 approach + 13 region + 10 position + 37
 * fixationMethod = 102 rows. osteomyelitis & septic joint region deliberately un-narrowed
 * (all 12 bones/joints legitimately apply). No narrowing for laterality/urgency/fractureType.
 */
export class AddOrthoQuestionNarrowing1750000000165 implements MigrationInterface {
  name = "AddOrthoQuestionNarrowing1750000000165";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const OPEN = "open";
    const SCOPE = "arthroscopic";
    const MINI = "arthroscopic-assisted mini-open";
    const PERC = "percutaneous";
    const MIS = "minimally invasive (tubular / endoscopic)";
    const OTHER = "other";

    const CAST = "closed reduction + cast / splint";
    const KWIRE = "percutaneous k-wires";
    const PLATE = "orif - plate & screws";
    const NAIL = "intramedullary nail";
    const EXFIX = "external fixator";
    const TBAND = "tension band wiring";
    const PEDIC = "spinal instrumentation (pedicle screws)";
    const CEMENT = "vertebroplasty / kyphoplasty (cement)";
    const HEMI = "hemiarthroplasty";
    const TJR = "total joint replacement";

    const narrowing: Array<{ key: string; sets: Record<string, string[]> }> = [
      {
        key: "approach",
        sets: {
          "anterior cruciate ligament injury": [SCOPE, MINI, OPEN, OTHER],
          "carpal tunnel syndrome": [OPEN, MIS, OTHER],
          "foot & ankle disorders": [OPEN, SCOPE, PERC, MIS, OTHER],
          "hand & wrist disorders": [OPEN, SCOPE, PERC, OTHER],
          "meniscal tears": [SCOPE, OPEN, OTHER],
          "osteoarthritis": [OPEN, MIS, OTHER],
          "osteomyelitis & septic joint": [OPEN, SCOPE, PERC, OTHER],
          "osteonecrosis": [OPEN, PERC, OTHER],
          "paediatric & developmental conditions": [OPEN, PERC, OTHER],
          "rotator cuff pathology": [SCOPE, MINI, OPEN, OTHER],
          "spinal stenosis": [OPEN, MIS, OTHER],
          "spondylolisthesis": [OPEN, MIS, OTHER],
        },
      },
      {
        key: "region",
        sets: {
          "bone tumours": [
            "femur", "tibia / fibula", "humerus", "radius / ulna",
            "pelvis", "spine", "hand bones", "foot bones",
          ],
          "osteonecrosis": ["hip joint", "shoulder joint", "knee joint", "ankle joint", "hand bones"],
        },
      },
      {
        key: "position",
        sets: {
          "fractures (lower extremity)": ["supine", "traction (fracture) table", "lateral decubitus", "other"],
          "osteoarthritis": ["supine", "lateral decubitus", "other"],
          "rotator cuff pathology": ["beach chair", "lateral decubitus", "other"],
        },
      },
      {
        key: "fixationMethod",
        sets: {
          "fractures (spine)": [PEDIC, CEMENT, CAST, "other"],
          "fractures (lower extremity)": [CAST, KWIRE, PLATE, NAIL, EXFIX, TBAND, HEMI, TJR, "other"],
          "fractures (upper extremity)": [CAST, KWIRE, PLATE, NAIL, EXFIX, TBAND, HEMI, "other"],
          "pathologic fractures": [NAIL, PLATE, HEMI, TJR, "other"],
          "foot & ankle disorders": [PLATE, KWIRE, CAST, EXFIX, "other"],
          "paediatric & developmental conditions": [CAST, KWIRE, EXFIX, PLATE, NAIL, "other"],
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
        JOIN "departments" d ON d."code" = 'ORTHO'
        JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
        JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = '${block.key}'
        JOIN "question_options" o ON o."questionId" = q."id" AND o."value" = m.value
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // ORTHO had zero narrowing rows before this migration — remove them all.
    await queryRunner.query(`
      DELETE FROM "main_diag_question_options" n
      USING "additional_questions" q, "departments" d
      WHERE n."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'ORTHO'
    `);
  }
}
