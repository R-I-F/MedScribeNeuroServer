import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * TRS proc_cpts — batch 1 of 2 (57 core transplant procedures). New groups: LIVT (liver
 * transplant / donor hepatectomy), KTNP (kidney transplant / nephrectomy), PANT (pancreas
 * transplant), HRTT (heart transplant), LUNT (lung & heart-lung transplant), INTT (intestinal
 * / multivisceral transplant).
 *
 * TRS previously had ZERO proc_cpts. Every CPT verified current/active against AAPC — see
 * AUDIT_TRS.md "2E". Linked to main_diags by migration 123.
 */
export class ImportTrsProcCpts11750000000121 implements MigrationInterface {
  name = "ImportTrsProcCpts11750000000121";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      -- ── LIVT: liver transplant / donor hepatectomy ────────────────────────
      ('Donor hepatectomy, from cadaver donor','LIVT','47133-00','Procurement of the whole liver from a deceased (cadaver) donor for transplantation.','استئصال كبد المتبرّع المتوفّى','استحصال الكبد الكامل من متبرّع متوفٍّ لأجل الزراعة.'),
      ('Liver allotransplantation, orthotopic','LIVT','47135-00','Orthotopic implantation of a partial or whole liver allograft from a cadaver or living donor.','زراعة الكبد المثلية','زرع طعم كبدي جزئي أو كامل في موضعه التشريحي من متبرّع متوفٍّ أو حي.'),
      ('Donor hepatectomy (living), left lateral segment','LIVT','47140-00','Resection of the left lateral segment (II and III) from a living liver donor.','استئصال كبد المتبرّع الحي، القطعة الجانبية اليسرى','استئصال القطعة الجانبية اليسرى (II و III) من متبرّع كبد حي.'),
      ('Donor hepatectomy (living), total left lobectomy','LIVT','47141-00','Resection of the total left lobe (segments II, III, IV) from a living liver donor.','استئصال كبد المتبرّع الحي، الفص الأيسر الكامل','استئصال الفص الأيسر الكامل (القطع II و III و IV) من متبرّع كبد حي.'),
      ('Donor hepatectomy (living), total right lobectomy','LIVT','47142-00','Resection of the total right lobe (segments V-VIII) from a living liver donor.','استئصال كبد المتبرّع الحي، الفص الأيمن الكامل','استئصال الفص الأيمن الكامل (القطع V-VIII) من متبرّع كبد حي.'),
      ('Backbench standard preparation of cadaver liver graft','LIVT','47143-00','Bench preparation of a whole cadaver liver graft prior to implantation.','التحضير المعياري الخلفي لطعم كبد المتوفّى','تحضير طعم كبدي كامل من متوفٍّ على الطاولة الخلفية قبل الزرع.'),
      ('Backbench reconstruction of cadaver liver graft','LIVT','47144-00','Bench reconstruction/splitting of a cadaver whole-liver graft prior to transplantation.','إعادة البناء الخلفية لطعم كبد المتوفّى','إعادة بناء/تجزئة طعم كبدي كامل من متوفٍّ على الطاولة الخلفية قبل الزراعة.'),
      ('Backbench venous reconstruction of liver graft','LIVT','47146-00','Bench venous anastomosis to reconstruct the liver graft prior to implantation.','إعادة البناء الوريدي الخلفية لطعم الكبد','مفاغرة وريدية على الطاولة الخلفية لإعادة بناء طعم الكبد قبل الزرع.'),
      ('Backbench arterial reconstruction of liver graft','LIVT','47147-00','Bench arterial anastomosis to reconstruct the liver graft prior to implantation.','إعادة البناء الشرياني الخلفية لطعم الكبد','مفاغرة شريانية على الطاولة الخلفية لإعادة بناء طعم الكبد قبل الزرع.'),
      ('Biopsy of liver, wedge','LIVT','47100-00','Open wedge biopsy of the liver, eg to assess graft quality or rejection.','خزعة الكبد الإسفينية','خزعة إسفينية مفتوحة للكبد لتقييم جودة الطعم أو الرفض.'),
      ('Biopsy of liver, needle, percutaneous','LIVT','47000-00','Percutaneous needle biopsy of the native liver or hepatic allograft.','خزعة الكبد بالإبرة عبر الجلد','خزعة بالإبرة عبر الجلد للكبد الأصلي أو طعم الكبد.'),
      -- ── KTNP: kidney transplant / nephrectomy ─────────────────────────────
      ('Donor nephrectomy, from cadaver donor','KTNP','50300-00','Procurement of one or both kidneys from a deceased donor for transplantation.','استئصال كلية المتبرّع المتوفّى','استحصال كلية أو كليتي متبرّع متوفٍّ لأجل الزراعة.'),
      ('Donor nephrectomy, open, from living donor','KTNP','50320-00','Open removal of a kidney from a living donor for transplantation.','استئصال كلية المتبرّع الحي، مفتوح','استئصال كلية مفتوح من متبرّع حي لأجل الزراعة.'),
      ('Laparoscopic donor nephrectomy','KTNP','50547-00','Laparoscopic removal of a kidney from a living donor with cold preservation.','استئصال كلية المتبرّع بالمنظار','استئصال كلية بالمنظار من متبرّع حي مع الحفظ البارد.'),
      ('Backbench standard preparation of cadaver renal allograft','KTNP','50323-00','Bench preparation of a deceased-donor kidney graft prior to implantation.','التحضير المعياري الخلفي لطعم كلية المتوفّى','تحضير طعم كلية من متوفٍّ على الطاولة الخلفية قبل الزرع.'),
      ('Backbench standard preparation of living donor renal allograft','KTNP','50325-00','Bench preparation of a living-donor kidney graft prior to implantation.','التحضير المعياري الخلفي لطعم كلية المتبرّع الحي','تحضير طعم كلية من متبرّع حي على الطاولة الخلفية قبل الزرع.'),
      ('Backbench reconstruction of renal allograft, venous anastomosis','KTNP','50327-00','Bench venous reconstruction to extend the renal vein of the kidney graft.','إعادة بناء طعم الكلية، مفاغرة وريدية','إعادة بناء وريدي خلفي لإطالة وريد الكلية في طعم الكلية.'),
      ('Backbench reconstruction of renal allograft, arterial anastomosis','KTNP','50328-00','Bench arterial reconstruction of the kidney graft prior to implantation.','إعادة بناء طعم الكلية، مفاغرة شريانية','إعادة بناء شرياني خلفي لطعم الكلية قبل الزرع.'),
      ('Backbench reconstruction of renal allograft, ureteral anastomosis','KTNP','50329-00','Bench ureteral reconstruction of the kidney graft prior to implantation.','إعادة بناء طعم الكلية، مفاغرة حالبية','إعادة بناء حالبي خلفي لطعم الكلية قبل الزرع.'),
      ('Recipient nephrectomy','KTNP','50340-00','Removal of the recipient native kidney to prepare for or accompany transplantation.','استئصال كلية المتلقّي','استئصال كلية المتلقّي الأصلية تمهيداً للزراعة أو مرافقاً لها.'),
      ('Renal allotransplantation, without recipient nephrectomy','KTNP','50360-00','Implantation of a renal allograft without removing a native kidney.','زراعة الكلية دون استئصال كلية المتلقّي','زرع طعم كلوي دون استئصال كلية أصلية.'),
      ('Renal allotransplantation, with recipient nephrectomy','KTNP','50365-00','Implantation of a renal allograft with concurrent recipient nephrectomy.','زراعة الكلية مع استئصال كلية المتلقّي','زرع طعم كلوي مع استئصال كلية المتلقّي بالتزامن.'),
      ('Removal of transplanted renal allograft','KTNP','50370-00','Excision of a failed renal allograft (transplant nephrectomy).','إزالة طعم الكلية المزروع','استئصال طعم كلوي فاشل (استئصال كلية الزرع).'),
      ('Renal autotransplantation','KTNP','50380-00','Reimplantation of the patient own kidney at a new site (autotransplantation).','الزراعة الذاتية للكلية','إعادة زرع كلية المريض نفسه في موضع جديد.'),
      ('Renal biopsy, percutaneous','KTNP','50200-00','Percutaneous needle biopsy of the native kidney or renal allograft to assess rejection.','خزعة الكلية عبر الجلد','خزعة بالإبرة عبر الجلد للكلية الأصلية أو طعم الكلية لتقييم الرفض.'),
      ('Ureteroneocystostomy','KTNP','50780-00','Reimplantation of the ureter into the bladder, eg the allograft ureter at transplantation.','مفاغرة الحالب بالمثانة','إعادة زرع الحالب في المثانة، مثل حالب الطعم أثناء الزراعة.'),
      -- ── PANT: pancreas transplant ─────────────────────────────────────────
      ('Donor pancreatectomy','PANT','48550-00','Procurement of the pancreas (with or without a duodenal segment) from a donor.','استئصال بنكرياس المتبرّع','استحصال البنكرياس (مع قطعة عفجية أو دونها) من المتبرّع.'),
      ('Backbench standard preparation of pancreas allograft','PANT','48551-00','Bench preparation of a donor pancreas graft prior to implantation.','التحضير المعياري الخلفي لطعم البنكرياس','تحضير طعم بنكرياس من المتبرّع على الطاولة الخلفية قبل الزرع.'),
      ('Backbench reconstruction of pancreas allograft','PANT','48552-00','Bench venous/arterial reconstruction of the pancreas graft prior to transplantation.','إعادة بناء طعم البنكرياس','إعادة بناء وريدي/شرياني لطعم البنكرياس على الطاولة الخلفية قبل الزراعة.'),
      ('Transplantation of pancreatic allograft','PANT','48554-00','Implantation of a whole pancreas allograft with enteric or bladder drainage.','زراعة طعم البنكرياس','زرع طعم بنكرياس كامل مع تصريف معوي أو مثاني.'),
      ('Removal of transplanted pancreatic allograft','PANT','48556-00','Excision of a failed pancreas allograft (transplant pancreatectomy).','إزالة طعم البنكرياس المزروع','استئصال طعم بنكرياس فاشل (استئصال بنكرياس الزرع).'),
      ('Total/subtotal pancreatectomy with islet autotransplantation','PANT','48160-00','Total or subtotal pancreatectomy with autologous transplantation of pancreatic islet cells.','استئصال البنكرياس مع زرع الجزر الذاتي','استئصال البنكرياس الكلي أو شبه الكلي مع زرع خلايا جزر البنكرياس الذاتية.'),
      -- ── HRTT: heart transplant ────────────────────────────────────────────
      ('Donor cardiectomy','HRTT','33940-00','Procurement of the donor heart with preparation and maintenance of the allograft.','استئصال قلب المتبرّع','استحصال قلب المتبرّع مع تحضير الطعم والحفاظ عليه.'),
      ('Backbench standard preparation of heart allograft','HRTT','33944-00','Bench preparation of a cadaver-donor heart graft prior to implantation.','التحضير المعياري الخلفي لطعم القلب','تحضير طعم قلب من متوفٍّ على الطاولة الخلفية قبل الزرع.'),
      ('Heart transplant','HRTT','33945-00','Orthotopic heart transplantation with or without recipient cardiectomy.','زراعة القلب','زراعة قلب مثلية مع استئصال قلب المتلقّي أو دونه.'),
      ('Insertion of ventricular assist device, extracorporeal','HRTT','33975-00','Insertion of an extracorporeal ventricular assist device, single ventricle, as a bridge to transplant.','إدخال جهاز مساعدة بطيني خارج الجسم','إدخال جهاز مساعدة بطيني خارج الجسم لبطين واحد كجسر إلى الزراعة.'),
      ('Insertion of ventricular assist device, extracorporeal, biventricular','HRTT','33976-00','Insertion of an extracorporeal biventricular assist device.','إدخال جهاز مساعدة بطيني خارجي ثنائي البطين','إدخال جهاز مساعدة بطيني خارج الجسم لكلا البطينين.'),
      ('Insertion of ventricular assist device, implantable intracorporeal','HRTT','33979-00','Insertion of an implantable intracorporeal ventricular assist device, single ventricle.','إدخال جهاز مساعدة بطيني مزروع داخل الجسم','إدخال جهاز مساعدة بطيني مزروع داخل الجسم لبطين واحد.'),
      ('Insertion of ventricular assist device, percutaneous','HRTT','33990-00','Percutaneous insertion of a ventricular assist device via arterial access.','إدخال جهاز مساعدة بطيني عبر الجلد','إدخال جهاز مساعدة بطيني عبر الجلد عبر طريق شرياني.'),
      ('Removal of ventricular assist device, intracorporeal','HRTT','33980-00','Removal of an implantable intracorporeal ventricular assist device.','إزالة جهاز المساعدة البطيني المزروع','إزالة جهاز مساعدة بطيني مزروع داخل الجسم.'),
      ('Implantation of total replacement heart system','HRTT','33927-00','Implantation of a total artificial heart as a bridge to transplantation.','زرع نظام القلب البديل الكامل','زرع قلب اصطناعي كامل كجسر إلى الزراعة.'),
      -- ── LUNT: lung & heart-lung transplant ────────────────────────────────
      ('Donor pneumonectomy (cadaver)','LUNT','32850-00','Procurement of the lung(s) from a deceased donor with cold preservation.','استئصال رئة المتبرّع المتوفّى','استحصال الرئة/الرئتين من متبرّع متوفٍّ مع الحفظ البارد.'),
      ('Lung transplant, single, without cardiopulmonary bypass','LUNT','32851-00','Single lung transplantation performed without cardiopulmonary bypass.','زراعة رئة مفردة دون مجازة قلبية رئوية','زراعة رئة واحدة دون استخدام المجازة القلبية الرئوية.'),
      ('Lung transplant, single, with cardiopulmonary bypass','LUNT','32852-00','Single lung transplantation performed with cardiopulmonary bypass.','زراعة رئة مفردة مع مجازة قلبية رئوية','زراعة رئة واحدة باستخدام المجازة القلبية الرئوية.'),
      ('Lung transplant, double, without cardiopulmonary bypass','LUNT','32853-00','Bilateral (double) lung transplantation without cardiopulmonary bypass.','زراعة رئتين دون مجازة قلبية رئوية','زراعة رئتين (ثنائية) دون مجازة قلبية رئوية.'),
      ('Lung transplant, double, with cardiopulmonary bypass','LUNT','32854-00','Bilateral (double) lung transplantation with cardiopulmonary bypass.','زراعة رئتين مع مجازة قلبية رئوية','زراعة رئتين (ثنائية) مع مجازة قلبية رئوية.'),
      ('Backbench standard preparation of donor lung, single','LUNT','32855-00','Bench preparation of a single donor lung graft prior to implantation.','التحضير المعياري الخلفي لرئة مفردة','تحضير طعم رئة مفردة من المتبرّع على الطاولة الخلفية قبل الزرع.'),
      ('Backbench standard preparation of donor lung, double','LUNT','32856-00','Bench preparation of bilateral donor lung grafts prior to implantation.','التحضير المعياري الخلفي للرئتين','تحضير طعمي رئتين من المتبرّع على الطاولة الخلفية قبل الزرع.'),
      ('Donor cardiectomy-pneumonectomy (heart-lung)','LUNT','33930-00','Procurement of the combined heart-lung block from a donor with preparation.','استئصال قلب-رئة المتبرّع','استحصال كتلة القلب-الرئة المشتركة من المتبرّع مع التحضير.'),
      ('Heart-lung transplant','LUNT','33935-00','Combined heart-lung transplantation with recipient cardiectomy-pneumonectomy.','زراعة القلب والرئتين','زراعة القلب والرئتين معاً مع استئصال قلب ورئتي المتلقّي.'),
      ('Bronchoscopy, diagnostic','LUNT','31622-00','Flexible diagnostic bronchoscopy for airway surveillance after lung transplantation.','تنظير القصبات التشخيصي','تنظير قصبات مرن تشخيصي لمراقبة الطرق الهوائية بعد زراعة الرئة.'),
      -- ── INTT: intestinal / multivisceral transplant ───────────────────────
      ('Donor enterectomy, from cadaver donor','INTT','44132-00','Procurement of the intestine from a deceased donor for transplantation.','استئصال أمعاء المتبرّع المتوفّى','استحصال الأمعاء من متبرّع متوفٍّ لأجل الزراعة.'),
      ('Donor enterectomy, from living donor','INTT','44133-00','Procurement of an intestinal segment from a living donor for transplantation.','استئصال أمعاء المتبرّع الحي','استحصال قطعة معوية من متبرّع حي لأجل الزراعة.'),
      ('Intestinal allotransplantation, from cadaver donor','INTT','44135-00','Implantation of a deceased-donor intestinal allograft.','زراعة الأمعاء من متبرّع متوفٍّ','زرع طعم معوي من متبرّع متوفٍّ.'),
      ('Intestinal allotransplantation, from living donor','INTT','44136-00','Implantation of a living-donor intestinal allograft.','زراعة الأمعاء من متبرّع حي','زرع طعم معوي من متبرّع حي.'),
      ('Removal of transplanted intestinal allograft','INTT','44137-00','Excision of a failed intestinal allograft (transplant enterectomy).','إزالة طعم الأمعاء المزروع','استئصال طعم معوي فاشل.'),
      ('Backbench standard preparation of intestine allograft','INTT','44715-00','Bench preparation of a cadaver or living donor intestine graft prior to implantation.','التحضير المعياري الخلفي لطعم الأمعاء','تحضير طعم أمعاء من متبرّع متوفٍّ أو حي على الطاولة الخلفية قبل الزرع.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('LIVT','KTNP','PANT','HRTT','LUNT','INTT')`);
  }
}
