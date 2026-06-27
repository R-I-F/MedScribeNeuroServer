import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OPHTHAL audit — MIG-D batch 1 of 2: cataract, cornea, glaucoma, macular degeneration and
 * retinopathy diagnoses (35 rows). INSERT ... ON CONFLICT("icdCode") DO NOTHING, then link
 * department_diagnoses (OPHTHAL) + main_diag_diagnoses (by title). All ICD-11 codes
 * icd11_search-verified (AUDIT_OPHTHAL.md 2D). NB: 9B11.0 (aphakia) reuses the code freed by
 * MIG-A's vitreous-haemorrhage recode.
 */
export class AddOphthalDiagnosesBatch1750000000140 implements MigrationInterface {
  name = "AddOphthalDiagnosesBatch1750000000140";

  private async add(r: QueryRunner, code: string, en: string, ar: string, enD: string, arD: string, mds: string[]): Promise<void> {
    await r.query(
      `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("icdCode") DO NOTHING`, [code, en, ar, enD, arD]);
    await r.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'OPHTHAL' AND d."icdCode" = $1 ON CONFLICT DO NOTHING`, [code]);
    for (const md of mds) {
      await r.query(
        `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
         SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
         CROSS JOIN "diagnoses" d
         WHERE dept.code = 'OPHTHAL' AND md.title = $2 AND d."icdCode" = $1 ON CONFLICT DO NOTHING`, [code, md]);
    }
  }

  private async remove(r: QueryRunner, code: string): Promise<void> {
    await r.query(
      `DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
         AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'OPHTHAL')`, [code]);
    await r.query(
      `DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
         AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'OPHTHAL')`, [code]);
    await r.query(
      `DELETE FROM "diagnoses" WHERE "icdCode" = $1
         AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1))`, [code]);
  }

  public async up(q: QueryRunner): Promise<void> {
    // ── cataract ───────────────────────────────────────────────────────────────────
    await this.add(q, "9B10.0Y", "cortical and nuclear age-related cataract", "ساد قشري ونووي مرتبط بالعمر",
      "Age-related lens opacification of cortical or nuclear sclerotic type; the commonest indication for phacoemulsification.",
      "إعتام عدسة مرتبط بالعمر من النوع القشري أو التصلبي النووي؛ أشيع دواعي استحلاب العدسة.",
      ["cataract"]);
    await this.add(q, "9B10.02", "mature age-related cataract", "ساد ناضج مرتبط بالعمر",
      "Fully opaque (white) age-related lens; advanced cataract requiring careful surgical extraction.",
      "عدسة معتمة كلياً (بيضاء) مرتبطة بالعمر؛ ساد متقدم يتطلب استخراجاً جراحياً دقيقاً.",
      ["cataract"]);
    await this.add(q, "9B10.20", "traumatic cataract", "ساد رضحي",
      "Lens opacity following blunt or penetrating ocular trauma; may accompany capsular or zonular damage.",
      "إعتام العدسة بعد رض كليل أو نافذ للعين؛ قد يصاحبه تلف المحفظة أو الأربطة المعلِّقة.",
      ["cataract"]);
    await this.add(q, "9B10.21", "diabetic cataract", "ساد سكري",
      "Accelerated lens opacification in diabetes mellitus, including the classic snowflake subtype in the young.",
      "إعتام عدسة متسارع في الداء السكري، بما في ذلك النوع الندفي الكلاسيكي لدى الصغار.",
      ["cataract"]);
    await this.add(q, "9B10.22", "after-cataract (posterior capsule opacification)", "الساد التالي (إعتام المحفظة الخلفية)",
      "Opacification of the posterior capsule after cataract surgery; treated with Nd:YAG laser capsulotomy.",
      "إعتام المحفظة الخلفية بعد جراحة الساد؛ يُعالَج بفتح المحفظة بليزر الياغ.",
      ["cataract"]);
    await this.add(q, "9B10.2Y", "complicated (secondary) cataract", "ساد معقد (ثانوي)",
      "Cataract secondary to chronic intraocular disease (uveitis, high myopia) or drugs such as corticosteroids.",
      "ساد ثانوي لمرض داخل العين مزمن (التهاب العنبية، قصر النظر الشديد) أو أدوية كالستيرويدات القشرية.",
      ["cataract"]);
    await this.add(q, "LA12.1", "congenital cataract", "ساد خلقي",
      "Lens opacity present at birth; visually significant cases need early surgery to prevent deprivation amblyopia.",
      "إعتام عدسة موجود عند الولادة؛ الحالات المؤثرة على الرؤية تحتاج جراحة مبكرة لمنع الغمش الحرماني.",
      ["cataract"]);
    await this.add(q, "9B11.0", "aphakia", "انعدام العدسة (اللاعدسية)",
      "Absence of the crystalline lens, usually after cataract extraction without IOL implantation; corrected optically or by secondary IOL.",
      "غياب العدسة البلورية، عادة بعد استخراج الساد دون زرع عدسة؛ يُصحَّح بصرياً أو بعدسة ثانوية.",
      ["cataract"]);

    // ── corneal disease & scarring ───────────────────────────────────────────────────
    await this.add(q, "9A71&XN74M", "bacterial (microbial) keratitis", "التهاب القرنية الجرثومي",
      "Sight-threatening bacterial corneal infection, often contact-lens related; needs intensive topical antibiotics.",
      "عدوى قرنية جرثومية مهددة للبصر، غالباً مرتبطة بالعدسات اللاصقة؛ تحتاج صادات موضعية مكثفة.",
      ["corneal disease & scarring"]);
    await this.add(q, "9A71&XN8AY", "fungal keratitis", "التهاب القرنية الفطري",
      "Corneal infection by filamentous fungi or yeasts, often after vegetative trauma; indolent and difficult to treat.",
      "عدوى القرنية بالفطريات الخيطية أو الخمائر، غالباً بعد رض نباتي؛ بطيئة وصعبة العلاج.",
      ["corneal disease & scarring"]);
    await this.add(q, "1F00.10", "herpes simplex keratitis", "التهاب القرنية بالهربس البسيط",
      "Recurrent HSV corneal infection (dendritic, stromal or disciform); a leading infectious cause of corneal blindness.",
      "عدوى قرنية متكررة بفيروس الهربس البسيط (تغصنية أو سدوية أو قرصية)؛ سبب معدٍ رئيسي للعمى القرني.",
      ["corneal disease & scarring"]);
    await this.add(q, "9A77.Z", "corneal scar or opacity", "ندبة وعتامة القرنية",
      "Permanent corneal opacity following infection, ulceration or trauma; may require keratoplasty for visual rehabilitation.",
      "عتامة قرنية دائمة بعد عدوى أو تقرح أو رض؛ قد تحتاج رأب القرنية لإعادة التأهيل البصري.",
      ["corneal disease & scarring"]);
    await this.add(q, "9A78.8", "recurrent corneal erosion", "تآكل القرنية المتكرر",
      "Repeated breakdown of corneal epithelium, often after abrasion or in basement-membrane dystrophy; managed medically or by stromal puncture.",
      "تكسر متكرر لظِهارة القرنية، غالباً بعد سحجة أو في حثل الغشاء القاعدي؛ يُدار طبياً أو بالوخز السدوي.",
      ["corneal disease & scarring"]);
    await this.add(q, "9A78.4", "corneal degeneration (incl. band keratopathy)", "تنكس القرنية",
      "Acquired corneal degenerations such as band keratopathy (calcium deposition) or arcus; chelation or keratectomy may be needed.",
      "تنكسات قرنية مكتسبة مثل اعتلال القرنية الشريطي (ترسب الكالسيوم) أو القوس؛ قد تحتاج خلباً أو استئصالاً قرنياً.",
      ["corneal disease & scarring"]);
    await this.add(q, "9A78.0", "corneal neovascularization (pannus)", "تكوّن الأوعية الدموية في القرنية",
      "Ingrowth of blood vessels into the avascular cornea from chronic hypoxia or inflammation; threatens graft survival.",
      "نمو أوعية دموية داخل القرنية اللاوعائية من نقص أكسجة أو التهاب مزمن؛ يهدد بقاء الطعم.",
      ["corneal disease & scarring"]);
    await this.add(q, "9A78.20", "bullous keratopathy", "اعتلال القرنية الفقاعي",
      "Chronic corneal oedema with epithelial bullae from endothelial decompensation (often pseudophakic); treated by endothelial keratoplasty.",
      "وذمة قرنية مزمنة مع فقاعات ظهارية من قصور البطانة (غالباً بعد زرع عدسة)؛ تُعالَج برأب القرنية البطاني.",
      ["corneal disease & scarring"]);

    // ── glaucoma ─────────────────────────────────────────────────────────────────────
    await this.add(q, "9C61.12", "primary angle-closure glaucoma", "الجلوكوما الأولية مغلقة الزاوية",
      "Chronic angle closure with optic-nerve damage from appositional/synechial obstruction of the trabecular meshwork; managed by iridotomy, lens extraction or filtration.",
      "انغلاق زاوية مزمن مع تلف العصب البصري من انسداد الشبكة التربيقية؛ يُدار بفتح القزحية أو استخراج العدسة أو الترشيح.",
      ["glaucoma"]);
    await this.add(q, "9C61.00", "normal tension glaucoma", "الجلوكوما سوية التوتر",
      "Glaucomatous optic neuropathy with intraocular pressure consistently within the normal range; vascular factors implicated.",
      "اعتلال عصب بصري جلوكومي مع ضغط داخل العين ضمن المعدل الطبيعي باستمرار؛ تُتَّهم العوامل الوعائية.",
      ["glaucoma"]);
    await this.add(q, "9C61.01", "ocular hypertension", "ارتفاع ضغط العين",
      "Elevated intraocular pressure without optic-nerve or visual-field damage; a glaucoma risk factor requiring monitoring.",
      "ارتفاع ضغط داخل العين دون تلف العصب البصري أو الحقل البصري؛ عامل خطر للجلوكوما يتطلب مراقبة.",
      ["glaucoma"]);
    await this.add(q, "9C61.20", "pseudoexfoliative glaucoma", "الجلوكوما التقشّرية الكاذبة",
      "Secondary open-angle glaucoma from pseudoexfoliative material deposition; associated with zonular weakness at surgery.",
      "جلوكوما ثانوية مفتوحة الزاوية من ترسب المادة التقشرية الكاذبة؛ ترتبط بضعف الأربطة المعلِّقة أثناء الجراحة.",
      ["glaucoma"]);
    await this.add(q, "9C61.21", "pigmentary glaucoma", "الجلوكوما الصباغية",
      "Open-angle glaucoma from iris-pigment dispersion clogging the trabecular meshwork; typically affects young myopes.",
      "جلوكوما مفتوحة الزاوية من تشتت صباغ القزحية المُسِدّ للشبكة التربيقية؛ تصيب نموذجياً الشباب قصيري النظر.",
      ["glaucoma"]);
    await this.add(q, "9C61.29", "traumatic (post-trauma) glaucoma", "الجلوكوما الرضحية",
      "Raised intraocular pressure following ocular trauma (angle recession, hyphaema or lens displacement).",
      "ارتفاع ضغط العين بعد رض العين (تراجع الزاوية أو التحدّم أو إزاحة العدسة).",
      ["glaucoma"]);
    await this.add(q, "9C61.32", "neovascular glaucoma", "الجلوكوما الوعائية الحديثة التكوّن",
      "Aggressive secondary glaucoma from angle neovascularisation, usually after retinal ischaemia (diabetes, vein occlusion).",
      "جلوكوما ثانوية عدوانية من تكوّن أوعية في الزاوية، عادة بعد إقفار شبكي (السكري، انسداد الوريد).",
      ["glaucoma"]);
    await this.add(q, "9C61.40", "primary congenital glaucoma", "الجلوكوما الخلقية الأولية",
      "Developmental glaucoma from trabeculodysgenesis presenting with buphthalmos, epiphora and photophobia; treated by goniotomy/trabeculotomy.",
      "جلوكوما تطورية من خلل تكوّن الزاوية تتظاهر بتضخم المقلة والدماع ورهاب الضوء؛ تُعالَج ببَضع الزاوية.",
      ["glaucoma"]);

    // ── macular degeneration ─────────────────────────────────────────────────────────
    await this.add(q, "9B75.03", "atrophic (dry) late-stage age-related macular degeneration", "الضمور البقعي الجاف (الضموري) المتأخر",
      "Advanced dry AMD with geographic atrophy of the retinal pigment epithelium causing progressive central vision loss.",
      "ضمور بقعي جاف متقدم مع ضمور جغرافي للظهارة الصباغية الشبكية مسبباً فقدان رؤية مركزية تدريجي.",
      ["macular degeneration"]);
    await this.add(q, "9B75.1", "non-traumatic macular hole", "ثقب البقعة غير الرضحي",
      "Full-thickness foveal defect from vitreomacular traction causing central scotoma; repaired by vitrectomy with gas tamponade.",
      "عيب نقري كامل السماكة من شدّ زجاجي بقعي مسبباً عتمة مركزية؛ يُصلَح بقطع الزجاجي ودكّ غازي.",
      ["macular degeneration"]);
    await this.add(q, "9B78.3Y", "epiretinal membrane (macular pucker)", "الغشاء فوق الشبكي (تجعّد البقعة)",
      "Fibrocellular membrane on the inner retinal surface distorting the macula; peeled by vitrectomy when vision is affected.",
      "غشاء ليفي خلوي على السطح الداخلي للشبكية يشوّه البقعة؛ يُقشَّر بقطع الزجاجي عند تأثر الرؤية.",
      ["macular degeneration"]);
    await this.add(q, "9B75.2", "central serous chorioretinopathy", "اعتلال المشيمية والشبكية المصلي المركزي",
      "Serous neurosensory retinal detachment at the macula from RPE leakage; often resolves but may become chronic.",
      "انفصال شبكي عصبي حسي مصلي عند البقعة من تسرب الظهارة الصباغية؛ غالباً يتراجع لكنه قد يصبح مزمناً.",
      ["macular degeneration"]);
    await this.add(q, "9B7Y", "cystoid macular oedema", "الوذمة البقعية الكيسية",
      "Cystic fluid accumulation in the macula (post-surgical, uveitic or vascular) reducing central acuity.",
      "تجمع سوائل كيسي في البقعة (بعد الجراحة أو التهابي أو وعائي) يقلل حدة الرؤية المركزية.",
      ["macular degeneration"]);

    // ── diabetic retinopathy ─────────────────────────────────────────────────────────
    await this.add(q, "9B71.00", "nonproliferative diabetic retinopathy", "اعتلال الشبكية السكري غير التكاثري",
      "Early diabetic retinopathy with microaneurysms, haemorrhages and exudates but no neovascularisation; managed by glycaemic control and screening.",
      "اعتلال شبكية سكري مبكر بأم دم مجهرية ونزوف ونضحات دون تكوّن أوعية؛ يُدار بضبط السكر والفحص الدوري.",
      ["diabetic retinopathy"]);
    await this.add(q, "9B71.01", "proliferative diabetic retinopathy", "اعتلال الشبكية السكري التكاثري",
      "Advanced diabetic retinopathy with retinal neovascularisation risking vitreous haemorrhage and tractional detachment; treated by panretinal photocoagulation/anti-VEGF.",
      "اعتلال شبكية سكري متقدم بتكوّن أوعية شبكية يهدد بنزف زجاجي وانفصال شدّي؛ يُعالَج بالتخثير الضوئي الشامل أو مضادات VEGF.",
      ["diabetic retinopathy"]);
    await this.add(q, "9B71.02", "diabetic macular oedema", "الوذمة البقعية السكرية",
      "Macular thickening from leaking retinal capillaries in diabetes; a leading cause of vision loss, treated with anti-VEGF or laser.",
      "ثخانة بقعية من تسرب الشعيرات الشبكية في السكري؛ سبب رئيسي لفقدان البصر، يُعالَج بمضادات VEGF أو الليزر.",
      ["diabetic retinopathy"]);
    await this.add(q, "9B71.1", "hypertensive retinopathy", "اعتلال الشبكية الارتفاع‑ضغطي",
      "Retinal vascular changes (arteriolar narrowing, haemorrhages, exudates) from systemic hypertension.",
      "تغيرات وعائية شبكية (تضيق الشرينات ونزوف ونضحات) من ارتفاع الضغط الجهازي.",
      ["diabetic retinopathy"]);
    await this.add(q, "9B71.2", "radiation retinopathy", "اعتلال الشبكية الإشعاعي",
      "Delayed occlusive retinal microvasculopathy after radiotherapy to the eye or orbit.",
      "اعتلال وعائي شبكي مجهري انسدادي متأخر بعد المعالجة الإشعاعية للعين أو المحجر.",
      ["diabetic retinopathy"]);
    await this.add(q, "9B71.3", "retinopathy of prematurity", "اعتلال الشبكية الخداجي",
      "Abnormal retinal vascularisation in premature low-birth-weight infants; screened and treated by laser or anti-VEGF to prevent detachment.",
      "تكوّن أوعية شبكي غير طبيعي عند الخدّج منخفضي الوزن؛ يُفحَص ويُعالَج بالليزر أو مضادات VEGF لمنع الانفصال.",
      ["diabetic retinopathy"]);
  }

  public async down(q: QueryRunner): Promise<void> {
    for (const code of [
      "9B10.0Y", "9B10.02", "9B10.20", "9B10.21", "9B10.22", "9B10.2Y", "LA12.1", "9B11.0",
      "9A71&XN74M", "9A71&XN8AY", "1F00.10", "9A77.Z", "9A78.8", "9A78.4", "9A78.0", "9A78.20",
      "9C61.12", "9C61.00", "9C61.01", "9C61.20", "9C61.21", "9C61.29", "9C61.32", "9C61.40",
      "9B75.03", "9B75.1", "9B78.3Y", "9B75.2", "9B7Y",
      "9B71.00", "9B71.01", "9B71.02", "9B71.1", "9B71.2", "9B71.3",
    ]) {
      await this.remove(q, code);
    }
  }
}
