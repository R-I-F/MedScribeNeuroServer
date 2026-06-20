import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PRS coverage extension — batch 2 of 2 (33 diagnoses).
 * Categories: hand trauma, nerve injuries, pressure ulcers, scar revision,
 * traumatic lacerations & avulsions, tumor reconstruction.
 *
 * All ICD-11 codes verified via icd11_search (WHO ICD-11 2024-01). Shared codes
 * are skipped by ON CONFLICT and simply linked to PRS.
 */
export class AddPrsDiagnosesBatch21750000000081 implements MigrationInterface {
  name = "AddPrsDiagnosesBatch21750000000081";

  private static readonly CODES = [
    // hand trauma
    "NC57.3Z", "NC53.3Z", "NC53.6Z", "NC50", "NC59.0Z", "NC59.2Z", "NC53.2",
    // nerve injuries
    "NC34.0", "NC34.1", "NC34.2", "NC55.Z", "8B88.0", "8C10.0", "8C10.1", "8C11.5",
    // pressure ulcers
    "EH90.1", "EH90.2", "EH90.3", "BD74.3Z",
    // scar revision
    "EE40.2", "EL50.0",
    // traumatic lacerations & avulsions
    "1B71.0", "1B71.1", "1C16", "NA01.Z", "NC91.Z", "MC85", "ND56.8",
    // tumor reconstruction
    "2B53.Y", "2F20.20", "2F20.2Z", "2F26", "2E64.0Z",
  ];

  private async linkMain(runner: QueryRunner, mainDiag: string, codes: string[]): Promise<void> {
    await runner.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md
       JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'PRS' AND md.title = $1 AND d."icdCode" = ANY($2)
       ON CONFLICT DO NOTHING`,
      [mainDiag, codes]
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      ('NC57.3Z','injury of extensor tendon of finger','إصابة الوتر الباسط للإصبع','Laceration or rupture of a finger extensor tendon at wrist or hand level causing an extension lag; repaired primarily by tendon suture with early controlled mobilisation.','تمزق أو قطع وتر باسط للإصبع على مستوى الرسغ أو اليد يسبب تأخر البسط؛ يُصلَح أولياً بخياطة الوتر مع تحريك مبكر مضبوط.'),
      ('NC53.3Z','fracture of metacarpal bone','كسر عظم مشط اليد','Fracture of a metacarpal shaft, neck or base; angulated or rotated fractures impair grip and are treated by reduction and fixation with K-wires or plates.','كسر جدل أو عنق أو قاعدة عظم مشط اليد؛ تُضعف الكسور المنزاحة زاوياً أو دورانياً القبضة وتُعالَج بالرد والتثبيت بأسلاك كيرشنر أو صفائح.'),
      ('NC53.6Z','fracture of phalanx of finger','كسر سلامية الإصبع','Fracture of a proximal, middle or distal phalanx; displaced or intra-articular fractures need reduction and fixation to preserve finger alignment and motion.','كسر سلامية قريبة أو وسطى أو قاصية؛ تحتاج الكسور المنزاحة أو داخل المفصل إلى رد وتثبيت للحفاظ على محاذاة الإصبع وحركته.'),
      ('NC50','injury to fingernail (nail bed)','إصابة ظفر الإصبع (سرير الظفر)','Nail-bed laceration or subungual haematoma, often with a distal phalanx fracture; nail-bed repair restores a smooth nail and prevents deformity.','تمزق سرير الظفر أو ورم دموي تحت الظفر، وغالباً مع كسر السلامية القاصية؛ يستعيد إصلاح سرير الظفر ظفراً أملس ويمنع التشوه.'),
      ('NC59.0Z','traumatic amputation of thumb','البتر الرضحي للإبهام','Traumatic loss of the thumb severely impairing pinch and opposition; managed by replantation when feasible or thumb reconstruction such as toe-to-thumb transfer.','فقد رضحي للإبهام يُضعف القرص والمقابلة بشدة؛ يُدار بإعادة الزرع عند الإمكان أو إعادة بناء الإبهام كنقل إصبع القدم إلى الإبهام.'),
      ('NC59.2Z','traumatic amputation of two or more fingers','البتر الرضحي لإصبعين أو أكثر','Traumatic amputation of multiple fingers from crush or sharp injury; replantation, ray amputation or reconstruction is chosen by level, mechanism and hand demands.','بتر رضحي لعدة أصابع نتيجة إصابة سحقية أو حادة؛ يُختار إعادة الزرع أو بتر الشعاع أو الترميم حسب المستوى والآلية ومتطلبات اليد.'),
      ('NC53.2','fracture of first metacarpal (Bennett)','كسر المشط الأول (كسر بينيت)','Fracture at the base of the thumb metacarpal, including intra-articular Bennett and Rolando patterns; unstable fractures need closed or open reduction and fixation.','كسر في قاعدة مشط الإبهام، ويشمل نمطي بينيت ورولاندو داخل المفصل؛ تحتاج الكسور غير المستقرة إلى رد مغلق أو مفتوح وتثبيت.'),

      ('NC34.0','injury of ulnar nerve at forearm level','إصابة العصب الزندي على مستوى الساعد','Laceration or traction injury of the ulnar nerve causing intrinsic hand weakness and clawing; repaired by direct coaptation or nerve grafting with possible tendon transfers.','تمزق أو إصابة شدّية للعصب الزندي تسبب ضعف عضلات اليد الداخلية والتخلّب؛ يُصلَح بالمفاغرة المباشرة أو الطعم العصبي مع نقل أوتار محتمل.'),
      ('NC34.1','injury of median nerve at forearm level','إصابة العصب المتوسط على مستوى الساعد','Median nerve laceration causing loss of thumb opposition and a sensory deficit; repaired by epineurial suture or grafting, sometimes with opponensplasty.','تمزق العصب المتوسط يسبب فقد مقابلة الإبهام وعجزاً حسياً؛ يُصلَح بخياطة فوق العصب أو الطعم، وأحياناً مع رأب المقابلة.'),
      ('NC34.2','injury of radial nerve','إصابة العصب الكعبري','Radial nerve injury, often with a humeral fracture, causing wrist and finger drop; managed by repair or grafting or by tendon transfers to restore extension.','إصابة العصب الكعبري، غالباً مع كسر العضد، تسبب تدلي الرسغ والأصابع؛ تُدار بالإصلاح أو الطعم أو نقل الأوتار لاستعادة البسط.'),
      ('NC55.Z','injury of nerve at wrist or hand level (digital nerve)','إصابة عصب على مستوى الرسغ أو اليد (العصب الرقمي)','Laceration of a digital or hand nerve causing fingertip numbness; microsurgical repair or nerve grafting restores protective sensation.','تمزق عصب رقمي أو يدوي يسبب خدر طرف الإصبع؛ يستعيد الإصلاح الجراحي المجهري أو الطعم العصبي الإحساس الواقي.'),
      ('8B88.0','facial nerve palsy','شلل العصب الوجهي','Paralysis of facial musculature from facial-nerve injury or dysfunction causing facial asymmetry and incomplete eye closure; managed by nerve repair or grafting or facial reanimation with free muscle transfer or static slings.','شلل عضلات الوجه نتيجة إصابة العصب الوجهي أو خلله يسبب لا تناظر الوجه وعدم اكتمال إغلاق العين؛ يُدار بإصلاح العصب أو طعمه أو إعادة تحريك الوجه بنقل عضلة حرة أو معلاقات ساكنة.'),
      ('8C10.0','carpal tunnel syndrome','متلازمة النفق الرسغي','Median nerve compression at the wrist causing nocturnal hand paraesthesia and thenar weakness; treated by surgical carpal-tunnel release when conservative care fails.','انضغاط العصب المتوسط عند الرسغ يسبب مذلاً ليلياً في اليد وضعف الإبهام؛ يُعالَج بالتحرير الجراحي للنفق الرسغي عند فشل العلاج المحافظ.'),
      ('8C10.1','ulnar nerve entrapment (cubital tunnel)','انحصار العصب الزندي (النفق المرفقي)','Ulnar nerve compression at the elbow causing little-finger numbness and grip weakness; treated by in-situ decompression or anterior transposition.','انضغاط العصب الزندي عند المرفق يسبب خدر الخنصر وضعف القبضة؛ يُعالَج بفك الانضغاط في الموضع أو النقل الأمامي.'),
      ('8C11.5','tarsal tunnel syndrome','متلازمة النفق الرصغي','Posterior tibial nerve compression behind the medial malleolus causing burning sole pain and numbness; treated by tarsal-tunnel release when conservative measures fail.','انضغاط العصب الظنبوبي الخلفي خلف الكعب الإنسي يسبب ألماً حارقاً في أخمص القدم وخدراً؛ يُعالَج بتحرير النفق الرصغي عند فشل التدابير المحافظة.'),

      ('EH90.1','pressure ulcer grade 2','قرحة الضغط من الدرجة الثانية','Partial-thickness pressure ulcer with an open blister or shallow erosion; managed by pressure offloading, moist dressings and nutrition; rarely needs surgery.','قرحة ضغط جزئية السماكة مع فقاعة مفتوحة أو سحجة سطحية؛ تُدار بتخفيف الضغط والضمادات الرطبة والتغذية؛ نادراً ما تحتاج جراحة.'),
      ('EH90.2','pressure ulcer grade 3','قرحة الضغط من الدرجة الثالثة','Full-thickness pressure ulcer with exposed subcutaneous fat but no bone or muscle; managed by debridement and, for large defects, flap reconstruction.','قرحة ضغط كاملة السماكة مع انكشاف الشحم تحت الجلد دون عظم أو عضل؛ تُدار بالتنضير، وللعيوب الكبيرة بالترميم بشريحة.'),
      ('EH90.3','pressure ulcer grade 4','قرحة الضغط من الدرجة الرابعة','Deep pressure ulcer exposing muscle, tendon or bone, often with osteomyelitis; managed by radical debridement, ostectomy and regional flap coverage such as gluteal or hamstring flaps.','قرحة ضغط عميقة تكشف العضل أو الوتر أو العظم، وغالباً مع التهاب العظم والنقي؛ تُدار بالتنضير الجذري واستئصال العظم والتغطية بشريحة موضعية كشرائح الألوية أو أوتار الركبة.'),
      ('BD74.3Z','venous leg ulcer','قرحة الساق الوريدية','Chronic lower-limb ulcer from venous hypertension, typically at the gaiter area; managed by compression, debridement and skin grafting of clean granulating wounds.','قرحة مزمنة في الطرف السفلي ناجمة عن ارتفاع الضغط الوريدي، عادةً في منطقة الجزمة؛ تُدار بالضغط والتنضير والتطعيم الجلدي للجروح المحببة النظيفة.'),

      ('EE40.2','atrophic scarring of skin','التندّب الضموري للجلد','Depressed, atrophic cutaneous scar from acne or trauma with dermal collagen loss; improved by subcision, resurfacing, filler or excision.','ندبة جلدية ضامرة منخفضة ناجمة عن العد أو الرض مع فقد كولاجين الأدمة؛ تتحسّن بالتسليخ تحت الجلد أو إعادة التسطيح أو الحشو أو الاستئصال.'),
      ('EL50.0','keloidal surgical scar','ندبة جراحية جدرانية','Keloid formation along a surgical incision extending beyond its margins; managed by intralesional steroid, excision with adjuvant therapy, or radiotherapy to limit recurrence.','تكوّن جدرة على طول شق جراحي يمتد خارج حوافه؛ يُدار بالستيرويد داخل الآفة أو الاستئصال مع علاج مساعد أو معالجة شعاعية للحد من النكس.'),

      ('1B71.0','streptococcal necrotising fasciitis','التهاب اللفافة الناخر بالعقديات','Type 2 necrotising fasciitis from group A streptococcus with rapid fascial necrosis and toxaemia; a surgical emergency requiring aggressive debridement and antibiotics.','التهاب لفافة ناخر من النمط الثاني بالعقديات من الزمرة A مع نخر لفافي سريع وتسمم دموي؛ حالة جراحية إسعافية تستلزم تنضيراً واسعاً ومضادات حيوية.'),
      ('1B71.1','polymicrobial necrotising fasciitis','التهاب اللفافة الناخر متعدد الجراثيم','Type 1 mixed aerobic-anaerobic necrotising fasciitis, including Fournier gangrene, common in diabetics; treated by emergent radical debridement and broad-spectrum antibiotics.','التهاب لفافة ناخر مختلط هوائي لاهوائي من النمط الأول، يشمل غنغرينة فورنييه، شائع لدى السكريين؛ يُعالَج بتنضير جذري إسعافي ومضادات حيوية واسعة الطيف.'),
      ('1C16','gas gangrene (clostridial myonecrosis)','الغنغرينة الغازية (نخر العضل بالمطثيات)','Clostridial myonecrosis producing crepitant muscle necrosis and systemic toxicity after contaminated wounds; treated by emergent debridement or amputation, penicillin and hyperbaric oxygen.','نخر عضلي بالمطثيات يُحدث نخراً عضلياً مفرقعاً وتسمماً جهازياً بعد الجروح الملوثة؛ يُعالَج بالتنضير أو البتر الإسعافي والبنسلين والأكسجين عالي الضغط.'),
      ('NA01.Z','open wound of head (scalp or face)','جرح مفتوح في الرأس (فروة الرأس أو الوجه)','Laceration or avulsion of the scalp or face; managed by meticulous layered closure, and by flaps or grafts for tissue loss or exposed bone.','تمزق أو انتزاع في فروة الرأس أو الوجه؛ يُدار بإغلاق طبقي دقيق، وبالشرائح أو الطعوم عند فقد النسيج أو انكشاف العظم.'),
      ('NC91.Z','open wound of knee or lower leg','جرح مفتوح في الركبة أو الساق','Open wound of the lower leg, often with an open tibial fracture and soft-tissue loss; managed by debridement and flap coverage to achieve durable soft-tissue closure.','جرح مفتوح في الساق، وغالباً مع كسر ظنبوبي مفتوح وفقد نسيج رخو؛ يُدار بالتنضير والتغطية بشريحة لتحقيق إغلاق نسيجي رخو متين.'),
      ('MC85','gangrene','الغنغرينة','Tissue necrosis from ischaemia or infection (dry or wet gangrene), commonly of digits or extremities; managed by revascularisation where possible, debridement or amputation, and reconstruction.','نخر نسيجي ناجم عن الإقفار أو العدوى (غنغرينة جافة أو رطبة)، شائع في الأصابع أو الأطراف؛ يُدار بإعادة التوعية عند الإمكان والتنضير أو البتر والترميم.'),
      ('ND56.8','traumatic amputation or avulsion of body region','البتر أو الانتزاع الرضحي لمنطقة من الجسم','Traumatic amputation or avulsion of a body part of unspecified site, including degloving injuries; managed by debridement, replantation when feasible, or stump and flap reconstruction.','بتر أو انتزاع رضحي لجزء من الجسم في موضع غير محدد، يشمل إصابات السلخ؛ يُدار بالتنضير وإعادة الزرع عند الإمكان أو ترميم الجذمور أو بشريحة.'),

      ('2B53.Y','dermatofibrosarcoma protuberans','الساركومة الليفية الجلدية البارزة','Locally aggressive cutaneous fibroblastic sarcoma with finger-like subclinical spread; treated by wide local or Mohs excision and reconstruction of the resulting defect.','ساركومة ليفية جلدية عدوانية موضعياً مع امتداد تحت سريري إصبعي الشكل؛ تُعالَج بالاستئصال الواسع الموضعي أو استئصال موس وترميم العيب الناتج.'),
      ('2F20.20','giant congenital melanocytic naevus','الوحمة الميلانينية الخلقية العملاقة','Large congenital pigmented naevus with a risk of melanoma transformation; managed by staged excision with tissue expansion, grafts or flaps.','وحمة مصطبغة خلقية كبيرة مع خطر التحول إلى ميلانوما؛ تُدار بالاستئصال المرحلي مع توسيع النسيج أو الطعوم أو الشرائح.'),
      ('2F20.2Z','congenital melanocytic naevus','الوحمة الميلانينية الخلقية','Small or medium congenital melanocytic naevus; excised for cosmesis or melanoma-risk reduction with primary closure or grafting.','وحمة ميلانينية خلقية صغيرة أو متوسطة؛ تُستأصل لأسباب تجميلية أو للحد من خطر الميلانوما مع إغلاق أولي أو طعم.'),
      ('2F26','pyogenic granuloma (lobular capillary haemangioma)','الورم الحبيبي القيحي (الورم الوعائي الشعري الفصيصي)','Benign, rapidly growing, friable vascular nodule that bleeds easily, often after minor trauma; treated by excision or curettage with cautery.','عقيدة وعائية حميدة سريعة النمو هشّة تنزف بسهولة، وغالباً بعد رض بسيط؛ تُعالَج بالاستئصال أو الكشط مع الكي.'),
      ('2E64.0Z','squamous cell carcinoma in situ (Bowen disease)','السرطانة الحرشفية الموضعة (داء بوين)','Intraepidermal squamous cell carcinoma presenting as a scaly erythematous plaque; treated by excision, topical therapy or curettage before invasive transformation.','سرطانة حرشفية داخل البشرة تتظاهر بلويحة حمامية متقشرة؛ تُعالَج بالاستئصال أو العلاج الموضعي أو الكشط قبل التحول الغازي.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'PRS' AND d."icdCode" = ANY($1)
       ON CONFLICT DO NOTHING`,
      [AddPrsDiagnosesBatch21750000000081.CODES]
    );

    await this.linkMain(queryRunner, "hand trauma", ["NC57.3Z", "NC53.3Z", "NC53.6Z", "NC50", "NC59.0Z", "NC59.2Z", "NC53.2"]);
    await this.linkMain(queryRunner, "nerve injuries", ["NC34.0", "NC34.1", "NC34.2", "NC55.Z", "8B88.0", "8C10.0", "8C10.1", "8C11.5"]);
    await this.linkMain(queryRunner, "pressure ulcers", ["EH90.1", "EH90.2", "EH90.3", "BD74.3Z"]);
    await this.linkMain(queryRunner, "scar revision", ["EE40.2", "EL50.0"]);
    await this.linkMain(queryRunner, "traumatic lacerations & avulsions", ["1B71.0", "1B71.1", "1C16", "NA01.Z", "NC91.Z", "MC85", "ND56.8"]);
    await this.linkMain(queryRunner, "tumor reconstruction", ["2B53.Y", "2F20.20", "2F20.2Z", "2F26", "2E64.0Z"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddPrsDiagnosesBatch21750000000081.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))
      AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id WHERE dept.code = 'PRS')`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))
      AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'PRS')`, [codes]);
    await queryRunner.query(`DELETE FROM "diagnoses" WHERE "icdCode" = ANY($1) AND id NOT IN (SELECT "diagnosisId" FROM "department_diagnoses")`, [codes]);
  }
}
