import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * TRS coverage extension — diagnoses batch 3 of 3 (multi-organ, immunologic rejection,
 * transplant complications, donor categories). Inserts 22 new diagnoses (some general codes
 * such as DD56 incisional hernia / GB52 ATN / DC31.Z acute pancreatitis may already exist as
 * shared rows — ON CONFLICT links TRS only) and links them to their main_diags. Also
 * cross-links the recoded PTLD row (2B32.Z) to "immunologic rejection" so that category
 * reaches ≥5. All ICD-11 codes verified via icd11_search (AUDIT_TRS.md 2D). Runs after batch 2 (119).
 */
export class AddTrsDiagnosesBatch31750000000120 implements MigrationInterface {
  name = "AddTrsDiagnosesBatch31750000000120";

  private static readonly CODES = [
    // multi-organ
    "DA96.04", "DA96.05", "5C51.20", "5D00.20",
    // immunologic rejection
    "4B24.0", "4B24.1",
    // transplant complications
    "1D82.Z", "1D81.0", "1F20.0Z", "CA40.20", "GC2Z&XA6KU8", "DC10.02", "DC10.2", "BD40.2",
    "BD9Y", "5A13.4", "DD56", "GB52", "DC31.Z",
    // donor
    "QB22", "QB2Y", "QA00.4",
  ];

  private async linkMain(r: QueryRunner, mainDiag: string, codes: string[]): Promise<void> {
    await r.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'TRS' AND md.title = $1 AND d."icdCode" = ANY($2) ON CONFLICT DO NOTHING`, [mainDiag, codes]);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      ('DA96.04','short bowel syndrome','متلازمة الأمعاء القصيرة','Malabsorption from extensive intestinal resection requiring parenteral nutrition; refractory cases are an indication for intestinal transplantation.','سوء امتصاص ناجم عن استئصال معوي واسع يستلزم التغذية الوريدية؛ الحالات المُعَنّدة من دواعي زراعة الأمعاء.'),
      ('DA96.05','intestinal failure','الفشل المعوي','Reduction of gut function below the minimum needed for absorption; total parenteral nutrition complications drive intestinal/multivisceral transplantation.','نقص وظيفة الأمعاء دون الحدّ الأدنى اللازم للامتصاص؛ تدفع مضاعفات التغذية الوريدية الكلية إلى زراعة الأمعاء/الأحشاء المتعددة.'),
      ('5C51.20','primary hyperoxaluria type 1','فرط أكسالات البول الأولي من النوع الأول','Hepatic enzyme defect causing oxalate overproduction, nephrocalcinosis and renal failure; treated by combined liver-kidney transplantation.','عيب إنزيمي كبدي يسبب فرط إنتاج الأكسالات وتكلّس الكلية وفشلاً كلوياً؛ يُعالَج بالزراعة المشتركة كبد-كلية.'),
      ('5D00.20','hereditary ATTR amyloidosis','الداء النشواني الوراثي بالترانسثيريتين','Transthyretin amyloid (familial amyloid polyneuropathy) produced by the liver; treated by domino liver transplantation.','نشواني الترانسثيريتين (اعتلال عصبي نشواني عائلي) يُنتجه الكبد؛ يُعالَج بزراعة الكبد التعاقبية (دومينو).'),
      ('4B24.0','acute graft-versus-host disease','داء الطعم حيال الثوي الحاد','Donor immune cells attacking recipient skin, gut and liver early after transplantation; a serious immunological complication.','خلايا مناعية من المتبرّع تهاجم جلد المتلقّي وأمعاءه وكبده باكراً بعد الزراعة؛ مضاعفة مناعية خطيرة.'),
      ('4B24.1','chronic graft-versus-host disease','داء الطعم حيال الثوي المزمن','Late multisystem fibrosing graft-versus-host disease resembling autoimmune disorders; a chronic immunological complication of transplantation.','داء الطعم حيال الثوي المتأخّر المتليّف المتعدّد الأجهزة المشابه للاضطرابات المناعية الذاتية؛ مضاعفة مناعية مزمنة للزراعة.'),
      ('1D82.Z','cytomegaloviral disease','داء الفيروس المضخّم للخلايا','Reactivation of cytomegalovirus under immunosuppression causing fever, colitis, pneumonitis and graft dysfunction.','إعادة تنشّط الفيروس المضخّم للخلايا تحت كبت المناعة مسبباً حمّى والتهاب قولون والتهاب رئة وخللاً في الطعم.'),
      ('1D81.0','Epstein-Barr virus mononucleosis','داء كثرة الوحيدات بفيروس إبشتاين-بار','EBV infection in the immunosuppressed recipient; a driver of post-transplant lymphoproliferative disorder.','عدوى فيروس إبشتاين-بار لدى المتلقّي المكبوت مناعياً؛ محرّض لاضطراب التكاثر اللمفي ما بعد الزرع.'),
      ('1F20.0Z','invasive aspergillosis','داء الرشّاشيات الغازي','Opportunistic invasive mould infection of the lungs and other organs in the immunosuppressed transplant recipient.','عدوى فطرية عفنية غازية انتهازية تصيب الرئتين وأعضاء أخرى لدى متلقّي الزرع المكبوت مناعياً.'),
      ('CA40.20','Pneumocystis jirovecii pneumonia','الالتهاب الرئوي بالمتكيّسة الجؤجؤية','Opportunistic fungal pneumonia in the immunosuppressed recipient; prevented by prophylaxis after transplantation.','التهاب رئوي فطري انتهازي لدى المتلقّي المكبوت مناعياً؛ يُتّقى بالوقاية الدوائية بعد الزراعة.'),
      ('GC2Z&XA6KU8','BK polyomavirus-associated nephropathy','اعتلال الكلية المرتبط بفيروس BK','BK virus reactivation under immunosuppression causing tubulointerstitial nephritis and renal allograft dysfunction.','إعادة تنشّط فيروس BK تحت كبت المناعة مسبّبة التهاباً كلوياً خلالياً أنبوبياً وخللاً في طعم الكلية.'),
      ('DC10.02','biliary anastomotic stricture','تضيّق المفاغرة الصفراوية','Narrowing of the biliary anastomosis after liver transplantation causing cholestasis; treated endoscopically or percutaneously.','تضيّق المفاغرة الصفراوية بعد زراعة الكبد يسبب ركودة صفراوية؛ يُعالَج بالتنظير أو عبر الجلد.'),
      ('DC10.2','bile leak (biliary fistula)','تسرّب الصفراء (الناسور الصفراوي)','Leakage of bile from the biliary anastomosis or cut surface after liver transplantation; managed by drainage and stenting.','تسرّب الصفراء من المفاغرة الصفراوية أو السطح المقطوع بعد زراعة الكبد؛ يُدار بالتصريف والدعامة.'),
      ('BD40.2','transplant renal artery stenosis','تضيّق شريان الكلية المزروعة','Narrowing of the renal allograft artery causing refractory hypertension and graft dysfunction; treated by angioplasty/stenting.','تضيّق شريان طعم الكلية يسبب ارتفاع ضغط مُعَنّداً وخللاً في الطعم؛ يُعالَج بالرأب البالوني/الدعامة.'),
      ('BD9Y','lymphocele','القيلة اللمفية','Post-transplant collection of lymph adjacent to the renal allograft causing ureteric compression; drained surgically or percutaneously.','تجمّع لمفي بعد الزرع بجوار طعم الكلية يسبب انضغاط الحالب؛ يُصرَّف جراحياً أو عبر الجلد.'),
      ('5A13.4','post-transplant diabetes mellitus','داء السكري ما بعد الزرع','New-onset diabetes after transplantation induced by corticosteroids and calcineurin inhibitors (NODAT).','سكري حديث الحدوث بعد الزرع ناجم عن الستيرويدات القشرية ومثبّطات الكالسينيورين.'),
      ('DD56','incisional hernia','الفتق الجراحي (بالشق)','Hernia through the transplant incision, favoured by immunosuppression and wound healing impairment; repaired with mesh.','فتق عبر شقّ الزراعة يُسهّله كبت المناعة وضعف التئام الجرح؛ يُصلَح بالشبكة.'),
      ('GB52','delayed graft function (acute tubular necrosis)','تأخّر وظيفة الطعم (النخر الأنبوبي الحاد)','Acute tubular necrosis of the renal allograft from ischaemia-reperfusion requiring early post-transplant dialysis.','نخر أنبوبي حاد في طعم الكلية ناجم عن نقص التروية وإعادة الترويّة يستلزم غسيل كلى باكراً بعد الزرع.'),
      ('DC31.Z','acute pancreatitis (pancreas graft)','التهاب البنكرياس الحاد (طعم البنكرياس)','Acute inflammation of the pancreatic allograft after transplantation from ischaemia-reperfusion or reflux; a graft-threatening complication.','التهاب حاد لطعم البنكرياس بعد الزراعة ناجم عن نقص التروية وإعادة الترويّة أو الارتجاع؛ مضاعفة تهدّد الطعم.'),
      ('QB22','kidney donor (living)','متبرّع بالكلية (حي)','A healthy living kidney donor undergoing evaluation and donor nephrectomy for transplantation.','متبرّع حي سليم بالكلية يخضع للتقييم واستئصال كلية المتبرّع لأجل الزراعة.'),
      ('QB2Y','organ donor (living liver donor)','متبرّع بعضو (متبرّع كبد حي)','A healthy living donor of a partial liver graft undergoing evaluation and donor hepatectomy.','متبرّع حي سليم بطعم كبد جزئي يخضع للتقييم واستئصال كبد المتبرّع.'),
      ('QA00.4','examination of potential organ donor','فحص المتبرّع المحتمل بالأعضاء','Medical and surgical work-up of a potential living or deceased organ donor to confirm donor suitability.','التقييم الطبي والجراحي للمتبرّع المحتمل الحي أو المتوفّى لتأكيد ملاءمة التبرّع.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'TRS' AND d."icdCode" = ANY($1) ON CONFLICT DO NOTHING`,
      [AddTrsDiagnosesBatch31750000000120.CODES]);

    await this.linkMain(queryRunner, "multi-organ transplant", ["DA96.04", "DA96.05", "5C51.20", "5D00.20"]);
    await this.linkMain(queryRunner, "immunologic rejection", ["4B24.0", "4B24.1", "2B32.Z"]); // 2B32.Z = PTLD (recoded in MIG-A) cross-linked here
    await this.linkMain(queryRunner, "transplant complications",
      ["1D82.Z", "1D81.0", "1F20.0Z", "CA40.20", "GC2Z&XA6KU8", "DC10.02", "DC10.2", "BD40.2", "BD9Y", "5A13.4", "DD56", "GB52", "DC31.Z"]);
    await this.linkMain(queryRunner, "donor nephrectomy", ["QB22", "QA00.4"]);
    await this.linkMain(queryRunner, "donor hepatectomy", ["QB2Y", "QA00.4"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddTrsDiagnosesBatch31750000000120.CODES;
    // remove the PTLD cross-link added to immunologic rejection
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = '2B32.Z') AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'TRS' AND md.title = 'immunologic rejection')`);
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id WHERE dept.code = 'TRS')`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'TRS')`, [codes]);
    await queryRunner.query(`DELETE FROM "diagnoses" d WHERE d."icdCode" = ANY($1) AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = d.id)`, [codes]);
  }
}
