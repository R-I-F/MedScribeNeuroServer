import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * TRS (Transplant Surgery) additional-questions professor authoring — part 1 of 2
 * (part 2: migration 179 narrowing). Design record: MEDICAL_CODE_AUDITS/TRS/QUESTIONS_TRS.md.
 *
 * Fresh authoring (TRS had no question config). 6 questions:
 *  - donorType (NEW): THE transplant question — living / deceased-DBD / deceased-DCD; the 6
 *    recipient transplants (donor operations are invariantly living, so omitted). Narrowed to
 *    deceased-only for heart/lung/pancreas/multi-organ; living kept for liver/renal (the
 *    dominant living-donor model).
 *  - approach: only the 2 donor operations (open-vs-lap-vs-robotic debate); recipient implants
 *    are standardised open.
 *  - laterality: donor nephrectomy (left preferred), renal transplant (iliac fossa), lung
 *    transplant (single vs bilateral).
 *  - region ("Organ / graft involved"): multi-organ transplant + transplant complications.
 *  - urgency: immunologic rejection (urgent graftectomy) + transplant complications (re-op).
 *  - intraopEvents: all 10, renders last.
 * Skipped, justified: surgicalDomain, position, clinicalPresentation, graftType (VASC's key is
 * vascular conduits — wrong for whole-organ grafts). Still-open: rejectionType,
 * complicationType, cold-ischaemia time (single-category / numeric — deferred).
 */
export class AuthorTrsAdditionalQuestions1750000000178 implements MigrationInterface {
  name = "AuthorTrsAdditionalQuestions1750000000178";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Question definitions ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('donorType',     'Donor type',            'نوع المتبرع',           'single_choice', 0),
        ('approach',      'Surgical approach',     'المدخل الجراحي',        'single_choice', 1),
        ('laterality',    'Side (laterality)',     'الجهة (أيمن / أيسر)',   'single_choice', 2),
        ('region',        'Organ / graft involved','العضو / الطُعم المعني', 'single_choice', 3),
        ('urgency',       'Urgency of surgery',    'مدى إلحاح الجراحة',     'single_choice', 4),
        ('intraopEvents', 'Intraoperative events', 'الأحداث أثناء العملية', 'free_text',     9)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'TRS'
    `);

    // ── Options (value + arValue always together) ───────────────────────────
    const optionSets: Array<{ key: string; values: Array<[string, string]> }> = [
      {
        key: "donorType",
        values: [
          ["living donor", "متبرع حي"],
          ["deceased donor - brain death (dbd)", "متبرع متوفى - موت دماغي (DBD)"],
          ["deceased donor - circulatory death (dcd)", "متبرع متوفى - موت دوري (DCD)"],
          ["other", "أخرى"],
        ],
      },
      {
        key: "approach",
        values: [
          ["open", "مفتوح"],
          ["laparoscopic", "تنظير البطن"],
          ["hand-assisted laparoscopic", "تنظيري بمساعدة اليد"],
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
          ["liver graft", "طُعم الكبد"],
          ["kidney graft", "طُعم الكلية"],
          ["pancreas graft", "طُعم البنكرياس"],
          ["heart graft", "طُعم القلب"],
          ["lung graft", "طُعم الرئة"],
          ["combined grafts", "طُعوم مشتركة"],
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
    ];
    for (const set of optionSets) {
      const rows = set.values
        .map(([v, ar], i) => `('${v.replace(/'/g, "''")}', '${ar}', ${i})`)
        .join(", ");
      await queryRunner.query(`
        INSERT INTO "question_options" ("questionId", "value", "arValue", "sortOrder")
        SELECT q."id", v.value, v."arValue", v.ord
        FROM "additional_questions" q
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = 'TRS'
        CROSS JOIN (VALUES ${rows}) AS v(value, "arValue", ord)
        WHERE q."key" = '${set.key}'
      `);
    }

    // ── Links ───────────────────────────────────────────────────────────────
    // intraopEvents → all 10
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'intraopEvents'
      WHERE d."code" = 'TRS'
    `);
    // donorType → the 6 recipient transplants
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('liver transplant'), ('renal transplant'), ('pancreas transplant'),
        ('heart transplant'), ('lung transplant'), ('multi-organ transplant')
      ) AS m(title)
      JOIN "departments" d ON d."code" = 'TRS'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'donorType'
    `);
    // remaining keyed links from the design matrix
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('donor hepatectomy',       'approach'),
        ('donor nephrectomy',       'approach'),
        ('donor nephrectomy',       'laterality'),
        ('renal transplant',        'laterality'),
        ('lung transplant',         'laterality'),
        ('multi-organ transplant',  'region'),
        ('transplant complications','region'),
        ('immunologic rejection',   'urgency'),
        ('transplant complications','urgency')
      ) AS m(title, qkey)
      JOIN "departments" d ON d."code" = 'TRS'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = m.qkey
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades remove question_options, main_diag_questions and main_diag_question_options.
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'TRS'
    `);
  }
}
