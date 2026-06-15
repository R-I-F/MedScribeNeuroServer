import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCptCodeMismatches1750000000043 implements MigrationInterface {
  name = "FixCptCodeMismatches1750000000043";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. 61516-00 "cyst fenestration" → 62161-02 ────────────────────────
    // Old: CPT 61516 = craniectomy for supratentorial tumor in eloquent cortex
    // New: CPT 62161 = neuroendoscopy with fenestration of intraventricular cysts
    await queryRunner.query(`
      DELETE FROM "proc_cpts" WHERE "alphaCode" = 'CRAN' AND "numCode" = '61516-00'
    `);
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description")
      VALUES (
        'cyst fenestration', 'CRAN', '62161-02',
        'Neuroendoscopic fenestration or excision of intracranial or intraventricular cyst',
        'استئصال الكيس بالمنظار العصبي',
        'فتح أو استئصال الكيس داخل الجمجمة أو داخل البطينات الدماغية بالمنظار العصبي لتخفيف الضغط أو تحسين تصريف السائل الدماغي الشوكي.'
      )
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
      SELECT md.id, p.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "proc_cpts" p ON p."alphaCode" = 'CRAN' AND p."numCode" = '62161-02'
      WHERE dept.code = 'NS' AND md.title = 'cns tumors'
      ON CONFLICT DO NOTHING
    `);

    // ── 2. 61703-00 "clipping" → 61700-00 ─────────────────────────────────
    // Old: CPT 61703 = cervical approach (extracranial carotid occlusion)
    // New: CPT 61700 = intracranial aneurysm surgery, carotid circulation
    await queryRunner.query(`
      DELETE FROM "proc_cpts" WHERE "alphaCode" = 'CRAN' AND "numCode" = '61703-00'
    `);
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description")
      VALUES (
        'clipping', 'CRAN', '61700-00',
        'Intracranial aneurysm clipping, carotid circulation',
        'ربط الأم الدموية بالقصاصة',
        'وضع قصاصة معدنية على قاعدة الأم الدموية داخل الجمجمة في الدورة الدموية السباتية عبر فتح جراحي لمنع انفجارها أو إعادة نزيفها.'
      )
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
      SELECT md.id, p.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "proc_cpts" p ON p."alphaCode" = 'CRAN' AND p."numCode" = '61700-00'
      WHERE dept.code = 'NS' AND md.title = 'neuro-vascular diseases'
      ON CONFLICT DO NOTHING
    `);

    // ── 3. 61715-00 "lesion / ultrasonic ablation" → 0398T-00 ─────────────
    // Old: CPT 61715 = retired/invalid code
    // New: CPT 0398T = MRI-guided focused ultrasound ablation, thalamus/GPi/STN
    await queryRunner.query(`
      DELETE FROM "proc_cpts" WHERE "alphaCode" = 'CRAN' AND "numCode" = '61715-00'
    `);
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description")
      VALUES (
        'lesion / ultrasonic ablation', 'CRAN', '0398T-00',
        'MRI-guided focused ultrasound ablation of thalamus, globus pallidus, or subthalamic nucleus for movement disorders',
        'استئصال الآفة بالموجات فوق الصوتية المركزة',
        'استخدام الموجات فوق الصوتية عالية الكثافة الموجهة بالرنين المغناطيسي لتدمير الأنسجة المستهدفة في المهاد أو الكرة الشاحبة أو النواة تحت المهادية لعلاج الرعاش واضطرابات الحركة.'
      )
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
      SELECT md.id, p.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "proc_cpts" p ON p."alphaCode" = 'CRAN' AND p."numCode" = '0398T-00'
      WHERE dept.code = 'NS' AND md.title = 'functional neurosurgery'
      ON CONFLICT DO NOTHING
    `);

    // ── 4. 61000-00 "ventricular tapping" → REMOVED ───────────────────────
    // Old: CPT 61000 = subdural tap via infant fontanelle (wrong age, compartment, access)
    // Fix: 61020-01 "tapping" is the correct code and already exists in the DB.
    //      Delete 61000-00 (CASCADE removes its main_diag_procs links).
    //      Add 61020-01 to "cns infection" — the one main_diag 61000-00 had that 61020-01 lacked.
    await queryRunner.query(`
      DELETE FROM "proc_cpts" WHERE "alphaCode" = 'MNR' AND "numCode" = '61000-00'
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
      SELECT md.id, p.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "proc_cpts" p ON p."alphaCode" = 'MNR' AND p."numCode" = '61020-01'
      WHERE dept.code = 'NS' AND md.title = 'cns infection'
      ON CONFLICT DO NOTHING
    `);

    // ── 5. 12001-00 "basic surgical step" → numCode 00001-00 ──────────────
    // Old: CPT 12001 = simple repair of superficial wound ≤2.5 cm (wrong concept entirely)
    // Fix: No valid single CPT covers a generic "basic surgical step".
    //      Recode as local placeholder 00001-00 (mirrors 00000-00 "other procedure").
    //      UPDATE preserves all main_diag_procs links (they reference the row UUID, not numCode).
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "numCode" = '00001-00'
      WHERE "alphaCode" = 'MNR' AND "numCode" = '12001-00'
    `);

    // ── 6. 0908T-00 "VNS" → 64568-00 ─────────────────────────────────────
    // Old: CPT 0908T (Cat III) = reassigned in CPT 2024 to TMS for OCD
    // New: CPT 64568 = open implantation of vagus nerve neurostimulator + pulse generator
    await queryRunner.query(`
      DELETE FROM "proc_cpts" WHERE "alphaCode" = 'PRPH' AND "numCode" = '0908T-00'
    `);
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description")
      VALUES (
        'Vagal nerve stimulator implantation', 'PRPH', '64568-00',
        'Open implantation of vagus nerve neurostimulator electrode array and pulse generator',
        'زرع منبه العصب المبهم',
        'زرع مجموعة أقطاب منبه العصب المبهم الأيسر مع الجهاز النابض تحت الجلد عبر جراحة مفتوحة لعلاج الصرع المقاوم للأدوية أو الاكتئاب الشديد المقاوم للعلاج.'
      )
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
      SELECT md.id, p.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "proc_cpts" p ON p."alphaCode" = 'PRPH' AND p."numCode" = '64568-00'
      WHERE dept.code = 'NS' AND md.title = 'functional neurosurgery'
      ON CONFLICT DO NOTHING
    `);

    // ── 7. Title fix: 62160-00 "laparoscopic" → "neuroendoscopic" ─────────
    // The procedure is intracranial neuroendoscopy, not laparoscopy
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title" = 'neuroendoscopic implantation of the ventricular catheter'
      WHERE "alphaCode" = 'VSHN' AND "numCode" = '62160-00'
    `);

    // ── 8. Title fix: 63087-00 "korpectomy" → "corpectomy" ────────────────
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title" = 'corpectomy'
      WHERE "alphaCode" = 'LAM' AND "numCode" = '63087-00'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 8 reverse
    await queryRunner.query(`
      UPDATE "proc_cpts" SET "title" = 'korpectomy'
      WHERE "alphaCode" = 'LAM' AND "numCode" = '63087-00'
    `);

    // 7 reverse
    await queryRunner.query(`
      UPDATE "proc_cpts" SET "title" = 'laparoscopic implantation of the ventricular catheter'
      WHERE "alphaCode" = 'VSHN' AND "numCode" = '62160-00'
    `);

    // 6 reverse: delete 64568-00, restore 0908T-00
    await queryRunner.query(`
      DELETE FROM "proc_cpts" WHERE "alphaCode" = 'PRPH' AND "numCode" = '64568-00'
    `);
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description")
      VALUES (
        'Vagal nerve compression', 'PRPH', '0908T-00',
        'Vagal nerve stimulator implantation',
        'تحفيز العصب المبهم',
        'زرع جهاز تحفيز العصب المبهم تحت الجلد وتوصيل أقطابه بالعصب المبهم الأيسر لعلاج الصرع المقاوم والاكتئاب.'
      )
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
      SELECT md.id, p.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "proc_cpts" p ON p."alphaCode" = 'PRPH' AND p."numCode" = '0908T-00'
      WHERE dept.code = 'NS' AND md.title = 'functional neurosurgery'
      ON CONFLICT DO NOTHING
    `);

    // 5 reverse: 00001-00 → 12001-00
    await queryRunner.query(`
      UPDATE "proc_cpts" SET "numCode" = '12001-00'
      WHERE "alphaCode" = 'MNR' AND "numCode" = '00001-00'
    `);

    // 4 reverse: restore 61000-00, remove added 61020-01 link from cns infection
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description")
      VALUES (
        'ventricular tapping', 'MNR', '61000-00',
        'Subdural or ventricular tap',
        'سحب سائل من البطينات الدماغية',
        'سحب السائل الدماغي الشوكي من البطينات الدماغية عبر ثقب في الجمجمة لتخفيف الضغط أو أخذ عينة تشخيصية.'
      )
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
      SELECT md.id, p.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "proc_cpts" p ON p."alphaCode" = 'MNR' AND p."numCode" = '61000-00'
      WHERE dept.code = 'NS'
        AND md.title IN ('cns infection','congenital anomalies, infantile hydrocephalus','csf disorders- other than infantile hydrocephalus')
      ON CONFLICT DO NOTHING
    `);
    await queryRunner.query(`
      DELETE FROM "main_diag_procs"
      WHERE "mainDiagId" = (
        SELECT md.id FROM "main_diags" md
        JOIN "departments" dept ON md."departmentId" = dept.id
        WHERE dept.code = 'NS' AND md.title = 'cns infection'
      )
      AND "procCptId" = (
        SELECT id FROM "proc_cpts" WHERE "alphaCode" = 'MNR' AND "numCode" = '61020-01'
      )
    `);

    // 3 reverse: delete 0398T-00, restore 61715-00
    await queryRunner.query(`
      DELETE FROM "proc_cpts" WHERE "alphaCode" = 'CRAN' AND "numCode" = '0398T-00'
    `);
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description")
      VALUES (
        'lesion / ultrasonic ablation', 'CRAN', '61715-00',
        'Lesion or ultrasonic ablation procedure',
        'استئصال الآفة',
        'إزالة أو تدمير الآفة الدماغية باستخدام تقنيات متعددة بما فيها الاستئصال بالموجات فوق الصوتية.'
      )
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
      SELECT md.id, p.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "proc_cpts" p ON p."alphaCode" = 'CRAN' AND p."numCode" = '61715-00'
      WHERE dept.code = 'NS' AND md.title = 'functional neurosurgery'
      ON CONFLICT DO NOTHING
    `);

    // 2 reverse: delete 61700-00, restore 61703-00
    await queryRunner.query(`
      DELETE FROM "proc_cpts" WHERE "alphaCode" = 'CRAN' AND "numCode" = '61700-00'
    `);
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description")
      VALUES (
        'clipping', 'CRAN', '61703-00',
        'Surgery of intracranial aneurysm, cervical approach',
        'ربط الأم الدموية (قصاصة)',
        'وضع قصاصة على الأم الدموية الدماغية لمنع تمددها أو انفجارها.'
      )
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
      SELECT md.id, p.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "proc_cpts" p ON p."alphaCode" = 'CRAN' AND p."numCode" = '61703-00'
      WHERE dept.code = 'NS' AND md.title = 'neuro-vascular diseases'
      ON CONFLICT DO NOTHING
    `);

    // 1 reverse: delete 62161-02, restore 61516-00
    await queryRunner.query(`
      DELETE FROM "proc_cpts" WHERE "alphaCode" = 'CRAN' AND "numCode" = '62161-02'
    `);
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description")
      VALUES (
        'cyst fenestration', 'CRAN', '61516-00',
        'Craniotomy for cyst fenestration',
        'فتح الكيس الدماغي',
        'إجراء جراحي لفتح الكيسات داخل الجمجمة أو تصريفها للتخفيف من الضغط الدماغي.'
      )
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
    await queryRunner.query(`
      INSERT INTO "main_diag_procs" ("mainDiagId","procCptId")
      SELECT md.id, p.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      JOIN "proc_cpts" p ON p."alphaCode" = 'CRAN' AND p."numCode" = '61516-00'
      WHERE dept.code = 'NS' AND md.title = 'cns tumors'
      ON CONFLICT DO NOTHING
    `);
  }
}
