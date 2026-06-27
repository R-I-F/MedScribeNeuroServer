import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * UROL audit — MIG-D batch 1 of 2: prostate (BPH + prostatitis + prostate cancer), bladder
 * cancer, renal cancer, renal-transplant causes, erectile dysfunction, male infertility and
 * penile pathology (44 diagnoses). INSERT ... ON CONFLICT("icdCode") DO NOTHING, then link
 * department_diagnoses (UROL) + main_diag_diagnoses (by title). All ICD-11 codes
 * icd11_search-verified (AUDIT_UROL.md 2D). GC01.0 dual-links BPH + urinary retention.
 */
export class AddUrolDiagnosesBatch1750000000146 implements MigrationInterface {
  name = "AddUrolDiagnosesBatch1750000000146";

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
    // ── benign prostatic hyperplasia & prostatitis ──────────────────────────────────
    await this.add(q, "GC01.0", "bladder neck obstruction", "انسداد عنق المثانة",
      "Obstruction at the bladder neck causing poor flow and retention; in men commonly secondary to BPH, managed by bladder-neck incision or TURP.",
      "انسداد عند عنق المثانة يسبب ضعف الجريان والاحتباس؛ شائع عند الرجال بسبب تضخم البروستاتا الحميد، ويُعالَج بشق عنق المثانة أو الاستئصال عبر الإحليل.",
      ["benign prostatic hyperplasia", "urinary retention"]);
    await this.add(q, "GA91.0", "chronic prostatitis", "التهاب البروستاتا المزمن",
      "Persistent prostatic inflammation with pelvic pain and voiding symptoms; chronic bacterial and non-bacterial (CPPS) forms are recognised.",
      "التهاب مزمن في البروستاتا مع ألم حوضي وأعراض تبوّل؛ يشمل الشكلين الجرثومي المزمن وغير الجرثومي (متلازمة ألم الحوض المزمن).",
      ["benign prostatic hyperplasia"]);
    await this.add(q, "GA91.Y", "acute bacterial prostatitis", "التهاب البروستاتا الجرثومي الحاد",
      "Acute febrile bacterial infection of the prostate with dysuria and a tender gland; may progress to abscess and urinary retention.",
      "إصابة جرثومية حادة حموية للبروستاتا مع عسر التبول وغدة مؤلمة؛ قد تتطور إلى خراج واحتباس بولي.",
      ["benign prostatic hyperplasia"]);
    await this.add(q, "GA91.1", "abscess of prostate", "خراج البروستاتا",
      "Suppurative collection within the prostate, usually complicating acute prostatitis; needs transrectal/transurethral drainage and antibiotics.",
      "تجمّع قيحي داخل البروستاتا، يضاعف عادةً التهاب البروستاتا الحاد؛ يحتاج تصريفاً عبر المستقيم/الإحليل والمضادات الحيوية.",
      ["benign prostatic hyperplasia"]);
    await this.add(q, "GA91.3", "calculus of prostate", "حصاة البروستاتا",
      "Calcified concretions within prostatic ducts, often incidental but may sustain chronic prostatitis.",
      "تكلّسات داخل أقنية البروستاتا، غالباً عرضية لكنها قد تديم التهاب البروستاتا المزمن.",
      ["benign prostatic hyperplasia"]);

    // ── bladder cancer ──────────────────────────────────────────────────────────────
    await this.add(q, "2C94.1", "squamous cell carcinoma of urinary bladder", "سرطانة المثانة حرشفية الخلايا",
      "Squamous histological variant of bladder cancer, associated with chronic irritation, indwelling catheters and schistosomiasis; often muscle-invasive at diagnosis.",
      "نمط نسيجي حرشفي من سرطان المثانة، يرتبط بالتهيج المزمن والقثاطر المقيمة والبلهارسيا؛ غالباً غازٍ للعضلة عند التشخيص.",
      ["bladder cancer"]);
    await this.add(q, "2C94.0", "adenocarcinoma of urinary bladder", "سرطانة المثانة الغدية",
      "Glandular variant of bladder cancer, including urachal tumours; uncommon and typically treated by partial or radical cystectomy.",
      "نمط غدي من سرطان المثانة، يشمل أورام الأوراك؛ نادر ويُعالَج عادةً باستئصال جزئي أو جذري للمثانة.",
      ["bladder cancer"]);
    await this.add(q, "2E68", "carcinoma in situ of bladder", "سرطانة المثانة اللابدة",
      "Flat high-grade non-invasive urothelial carcinoma; high recurrence/progression risk, managed with intravesical BCG.",
      "سرطانة ظهارية بولية مسطحة عالية الدرجة غير غازية؛ خطر نكس/تقدم مرتفع، تُعالَج بتلقيح BCG داخل المثانة.",
      ["bladder cancer"]);
    await this.add(q, "2C94.Y", "other specified carcinoma of urinary bladder", "سرطانة المثانة (نمط آخر)",
      "Other histological carcinomas of the bladder not otherwise specified, including rare variant urothelial subtypes.",
      "سرطانات نسيجية أخرى للمثانة غير محددة بنوع، تشمل أنماطاً ظهارية بولية متنوعة نادرة.",
      ["bladder cancer"]);
    await this.add(q, "2F35", "benign neoplasm of bladder", "ورم حميد في المثانة",
      "Benign urinary-tract neoplasm such as urothelial papilloma or leiomyoma of the bladder; treated by transurethral resection.",
      "ورم حميد في السبيل البولي كالورم الحليمي الظهاري أو الورم العضلي الأملس في المثانة؛ يُعالَج بالاستئصال عبر الإحليل.",
      ["bladder cancer"]);

    // ── prostate cancer ─────────────────────────────────────────────────────────────
    await this.add(q, "2C82.Y", "other specified malignant neoplasm of prostate", "سرطانة البروستاتا (نمط آخر)",
      "Prostate malignancies other than acinar adenocarcinoma, including familial and ductal variants.",
      "أورام البروستاتا الخبيثة غير السرطانة الغدية العنبية، تشمل الأنماط العائلية والقنوية.",
      ["prostate cancer"]);
    await this.add(q, "2E67.5", "high-grade prostatic intraepithelial neoplasia (HGPIN)", "الورم داخل الظهاري البروستاتي عالي الدرجة",
      "High-grade dysplastic precursor lesion of prostate cancer; warrants close surveillance and may prompt repeat biopsy.",
      "آفة سليفة خلل تنسجية عالية الدرجة لسرطان البروستاتا؛ تستوجب مراقبة دقيقة وقد تستدعي خزعة معادة.",
      ["prostate cancer"]);
    await this.add(q, "GA91.6", "low-grade intraepithelial lesion of prostate", "آفة داخل الظهارة البروستاتية منخفضة الدرجة",
      "Low-grade prostatic intraepithelial neoplasia (PIN I); minimal cancer association, usually managed expectantly.",
      "ورم داخل ظهاري بروستاتي منخفض الدرجة؛ ارتباطه بالسرطان ضئيل، ويُدبّر عادةً بالترقّب.",
      ["prostate cancer"]);
    await this.add(q, "2E06", "metastatic neoplasm in prostate / male genital organs", "نقيلة ورمية في الأعضاء التناسلية الذكرية",
      "Secondary (metastatic) malignant deposit in the prostate or other male genital organs; reflects advanced systemic disease.",
      "ترسّب ورمي خبيث ثانوي (نقيلي) في البروستاتا أو سائر الأعضاء التناسلية الذكرية؛ يعكس مرضاً جهازياً متقدماً.",
      ["prostate cancer"]);

    // ── renal cancer ────────────────────────────────────────────────────────────────
    await this.add(q, "2C90.Y", "nephroblastoma (Wilms tumour)", "الورم الأرومي الكلوي (ورم ويلمز)",
      "Commonest paediatric renal malignancy; presents as an abdominal mass, treated by nephrectomy with chemotherapy.",
      "أشيع ورم خبيث كلوي عند الأطفال؛ يتظاهر بكتلة بطنية، ويُعالَج باستئصال الكلية مع المعالجة الكيميائية.",
      ["renal cancer"]);
    await this.add(q, "2C91.Z", "malignant neoplasm of renal pelvis", "ورم خبيث في حويضة الكلية",
      "Upper-tract urothelial carcinoma arising in the renal pelvis; managed by radical nephroureterectomy.",
      "سرطانة ظهارية بولية في السبيل العلوي تنشأ في حويضة الكلية؛ تُعالَج باستئصال الكلية والحالب الجذري.",
      ["renal cancer"]);
    await this.add(q, "2E80.0Z", "angiomyolipoma of kidney", "الورم الوعائي العضلي الشحمي الكلوي",
      "Benign fat-containing renal tumour, often associated with tuberous sclerosis; large lesions risk haemorrhage and may need embolisation.",
      "ورم كلوي حميد حاوٍ على الشحم، يرتبط غالباً بالتصلب الحدبي؛ الآفات الكبيرة معرّضة للنزف وقد تحتاج إصماماً.",
      ["renal cancer"]);
    await this.add(q, "2E00", "secondary (metastatic) neoplasm of kidney", "ورم نقيلي ثانوي في الكلية",
      "Metastatic deposit in the kidney or renal pelvis from a distant primary; indicates disseminated malignancy.",
      "ترسّب نقيلي في الكلية أو حويضتها من ورم بدئي بعيد؛ يدل على خباثة منتشرة.",
      ["renal cancer"]);

    // ── renal transplantation (causes of ESRD / renovascular) ───────────────────────
    await this.add(q, "GB61.Z", "diabetic kidney disease (diabetic nephropathy)", "اعتلال الكلية السكري",
      "Diabetic chronic kidney disease and the leading cause of end-stage renal disease worldwide; progression leads to dialysis or transplantation.",
      "مرض كلوي مزمن سكري وأكثر أسباب المرض الكلوي بالمرحلة النهائية شيوعاً عالمياً؛ يقود تطوّره إلى الغسيل أو الزرع.",
      ["renal transplantation"]);
    await this.add(q, "BA02", "hypertensive renal disease", "مرض الكلى ارتفاع‑ضغطي",
      "Hypertension-related nephrosclerosis; a common contributor to progressive chronic kidney disease and transplant need.",
      "تصلب كلوي مرتبط بارتفاع الضغط؛ مساهم شائع في المرض الكلوي المزمن المترقّي والحاجة للزرع.",
      ["renal transplantation"]);
    await this.add(q, "GB41", "nephrotic syndrome", "المتلازمة الكلائية",
      "Heavy proteinuria, hypoalbuminaemia and oedema from glomerular disease; some causes progress to renal failure.",
      "بيلة بروتينية غزيرة ونقص ألبومين الدم ووذمة بسبب مرض كبيبي؛ تتطوّر بعض الأسباب إلى القصور الكلوي.",
      ["renal transplantation"]);
    await this.add(q, "GB40", "nephritic syndrome (glomerulonephritis)", "المتلازمة الكلوية (التهاب الكبيبات)",
      "Glomerular inflammation with haematuria, hypertension and renal impairment; a recognised cause of progressive kidney failure.",
      "التهاب كبيبي مع بيلة دموية وارتفاع ضغط وقصور كلوي؛ سبب معروف للقصور الكلوي المترقّي.",
      ["renal transplantation"]);
    await this.add(q, "BD40.2", "renal artery stenosis", "تضيّق الشريان الكلوي",
      "Atherosclerotic narrowing of the renal artery causing renovascular hypertension and ischaemic nephropathy; treated by angioplasty/stenting.",
      "تضيّق تصلّبي في الشريان الكلوي يسبب ارتفاع ضغط وعائي كلوي واعتلال كلية إقفاري؛ يُعالَج بالتوسيع/الدعامة.",
      ["renal transplantation"]);
    await this.add(q, "GB61.4", "chronic kidney disease, stage 4", "المرض الكلوي المزمن المرحلة الرابعة",
      "Severely reduced GFR (15–29 mL/min); the pre-dialysis stage at which transplant work-up and access planning begin.",
      "انخفاض شديد في الرشح الكبيبي (15–29 مل/دقيقة)؛ مرحلة ما قبل الغسيل التي يبدأ فيها تقييم الزرع والتخطيط للوصول الوعائي.",
      ["renal transplantation"]);
    await this.add(q, "GB60.Z", "acute kidney injury", "الأذية الكلوية الحادة",
      "Abrupt decline in renal function; severe or unrecovered cases may need renal replacement therapy.",
      "هبوط مفاجئ في الوظيفة الكلوية؛ قد تحتاج الحالات الشديدة أو غير المتعافية إلى المعالجة التعويضية الكلوية.",
      ["renal transplantation"]);
    await this.add(q, "GB90.3", "ischaemia or infarction of kidney", "احتشاء/إقفار الكلية",
      "Loss of renal arterial perfusion from embolism or thrombosis causing segmental or complete infarction.",
      "فقدان التروية الشريانية الكلوية بسبب صِمّة أو خثار يسبب احتشاءاً مجزّأً أو كاملاً.",
      ["renal transplantation"]);

    // ── erectile dysfunction / sexual dysfunction ───────────────────────────────────
    await this.add(q, "GB06.1", "priapism", "القُساح (الانتصاب المؤلم المطوّل)",
      "Prolonged painful erection unrelated to arousal; ischaemic (low-flow) priapism is a urological emergency requiring aspiration or shunt.",
      "انتصاب مؤلم مطوّل غير مرتبط بالإثارة؛ القُساح الإقفاري (منخفض الجريان) طارئ بولي يتطلب الرشف أو التحويلة.",
      ["erectile dysfunction"]);
    await this.add(q, "HA03.0Z", "premature ejaculation", "سرعة القذف",
      "Ejaculation occurring sooner than desired with distress; the commonest male sexual dysfunction.",
      "قذف يحدث أسرع من المرغوب مع ضائقة؛ أشيع الخلل الجنسي عند الذكور.",
      ["erectile dysfunction"]);
    await this.add(q, "GB06.2", "Peyronie disease (penile fibromatosis)", "داء بيروني (التليّف القضيبي)",
      "Fibrous plaque of the tunica albuginea causing penile curvature and painful erections; severe cases need surgical correction.",
      "لويحة ليفية في الغلالة البيضاء تسبب انحناء القضيب وانتصاباً مؤلماً؛ تحتاج الحالات الشديدة إلى تصحيح جراحي.",
      ["erectile dysfunction"]);
    await this.add(q, "5A81.1", "male hypogonadism (testicular hypofunction)", "قصور الغدد التناسلية الذكري",
      "Testosterone deficiency from testicular failure causing low libido, erectile dysfunction and infertility.",
      "عوز التستوستيرون بسبب قصور الخصية يسبب نقص الرغبة وضعف الانتصاب والعقم.",
      ["erectile dysfunction"]);

    // ── male infertility ────────────────────────────────────────────────────────────
    await this.add(q, "LB52.Z", "cryptorchidism (undescended testis)", "الخصية الهاجرة (عدم نزول الخصية)",
      "Failure of testicular descent; corrected by orchidopexy in childhood to reduce infertility and malignancy risk.",
      "إخفاق نزول الخصية؛ يُصحَّح بتثبيت الخصية في الطفولة للحد من خطر العقم والخباثة.",
      ["male infertility"]);
    await this.add(q, "LD50.3Z", "Klinefelter syndrome", "متلازمة كلاينفلتر",
      "47,XXY chromosomal disorder causing primary testicular failure, azoospermia and hypogonadism.",
      "اضطراب صبغي 47,XXY يسبب قصوراً خصوياً بدئياً وانعدام النطاف وقصور الغدد التناسلية.",
      ["male infertility"]);
    await this.add(q, "GB00.2", "spermatocele", "القيلة المنوية",
      "Benign cystic collection of sperm-laden fluid at the epididymal head; excised if symptomatic.",
      "تجمّع كيسي حميد لسائل حاوٍ على النطاف عند رأس البربخ؛ يُستأصل عند حدوث أعراض.",
      ["male infertility"]);
    await this.add(q, "GB03", "atrophy of testis", "ضمور الخصية",
      "Reduction in testicular volume following torsion, infection, varicocele or hormonal failure, impairing spermatogenesis.",
      "نقص حجم الخصية بعد الالتواء أو الإنتان أو دوالي الحبل المنوي أو القصور الهرموني، يضعف تكوّن النطاف.",
      ["male infertility"]);

    // ── penile pathology ────────────────────────────────────────────────────────────
    await this.add(q, "GB05.3", "paraphimosis", "احتباس القلفة (الشبم الخانق)",
      "Retracted foreskin trapped behind the glans causing painful oedema; a urological emergency requiring manual reduction or dorsal slit.",
      "قلفة مُرتدّة محتبسة خلف الحشفة تسبب وذمة مؤلمة؛ طارئ بولي يتطلب الرد اليدوي أو الشق الظهري.",
      ["penile pathology"]);
    await this.add(q, "GB06.0Z", "balanoposthitis (balanitis)", "التهاب الحشفة والقلفة",
      "Inflammation of the glans and prepuce, often infective; recurrent cases may indicate diabetes or warrant circumcision.",
      "التهاب الحشفة والقلفة، غالباً إنتاني؛ قد تشير الحالات الناكسة إلى السكري أو تستدعي الختان.",
      ["penile pathology"]);
    await this.add(q, "2C81.0", "squamous cell carcinoma of penis", "سرطانة القضيب حرشفية الخلايا",
      "Commonest penile malignancy, usually on the glans or prepuce; managed by penis-sparing surgery or partial/total penectomy with inguinal staging.",
      "أشيع خباثة قضيبية، عادةً على الحشفة أو القلفة؛ تُعالَج بجراحة محافظة على القضيب أو استئصال جزئي/كلي مع تصنيف إربي.",
      ["penile pathology"]);
    await this.add(q, "LB53.Z", "hypospadias", "المبال التحتاني (الإحليل التحتي)",
      "Congenital ventral ectopic urethral meatus with chordee; corrected by staged or single-stage urethroplasty.",
      "فُتحة إحليلية بطنية هاجرة خلقية مع تحدّب؛ تُصحَّح برأب الإحليل على مرحلة واحدة أو مراحل.",
      ["penile pathology"]);
    await this.add(q, "LB55", "epispadias", "المبال الفوقاني (الإحليل الفوقي)",
      "Congenital dorsal ectopic urethral opening, often part of the exstrophy–epispadias complex; surgically reconstructed.",
      "فُتحة إحليلية ظهرية هاجرة خلقية، غالباً جزء من مركّب انقلاب المثانة–المبال الفوقاني؛ تُرمَّم جراحياً.",
      ["penile pathology"]);
    await this.add(q, "2C31.0", "verrucous squamous cell carcinoma of penis", "سرطانة القضيب الحرشفية الثؤلولية",
      "Well-differentiated warty squamous cell carcinoma with indolent local growth and low metastatic potential.",
      "سرطانة حرشفية ثؤلولية جيدة التمايز ذات نمو موضعي بطيء وقدرة نقيلية منخفضة.",
      ["penile pathology"]);
    await this.add(q, "2E67.40", "squamous cell carcinoma in situ of penis (Bowen disease)", "سرطانة القضيب الحرشفية اللابدة",
      "Penile intraepithelial neoplasia confined to the epithelium; treated topically, by laser or local excision.",
      "ورم داخل ظهاري قضيبي محصور بالظهارة؛ يُعالَج موضعياً أو بالليزر أو الاستئصال الموضعي.",
      ["penile pathology"]);
    await this.add(q, "GB06.3", "Mondor disease of the penis", "داء موندور القضيبي",
      "Superficial thrombophlebitis of the dorsal penile vein presenting as a tender cord-like induration; usually self-limiting.",
      "التهاب وريد خثاري سطحي في الوريد القضيبي الظهري يتظاهر بتصلّب حبلي مؤلم؛ يُشفى ذاتياً عادةً.",
      ["penile pathology"]);
  }

  public async down(q: QueryRunner): Promise<void> {
    for (const code of [
      "GC01.0","GA91.0","GA91.Y","GA91.1","GA91.3",
      "2C94.1","2C94.0","2E68","2C94.Y","2F35",
      "2C82.Y","2E67.5","GA91.6","2E06",
      "2C90.Y","2C91.Z","2E80.0Z","2E00",
      "GB61.Z","BA02","GB41","GB40","BD40.2","GB61.4","GB60.Z","GB90.3",
      "GB06.1","HA03.0Z","GB06.2","5A81.1",
      "LB52.Z","LD50.3Z","GB00.2","GB03",
      "GB05.3","GB06.0Z","2C81.0","LB53.Z","LB55","2C31.0","2E67.40","GB06.3",
    ]) await this.remove(q, code);
  }
}
