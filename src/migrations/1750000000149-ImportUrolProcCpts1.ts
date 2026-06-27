import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * UROL proc_cpts — import batch 1 of 2 (47 new rows). UROL previously had ZERO proc_cpts.
 * Alpha groups: TURP (transurethral prostate / BPH), PROS (prostate cancer surgery), CYST
 * (bladder cancer / cystectomy / cystoscopy), URET (ureter & pyeloplasty reconstruction),
 * STON (stone surgery — PCNL/URS/ESWL). Every CPT AAPC-verified current/active
 * (AUDIT_UROL.md "2E"); the only deletion found — 55700 prostate needle biopsy (deleted
 * 2026-01-01) — was excluded (55706 transperineal saturation biopsy used instead). Linked to
 * main_diags by migration 151.
 */
export class ImportUrolProcCpts11750000000149 implements MigrationInterface {
  name = "ImportUrolProcCpts11750000000149";

  public async up(q: QueryRunner): Promise<void> {
    await q.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES
      -- ── TURP: transurethral prostate / BPH ─────────────────────────────────
      ('Transurethral resection of prostate (TURP)','TURP','52601-00','Endoscopic resection of obstructing prostatic tissue through the urethra for benign prostatic hyperplasia.','استئصال البروستاتا عبر الإحليل','استئصال تنظيري للنسيج البروستاتي السادّ عبر الإحليل لتضخم البروستاتا الحميد.'),
      ('Transurethral resection of residual or regrowth prostate tissue','TURP','52630-00','Repeat transurethral resection of prostatic tissue left or regrown after a previous resection.','استئصال النسيج البروستاتي المتبقّي/المُعاوِد عبر الإحليل','استئصال تنظيري معاد للنسيج البروستاتي المتبقّي أو المُعاوِد بعد استئصال سابق.'),
      ('Transurethral incision of prostate (TUIP)','TURP','52450-00','Endoscopic incision of the prostate/bladder neck to relieve obstruction in smaller glands.','شق البروستاتا عبر الإحليل','شق تنظيري للبروستاتا/عنق المثانة لتخفيف الانسداد في الغدد الأصغر.'),
      ('Transprostatic urethral lift implant, single (UroLift)','TURP','52441-00','Cystoscopic placement of a single permanent implant to retract obstructing prostatic lobes.','زرع رافعة إحليلية بروستاتية مفردة','وضع تنظيري لزرعة دائمة مفردة لسحب فصوص البروستاتا السادّة.'),
      ('Transprostatic urethral lift implant, each additional','TURP','52442-00','Add-on placement of each additional permanent transprostatic implant.','زرع رافعة إحليلية بروستاتية إضافية','وضع كل زرعة بروستاتية دائمة إضافية.'),
      ('Laser vaporization of prostate','TURP','52648-00','Transurethral laser vaporization (e.g. GreenLight PVP) of obstructing prostatic tissue.','تبخير البروستاتا بالليزر','تبخير ليزري عبر الإحليل للنسيج البروستاتي السادّ.'),
      ('Holmium laser enucleation of prostate (HoLEP) with morcellation','TURP','52649-00','Transurethral holmium laser enucleation of the prostate with morcellation for BPH.','استئصال البروستاتا بالليزر الهولميومي','استئصال بروستاتي تنظيري بالليزر الهولميومي مع التفتيت لتضخم البروستاتا الحميد.'),
      ('Transurethral microwave thermotherapy of prostate (TUMT)','TURP','53850-00','Microwave thermal ablation of prostatic tissue to treat benign prostatic hyperplasia.','المعالجة الحرارية بالموجات الدقيقة للبروستاتا','إتلاف حراري بالموجات الدقيقة للنسيج البروستاتي لعلاج تضخم البروستاتا الحميد.'),
      ('Transurethral radiofrequency ablation of prostate (TUNA)','TURP','53852-00','Radiofrequency needle ablation of prostatic tissue for benign prostatic hyperplasia.','الاستئصال بالترددات الراديوية للبروستاتا','إتلاف بالإبرة بالترددات الراديوية للنسيج البروستاتي لتضخم البروستاتا الحميد.'),
      -- ── PROS: prostate cancer surgery ──────────────────────────────────────
      ('Transperineal template-guided saturation prostate biopsy','PROS','55706-00','Stereotactic template-guided transperineal saturation needle biopsy of the prostate with imaging.','خزعة البروستاتا المشبعة عبر العجان','خزعة إبرية مشبعة عبر العجان موجَّهة بقالب مجسّم مع التصوير.'),
      ('Radical retropubic prostatectomy','PROS','55840-00','Complete removal of the prostate and seminal vesicles via a retropubic approach for cancer.','استئصال البروستاتا الجذري خلف العانة','استئصال كامل للبروستاتا والحويصلين المنويين عبر مدخل خلف العانة للسرطان.'),
      ('Radical prostatectomy with bilateral pelvic lymphadenectomy','PROS','55845-00','Radical prostatectomy with removal of the pelvic lymph nodes for prostate cancer.','استئصال البروستاتا الجذري مع تجريف العقد الحوضية','استئصال البروستاتا الجذري مع إزالة العقد اللمفية الحوضية لسرطان البروستاتا.'),
      ('Laparoscopic/robotic radical prostatectomy','PROS','55866-00','Minimally invasive (laparoscopic/robotic) radical prostatectomy for prostate cancer.','استئصال البروستاتا الجذري بالتنظير/الروبوت','استئصال جذري للبروستاتا بأسلوب طفيف التوغل (تنظيري/روبوتي) لسرطان البروستاتا.'),
      ('Radical perineal prostatectomy','PROS','55810-00','Complete removal of the prostate via a perineal incision for prostate cancer.','استئصال البروستاتا الجذري العجاني','استئصال كامل للبروستاتا عبر شق عجاني لسرطان البروستاتا.'),
      ('Transperineal placement of brachytherapy needles in prostate','PROS','55875-00','Placement of needles/catheters into the prostate for interstitial radioactive seed brachytherapy.','وضع إبر المعالجة الإشعاعية الكثبية في البروستاتا','وضع إبر/قثاطر في البروستاتا للمعالجة الإشعاعية الكثبية بالبذور المشعّة.'),
      ('Cryoablation of prostate','PROS','55873-00','Transperineal cryosurgical ablation of the prostate with ultrasound guidance for cancer.','الاستئصال بالتبريد للبروستاتا','إتلاف بالتبريد للبروستاتا عبر العجان موجَّه بالأمواج فوق الصوتية للسرطان.'),
      -- ── CYST: bladder cancer / cystectomy / cystoscopy ─────────────────────
      ('Cystourethroscopy','CYST','52000-00','Endoscopic inspection of the urethra, bladder and ureteric orifices.','تنظير المثانة والإحليل','فحص تنظيري للإحليل والمثانة وفوهتي الحالبين.'),
      ('Cystourethroscopy with biopsy','CYST','52204-00','Cystoscopy with biopsy of one or more bladder/urethral lesions.','تنظير المثانة مع خزعة','تنظير مثانة مع أخذ خزعة من آفة أو أكثر في المثانة/الإحليل.'),
      ('Transurethral resection of bladder tumour, small (0.5–2.0 cm)','CYST','52234-00','TURBT of a small bladder tumour (0.5–2.0 cm) by resection or fulguration.','استئصال ورم المثانة عبر الإحليل (صغير)','استئصال ورم مثاني صغير (0.5–2.0 سم) بالاستئصال أو الكي عبر الإحليل.'),
      ('Transurethral resection of bladder tumour, medium (2.0–5.0 cm)','CYST','52235-00','TURBT of a medium bladder tumour (2.0–5.0 cm).','استئصال ورم المثانة عبر الإحليل (متوسط)','استئصال ورم مثاني متوسط (2.0–5.0 سم) عبر الإحليل.'),
      ('Transurethral resection of bladder tumour, large (>5.0 cm)','CYST','52240-00','TURBT of a large bladder tumour (greater than 5.0 cm).','استئصال ورم المثانة عبر الإحليل (كبير)','استئصال ورم مثاني كبير (أكثر من 5.0 سم) عبر الإحليل.'),
      ('Cystourethroscopy with fulguration of minor lesion(s)','CYST','52224-00','Cystoscopic fulguration of minor (<0.5 cm) bladder/urethral lesions.','تنظير المثانة مع كي آفات صغرى','كي تنظيري لآفات مثانية/إحليلية صغرى (أقل من 0.5 سم).'),
      ('Cystourethroscopy with fulguration of trigone/bladder neck','CYST','52214-00','Cystoscopic fulguration of the trigone, bladder neck, prostatic fossa or urethra.','تنظير المثانة مع كي المثلث/عنق المثانة','كي تنظيري للمثلث المثاني أو عنق المثانة أو الحفرة البروستاتية أو الإحليل.'),
      ('Bladder instillation of anticarcinogenic agent (BCG)','CYST','51720-00','Intravesical instillation of an anticarcinogenic agent (e.g. BCG) for bladder cancer.','تقطير دواء مضاد للسرطان داخل المثانة','تقطير دواء مضاد للسرطان داخل المثانة (مثل BCG) لسرطان المثانة.'),
      ('Partial cystectomy','CYST','51550-00','Surgical removal of part of the urinary bladder for tumour or localised disease.','استئصال المثانة الجزئي','استئصال جراحي لجزء من المثانة لورم أو مرض موضعي.'),
      ('Complete (simple) cystectomy','CYST','51570-00','Removal of the entire urinary bladder without extended lymphadenectomy.','استئصال المثانة الكامل البسيط','استئصال المثانة كاملةً دون تجريف عقدي موسّع.'),
      ('Radical cystectomy with ureteroileal conduit','CYST','51595-00','Radical cystectomy with bilateral pelvic lymphadenectomy and ileal-conduit diversion.','استئصال المثانة الجذري مع قناة لفائفية','استئصال المثانة الجذري مع تجريف العقد الحوضية وتحويل بقناة لفائفية.'),
      ('Radical cystectomy with continent diversion (neobladder)','CYST','51596-00','Radical cystectomy with creation of a continent reservoir or orthotopic neobladder.','استئصال المثانة الجذري مع تحويل مُمسِك','استئصال المثانة الجذري مع إنشاء خزان مُمسِك أو مثانة بديلة موضعية.'),
      ('Ureteroileal conduit (ileal conduit urinary diversion)','CYST','50820-00','Construction of an ileal conduit to divert urine to a cutaneous stoma.','قناة لفائفية حالبية','إنشاء قناة لفائفية لتحويل البول إلى فغرة جلدية.'),
      ('Excision of bladder diverticulum','CYST','51525-00','Cystotomy with excision of one or more bladder diverticula.','استئصال رتج المثانة','بضع المثانة مع استئصال رتج أو أكثر من رتوج المثانة.'),
      ('Repair of complex bladder wound or tear (cystorrhaphy)','CYST','51865-00','Suture repair of a complex/complicated wound, injury or rupture of the bladder.','إصلاح جرح/تمزّق المثانة المعقد','رأب جراحي بالخياطة لجرح أو إصابة أو تمزّق معقد في المثانة.'),
      -- ── URET: ureter & pyeloplasty reconstruction ──────────────────────────
      ('Diagnostic ureteroscopy/pyeloscopy','URET','52351-00','Cystourethroscopy with diagnostic ureteroscopy and/or pyeloscopy.','تنظير الحالب/الحويضة التشخيصي','تنظير مثانة وإحليل مع تنظير حالب و/أو حويضة تشخيصي.'),
      ('Cystourethroscopy with insertion of indwelling ureteral stent','URET','52332-00','Cystoscopic placement of an indwelling (double-J) ureteral stent.','تنظير المثانة مع وضع دعامة حالبية','وضع تنظيري لدعامة حالبية مقيمة (مزدوجة J).'),
      ('Pyeloplasty','URET','50400-00','Surgical reconstruction of the ureteropelvic junction to relieve obstruction.','رأب الحويضة','إعادة بناء جراحية للوصل الحويضي الحالبي لتخفيف الانسداد.'),
      ('Pyeloplasty, complicated','URET','50405-00','Complicated pyeloplasty (secondary, with congenital anomaly or solitary kidney).','رأب الحويضة المعقّد','رأب حويضة معقّد (ثانوي أو مع تشوّه خلقي أو كلية وحيدة).'),
      ('Laparoscopic pyeloplasty','URET','50544-00','Laparoscopic reconstruction of the ureteropelvic junction.','رأب الحويضة بالتنظير','إعادة بناء الوصل الحويضي الحالبي بالتنظير.'),
      ('Ureteroneocystostomy (ureteral reimplantation)','URET','50780-00','Reimplantation of the ureter into the bladder for reflux, stricture or injury.','إعادة زرع الحالب في المثانة','إعادة زرع الحالب في المثانة لجزر أو تضيّق أو إصابة.'),
      ('Ureteroureterostomy','URET','50760-00','Excision of a diseased ureteral segment with end-to-end re-anastomosis.','مفاغرة الحالب بالحالب','استئصال جزء حالبي مريض مع مفاغرة طرف لطرف.'),
      ('Ureterectomy with bladder cuff','URET','50650-00','Removal of part or all of the ureter with a bladder cuff, commonly for urothelial cancer.','استئصال الحالب مع كفّة مثانية','استئصال جزء من الحالب أو كله مع كفّة مثانية، غالباً للسرطان الظهاري البولي.'),
      ('Laparoscopic nephroureterectomy','URET','50548-00','Laparoscopic removal of the kidney together with the entire ureter.','استئصال الكلية والحالب بالتنظير','استئصال تنظيري للكلية مع كامل الحالب.'),
      -- ── STON: stone surgery (PCNL / URS / ESWL) ────────────────────────────
      ('Extracorporeal shock wave lithotripsy (ESWL)','STON','50590-00','Non-invasive fragmentation of upper-tract calculi using focused shock waves.','تفتيت الحصى بالموجات الصادمة من خارج الجسم','تفتيت غير باضع لحصيات السبيل العلوي بموجات صادمة مركّزة.'),
      ('Percutaneous nephrolithotomy, up to 2 cm','STON','50080-00','Percutaneous nephrostolithotomy for a stone burden up to 2 cm.','استخراج حصاة الكلية عبر الجلد (حتى 2 سم)','استخراج حصاة الكلية عبر الجلد لحجم حصوي حتى 2 سم.'),
      ('Percutaneous nephrolithotomy, over 2 cm','STON','50081-00','Percutaneous nephrostolithotomy for a complex stone burden larger than 2 cm.','استخراج حصاة الكلية عبر الجلد (أكثر من 2 سم)','استخراج حصاة الكلية عبر الجلد لحجم حصوي معقّد أكبر من 2 سم.'),
      ('Percutaneous nephrostomy tube placement','STON','50432-00','Image-guided percutaneous placement of a nephrostomy drainage catheter.','وضع أنبوب فغر الكلية عبر الجلد','وضع أنبوب تصريف بفغر الكلية عبر الجلد موجَّه بالتصوير.'),
      ('Ureteroscopy with removal or manipulation of calculus','STON','52352-00','Ureteroscopy/pyeloscopy with removal or manipulation of a urinary stone.','تنظير الحالب مع إزالة الحصاة','تنظير حالب/حويضة مع إزالة الحصاة البولية أو تحريكها.'),
      ('Ureteroscopy with lithotripsy','STON','52353-00','Ureteroscopy/pyeloscopy with intracorporeal (laser) lithotripsy of a calculus.','تنظير الحالب مع تفتيت الحصاة','تنظير حالب/حويضة مع تفتيت داخلي (بالليزر) للحصاة.'),
      ('Ureteroscopy with lithotripsy and ureteral stent','STON','52356-00','Ureteroscopy with lithotripsy and indwelling ureteral stent insertion in the same session.','تنظير الحالب مع التفتيت ووضع دعامة','تنظير حالب مع تفتيت الحصاة ووضع دعامة حالبية مقيمة في الجلسة نفسها.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(`DELETE FROM "main_diag_procs" WHERE "procCptId" IN (SELECT id FROM "proc_cpts" WHERE "alphaCode" IN ('TURP','PROS','CYST','URET','STON'))`);
    await q.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('TURP','PROS','CYST','URET','STON')`);
  }
}
