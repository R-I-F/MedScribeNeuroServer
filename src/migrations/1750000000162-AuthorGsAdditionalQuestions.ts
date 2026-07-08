import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * GS (General Surgery) additional-questions professor authoring — part 1 of 2
 * (part 2: migration 163 narrowing). Design record: MEDICAL_CODE_AUDITS/GS/QUESTIONS_GS.md.
 *
 * Fresh authoring (GS had no question config). 6 questions:
 *  - approach: THE general-surgery question (open/lap/converted/robotic + named incisions).
 *    Not linked to breast/thyroid — there the approach IS the procedure (proc_cpts).
 *  - region ("Anatomical site"): ONLY where the site is not already encoded in the linked
 *    diagnosis — breast side, thyroid lobe/isthmus, colorectal segment.
 *  - urgency: canonical key; GS uses 3 options (salvage is cardiac vocabulary).
 *  - woundClass (NEW GS key): CDC surgical wound classification — dropped where single-answer
 *    (breast/thyroid always clean, bariatric uniformly clean-contaminated).
 *  - stomaFormed (NEW GS key): ileostomy/colostomy decision, 6 categories where it is real.
 *  - intraopEvents: canonical free text, all categories, renders last (sortOrder 9).
 * Skipped, justified: surgicalDomain (axes duplicate the categories), position (>95% supine),
 * clinicalPresentation (submissions already carry preOpClinCond).
 */
export class AuthorGsAdditionalQuestions1750000000162 implements MigrationInterface {
  name = "AuthorGsAdditionalQuestions1750000000162";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Question definitions ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('approach',      'Surgical approach',               'المدخل الجراحي',          'single_choice', 0),
        ('region',        'Anatomical site',                 'الموضع التشريحي',         'single_choice', 1),
        ('urgency',       'Urgency of surgery',              'مدى إلحاح الجراحة',       'single_choice', 2),
        ('woundClass',    'Surgical wound classification',   'تصنيف الجرح الجراحي',     'single_choice', 3),
        ('stomaFormed',   'Stoma formed',                    'الفغرة المُنشأة',          'single_choice', 4),
        ('intraopEvents', 'Intraoperative events',           'الأحداث أثناء العملية',   'free_text',     9)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'GS'
    `);

    // ── Options (value + arValue always together) ───────────────────────────
    const optionSets: Array<{ key: string; values: Array<[string, string]> }> = [
      {
        key: "approach",
        values: [
          ["laparoscopic", "تنظير البطن (لاباروسكوبي)"],
          ["laparoscopic converted to open", "تنظيري محوَّل إلى مفتوح"],
          ["robotic-assisted", "بمساعدة الروبوت"],
          ["open - midline laparotomy", "مفتوح - فتح بطن ناصف"],
          ["open - gridiron / lanz incision", "مفتوح - شق جريدايرون / لانز"],
          ["open - kocher (subcostal) incision", "مفتوح - شق كوخر تحت الضلعي"],
          ["open - inguinal incision", "مفتوح - شق إربي"],
          ["endoscopic", "بالمنظار الداخلي"],
          ["other", "أخرى"],
        ],
      },
      {
        key: "region",
        values: [
          ["right breast", "الثدي الأيمن"],
          ["left breast", "الثدي الأيسر"],
          ["right thyroid lobe", "الفص الأيمن للغدة الدرقية"],
          ["left thyroid lobe", "الفص الأيسر للغدة الدرقية"],
          ["thyroid isthmus", "برزخ الغدة الدرقية"],
          ["bilateral", "ثنائي الجانب"],
          ["caecum / ascending colon", "الأعور / القولون الصاعد"],
          ["transverse colon", "القولون المستعرض"],
          ["descending colon", "القولون النازل"],
          ["sigmoid colon", "القولون السيني"],
          ["rectum", "المستقيم"],
          ["anal canal", "القناة الشرجية"],
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
        key: "woundClass",
        values: [
          ["clean", "نظيف"],
          ["clean-contaminated", "نظيف-ملوث"],
          ["contaminated", "ملوث"],
          ["dirty / infected", "متسخ / مصاب بالعدوى"],
        ],
      },
      {
        key: "stomaFormed",
        values: [
          ["none", "بدون فغرة"],
          ["loop ileostomy", "فغرة لفائفية عروية"],
          ["end ileostomy", "فغرة لفائفية طرفية"],
          ["loop colostomy", "فغرة قولونية عروية"],
          ["end colostomy (hartmann)", "فغرة قولونية طرفية (عملية هارتمان)"],
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
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = 'GS'
        CROSS JOIN (VALUES ${rows}) AS v(value, "arValue", ord)
        WHERE q."key" = '${set.key}'
      `);
    }

    // ── Links: urgency + intraopEvents → all 13 categories ─────────────────
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
      JOIN "additional_questions" q ON q."departmentId" = d."id"
        AND q."key" IN ('urgency', 'intraopEvents')
      WHERE d."code" = 'GS'
    `);
    // approach → all except breast & thyroid (11)
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
        AND md."title" NOT IN ('breast lumps & cancer', 'thyroid nodules')
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'approach'
      WHERE d."code" = 'GS'
    `);
    // woundClass → all except breast, thyroid, bariatric (10)
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
        AND md."title" NOT IN ('breast lumps & cancer', 'thyroid nodules', 'bariatric conditions')
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'woundClass'
      WHERE d."code" = 'GS'
    `);
    // region → breast, thyroid, colorectal (3)
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('breast lumps & cancer'), ('thyroid nodules'), ('colorectal polyps & masses')
      ) AS m(title)
      JOIN "departments" d ON d."code" = 'GS'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'region'
    `);
    // stomaFormed → the 6 categories where a stoma is a real decision
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('abdominal trauma'), ('acute abdomen'), ('bowel obstruction'),
        ('colorectal polyps & masses'), ('diverticulitis'), ('perforated viscus')
      ) AS m(title)
      JOIN "departments" d ON d."code" = 'GS'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'stomaFormed'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades remove question_options, main_diag_questions and main_diag_question_options.
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'GS'
    `);
  }
}
