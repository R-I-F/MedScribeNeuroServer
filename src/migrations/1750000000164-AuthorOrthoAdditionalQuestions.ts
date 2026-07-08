import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ORTHO (Orthopedic Surgery) additional-questions professor authoring — part 1 of 2
 * (part 2: migration 165 narrowing). Design record: MEDICAL_CODE_AUDITS/ORTHO/QUESTIONS_ORTHO.md.
 *
 * Fresh authoring (ORTHO had no question config). 8 questions:
 *  - laterality (NEW ORTHO key): THE universal orthopaedic axis, never in the diagnosis;
 *    14 categories (all except the 3 axial spine ones).
 *  - position: only where it truly varies (beach chair vs lateral for shoulder, traction
 *    table for femoral nailing, supine vs lateral for THR) — 3 categories.
 *  - approach: open vs arthroscopic vs percutaneous vs MIS. NOT on fracture categories
 *    (redundant with fixationMethod) nor bone tumours (open always).
 *  - region ("Bone / joint involved"): only where the diagnosis doesn't encode the site
 *    (bone tumours, osteomyelitis & septic joint, osteonecrosis).
 *  - urgency: only the 8 categories with a real urgent/emergency share; elective-only
 *    categories (ACL, CTS, OA, rotator cuff, stenosis…) skip it.
 *  - fixationMethod (NEW ORTHO key): "how did you fix it?" — the fracture viva; 6 categories.
 *  - fractureType (NEW ORTHO key): closed vs open + Gustilo grade; upper/lower fractures only.
 *  - intraopEvents: all 17, renders last.
 * Skipped, justified: surgicalDomain (duplicates urgency/categories), clinicalPresentation
 * (submissions carry preOpClinCond).
 */
export class AuthorOrthoAdditionalQuestions1750000000164 implements MigrationInterface {
  name = "AuthorOrthoAdditionalQuestions1750000000164";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Question definitions ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('laterality',     'Side (laterality)',               'الجهة (أيمن / أيسر)',      'single_choice', 0),
        ('position',       'Patient position',                'وضعية المريض',             'single_choice', 1),
        ('approach',       'Surgical approach',               'المدخل الجراحي',           'single_choice', 2),
        ('region',         'Bone / joint involved',           'العظم / المفصل المصاب',    'single_choice', 3),
        ('urgency',        'Urgency of surgery',              'مدى إلحاح الجراحة',        'single_choice', 4),
        ('fixationMethod', 'Fixation method',                 'طريقة التثبيت',            'single_choice', 5),
        ('fractureType',   'Fracture type (closed / open)',   'نوع الكسر (مغلق / مفتوح)', 'single_choice', 6),
        ('intraopEvents',  'Intraoperative events',           'الأحداث أثناء العملية',    'free_text',     9)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'ORTHO'
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
        key: "position",
        values: [
          ["supine", "استلقاء على الظهر"],
          ["prone", "انبطاح على البطن"],
          ["lateral decubitus", "استلقاء جانبي"],
          ["beach chair", "وضعية كرسي الشاطئ"],
          ["traction (fracture) table", "طاولة الجر (طاولة الكسور)"],
          ["other", "أخرى"],
        ],
      },
      {
        key: "approach",
        values: [
          ["open", "مفتوح"],
          ["arthroscopic", "بمنظار المفصل"],
          ["arthroscopic-assisted mini-open", "بمساعدة المنظار - فتح مصغر"],
          ["percutaneous", "عن طريق الجلد"],
          ["minimally invasive (tubular / endoscopic)", "طفيف التوغل (أنبوبي / منظاري)"],
          ["other", "أخرى"],
        ],
      },
      {
        key: "region",
        values: [
          ["femur", "عظم الفخذ"],
          ["tibia / fibula", "الظنبوب / الشظية"],
          ["humerus", "عظم العضد"],
          ["radius / ulna", "الكعبرة / الزند"],
          ["hand bones", "عظام اليد"],
          ["foot bones", "عظام القدم"],
          ["pelvis", "الحوض"],
          ["spine", "العمود الفقري"],
          ["shoulder joint", "مفصل الكتف"],
          ["hip joint", "مفصل الورك"],
          ["knee joint", "مفصل الركبة"],
          ["ankle joint", "مفصل الكاحل"],
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
          ["closed reduction + cast / splint", "رد مغلق + جبس / جبيرة"],
          ["percutaneous k-wires", "أسلاك كيرشنر عبر الجلد"],
          ["orif - plate & screws", "تثبيت داخلي مفتوح - شريحة ومسامير"],
          ["intramedullary nail", "مسمار نخاعي"],
          ["external fixator", "مثبت خارجي"],
          ["tension band wiring", "ربط سلكي شدّي"],
          ["spinal instrumentation (pedicle screws)", "تثبيت فقري (مسامير عنيقية)"],
          ["vertebroplasty / kyphoplasty (cement)", "رأب الفقرة بالأسمنت الطبي"],
          ["hemiarthroplasty", "استبدال مفصل جزئي"],
          ["total joint replacement", "استبدال مفصل كلي"],
          ["other", "أخرى"],
        ],
      },
      {
        key: "fractureType",
        values: [
          ["closed", "مغلق"],
          ["open - gustilo i", "مفتوح - جوستيلو الدرجة الأولى"],
          ["open - gustilo ii", "مفتوح - جوستيلو الدرجة الثانية"],
          ["open - gustilo iiia", "مفتوح - جوستيلو 3أ"],
          ["open - gustilo iiib", "مفتوح - جوستيلو 3ب"],
          ["open - gustilo iiic", "مفتوح - جوستيلو 3ج"],
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
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = 'ORTHO'
        CROSS JOIN (VALUES ${rows}) AS v(value, "arValue", ord)
        WHERE q."key" = '${set.key}'
      `);
    }

    // ── Links ───────────────────────────────────────────────────────────────
    // intraopEvents → all 17
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'intraopEvents'
      WHERE d."code" = 'ORTHO'
    `);
    // laterality → all except the 3 axial spine categories (14)
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
        AND md."title" NOT IN ('fractures (spine)', 'spinal stenosis', 'spondylolisthesis')
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'laterality'
      WHERE d."code" = 'ORTHO'
    `);
    // remaining keyed links from the design matrix
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('fractures (lower extremity)',           'position'),
        ('osteoarthritis',                        'position'),
        ('rotator cuff pathology',                'position'),
        ('anterior cruciate ligament injury',     'approach'),
        ('carpal tunnel syndrome',                'approach'),
        ('foot & ankle disorders',                'approach'),
        ('hand & wrist disorders',                'approach'),
        ('meniscal tears',                        'approach'),
        ('osteoarthritis',                        'approach'),
        ('osteomyelitis & septic joint',          'approach'),
        ('osteonecrosis',                         'approach'),
        ('paediatric & developmental conditions', 'approach'),
        ('rotator cuff pathology',                'approach'),
        ('spinal stenosis',                       'approach'),
        ('spondylolisthesis',                     'approach'),
        ('bone tumours',                          'region'),
        ('osteomyelitis & septic joint',          'region'),
        ('osteonecrosis',                         'region'),
        ('bone tumours',                          'urgency'),
        ('foot & ankle disorders',                'urgency'),
        ('fractures (lower extremity)',           'urgency'),
        ('fractures (spine)',                     'urgency'),
        ('fractures (upper extremity)',           'urgency'),
        ('osteomyelitis & septic joint',          'urgency'),
        ('paediatric & developmental conditions', 'urgency'),
        ('pathologic fractures',                  'urgency'),
        ('foot & ankle disorders',                'fixationMethod'),
        ('fractures (lower extremity)',           'fixationMethod'),
        ('fractures (spine)',                     'fixationMethod'),
        ('fractures (upper extremity)',           'fixationMethod'),
        ('paediatric & developmental conditions', 'fixationMethod'),
        ('pathologic fractures',                  'fixationMethod'),
        ('fractures (lower extremity)',           'fractureType'),
        ('fractures (upper extremity)',           'fractureType')
      ) AS m(title, qkey)
      JOIN "departments" d ON d."code" = 'ORTHO'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = m.qkey
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades remove question_options, main_diag_questions and main_diag_question_options.
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'ORTHO'
    `);
  }
}
