import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * VASC proc_cpts — batch 1 of 2 (53 procedures).
 * Groups: AORT (open aortic/thoracic aneurysm repair), EVAR (endovascular aneurysm
 * repair, abdominal + thoracic), ENDO (peripheral/visceral/carotid angioplasty,
 * stent & atherectomy), BYPS (open bypass), ENDA (endarterectomy).
 *
 * Every CPT verified against AAPC (aapc.com/codes/cpt-codes/<code>). Two deleted codes
 * were replaced: 33860→33858 (ascending aorta graft for dissection) and 33870→33871
 * (aortic arch graft). The lower-extremity endovascular family 37220-37235 was DELETED
 * by AMA effective 2026-01-01 and replaced by the new territory codes 37254-37296 used
 * in the ENDO group (iliac/fem-pop/tibial/inframalleolar; stenosis vs occlusion).
 * Links to main_diags are added by migration 090.
 */
export class ImportVascProcCpts11750000000088 implements MigrationInterface {
  name = "ImportVascProcCpts11750000000088";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES

      -- ── AORT: open aortic & thoracic aneurysm repair ─────────────────────
      ('Open repair, abdominal aortic aneurysm','AORT','35081-00','Open transabdominal repair of an infrarenal abdominal aortic aneurysm by aneurysmectomy and interposition tube or bifurcated graft.','إصلاح مفتوح لأم دم الأبهر البطني','إصلاح مفتوح عبر البطن لأم دم الأبهر البطني تحت الكلوي باستئصال أم الدم ووضع طعم أنبوبي أو متفرّع.'),
      ('Open repair, ruptured abdominal aortic aneurysm','AORT','35082-00','Emergency open repair of a ruptured abdominal aortic aneurysm with proximal aortic control and graft replacement.','إصلاح مفتوح لأم دم الأبهر البطني المتمزق','إصلاح مفتوح طارئ لأم دم الأبهر البطني المتمزق مع السيطرة الأبهرية القريبة واستبدال الطعم.'),
      ('Open repair, AAA involving visceral vessels','AORT','35091-00','Open repair of an abdominal aortic aneurysm extending to involve the visceral and/or renal arteries, with reimplantation or bypass of branch vessels.','إصلاح مفتوح لأم دم الأبهر البطني المشمل للأوعية الحشوية','إصلاح مفتوح لأم دم الأبهر البطني الممتد ليشمل الشرايين الحشوية و/أو الكلوية مع إعادة زرع الفروع أو مجازتها.'),
      ('Open repair, aortoiliac aneurysm','AORT','35102-00','Open repair of an aortoiliac aneurysm using a bifurcated aorto-iliac graft.','إصلاح مفتوح لأم دم الأبهر والحرقفي','إصلاح مفتوح لأم دم الأبهر والشرايين الحرقفية باستخدام طعم أبهري حرقفي متفرّع.'),
      ('Open repair, ruptured aortoiliac aneurysm','AORT','35103-00','Emergency open repair of a ruptured aortoiliac aneurysm.','إصلاح مفتوح لأم دم الأبهر والحرقفي المتمزق','إصلاح مفتوح طارئ لأم دم الأبهر والشرايين الحرقفية المتمزق.'),
      ('Ascending aorta graft for dissection (with CPB)','AORT','33858-00','Replacement of the ascending aorta with a tube graft for aortic dissection, using cardiopulmonary bypass.','ترقيع الأبهر الصاعد للتسلّخ (بمجازة قلبية رئوية)','استبدال الأبهر الصاعد بطعم أنبوبي لعلاج تسلّخ الأبهر باستخدام المجازة القلبية الرئوية.'),
      ('Ascending aorta and root replacement, valved conduit (Bentall)','AORT','33863-00','Replacement of the aortic root and ascending aorta with a valved conduit and coronary artery reimplantation (Bentall procedure).','استبدال جذر الأبهر والأبهر الصاعد بقناة ذات صمام (عملية بنتال)','استبدال جذر الأبهر والأبهر الصاعد بقناة صناعية ذات صمام مع إعادة زرع الشرايين التاجية (عملية بنتال).'),
      ('Aortic arch graft with arch-vessel reimplantation','AORT','33871-00','Replacement of the transverse aortic arch with a graft and reimplantation of the arch branch vessels, under cardiopulmonary bypass with deep hypothermic circulatory arrest.','ترقيع قوس الأبهر مع إعادة زرع فروع القوس','استبدال قوس الأبهر المستعرض بطعم مع إعادة زرع فروع القوس باستخدام المجازة القلبية الرئوية والإيقاف الدوراني بالتبريد العميق.'),
      ('Descending thoracic aorta graft','AORT','33875-00','Replacement of the descending thoracic aorta with a graft, with or without bypass.','ترقيع الأبهر الصدري الهابط','استبدال الأبهر الصدري الهابط بطعم، مع أو بدون مجازة.'),
      ('Thoracoabdominal aortic aneurysm graft','AORT','33877-00','Open repair of a thoracoabdominal aortic aneurysm with graft replacement and visceral/intercostal vessel reattachment, with spinal cord protection.','ترقيع أم دم الأبهر الصدري البطني','إصلاح مفتوح لأم دم الأبهر الصدري البطني باستبدال الطعم وإعادة وصل الأوعية الحشوية والوربية مع حماية الحبل الشوكي.'),

      -- ── EVAR: endovascular aneurysm repair (abdominal + thoracic) ─────────
      ('EVAR, infrarenal aorta, aorto-aortic tube (elective)','EVAR','34701-00','Endovascular repair of an infrarenal abdominal aortic aneurysm using an aorto-aortic tube endograft (non-ruptured).','إصلاح وعائي داخلي للأبهر البطني، طعم أنبوبي أبهري-أبهري','إصلاح وعائي داخلي لأم دم الأبهر البطني تحت الكلوي باستخدام طعم داخلي أنبوبي أبهري-أبهري (غير متمزق).'),
      ('EVAR, ruptured infrarenal aorta, aorto-aortic tube','EVAR','34702-00','Endovascular repair of a ruptured infrarenal aorta using an aorto-aortic tube endograft.','إصلاح وعائي داخلي للأبهر البطني المتمزق، طعم أنبوبي','إصلاح وعائي داخلي لأبهر بطني تحت كلوي متمزق باستخدام طعم داخلي أنبوبي أبهري-أبهري.'),
      ('EVAR, aorto-uni-iliac endograft','EVAR','34703-00','Endovascular repair of the infrarenal aorta or iliac artery using an aorto-uni-iliac endograft (non-ruptured).','إصلاح وعائي داخلي بطعم أبهري أحادي الحرقفي','إصلاح وعائي داخلي للأبهر تحت الكلوي أو الشريان الحرقفي باستخدام طعم داخلي أبهري أحادي الحرقفي (غير متمزق).'),
      ('EVAR, aorto-bi-iliac (bifurcated) endograft','EVAR','34705-00','Endovascular repair of an infrarenal AAA using a bifurcated aorto-bi-iliac endograft (the standard EVAR configuration).','إصلاح وعائي داخلي بطعم أبهري ثنائي الحرقفي (متفرّع)','إصلاح وعائي داخلي لأم دم الأبهر البطني تحت الكلوي باستخدام طعم داخلي متفرّع أبهري ثنائي الحرقفي (التكوين القياسي للإصلاح الوعائي).'),
      ('Endovascular repair, ilio-iliac tube endograft','EVAR','34707-00','Endovascular repair of an iliac artery aneurysm using an ilio-iliac tube endograft.','إصلاح وعائي داخلي بطعم أنبوبي حرقفي-حرقفي','إصلاح وعائي داخلي لأم دم الشريان الحرقفي باستخدام طعم داخلي أنبوبي حرقفي-حرقفي.'),
      ('Fenestrated EVAR, visceral aorta, one visceral artery','EVAR','34841-00','Fenestrated endovascular repair of the visceral aorta incorporating one visceral artery endoprosthesis.','إصلاح وعائي داخلي مُنَفَّذ للأبهر الحشوي، شريان حشوي واحد','إصلاح وعائي داخلي مُنَفَّذ (ذو نوافذ) للأبهر الحشوي مع طعم داخلي لشريان حشوي واحد.'),
      ('Fenestrated EVAR, visceral and infrarenal aorta','EVAR','34845-00','Fenestrated endovascular repair of the visceral and infrarenal aorta incorporating one visceral artery endoprosthesis.','إصلاح وعائي داخلي مُنَفَّذ للأبهر الحشوي وتحت الكلوي','إصلاح وعائي داخلي مُنَفَّذ للأبهر الحشوي وتحت الكلوي مع طعم داخلي لشريان حشوي واحد.'),
      ('TEVAR, descending thoracic aorta, covering left subclavian','EVAR','33880-00','Thoracic endovascular aortic repair of the descending thoracic aorta with the stent graft covering the origin of the left subclavian artery.','إصلاح أبهري صدري وعائي داخلي يغطي الشريان تحت الترقوة الأيسر','إصلاح وعائي داخلي للأبهر الصدري الهابط مع تغطية الطعم الدعامي لمنشأ الشريان تحت الترقوة الأيسر.'),
      ('TEVAR, descending thoracic aorta, not covering subclavian','EVAR','33881-00','Thoracic endovascular aortic repair of the descending thoracic aorta without coverage of the left subclavian artery origin.','إصلاح أبهري صدري وعائي داخلي دون تغطية الشريان تحت الترقوة','إصلاح وعائي داخلي للأبهر الصدري الهابط دون تغطية منشأ الشريان تحت الترقوة الأيسر.'),
      ('TEVAR, proximal extension endograft','EVAR','33883-00','Placement of a proximal extension stent graft in the thoracic aorta to extend or reinforce a prior endovascular repair.','طعم تمديد قريب لإصلاح الأبهر الصدري الوعائي الداخلي','وضع طعم دعامي تمديدي قريب في الأبهر الصدري لتمديد أو تعزيز إصلاح وعائي داخلي سابق.'),

      -- ── ENDO: peripheral/visceral/carotid endovascular ───────────────────
      ('Iliac angioplasty, stenosis, initial vessel','ENDO','37254-00','Percutaneous or open balloon angioplasty of a straightforward stenotic lesion in an initial iliac-territory vessel.','رأب الأوعية للشريان الحرقفي، تضيق','رأب بالبالون عبر الجلد أو المفتوح لآفة تضيقية بسيطة في وعاء مبدئي بالمنطقة الحرقفية.'),
      ('Iliac angioplasty, occlusion, initial vessel','ENDO','37256-00','Balloon angioplasty of a complex occlusive lesion in an initial iliac-territory vessel.','رأب الأوعية للشريان الحرقفي، انسداد','رأب بالبالون لآفة انسدادية معقّدة في وعاء مبدئي بالمنطقة الحرقفية.'),
      ('Iliac stent (with angioplasty), stenosis, initial vessel','ENDO','37258-00','Stent placement, with angioplasty when performed, for a straightforward stenosis in an initial iliac-territory vessel.','دعامة الشريان الحرقفي، تضيق','وضع دعامة (مع رأب عند اللزوم) لتضيق بسيط في وعاء مبدئي بالمنطقة الحرقفية.'),
      ('Iliac stent, occlusion, initial vessel','ENDO','37260-00','Stent placement for a complex occlusion in an initial iliac-territory vessel.','دعامة الشريان الحرقفي، انسداد','وضع دعامة لانسداد معقّد في وعاء مبدئي بالمنطقة الحرقفية.'),
      ('Femoral-popliteal angioplasty, stenosis, initial vessel','ENDO','37263-00','Balloon angioplasty of a straightforward stenosis in an initial femoral-popliteal-territory vessel.','رأب الأوعية الفخذي المأبضي، تضيق','رأب بالبالون لتضيق بسيط في وعاء مبدئي بالمنطقة الفخذية المأبضية.'),
      ('Femoral-popliteal angioplasty, occlusion, initial vessel','ENDO','37265-00','Balloon angioplasty of a complex occlusion in an initial femoral-popliteal-territory vessel.','رأب الأوعية الفخذي المأبضي، انسداد','رأب بالبالون لانسداد معقّد في وعاء مبدئي بالمنطقة الفخذية المأبضية.'),
      ('Femoral-popliteal stent (with angioplasty), stenosis, initial vessel','ENDO','37267-00','Stent placement, with angioplasty when performed, for a straightforward stenosis in an initial femoral-popliteal vessel.','دعامة فخذية مأبضية، تضيق','وضع دعامة (مع رأب عند اللزوم) لتضيق بسيط في وعاء مبدئي فخذي مأبضي.'),
      ('Femoral-popliteal stent, occlusion, initial vessel','ENDO','37269-00','Stent placement for a complex occlusion in an initial femoral-popliteal vessel.','دعامة فخذية مأبضية، انسداد','وضع دعامة لانسداد معقّد في وعاء مبدئي فخذي مأبضي.'),
      ('Femoral-popliteal atherectomy, stenosis, initial vessel','ENDO','37271-00','Atherectomy, with angioplasty when performed, of a straightforward stenosis in an initial femoral-popliteal vessel.','استئصال العصيدة الفخذي المأبضي، تضيق','استئصال العصيدة (مع رأب عند اللزوم) لتضيق بسيط في وعاء مبدئي فخذي مأبضي.'),
      ('Femoral-popliteal atherectomy, occlusion, initial vessel','ENDO','37273-00','Atherectomy of a complex occlusion in an initial femoral-popliteal vessel.','استئصال العصيدة الفخذي المأبضي، انسداد','استئصال العصيدة لانسداد معقّد في وعاء مبدئي فخذي مأبضي.'),
      ('Tibial-peroneal angioplasty, stenosis, initial vessel','ENDO','37280-00','Balloon angioplasty of a straightforward stenosis in an initial tibial-peroneal-territory vessel.','رأب الأوعية الظنبوبي الشظوي، تضيق','رأب بالبالون لتضيق بسيط في وعاء مبدئي بالمنطقة الظنبوبية الشظوية.'),
      ('Inframalleolar (pedal) angioplasty, stenosis, initial vessel','ENDO','37296-00','Balloon angioplasty of a straightforward stenosis in an initial inframalleolar (pedal/plantar) vessel.','رأب الأوعية تحت الكعبي (القدمي)، تضيق','رأب بالبالون لتضيق بسيط في وعاء مبدئي تحت كعبي (قدمي/أخمصي).'),
      ('Transcatheter stent, visceral or other artery','ENDO','37236-00','Transcatheter placement of an intravascular stent in a non-lower-extremity, non-cervical-carotid, non-coronary artery (eg, renal artery).','دعامة عبر القسطرة لشريان حشوي أو آخر','وضع دعامة وعائية عبر القسطرة في شريان غير طرفي سفلي وغير سباتي عنقي وغير تاجي (مثل الشريان الكلوي).'),
      ('Transluminal angioplasty, visceral or other artery','ENDO','37246-00','Transluminal balloon angioplasty of a non-lower-extremity artery (eg, renal artery) for occlusive disease.','رأب الأوعية لشريان حشوي أو آخر','رأب بالبالون عبر اللمعة لشريان غير طرفي سفلي (مثل الشريان الكلوي) لمرض انسدادي.'),
      ('Cervical carotid artery stent with embolic protection','ENDO','37215-00','Transcatheter placement of a stent in the cervical carotid artery with distal embolic protection, including angioplasty when performed.','دعامة الشريان السباتي العنقي مع حماية انصمامية','وضع دعامة عبر القسطرة في الشريان السباتي العنقي مع حماية انصمامية بعيدة، شاملاً الرأب عند اللزوم.'),
      ('Intrathoracic carotid or innominate artery stent','ENDO','37216-00','Transcatheter placement of a stent in the intrathoracic common carotid or innominate artery, including angioplasty when performed.','دعامة الشريان السباتي داخل الصدر أو اللامُسمّى','وضع دعامة عبر القسطرة في الشريان السباتي الأصلي داخل الصدر أو الشريان اللامُسمّى، شاملاً الرأب عند اللزوم.'),

      -- ── BYPS: open bypass ────────────────────────────────────────────────
      ('Aortobifemoral bypass graft','BYPS','35646-00','Synthetic-graft bypass from the infrarenal aorta to both femoral arteries for aortoiliac occlusive disease.','مجازة أبهرية فخذية مزدوجة','مجازة بطعم صناعي من الأبهر تحت الكلوي إلى الشريانين الفخذيين لمرض الانسداد الأبهري الحرقفي.'),
      ('Aortofemoral bypass graft, unilateral','BYPS','35647-00','Synthetic-graft bypass from the aorta to one femoral artery.','مجازة أبهرية فخذية أحادية','مجازة بطعم صناعي من الأبهر إلى أحد الشريانين الفخذيين.'),
      ('Axillofemoral bypass graft','BYPS','35621-00','Extra-anatomic synthetic-graft bypass from the axillary artery to the femoral artery.','مجازة إبطية فخذية','مجازة خارج تشريحية بطعم صناعي من الشريان الإبطي إلى الشريان الفخذي.'),
      ('Femoral-popliteal bypass with vein','BYPS','35556-00','Femoral-to-popliteal bypass using an autogenous vein graft.','مجازة فخذية مأبضية بطعم وريدي','مجازة من الشريان الفخذي إلى المأبضي باستخدام طعم وريدي ذاتي.'),
      ('Femoral-popliteal bypass with synthetic graft','BYPS','35656-00','Femoral-to-popliteal bypass using a synthetic (prosthetic) graft.','مجازة فخذية مأبضية بطعم صناعي','مجازة من الشريان الفخذي إلى المأبضي باستخدام طعم صناعي.'),
      ('Femoral-tibial or peroneal bypass with vein','BYPS','35566-00','Femoral-to-tibial or peroneal bypass using an autogenous vein graft for distal limb revascularisation.','مجازة فخذية ظنبوبية أو شظوية بطعم وريدي','مجازة من الشريان الفخذي إلى الظنبوبي أو الشظوي بطعم وريدي ذاتي لإعادة توعية الطرف القاصي.'),
      ('Popliteal-tibial or peroneal bypass with vein','BYPS','35571-00','Popliteal-to-tibial or peroneal bypass using an autogenous vein graft.','مجازة مأبضية ظنبوبية أو شظوية بطعم وريدي','مجازة من الشريان المأبضي إلى الظنبوبي أو الشظوي بطعم وريدي ذاتي.'),
      ('Femoro-femoral crossover bypass','BYPS','35661-00','Extra-anatomic synthetic-graft crossover bypass from one femoral artery to the contralateral femoral artery.','مجازة فخذية فخذية متصالبة','مجازة خارج تشريحية متصالبة بطعم صناعي من شريان فخذي إلى الفخذي المقابل.'),
      ('Carotid-subclavian bypass graft','BYPS','35606-00','Synthetic-graft bypass between the carotid and subclavian arteries for subclavian occlusive disease or steal.','مجازة سباتية تحت الترقوة','مجازة بطعم صناعي بين الشريان السباتي وتحت الترقوة لمرض الانسداد أو السرقة تحت الترقوة.'),
      ('Splenorenal bypass graft','BYPS','35636-00','Bypass from the splenic artery to the renal artery for renal artery occlusive disease.','مجازة طحالية كلوية','مجازة من الشريان الطحالي إلى الشريان الكلوي لمرض انسداد الشريان الكلوي.'),
      ('Aortorenal bypass with vein graft','BYPS','35560-00','Aorta-to-renal artery bypass using a vein graft for renovascular disease.','مجازة أبهرية كلوية بطعم وريدي','مجازة من الأبهر إلى الشريان الكلوي بطعم وريدي لمرض الأوعية الكلوية.'),

      -- ── ENDA: endarterectomy ─────────────────────────────────────────────
      ('Carotid/vertebral/subclavian endarterectomy','ENDA','35301-00','Thromboendarterectomy of the carotid, vertebral or subclavian artery through a neck incision, with or without patch angioplasty.','استئصال باطنة الشريان السباتي/الفقري/تحت الترقوة','استئصال باطنة الشريان السباتي أو الفقري أو تحت الترقوة عبر شق رقبي، مع أو بدون رأب برقعة.'),
      ('Common femoral endarterectomy','ENDA','35371-00','Thromboendarterectomy of the common femoral artery, often with patch angioplasty.','استئصال باطنة الشريان الفخذي الأصلي','استئصال باطنة الشريان الفخذي الأصلي، غالبًا مع رأب برقعة.'),
      ('Deep (profunda) femoral endarterectomy','ENDA','35372-00','Thromboendarterectomy of the deep (profunda) femoral artery (profundaplasty).','استئصال باطنة الشريان الفخذي العميق','استئصال باطنة الشريان الفخذي العميق (رأب الفخذي العميق).'),
      ('Iliac endarterectomy','ENDA','35351-00','Thromboendarterectomy of the iliac artery.','استئصال باطنة الشريان الحرقفي','استئصال باطنة الشريان الحرقفي.'),
      ('Abdominal aorta endarterectomy','ENDA','35331-00','Thromboendarterectomy of the abdominal aorta.','استئصال باطنة الأبهر البطني','استئصال باطنة الأبهر البطني.'),
      ('Mesenteric/celiac/renal endarterectomy','ENDA','35341-00','Thromboendarterectomy of the mesenteric, celiac or renal artery.','استئصال باطنة الشريان المساريقي/البطني/الكلوي','استئصال باطنة الشريان المساريقي أو البطني (الجوفي) أو الكلوي.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('AORT','EVAR','ENDO','BYPS','ENDA')`);
  }
}
