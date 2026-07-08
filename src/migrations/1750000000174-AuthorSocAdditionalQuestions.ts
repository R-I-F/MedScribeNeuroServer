import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * SOC (Surgical Oncology) additional-questions professor authoring — part 1 of 2
 * (part 2: migration 175 narrowing). Design record: MEDICAL_CODE_AUDITS/SOC/QUESTIONS_SOC.md.
 *
 * Fresh authoring (SOC had no question config). 9 questions — oncology has three universal
 * axes no other department needed:
 *  - surgicalIntent (NEW): curative / palliative / diagnostic-staging / cytoreductive /
 *    prophylactic — THE oncology question; ALL 16 categories.
 *  - nodalSurgery (NEW): none / sampling / sentinel / regional / radical-extended
 *    (SLNB-vs-ALND, D1/D2, neck dissections, CME); 12 categories.
 *  - neoadjuvant (NEW): operating after chemo/radio changes the operation (rectal post-CRT,
 *    interval debulking, perioperative FLOT); 9 categories.
 * Plus canonical approach (10 abdominal-pelvic cats), laterality (4), region (5 cats where
 * site isn't in the diagnosis: skin/sarcoma/mets/lymphoma), urgency (colorectal + gastric
 * only — the rest of SOC is planned), stomaFormed reused with a urostomy (ileal conduit)
 * option (colorectal + genitourinary), intraopEvents (all 16).
 * Skipped, justified: surgicalDomain (duplicates categories), position, clinicalPresentation.
 * Still-open: resection-margin R status (pathology-dependent — post-op review field).
 */
export class AuthorSocAdditionalQuestions1750000000174 implements MigrationInterface {
  name = "AuthorSocAdditionalQuestions1750000000174";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Question definitions ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('surgicalIntent', 'Surgical intent',               'الهدف من الجراحة',             'single_choice', 0),
        ('nodalSurgery',   'Lymph node surgery',            'جراحة العقد اللمفاوية',        'single_choice', 1),
        ('neoadjuvant',    'Neoadjuvant therapy received',  'العلاج المساعد قبل الجراحة',   'single_choice', 2),
        ('approach',       'Surgical approach',             'المدخل الجراحي',               'single_choice', 3),
        ('laterality',     'Side (laterality)',             'الجهة (أيمن / أيسر)',          'single_choice', 4),
        ('region',         'Anatomical site',               'الموضع التشريحي',              'single_choice', 5),
        ('urgency',        'Urgency of surgery',            'مدى إلحاح الجراحة',            'single_choice', 6),
        ('stomaFormed',    'Stoma formed',                  'الفغرة المُنشأة',               'single_choice', 7),
        ('intraopEvents',  'Intraoperative events',         'الأحداث أثناء العملية',        'free_text',     9)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'SOC'
    `);

    // ── Options (value + arValue always together) ───────────────────────────
    const optionSets: Array<{ key: string; values: Array<[string, string]> }> = [
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
        key: "approach",
        values: [
          ["open", "مفتوح"],
          ["laparoscopic", "تنظير البطن"],
          ["laparoscopic converted to open", "تنظير بطن محوَّل إلى مفتوح"],
          ["robotic-assisted", "بمساعدة الروبوت"],
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
        key: "region",
        values: [
          ["head & neck", "الرأس والرقبة"],
          ["trunk / torso", "الجذع"],
          ["upper limb", "الطرف العلوي"],
          ["lower limb", "الطرف السفلي"],
          ["retroperitoneum", "خلف الصفاق"],
          ["intra-abdominal / peritoneal", "داخل البطن / الصفاق"],
          ["liver", "الكبد"],
          ["lung / thoracic", "الرئة / الصدر"],
          ["cervical nodes", "العقد الرقبية"],
          ["axillary nodes", "العقد الإبطية"],
          ["inguinal nodes", "العقد الإربية"],
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
          ["loop ileostomy", "فغرة لفائفية عروية"],
          ["end ileostomy", "فغرة لفائفية طرفية"],
          ["loop colostomy", "فغرة قولونية عروية"],
          ["end colostomy (hartmann)", "فغرة قولونية طرفية (هارتمان)"],
          ["urostomy (ileal conduit)", "فغرة بولية (قناة لفائفية)"],
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
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = 'SOC'
        CROSS JOIN (VALUES ${rows}) AS v(value, "arValue", ord)
        WHERE q."key" = '${set.key}'
      `);
    }

    // ── Links ───────────────────────────────────────────────────────────────
    // surgicalIntent + intraopEvents → all 16
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
      JOIN "additional_questions" q ON q."departmentId" = d."id"
        AND q."key" IN ('surgicalIntent', 'intraopEvents')
      WHERE d."code" = 'SOC'
    `);
    // nodalSurgery → all except HCC, sarcoma, metastatic, lymphoma (12)
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
        AND md."title" NOT IN ('hepatocellular carcinoma', 'soft tissue sarcoma', 'metastatic disease', 'surgical lymphoma')
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'nodalSurgery'
      WHERE d."code" = 'SOC'
    `);
    // remaining keyed links from the design matrix
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('breast cancer',                'neoadjuvant'),
        ('colorectal cancer',            'neoadjuvant'),
        ('gastric cancer',               'neoadjuvant'),
        ('genitourinary cancer',         'neoadjuvant'),
        ('gynaecological cancer',        'neoadjuvant'),
        ('head & neck cancer',           'neoadjuvant'),
        ('ovarian cancer',               'neoadjuvant'),
        ('pancreatic cancer',            'neoadjuvant'),
        ('soft tissue sarcoma',          'neoadjuvant'),
        ('biliary tract & gallbladder cancer', 'approach'),
        ('colorectal cancer',            'approach'),
        ('endocrine & adrenal tumours',  'approach'),
        ('gastric cancer',               'approach'),
        ('genitourinary cancer',         'approach'),
        ('gynaecological cancer',        'approach'),
        ('hepatocellular carcinoma',     'approach'),
        ('metastatic disease',           'approach'),
        ('ovarian cancer',               'approach'),
        ('pancreatic cancer',            'approach'),
        ('breast cancer',                'laterality'),
        ('endocrine & adrenal tumours',  'laterality'),
        ('genitourinary cancer',         'laterality'),
        ('ovarian cancer',               'laterality'),
        ('melanoma',                     'region'),
        ('metastatic disease',           'region'),
        ('non-melanoma skin cancer',     'region'),
        ('soft tissue sarcoma',          'region'),
        ('surgical lymphoma',            'region'),
        ('colorectal cancer',            'urgency'),
        ('gastric cancer',               'urgency'),
        ('colorectal cancer',            'stomaFormed'),
        ('genitourinary cancer',         'stomaFormed')
      ) AS m(title, qkey)
      JOIN "departments" d ON d."code" = 'SOC'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = m.qkey
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades remove question_options, main_diag_questions and main_diag_question_options.
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'SOC'
    `);
  }
}
