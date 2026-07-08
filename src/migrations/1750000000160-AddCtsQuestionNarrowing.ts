import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * CTS additional-questions professor review — part 2 of 2 (part 1: migration 159).
 * Design record: MEDICAL_CODE_AUDITS/CTS/QUESTIONS_CTS.md.
 *
 * Populates main_diag_question_options (per-mainDiag option narrowing) for CTS so each
 * category only offers the approaches/targets that exist in that category's practice
 * (a lung-cancer case must not offer "mitral valve" as a target, a valve case must not
 * offer "left posterolateral thoracotomy"). Semantics: rows present for a
 * (mainDiag, question) = only that subset applies; the questions stay narrowed-off for
 * position/urgency/cpbStrategy (small, generally-applicable lists).
 *
 * 74 approach rows + 25 region rows = 99 narrowing rows.
 */
export class AddCtsQuestionNarrowing1750000000160 implements MigrationInterface {
  name = "AddCtsQuestionNarrowing1750000000160";

  public async up(queryRunner: QueryRunner): Promise<void> {
    const VATS = "vats (video-assisted thoracoscopic surgery)";
    const ROBOT = "robotic-assisted thoracoscopy";
    const RPLT = "right posterolateral thoracotomy";
    const LPLT = "left posterolateral thoracotomy";
    const RALT = "right anterolateral thoracotomy";
    const LALT = "left anterolateral thoracotomy";
    const STERN = "median sternotomy";
    const MINI = "mini-sternotomy";
    const SUBX = "subxiphoid approach";
    const MEDIA = "mediastinoscopy";
    const CLAM = "clamshell incision";
    const OTHER = "other";

    const narrowing: Array<{ key: string; sets: Record<string, string[]> }> = [
      {
        key: "approach",
        sets: {
          "aortic valve disease": [STERN, MINI, RALT, OTHER],
          "mitral valve disease": [STERN, MINI, RALT, ROBOT, OTHER],
          "tricuspid / multi-valve disease": [STERN, MINI, RALT, ROBOT, OTHER],
          "coronary artery disease (cad)": [STERN, LALT, OTHER],
          "cardiac arrhythmias": [STERN, VATS, SUBX, ROBOT, OTHER],
          "congenital acyanotic heart defect": [STERN, LPLT, VATS, OTHER],
          "congenital cyanotic heart defect": [STERN, LPLT, RPLT, OTHER],
          "heart failure & cardiomyopathy": [STERN, OTHER],
          "pericardial disease": [SUBX, STERN, VATS, LALT, OTHER],
          "thoracic aortic aneurysm / dissection": [STERN, LPLT, OTHER],
          "primary lung cancer": [VATS, ROBOT, RPLT, LPLT, MEDIA, OTHER],
          "metastatic/secondary lung disease": [VATS, ROBOT, RPLT, LPLT, CLAM, OTHER],
          "benign lung / airway disease": [VATS, ROBOT, RPLT, LPLT, OTHER],
          "pneumothorax & bullous disease": [VATS, RPLT, LPLT, OTHER],
          "pleural effusion & empyema": [VATS, RPLT, LPLT, OTHER],
          "mediastinal mass / thymoma": [STERN, VATS, ROBOT, MEDIA, OTHER],
          "chest wall deformities / tumors": [VATS, RPLT, LPLT, OTHER],
        },
      },
      {
        key: "region",
        sets: {
          "tricuspid / multi-valve disease": ["tricuspid / pulmonary valves", "mitral valve", "aortic valve"],
          "congenital acyanotic heart defect": ["whole heart", "thoracic aorta"],
          "congenital cyanotic heart defect": ["whole heart", "thoracic aorta"],
          "thoracic aortic aneurysm / dissection": ["thoracic aorta", "aortic valve"],
          "primary lung cancer": ["right lung", "left lung", "mediastinum", "chest wall", "trachea / airway"],
          "metastatic/secondary lung disease": ["right lung", "left lung"],
          "benign lung / airway disease": ["right lung", "left lung", "trachea / airway"],
          "pneumothorax & bullous disease": ["right lung", "left lung", "pericardium / pleura"],
          "pleural effusion & empyema": ["pericardium / pleura", "right lung", "left lung"],
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
        JOIN "departments" d ON d."code" = 'CTS'
        JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
        JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = '${block.key}'
        JOIN "question_options" o ON o."questionId" = q."id" AND o."value" = m.value
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // CTS had zero narrowing rows before this migration — remove them all.
    await queryRunner.query(`
      DELETE FROM "main_diag_question_options" n
      USING "additional_questions" q, "departments" d
      WHERE n."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'CTS'
    `);
  }
}
