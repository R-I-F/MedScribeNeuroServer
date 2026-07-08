import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * HBP (Hepatobiliary & Pancreatic Surgery) additional-questions professor authoring —
 * part 1 of 2 (part 2: migration 173 narrowing).
 * Design record: MEDICAL_CODE_AUDITS/HBP/QUESTIONS_HBP.md.
 *
 * Fresh authoring (HBP had no question config). 5 questions:
 *  - approach: HBP is uniquely multi-modal — open / lap / robotic / endoscopic (ERCP) /
 *    percutaneous (PTBD, cholecystostomy, RFA, step-up necrosectomy); all 12 categories.
 *  - region ("Anatomical site / segment"): liver side/bilobar, cholangiocarcinoma level
 *    (intrahepatic/perihilar/distal), pancreatic head-body-tail, chronic-pancreatitis
 *    head-vs-diffuse; 7 categories where the diagnosis doesn't encode it.
 *  - urgency: 6 categories where it varies (emergency chole, necrosectomy timing,
 *    immediate-vs-delayed BDI repair, variceal bleeding, ruptured HCC); oncology
 *    electives skip it.
 *  - childPugh (NEW HBP key): "what was the Child grade?" — the first HBP examiner
 *    question for any operation on a cirrhotic liver; HCC + cirrhosis/portal-HTN.
 *  - intraopEvents: all 12, renders last.
 * Skipped, justified: surgicalDomain (liver/biliary/pancreas duplicates categories),
 * laterality (liver side lives in region), position (supine-dominant),
 * clinicalPresentation (preOpClinCond exists), biliary-reconstruction type (proc_cpts).
 * Still-open: BDI Strasberg classification; CBD-clearance method (single-category keys).
 */
export class AuthorHbpAdditionalQuestions1750000000172 implements MigrationInterface {
  name = "AuthorHbpAdditionalQuestions1750000000172";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── Question definitions ────────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "additional_questions" ("departmentId", "key", "label", "arLabel", "inputType", "sortOrder")
      SELECT d."id", v.key, v.label, v."arLabel", v."inputType", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES
        ('approach',      'Surgical approach',            'المدخل الجراحي',             'single_choice', 0),
        ('region',        'Anatomical site / segment',    'الموضع التشريحي',            'single_choice', 1),
        ('urgency',       'Urgency of surgery',           'مدى إلحاح الجراحة',          'single_choice', 2),
        ('childPugh',     'Liver function (Child-Pugh)',  'وظائف الكبد (تشايلد-بيو)',   'single_choice', 3),
        ('intraopEvents', 'Intraoperative events',        'الأحداث أثناء العملية',      'free_text',     9)
      ) AS v(key, label, "arLabel", "inputType", ord)
      WHERE d."code" = 'HBP'
    `);

    // ── Options (value + arValue always together) ───────────────────────────
    const optionSets: Array<{ key: string; values: Array<[string, string]> }> = [
      {
        key: "approach",
        values: [
          ["laparoscopic", "تنظير البطن"],
          ["laparoscopic converted to open", "تنظير بطن محوَّل إلى مفتوح"],
          ["open", "مفتوح"],
          ["robotic-assisted", "بمساعدة الروبوت"],
          ["endoscopic (ercp)", "بالمنظار الداخلي (ERCP)"],
          ["percutaneous", "عن طريق الجلد"],
          ["other", "أخرى"],
        ],
      },
      {
        key: "region",
        values: [
          ["right hemiliver", "الفص الأيمن للكبد"],
          ["left hemiliver", "الفص الأيسر للكبد"],
          ["bilobar / multiple segments", "الفصان / قطاعات متعددة"],
          ["intrahepatic ducts", "القنوات الصفراوية داخل الكبد"],
          ["perihilar (hilar)", "حول سرة الكبد (نقيري)"],
          ["mid / distal bile duct", "القناة الصفراوية الوسطى / البعيدة"],
          ["pancreatic head / uncinate", "رأس البنكرياس / الناتئ المعقوف"],
          ["pancreatic body", "جسم البنكرياس"],
          ["pancreatic tail", "ذيل البنكرياس"],
          ["diffuse pancreas", "البنكرياس بأكمله (منتشر)"],
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
        key: "childPugh",
        values: [
          ["non-cirrhotic", "غير متليف"],
          ["child-pugh a", "تشايلد-بيو أ"],
          ["child-pugh b", "تشايلد-بيو ب"],
          ["child-pugh c", "تشايلد-بيو ج"],
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
        JOIN "departments" d ON d."id" = q."departmentId" AND d."code" = 'HBP'
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
      WHERE d."code" = 'HBP'
    `);
    // region, urgency, childPugh from the design matrix
    await queryRunner.query(`
      INSERT INTO "main_diag_questions" ("mainDiagId", "questionId")
      SELECT md."id", q."id"
      FROM (VALUES
        ('benign liver lesions',                  'region'),
        ('biliary stricture',                     'region'),
        ('cholangiocarcinoma',                    'region'),
        ('chronic pancreatitis',                  'region'),
        ('hepatocellular carcinoma',              'region'),
        ('metastatic liver disease',              'region'),
        ('pancreatic cancer',                     'region'),
        ('acute pancreatitis',                    'urgency'),
        ('bile duct injuries',                    'urgency'),
        ('biliary stricture',                     'urgency'),
        ('cholecystitis & choledocholithiasis',   'urgency'),
        ('hepatocellular carcinoma',              'urgency'),
        ('liver cirrhosis & portal hypertension', 'urgency'),
        ('hepatocellular carcinoma',              'childPugh'),
        ('liver cirrhosis & portal hypertension', 'childPugh')
      ) AS m(title, qkey)
      JOIN "departments" d ON d."code" = 'HBP'
      JOIN "main_diags" md ON md."departmentId" = d."id" AND md."title" = m.title
      JOIN "additional_questions" q ON q."departmentId" = d."id" AND q."key" = m.qkey
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Cascades remove question_options, main_diag_questions and main_diag_question_options.
    await queryRunner.query(`
      DELETE FROM "additional_questions" q
      USING "departments" d
      WHERE q."departmentId" = d."id" AND d."code" = 'HBP'
    `);
  }
}
