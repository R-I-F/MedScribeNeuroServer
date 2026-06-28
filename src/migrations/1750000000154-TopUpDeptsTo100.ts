import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Restores VASC and HBP (96) and PEDSURG (99) to the project's 100-diagnoses floor after the
 * ampersand-cleanup merges in migration 152 removed redundant duplicate rows. Adds genuinely
 * distinct, ICD-11-verified conditions absent from each department (checked against the live
 * dept lists). Posterior urethral valve already exists for UROL, so it is shared into PEDSURG.
 */
export class TopUpDeptsTo1001750000000154 implements MigrationInterface {
  name = "TopUpDeptsTo1001750000000154";

  private async add(r: QueryRunner, dept: string, code: string, en: string, ar: string, enD: string, arD: string, md: string): Promise<void> {
    await r.query(
      `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("icdCode") DO NOTHING`, [code, en, ar, enD, arD]);
    await r.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = $1 AND d."icdCode" = $2 ON CONFLICT DO NOTHING`, [dept, code]);
    await r.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d WHERE dept.code = $1 AND md.title = $3 AND d."icdCode" = $2 ON CONFLICT DO NOTHING`,
      [dept, code, md]);
  }
  private async remove(r: QueryRunner, code: string): Promise<void> {
    await r.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "diagnoses" WHERE "icdCode" = $1`, [code]);
  }

  public async up(q: QueryRunner): Promise<void> {
    // ── VASC +4 (vasculitides + subclavian steal) ────────────────────────────
    await this.add(q, "VASC", "4A44.2", "giant cell arteritis", "التهاب الشرايين خلوي عرطل (الصدغي)",
      "Large-vessel granulomatous vasculitis of the elderly affecting cranial and aortic-arch branches; risks vision loss and aortic aneurysm.",
      "التهاب أوعية حُبيبومي كبير الأوعية لدى المسنّين يصيب الفروع القحفية وفروع قوس الأبهر؛ يهدّد بفقد البصر وأمّ دم أبهرية.", "carotid artery disease");
    await this.add(q, "VASC", "4A44.4", "polyarteritis nodosa", "التهاب الشرايين العقدي",
      "Necrotising medium-vessel vasculitis causing microaneurysms, visceral and limb ischaemia; may present with mesenteric or renal arterial involvement.",
      "التهاب أوعية ناخر متوسط الأوعية يسبب أمّات دم دقيقة وإقفاراً حشوياً وطرفياً؛ قد يتظاهر بإصابة شريانية مساريقية أو كلوية.", "peripheral artery disease");
    await this.add(q, "VASC", "4A44.A1", "granulomatosis with polyangiitis (Wegener)", "الورم الحُبيبي مع التهاب الأوعية المتعدد (فيغنر)",
      "ANCA-associated small-vessel vasculitis with respiratory and renal involvement; vascular surgery relevance via aneurysm and limb ischaemia.",
      "التهاب أوعية صغير مرتبط بأضداد ANCA مع إصابة تنفسية وكلوية؛ ذو صلة بجراحة الأوعية عبر أمّات الدم وإقفار الأطراف.", "peripheral artery disease");
    await this.add(q, "VASC", "8B22.A", "subclavian steal syndrome", "متلازمة سرقة تحت الترقوة",
      "Retrograde vertebral artery flow from proximal subclavian stenosis/occlusion causing arm claudication and posterior-circulation symptoms.",
      "جريان راجع في الشريان الفقري بسبب تضيّق/انسداد تحت الترقوة الداني يسبب عرجاً في الذراع وأعراض الدوران الخلفي.", "carotid artery disease");

    // ── HBP +4 ───────────────────────────────────────────────────────────────
    await this.add(q, "HBP", "DB91.Z", "acute liver failure", "الفشل الكبدي الحاد",
      "Rapid loss of hepatic function with coagulopathy and encephalopathy in a previously normal liver; may require emergency transplantation.",
      "فقدان سريع للوظيفة الكبدية مع اعتلال تخثّري واعتلال دماغي في كبد سليم سابقاً؛ قد يستلزم زرعاً إسعافياً.", "liver cirrhosis & portal hypertension");
    await this.add(q, "HBP", "DC14.0", "haemobilia", "النزف الصفراوي (تدمّي الصفراء)",
      "Bleeding into the biliary tree, usually after hepatic trauma, biopsy or instrumentation; managed by angioembolisation.",
      "نزف داخل الشجرة الصفراوية، عادةً بعد رضّ كبدي أو خزعة أو تداخل؛ يُدبَّر بالإصمام الوعائي.", "bile duct injuries");
    await this.add(q, "HBP", "DC14.2", "sphincter of Oddi dysfunction", "خلل وظيفة مصرّة أودي",
      "Motility disorder of the biliary/pancreatic sphincter causing biliary-type pain and recurrent pancreatitis; treated by ERCP sphincterotomy.",
      "اضطراب حركية المصرّة الصفراوية/البنكرياسية يسبب ألماً صفراوياً والتهاب بنكرياس ناكساً؛ يُعالَج ببضع المصرّة بالتنظير الراجع.", "cholecystitis & choledocholithiasis");
    await this.add(q, "HBP", "DC12.0Y", "emphysematous cholecystitis", "التهاب المرارة النفاخي",
      "Severe acute cholecystitis with gas-forming organisms in the gallbladder wall; high perforation risk, needs urgent cholecystectomy.",
      "التهاب مرارة حاد شديد مع جراثيم مكوّنة للغاز في جدار المرارة؛ خطر انثقاب مرتفع، يحتاج استئصال المرارة العاجل.", "cholecystitis & choledocholithiasis");

    // ── PEDSURG +1 (PUV shared from UROL) ────────────────────────────────────
    await this.add(q, "PEDSURG", "LB31.2", "posterior urethral valve", "الصمام الإحليلي الخلفي",
      "Congenital obstructing membrane of the posterior urethra in male infants causing bladder outlet obstruction and renal impairment; ablated endoscopically.",
      "غشاء سادّ خلقي في الإحليل الخلفي لدى الذكور الرضّع يسبب انسداد مخرج المثانة وقصوراً كلوياً؛ يُستأصل تنظيرياً.", "neonatal emergencies");
  }

  public async down(q: QueryRunner): Promise<void> {
    // PUV: only unlink from PEDSURG (it belongs to UROL); delete the rest
    await q.query(
      `DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'LB31.2')
         AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'PEDSURG')`);
    await q.query(
      `DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'LB31.2')
         AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'PEDSURG')`);
    for (const code of ["4A44.2","4A44.4","4A44.A1","8B22.A","DB91.Z","DC14.0","DC14.2","DC12.0Y"]) await this.remove(q, code);
  }
}
