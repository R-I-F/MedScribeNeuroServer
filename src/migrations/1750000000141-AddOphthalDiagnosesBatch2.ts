import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OPHTHAL audit — MIG-D batch 2 of 2: retina, eyelid, orbit, conjunctival/ocular-surface,
 * refractive, strabismus and ocular-trauma diagnoses (37 rows). INSERT ... ON CONFLICT
 * ("icdCode") DO NOTHING, then link department_diagnoses (OPHTHAL) + main_diag_diagnoses
 * (by title). All ICD-11 codes icd11_search-verified (AUDIT_OPHTHAL.md 2D). Resolves the
 * long-open CLAUDE.md amblyopia item: amblyopia = 9D46 (Impairment of binocular functions).
 */
export class AddOphthalDiagnosesBatch2750000000141 implements MigrationInterface {
  name = "AddOphthalDiagnosesBatch2750000000141";

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
    // ── retinal detachment ───────────────────────────────────────────────────────────
    await this.add(q, "9B73.3", "serous (exudative) retinal detachment", "انفصال الشبكية المصلي",
      "Subretinal fluid accumulation without a retinal break, from inflammatory, neoplastic or vascular causes; managed by treating the underlying disease.",
      "تجمع سائل تحت الشبكية دون تمزق شبكي، من أسباب التهابية أو ورمية أو وعائية؛ يُدار بعلاج المرض الكامن.",
      ["retinal detachment"]);
    await this.add(q, "9B73.Y", "tractional retinal detachment", "انفصال الشبكية الشدّي",
      "Retinal detachment from fibrovascular traction (commonly proliferative diabetic retinopathy); repaired by vitrectomy and membrane peeling.",
      "انفصال شبكي من شدّ ليفي وعائي (شائعاً اعتلال الشبكية السكري التكاثري)؛ يُصلَح بقطع الزجاجي وتقشير الأغشية.",
      ["retinal detachment"]);
    await this.add(q, "9B73.4", "retinal break or tear without detachment", "تمزّق الشبكية دون انفصال",
      "Retinal hole or horseshoe tear that may precede rhegmatogenous detachment; treated prophylactically with laser retinopexy.",
      "ثقب شبكي أو تمزق حدوي قد يسبق الانفصال الانشقاقي؛ يُعالَج وقائياً بتثبيت الشبكية بالليزر.",
      ["retinal detachment"]);
    await this.add(q, "9B70", "retinitis pigmentosa", "التهاب الشبكية الصباغي",
      "Inherited progressive rod-cone dystrophy causing night blindness and concentric visual-field loss; supportive management.",
      "حثل وراثي تقدمي للعصي والمخاريط مسبباً العشى الليلي وفقدان الحقل البصري المركزي‑التضيقي؛ علاج داعم.",
      ["retinal detachment"]);
    await this.add(q, "9B78.5", "retinal haemorrhage", "نزيف الشبكية",
      "Bleeding within the retinal layers from vascular, traumatic or systemic causes; investigated to identify the source.",
      "نزف ضمن طبقات الشبكية من أسباب وعائية أو رضحية أو جهازية؛ يُحقَّق فيه لتحديد المصدر.",
      ["retinal detachment"]);

    // ── eyelid pathology ─────────────────────────────────────────────────────────────
    await this.add(q, "9A01.3", "blepharitis", "التهاب الجفن",
      "Chronic inflammation of the eyelid margins (anterior or meibomian); managed with lid hygiene and warm compresses.",
      "التهاب مزمن لحواف الجفن (أمامي أو ميبومي)؛ يُدار بنظافة الجفن والكمادات الدافئة.",
      ["eyelid pathology"]);
    await this.add(q, "9A01.2Z", "hordeolum (stye)", "شحاذ العين (دُمَّل الجفن)",
      "Acute focal abscess of an eyelid gland; usually staphylococcal, treated with warm compresses and occasional incision.",
      "خراج بؤري حاد لإحدى غدد الجفن؛ عادة مكوّري عنقودي، يُعالَج بالكمادات الدافئة وأحياناً بالشق.",
      ["eyelid pathology"]);
    await this.add(q, "9A03.0Z", "blepharoptosis (ptosis)", "تدلّي الجفن",
      "Drooping of the upper eyelid (aponeurotic, myogenic or neurogenic); corrected by levator surgery when visually significant.",
      "تدلّي الجفن العلوي (صفاقي أو عضلي أو عصبي)؛ يُصحَّح بجراحة الرافعة عند التأثير على الرؤية.",
      ["eyelid pathology"]);
    await this.add(q, "9A03.5", "dermatochalasis of eyelid", "ارتخاء جلد الجفن",
      "Age-related redundant eyelid skin and orbicularis laxity causing hooding; treated by blepharoplasty.",
      "زيادة جلد الجفن المرتبطة بالعمر وارتخاء العضلة الدويرية مسبباً تدلّياً؛ يُعالَج برأب الجفن.",
      ["eyelid pathology"]);
    await this.add(q, "9A04.0", "trichiasis", "داء الشعرة (انحراف الرموش)",
      "Misdirected eyelashes abrading the cornea; managed by epilation, electrolysis or lid surgery.",
      "رموش منحرفة الاتجاه تسحج القرنية؛ تُدار بنزع الشعر أو التحليل الكهربائي أو جراحة الجفن.",
      ["eyelid pathology"]);
    await this.add(q, "2C33", "sebaceous carcinoma of eyelid", "سرطان الغدة الدهنية للجفن",
      "Aggressive eyelid malignancy of meibomian/Zeis glands that masquerades as chronic blepharitis or chalazion; needs wide excision.",
      "ورم خبيث عدواني للجفن من غدد ميبوميوس/زايس يتنكر كالتهاب جفن مزمن أو بَردة؛ يحتاج استئصالاً واسعاً.",
      ["eyelid pathology"]);

    // ── orbital pathology ────────────────────────────────────────────────────────────
    await this.add(q, "9A21.0", "orbital cellulitis", "التهاب النسيج الخلوي المحجري",
      "Sight- and life-threatening infection posterior to the orbital septum, usually from sinusitis; needs urgent IV antibiotics and possible drainage.",
      "عدوى مهددة للبصر والحياة خلف الحاجز المحجري، عادة من التهاب الجيوب؛ تحتاج صادات وريدية عاجلة وربما تصريفاً.",
      ["orbital pathology"]);
    await this.add(q, "9A22.Z", "idiopathic orbital inflammation (orbital pseudotumour)", "الالتهاب المحجري مجهول السبب (الورم الكاذب المحجري)",
      "Non-infectious inflammatory orbital mass presenting with painful proptosis; diagnosed by exclusion and responsive to steroids.",
      "كتلة محجرية التهابية غير معدية تتظاهر بجحوظ مؤلم؛ تُشخَّص بالاستبعاد وتستجيب للستيرويدات.",
      ["orbital pathology"]);
    await this.add(q, "9A11.2", "dacryocystitis", "التهاب كيس الدمع",
      "Infection of the lacrimal sac from nasolacrimal-duct obstruction; definitively treated by dacryocystorhinostomy.",
      "عدوى كيس الدمع من انسداد القناة الأنفية الدمعية؛ تُعالَج نهائياً بمفاغرة كيس الدمع بالأنف.",
      ["orbital pathology"]);
    await this.add(q, "2D05.0", "melanoma of choroid (uveal melanoma)", "الورم الميلانيني المشيمي (العنبي)",
      "Commonest primary intraocular malignancy in adults; managed by plaque brachytherapy, proton therapy or enucleation.",
      "أشيع ورم خبيث أولي داخل العين عند البالغين؛ يُدار بالمعالجة الكثبية باللويحة أو علاج البروتون أو استئصال المقلة.",
      ["orbital pathology"]);
    await this.add(q, "2A02.0Y", "optic pathway glioma", "الورم الدبقي للمسار البصري",
      "Low-grade glioma of the optic nerve/chiasm, often in childhood and associated with neurofibromatosis type 1.",
      "ورم دبقي منخفض الدرجة للعصب البصري/التصالب، غالباً في الطفولة ومرتبط بالورام الليفي العصبي النوع الأول.",
      ["orbital pathology"]);
    await this.add(q, "2D04", "malignant neoplasm of orbit", "ورم خبيث في المحجر",
      "Primary or secondary orbital malignancy (e.g. rhabdomyosarcoma, lacrimal-gland carcinoma, metastasis) presenting with proptosis.",
      "ورم محجري خبيث أولي أو ثانوي (مثل الساركوما العضلية المخططة، سرطان الغدة الدمعية، النقائل) يتظاهر بجحوظ.",
      ["orbital pathology"]);

    // ── pterygium → conjunctival & ocular-surface ────────────────────────────────────
    await this.add(q, "9A61.0", "pinguecula", "ظُفَيرة الملتحمة (اللطخة الصفراء)",
      "Benign yellowish conjunctival degeneration from UV exposure; excised only if inflamed or cosmetically troublesome.",
      "تنكس ملتحمي حميد مُصفرّ من التعرض للأشعة فوق البنفسجية؛ يُستأصَل فقط إذا التهب أو سبب إزعاجاً تجميلياً.",
      ["pterygium"]);
    await this.add(q, "9A79", "keratoconjunctivitis sicca (dry eye disease)", "جفاف العين (التهاب القرنية والملتحمة الجاف)",
      "Tear-film deficiency causing ocular surface irritation and visual fluctuation; managed with lubricants and punctal occlusion.",
      "نقص الفيلم الدمعي مسبباً تهيج سطح العين وتذبذب الرؤية؛ يُدار بالمرطبات وإغلاق النقاط الدمعية.",
      ["pterygium"]);
    await this.add(q, "9A61.5", "subconjunctival haemorrhage", "نزف تحت الملتحمة",
      "Self-limiting bleeding beneath the conjunctiva from trauma, Valsalva or anticoagulation; reassurance unless recurrent.",
      "نزف محدود ذاتياً تحت الملتحمة من رض أو مناورة فالسالفا أو مضادات التخثر؛ طمأنة ما لم يتكرر.",
      ["pterygium"]);
    await this.add(q, "9A60.5", "vernal keratoconjunctivitis", "التهاب القرنية والملتحمة الربيعي",
      "Severe chronic allergic ocular-surface disease in children with giant papillae and shield ulcers; common in hot climates.",
      "مرض تحسسي مزمن شديد لسطح العين عند الأطفال مع حليمات عملاقة وقرحات درعية؛ شائع في المناخات الحارة.",
      ["pterygium"]);

    // ── refractive errors ────────────────────────────────────────────────────────────
    await this.add(q, "9D00.3", "presbyopia", "طول النظر الشيخوخي",
      "Age-related loss of accommodative amplitude impairing near vision; corrected with reading addition or presbyopic surgery.",
      "فقدان مرتبط بالعمر لسعة المطابقة يضعف رؤية القرب؛ يُصحَّح بإضافة للقراءة أو جراحة طول النظر الشيخوخي.",
      ["refractive errors"]);
    await this.add(q, "9B76", "degenerative (pathological) high myopia", "قِصَر النظر التنكسي (المرضي)",
      "Progressive high myopia with posterior staphyloma and chorioretinal atrophy risking maculopathy and retinal detachment.",
      "قصر نظر شديد تقدمي مع توسع صلبوي خلفي وضمور مشيمي شبكي يهدد باعتلال البقعة وانفصال الشبكية.",
      ["refractive errors"]);
    await this.add(q, "9D00.4", "anisometropia", "اختلاف الانكسار بين العينين",
      "Significant difference in refractive error between the two eyes; a cause of amblyopia in children.",
      "اختلاف ملحوظ في الخطأ الانكساري بين العينين؛ سبب للغمش عند الأطفال.",
      ["refractive errors"]);
    await this.add(q, "9D01.Z", "disorders of accommodation", "اضطرابات المطابقة (التكيّف البصري)",
      "Insufficiency, paralysis or spasm of accommodation causing blurred near vision and asthenopia.",
      "قصور أو شلل أو تشنج المطابقة مسبباً تشوش رؤية القرب وكلال البصر.",
      ["refractive errors"]);

    // ── strabismus ───────────────────────────────────────────────────────────────────
    await this.add(q, "9C81.2", "sixth (abducens) nerve palsy", "شلل العصب السادس (المُبعِّد)",
      "Lateral-rectus weakness causing incomitant esotropia and horizontal diplopia; investigated for raised ICP or microvascular cause.",
      "ضعف العضلة المستقيمة الوحشية مسبباً حولاً إنسياً غير متوافق وشفعاً أفقياً؛ يُحقَّق فيه لارتفاع الضغط داخل القحف أو سبب وعائي مجهري.",
      ["strabismus"]);
    await this.add(q, "9C81.0Z", "third (oculomotor) nerve palsy", "شلل العصب الثالث (المُحرِّك للعين)",
      "Palsy causing ptosis, a 'down-and-out' eye and diplopia; pupil involvement raises concern for a compressive aneurysm.",
      "شلل يسبب تدلّي الجفن وانحراف العين «للأسفل والخارج» وشفعاً؛ إصابة الحدقة تثير القلق من تمدد وعائي ضاغط.",
      ["strabismus"]);
    await this.add(q, "9C81.1", "fourth (trochlear) nerve palsy", "شلل العصب الرابع (البَكَري)",
      "Superior-oblique weakness causing vertical/torsional diplopia and a compensatory head tilt.",
      "ضعف العضلة المائلة العلوية مسبباً شفعاً عمودياً/التوائياً وإمالة رأس تعويضية.",
      ["strabismus"]);
    await this.add(q, "9C84.Z", "nystagmus", "الرأرأة (تذبذب العين اللاإرادي)",
      "Involuntary rhythmic ocular oscillation, congenital or acquired; reduces vision and may need prism or muscle surgery.",
      "تذبذب عيني إيقاعي لاإرادي، خلقي أو مكتسب؛ يقلل الرؤية وقد يحتاج موشوراً أو جراحة عضلية.",
      ["strabismus"]);
    await this.add(q, "9D46", "amblyopia", "الغَمَش (كسل العين)",
      "Reduced best-corrected vision from abnormal visual development (strabismic, anisometropic or deprivational); treated by occlusion/penalisation in childhood.",
      "نقص أفضل رؤية مصححة من تطور بصري غير طبيعي (حولي أو اختلاف انكسار أو حرماني)؛ يُعالَج بالحجب/التثبيط في الطفولة.",
      ["strabismus"]);

    // ── ocular trauma ────────────────────────────────────────────────────────────────
    await this.add(q, "NA06.84", "penetrating wound of eyeball (open globe)", "جرح نافذ في مقلة العين (الكرة المفتوحة)",
      "Full-thickness laceration of the eye wall; an emergency requiring urgent primary repair and endophthalmitis prophylaxis.",
      "تمزق كامل السماكة لجدار العين؛ طارئ يتطلب إصلاحاً أولياً عاجلاً ووقاية من التهاب باطن المقلة.",
      ["ocular trauma"]);
    await this.add(q, "9A80", "hyphaema (anterior-chamber haemorrhage)", "تَحَدُّم (نزف الحجرة الأمامية)",
      "Blood in the anterior chamber, usually post-traumatic; monitored for rebleeding and pressure rise.",
      "دم في الحجرة الأمامية، عادة بعد رض؛ يُراقَب لإعادة النزف وارتفاع الضغط.",
      ["ocular trauma"]);
    await this.add(q, "NA02.21", "fracture of orbital floor (blowout)", "كسر أرضية المحجر (الكسر الانفجاري)",
      "Blowout fracture from blunt periorbital trauma; may entrap inferior rectus causing diplopia and enophthalmos, repaired surgically.",
      "كسر انفجاري من رض كليل حول المحجر؛ قد يحبس العضلة المستقيمة السفلية مسبباً شفعاً وغؤوراً، يُصلَح جراحياً.",
      ["ocular trauma"]);
    await this.add(q, "NA06.62", "commotio retinae", "ارتجاج الشبكية",
      "Transient retinal opacification after blunt ocular trauma (Berlin oedema); usually resolves but may leave maculopathy.",
      "عتامة شبكية عابرة بعد رض كليل للعين (وذمة برلين)؛ عادة تتراجع لكنها قد تترك اعتلال بقعة.",
      ["ocular trauma"]);
    await this.add(q, "NA06.4&XA4C02", "corneal abrasion injury", "سحجة القرنية الرضحية",
      "Traumatic loss of corneal epithelium causing pain and photophobia; treated with antibiotics and rapid spontaneous healing.",
      "فقدان رضحي لظِهارة القرنية مسبباً ألماً ورهاب ضوء؛ يُعالَج بالصادات ويلتئم تلقائياً بسرعة.",
      ["ocular trauma"]);
    await this.add(q, "NE00", "chemical or thermal burn of cornea or conjunctival sac", "حرق كيميائي أو حراري للقرنية أو كيس الملتحمة",
      "Ocular surface burn (alkali worst) threatening limbal stem cells; an emergency requiring immediate copious irrigation.",
      "حرق سطح العين (القلوي أسوأها) يهدد الخلايا الجذعية للحوف؛ طارئ يتطلب غسلاً غزيراً فورياً.",
      ["ocular trauma"]);
    await this.add(q, "NA06.81", "retained intraocular foreign body", "جسم غريب محتبس داخل العين",
      "Penetrating ocular injury with a retained intraocular foreign body; needs surgical removal and infection/siderosis prophylaxis.",
      "إصابة عينية نافذة مع جسم غريب محتبس داخل العين؛ يحتاج إزالة جراحية ووقاية من العدوى وتشرّب الحديد.",
      ["ocular trauma"]);
  }

  public async down(q: QueryRunner): Promise<void> {
    for (const code of [
      "9B73.3", "9B73.Y", "9B73.4", "9B70", "9B78.5",
      "9A01.3", "9A01.2Z", "9A03.0Z", "9A03.5", "9A04.0", "2C33",
      "9A21.0", "9A22.Z", "9A11.2", "2D05.0", "2A02.0Y", "2D04",
      "9A61.0", "9A79", "9A61.5", "9A60.5",
      "9D00.3", "9B76", "9D00.4", "9D01.Z",
      "9C81.2", "9C81.0Z", "9C81.1", "9C84.Z", "9D46",
      "NA06.84", "9A80", "NA02.21", "NA06.62", "NA06.4&XA4C02", "NE00", "NA06.81",
    ]) {
      await this.remove(q, code);
    }
  }
}
