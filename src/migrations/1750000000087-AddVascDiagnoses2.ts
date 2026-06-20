import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * VASC dept-audit — coverage extension MIG-D batch 2 (37 of 72 new diagnoses).
 * Groups: peripheral artery disease, varicose veins, vascular access, venous
 * thromboembolism. (Aortic/arterial groups are in migration 086.)
 *
 * Same ON CONFLICT-share + orphan-safe down() pattern as migration 086.
 */
export class AddVascDiagnoses21750000000087 implements MigrationInterface {
  private readonly codes: string[] = [
    "4A44.8", "4A44.1", "BD40.Z&XA6Y34", "BD54", "BD53.4Z", "BD40.Y&XA81N7",
    "BD30.20&XA44K1", "BD30.1Y&XA83D6", "DD31.0Y", "BD42.Z", "BD30.00&XA1138",
    "BD40.1", "BD30.10", "BD30.2Y", "BD41.Z", "BD30.0Y&XA38W3",
    "BD74.3Z", "BD74.31", "EF20.2", "BD75.3", "BD74.12&XA76A3", "BD74.30",
    "GB61.4", "QB42", "BD73.1", "BD73.20",
    "BB00.Z", "BD71.0", "BD71.3", "BD70.0", "BD71.1&XA7UV5", "DB98.3", "BB00.0",
    "BD71.2", "BD71.1&XA5WA4", "BD70.1", "BD70.2",
  ];

  private readonly groups: Record<string, string[]> = {
    "peripheral artery disease": [
      "4A44.8", "4A44.1", "BD40.Z&XA6Y34", "BD54", "BD53.4Z", "BD40.Y&XA81N7",
      "BD30.20&XA44K1", "BD30.1Y&XA83D6", "DD31.0Y", "BD42.Z", "BD30.00&XA1138",
      "BD40.1", "BD30.10", "BD30.2Y", "BD41.Z", "BD30.0Y&XA38W3",
    ],
    "varicose veins": ["BD74.3Z", "BD74.31", "EF20.2", "BD75.3", "BD74.12&XA76A3", "BD74.30"],
    "vascular access": ["GB61.4", "QB42", "BD73.1", "BD73.20"],
    "venous thromboembolism": [
      "BB00.Z", "BD71.0", "BD71.3", "BD70.0", "BD71.1&XA7UV5", "DB98.3", "BB00.0",
      "BD71.2", "BD71.1&XA5WA4", "BD70.1", "BD70.2",
    ],
  };

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
      VALUES
        ('4A44.8','thromboangiitis obliterans (Buerger disease)','التهاب الأوعية الخثاري المسد (داء بورغر)','Non-atherosclerotic segmental inflammatory occlusion of small/medium limb arteries in young smokers; causes digital ischaemia and gangrene; smoking cessation is key, sympathectomy/amputation in severe cases.','انسداد التهابي قطعي غير تصلبي للشرايين الصغيرة والمتوسطة في الأطراف لدى المدخنين الشباب؛ يسبب نقص تروية الأصابع والغنغرينة؛ الإقلاع عن التدخين أساسي، مع قطع الودي أو البتر في الحالات الشديدة.'),
        ('4A44.1','Takayasu arteritis','التهاب الشرايين لتاكاياسو','Large-vessel granulomatous arteritis of the aorta and its branches ("pulseless disease") in young women; causes stenoses and aneurysms; managed medically with bypass/angioplasty for critical lesions.','التهاب شرايين حُبيبي للأوعية الكبيرة يصيب الأبهر وفروعه ("الداء عديم النبض") لدى الشابات؛ يسبب تضيقات وأمهات دم؛ يُدار دوائيًا مع المجازة أو رأب الأوعية للآفات الحرجة.'),
        ('BD40.Z&XA6Y34','aortoiliac occlusive disease (Leriche syndrome)','مرض انسداد الأبهر والحرقفي (متلازمة لوريش)','Atherosclerotic occlusion of the distal aorta and iliac arteries; triad of claudication, impotence and absent femoral pulses; treated by aortobifemoral bypass or endovascular stenting.','انسداد تصلبي للأبهر القاصي والشرايين الحرقفية؛ ثلاثي العرج والعنانة وغياب النبض الفخذي؛ يُعالَج بمجازة أبهرية فخذية مزدوجة أو دعامات وعائية داخلية.'),
        ('BD54','diabetic foot ulcer','قرحة القدم السكرية','Neuro-ischaemic ulceration of the diabetic foot, often complicated by infection; managed by debridement, revascularisation, offloading and sometimes amputation.','تقرّح عصبي إقفاري في القدم السكرية، غالبًا ما يتعقّد بالعدوى؛ يُدار بالتنضير وإعادة التوعية وتخفيف الضغط وأحيانًا البتر.'),
        ('BD53.4Z','cholesterol atheroembolism (blue toe syndrome)','الانصمام العصيدي الكوليسترولي (متلازمة إصبع القدم الأزرق)','Showering of cholesterol crystals from a proximal atheromatous plaque, often after intervention; causes painful cyanotic toes with intact pulses; managed by statin and plaque exclusion.','انتثار بلورات الكوليسترول من لويحة عصيدية قريبة، غالبًا بعد التدخل؛ يسبب أصابع قدم مزرقّة مؤلمة مع نبض سليم؛ يُدار بالستاتين وعزل اللويحة.'),
        ('BD40.Y&XA81N7','upper limb atherosclerosis','تصلب شرايين الطرف العلوي','Atherosclerotic stenosis or occlusion of upper-limb arteries causing arm claudication; treated by bypass or endovascular intervention.','تضيق أو انسداد تصلبي لشرايين الطرف العلوي يسبب عرج الذراع؛ يُعالَج بالمجازة أو التدخل الوعائي الداخلي.'),
        ('BD30.20&XA44K1','acute thromboembolic popliteal artery occlusion','انسداد الشريان المأبضي الخثاري الصمي الحاد','Acute embolic/thrombotic occlusion of the popliteal artery causing acute limb ischaemia; managed by embolectomy or thrombolysis.','انسداد صمي/خثاري حاد للشريان المأبضي يسبب نقص تروية حاد بالطرف؛ يُدار باستئصال الصمة أو حل الخثرة.'),
        ('BD30.1Y&XA83D6','acute iliac artery occlusion','انسداد الشريان الحرقفي الحاد','Acute occlusion of the iliac artery causing limb-threatening ischaemia; managed by thrombectomy, thrombolysis or bypass.','انسداد حاد للشريان الحرقفي يسبب نقص تروية يهدد الطرف؛ يُدار باستئصال الخثرة أو حل الخثرة أو المجازة.'),
        ('DD31.0Y','chronic mesenteric ischaemia','نقص التروية المساريقي المزمن','Chronic atherosclerotic mesenteric arterial insufficiency causing postprandial pain and weight loss ("mesenteric angina"); treated by revascularisation.','قصور شرياني مساريقي تصلبي مزمن يسبب ألمًا بعد الأكل وفقدان وزن ("ذبحة مساريقية")؛ يُعالَج بإعادة التوعية.'),
        ('BD42.Z','Raynaud phenomenon','ظاهرة رينو','Episodic digital vasospasm with colour change triggered by cold or stress; primary or secondary to connective-tissue disease; managed medically, with sympathectomy in refractory cases.','تشنج وعائي رقمي نوبي مع تغير اللون يثيره البرد أو التوتر؛ أولي أو ثانوي لمرض النسيج الضام؛ يُدار دوائيًا، مع قطع الودي في الحالات المعنّدة.'),
        ('BD30.00&XA1138','acute thromboembolic brachial artery occlusion','انسداد الشريان العضدي الخثاري الصمي الحاد','Acute embolic occlusion of the brachial artery causing arm ischaemia; managed by embolectomy.','انسداد صمي حاد للشريان العضدي يسبب نقص تروية الذراع؛ يُدار باستئصال الصمة.'),
        ('BD40.1','atherosclerosis of aorta','تصلب الشريان الأبهر','Atheromatous disease of the aorta, a source of atheroembolism and aneurysm; managed by risk-factor control and treatment of complications.','مرض عصيدي في الأبهر، مصدر للانصمام العصيدي وأم الدم؛ يُدار بالتحكم في عوامل الخطر ومعالجة المضاعفات.'),
        ('BD30.10','acute thromboembolic aortoiliac occlusion (saddle embolus)','الانسداد الأبهري الحرقفي الخثاري الصمي الحاد (الصمة السرجية)','Acute saddle embolus at the aortic bifurcation causing bilateral limb ischaemia; surgical emergency requiring embolectomy.','صمة سرجية حادة عند تفرع الأبهر تسبب نقص تروية الطرفين؛ حالة جراحية طارئة تتطلب استئصال الصمة.'),
        ('BD30.2Y','acute lower limb arterial occlusion (femoral/crural)','الانسداد الشرياني الحاد بالطرف السفلي (الفخذي/الساقي)','Acute occlusion of the superficial femoral or crural arteries causing acute limb ischaemia; managed by thrombolysis or bypass.','انسداد حاد للشريان السطحي الفخذي أو الشرايين الساقية يسبب نقص تروية حاد بالطرف؛ يُدار بحل الخثرة أو المجازة.'),
        ('BD41.Z','non-atherosclerotic chronic arterial occlusive disease','مرض انسداد الشرايين المزمن غير التصلبي','Chronic arterial occlusion from non-atherosclerotic causes (vasculitis, radiation, entrapment); managed by treating the underlying cause and revascularisation.','انسداد شرياني مزمن من أسباب غير تصلبية (التهاب الأوعية، الإشعاع، الانحباس)؛ يُدار بمعالجة السبب الكامن وإعادة التوعية.'),
        ('BD30.0Y&XA38W3','acute axillary artery occlusion','انسداد الشريان الإبطي الحاد','Acute occlusion of the axillary artery causing upper-limb ischaemia; managed by embolectomy or bypass.','انسداد حاد للشريان الإبطي يسبب نقص تروية الطرف العلوي؛ يُدار باستئصال الصمة أو المجازة.'),
        ('BD74.3Z','venous leg ulcer','قرحة الساق الوريدية','Chronic ulcer of the gaiter area from venous hypertension; managed by compression, venous intervention and wound care.','قرحة مزمنة في منطقة الساق السفلية ناجمة عن ارتفاع الضغط الوريدي؛ تُدار بالضغط والتدخل الوريدي والعناية بالجرح.'),
        ('BD74.31','recurrent venous leg ulcer','قرحة الساق الوريدية الناكسة','Venous leg ulcer that recurs after healing, reflecting uncorrected venous hypertension; requires reassessment of reflux/obstruction.','قرحة ساق وريدية تعاود الظهور بعد الالتئام، تعكس ارتفاع ضغط وريدي غير مُصحَّح؛ تتطلب إعادة تقييم الارتجاع أو الانسداد.'),
        ('EF20.2','lower limb venous telangiectases (spider veins)','توسع الشعيرات الوريدية بالطرف السفلي (الأوردة العنكبوتية)','Intradermal venous flares and reticular veins of the leg; mainly cosmetic, treated by sclerotherapy or laser.','توهجات وريدية داخل الأدمة وأوردة شبكية في الساق؛ تجميلية بشكل أساسي، تُعالَج بالعلاج بالتصليب أو الليزر.'),
        ('BD75.3','pelvic varices (pelvic congestion syndrome)','دوالي الحوض (متلازمة احتقان الحوض)','Dilated pelvic veins causing chronic pelvic pain and vulvar/limb varices; treated by ovarian/pelvic vein embolisation.','أوردة حوضية متوسعة تسبب ألمًا حوضيًا مزمنًا ودوالي بالفرج والطرف؛ تُعالَج بإصمام الوريد المبيضي أو الحوضي.'),
        ('BD74.12&XA76A3','varicose veins with reflux','الدوالي مع الارتجاع','Lower-limb varicose veins with saphenous/non-truncal reflux; treated by thermal ablation, foam sclerotherapy or stripping.','دوالي الطرف السفلي مع ارتجاع صافني أو غير جذعي؛ تُعالَج بالاجتثاث الحراري أو التصليب الرغوي أو السلخ.'),
        ('BD74.30','primary venous leg ulcer','قرحة الساق الوريدية الأولية','First-presentation venous leg ulcer due to superficial/deep venous reflux; managed by compression and correction of reflux.','قرحة ساق وريدية لأول مرة بسبب ارتجاع وريدي سطحي أو عميق؛ تُدار بالضغط وتصحيح الارتجاع.'),
        ('GB61.4','chronic kidney disease, stage 4','مرض الكلى المزمن، المرحلة الرابعة','Severe CKD (GFR 15–29) approaching dialysis; timing for permanent vascular access creation.','مرض كلى مزمن شديد (الترشيح الكبيبي 15–29) يقترب من الديلزة؛ توقيت إنشاء وصول وعائي دائم.'),
        ('QB42','dependence on renal dialysis (vascular access)','الاعتماد على الديلزة الكلوية (الوصول الوعائي)','Established dialysis dependence requiring functioning vascular access (AV fistula/graft); covers access maturation and surveillance.','اعتماد ثابت على الديلزة يتطلب وصولًا وعائيًا فعّالًا (ناسور أو طعم شرياني وريدي)؛ يشمل نضج الوصول ومراقبته.'),
        ('BD73.1','acquired superior vena cava / central vein stenosis','تضيق الوريد الأجوف العلوي / الوريد المركزي المكتسب','Central venous (SVC) stenosis or obstruction, often after catheters/pacemakers, compromising dialysis access; treated by angioplasty/stenting.','تضيق أو انسداد الوريد المركزي (الأجوف العلوي)، غالبًا بعد القساطر أو الناظمات، يعيق الوصول للديلزة؛ يُعالَج برأب الأوعية والدعامة.'),
        ('BD73.20','obstruction of peripheral vein (access stenosis)','انسداد الوريد الطرفي (تضيق الوصول)','Stenosis/obstruction of a peripheral vein compromising AV access outflow; treated by angioplasty or surgical revision.','تضيق أو انسداد وريد طرفي يعيق تدفق الوصول الشرياني الوريدي؛ يُعالَج برأب الأوعية أو المراجعة الجراحية.'),
        ('BB00.Z','pulmonary embolism','الانصمام الرئوي','Obstruction of the pulmonary arteries by thrombus, usually from lower-limb DVT; ranges from asymptomatic to massive PE with shock; managed by anticoagulation, thrombolysis or embolectomy.','انسداد الشرايين الرئوية بخثرة، عادةً من تجلط الأوردة العميقة بالطرف السفلي؛ يتراوح من اللاعرضي إلى الانصمام الكتلي مع الصدمة؛ يُدار بمضادات التخثر أو حل الخثرة أو استئصال الصمة.'),
        ('BD71.0','upper limb deep vein thrombosis','تجلط الأوردة العميقة بالطرف العلوي','DVT of the axillary/subclavian veins (Paget-Schroetter or catheter-related); managed by anticoagulation, thrombolysis or thoracic outlet decompression.','تجلط الأوردة العميقة المحورية/تحت الترقوة (باجيت-شروتر أو متعلق بالقسطرة)؛ يُدار بمضادات التخثر أو حل الخثرة أو تخفيف ضغط المخرج الصدري.'),
        ('BD71.3','iliac vein thrombosis','تجلط الوريد الحرقفي','Thrombosis of the iliac vein (often iliofemoral DVT, may relate to May-Thurner compression); managed by anticoagulation and catheter-directed thrombolysis/stenting.','تجلط الوريد الحرقفي (غالبًا تجلط حرقفي فخذي، قد يرتبط بانضغاط ماي-ثيرنر)؛ يُدار بمضادات التخثر وحل الخثرة الموجّه بالقسطرة أو الدعامة.'),
        ('BD70.0','superficial thrombophlebitis of lower limb','التهاب الوريد الخثاري السطحي بالطرف السفلي','Thrombosis and inflammation of a superficial leg vein; risk of extension to the deep system; managed by anti-inflammatories and anticoagulation if near the junction.','تجلط والتهاب وريد سطحي بالساق؛ خطر الامتداد إلى الجملة العميقة؛ يُدار بمضادات الالتهاب ومضادات التخثر عند القرب من الوصل.'),
        ('BD71.1&XA7UV5','inferior vena cava thrombosis','تجلط الوريد الأجوف السفلي','Thrombosis of the inferior vena cava, often extension of iliofemoral DVT or related to filters/tumour; managed by anticoagulation, thrombolysis or thrombectomy.','تجلط الوريد الأجوف السفلي، غالبًا امتداد لتجلط حرقفي فخذي أو متعلق بالمرشحات أو الورم؛ يُدار بمضادات التخثر أو حل الخثرة أو استئصال الخثرة.'),
        ('DB98.3','portal vein thrombosis','تجلط الوريد البابي','Thrombosis of the portal vein causing portal hypertension; associated with cirrhosis, malignancy or thrombophilia; managed by anticoagulation.','تجلط الوريد البابي يسبب ارتفاع ضغط الدم البابي؛ يرتبط بالتشمع أو الورم الخبيث أو أهبة التخثر؛ يُدار بمضادات التخثر.'),
        ('BB00.0','acute pulmonary thromboembolism','الانصمام الخثاري الرئوي الحاد','Acute PE from venous thromboembolism; risk-stratified by haemodynamic status; managed by anticoagulation, thrombolysis or embolectomy.','انصمام رئوي حاد ناجم عن الجلطة الوريدية؛ يُصنَّف الخطر حسب الحالة الديناميكية الدموية؛ يُدار بمضادات التخثر أو حل الخثرة أو استئصال الصمة.'),
        ('BD71.2','renal vein thrombosis','تجلط الوريد الكلوي','Thrombosis of the renal vein (nephrotic syndrome, tumour or trauma); may cause flank pain and renal impairment; managed by anticoagulation.','تجلط الوريد الكلوي (المتلازمة الكلائية أو الورم أو الرض)؛ قد يسبب ألمًا خاصرياً وقصورًا كلويًا؛ يُدار بمضادات التخثر.'),
        ('BD71.1&XA5WA4','superior vena cava thrombosis','تجلط الوريد الأجوف العلوي','Thrombosis of the superior vena cava, often catheter- or malignancy-related, causing SVC syndrome; managed by anticoagulation, thrombolysis or stenting.','تجلط الوريد الأجوف العلوي، غالبًا متعلق بالقسطرة أو الورم الخبيث، يسبب متلازمة الأجوف العلوي؛ يُدار بمضادات التخثر أو حل الخثرة أو الدعامة.'),
        ('BD70.1','superficial thrombophlebitis of upper limb','التهاب الوريد الخثاري السطحي بالطرف العلوي','Thrombophlebitis of superficial upper-limb veins, often infusion/cannula-related; managed conservatively.','التهاب وريد خثاري في الأوردة السطحية للطرف العلوي، غالبًا متعلق بالتسريب أو القنية؛ يُدار بشكل محافظ.'),
        ('BD70.2','thrombophlebitis migrans (Trousseau syndrome)','التهاب الوريد الخثاري المهاجر (متلازمة تروسو)','Recurrent migratory superficial thrombophlebitis, a marker of occult malignancy or vasculitis; warrants underlying-cause work-up.','التهاب وريد خثاري سطحي مهاجر متكرر، علامة على ورم خبيث خفي أو التهاب أوعية؛ يستلزم استقصاء السبب الكامن.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept JOIN "diagnoses" d ON d."icdCode" = ANY($1)
       WHERE dept.code = 'VASC' ON CONFLICT DO NOTHING`,
      [this.codes],
    );

    for (const [title, codes] of Object.entries(this.groups)) {
      await queryRunner.query(
        `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
         SELECT md.id, d.id FROM "main_diags" md
         JOIN "departments" dept ON md."departmentId" = dept.id
         JOIN "diagnoses" d ON d."icdCode" = ANY($2)
         WHERE dept.code = 'VASC' AND md.title = $1 ON CONFLICT DO NOTHING`,
        [title, codes],
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DELETE FROM "main_diag_diagnoses"
       WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))
         AND "mainDiagId" IN (
           SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
           WHERE dept.code = 'VASC')`,
      [this.codes],
    );
    await queryRunner.query(
      `DELETE FROM "department_diagnoses"
       WHERE "departmentId" = (SELECT id FROM "departments" WHERE code = 'VASC')
         AND "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))`,
      [this.codes],
    );
    await queryRunner.query(
      `DELETE FROM "diagnoses"
       WHERE "icdCode" = ANY($1)
         AND id NOT IN (SELECT "diagnosisId" FROM "department_diagnoses")`,
      [this.codes],
    );
  }
}
