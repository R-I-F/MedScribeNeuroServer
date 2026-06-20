import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * VASC dept-audit — coverage extension MIG-D batch 1 (35 of 72 new diagnoses).
 * Aortic/arterial groups: AAA, aortic dissection, arterial trauma, arteriovenous
 * fistula, carotid artery disease, peripheral aneurysms, renal artery disease,
 * thoracic aortic aneurysm. (PAD + venous + access groups are in migration 087.)
 *
 * INSERT ... ON CONFLICT ("icdCode") DO NOTHING correctly shares any code already
 * owned by another department; the dept + main_diag links are always (re)created.
 * down() only deletes diagnoses rows that become orphaned (no remaining dept link),
 * so shared rows owned by other depts are preserved.
 */
export class AddVascDiagnoses11750000000086 implements MigrationInterface {
  private readonly codes: string[] = [
    "BD50.4Z&XA2LN9", "BD50.4Z&XA5EX6", "BD50.40", "BD50.41&XA2LN9", "BD5Y", "BD50.4Y",
    "BD50.0Z", "BD50.21", "LD28.0Y",
    "NC75.0Z", "NC15.1Z", "NA60.0Z", "NB30.1Z", "NB90.1Z",
    "ND56.5", "LA90.3Z", "LA90.5", "DB98.73", "8B22.42",
    "BD51.0", "8B22.0", "BD55&XA1XP6",
    "BD51.5", "BD51.Y&XA0R02", "DB98.9", "BD51.3&XA5D68",
    "BD51.4", "GB90.3", "BA04.Y", "BD41.0&XA69V9",
    "BD50.3Z&XA75Z8", "BD50.3Z&XA5H34", "BD50.5Z", "BD50.31", "BD50.30",
  ];

  private readonly groups: Record<string, string[]> = {
    "abdominal aortic aneurysm": ["BD50.4Z&XA2LN9", "BD50.4Z&XA5EX6", "BD50.40", "BD50.41&XA2LN9", "BD5Y", "BD50.4Y"],
    "aortic dissection": ["BD50.0Z", "BD50.21", "LD28.0Y"],
    "arterial trauma": ["NC75.0Z", "NC15.1Z", "NA60.0Z", "NB30.1Z", "NB90.1Z"],
    "arteriovenous fistula": ["ND56.5", "LA90.3Z", "LA90.5", "DB98.73", "8B22.42"],
    "carotid artery disease": ["BD51.0", "8B22.0", "BD55&XA1XP6"],
    "peripheral aneurysms": ["BD51.5", "BD51.Y&XA0R02", "DB98.9", "BD51.3&XA5D68"],
    "renal artery disease": ["BD51.4", "GB90.3", "BA04.Y", "BD41.0&XA69V9"],
    "thoracic aortic aneurysm": ["BD50.3Z&XA75Z8", "BD50.3Z&XA5H34", "BD50.5Z", "BD50.31", "BD50.30"],
  };

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
      VALUES
        ('BD50.4Z&XA2LN9','infrarenal abdominal aortic aneurysm','أم دم الأبهر البطني تحت الكلوي','AAA located below the renal arteries (commonest site); amenable to standard EVAR or open infrarenal repair.','أم دم الأبهر البطني الواقع أسفل الشرايين الكلوية (أكثر المواقع شيوعًا)؛ قابل للإصلاح الوعائي الداخلي القياسي أو الإصلاح المفتوح تحت الكلوي.'),
        ('BD50.4Z&XA5EX6','suprarenal abdominal aortic aneurysm','أم دم الأبهر البطني فوق الكلوي','AAA involving the aorta above the renal arteries; requires fenestrated/branched EVAR or open suprarenal repair with renal protection.','أم دم الأبهر البطني الذي يشمل الأبهر فوق الشرايين الكلوية؛ يتطلب إصلاحًا وعائيًا مُنَفَّذًا أو متفرّعًا أو إصلاحًا مفتوحًا فوق الكلوي مع حماية كلوية.'),
        ('BD50.40','abdominal aortic aneurysm with perforation','أم دم الأبهر البطني مع انثقاب','Contained or frank perforation of an AAA; surgical emergency requiring immediate repair.','انثقاب محتوى أو صريح لأم دم الأبهر البطني؛ حالة جراحية طارئة تتطلب إصلاحًا فوريًا.'),
        ('BD50.41&XA2LN9','ruptured infrarenal abdominal aortic aneurysm','تمزق أم دم الأبهر البطني تحت الكلوي','Rupture of an infrarenal AAA; life-threatening emergency managed by emergency EVAR or open repair.','تمزق أم دم الأبهر البطني تحت الكلوي؛ حالة طارئة مهددة للحياة تُدار بالإصلاح الوعائي الداخلي الطارئ أو الجراحة المفتوحة.'),
        ('BD5Y','mycotic (infected) aortic aneurysm','أم دم الأبهر الفطري (المُعدي)','Infective aneurysm of the aorta with vessel-wall infection; treated by debridement, in-situ or extra-anatomic reconstruction and antibiotics.','أم دم إنتاني في الأبهر مع عدوى جدار الوعاء؛ يُعالَج بالتنضير وإعادة البناء في الموضع أو خارج التشريحي مع المضادات الحيوية.'),
        ('BD50.4Y','other specified abdominal aortic aneurysm','أم دم الأبهر البطني المحدد الآخر','Other specified AAA pattern (e.g. descending/atypical morphology) not covered by the standard sited codes; managed per size and anatomy.','نمط محدد آخر من أم دم الأبهر البطني (مثل المورفولوجيا الهابطة/غير النمطية) غير مشمول بالرموز الموضعية القياسية؛ يُدار حسب الحجم والتشريح.'),
        ('BD50.0Z','type A aortic dissection (ascending, beyond arch)','تسلّخ الأبهر من النوع أ (الصاعد الممتد لما بعد القوس)','Stanford type A / DeBakey I dissection involving the ascending aorta and propagating beyond the arch; a surgical emergency requiring open repair.','تسلّخ ستانفورد نوع أ / دباكي I يشمل الأبهر الصاعد ويمتد إلى ما بعد القوس؛ حالة جراحية طارئة تتطلب إصلاحًا مفتوحًا.'),
        ('BD50.21','ruptured descending aortic dissection','تسلّخ الأبهر الهابط المتمزق','Descending aortic dissection complicated by rupture or distal propagation with rupture; emergency TEVAR or open repair.','تسلّخ الأبهر الهابط المتعقّد بالتمزق أو الامتداد القاصي مع التمزق؛ إصلاح طارئ بتيفار أو جراحة مفتوحة.'),
        ('LD28.0Y','familial (Marfan-related) thoracic aortic dissection','تسلّخ الأبهر الصدري العائلي (المرتبط بمتلازمة مارفان)','Heritable thoracic aortic disease (e.g. Marfan, Loeys-Dietz) predisposing to aneurysm and dissection; prophylactic root replacement at threshold diameters.','مرض أبهري صدري وراثي (مثل مارفان ولويس-ديتز) يهيّئ لأم الدم والتسلّخ؛ استبدال الجذر الوقائي عند أقطار عتبية.'),
        ('NC75.0Z','injury of femoral artery','إصابة الشريان الفخذي','Traumatic injury of the femoral artery (penetrating or blunt); managed by primary repair, vein graft or ligation; limb-threatening.','إصابة رضحية للشريان الفخذي (نافذة أو كليلة)؛ تُدار بالإصلاح الأولي أو طعم وريدي أو الربط؛ تهدد الطرف.'),
        ('NC15.1Z','injury of brachial artery','إصابة الشريان العضدي','Traumatic injury of the brachial artery, often with supracondylar fractures; repaired to preserve forearm perfusion.','إصابة رضحية للشريان العضدي، غالبًا مع كسور فوق اللقمة؛ تُصلَح للحفاظ على تروية الساعد.'),
        ('NA60.0Z','injury of carotid artery','إصابة الشريان السباتي','Traumatic carotid artery injury (blunt or penetrating); risk of stroke; managed by repair, stenting or ligation.','إصابة رضحية للشريان السباتي (كليلة أو نافذة)؛ خطر السكتة الدماغية؛ تُدار بالإصلاح أو الدعامة أو الربط.'),
        ('NB30.1Z','injury of innominate or subclavian artery','إصابة الشريان اللامُسمّى أو تحت الترقوة','Traumatic injury of the innominate or subclavian artery; major haemorrhage risk; repaired via open or endovascular techniques.','إصابة رضحية للشريان اللامُسمّى أو تحت الترقوة؛ خطر نزف كبير؛ تُصلَح بتقنيات مفتوحة أو وعائية داخلية.'),
        ('NB90.1Z','injury of inferior vena cava','إصابة الوريد الأجوف السفلي','Traumatic injury of the inferior vena cava; high mortality; managed by repair, ligation or packing.','إصابة رضحية للوريد الأجوف السفلي؛ وفيات عالية؛ تُدار بالإصلاح أو الربط أو الحشو.'),
        ('ND56.5','traumatic arteriovenous fistula','الناسور الشرياني الوريدي الرضحي','Abnormal artery-to-vein communication after trauma or iatrogenic puncture; causes high-output flow and steal; treated by surgical or endovascular closure.','اتصال شاذ بين الشريان والوريد بعد رض أو وخز علاجي المنشأ؛ يسبب جريانًا عالي النتاج وسرقة؛ يُعالَج بالإغلاق الجراحي أو الوعائي الداخلي.'),
        ('LA90.3Z','peripheral arteriovenous malformation','التشوه الشرياني الوريدي الطرفي','Congenital high-flow vascular malformation of a limb; may cause pain, bleeding or limb overgrowth; managed by embolisation and resection.','تشوه وعائي خِلقي عالي الجريان في أحد الأطراف؛ قد يسبب ألمًا أو نزفًا أو فرط نمو الطرف؛ يُدار بالإصمام والاستئصال.'),
        ('LA90.5','pulmonary arteriovenous fistula','الناسور الشرياني الوريدي الرئوي','Direct pulmonary artery-to-vein shunt (often in HHT); causes hypoxaemia and paradoxical embolism; treated by transcatheter embolisation.','تحويلة مباشرة من الشريان إلى الوريد الرئوي (غالبًا في توسع الشعيرات النزفي الوراثي)؛ تسبب نقص الأكسجة والانصمام المتناقض؛ تُعالَج بالإصمام عبر القسطرة.'),
        ('DB98.73','splanchnic arteriovenous fistula','الناسور الشرياني الوريدي الحشوي','Arteriovenous fistula of the splanchnic (visceral) circulation; may cause portal hypertension or bleeding; treated by embolisation or resection.','ناسور شرياني وريدي في الدوران الحشوي؛ قد يسبب ارتفاع ضغط الدم البابي أو النزف؛ يُعالَج بالإصمام أو الاستئصال.'),
        ('8B22.42','dural arteriovenous fistula','الناسور الشرياني الوريدي الجافوي','Acquired shunt between dural arteries and venous sinuses; presents with bruit, headache or haemorrhage; treated by endovascular embolisation.','تحويلة مكتسبة بين الشرايين الجافوية والجيوب الوريدية؛ تتظاهر بلغط أو صداع أو نزف؛ تُعالَج بالإصمام الوعائي الداخلي.'),
        ('BD51.0','carotid artery aneurysm','أم دم الشريان السباتي','Aneurysm of the extracranial carotid artery; presents as a pulsatile neck mass or with cerebral embolism; treated by resection with interposition graft.','أم دم في الشريان السباتي خارج القحف؛ يتظاهر بكتلة نابضة في الرقبة أو بانصمام دماغي؛ يُعالَج بالاستئصال مع طعم بيني.'),
        ('8B22.0','extracranial carotid artery dissection','تسلّخ الشريان السباتي خارج القحف','Dissection of the extracranial carotid artery, a leading cause of stroke in the young; managed by antithrombotics or stenting.','تسلّخ الشريان السباتي خارج القحف، من الأسباب الرئيسية للسكتة لدى الشباب؛ يُدار بمضادات التخثر أو الدعامة.'),
        ('BD55&XA1XP6','vertebral artery stenosis','تضيق الشريان الفقري','Stenosis of the vertebral artery causing posterior-circulation ischaemia; managed medically or by angioplasty/stenting.','تضيق الشريان الفقري يسبب نقص تروية الدوران الخلفي؛ يُدار دوائيًا أو برأب الأوعية والدعامة.'),
        ('BD51.5','iliac artery aneurysm','أم دم الشريان الحرقفي','Focal dilatation of the common or internal iliac artery, often coexisting with AAA; risk of rupture when large; repaired by open or endovascular techniques.','توسّع موضعي في الشريان الحرقفي الأصلي أو الباطن، غالبًا ما يصاحب أم دم الأبهر البطني؛ خطر التمزق عند كبر الحجم؛ يُعالَج بالجراحة المفتوحة أو بالطرق الوعائية الداخلية.'),
        ('BD51.Y&XA0R02','splenic artery aneurysm','أم دم الشريان الطحالي','Most common visceral artery aneurysm; higher rupture risk in pregnancy; treated by embolisation, ligation or aneurysmectomy.','أكثر أمهات الدم الحشوية شيوعًا؛ يرتفع خطر تمزقها أثناء الحمل؛ تُعالَج بالإصمام أو الربط أو استئصال أم الدم.'),
        ('DB98.9','hepatic artery aneurysm','أم دم الشريان الكبدي','Second most common visceral artery aneurysm; may present with haemobilia or rupture; managed by endovascular embolisation or open repair.','ثاني أكثر أمهات الدم الحشوية شيوعًا؛ قد يتظاهر بنزف صفراوي أو تمزق؛ يُدار بالإصمام الوعائي الداخلي أو الإصلاح المفتوح.'),
        ('BD51.3&XA5D68','subclavian artery aneurysm','أم دم الشريان تحت الترقوة','Aneurysm of the subclavian artery, often related to thoracic outlet syndrome or atherosclerosis; risk of thromboembolism to the arm; repaired by resection and bypass.','أم دم في الشريان تحت الترقوة، غالبًا ما يرتبط بمتلازمة المخرج الصدري أو تصلب الشرايين؛ خطر الانصمام الخثاري إلى الذراع؛ يُصلَح بالاستئصال والمجازة.'),
        ('BD51.4','renal artery aneurysm','أم دم الشريان الكلوي','Aneurysm of the renal artery, often at a bifurcation; may cause hypertension or rupture; managed by endovascular or open reconstruction.','أم دم في الشريان الكلوي، غالبًا عند التفرّع؛ قد يسبب ارتفاع ضغط الدم أو التمزق؛ يُدار بإعادة البناء الوعائي الداخلي أو المفتوح.'),
        ('GB90.3','renal artery occlusion / infarction','انسداد الشريان الكلوي / احتشاء الكلية','Acute thromboembolic occlusion of the renal artery causing renal infarction; managed by anticoagulation, thrombolysis or revascularisation.','انسداد خثاري صمي حاد للشريان الكلوي يسبب احتشاء الكلية؛ يُدار بمضادات التخثر أو حل الخثرة أو إعادة التوعية.'),
        ('BA04.Y','renovascular hypertension','ارتفاع ضغط الدم الكلوي الوعائي','Secondary hypertension from renal artery stenosis (atherosclerotic or fibromuscular); managed by angioplasty/stenting or revascularisation.','ارتفاع ضغط الدم الثانوي الناجم عن تضيق الشريان الكلوي (تصلبي أو ليفي عضلي)؛ يُدار برأب الأوعية والدعامة أو إعادة التوعية.'),
        ('BD41.0&XA69V9','renal artery fibromuscular dysplasia','خلل التنسج الليفي العضلي للشريان الكلوي','Fibromuscular dysplasia of the renal artery ("string of beads"), a cause of renovascular hypertension in young women; treated by balloon angioplasty.','خلل التنسج الليفي العضلي للشريان الكلوي ("سبحة الخرز")، سبب لارتفاع ضغط الدم الكلوي الوعائي لدى الشابات؛ يُعالَج برأب الأوعية بالبالون.'),
        ('BD50.3Z&XA75Z8','aneurysm of aortic arch','أم دم قوس الأبهر','Aneurysmal dilatation of the aortic arch; repair requires hybrid or open techniques with cerebral protection.','توسّع أمّ دمّي في قوس الأبهر؛ يتطلب إصلاحه تقنيات هجينة أو مفتوحة مع حماية دماغية.'),
        ('BD50.3Z&XA5H34','descending thoracic aortic aneurysm','أم دم الأبهر الصدري الهابط','Aneurysm of the descending thoracic aorta; managed by thoracic endovascular aortic repair (TEVAR) or open graft replacement.','أم دم في الأبهر الصدري الهابط؛ يُدار بإصلاح الأبهر الصدري الوعائي الداخلي (تيفار) أو استبدال الطعم المفتوح.'),
        ('BD50.5Z','thoracoabdominal aortic aneurysm','أم دم الأبهر الصدري البطني','Aneurysm spanning the thoracic and abdominal aorta (Crawford extents); complex open or branched-endovascular repair with spinal cord protection.','أم دم يمتد على الأبهر الصدري والبطني (تصنيف كروفورد)؛ إصلاح معقّد مفتوح أو وعائي داخلي متفرّع مع حماية الحبل الشوكي.'),
        ('BD50.31','ruptured thoracic aortic aneurysm','تمزق أم دم الأبهر الصدري','Rupture of a thoracic aortic aneurysm — a surgical emergency with high mortality; emergency TEVAR or open repair.','تمزق أم دم الأبهر الصدري — حالة جراحية طارئة عالية الوفيات؛ إصلاح طارئ بتيفار أو جراحة مفتوحة.'),
        ('BD50.30','thoracic aortic aneurysm with perforation','أم دم الأبهر الصدري مع انثقاب','Perforation of a thoracic aortic aneurysm; surgical emergency requiring immediate repair.','انثقاب أم دم الأبهر الصدري؛ حالة جراحية طارئة تتطلب إصلاحًا فوريًا.')
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
    // only delete diagnoses rows that are now orphaned (preserve rows shared with other depts)
    await queryRunner.query(
      `DELETE FROM "diagnoses"
       WHERE "icdCode" = ANY($1)
         AND id NOT IN (SELECT "diagnosisId" FROM "department_diagnoses")`,
      [this.codes],
    );
  }
}
