import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Seeds the additional-questions framework with the REAL production configuration of the two
 * live tenants, captured from the production MySQL DBs on 2026-07-08 (values inlined — this
 * migration performs no live production reads). Staging NS (10) and CTS (17) main_diag titles
 * were verified to match production 1:1, so links are matched by (department, title).
 *
 *  NS  — 6 questions / 26 options / 14 main_diag links. The legacy spOrCran flag becomes the
 *        generalized `surgicalDomain` single-choice question (options: spinal, cranial).
 *  CTS — 4 questions / 21 options / 63 main_diag links. Only the questions CTS actually uses
 *        are seeded (legacy spOrCran and clinPres flags are all-zero in CTS production).
 *        CTS `region` is labelled "Target structure" (mitral valve, coronary arteries, …) —
 *        the semantic the tenant data already carries.
 *
 * Option `arValue` is left NULL for now (frontend falls back to EN); question `arLabel` is set.
 * main_diag_question_options is deliberately left empty (= all options apply everywhere).
 */
export class SeedNsCtsAdditionalQuestions1750000000158 implements MigrationInterface {
  name = "SeedNsCtsAdditionalQuestions1750000000158";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── NS question definitions ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('surgicalDomain',       'Spinal or cranial?',     'العمود الفقري أم الجمجمة؟', 'single_choice', 0),
        ('position',             'Patient position',       'وضعية المريض',              'single_choice', 1),
        ('approach',             'Surgical approach',      'المدخل الجراحي',            'single_choice', 2),
        ('region',               'Spinal region',          'منطقة العمود الفقري',       'single_choice', 3),
        ('clinicalPresentation', 'Clinical presentation',  'الأعراض السريرية',          'free_text',     4),
        ('intraopEvents',        'Intraoperative events',  'الأحداث أثناء العملية',     'free_text',     5)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'NS'
    `);

    // ── CTS question definitions ───────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('position',      'Patient position',      'وضعية المريض',          'single_choice', 0),
        ('approach',      'Surgical approach',     'المدخل الجراحي',        'single_choice', 1),
        ('region',        'Target structure',      'البنية المستهدفة',      'single_choice', 2),
        ('intraopEvents', 'Intraoperative events', 'الأحداث أثناء العملية', 'free_text',     3)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'CTS'
    `);

    // ── Options (order preserved from production tables) ───────────────────────
    const optionSets: Array<{ dept: string; key: string; values: string[] }> = [
      { dept: "NS", key: "surgicalDomain", values: ["spinal", "cranial"] },
      { dept: "NS", key: "position", values: ["supine", "prone", "lateral", "concorde", "other"] },
      {
        dept: "NS",
        key: "approach",
        values: [
          "pterional", "endonasal", "suboccipital", "retrosigmoid", "petrosal", "supraorbital",
          "transventricular (callosal)", "transventricular (frontal)", "subfrontal", "occipital",
          "laminectomy", "laminoplasty", "transoral", "transthoracic", "other",
        ],
      },
      { dept: "NS", key: "region", values: ["craniocervical", "cervical", "dorsal", "lumbar"] },
      {
        dept: "CTS",
        key: "position",
        values: ["right lateral decubitus", "supine", "left lateral decubitus", "semi-fowler"],
      },
      {
        dept: "CTS",
        key: "approach",
        values: [
          "vats (video-assisted thoracoscopic surgery)", "mini-sternotomy",
          "right anterolateral thoracotomy", "clamshell incision", "robotic-assisted thoracoscopy",
          "median sternotomy", "subxiphoid approach", "left posterolateral thoracotomy",
        ],
      },
      {
        dept: "CTS",
        key: "region",
        values: [
          "mitral valve", "coronary arteries", "right lung", "thoracic aorta", "left lung",
          "aortic valve", "pericardium / pleura", "mediastinum", "tricuspid / pulmonary valves",
        ],
      },
    ];
    for (const set of optionSets) {
      const rows = set.values.map((v, i) => `('${v}', ${i})`).join(", ");
      await queryRunner.query(`
        INSERT INTO "question_options" ("questionId", "value", "sortOrder")
        SELECT q."id", v.value, v.ord
        FROM "additional_questions" q
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = '${set.dept}'
        CROSS JOIN (VALUES ${rows}) AS v(value, ord)
        WHERE q."key" = '${set.key}'
      `);
    }

    // ── main_diag ↔ question links (production flag matrices, matched by title) ─
    // NS: 14 links
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('cns infection',                                     'intraopEvents'),
        ('cns tumors',                                        'surgicalDomain'),
        ('cns tumors',                                        'position'),
        ('cns tumors',                                        'approach'),
        ('cns tumors',                                        'intraopEvents'),
        ('congenital anomalies, infantile hydrocephalus',     'intraopEvents'),
        ('cranial trauma',                                    'intraopEvents'),
        ('csf disorders- other than infantile hydrocephalus', 'intraopEvents'),
        ('functional neurosurgery',                           'clinicalPresentation'),
        ('functional neurosurgery',                           'intraopEvents'),
        ('neuro-vascular diseases',                           'clinicalPresentation'),
        ('spinal degenerative diseases',                      'region'),
        ('spinal degenerative diseases',                      'intraopEvents'),
        ('spinal trauma',                                     'intraopEvents')
      ) AS m(title, qkey)
      JOIN "departments" d ON d."code" = 'NS'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = m.qkey
    `);

    // CTS: approach + region + intraopEvents on all 17 main_diags; position on the 12
    // main_diags flagged pos=1 in production. Total 17*3 + 12 = 63 links.
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
      JOIN "additional_questions" q ON q."departmentId" = d."id"
        AND q."key" IN ('approach', 'region', 'intraopEvents')
      WHERE d."code" = 'CTS'
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('benign lung / airway disease'),
        ('chest wall deformities / tumors'),
        ('congenital cyanotic heart defect'),
        ('mediastinal mass / thymoma'),
        ('metastatic/secondary lung disease'),
        ('mitral valve disease'),
        ('pericardial disease'),
        ('pleural effusion & empyema'),
        ('pneumothorax & bullous disease'),
        ('primary lung cancer'),
        ('thoracic aortic aneurysm / dissection'),
        ('tricuspid / multi-valve disease')
      ) AS m(title)
      JOIN "departments" d ON d."code" = 'CTS'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'position'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades remove question_options, main_diag_questions and main_diag_question_options.
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" IN ('NS', 'CTS')
    `);
  }
}
