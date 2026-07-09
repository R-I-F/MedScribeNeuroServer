import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * UROL (Urology) additional-questions professor authoring — part 1 of 2
 * (part 2: migration 187 narrowing). Design record: MEDICAL_CODE_AUDITS/UROL/QUESTIONS_UROL.md.
 *
 * Fresh authoring (UROL had no question config). THIRD all-reuse department (after MFS, ENT) —
 * every key already exists; UROL closes the 15-department set from established vocabulary.
 * 8 questions:
 *  - approach: THE urology axis (open/laparoscopic/robotic/transurethral/percutaneous); all 13.
 *  - laterality: kidney/ureter/testis/graft side; 6 categories.
 *  - urgency: acute retention, obstructed-infected system, priapism; 4 categories.
 *  - surgicalIntent / nodalSurgery / neoadjuvant: reused SOC keys for the 4 urologic cancers
 *    (bladder, prostate, renal, testicular).
 *  - donorType: reused TRS key for renal transplantation.
 *  - intraopEvents: all 13, renders last.
 * Skipped, justified: surgicalDomain, position, region, clinicalPresentation. No new keys.
 * Still-open: stone site/burden, continence device type.
 */
export class AuthorUrolAdditionalQuestions1750000000186 implements MigrationInterface {
  name = "AuthorUrolAdditionalQuestions1750000000186";

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
        ('surgicalIntent', 'Surgical intent',              'الهدف من الجراحة',            'single_choice', 3),
        ('nodalSurgery',   'Lymph node surgery',           'جراحة العقد اللمفاوية',       'single_choice', 4),
        ('neoadjuvant',    'Neoadjuvant therapy received', 'العلاج المساعد قبل الجراحة',  'single_choice', 5),
        ('donorType',      'Donor type',                   'نوع المتبرع',                 'single_choice', 6),
        ('intraopEvents',  'Intraoperative events',        'الأحداث أثناء العملية',       'free_text',     9)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'UROL'
    `);

    // ── Options (value + arValue always together) ───────────────────────────
    const optionSets: Array<{ key: string; values: Array<[string, string]> }> = [
      {
        key: "approach",
        values: [
          ["open", "مفتوح"],
          ["laparoscopic", "تنظير البطن"],
          ["robotic-assisted", "بمساعدة الروبوت"],
          ["transurethral (endoscopic)", "عبر الإحليل (بالمنظار)"],
          ["percutaneous", "عن طريق الجلد"],
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
      {
        key: "donorType",
        values: [
          ["living donor", "متبرع حي"],
          ["deceased donor - brain death (dbd)", "متبرع متوفى - موت دماغي (DBD)"],
          ["deceased donor - circulatory death (dcd)", "متبرع متوفى - موت دوري (DCD)"],
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
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = 'UROL'
        CROSS JOIN (VALUES ${rows}) AS v(value, "arValue", ord)
        WHERE q."key" = '${set.key}'
      `);
    }

    // ── Links ───────────────────────────────────────────────────────────────
    // approach + intraopEvents → all 13
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
      JOIN "additional_questions" q ON q."departmentId" = d."id"
        AND q."key" IN ('approach', 'intraopEvents')
      WHERE d."code" = 'UROL'
    `);
    // the 4 urologic cancers → surgicalIntent + nodalSurgery + neoadjuvant
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('bladder cancer'), ('prostate cancer'), ('renal cancer'), ('testicular cancer')
      ) AS m(title)
      JOIN "departments" d ON d."code" = 'UROL'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id"
        AND q."key" IN ('surgicalIntent', 'nodalSurgery', 'neoadjuvant')
    `);
    // remaining keyed links from the design matrix
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('male infertility',       'laterality'),
        ('nephrolithiasis',        'laterality'),
        ('renal cancer',           'laterality'),
        ('renal transplantation',  'laterality'),
        ('testicular cancer',      'laterality'),
        ('ureteral obstruction',   'laterality'),
        ('nephrolithiasis',        'urgency'),
        ('penile pathology',       'urgency'),
        ('ureteral obstruction',   'urgency'),
        ('urinary retention',      'urgency'),
        ('renal transplantation',  'donorType')
      ) AS m(title, qkey)
      JOIN "departments" d ON d."code" = 'UROL'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = m.qkey
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades remove question_options, main_diag_questions and main_diag_question_options.
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'UROL'
    `);
  }
}
