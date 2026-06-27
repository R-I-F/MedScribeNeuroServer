import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * UROL audit — MIG-D batch 2 of 2: stone disease, ureteral obstruction, testicular/scrotal
 * pathology, urinary incontinence and urinary retention (33 diagnoses). INSERT ...
 * ON CONFLICT("icdCode") DO NOTHING, then link department_diagnoses (UROL) +
 * main_diag_diagnoses (by title). All ICD-11 codes icd11_search-verified (AUDIT_UROL.md 2D).
 * GC01.4 (neurogenic bladder) dual-links urinary incontinence + urinary retention. 1B71.1
 * (Fournier gangrene) is shared with PRS/PEDSURG — reused via ON CONFLICT.
 */
export class AddUrolDiagnosesBatch1750000000147 implements MigrationInterface {
  name = "AddUrolDiagnosesBatch1750000000147";

  private async add(r: QueryRunner, code: string, en: string, ar: string, enD: string, arD: string, mds: string[]): Promise<void> {
    await r.query(
      `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("icdCode") DO NOTHING`, [code, en, ar, enD, arD]);
    await r.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'UROL' AND d."icdCode" = $1 ON CONFLICT DO NOTHING`, [code]);
    for (const md of mds) {
      await r.query(
        `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
         SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
         CROSS JOIN "diagnoses" d
         WHERE dept.code = 'UROL' AND md.title = $2 AND d."icdCode" = $1 ON CONFLICT DO NOTHING`, [code, md]);
    }
  }

  private async remove(r: QueryRunner, code: string): Promise<void> {
    await r.query(
      `DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
         AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'UROL')`, [code]);
    await r.query(
      `DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
         AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'UROL')`, [code]);
    await r.query(
      `DELETE FROM "diagnoses" WHERE "icdCode" = $1
         AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1))`, [code]);
  }

  public async up(q: QueryRunner): Promise<void> {
    // ── nephrolithiasis / urinary calculi & renal infection ─────────────────────────
    await this.add(q, "GB71.1", "calculus in urethra", "حصاة في الإحليل",
      "Urethral stone, usually migrated from the bladder, causing acute obstruction; removed endoscopically or by meatotomy.",
      "حصاة إحليلية، غالباً مهاجرة من المثانة، تسبب انسداداً حاداً؛ تُزال تنظيرياً أو بشق الصِّماخ.",
      ["nephrolithiasis"]);
    await this.add(q, "GB56.2", "urinary calculus with hydronephrosis", "حصاة بولية مع استسقاء الكلية",
      "Obstructing stone causing upstream pelvicalyceal dilatation; urgent decompression with stent or nephrostomy if infected.",
      "حصاة سادّة تسبب توسّع الحويضة والكؤيسات؛ يلزم التخفيف العاجل بدعامة أو فغر كلية عند الإنتان.",
      ["nephrolithiasis"]);
    await this.add(q, "GB57", "nephrocalcinosis", "تكلّس الكلية",
      "Diffuse calcium deposition within the renal parenchyma, associated with hyperparathyroidism and renal tubular acidosis.",
      "ترسّب كلسي منتشر في متن الكلية، يرتبط بفرط نشاط جارات الدرق والحماض الأنبوبي الكلوي.",
      ["nephrolithiasis"]);
    await this.add(q, "LB30.62", "horseshoe kidney", "الكلية حدوة الفرس",
      "Congenital fusion of the lower renal poles across the midline; predisposes to stones, infection and ureteropelvic obstruction.",
      "اندماج خلقي للقطبين السفليين للكليتين عبر الخط الناصف؛ يهيّئ للحصيات والإنتان وانسداد الوصل الحويضي الحالبي.",
      ["nephrolithiasis"]);
    await this.add(q, "GC00.1", "infectious (acute) cystitis", "التهاب المثانة الجرثومي الحاد",
      "Acute bacterial bladder infection with frequency, urgency and dysuria; the commonest urinary tract infection.",
      "إصابة جرثومية حادة للمثانة مع تكرار وإلحاح وعسر تبول؛ أشيع إنتانات السبيل البولي.",
      ["nephrolithiasis"]);
    await this.add(q, "1B12.5", "genitourinary tuberculosis", "السل البولي التناسلي",
      "Tuberculous infection of the kidney and urinary tract causing strictures, cavitation and a contracted bladder.",
      "إصابة سلّية للكلية والسبيل البولي تسبب تضيّقات وتكهّفاً ومثانة متقفّعة.",
      ["nephrolithiasis"]);
    await this.add(q, "LB30.7", "ectopic (pelvic) kidney", "الكلية الهاجرة (الحوضية)",
      "Congenitally malpositioned kidney, commonly pelvic; predisposes to obstruction, stones and infection.",
      "كلية خلقية بموضع شاذ، غالباً حوضية؛ تهيّئ للانسداد والحصيات والإنتان.",
      ["nephrolithiasis"]);

    // ── ureteral obstruction ────────────────────────────────────────────────────────
    await this.add(q, "GB90.2", "ureteral stricture / stenosis", "تضيّق الحالب",
      "Fibrotic narrowing of the ureter from stones, surgery or radiation; managed by stenting, dilatation or reconstructive ureteroplasty.",
      "تضيّق ليفي في الحالب بسبب الحصيات أو الجراحة أو الإشعاع؛ يُدبَّر بالدعامة أو التوسيع أو رأب الحالب الترميمي.",
      ["ureteral obstruction"]);
    await this.add(q, "GB90.Y", "ureterocele", "القيلة الحالبية",
      "Cystic dilatation of the intravesical ureter causing obstruction; treated by endoscopic incision or reimplantation.",
      "توسّع كيسي للحالب داخل المثانة يسبب انسداداً؛ يُعالَج بالشق التنظيري أو إعادة الزرع.",
      ["ureteral obstruction"]);
    await this.add(q, "GB58", "pyonephrosis", "تقيّح الكلية",
      "Infected, obstructed hydronephrosis with pus in the collecting system; a urological emergency needing urgent drainage.",
      "استسقاء كلية مُنتَن وساد مع قيح في الجهاز الجامع؛ طارئ بولي يحتاج تصريفاً عاجلاً.",
      ["ureteral obstruction"]);
    await this.add(q, "FB51.4Z", "retroperitoneal fibrosis", "التليّف خلف الصفاقي",
      "Fibro-inflammatory encasement of the retroperitoneum trapping the ureters; managed by ureterolysis with stenting and steroids.",
      "إحاطة ليفية التهابية للحيز خلف الصفاقي تحبس الحالبين؛ تُدبَّر بتحرير الحالب مع الدعامة والستيرويدات.",
      ["ureteral obstruction"]);
    await this.add(q, "GB56.1", "hydronephrosis with ureteral obstruction", "استسقاء الكلية مع انسداد الحالب",
      "Pelvicalyceal dilatation secondary to ureteric obstruction; relieved by stent, nephrostomy or definitive repair.",
      "توسّع الحويضة والكؤيسات ثانوي لانسداد الحالب؛ يُخفَّف بالدعامة أو فغر الكلية أو الإصلاح النهائي.",
      ["ureteral obstruction"]);
    await this.add(q, "LB30.5", "accessory / duplex kidney", "الكلية الزائدة/المضاعفة",
      "Duplication of the renal collecting system or supernumerary kidney; may be complicated by reflux or obstruction.",
      "مضاعفة الجهاز الجامع الكلوي أو كلية زائدة العدد؛ قد تتعقّد بالجزر أو الانسداد.",
      ["ureteral obstruction"]);
    await this.add(q, "2C92.Z", "malignant neoplasm of ureter", "ورم خبيث في الحالب",
      "Upper-tract urothelial carcinoma of the ureter; presents with haematuria/obstruction and treated by nephroureterectomy.",
      "سرطانة ظهارية بولية في الحالب (السبيل العلوي)؛ تتظاهر ببيلة دموية/انسداد وتُعالَج باستئصال الكلية والحالب.",
      ["ureteral obstruction"]);
    await this.add(q, "GC04.2", "ureteral fistula", "الناسور الحالبي",
      "Abnormal communication between the ureter and an adjacent organ or skin, often iatrogenic after pelvic surgery.",
      "اتصال شاذ بين الحالب وعضو مجاور أو الجلد، غالباً علاجي المنشأ بعد جراحة حوضية.",
      ["ureteral obstruction"]);
    await this.add(q, "NB92.1Y", "injury / rupture of ureter", "إصابة/تمزّق الحالب",
      "Traumatic or iatrogenic ureteric injury; repaired by primary anastomosis, reimplantation or interposition graft.",
      "أذية حالبية رضّية أو علاجية المنشأ؛ تُصلَح بمفاغرة بدئية أو إعادة زرع أو طُعم خلالي.",
      ["ureteral obstruction"]);

    // ── testicular / scrotal pathology ──────────────────────────────────────────────
    await this.add(q, "GB00.Z", "hydrocele", "القيلة المائية",
      "Serous fluid collection within the tunica vaginalis causing painless scrotal swelling; excised or plicated if symptomatic.",
      "تجمّع سائل مصلي ضمن الغلالة الغمدية يسبب تورّماً صفنياً غير مؤلم؛ يُستأصل أو يُطوى عند حدوث أعراض.",
      ["testicular cancer"]);
    await this.add(q, "GB0Y&XA4D25", "cyst of epididymis", "كيسة البربخ",
      "Benign epididymal retention cyst, usually incidental; excised only when large or symptomatic.",
      "كيسة احتباسية حميدة في البربخ، عادةً عرضية؛ تُستأصل فقط عند الكِبَر أو الأعراض.",
      ["testicular cancer"]);
    await this.add(q, "1B71.1", "Fournier gangrene (necrotising fasciitis of scrotum)", "غرغرينة فورنييه (التهاب اللفافة الناخر)",
      "Fulminant polymicrobial necrotising fasciitis of the perineum and scrotum; a surgical emergency requiring aggressive debridement.",
      "التهاب لفافة ناخر متعدد الجراثيم صاعق في العجان وكيس الصفن؛ طارئ جراحي يتطلب تنضيراً واسعاً.",
      ["testicular cancer"]);
    await this.add(q, "2C83.0", "squamous cell carcinoma of scrotum", "سرطانة كيس الصفن حرشفية الخلايا",
      "Rare cutaneous malignancy of the scrotal skin, historically linked to occupational carcinogen exposure; treated by wide excision.",
      "خباثة جلدية نادرة في جلد كيس الصفن، ارتبطت تاريخياً بالتعرّض المهني للمسرطنات؛ تُعالَج بالاستئصال الواسع.",
      ["testicular cancer"]);
    await this.add(q, "2C80.Y", "non-seminomatous / other testicular tumour", "ورم الخصية المنوي الخلوي/غير المنوي",
      "Other malignant testicular tumours including non-seminomatous germ cell and Leydig-cell tumours; managed by radical orchidectomy.",
      "أورام خصية خبيثة أخرى تشمل الأورام الجرثومية غير المنوية وأورام خلايا لايديغ؛ تُدبَّر باستئصال الخصية الجذري.",
      ["testicular cancer"]);
    await this.add(q, "GB07.2", "inflammatory disorders of scrotum (abscess/gangrene)", "الاضطرابات الالتهابية لكيس الصفن",
      "Scrotal cellulitis, abscess or non-infective gangrene; managed by drainage, antibiotics and source control.",
      "التهاب نسيج خلوي أو خراج أو غرغرينة غير إنتانية في كيس الصفن؛ تُدبَّر بالتصريف والمضادات والسيطرة على المصدر.",
      ["testicular cancer"]);

    // ── urinary incontinence ────────────────────────────────────────────────────────
    await this.add(q, "MF50.21", "urge urinary incontinence", "السلس الإلحاحي",
      "Involuntary leakage preceded by a strong urge, from detrusor overactivity; treated with antimuscarinics, beta-3 agonists or botulinum toxin.",
      "تسرّب لا إرادي يسبقه إلحاح شديد، بسبب فرط نشاط العضلة الناصرة؛ يُعالَج بمضادات المسكارين أو ناهضات بيتا-3 أو ذيفان البوتولينوم.",
      ["urinary incontinence"]);
    await this.add(q, "MF50.22", "mixed urinary incontinence", "السلس البولي المختلط",
      "Combination of stress and urge incontinence; management is directed at the predominant component.",
      "اجتماع السلس الإجهادي والإلحاحي؛ يوجَّه التدبير نحو المكوّن الغالب.",
      ["urinary incontinence"]);
    await this.add(q, "MF50.24", "reflex urinary incontinence", "السلس المنعكس",
      "Involuntary voiding from neurogenic detrusor reflexes without sensation, as in spinal cord injury.",
      "تبوّل لا إرادي بسبب منعكسات العضلة الناصرة العصبية دون إحساس، كما في إصابة النخاع الشوكي.",
      ["urinary incontinence"]);
    await this.add(q, "GC01.4", "neurogenic bladder dysfunction", "الخلل العصبي للمثانة",
      "Neuromuscular bladder dysfunction from spinal or neurological disease causing incontinence and/or retention; managed by catheterisation and urodynamic-guided therapy.",
      "خلل عصبي عضلي في المثانة بسبب مرض شوكي أو عصبي يسبب السلس و/أو الاحتباس؛ يُدبَّر بالقثطرة والمعالجة الموجَّهة بالديناميكا البولية.",
      ["urinary incontinence", "urinary retention"]);
    await this.add(q, "GC01.1", "vesical fistula (vesicovaginal)", "ناسور مثاني (مثاني مهبلي)",
      "Abnormal communication between bladder and vagina/bowel causing continuous leakage, often post-surgical or obstetric; repaired surgically.",
      "اتصال شاذ بين المثانة والمهبل/الأمعاء يسبب تسرّباً مستمراً، غالباً بعد الجراحة أو الولادة؛ يُصلَح جراحياً.",
      ["urinary incontinence"]);
    await this.add(q, "GC06", "urethral diverticulum", "رتج الإحليل",
      "Outpouching of the urethra causing dribbling, dysuria and recurrent infection; excised by diverticulectomy.",
      "جيب في الإحليل يسبب التنقيط وعسر التبول والإنتان الناكس؛ يُستأصل برأب/استئصال الرتج.",
      ["urinary incontinence"]);

    // ── urinary retention ───────────────────────────────────────────────────────────
    await this.add(q, "MF50.3", "retention of urine", "احتباس البول",
      "Inability to empty the bladder; acute retention is a painful emergency requiring catheterisation, chronic retention risks renal impairment.",
      "عدم القدرة على إفراغ المثانة؛ الاحتباس الحاد طارئ مؤلم يتطلب القثطرة، ويهدّد الاحتباس المزمن بالقصور الكلوي.",
      ["urinary retention"]);
    await this.add(q, "LB31.2", "posterior urethral valve", "الصمام الإحليلي الخلفي",
      "Congenital obstructing membrane of the posterior urethra in male infants causing bladder outlet obstruction; ablated endoscopically.",
      "غشاء سادّ خلقي في الإحليل الخلفي لدى الذكور الرضّع يسبب انسداد مخرج المثانة؛ يُستأصل تنظيرياً.",
      ["urinary retention"]);
    await this.add(q, "GC01.2", "diverticulum of bladder", "رتج المثانة",
      "Herniation of bladder mucosa through the wall, often from chronic outlet obstruction; may need diverticulectomy.",
      "انفتاق مخاطية المثانة عبر جدارها، غالباً بسبب انسداد المخرج المزمن؛ قد يحتاج استئصال الرتج.",
      ["urinary retention"]);
    await this.add(q, "LB31.3", "exstrophy of urinary bladder", "انقلاب المثانة الخلقي",
      "Congenital midline defect with the bladder open onto the abdominal wall; reconstructed in staged surgery.",
      "عيب خلقي في الخط الناصف تنفتح فيه المثانة على جدار البطن؛ يُرمَّم بجراحة متعددة المراحل.",
      ["urinary retention"]);
    await this.add(q, "GC00.2", "contracted urinary bladder", "المثانة المتقفّعة",
      "Small-capacity fibrotic bladder from chronic inflammation, tuberculosis or radiation; may require augmentation cystoplasty.",
      "مثانة ليفية صغيرة السعة بسبب التهاب مزمن أو سل أو إشعاع؛ قد تتطلب رأب المثانة التوسيعي.",
      ["urinary retention"]);
  }

  public async down(q: QueryRunner): Promise<void> {
    for (const code of [
      "GB71.1","GB56.2","GB57","LB30.62","GC00.1","1B12.5","LB30.7",
      "GB90.2","GB90.Y","GB58","FB51.4Z","GB56.1","LB30.5","2C92.Z","GC04.2","NB92.1Y",
      "GB00.Z","GB0Y&XA4D25","1B71.1","2C83.0","2C80.Y","GB07.2",
      "MF50.21","MF50.22","MF50.24","GC01.4","GC01.1","GC06",
      "MF50.3","LB31.2","GC01.2","LB31.3","GC00.2",
    ]) await this.remove(q, code);
  }
}
