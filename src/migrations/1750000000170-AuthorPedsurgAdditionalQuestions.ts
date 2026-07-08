import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PEDSURG (Pediatric Surgery) additional-questions professor authoring — part 1 of 2
 * (part 2: migration 171 narrowing). Design record: MEDICAL_CODE_AUDITS/PEDSURG/QUESTIONS_PEDSURG.md.
 *
 * Fresh authoring (PEDSURG had no question config). 6 questions:
 *  - ageGroup (NEW PEDSURG key): THE pediatric axis (premature neonate → adolescent);
 *    linked only where age truly varies (11 cats) — skipped where the category pins it
 *    (esophageal atresia / abdominal wall defects / neonatal emergencies = neonate,
 *    pyloric stenosis = infant).
 *  - laterality: 5 cats (CDH left/right Bochdalek, hydrocele, inguinal hernia, Wilms side,
 *    thoracic anomalies).
 *  - approach: peds-MIS semantics with explicit conversion options; 11 cats — skipped where
 *    open is the only answer (hydrocele, umbilical hernia, soft tissue, abdominal wall).
 *  - urgency: only the 6 cats where it varies (skipped where single-answer: neonatal
 *    emergencies = emergency by name, pyloric = always urgent-after-resuscitation, etc.).
 *  - stomaFormed: reused GS key, peds options (divided/double-barrel colostomy = ARM
 *    standard; no hartmann); 4 cats.
 *  - intraopEvents: all 15, renders last.
 * abdominal wall defects = intraopEvents only (justified: always neonate/open/urgent; the
 * silo-vs-primary-closure viva is a deferred single-category key). Also still-open:
 * esophageal-atresia long-gap staging.
 */
export class AuthorPedsurgAdditionalQuestions1750000000170 implements MigrationInterface {
  name = "AuthorPedsurgAdditionalQuestions1750000000170";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Question definitions ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('ageGroup',      'Age group',             'الفئة العمرية',           'single_choice', 0),
        ('laterality',    'Side (laterality)',     'الجهة (أيمن / أيسر)',     'single_choice', 1),
        ('approach',      'Surgical approach',     'المدخل الجراحي',          'single_choice', 2),
        ('urgency',       'Urgency of surgery',    'مدى إلحاح الجراحة',       'single_choice', 3),
        ('stomaFormed',   'Stoma formed',          'الفغرة المُنشأة',          'single_choice', 4),
        ('intraopEvents', 'Intraoperative events', 'الأحداث أثناء العملية',   'free_text',     9)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'PEDSURG'
    `);

    // ── Options (value + arValue always together) ───────────────────────────
    const optionSets: Array<{ key: string; values: Array<[string, string]> }> = [
      {
        key: "ageGroup",
        values: [
          ["premature neonate", "حديث ولادة مبتسر (خديج)"],
          ["term neonate (0-28 days)", "حديث ولادة مكتمل (0-28 يومًا)"],
          ["infant (1-12 months)", "رضيع (1-12 شهرًا)"],
          ["child (1-12 years)", "طفل (1-12 سنة)"],
          ["adolescent (>12 years)", "مراهق (أكبر من 12 سنة)"],
        ],
      },
      {
        key: "laterality",
        values: [
          ["right", "أيمن"],
          ["left", "أيسر"],
          ["bilateral", "ثنائي الجانب"],
        ],
      },
      {
        key: "approach",
        values: [
          ["open", "مفتوح"],
          ["laparoscopic", "تنظير البطن"],
          ["laparoscopic converted to open", "تنظير بطن محوَّل إلى مفتوح"],
          ["thoracoscopic", "تنظير الصدر"],
          ["thoracoscopic converted to open", "تنظير صدر محوَّل إلى مفتوح"],
          ["other", "أخرى"],
        ],
      },
      {
        key: "urgency",
        values: [
          ["elective", "اختياري (مجدول)"],
          ["urgent", "عاجل"],
          ["emergency", "طارئ"],
        ],
      },
      {
        key: "stomaFormed",
        values: [
          ["none", "بدون فغرة"],
          ["loop colostomy", "فغرة قولونية عروية"],
          ["divided (double-barrel) colostomy", "فغرة قولونية مزدوجة (منفصلة)"],
          ["loop ileostomy", "فغرة لفائفية عروية"],
          ["end ileostomy", "فغرة لفائفية طرفية"],
          ["other", "أخرى"],
        ],
      },
    ];
    for (const set of optionSets) {
      const rows = set.values
        .map(([v, ar], i) => `('${v.replace(/'/g, "''")}', '${ar}', ${i})`)
        .join(", ");
      await queryRunner.query(`
        INSERT INTO "question_options" ("questionId", "value", "arValue", "sortOrder")
        SELECT q."id", v.value, v."arValue", v.ord
        FROM "additional_questions" q
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = 'PEDSURG'
        CROSS JOIN (VALUES ${rows}) AS v(value, "arValue", ord)
        WHERE q."key" = '${set.key}'
      `);
    }

    // ── Links ───────────────────────────────────────────────────────────────
    // intraopEvents → all 15
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'intraopEvents'
      WHERE d."code" = 'PEDSURG'
    `);
    // remaining keyed links from the design matrix
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('appendicitis',                    'ageGroup'),
        ('congenital diaphragmatic hernia', 'ageGroup'),
        ('hydrocele',                       'ageGroup'),
        ('imperforate anus',                'ageGroup'),
        ('inguinal hernia',                 'ageGroup'),
        ('intussusception',                 'ageGroup'),
        ('malrotation & volvulus',          'ageGroup'),
        ('pediatric tumor resection',       'ageGroup'),
        ('soft tissue & skin lesions',      'ageGroup'),
        ('thoracic & lung anomalies',       'ageGroup'),
        ('umbilical hernia',                'ageGroup'),
        ('congenital diaphragmatic hernia', 'laterality'),
        ('hydrocele',                       'laterality'),
        ('inguinal hernia',                 'laterality'),
        ('pediatric tumor resection',       'laterality'),
        ('thoracic & lung anomalies',       'laterality'),
        ('appendicitis',                    'approach'),
        ('congenital diaphragmatic hernia', 'approach'),
        ('esophageal atresia',              'approach'),
        ('imperforate anus',                'approach'),
        ('inguinal hernia',                 'approach'),
        ('intussusception',                 'approach'),
        ('malrotation & volvulus',          'approach'),
        ('neonatal emergencies',            'approach'),
        ('pediatric tumor resection',       'approach'),
        ('pyloric stenosis',                'approach'),
        ('thoracic & lung anomalies',       'approach'),
        ('appendicitis',                    'urgency'),
        ('imperforate anus',                'urgency'),
        ('inguinal hernia',                 'urgency'),
        ('intussusception',                 'urgency'),
        ('malrotation & volvulus',          'urgency'),
        ('pediatric tumor resection',       'urgency'),
        ('imperforate anus',                'stomaFormed'),
        ('intussusception',                 'stomaFormed'),
        ('malrotation & volvulus',          'stomaFormed'),
        ('neonatal emergencies',            'stomaFormed')
      ) AS m(title, qkey)
      JOIN "departments" d ON d."code" = 'PEDSURG'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = m.qkey
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades remove question_options, main_diag_questions and main_diag_question_options.
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'PEDSURG'
    `);
  }
}
