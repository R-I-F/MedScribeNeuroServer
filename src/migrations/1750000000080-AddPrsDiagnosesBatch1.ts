import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PRS coverage extension — batch 1 of 2 (37 diagnoses).
 * Categories: aesthetic surgery, breast reconstruction, burn injuries,
 * cleft lip & palate, congenital anomalies, contractures.
 *
 * All ICD-11 codes verified via icd11_search (WHO ICD-11 2024-01). Codes already
 * present in the shared table (e.g. shared breast/skin entities) are skipped by
 * ON CONFLICT and simply linked to PRS.
 */
export class AddPrsDiagnosesBatch11750000000080 implements MigrationInterface {
  name = "AddPrsDiagnosesBatch11750000000080";

  private static readonly CODES = [
    // aesthetic surgery
    "9A03.5", "ME66.2", "5B80.1", "EJ20.0", "9A03.0Z",
    // breast reconstruction
    "LB73.10", "PK9B.2", "2E65.2", "BE1B.0",
    // burn injuries
    "NE40", "NE10", "NE11", "NE01", "ND95.3", "ND91.3", "NF08.4", "NE2Z", "ND90.3",
    // cleft lip & palate
    "LA40.0", "LA40.1", "LA42.0", "LA42.1", "LA50",
    // congenital anomalies
    "LA21.Z", "LC50.1", "2E81.2Z", "LB99.2", "LD26.5", "LB99.7", "LB78.0", "LB99.3",
    // contractures
    "FB40.Y", "NF0A.6", "FA34.3", "FB51.Y", "FB32.4", "FA31.6",
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
      ('9A03.5','dermatochalasis of eyelid','تراخي جلد الجفن','Redundant, lax upper- or lower-eyelid skin from ageing or actinic damage; may obstruct the superior visual field; corrected by blepharoplasty.','جلد جفن علوي أو سفلي زائد ومترهل بسبب الشيخوخة أو الأذية الشمسية؛ قد يحجب المجال البصري العلوي؛ يُصحَّح برأب الجفن.'),
      ('ME66.2','excess and redundant skin','جلد زائد ومترهل','Excess, redundant skin and subcutaneous tissue, commonly of the abdomen, arms or thighs after major weight loss; treated by body-contouring procedures such as abdominoplasty or brachioplasty.','جلد ونسيج تحت جلدي زائد ومترهل، شائع في البطن أو الذراعين أو الفخذين بعد فقدان وزن كبير؛ يُعالَج بإجراءات نحت الجسم كرأب البطن أو رأب العضد.'),
      ('5B80.1','localised adiposity','تراكم شحمي موضعي','Localised accumulation of subcutaneous fat resistant to diet, producing a disproportionate body contour; addressed by liposuction or excisional lipectomy.','تراكم موضعي للشحم تحت الجلد مقاوم للحمية يُحدث تشوهاً في قوام الجسم؛ يُعالَج بشفط الدهون أو استئصال الشحم.'),
      ('EJ20.0','actinic (solar) elastosis','التنكس المرن الشمسي','Degeneration of dermal elastic fibres from chronic sun exposure, producing thickened, yellowish, wrinkled facial skin; managed with resurfacing, chemical peels or rhytidectomy.','تنكس الألياف المرنة الأدمية نتيجة التعرض المزمن للشمس، يُحدث جلداً وجهياً سميكاً مصفرّاً مجعّداً؛ يُدار بإعادة التسطيح أو التقشير الكيميائي أو شد الوجه.'),
      ('9A03.0Z','blepharoptosis','تدلي الجفن','Drooping of the upper eyelid from levator dysfunction or aponeurotic dehiscence; may impair vision; corrected by ptosis repair such as levator advancement or a frontalis sling.','تدلي الجفن العلوي بسبب خلل العضلة الرافعة أو انفصال صفاقها؛ قد يضعف الرؤية؛ يُصحَّح بإصلاح التدلي كتقديم الرافعة أو معلاق العضلة الجبهية.'),

      ('LB73.10','Poland syndrome','متلازمة بولاند','Congenital absence of the pectoralis major with breast hypoplasia, often with ipsilateral hand anomalies; chest-wall and breast reconstruction with implant, flap or fat grafting.','غياب خلقي للعضلة الصدرية الكبرى مع نقص تنسج الثدي، وغالباً مع تشوهات اليد المماثلة الجانب؛ يُرمَّم جدار الصدر والثدي بزرعة أو شريحة أو تطعيم شحمي.'),
      ('PK9B.2','mechanical complication of breast implant','مضاعفة ميكانيكية لزرعة الثدي','Capsular contracture, rupture, malposition or extrusion of a breast prosthesis after augmentation or reconstruction; managed by capsulectomy and implant exchange or removal.','تقفع المحفظة أو تمزق أو سوء موضع أو انبثاق زرعة الثدي بعد التكبير أو الترميم؛ يُعالَج باستئصال المحفظة وتبديل الزرعة أو إزالتها.'),
      ('2E65.2','ductal carcinoma in situ of breast','السرطانة القنوية الموضعة للثدي','Non-invasive malignant proliferation confined to the breast ducts; a frequent indication for breast-conserving surgery or mastectomy with immediate reconstruction.','تكاثر خبيث غير غازٍ محصور في قنوات الثدي؛ استطباب شائع للجراحة المحافظة على الثدي أو استئصال الثدي مع ترميم فوري.'),
      ('BE1B.0','postmastectomy lymphoedema','الوذمة اللمفية بعد استئصال الثدي','Chronic upper-limb lymphoedema following axillary dissection or radiotherapy for breast cancer; managed conservatively and, in selected cases, by lymphovenous anastomosis or vascularised lymph-node transfer.','وذمة لمفية مزمنة في الطرف العلوي بعد تجريف الإبط أو المعالجة الشعاعية لسرطان الثدي؛ تُدار محافظةً وفي حالات منتقاة بمفاغرة لمفية وريدية أو نقل عقدة لمفية موعّاة.'),

      ('NE40','superficial frostbite','عضة الصقيع السطحية','First- or second-degree frostbite with reversible skin freezing causing numbness, erythema and blistering without tissue loss; treated by rapid rewarming and supportive care.','عضة صقيع من الدرجة الأولى أو الثانية مع تجمد جلدي عكوس يسبب خدراً واحمراراً وفقاعات دون فقد نسيج؛ تُعالَج بإعادة التدفئة السريعة والرعاية الداعمة.'),
      ('NE10','burns of multiple body regions','حروق مناطق متعددة من الجسم','Major burn involving several body regions with a large total body surface area; requires fluid resuscitation, staged excision and grafting, and critical-care support.','حرق كبير يشمل عدة مناطق من الجسم بمساحة سطحية كلية واسعة؛ يستلزم إنعاشاً بالسوائل واستئصالاً وتطعيماً مرحلياً ودعماً بالعناية الحرجة.'),
      ('NE11','burn of unspecified body region','حرق منطقة غير محددة من الجسم','Thermal burn of a single body region of unspecified depth; depth and extent determine wound care, excision and grafting needs.','حرق حراري لمنطقة واحدة من الجسم بعمق غير محدد؛ يحدد العمق والامتداد حاجة العناية بالجرح والاستئصال والتطعيم.'),
      ('NE01','burn of respiratory tract','حرق السبيل التنفسي','Thermal or chemical airway injury from smoke or hot-gas inhalation causing mucosal oedema and airway compromise; warrants early airway protection and may complicate cutaneous burn management.','أذية حرارية أو كيميائية للسبيل الهوائي نتيجة استنشاق الدخان أو الغاز الساخن تسبب وذمة مخاطية وانسداداً هوائياً؛ تستلزم حماية مبكرة للسبيل الهوائي وقد تعقّد معالجة الحرق الجلدي.'),
      ('ND95.3','burn of wrist or hand, full thickness','حرق الرسغ أو اليد كامل السماكة','Full-thickness burn of the hand or wrist threatening function; requires early escharotomy when circumferential, excision and grafting, and intensive hand therapy to prevent contracture.','حرق كامل السماكة لليد أو الرسغ يهدد الوظيفة؛ يستلزم بضع الخشارة المبكر عند الإحاطة، والاستئصال والتطعيم، ومعالجة يد مكثّفة لمنع التقفع.'),
      ('ND91.3','burn of face, full thickness','حرق الوجه كامل السماكة','Full-thickness facial burn with cosmetic and functional consequences; managed with excision and grafting or flaps, and aesthetic-unit reconstruction to limit disfigurement and ectropion.','حرق وجهي كامل السماكة بعواقب تجميلية ووظيفية؛ يُدار بالاستئصال والتطعيم أو الشرائح وترميم الوحدات التجميلية للحد من التشوه وانقلاب الجفن.'),
      ('NF08.4','effects of electric current (electrical burn)','آثار التيار الكهربائي (حرق كهربائي)','Electrical injury producing deep tissue and muscle necrosis disproportionate to surface burns, with risk of compartment syndrome and rhabdomyolysis; managed by fasciotomy, debridement and reconstruction.','إصابة كهربائية تُحدث نخراً عميقاً في النسيج والعضل غير متناسب مع حروق السطح، مع خطر متلازمة الحجرة وانحلال الربيدات؛ تُدار ببضع اللفافة والتنضير والترميم.'),
      ('NE2Z','chemical burn or corrosion','حرق أو تآكل كيميائي','Burn or corrosion from a chemical agent (acid or alkali); alkali causes progressive liquefactive necrosis; treated by copious irrigation, debridement and reconstruction of the resulting defect.','حرق أو تآكل ناجم عن عامل كيميائي (حمض أو قلوي)؛ تسبب القلويات نخراً تمييعياً تقدمياً؛ يُعالَج بالغسل الغزير والتنضير وترميم العيب الناتج.'),
      ('ND90.3','burn of head or neck except face, full thickness','حرق الرأس أو العنق عدا الوجه كامل السماكة','Full-thickness burn of the scalp or neck; neck burns risk contracture limiting movement; managed by excision and grafting, often with later contracture release.','حرق كامل السماكة لفروة الرأس أو العنق؛ تنذر حروق العنق بالتقفع المحدّد للحركة؛ يُدار بالاستئصال والتطعيم وغالباً بتحرير التقفع لاحقاً.'),

      ('LA40.0','cleft lip, unilateral','شق الشفة أحادي الجانب','Unilateral congenital cleft of the upper lip with or without the alveolus; repaired in infancy by rotation-advancement cheiloplasty to restore lip continuity and the nasal sill.','شق خلقي أحادي الجانب في الشفة العلوية مع أو دون السنخ؛ يُصلَح في الرضاعة برأب الشفة بالتدوير والتقديم لاستعادة استمرارية الشفة وعتبة الأنف.'),
      ('LA40.1','cleft lip, bilateral','شق الشفة ثنائي الجانب','Bilateral congenital cleft of the upper lip with a protruding premaxilla and short columella; staged repair restores symmetry, lip height and nasal projection.','شق خلقي ثنائي الجانب في الشفة العلوية مع نتوء الفك الأمامي وقصر العمود الأنفي؛ يستعيد الإصلاح المرحلي التناظر وارتفاع الشفة وبروز الأنف.'),
      ('LA42.0','cleft hard palate','شق الحنك الصلب','Congenital cleft of the bony (hard) palate causing oronasal communication and feeding difficulty; repaired by palatoplasty to separate the oral and nasal cavities.','شق خلقي في الحنك العظمي (الصلب) يسبب اتصالاً فموياً أنفياً وصعوبة في الإطعام؛ يُصلَح برأب الحنك لفصل الجوفين الفموي والأنفي.'),
      ('LA42.1','cleft soft palate','شق الحنك الرخو','Congenital cleft of the soft palate affecting velar function and speech; repaired by palatoplasty with levator veli palatini reconstruction to enable velopharyngeal closure.','شق خلقي في الحنك الرخو يؤثر على وظيفة الشراع والكلام؛ يُصلَح برأب الحنك مع إعادة بناء العضلة الرافعة لشراع الحنك لتمكين الإغلاق البلعومي الحنكي.'),
      ('LA50','congenital velopharyngeal incompetence','قصور بلعومي حنكي خلقي','Inadequate velopharyngeal closure causing hypernasal speech and nasal regurgitation, often after cleft palate; treated by pharyngoplasty or a pharyngeal flap.','إغلاق بلعومي حنكي غير كافٍ يسبب كلاماً أنفياً مفرطاً وقلساً أنفياً، وغالباً بعد شق الحنك؛ يُعالَج برأب البلعوم أو شريحة بلعومية.'),

      ('LA21.Z','minor anomaly of pinna (prominent ear)','تشوه بسيط في صيوان الأذن (الأذن البارزة)','Prominent or deformed external ear from an absent antihelical fold or deep concha; corrected by otoplasty, usually in childhood for psychosocial reasons.','أذن خارجية بارزة أو مشوّهة بسبب غياب الطية المضادة للحلزون أو عمق الصدفة؛ تُصحَّح برأب الأذن، وعادةً في الطفولة لأسباب نفسية اجتماعية.'),
      ('LC50.1','port-wine stain (capillary malformation)','وحمة الميناء (تشوه شعري)','Congenital capillary malformation producing a flat red-purple cutaneous patch that darkens and thickens with age; treated with pulsed-dye laser and surgery for hypertrophic lesions.','تشوه شعري خلقي يُحدث رقعة جلدية مسطحة حمراء أرجوانية تغمق وتسمك مع العمر؛ يُعالَج بليزر الصباغ النابض والجراحة للآفات الضخامية.'),
      ('2E81.2Z','infantile haemangioma','الورم الوعائي الطفلي','Benign vascular tumour of infancy with proliferative then involuting phases; most regress, but ulcerated, obstructing or disfiguring lesions need beta-blockers, laser or excision.','ورم وعائي حميد في الرضاعة بطور تكاثري ثم انحلالي؛ ينحسر معظمها، لكن الآفات المتقرحة أو المسدّة أو المشوّهة تحتاج إلى حاصرات بيتا أو ليزر أو استئصال.'),
      ('LB99.2','radial hemimelia (radial club hand)','نقص الشعاع الكعبري (اليد الحندقوقية الكعبرية)','Longitudinal deficiency of the radius causing radial deviation of the hand and an unstable wrist; managed by stretching and splinting then centralisation and pollicisation.','عوز طولي في الكعبرة يسبب انحراف اليد كعبرياً وعدم ثبات الرسغ؛ يُدار بالتمطيط والتجبير ثم التمركز وإبهام الإصبع.'),
      ('LD26.5','congenital constriction ring (amniotic band)','حلقة الانقباض الخلقية (الشريط السلوي)','Amniotic band constriction encircling a limb or digit, causing distal swelling, deformity or congenital amputation; treated by circumferential band release and Z-plasty.','انقباض شريط سلوي يحيط بطرف أو إصبع، يسبب تورماً قاصياً أو تشوهاً أو بتراً خلقياً؛ يُعالَج بتحرير الشريط المحيطي ورأب Z.'),
      ('LB99.7','congenital absence or hypoplasia of thumb','غياب أو نقص تنسج الإبهام الخلقي','Congenital absence or hypoplasia of the thumb impairing grasp and pinch; reconstructed by thumb reconstruction or index pollicisation depending on severity.','غياب أو نقص تنسج خلقي للإبهام يضعف القبض والقرص؛ يُرمَّم بإعادة بناء الإبهام أو إبهام السبابة حسب الشدة.'),
      ('LB78.0','polydactyly of the thumb','تعدد أصابع الإبهام','Duplication of the thumb (radial polydactyly), the commonest hand polydactyly; treated by excision of the lesser component with reconstruction of the retained thumb.','ازدواج الإبهام (تعدد الأصابع الكعبري)، أشيع تعدد أصابع اليد؛ يُعالَج باستئصال المكوّن الأصغر مع إعادة بناء الإبهام المُبقى.'),
      ('LB99.3','ulnar hemimelia','نقص الشعاع الزندي','Longitudinal deficiency of the ulna causing ulnar-sided forearm shortening and hand instability; managed by reconstruction tailored to forearm and hand involvement.','عوز طولي في الزند يسبب قصر الساعد في الجهة الزندية وعدم ثبات اليد؛ يُدار بإعادة بناء مُكيَّفة حسب إصابة الساعد واليد.'),

      ('FB40.Y','trigger finger (stenosing tenosynovitis)','الإصبع الزنادية (التهاب غمد الوتر المضيّق)','Stenosing flexor tenosynovitis at the A1 pulley causing painful catching or locking of a finger; treated by steroid injection or surgical A1-pulley release.','التهاب غمد الوتر القابض المضيّق عند البكرة A1 يسبب انحشاراً أو انغلاقاً مؤلماً للإصبع؛ يُعالَج بحقن الستيرويد أو التحرير الجراحي للبكرة A1.'),
      ('NF0A.6','Volkmann ischaemic contracture','تقفع فولكمان الإقفاري','Ischaemic necrosis and fibrosis of forearm flexor muscles after a compartment syndrome, producing a fixed clawed hand; managed by contracture release, tendon transfer or free functioning muscle transfer.','نخر وتليف إقفاري لعضلات الساعد القابضة بعد متلازمة الحجرة، يُحدث يداً مخلبية ثابتة؛ يُدار بتحرير التقفع أو نقل الوتر أو نقل عضلة حرة عاملة.'),
      ('FA34.3','contracture of joint','تقفع المفصل','Fixed limitation of joint motion from periarticular soft-tissue or capsular shortening, often post-traumatic or post-burn; managed by release, capsulotomy and rehabilitation.','تحديد ثابت لحركة المفصل بسبب قصر النسيج الرخو حول المفصل أو المحفظة، وغالباً بعد الرض أو الحرق؛ يُدار بالتحرير وبضع المحفظة وإعادة التأهيل.'),
      ('FB51.Y','plantar fascial fibromatosis (Ledderhose)','تليّف اللفافة الأخمصية (داء ليدرهوس)','Benign fibromatous nodules of the plantar fascia causing painful walking, analogous to Dupuytren disease; resistant cases treated by fasciectomy.','عقيدات تليّفية حميدة في اللفافة الأخمصية تسبب ألماً عند المشي، مماثل لداء دوبيتران؛ تُعالَج الحالات المقاومة باستئصال اللفافة.'),
      ('FB32.4','contracture of muscle','تقفع العضلة','Shortening and fibrosis of a muscle producing a fixed joint posture, for example post-injection or post-ischaemic; managed by physiotherapy and surgical lengthening or release.','قصر وتليف عضلة يُحدث وضعية مفصلية ثابتة، مثلاً بعد الحقن أو الإقفار؛ يُدار بالعلاج الطبيعي والتطويل أو التحرير الجراحي.'),
      ('FA31.6','acquired clawhand or clubhand','اليد المخلبية أو الحندقوقية المكتسبة','Acquired fixed claw or club deformity of the hand from nerve palsy or soft-tissue imbalance; managed by tendon transfers, releases and splinting.','تشوه مخلبي أو حندقوقي ثابت مكتسب في اليد نتيجة شلل عصبي أو اختلال النسيج الرخو؛ يُدار بنقل الأوتار والتحرير والتجبير.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'PRS' AND d."icdCode" = ANY($1)
       ON CONFLICT DO NOTHING`,
      [AddPrsDiagnosesBatch11750000000080.CODES]
    );

    await this.linkMain(queryRunner, "aesthetic surgery", ["9A03.5", "ME66.2", "5B80.1", "EJ20.0", "9A03.0Z"]);
    await this.linkMain(queryRunner, "breast reconstruction", ["LB73.10", "PK9B.2", "2E65.2", "BE1B.0"]);
    await this.linkMain(queryRunner, "burn injuries", ["NE40", "NE10", "NE11", "NE01", "ND95.3", "ND91.3", "NF08.4", "NE2Z", "ND90.3"]);
    await this.linkMain(queryRunner, "cleft lip & palate", ["LA40.0", "LA40.1", "LA42.0", "LA42.1", "LA50"]);
    await this.linkMain(queryRunner, "congenital anomalies", ["LA21.Z", "LC50.1", "2E81.2Z", "LB99.2", "LD26.5", "LB99.7", "LB78.0", "LB99.3"]);
    await this.linkMain(queryRunner, "contractures", ["FB40.Y", "NF0A.6", "FA34.3", "FB51.Y", "FB32.4", "FA31.6"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddPrsDiagnosesBatch11750000000080.CODES;
    // unlink PRS first; only remove the diagnosis row if no other dept still uses it
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))
      AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id WHERE dept.code = 'PRS')`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))
      AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'PRS')`, [codes]);
    await queryRunner.query(`DELETE FROM "diagnoses" WHERE "icdCode" = ANY($1) AND id NOT IN (SELECT "diagnosisId" FROM "department_diagnoses")`, [codes]);
  }
}
