import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * CTS additional-questions professor review — part 1 of 2 (see part 2: migration 160 narrowing).
 * Design record: MEDICAL_CODE_AUDITS/CTS/QUESTIONS_CTS.md.
 *
 * The seeded CTS config (migration 158) mirrored production, which was authored under the old
 * rigid six-flag system. Cardiothoracic-professor revision:
 *  - NEW question `urgency` (elective/urgent/emergency/salvage) linked to ALL 17 categories —
 *    EuroSCORE-style operative status.
 *  - NEW question `cpbStrategy` (cardiopulmonary bypass strategy) linked to the 10 cardiac
 *    categories (incl. pericardial disease — pericardiectomy may need CPB).
 *  - `approach` +4 options: right posterolateral thoracotomy (left existed but not right),
 *    left anterolateral thoracotomy (MIDCAB/trauma), mediastinoscopy, other.
 *  - `region` +4 options: chest wall (its own category had NO valid answer!), trachea / airway,
 *    atria / appendage, whole heart.  `position` +1: other.
 *  - `position` ADDED to congenital acyanotic heart defect (PDA ligation / coarctation repair
 *    run through a left posterolateral thoracotomy in lateral decubitus — positioning varies).
 *  - `region` REMOVED from 8 single-target categories (aortic valve, mitral, cad, arrhythmias,
 *    heart failure, pericardial, mediastinal, chest wall): after narrowing each would have
 *    exactly one valid option — a one-answer question teaches nothing; target is implied.
 *  - `intraopEvents` sortOrder 3→9 so the free-text narrative renders last.
 */
export class ReviseCtsQuestionSet1750000000159 implements MigrationInterface {
  name = "ReviseCtsQuestionSet1750000000159";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── New question definitions ───────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('urgency',     'Urgency of surgery',              'مدى إلحاح الجراحة',                     'single_choice', 4),
        ('cpbStrategy', 'Cardiopulmonary bypass strategy', 'استراتيجية المجازة القلبية الرئوية',    'single_choice', 5)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'CTS'
    `);

    // ── Options: new questions + additions to existing ones ────────────────
    const optionSets: Array<{ key: string; startOrd: number; values: string[] }> = [
      { key: "urgency", startOrd: 0, values: ["elective", "urgent", "emergency", "salvage"] },
      {
        key: "cpbStrategy",
        startOrd: 0,
        values: [
          "on-pump - cardioplegic arrest", "on-pump - beating heart", "off-pump",
          "hypothermic circulatory arrest", "none",
        ],
      },
      { key: "position", startOrd: 4, values: ["other"] },
      {
        key: "approach",
        startOrd: 8,
        values: [
          "right posterolateral thoracotomy", "left anterolateral thoracotomy",
          "mediastinoscopy", "other",
        ],
      },
      {
        key: "region",
        startOrd: 9,
        values: ["chest wall", "trachea / airway", "atria / appendage", "whole heart"],
      },
    ];
    for (const set of optionSets) {
      const rows = set.values.map((v, i) => `('${v}', ${set.startOrd + i})`).join(", ");
      await queryRunner.query(`
        INSERT INTO "question_options" ("questionId", "value", "sortOrder")
        SELECT q."id", v.value, v.ord
        FROM "additional_questions" q
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = 'CTS'
        CROSS JOIN (VALUES ${rows}) AS v(value, ord)
        WHERE q."key" = '${set.key}'
      `);
    }

    // ── intraopEvents renders last ──────────────────────────────────────────
    await queryRunner.query(`
      UPDATE "additional_questions" q SET "sortOrder" = 9, "updatedAt" = NOW()
      FROM "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'CTS' AND q."key" = 'intraopEvents'
    `);

    // ── New links ───────────────────────────────────────────────────────────
    // urgency → all 17 categories
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'urgency'
      WHERE d."code" = 'CTS'
    `);
    // cpbStrategy → the 10 cardiac categories
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('aortic valve disease'),
        ('cardiac arrhythmias'),
        ('congenital acyanotic heart defect'),
        ('congenital cyanotic heart defect'),
        ('coronary artery disease (cad)'),
        ('heart failure & cardiomyopathy'),
        ('mitral valve disease'),
        ('pericardial disease'),
        ('thoracic aortic aneurysm / dissection'),
        ('tricuspid / multi-valve disease')
      ) AS m(title)
      JOIN "departments" d ON d."code" = 'CTS'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'cpbStrategy'
    `);
    // position → congenital acyanotic heart defect
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = 'congenital acyanotic heart defect'
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'position'
      WHERE d."code" = 'CTS'
    `);

    // ── Remove region from the 8 single-target categories ──────────────────
    await queryRunner.query(`
      DELETE FROM "main_diag_questions" mdq
      USING "departments" d, "main_diags" md, "additional_questions" q
      WHERE mdq."mainDiagId" = md."id" AND mdq."questionId" = q."id"
        AND md."departmentId" = d."id" AND q."departmentId" = d."id"
        AND d."code" = 'CTS' AND q."key" = 'region'
        AND md."title" IN (
          'aortic valve disease', 'mitral valve disease', 'coronary artery disease (cad)',
          'cardiac arrhythmias', 'heart failure & cardiomyopathy', 'pericardial disease',
          'mediastinal mass / thymoma', 'chest wall deformities / tumors'
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore the 8 region links
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('aortic valve disease'), ('mitral valve disease'), ('coronary artery disease (cad)'),
        ('cardiac arrhythmias'), ('heart failure & cardiomyopathy'), ('pericardial disease'),
        ('mediastinal mass / thymoma'), ('chest wall deformities / tumors')
      ) AS m(title)
      JOIN "departments" d ON d."code" = 'CTS'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'region'
    `);
    // Remove the added position link
    await queryRunner.query(`
      DELETE FROM "main_diag_questions" mdq
      USING "departments" d, "main_diags" md, "additional_questions" q
      WHERE mdq."mainDiagId" = md."id" AND mdq."questionId" = q."id"
        AND md."departmentId" = d."id" AND q."departmentId" = d."id"
        AND d."code" = 'CTS' AND q."key" = 'position'
        AND md."title" = 'congenital acyanotic heart defect'
    `);
    // Restore intraopEvents sortOrder
    await queryRunner.query(`
      UPDATE "additional_questions" q SET "sortOrder" = 3, "updatedAt" = NOW()
      FROM "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'CTS' AND q."key" = 'intraopEvents'
    `);
    // Remove options added to existing questions
    await queryRunner.query(`
      DELETE FROM "question_options" o
      USING "additional_questions" q, "departments" d
      WHERE o."questionId" = q."id" AND q."departmentId" = d."id" AND d."code" = 'CTS'
        AND (
          (q."key" = 'position' AND o."value" = 'other')
          OR (q."key" = 'approach' AND o."value" IN (
            'right posterolateral thoracotomy', 'left anterolateral thoracotomy',
            'mediastinoscopy', 'other'))
          OR (q."key" = 'region' AND o."value" IN (
            'chest wall', 'trachea / airway', 'atria / appendage', 'whole heart'))
        )
    `);
    // Remove the 2 new questions (cascades their options + links)
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'CTS'
        AND q."key" IN ('urgency', 'cpbStrategy')
    `);
  }
}
