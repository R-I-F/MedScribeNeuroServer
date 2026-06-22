import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * VASC proc_cpts — batch 2 of 2 (61 procedures).
 * Groups: THRM (thrombectomy/embolectomy/thrombolysis), PERA (peripheral & visceral
 * aneurysm open repair + carotid body), AMPU (amputation), DIAL (dialysis access),
 * AVFR (AV fistula/malformation repair & embolization), VARX (varicose/venous ablation),
 * IVCF (IVC filter, open venous thrombectomy, pulmonary embolectomy), TRMA (vascular
 * trauma direct repair).
 *
 * Every CPT verified against AAPC (aapc.com/codes/cpt-codes/<code>); none deleted.
 * Links to main_diags are added by migration 090.
 */
export class ImportVascProcCpts21750000000089 implements MigrationInterface {
  name = "ImportVascProcCpts21750000000089";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES

      -- ── THRM: thrombectomy / embolectomy / thrombolysis (arterial) ───────
      ('Embolectomy, femoropopliteal/aortoiliac, leg incision','THRM','34201-00','Open embolectomy or thrombectomy of the femoropopliteal or aortoiliac artery via a leg incision, with or without a balloon catheter.','استئصال صمة الشريان الفخذي المأبضي/الأبهري الحرقفي عبر شق بالساق','استئصال صمة أو خثرة مفتوح للشريان الفخذي المأبضي أو الأبهري الحرقفي عبر شق بالساق، مع أو بدون قسطرة بالونية.'),
      ('Embolectomy, popliteal-tibioperoneal, leg incision','THRM','34203-00','Open embolectomy or thrombectomy of the popliteal-tibioperoneal artery via a leg incision.','استئصال صمة الشريان المأبضي الظنبوبي الشظوي عبر شق بالساق','استئصال صمة أو خثرة مفتوح للشريان المأبضي الظنبوبي الشظوي عبر شق بالساق.'),
      ('Embolectomy, axillary/brachial/subclavian/innominate, arm incision','THRM','34101-00','Open embolectomy or thrombectomy of the axillary, brachial, subclavian or innominate artery via an arm incision.','استئصال صمة الشريان الإبطي/العضدي/تحت الترقوة/اللامُسمّى عبر شق بالذراع','استئصال صمة أو خثرة مفتوح للشريان الإبطي أو العضدي أو تحت الترقوة أو اللامُسمّى عبر شق بالذراع.'),
      ('Embolectomy, renal/celiac/mesenteric/aortoiliac, abdominal incision','THRM','34151-00','Open embolectomy or thrombectomy of the renal, celiac, mesenteric or aortoiliac artery via an abdominal incision.','استئصال صمة الشريان الكلوي/البطني/المساريقي/الأبهري الحرقفي عبر شق بالبطن','استئصال صمة أو خثرة مفتوح للشريان الكلوي أو البطني أو المساريقي أو الأبهري الحرقفي عبر شق بالبطن.'),
      ('Percutaneous arterial mechanical thrombectomy, primary','THRM','37184-00','Primary percutaneous mechanical thrombectomy of a non-coronary, non-intracranial artery, with intraprocedural thrombolytic injection when performed.','استئصال الخثرة الشرياني الآلي عبر الجلد، أولي','استئصال خثرة آلي أولي عبر الجلد لشريان غير تاجي وغير داخل قحفي، مع حقن مذيب للخثرة أثناء الإجراء عند اللزوم.'),
      ('Transcatheter arterial thrombolysis infusion (initial day)','THRM','37211-00','Transcatheter infusion of a thrombolytic agent into a non-coronary, non-intracranial artery (initial treatment day).','تسريب مذيب الخثرة الشرياني عبر القسطرة','تسريب مذيب للخثرة عبر القسطرة في شريان غير تاجي وغير داخل قحفي (يوم العلاج الأول).'),

      -- ── PERA: peripheral & visceral aneurysm open repair + carotid body ──
      ('Open repair, femoral artery aneurysm','PERA','35141-00','Direct open repair or interposition graft of a common femoral artery aneurysm.','إصلاح مفتوح لأم دم الشريان الفخذي','إصلاح مفتوح مباشر أو طعم بيني لأم دم الشريان الفخذي الأصلي.'),
      ('Open repair, popliteal artery aneurysm','PERA','35151-00','Direct open repair or interposition/bypass graft of a popliteal artery aneurysm.','إصلاح مفتوح لأم دم الشريان المأبضي','إصلاح مفتوح مباشر أو طعم بيني/مجازة لأم دم الشريان المأبضي.'),
      ('Open repair, iliac artery aneurysm','PERA','35131-00','Direct open repair or graft of an iliac artery aneurysm via an abdominal or retroperitoneal approach.','إصلاح مفتوح لأم دم الشريان الحرقفي','إصلاح مفتوح مباشر أو بطعم لأم دم الشريان الحرقفي عبر مدخل بطني أو خلف الصفاق.'),
      ('Open repair, visceral artery aneurysm','PERA','35121-00','Direct open repair or graft of a hepatic, celiac, renal or mesenteric (visceral) artery aneurysm.','إصلاح مفتوح لأم دم الشريان الحشوي','إصلاح مفتوح مباشر أو بطعم لأم دم الشريان الكبدي أو البطني أو الكلوي أو المساريقي (الحشوي).'),
      ('Open repair, radial/ulnar artery aneurysm','PERA','35045-00','Direct open repair of a radial or ulnar artery aneurysm or pseudoaneurysm.','إصلاح مفتوح لأم دم الشريان الكعبري/الزندي','إصلاح مفتوح مباشر لأم دم أو أم دم كاذبة في الشريان الكعبري أو الزندي.'),
      ('Open repair, carotid/subclavian artery aneurysm','PERA','35001-00','Direct open repair or interposition graft of a carotid or subclavian artery aneurysm via a neck incision.','إصلاح مفتوح لأم دم الشريان السباتي/تحت الترقوة','إصلاح مفتوح مباشر أو طعم بيني لأم دم الشريان السباتي أو تحت الترقوة عبر شق رقبي.'),
      ('Excision of carotid body tumour','PERA','60600-00','Surgical excision of a carotid body tumour (paraganglioma) at the carotid bifurcation without resection of the carotid artery.','استئصال ورم الجسم السباتي','استئصال جراحي لورم الجسم السباتي (ورم مجاور العقدة) عند تشعّب السباتي دون استئصال الشريان السباتي.'),

      -- ── AMPU: amputation ─────────────────────────────────────────────────
      ('Above-knee amputation','AMPU','27590-00','Amputation of the lower limb through the femur (above-knee) for unsalvageable limb ischaemia or gangrene.','بتر فوق الركبة','بتر الطرف السفلي عبر عظم الفخذ (فوق الركبة) لنقص تروية أو غنغرينة لا يمكن إنقاذها.'),
      ('Below-knee amputation','AMPU','27880-00','Amputation of the leg through the tibia and fibula (below-knee).','بتر تحت الركبة','بتر الساق عبر عظمي الظنبوب والشظية (تحت الركبة).'),
      ('Transmetatarsal amputation of foot','AMPU','28805-00','Amputation of the foot through the metatarsal bones.','بتر القدم عبر مشط القدم','بتر القدم عبر عظام مشط القدم.'),
      ('Toe amputation at metatarsophalangeal joint','AMPU','28820-00','Amputation of a toe at the metatarsophalangeal joint.','بتر إصبع القدم عند المفصل المشطي السلامي','بتر إصبع القدم عند المفصل المشطي السلامي.'),
      ('Hip disarticulation','AMPU','27295-00','Amputation of the entire lower extremity through the hip joint.','فصل مفصل الورك','بتر الطرف السفلي بالكامل عبر مفصل الورك.'),

      -- ── DIAL: dialysis (haemodialysis) vascular access ───────────────────
      ('AV anastomosis, direct (Cimino fistula)','DIAL','36821-00','Creation of a direct radiocephalic arteriovenous fistula for haemodialysis access (Cimino-Brescia).','مفاغرة شريانية وريدية مباشرة (ناسور سيمينو)','إنشاء ناسور شرياني وريدي كعبري رأسي مباشر للوصول لغسيل الكلى (سيمينو-بريشيا).'),
      ('AV anastomosis, upper arm cephalic vein transposition','DIAL','36818-00','Creation of an upper-arm arteriovenous fistula by cephalic vein transposition.','مفاغرة شريانية وريدية بنقل الوريد الرأسي','إنشاء ناسور شرياني وريدي بأعلى الذراع بنقل الوريد الرأسي.'),
      ('AV anastomosis, upper arm basilic vein transposition','DIAL','36819-00','Creation of an upper-arm arteriovenous fistula by basilic vein transposition.','مفاغرة شريانية وريدية بنقل الوريد الباسيلي','إنشاء ناسور شرياني وريدي بأعلى الذراع بنقل الوريد الباسيلي (القاعدي).'),
      ('AV graft for dialysis, autogenous vein','DIAL','36825-00','Creation of an arteriovenous access graft using an autogenous vein.','طعم شرياني وريدي ذاتي للديلزة','إنشاء طعم وصول شرياني وريدي باستخدام وريد ذاتي.'),
      ('AV graft for dialysis, nonautogenous (synthetic)','DIAL','36830-00','Creation of an arteriovenous access graft using a nonautogenous (synthetic) conduit.','طعم شرياني وريدي صناعي للديلزة','إنشاء طعم وصول شرياني وريدي باستخدام قناة صناعية (غير ذاتية).'),
      ('Open thrombectomy, dialysis AV fistula/graft','DIAL','36831-00','Open thrombectomy of a clotted dialysis arteriovenous fistula or graft without revision.','استئصال خثرة مفتوح لناسور/طعم الديلزة','استئصال خثرة مفتوح لناسور أو طعم ديلزة شرياني وريدي متخثر دون مراجعة.'),
      ('Open revision, dialysis AV fistula with thrombectomy','DIAL','36833-00','Open revision of a dialysis arteriovenous fistula or graft with thrombectomy.','مراجعة مفتوحة مع استئصال خثرة لناسور الديلزة','مراجعة مفتوحة لناسور أو طعم ديلزة شرياني وريدي مع استئصال الخثرة.'),
      ('Open revision, dialysis AV fistula without thrombectomy','DIAL','36832-00','Open revision of a dialysis arteriovenous fistula or graft without thrombectomy.','مراجعة مفتوحة دون استئصال خثرة لناسور الديلزة','مراجعة مفتوحة لناسور أو طعم ديلزة شرياني وريدي دون استئصال الخثرة.'),
      ('Insertion of tunneled dialysis catheter','DIAL','36558-00','Insertion of a tunneled centrally inserted central venous catheter without a subcutaneous port, for dialysis (age 5 or older).','إدخال قسطرة ديلزة وريدية مركزية منفقة','إدخال قسطرة وريدية مركزية منفقة دون منفذ تحت الجلد للديلزة (بعمر 5 سنوات فأكثر).'),
      ('Percutaneous angioplasty within dialysis circuit','DIAL','36902-00','Percutaneous angiography of a dialysis circuit with transluminal balloon angioplasty of the peripheral dialysis segment.','رأب الأوعية عبر الجلد ضمن دائرة الديلزة','تصوير وعائي عبر الجلد لدائرة الديلزة مع رأب بالبالون للقطعة المحيطية من دائرة الديلزة.'),
      ('Ligation or banding of angioaccess AV fistula','DIAL','37607-00','Ligation or banding of a haemodialysis arteriovenous fistula (eg, for access-related steal or high output).','ربط أو تطويق ناسور الوصول الشرياني الوريدي','ربط أو تطويق ناسور شرياني وريدي للوصول لغسيل الكلى (مثلاً لسرقة متعلقة بالوصول أو نتاج مرتفع).'),

      -- ── AVFR: AV fistula/malformation repair & embolization ──────────────
      ('Repair, congenital AV fistula, thorax/abdomen','AVFR','35182-00','Open repair of a congenital arteriovenous fistula of the thorax or abdomen.','إصلاح ناسور شرياني وريدي خِلقي بالصدر/البطن','إصلاح مفتوح لناسور شرياني وريدي خِلقي في الصدر أو البطن.'),
      ('Repair, congenital AV fistula, extremities','AVFR','35184-00','Open repair of a congenital arteriovenous fistula of an extremity.','إصلاح ناسور شرياني وريدي خِلقي بالأطراف','إصلاح مفتوح لناسور شرياني وريدي خِلقي في أحد الأطراف.'),
      ('Repair, acquired/traumatic AV fistula, extremities','AVFR','35188-00','Open repair of an acquired or traumatic arteriovenous fistula of an extremity.','إصلاح ناسور شرياني وريدي مكتسب/رضحي بالأطراف','إصلاح مفتوح لناسور شرياني وريدي مكتسب أو رضحي في أحد الأطراف.'),
      ('Repair, acquired/traumatic AV fistula, thorax/abdomen','AVFR','35189-00','Open repair of an acquired or traumatic arteriovenous fistula of the thorax or abdomen.','إصلاح ناسور شرياني وريدي مكتسب/رضحي بالصدر/البطن','إصلاح مفتوح لناسور شرياني وريدي مكتسب أو رضحي في الصدر أو البطن.'),
      ('Vascular embolization, arterial (non-tumour)','AVFR','37242-00','Transcatheter arterial embolization for a non-haemorrhagic, non-tumour condition (eg, arteriovenous malformation, fistula or pseudoaneurysm).','إصمام وعائي شرياني (لغير الورم)','إصمام شرياني عبر القسطرة لحالة غير نزفية وغير ورمية (مثل التشوه الشرياني الوريدي أو الناسور أو أم الدم الكاذبة).'),
      ('Vascular embolization, venous','AVFR','37241-00','Transcatheter venous embolization for a non-haemorrhagic condition (eg, venous malformation, varices or varicocele).','إصمام وعائي وريدي','إصمام وريدي عبر القسطرة لحالة غير نزفية (مثل التشوه الوريدي أو الدوالي أو دوالي الخصية).'),

      -- ── VARX: varicose / venous ablation ─────────────────────────────────
      ('Endovenous radiofrequency ablation, first vein','VARX','36475-00','Endovenous radiofrequency ablation of an incompetent extremity truncal vein (first vein treated).','الاجتثاث الوريدي الداخلي بالترددات الراديوية، الوريد الأول','اجتثاث وريدي داخلي بالترددات الراديوية لوريد جذعي طرفي قاصر (أول وريد يُعالَج).'),
      ('Endovenous laser ablation, first vein','VARX','36478-00','Endovenous laser ablation of an incompetent extremity truncal vein (first vein treated).','الاجتثاث الوريدي الداخلي بالليزر، الوريد الأول','اجتثاث وريدي داخلي بالليزر لوريد جذعي طرفي قاصر (أول وريد يُعالَج).'),
      ('Ultrasound-guided foam sclerosant, single truncal vein','VARX','36465-00','Ultrasound-guided injection of a non-compounded foam sclerosant into a single incompetent truncal vein.','حقن مصلب رغوي موجّه بالأمواج فوق الصوتية، وريد جذعي واحد','حقن مصلب رغوي غير مركّب موجّه بالأمواج فوق الصوتية في وريد جذعي قاصر واحد.'),
      ('Sclerotherapy of spider veins (telangiectasia)','VARX','36468-00','Injection of sclerosant to treat spider veins (telangiectasia) of the limb or trunk.','العلاج بالتصليب للأوردة العنكبوتية','حقن مصلب لعلاج الأوردة العنكبوتية (توسع الشعيرات) بالطرف أو الجذع.'),
      ('Sclerotherapy, single incompetent vein','VARX','36470-00','Injection of sclerosant into a single incompetent vein (other than telangiectasia).','العلاج بالتصليب لوريد قاصر واحد','حقن مصلب في وريد قاصر واحد (غير توسع الشعيرات).'),
      ('Ligation and division of long saphenous vein at SFJ','VARX','37700-00','Ligation and division of the long (great) saphenous vein at the saphenofemoral junction.','ربط وقطع الوريد الصافن الكبير عند الوصل الصافني الفخذي','ربط وقطع الوريد الصافن الكبير عند الوصل الصافني الفخذي.'),
      ('Ligation, division and stripping, long saphenous vein','VARX','37722-00','Ligation, division and stripping of the long (great) saphenous vein from the groin to the knee or below.','ربط وقطع وسلخ الوريد الصافن الكبير','ربط وقطع وسلخ الوريد الصافن الكبير من الأربية حتى الركبة أو أسفلها.'),
      ('Ligation, division and stripping, short saphenous vein','VARX','37718-00','Ligation, division and stripping of the short (small) saphenous vein.','ربط وقطع وسلخ الوريد الصافن الصغير','ربط وقطع وسلخ الوريد الصافن الصغير.'),
      ('Stab phlebectomy of varicose veins, 10-20 incisions','VARX','37765-00','Stab avulsion phlebectomy of varicose veins of one extremity through 10-20 stab incisions.','استئصال الدوالي بالوخز، 10-20 شقًا','استئصال دوالي طرف واحد بالوخز عبر 10-20 شقًا وخزيًا.'),
      ('Stab phlebectomy of varicose veins, more than 20 incisions','VARX','37766-00','Stab avulsion phlebectomy of varicose veins of one extremity through more than 20 stab incisions.','استئصال الدوالي بالوخز، أكثر من 20 شقًا','استئصال دوالي طرف واحد بالوخز عبر أكثر من 20 شقًا وخزيًا.'),

      -- ── IVCF: IVC filter, open venous thrombectomy, pulmonary embolectomy ─
      ('Endovascular insertion of IVC filter','IVCF','37191-00','Endovascular insertion of an inferior vena cava filter to prevent pulmonary embolism.','إدخال مرشح الوريد الأجوف السفلي وعائيًا','إدخال مرشح الوريد الأجوف السفلي بطريق وعائي داخلي للوقاية من الانصمام الرئوي.'),
      ('Endovascular retrieval of IVC filter','IVCF','37193-00','Endovascular retrieval of a previously placed inferior vena cava filter.','استرجاع مرشح الوريد الأجوف السفلي وعائيًا','استرجاع مرشح الوريد الأجوف السفلي الموضوع سابقًا بطريق وعائي داخلي.'),
      ('Thrombectomy, vena cava/iliac vein, abdominal incision','IVCF','34401-00','Open thrombectomy of the vena cava or iliac vein via an abdominal incision.','استئصال خثرة الوريد الأجوف/الحرقفي عبر شق بطني','استئصال خثرة مفتوح للوريد الأجوف أو الحرقفي عبر شق بطني.'),
      ('Thrombectomy, vena cava/iliac/femoropopliteal vein, leg incision','IVCF','34421-00','Open thrombectomy of the vena cava, iliac or femoropopliteal vein via a leg incision.','استئصال خثرة الوريد الأجوف/الحرقفي/الفخذي المأبضي عبر شق بالساق','استئصال خثرة مفتوح للوريد الأجوف أو الحرقفي أو الفخذي المأبضي عبر شق بالساق.'),
      ('Pulmonary artery embolectomy with cardiopulmonary bypass','IVCF','33910-00','Surgical pulmonary artery embolectomy for massive pulmonary embolism, with cardiopulmonary bypass.','استئصال الصمة الرئوية بمجازة قلبية رئوية','استئصال جراحي لصمة الشريان الرئوي للانصمام الرئوي الكتلي باستخدام المجازة القلبية الرئوية.'),
      ('Percutaneous venous mechanical thrombectomy','IVCF','37187-00','Percutaneous mechanical thrombectomy of a vein, with intraprocedural thrombolytic injection when performed.','استئصال الخثرة الوريدي الآلي عبر الجلد','استئصال خثرة وريدي آلي عبر الجلد مع حقن مذيب للخثرة أثناء الإجراء عند اللزوم.'),
      ('Transcatheter venous thrombolysis infusion (initial day)','IVCF','37212-00','Transcatheter infusion of a thrombolytic agent into a vein (initial treatment day).','تسريب مذيب الخثرة الوريدي عبر القسطرة','تسريب مذيب للخثرة عبر القسطرة في وريد (يوم العلاج الأول).'),

      -- ── TRMA: vascular trauma direct repair ──────────────────────────────
      ('Repair of blood vessel, upper extremity (direct)','TRMA','35206-00','Direct repair of an injured blood vessel of the upper extremity.','إصلاح وعاء دموي بالطرف العلوي (مباشر)','إصلاح مباشر لوعاء دموي مصاب بالطرف العلوي.'),
      ('Repair of blood vessel, lower extremity (direct)','TRMA','35226-00','Direct repair of an injured blood vessel of the lower extremity.','إصلاح وعاء دموي بالطرف السفلي (مباشر)','إصلاح مباشر لوعاء دموي مصاب بالطرف السفلي.'),
      ('Repair of blood vessel with vein graft, upper extremity','TRMA','35236-00','Repair of an injured upper-extremity blood vessel using a vein graft.','إصلاح بطعم وريدي بالطرف العلوي','إصلاح وعاء دموي مصاب بالطرف العلوي باستخدام طعم وريدي.'),
      ('Repair of blood vessel with vein graft, lower extremity','TRMA','35256-00','Repair of an injured lower-extremity blood vessel using a vein graft.','إصلاح بطعم وريدي بالطرف السفلي','إصلاح وعاء دموي مصاب بالطرف السفلي باستخدام طعم وريدي.'),
      ('Repair of blood vessel with non-vein graft, upper extremity','TRMA','35266-00','Repair of an injured upper-extremity blood vessel using a graft other than vein.','إصلاح بطعم غير وريدي بالطرف العلوي','إصلاح وعاء دموي مصاب بالطرف العلوي باستخدام طعم غير وريدي.'),
      ('Repair of blood vessel with non-vein graft, lower extremity','TRMA','35286-00','Repair of an injured lower-extremity blood vessel using a graft other than vein.','إصلاح بطعم غير وريدي بالطرف السفلي','إصلاح وعاء دموي مصاب بالطرف السفلي باستخدام طعم غير وريدي.'),
      ('Repair of blood vessel, neck','TRMA','35201-00','Direct repair of an injured blood vessel of the neck.','إصلاح وعاء دموي بالرقبة','إصلاح مباشر لوعاء دموي مصاب بالرقبة.'),
      ('Repair of intrathoracic vessel with cardiopulmonary bypass','TRMA','35211-00','Repair of an injured intrathoracic blood vessel using cardiopulmonary bypass.','إصلاح وعاء داخل الصدر بمجازة قلبية رئوية','إصلاح وعاء دموي مصاب داخل الصدر باستخدام المجازة القلبية الرئوية.'),
      ('Repair of intra-abdominal blood vessel','TRMA','35221-00','Direct repair of an injured intra-abdominal blood vessel.','إصلاح وعاء دموي داخل البطن','إصلاح مباشر لوعاء دموي مصاب داخل البطن.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('THRM','PERA','AMPU','DIAL','AVFR','VARX','IVCF','TRMA')`);
  }
}
