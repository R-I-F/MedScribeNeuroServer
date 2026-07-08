import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PRS (Plastic & Reconstructive Surgery) additional-questions professor authoring — part 1
 * of 2 (part 2: migration 167 narrowing). Design record: MEDICAL_CODE_AUDITS/PRS/QUESTIONS_PRS.md.
 *
 * Fresh authoring (PRS had no question config). 5 questions:
 *  - laterality: reused ORTHO key + 4th option `midline` (cleft palate, neck contracture are
 *    midline structures). 6 categories where side is real and not in the diagnosis.
 *  - region ("Anatomical site"): 15 sites incl. pressure-ulcer classics (sacrum/ischium/
 *    trochanter/heel) and post-burn contracture sites; 5 categories only.
 *  - urgency: only the 4 trauma-facing categories; the rest of PRS is elective.
 *  - reconstructionMethod (NEW PRS key): THE plastics viva — the reconstructive ladder
 *    (primary closure → secondary intention → sTSG/FTSG → local/pedicled/free flap →
 *    tissue expansion). 9 categories.
 *  - intraopEvents: all 12, renders last.
 * Skipped, justified: approach (reconstructionMethod IS the plastics-native approach axis),
 * surgicalDomain (aesthetic-vs-reconstructive duplicates categories), position (supine-
 * dominant), clinicalPresentation (preOpClinCond exists), burnDepth (encoded in the burn
 * diagnoses ND92.1/.2/.3). aesthetic surgery = intraopEvents only (elective; the operation
 * is fully captured by proc_cpts). Still-open: burns TBSA%, cleft repair technique, nerve
 * repair type (single-category keys deferred).
 */
export class AuthorPrsAdditionalQuestions1750000000166 implements MigrationInterface {
  name = "AuthorPrsAdditionalQuestions1750000000166";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Question definitions ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('laterality',           'Side (laterality)',               'الجهة (أيمن / أيسر)',                'single_choice', 0),
        ('region',               'Anatomical site',                 'الموضع التشريحي',                    'single_choice', 1),
        ('urgency',              'Urgency of surgery',              'مدى إلحاح الجراحة',                  'single_choice', 2),
        ('reconstructionMethod', 'Reconstruction method (ladder)',  'طريقة إعادة البناء (السلم الترميمي)', 'single_choice', 3),
        ('intraopEvents',        'Intraoperative events',           'الأحداث أثناء العملية',              'free_text',     9)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'PRS'
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
          ["face", "الوجه"],
          ["scalp", "فروة الرأس"],
          ["neck", "الرقبة"],
          ["trunk", "الجذع"],
          ["breast", "الثدي"],
          ["axilla", "الإبط"],
          ["upper limb", "الطرف العلوي"],
          ["hand", "اليد"],
          ["lower limb", "الطرف السفلي"],
          ["foot", "القدم"],
          ["sacrum", "العجز"],
          ["ischium", "الحدبة الإسكية"],
          ["trochanter", "مدور الفخذ"],
          ["heel", "الكعب"],
          ["perineum", "العجان"],
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
        key: "reconstructionMethod",
        values: [
          ["primary closure", "إغلاق أولي"],
          ["healing by secondary intention", "التئام ثانوي"],
          ["split-thickness skin graft", "رقعة جلدية جزئية السماكة"],
          ["full-thickness skin graft", "رقعة جلدية كاملة السماكة"],
          ["local flap", "شريحة موضعية"],
          ["regional / pedicled flap", "شريحة إقليمية / معنَّقة"],
          ["free flap (microvascular)", "شريحة حرة (مفاغرة وعائية دقيقة)"],
          ["tissue expansion", "توسيع الأنسجة"],
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
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = 'PRS'
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
      WHERE d."code" = 'PRS'
    `);
    // remaining keyed links from the design matrix
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('breast reconstruction',              'laterality'),
        ('cleft lip & palate',                 'laterality'),
        ('congenital anomalies',               'laterality'),
        ('contractures',                       'laterality'),
        ('hand trauma',                        'laterality'),
        ('nerve injuries',                     'laterality'),
        ('contractures',                       'region'),
        ('pressure ulcers',                    'region'),
        ('scar revision',                      'region'),
        ('traumatic lacerations & avulsions',  'region'),
        ('tumor reconstruction',               'region'),
        ('burn injuries',                      'urgency'),
        ('hand trauma',                        'urgency'),
        ('nerve injuries',                     'urgency'),
        ('traumatic lacerations & avulsions',  'urgency'),
        ('breast reconstruction',              'reconstructionMethod'),
        ('burn injuries',                      'reconstructionMethod'),
        ('congenital anomalies',               'reconstructionMethod'),
        ('contractures',                       'reconstructionMethod'),
        ('hand trauma',                        'reconstructionMethod'),
        ('pressure ulcers',                    'reconstructionMethod'),
        ('scar revision',                      'reconstructionMethod'),
        ('traumatic lacerations & avulsions',  'reconstructionMethod'),
        ('tumor reconstruction',               'reconstructionMethod')
      ) AS m(title, qkey)
      JOIN "departments" d ON d."code" = 'PRS'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = m.qkey
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades remove question_options, main_diag_questions and main_diag_question_options.
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'PRS'
    `);
  }
}
