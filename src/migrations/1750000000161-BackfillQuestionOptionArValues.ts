import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Backfills Arabic values ("arValue") for ALL existing question_options rows (NS 26 + CTS 39 = 65).
 * Both seed migrations (158, 159) left arValue NULL as a v1 shortcut; the platform is bilingual
 * everywhere else (departments.arName, main_diags.arTitle, diagnoses.icdArName). Terminology
 * follows the Arabic style already used across the reference data; standard Latin acronyms
 * (VATS) are kept in parentheses where that is how the term is used in practice.
 *
 * From this migration on, option inserts must always include arValue
 * (enforced by the /audit-questions skill).
 */
export class BackfillQuestionOptionArValues1750000000161 implements MigrationInterface {
  name = "BackfillQuestionOptionArValues1750000000161";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // [dept, questionKey, value, arValue]
    const translations: Array<[string, string, string, string]> = [
      // ── NS surgicalDomain (2) ──
      ["NS", "surgicalDomain", "spinal", "العمود الفقري"],
      ["NS", "surgicalDomain", "cranial", "الجمجمة"],
      // ── NS position (5) ──
      ["NS", "position", "supine", "استلقاء على الظهر"],
      ["NS", "position", "prone", "انبطاح على البطن"],
      ["NS", "position", "lateral", "وضع جانبي"],
      ["NS", "position", "concorde", "وضعية كونكورد"],
      ["NS", "position", "other", "أخرى"],
      // ── NS approach (15) ──
      ["NS", "approach", "pterional", "المدخل الجناحي (بتريونال)"],
      ["NS", "approach", "endonasal", "المدخل عبر الأنف"],
      ["NS", "approach", "suboccipital", "تحت القذالي"],
      ["NS", "approach", "retrosigmoid", "خلف الجيب السيني"],
      ["NS", "approach", "petrosal", "المدخل الصخري"],
      ["NS", "approach", "supraorbital", "فوق الحجاج"],
      ["NS", "approach", "transventricular (callosal)", "عبر البطين (عبر الجسم الثفني)"],
      ["NS", "approach", "transventricular (frontal)", "عبر البطين (جبهي)"],
      ["NS", "approach", "subfrontal", "تحت الجبهي"],
      ["NS", "approach", "occipital", "قذالي"],
      ["NS", "approach", "laminectomy", "استئصال الصفيحة الفقرية"],
      ["NS", "approach", "laminoplasty", "رأب الصفيحة الفقرية"],
      ["NS", "approach", "transoral", "عبر الفم"],
      ["NS", "approach", "transthoracic", "عبر الصدر"],
      ["NS", "approach", "other", "أخرى"],
      // ── NS region (4) ──
      ["NS", "region", "craniocervical", "قحفي عنقي"],
      ["NS", "region", "cervical", "عنقي"],
      ["NS", "region", "dorsal", "ظهري (صدري)"],
      ["NS", "region", "lumbar", "قطني"],
      // ── CTS position (5) ──
      ["CTS", "position", "right lateral decubitus", "استلقاء جانبي أيمن"],
      ["CTS", "position", "supine", "استلقاء على الظهر"],
      ["CTS", "position", "left lateral decubitus", "استلقاء جانبي أيسر"],
      ["CTS", "position", "semi-fowler", "وضعية شبه فاولر"],
      ["CTS", "position", "other", "أخرى"],
      // ── CTS approach (12) ──
      ["CTS", "approach", "vats (video-assisted thoracoscopic surgery)", "تنظير الصدر بمساعدة الفيديو (VATS)"],
      ["CTS", "approach", "mini-sternotomy", "شق القص المصغر"],
      ["CTS", "approach", "right anterolateral thoracotomy", "بضع الصدر الأمامي الوحشي الأيمن"],
      ["CTS", "approach", "clamshell incision", "شق الصدر الصدفي (كلامشيل)"],
      ["CTS", "approach", "robotic-assisted thoracoscopy", "تنظير الصدر بمساعدة الروبوت"],
      ["CTS", "approach", "median sternotomy", "شق القص الناصف"],
      ["CTS", "approach", "subxiphoid approach", "المدخل تحت الرهابة"],
      ["CTS", "approach", "left posterolateral thoracotomy", "بضع الصدر الخلفي الوحشي الأيسر"],
      ["CTS", "approach", "right posterolateral thoracotomy", "بضع الصدر الخلفي الوحشي الأيمن"],
      ["CTS", "approach", "left anterolateral thoracotomy", "بضع الصدر الأمامي الوحشي الأيسر"],
      ["CTS", "approach", "mediastinoscopy", "تنظير المنصف"],
      ["CTS", "approach", "other", "أخرى"],
      // ── CTS region (13) ──
      ["CTS", "region", "mitral valve", "الصمام الميترالي"],
      ["CTS", "region", "coronary arteries", "الشرايين التاجية"],
      ["CTS", "region", "right lung", "الرئة اليمنى"],
      ["CTS", "region", "thoracic aorta", "الأبهر الصدري"],
      ["CTS", "region", "left lung", "الرئة اليسرى"],
      ["CTS", "region", "aortic valve", "الصمام الأورطي"],
      ["CTS", "region", "pericardium / pleura", "التامور / غشاء الجنب"],
      ["CTS", "region", "mediastinum", "المنصف"],
      ["CTS", "region", "tricuspid / pulmonary valves", "الصمام ثلاثي الشرفات / الصمام الرئوي"],
      ["CTS", "region", "chest wall", "جدار الصدر"],
      ["CTS", "region", "trachea / airway", "القصبة الهوائية / مجرى الهواء"],
      ["CTS", "region", "atria / appendage", "الأذينان / الزائدة الأذينية"],
      ["CTS", "region", "whole heart", "القلب بأكمله"],
      // ── CTS urgency (4) ──
      ["CTS", "urgency", "elective", "اختياري (مجدول)"],
      ["CTS", "urgency", "urgent", "عاجل"],
      ["CTS", "urgency", "emergency", "طارئ"],
      ["CTS", "urgency", "salvage", "إنقاذي"],
      // ── CTS cpbStrategy (5) ──
      ["CTS", "cpbStrategy", "on-pump - cardioplegic arrest", "على المضخة - توقف قلبي بالكارديوبليجيا"],
      ["CTS", "cpbStrategy", "on-pump - beating heart", "على المضخة - قلب نابض"],
      ["CTS", "cpbStrategy", "off-pump", "بدون مضخة (قلب نابض)"],
      ["CTS", "cpbStrategy", "hypothermic circulatory arrest", "توقف الدورة الدموية مع خفض الحرارة"],
      ["CTS", "cpbStrategy", "none", "لم تُستخدم مجازة"],
    ];

    const rows = translations
      .map(([d, k, v, ar]) => `('${d}', '${k}', '${v.replace(/'/g, "''")}', '${ar}')`)
      .join(",\n        ");

    await queryRunner.query(`
      UPDATE "question_options" o
      SET "arValue" = v.ar
      FROM (VALUES
        ${rows}
      ) AS v(dept, key, value, ar)
      JOIN "departments" d ON d."code" = v.dept
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = v.key
      WHERE o."questionId" = q."id" AND o."value" = v.value
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Previous state: every option row had arValue NULL.
    await queryRunner.query(`
      UPDATE "question_options" o
      SET "arValue" = NULL
      FROM "additional_questions" q, "departments" d
      WHERE o."questionId" = q."id" AND q."departmentId" = d."id"
        AND d."code" IN ('NS', 'CTS')
    `);
  }
}
