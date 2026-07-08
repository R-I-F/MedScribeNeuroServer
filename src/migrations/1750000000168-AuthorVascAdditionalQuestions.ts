import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * VASC (Vascular Surgery) additional-questions professor authoring — part 1 of 2
 * (part 2: migration 169 narrowing). Design record: MEDICAL_CODE_AUDITS/VASC/QUESTIONS_VASC.md.
 *
 * Fresh authoring (VASC had no question config). 6 questions:
 *  - approach: canonical key with VASC-native semantics — open vs endovascular vs hybrid,
 *    THE post-endovascular-revolution question; all 12 categories.
 *  - laterality: 9 categories (skipped for the midline-aorta three: AAA, dissection, TAA).
 *  - region ("Target vessel / segment"): only where the diagnosis doesn't encode the vessel —
 *    PAD (aortoiliac/fem-pop/infrapopliteal, matching the 2026 CPT LER territories),
 *    peripheral aneurysms, arterial trauma, VTE.
 *  - urgency: 9 categories (ruptured AAA / acute limb ischaemia / acute dissection);
 *    skipped for elective-only varicose veins, AVF creation, renal artery disease.
 *  - graftType (NEW VASC key): "what conduit and why?" — the bypass viva extended to the
 *    endo era (stent-graft / bare stent / DCB); 9 categories.
 *  - intraopEvents: all 12, renders last.
 * Skipped, justified: surgicalDomain (arterial/venous/access duplicates categories),
 * position (supine-dominant), clinicalPresentation (preOpClinCond exists). Still-open:
 * structured Fontaine/Rutherford stage (PAD) and symptomatic status (carotid) — deferred.
 */
export class AuthorVascAdditionalQuestions1750000000168 implements MigrationInterface {
  name = "AuthorVascAdditionalQuestions1750000000168";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Question definitions ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('laterality',    'Side (laterality)',        'الجهة (أيمن / أيسر)',           'single_choice', 0),
        ('approach',      'Surgical approach',        'المدخل الجراحي',                'single_choice', 1),
        ('region',        'Target vessel / segment',  'الوعاء / القطعة المستهدفة',     'single_choice', 2),
        ('urgency',       'Urgency of surgery',       'مدى إلحاح الجراحة',             'single_choice', 3),
        ('graftType',     'Conduit / device used',    'الطُعم / الجهاز المستخدم',       'single_choice', 4),
        ('intraopEvents', 'Intraoperative events',    'الأحداث أثناء العملية',         'free_text',     9)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'VASC'
    `);

    // ── Options (value + arValue always together) ───────────────────────────
    const optionSets: Array<{ key: string; values: Array<[string, string]> }> = [
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
          ["open surgery", "جراحة مفتوحة"],
          ["endovascular", "داخل الأوعية (تداخلي)"],
          ["hybrid (open + endovascular)", "هجين (مفتوح + داخل الأوعية)"],
          ["other", "أخرى"],
        ],
      },
      {
        key: "region",
        values: [
          ["aortoiliac segment", "القطعة الأبهرية الحرقفية"],
          ["femoropopliteal segment", "القطعة الفخذية المأبضية"],
          ["infrapopliteal (tibial) segment", "القطعة تحت المأبضية (الظنبوبية)"],
          ["popliteal artery", "الشريان المأبضي"],
          ["femoral artery", "الشريان الفخذي"],
          ["iliac artery", "الشريان الحرقفي"],
          ["visceral arteries", "الشرايين الحشوية"],
          ["neck vessels", "أوعية الرقبة"],
          ["upper limb vessels", "أوعية الطرف العلوي"],
          ["lower limb vessels", "أوعية الطرف السفلي"],
          ["abdominal / pelvic vessels", "الأوعية البطنية / الحوضية"],
          ["ivc / iliac veins", "الوريد الأجوف السفلي / الأوردة الحرقفية"],
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
        key: "graftType",
        values: [
          ["autologous vein", "وريد ذاتي"],
          ["prosthetic graft - ptfe", "طُعم صناعي - PTFE"],
          ["prosthetic graft - dacron", "طُعم صناعي - داكرون"],
          ["stent-graft (covered)", "دعامة مغطاة (ستنت جرافت)"],
          ["bare-metal stent", "دعامة معدنية غير مغطاة"],
          ["drug-coated balloon / stent", "بالون / دعامة دوائية"],
          ["patch angioplasty", "رأب الشريان بالرقعة"],
          ["none (primary repair / native)", "بدون طُعم (إصلاح أولي / أوعية ذاتية)"],
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
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = 'VASC'
        CROSS JOIN (VALUES ${rows}) AS v(value, "arValue", ord)
        WHERE q."key" = '${set.key}'
      `);
    }

    // ── Links ───────────────────────────────────────────────────────────────
    // approach + intraopEvents → all 12
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
      JOIN "additional_questions" q ON q."departmentId" = d."id"
        AND q."key" IN ('approach', 'intraopEvents')
      WHERE d."code" = 'VASC'
    `);
    // laterality → all except the midline-aorta three (9)
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
        AND md."title" NOT IN ('abdominal aortic aneurysm', 'aortic dissection', 'thoracic aortic aneurysm')
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'laterality'
      WHERE d."code" = 'VASC'
    `);
    // urgency → all except the elective-only three (9)
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
        AND md."title" NOT IN ('varicose veins', 'arteriovenous fistula', 'renal artery disease')
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'urgency'
      WHERE d."code" = 'VASC'
    `);
    // region + graftType from the design matrix
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('arterial trauma',            'region'),
        ('peripheral aneurysms',       'region'),
        ('peripheral artery disease',  'region'),
        ('venous thromboembolism',     'region'),
        ('abdominal aortic aneurysm',  'graftType'),
        ('aortic dissection',          'graftType'),
        ('arterial trauma',            'graftType'),
        ('arteriovenous fistula',      'graftType'),
        ('carotid artery disease',     'graftType'),
        ('peripheral aneurysms',       'graftType'),
        ('peripheral artery disease',  'graftType'),
        ('renal artery disease',       'graftType'),
        ('thoracic aortic aneurysm',   'graftType')
      ) AS m(title, qkey)
      JOIN "departments" d ON d."code" = 'VASC'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = m.qkey
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades remove question_options, main_diag_questions and main_diag_question_options.
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'VASC'
    `);
  }
}
