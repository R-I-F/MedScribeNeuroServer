import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * MFS (Maxillofacial Surgery) additional-questions professor authoring — part 1 of 2
 * (part 2: migration 177 narrowing). Design record: MEDICAL_CODE_AUDITS/MFS/QUESTIONS_MFS.md.
 *
 * Fresh authoring (MFS had no question config). 7 questions:
 *  - region ("Facial region / jaw"): THE MFS mapping question — fracture-grade granularity
 *    for trauma (mandible condyle/angle/body, Le Fort, ZMC, orbit, NOE, frontal, panfacial),
 *    general jaw for cysts/implants/orthognathic, the three salivary glands; 7 categories.
 *  - approach: MFS-native intraoral vs extraoral vs combined (+ endoscopic-assisted for TMJ
 *    arthroscopy / subcondylar); 7 categories — skipped where intraoral is the only answer.
 *  - laterality: reused with `midline` (NOE, symphysis, cleft palate); 5 categories.
 *  - urgency: facial trauma, jaw fractures, dentoalveolar (odontogenic infection) only.
 *  - fixationMethod: reused ORTHO key with MFS options (ORIF miniplates / MMF / ORIF+MMF /
 *    conservative / ex-fix); facial trauma + jaw fractures.
 *  - nodalSurgery: reused SOC key with the neck-dissection ladder (none/SLNB/selective/
 *    modified radical/radical); oral cancer.
 *  - intraopEvents: all 12, renders last.
 * Skipped, justified: surgicalDomain (duplicates categories), position (invariant),
 * clinicalPresentation (preOpClinCond), ageGroup (cleft timing protocolized).
 */
export class AuthorMfsAdditionalQuestions1750000000176 implements MigrationInterface {
  name = "AuthorMfsAdditionalQuestions1750000000176";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Question definitions ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('laterality',     'Side (laterality)',     'الجهة (أيمن / أيسر)',        'single_choice', 0),
        ('region',         'Facial region / jaw',   'المنطقة الوجهية / الفك',     'single_choice', 1),
        ('approach',       'Surgical approach',     'المدخل الجراحي',             'single_choice', 2),
        ('urgency',        'Urgency of surgery',    'مدى إلحاح الجراحة',          'single_choice', 3),
        ('fixationMethod', 'Fixation method',       'طريقة التثبيت',              'single_choice', 4),
        ('nodalSurgery',   'Lymph node surgery',    'جراحة العقد اللمفاوية',      'single_choice', 5),
        ('intraopEvents',  'Intraoperative events', 'الأحداث أثناء العملية',      'free_text',     9)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'MFS'
    `);

    // ── Options (value + arValue always together) ───────────────────────────
    const optionSets: Array<{ key: string; values: Array<[string, string]> }> = [
      {
        key: "laterality",
        values: [
          ["right", "أيمن"],
          ["left", "أيسر"],
          ["bilateral", "ثنائي الجانب"],
          ["midline", "خط الوسط"],
        ],
      },
      {
        key: "region",
        values: [
          ["mandible - condyle / subcondylar", "الفك السفلي - اللقمة / تحت اللقمة"],
          ["mandible - angle / ramus", "الفك السفلي - الزاوية / الفرع"],
          ["mandible - body / symphysis", "الفك السفلي - الجسم / الارتفاق"],
          ["maxilla (le fort)", "الفك العلوي (لوفور)"],
          ["zygomaticomaxillary complex", "المركب الوجني الفكي"],
          ["orbital floor / rim", "أرضية / حافة الحجاج"],
          ["nasal / naso-orbito-ethmoid", "الأنف / الأنفي الحجاجي الغربالي"],
          ["frontal bone / sinus", "العظم الجبهي / الجيب الجبهي"],
          ["panfacial", "كسور وجهية شاملة"],
          ["maxilla", "الفك العلوي"],
          ["mandible", "الفك السفلي"],
          ["bimaxillary", "الفكان معًا"],
          ["parotid gland", "الغدة النكفية"],
          ["submandibular gland", "الغدة تحت الفك السفلي"],
          ["sublingual / minor glands", "الغدة تحت اللسان / الغدد الصغرى"],
        ],
      },
      {
        key: "approach",
        values: [
          ["intraoral", "داخل الفم"],
          ["extraoral (transcervical / facial)", "خارج الفم (عبر الرقبة / الوجه)"],
          ["combined intraoral + extraoral", "مشترك داخل وخارج الفم"],
          ["endoscopic-assisted", "بمساعدة المنظار"],
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
        key: "fixationMethod",
        values: [
          ["orif - miniplates / screws", "تثبيت داخلي مفتوح - شرائح مصغرة ومسامير"],
          ["closed reduction + mmf", "رد مغلق + تثبيت بين الفكين (MMF)"],
          ["orif + mmf", "تثبيت داخلي + تثبيت بين الفكين"],
          ["conservative / no fixation", "تحفظي / بدون تثبيت"],
          ["external fixation", "مثبت خارجي"],
          ["other", "أخرى"],
        ],
      },
      {
        key: "nodalSurgery",
        values: [
          ["none", "بدون"],
          ["sentinel lymph node biopsy", "خزعة العقدة الحارسة"],
          ["selective neck dissection", "تشريح رقبي انتقائي"],
          ["modified radical neck dissection", "تشريح رقبي جذري معدل"],
          ["radical neck dissection", "تشريح رقبي جذري"],
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
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = 'MFS'
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
      WHERE d."code" = 'MFS'
    `);
    // remaining keyed links from the design matrix
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('cleft lip & palate',                 'laterality'),
        ('facial trauma',                      'laterality'),
        ('jaw fractures',                      'laterality'),
        ('salivary gland pathology',           'laterality'),
        ('temporomandibular joint disorders',  'laterality'),
        ('dental implants',                    'region'),
        ('facial trauma',                      'region'),
        ('impacted teeth',                     'region'),
        ('jaw cysts & pathology',              'region'),
        ('jaw fractures',                      'region'),
        ('orthognathic surgery',               'region'),
        ('salivary gland pathology',           'region'),
        ('benign oral tumors',                 'approach'),
        ('facial trauma',                      'approach'),
        ('jaw cysts & pathology',              'approach'),
        ('jaw fractures',                      'approach'),
        ('oral cancer',                        'approach'),
        ('salivary gland pathology',           'approach'),
        ('temporomandibular joint disorders',  'approach'),
        ('dentoalveolar surgery',              'urgency'),
        ('facial trauma',                      'urgency'),
        ('jaw fractures',                      'urgency'),
        ('facial trauma',                      'fixationMethod'),
        ('jaw fractures',                      'fixationMethod'),
        ('oral cancer',                        'nodalSurgery')
      ) AS m(title, qkey)
      JOIN "departments" d ON d."code" = 'MFS'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = m.qkey
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades remove question_options, main_diag_questions and main_diag_question_options.
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'MFS'
    `);
  }
}
