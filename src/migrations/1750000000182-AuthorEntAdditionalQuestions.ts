import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ENT (Otolaryngology) additional-questions professor authoring — part 1 of 2
 * (part 2: migration 183 narrowing). Design record: MEDICAL_CODE_AUDITS/ENT/QUESTIONS_ENT.md.
 *
 * Fresh authoring (ENT had no question config). 8 questions — SECOND all-reuse department
 * (after MFS): every key already exists.
 *  - approach: THE ENT axis, subsite-specific (endonasal / transoral / transcervical /
 *    transcanal / postauricular / direct laryngoscopy / external); 12 categories.
 *  - laterality: ear + salivary + thyroid lobe; 6 categories.
 *  - region ("Tumour subsite"): head & neck cancer subsite (oral cavity/oropharynx/larynx/
 *    hypopharynx/nasopharynx) — the H&N staging axis.
 *  - urgency: mastoiditis (acute), laryngeal pathology (airway), head & neck cancer (airway).
 *  - surgicalIntent / neoadjuvant: reused SOC keys for head & neck cancer.
 *  - nodalSurgery: reused MFS neck-dissection ladder for H&N cancer + thyroid & parathyroid.
 *  - intraopEvents: all 13, renders last.
 * otitis media with effusion = laterality + intraopEvents only (grommets are transcanal by
 * definition). Skipped, justified: surgicalDomain, position, clinicalPresentation.
 * Still-open: tympanoplasty graft material, OSA surgery level, hearing-loss device type.
 */
export class AuthorEntAdditionalQuestions1750000000182 implements MigrationInterface {
  name = "AuthorEntAdditionalQuestions1750000000182";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Question definitions ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('approach',       'Surgical approach',            'المدخل الجراحي',              'single_choice', 0),
        ('laterality',     'Side (laterality)',            'الجهة (أيمن / أيسر)',         'single_choice', 1),
        ('region',         'Tumour subsite',               'الموضع التشريحي للورم',       'single_choice', 2),
        ('urgency',        'Urgency of surgery',           'مدى إلحاح الجراحة',           'single_choice', 3),
        ('surgicalIntent', 'Surgical intent',              'الهدف من الجراحة',            'single_choice', 4),
        ('nodalSurgery',   'Lymph node surgery',           'جراحة العقد اللمفاوية',       'single_choice', 5),
        ('neoadjuvant',    'Neoadjuvant therapy received', 'العلاج المساعد قبل الجراحة',  'single_choice', 6),
        ('intraopEvents',  'Intraoperative events',        'الأحداث أثناء العملية',       'free_text',     9)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'ENT'
    `);

    // ── Options (value + arValue always together) ───────────────────────────
    const optionSets: Array<{ key: string; values: Array<[string, string]> }> = [
      {
        key: "approach",
        values: [
          ["endoscopic (endonasal)", "بالمنظار (عبر الأنف)"],
          ["transoral", "عبر الفم"],
          ["transcervical (open neck)", "عبر الرقبة (فتح رقبي)"],
          ["transcanal", "عبر قناة الأذن"],
          ["postauricular", "خلف الأذن"],
          ["direct laryngoscopy / microlaryngoscopy", "تنظير الحنجرة المباشر / المجهري"],
          ["external / open", "خارجي / مفتوح"],
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
          ["oral cavity", "تجويف الفم"],
          ["oropharynx", "البلعوم الفموي"],
          ["larynx", "الحنجرة"],
          ["hypopharynx", "البلعوم السفلي"],
          ["nasopharynx", "البلعوم الأنفي"],
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
          ["sentinel lymph node biopsy", "خزعة العقدة الحارسة"],
          ["selective neck dissection", "تشريح رقبي انتقائي"],
          ["modified radical neck dissection", "تشريح رقبي جذري معدل"],
          ["radical neck dissection", "تشريح رقبي جذري"],
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
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = 'ENT'
        CROSS JOIN (VALUES ${rows}) AS v(value, "arValue", ord)
        WHERE q."key" = '${set.key}'
      `);
    }

    // ── Links ───────────────────────────────────────────────────────────────
    // intraopEvents → all 13
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'intraopEvents'
      WHERE d."code" = 'ENT'
    `);
    // remaining keyed links from the design matrix
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('chronic sinusitis',                'approach'),
        ('deviated septum',                  'approach'),
        ('head & neck cancer',               'approach'),
        ('hearing loss',                     'approach'),
        ('laryngeal pathology',              'approach'),
        ('mastoiditis',                      'approach'),
        ('nasal polyps',                     'approach'),
        ('obstructive sleep apnea',          'approach'),
        ('salivary gland disease',           'approach'),
        ('thyroid & parathyroid diseases',   'approach'),
        ('tonsillitis & adenoid hypertrophy','approach'),
        ('tympanic membrane perforation',    'approach'),
        ('hearing loss',                     'laterality'),
        ('mastoiditis',                      'laterality'),
        ('otitis media with effusion',       'laterality'),
        ('salivary gland disease',           'laterality'),
        ('thyroid & parathyroid diseases',   'laterality'),
        ('tympanic membrane perforation',    'laterality'),
        ('head & neck cancer',               'region'),
        ('head & neck cancer',               'urgency'),
        ('laryngeal pathology',              'urgency'),
        ('mastoiditis',                      'urgency'),
        ('head & neck cancer',               'surgicalIntent'),
        ('head & neck cancer',               'nodalSurgery'),
        ('thyroid & parathyroid diseases',   'nodalSurgery'),
        ('head & neck cancer',               'neoadjuvant')
      ) AS m(title, qkey)
      JOIN "departments" d ON d."code" = 'ENT'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = m.qkey
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades remove question_options, main_diag_questions and main_diag_question_options.
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'ENT'
    `);
  }
}
