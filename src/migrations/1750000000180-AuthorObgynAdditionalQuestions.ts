import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OBGYN (Obstetrics & Gynecology) additional-questions professor authoring — part 1 of 2
 * (part 2: migration 181 narrowing). Design record: MEDICAL_CODE_AUDITS/OBGYN/QUESTIONS_OBGYN.md.
 *
 * Fresh authoring (OBGYN had no question config). 8 questions spanning obstetric + gynae:
 *  - approach: OBGYN-native spectrum abdominal(open)/laparoscopic/robotic/vaginal/
 *    hysteroscopic; 8 categories (7 gynae + ectopic).
 *  - laterality: adnexal side — ovarian cysts, ectopic (tube), pelvic mass.
 *  - urgency: the obstetric emergencies (cat-1 CS, ruptured ectopic, abruption/previa, PPH,
 *    septic miscarriage); 5 obstetric categories.
 *  - gestationalAge (NEW): THE obstetric axis (preterm vs term); cesarean, miscarriage,
 *    placental abnormalities, vaginal delivery complications.
 *  - surgicalIntent / nodalSurgery / neoadjuvant: reused SOC keys for gynaecologic cancer
 *    (single-category reuse keeps the gynae-onc JSONB consistent with SOC).
 *  - intraopEvents: all 12, renders last.
 * Skipped, justified: surgicalDomain (obstetric/gynae duplicates categories), position
 * (implied by approach), region (each category is the organ), clinicalPresentation
 * (preOpClinCond). Still-open: miscarriage management mode, perineal-tear degree, FIGO stage.
 */
export class AuthorObgynAdditionalQuestions1750000000180 implements MigrationInterface {
  name = "AuthorObgynAdditionalQuestions1750000000180";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Question definitions ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('approach',       'Surgical approach',            'المدخل الجراحي',              'single_choice', 0),
        ('laterality',     'Side (laterality)',            'الجهة (أيمن / أيسر)',         'single_choice', 1),
        ('urgency',        'Urgency of surgery',           'مدى إلحاح الجراحة',           'single_choice', 2),
        ('gestationalAge', 'Gestational age',              'عمر الحمل',                   'single_choice', 3),
        ('surgicalIntent', 'Surgical intent',              'الهدف من الجراحة',            'single_choice', 4),
        ('nodalSurgery',   'Lymph node surgery',           'جراحة العقد اللمفاوية',       'single_choice', 5),
        ('neoadjuvant',    'Neoadjuvant therapy received', 'العلاج المساعد قبل الجراحة',  'single_choice', 6),
        ('intraopEvents',  'Intraoperative events',        'الأحداث أثناء العملية',       'free_text',     9)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'OBGYN'
    `);

    // ── Options (value + arValue always together) ───────────────────────────
    const optionSets: Array<{ key: string; values: Array<[string, string]> }> = [
      {
        key: "approach",
        values: [
          ["abdominal (open)", "بطني (مفتوح)"],
          ["laparoscopic", "تنظير البطن"],
          ["robotic-assisted", "بمساعدة الروبوت"],
          ["vaginal", "مهبلي"],
          ["hysteroscopic", "تنظير الرحم"],
          ["other", "أخرى"],
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
        key: "urgency",
        values: [
          ["elective", "اختياري (مجدول)"],
          ["urgent", "عاجل"],
          ["emergency", "طارئ"],
        ],
      },
      {
        key: "gestationalAge",
        values: [
          ["first trimester", "الثلث الأول من الحمل"],
          ["second trimester", "الثلث الثاني من الحمل"],
          ["third trimester - preterm", "الثلث الثالث - مبتسر"],
          ["third trimester - term", "الثلث الثالث - مكتمل"],
        ],
      },
      {
        key: "surgicalIntent",
        values: [
          ["curative (radical)", "شافٍ (جذري)"],
          ["palliative", "تلطيفي"],
          ["diagnostic / staging", "تشخيصي / تحديد المرحلة"],
          ["cytoreductive (debulking)", "اختزال الورم (استئصال جزئي)"],
          ["prophylactic (risk-reducing)", "وقائي (خفض الخطورة)"],
        ],
      },
      {
        key: "nodalSurgery",
        values: [
          ["none", "بدون"],
          ["nodal sampling", "أخذ عينات من العقد"],
          ["sentinel lymph node biopsy", "خزعة العقدة الحارسة"],
          ["regional lymphadenectomy", "استئصال العقد الإقليمية"],
          ["radical / extended lymphadenectomy", "استئصال العقد الجذري / الموسع"],
        ],
      },
      {
        key: "neoadjuvant",
        values: [
          ["none", "بدون"],
          ["chemotherapy", "علاج كيميائي"],
          ["radiotherapy", "علاج إشعاعي"],
          ["chemoradiotherapy", "علاج كيميائي إشعاعي"],
          ["immunotherapy / targeted therapy", "علاج مناعي / موجه"],
          ["hormonal therapy", "علاج هرموني"],
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
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = 'OBGYN'
        CROSS JOIN (VALUES ${rows}) AS v(value, "arValue", ord)
        WHERE q."key" = '${set.key}'
      `);
    }

    // ── Links ───────────────────────────────────────────────────────────────
    // intraopEvents → all 12
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'intraopEvents'
      WHERE d."code" = 'OBGYN'
    `);
    // remaining keyed links from the design matrix
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('ectopic pregnancy',             'approach'),
        ('endometriosis',                 'approach'),
        ('gynecologic cancer',            'approach'),
        ('ovarian cysts & masses',        'approach'),
        ('pelvic mass',                   'approach'),
        ('stress urinary incontinence',   'approach'),
        ('uterine fibroids',              'approach'),
        ('uterine prolapse',              'approach'),
        ('ectopic pregnancy',             'laterality'),
        ('ovarian cysts & masses',        'laterality'),
        ('pelvic mass',                   'laterality'),
        ('cesarean section',              'urgency'),
        ('ectopic pregnancy',             'urgency'),
        ('miscarriage',                   'urgency'),
        ('placental abnormalities',       'urgency'),
        ('vaginal delivery complications','urgency'),
        ('cesarean section',              'gestationalAge'),
        ('miscarriage',                   'gestationalAge'),
        ('placental abnormalities',       'gestationalAge'),
        ('vaginal delivery complications','gestationalAge'),
        ('gynecologic cancer',            'surgicalIntent'),
        ('gynecologic cancer',            'nodalSurgery'),
        ('gynecologic cancer',            'neoadjuvant')
      ) AS m(title, qkey)
      JOIN "departments" d ON d."code" = 'OBGYN'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = m.qkey
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades remove question_options, main_diag_questions and main_diag_question_options.
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'OBGYN'
    `);
  }
}
