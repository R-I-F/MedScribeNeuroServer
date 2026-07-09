import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OPHTHAL (Ophthalmology) additional-questions professor authoring — part 1 of 2
 * (part 2: migration 185 narrowing). Design record: MEDICAL_CODE_AUDITS/OPHTHAL/QUESTIONS_OPHTHAL.md.
 *
 * Fresh authoring (OPHTHAL had no question config). Design principle: the specific operation
 * (phaco / trabeculectomy / vitrectomy / LASIK …) is captured by proc_cpts, so the questions
 * are the orthogonal axes proc_cpts don't carry. 4 questions:
 *  - laterality: THE universal ophthalmic descriptor (which eye); all 12.
 *  - anesthesiaType (NEW): the standout ophthalmic axis (topical/block/GA); 8 options span
 *    surface/lid/orbital-block/GA; 11 categories (skipped for refractive — always topical).
 *  - urgency: the ophthalmic emergencies (open globe, mac-on RD, orbital compartment, acute
 *    angle-closure glaucoma); 4 categories.
 *  - intraopEvents: all 12 (posterior capsule rupture, vitreous loss, suprachoroidal haem).
 * A technique question is deliberately omitted (would duplicate proc_cpts). Skipped, justified:
 * approach, surgicalDomain, position, region, clinicalPresentation. Still-open: open-globe zone,
 * corneal graft type, orbital-tumour intent.
 */
export class AuthorOphthalAdditionalQuestions1750000000184 implements MigrationInterface {
  name = "AuthorOphthalAdditionalQuestions1750000000184";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Question definitions ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('laterality',     'Eye (laterality)',      'العين (يمنى / يسرى)',   'single_choice', 0),
        ('anesthesiaType', 'Anaesthesia type',      'نوع التخدير',           'single_choice', 1),
        ('urgency',        'Urgency of surgery',    'مدى إلحاح الجراحة',     'single_choice', 2),
        ('intraopEvents',  'Intraoperative events', 'الأحداث أثناء العملية', 'free_text',     9)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'OPHTHAL'
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
        key: "anesthesiaType",
        values: [
          ["topical", "موضعي (بالقطرة)"],
          ["subconjunctival", "تحت الملتحمة"],
          ["local infiltration", "تسلل موضعي (حقن)"],
          ["sub-tenon", "تحت محفظة تينون"],
          ["peribulbar", "حول المقلة"],
          ["retrobulbar", "خلف المقلة"],
          ["general anaesthesia", "تخدير عام"],
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
    ];
    for (const set of optionSets) {
      const rows = set.values
        .map(([v, ar], i) => `('${v.replace(/'/g, "''")}', '${ar}', ${i})`)
        .join(", ");
      await queryRunner.query(`
        INSERT INTO "question_options" ("questionId", "value", "arValue", "sortOrder")
        SELECT q."id", v.value, v."arValue", v.ord
        FROM "additional_questions" q
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = 'OPHTHAL'
        CROSS JOIN (VALUES ${rows}) AS v(value, "arValue", ord)
        WHERE q."key" = '${set.key}'
      `);
    }

    // ── Links ───────────────────────────────────────────────────────────────
    // laterality + intraopEvents → all 12
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
      JOIN "additional_questions" q ON q."departmentId" = d."id"
        AND q."key" IN ('laterality', 'intraopEvents')
      WHERE d."code" = 'OPHTHAL'
    `);
    // anesthesiaType → all except refractive errors (11)
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM "departments" d
      JOIN "main_diags" md ON md."departmentId" = d."id"
        AND md."title" <> 'refractive errors'
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'anesthesiaType'
      WHERE d."code" = 'OPHTHAL'
    `);
    // urgency → the 4 emergency-capable categories
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('glaucoma'), ('ocular trauma'), ('orbital pathology'), ('retinal detachment')
      ) AS m(title)
      JOIN "departments" d ON d."code" = 'OPHTHAL'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = 'urgency'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades remove question_options, main_diag_questions and main_diag_question_options.
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'OPHTHAL'
    `);
  }
}
