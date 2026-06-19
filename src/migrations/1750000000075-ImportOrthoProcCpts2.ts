import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ORTHO proc_cpts — batch 2 of 2 (57 procedures).
 * Groups: SPIN (spine), HAND (hand & wrist), FOOT (foot & ankle), SOFT (soft
 * tissue/tendon), TUMR (bone tumour), OSTE (osteotomy/deformity), PEDS
 * (paediatric), INFX (infection/debridement), AMPU (amputation).
 *
 * CPT codes are standard AMA Orthopaedic Surgery codes applied from domain
 * knowledge. Links to main_diags are added by migration 076.
 */
export class ImportOrthoProcCpts21750000000075 implements MigrationInterface {
  name = "ImportOrthoProcCpts21750000000075";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES

      -- ── SPIN: spinal procedures ──────────────────────────────────────────
      ('Lumbar microdiscectomy','SPIN','63030-00','Laminotomy with decompression and excision of a herniated lumbar intervertebral disc at one interspace to relieve nerve-root compression.','استئصال القرص القطني المجهري','بضع الصفيحة مع فك الضغط واستئصال قرص قطني منفتق في مسافة واحدة لتخفيف ضغط الجذر العصبي.'),
      ('Lumbar laminectomy and decompression','SPIN','63047-00','Removal of the lamina and ligamentum flavum to decompress the spinal canal and nerve roots in lumbar spinal stenosis.','استئصال الصفيحة القطنية وفك الضغط','إزالة الصفيحة والرباط الأصفر لفك ضغط القناة الشوكية والجذور العصبية في تضيق القناة القطنية.'),
      ('Posterolateral lumbar fusion','SPIN','22612-00','Posterior/posterolateral arthrodesis of a single lumbar segment with bone graft for instability, spondylolisthesis, or deformity.','إيثاق قطني خلفي وحشي','إيثاق خلفي/خلفي وحشي لقطعة قطنية واحدة بطعم عظمي لعدم الثبات أو الانزلاق الفقاري أو التشوه.'),
      ('Lumbar interbody fusion','SPIN','22630-00','Posterior interbody arthrodesis (PLIF/TLIF) with insertion of an interbody cage and graft to restore disc height and fuse the segment.','الإيثاق القطني بين الأجسام','إيثاق خلفي بين الأجسام (PLIF/TLIF) بإدخال قفص بين جسمين وطعم لاستعادة ارتفاع القرص وإيثاق القطعة.'),
      ('Posterior segmental spinal instrumentation','SPIN','22842-00','Placement of posterior segmental instrumentation (pedicle screws and rods) spanning the fused vertebral segments.','التثبيت القطعي الخلفي للعمود الفقري','وضع تثبيت قطعي خلفي (مسامير ساقية وقضبان) يمتد على القطع الفقرية المُيثَقة.'),
      ('Anterior cervical discectomy and fusion','SPIN','22551-00','Anterior cervical discectomy with decompression and interbody arthrodesis at a single level for disc herniation or myelopathy.','استئصال القرص العنقي الأمامي والإيثاق','استئصال القرص العنقي الأمامي مع فك الضغط والإيثاق بين الأجسام في مستوى واحد لانفتاق القرص أو اعتلال النخاع.'),
      ('Cervical laminectomy and decompression','SPIN','63045-00','Posterior cervical laminectomy to decompress the spinal cord in cervical spondylotic myelopathy or stenosis.','استئصال الصفيحة العنقية وفك الضغط','استئصال صفيحة عنقية خلفي لفك ضغط الحبل الشوكي في اعتلال النخاع الفقاري العنقي أو التضيق.'),
      ('Percutaneous kyphoplasty','SPIN','22524-00','Percutaneous balloon kyphoplasty with cement augmentation of a painful osteoporotic or pathological vertebral compression fracture.','الرأب الحدابي عبر الجلد','رأب حدابي بالبالون عبر الجلد مع تدعيم بالإسمنت لكسر فقري انضغاطي مؤلم هشاشي أو مرضي.'),
      ('Percutaneous vertebroplasty','SPIN','22514-00','Percutaneous injection of cement into a fractured vertebral body to stabilise a painful osteoporotic or pathological compression fracture.','رأب الفقرة عبر الجلد','حقن الإسمنت عبر الجلد في جسم فقري مكسور لتثبيت كسر انضغاطي مؤلم هشاشي أو مرضي.'),
      ('Posterior arthrodesis for scoliosis','SPIN','22802-00','Posterior instrumented spinal fusion of multiple segments to correct and stabilise a scoliotic deformity.','الإيثاق الخلفي للجنف','إيثاق فقري خلفي مُجهَّز لعدة قطع لتصحيح وتثبيت تشوه الجنف.'),
      ('Three-column osteotomy of spine','SPIN','22206-00','Three-column (pedicle subtraction) osteotomy for correction of fixed sagittal-plane spinal deformity.','قطع العمود الفقري ثلاثي الأعمدة','قطع ثلاثي الأعمدة (طرح ساقي) لتصحيح تشوه ثابت للعمود الفقري في المستوى السهمي.'),

      -- ── HAND: hand & wrist ───────────────────────────────────────────────
      ('Open carpal tunnel release','HAND','64721-00','Open division of the transverse carpal ligament to decompress the median nerve in carpal tunnel syndrome.','تحرير النفق الرسغي المفتوح','شق مفتوح للرباط الرسغي المعترض لفك ضغط العصب المتوسط في متلازمة النفق الرسغي.'),
      ('Ulnar nerve transposition at elbow','HAND','64718-00','Decompression and anterior transposition of the ulnar nerve at the elbow for cubital tunnel syndrome.','نقل العصب الزندي عند المرفق','فك ضغط ونقل أمامي للعصب الزندي عند المرفق لمتلازمة النفق الزندي.'),
      ('Trigger finger release','HAND','26055-00','Surgical incision of the A1 pulley to release a triggering digital flexor tendon.','تحرير الإصبع الزنادية','شق جراحي للبكرة A1 لتحرير وتر قابض إصبعي زنادي.'),
      ('De Quervain release','HAND','25000-00','Incision of the first dorsal extensor compartment to relieve De Quervain (radial styloid) tenosynovitis.','تحرير داء دي كرفان','شق الحجيرة الباسطة الظهرية الأولى لتخفيف التهاب غمد الوتر للناتئ الإبري الكعبري (داء دي كرفان).'),
      ('Palmar fasciectomy for Dupuytren contracture','HAND','26121-00','Excision of diseased palmar fascia to correct a Dupuytren flexion contracture and restore digital extension.','استئصال اللفافة الراحية لتقفّع دوبويتران','استئصال اللفافة الراحية المريضة لتصحيح تقفّع دوبويتران الانثنائي واستعادة بسط الأصابع.'),
      ('Excision of ganglion of wrist','HAND','25111-00','Surgical excision of a primary wrist ganglion cyst including its capsular stalk to minimise recurrence.','استئصال الكيسة العقدية للرسغ','استئصال جراحي لكيسة عقدية أولية في الرسغ مع ساقها المحفظي للتقليل من النكس.'),
      ('Extensor tendon repair for mallet finger','HAND','26418-00','Primary repair of the terminal extensor tendon (or fixation of bony avulsion) to correct a mallet-finger deformity.','إصلاح الوتر الباسط للإصبع المطرقية','إصلاح أولي للوتر الباسط الطرفي (أو تثبيت القلع العظمي) لتصحيح تشوه الإصبع المطرقية.'),
      ('Endoscopic carpal tunnel release','HAND','29848-00','Endoscopic division of the transverse carpal ligament to decompress the median nerve through a small incision.','تحرير النفق الرسغي بالمنظار','شق بالمنظار للرباط الرسغي المعترض لفك ضغط العصب المتوسط عبر شق صغير.'),

      -- ── FOOT: foot & ankle ───────────────────────────────────────────────
      ('Hallux valgus correction with metatarsal osteotomy','FOOT','28296-00','Bunionectomy with distal first-metatarsal osteotomy and soft-tissue balancing to correct hallux valgus.','تصحيح الوكع الأبهمي بقطع العظم المشطي','استئصال الوكعة مع قطع عظم المشط الأول البعيد وموازنة الأنسجة الرخوة لتصحيح الوكع الأبهمي.'),
      ('Hammertoe correction','FOOT','28285-00','Correction of a hammertoe deformity by interphalangeal arthrodesis or arthroplasty with flexor/extensor balancing.','تصحيح إصبع القدم المطرقية','تصحيح تشوه إصبع القدم المطرقية بإيثاق أو رأب المفصل بين السلاميات مع موازنة الأوتار القابضة والباسطة.'),
      ('Primary repair of ruptured Achilles tendon','FOOT','27650-00','Open primary suture repair of an acutely ruptured Achilles tendon to restore plantarflexion power.','الإصلاح الأولي لتمزق وتر أخيل','إصلاح أولي مفتوح بالخياطة لتمزق حاد في وتر أخيل لاستعادة قوة الثني الأخمصي.'),
      ('Plantar fasciotomy','FOOT','28060-00','Partial release/excision of the plantar fascia at its calcaneal origin for refractory plantar fasciitis.','بضع اللفافة الأخمصية','تحرير/استئصال جزئي للفافة الأخمصية عند منشئها العقبي لالتهاب اللفافة الأخمصية العنيد.'),
      ('Excision of interdigital (Morton) neuroma','FOOT','28080-00','Excision of an interdigital plantar nerve neuroma (Morton neuroma) from the affected web space.','استئصال ورم مورتون العصبي','استئصال ورم عصبي للعصب الأخمصي بين الأصابع (ورم مورتون) من المسافة المصابة.'),
      ('Ankle arthrodesis','FOOT','27870-00','Surgical fusion of the tibiotalar joint for end-stage ankle arthritis to provide a stable, pain-free ankle.','إيثاق مفصل الكاحل','إيثاق جراحي للمفصل الظنبوبي القعبي للفصال المتقدم لتوفير كاحل ثابت خالٍ من الألم.'),
      ('Triple arthrodesis of the hindfoot','FOOT','28715-00','Fusion of the subtalar, talonavicular, and calcaneocuboid joints to correct a rigid hindfoot deformity (eg, flatfoot).','الإيثاق الثلاثي لمؤخرة القدم','إيثاق المفاصل تحت الكاحل والقعبي الزورقي والعقبي النردي لتصحيح تشوه ثابت في مؤخرة القدم (مثل القدم المسطحة).'),
      ('Calcaneal osteotomy','FOOT','28300-00','Osteotomy of the calcaneus to realign the hindfoot in flexible flatfoot or hindfoot malalignment.','قطع عظم العقب','قطع عظم العقب لإعادة محاذاة مؤخرة القدم في القدم المسطحة المرنة أو سوء محاذاة مؤخرة القدم.'),

      -- ── SOFT: soft tissue / tendon ───────────────────────────────────────
      ('Open repair of rotator cuff, acute','SOFT','23410-00','Open reattachment of an acutely torn rotator cuff tendon to the greater tuberosity.','الإصلاح المفتوح للكفة المدورة الحاد','إعادة تثبيت مفتوحة لوتر الكفة المدورة الممزق حديثاً إلى الحدبة الكبرى.'),
      ('Open repair of rotator cuff, chronic','SOFT','23412-00','Open repair of a chronic rotator cuff tear, often with mobilisation and tendon advancement.','الإصلاح المفتوح للكفة المدورة المزمن','إصلاح مفتوح لتمزق مزمن في الكفة المدورة، غالباً مع تحرير الوتر وتقديمه.'),
      ('Biceps tenodesis','SOFT','23430-00','Tenodesis of the long head of biceps to the proximal humerus for biceps tendinopathy or SLAP pathology.','إيثاق وتر العضلة ذات الرأسين','إيثاق الرأس الطويل للعضلة ذات الرأسين إلى العضد القريب لاعتلال وتر العضلة أو إصابة الشفا العلوي.'),
      ('Primary repair of patellar or quadriceps tendon','SOFT','27380-00','Primary suture repair of a ruptured patellar or quadriceps tendon to restore the knee extensor mechanism.','الإصلاح الأولي لوتر الرضفة أو رباعية الرؤوس','إصلاح أولي بالخياطة لتمزق وتر الرضفة أو العضلة رباعية الرؤوس لاستعادة آلية بسط الركبة.'),
      ('Extra-articular ligament reconstruction of knee','SOFT','27427-00','Extra-articular ligamentous reconstruction/augmentation of the knee (eg, MCL, LCL, or MPFL) for instability.','إعادة بناء رباط الركبة خارج المفصل','إعادة بناء/تدعيم رباطي خارج المفصل للركبة (مثل الرباط الجانبي الإنسي أو الوحشي أو الرضفي الفخذي) لعدم الثبات.'),
      ('Manipulation of shoulder under anaesthesia','SOFT','23700-00','Closed manipulation of the shoulder under anaesthesia to restore range of motion in adhesive capsulitis.','تحريك الكتف تحت التخدير','تحريك مغلق للكتف تحت التخدير لاستعادة مدى الحركة في التهاب المحفظة اللاصق.'),

      -- ── TUMR: bone tumour ────────────────────────────────────────────────
      ('Percutaneous needle bone biopsy','TUMR','20225-00','Image-guided percutaneous needle biopsy of a deep bone lesion to obtain tissue for histological diagnosis.','خزعة العظم بالإبرة عبر الجلد','خزعة بالإبرة عبر الجلد موجّهة بالتصوير لآفة عظمية عميقة للحصول على نسيج للتشخيص النسيجي.'),
      ('Open bone biopsy','TUMR','20245-00','Open incisional biopsy of a deep bone lesion through a carefully planned approach along the future resection line.','خزعة العظم المفتوحة','خزعة شقّية مفتوحة لآفة عظمية عميقة عبر مدخل مخطط بعناية على امتداد خط الاستئصال المستقبلي.'),
      ('Radical resection of bone tumour, femur or knee','TUMR','27365-00','Wide en-bloc resection of a malignant bone tumour of the distal femur or proximal tibia, typically with endoprosthetic reconstruction (limb salvage).','الاستئصال الجذري لورم العظم في الفخذ أو الركبة','استئصال واسع بالكتلة لورم عظمي خبيث في الفخذ البعيد أو الظنبوب القريب، عادةً مع إعادة بناء بطرف صناعي (إنقاذ الطرف).'),
      ('Radical resection of bone tumour, proximal humerus','TUMR','23220-00','Wide resection of a malignant bone tumour of the proximal humerus with reconstruction.','الاستئصال الجذري لورم العظم في العضد القريب','استئصال واسع لورم عظمي خبيث في العضد القريب مع إعادة البناء.'),
      ('Curettage of bone cyst or benign tumour','TUMR','27355-00','Intralesional curettage of a bone cyst or benign tumour of the femur, often with adjuvant and bone grafting.','كشط الكيسة أو الورم العظمي الحميد','كشط داخل الآفة لكيسة أو ورم عظمي حميد في الفخذ، غالباً مع علاج مساعد وترقيع عظمي.'),
      ('Excision of bone tumour','TUMR','27065-00','Excision of a benign bone tumour (eg, osteochondroma or osteoid osteoma), with bone graft as needed.','استئصال الورم العظمي','استئصال ورم عظمي حميد (مثل الورم العظمي الغضروفي أو العظماني السمحاقي) مع ترقيع عظمي عند الحاجة.'),

      -- ── OSTE: osteotomy / deformity ──────────────────────────────────────
      ('High tibial osteotomy','OSTE','27457-00','Proximal tibial osteotomy to realign the mechanical axis and offload a degenerate knee compartment.','قطع الظنبوب العلوي','قطع الظنبوب القريب لإعادة محاذاة المحور الميكانيكي وتخفيف الحمل عن حجرة ركبة متنكسة.'),
      ('Proximal femoral osteotomy','OSTE','27165-00','Intertrochanteric/subtrochanteric femoral osteotomy to correct deformity or redirect the femoral head.','قطع الفخذ القريب','قطع الفخذ بين المدورين/تحت المدور لتصحيح التشوه أو إعادة توجيه رأس الفخذ.'),
      ('Periacetabular osteotomy','OSTE','27146-00','Innominate/periacetabular osteotomy to reorient the acetabulum and improve femoral-head coverage in hip dysplasia.','قطع العظم حول الحُق','قطع العظم الحرقفي/حول الحُق لإعادة توجيه الحُق وتحسين تغطية رأس الفخذ في خلل تنسج الورك.'),
      ('Humeral osteotomy','OSTE','24400-00','Corrective osteotomy of the humerus with internal fixation for malunion or rotational/angular deformity.','قطع عظم العضد','قطع عظم العضد التصحيحي مع تثبيت داخلي للالتحام المعيب أو التشوه الدوراني/الزاوي.'),

      -- ── PEDS: paediatric ─────────────────────────────────────────────────
      ('In-situ pinning of slipped capital femoral epiphysis','PEDS','27176-00','Percutaneous in-situ screw fixation of a slipped capital femoral epiphysis to prevent further slip.','تثبيت انزلاق المشاش الفخذي في الموضع','تثبيت عبر الجلد بمسمار في الموضع لانزلاق المشاش الفخذي العلوي لمنع المزيد من الانزلاق.'),
      ('Closed reduction of developmental hip dislocation','PEDS','27257-00','Closed reduction under anaesthesia and spica casting of a developmentally dislocated hip in an infant/child.','الرد المغلق لخلع الورك التطوري','رد مغلق تحت التخدير وتجبير سبيكا لورك مخلوع تطورياً لدى رضيع/طفل.'),
      ('Open reduction of developmental hip dislocation','PEDS','27258-00','Open reduction of a developmentally dislocated hip, removing obstacles to reduction with capsulorrhaphy.','الرد المفتوح لخلع الورك التطوري','رد مفتوح لورك مخلوع تطورياً مع إزالة عوائق الرد ورأب المحفظة.'),
      ('Percutaneous Achilles tenotomy','PEDS','27606-00','Percutaneous tenotomy of the Achilles tendon as part of the Ponseti correction of congenital clubfoot.','بضع وتر أخيل عبر الجلد','بضع وتر أخيل عبر الجلد كجزء من تصحيح بونسيتي لحنف القدم الخلقي.'),
      ('Application of clubfoot cast','PEDS','29450-00','Serial manipulation and long-leg casting of a congenital clubfoot per the Ponseti method.','تطبيق جبيرة حنف القدم','تحريك متسلسل وتجبير طويل للساق لحنف القدم الخلقي وفق طريقة بونسيتي.'),
      ('Guided growth hemiepiphysiodesis','PEDS','27485-00','Hemiepiphysiodesis (tension-band/plate) across a growth plate to gradually correct an angular limb deformity in a growing child.','إيثاق نصف المشاش الموجّه للنمو','إيثاق نصف المشاش (شريط شد/صفيحة) عبر صفيحة النمو لتصحيح تدريجي لتشوه طرفي زاوي لدى طفل في طور النمو.'),

      -- ── INFX: infection / debridement ────────────────────────────────────
      ('Sequestrectomy of femur for osteomyelitis','INFX','27303-00','Surgical sequestrectomy and deep debridement of the femur/knee region for osteomyelitis or bone abscess.','استئصال العظم النخر للفخذ في التهاب العظم والنقي','استئصال العظم النخر وتنضير عميق لمنطقة الفخذ/الركبة لالتهاب العظم والنقي أو خراج العظم.'),
      ('Arthrotomy of knee with drainage','INFX','27310-00','Open arthrotomy of the knee with irrigation and drainage for septic arthritis or joint infection.','بضع مفصل الركبة مع التصريف','بضع مفتوح لمفصل الركبة مع الغسل والتصريف لالتهاب المفصل الإنتاني أو عدوى المفصل.'),
      ('Arthrotomy of glenohumeral joint for drainage','INFX','23040-00','Open arthrotomy of the glenohumeral joint with irrigation and drainage for shoulder septic arthritis.','بضع المفصل العضدي الحقاني للتصريف','بضع مفتوح للمفصل العضدي الحقاني مع الغسل والتصريف لالتهاب مفصل الكتف الإنتاني.'),
      ('Arthrotomy of hip with drainage','INFX','27030-00','Open arthrotomy of the hip with irrigation and drainage for septic arthritis of the hip.','بضع مفصل الورك للتصريف','بضع مفتوح لمفصل الورك مع الغسل والتصريف لالتهاب مفصل الورك الإنتاني.'),
      ('Debridement of infected bone','INFX','11044-00','Excisional debridement of infected bone and overlying soft tissue as part of osteomyelitis management.','تنضير العظم المصاب بالعدوى','تنضير استئصالي للعظم المصاب بالعدوى والنسيج الرخو المغطّي كجزء من إدارة التهاب العظم والنقي.'),

      -- ── AMPU: amputation ─────────────────────────────────────────────────
      ('Above-knee amputation','AMPU','27590-00','Amputation through the femur (transfemoral) for unsalvageable lower-limb trauma, ischaemia, infection, or tumour.','بتر فوق الركبة','بتر عبر عظم الفخذ للطرف السفلي غير القابل للإنقاذ بسبب الرضح أو نقص التروية أو العدوى أو الورم.'),
      ('Below-knee amputation','AMPU','27880-00','Amputation through the tibia and fibula (transtibial), preserving the knee for improved prosthetic function.','بتر تحت الركبة','بتر عبر الظنبوب والشظية مع الحفاظ على الركبة لتحسين الوظيفة بالطرف الصناعي.'),
      ('Transmetatarsal amputation','AMPU','28805-00','Amputation through the metatarsals, commonly for diabetic forefoot gangrene or infection.','بتر عبر مشط القدم','بتر عبر عظام مشط القدم، شائع لغنغرينة أو عدوى مقدمة القدم السكرية.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('SPIN','HAND','FOOT','SOFT','TUMR','OSTE','PEDS','INFX','AMPU')
    `);
  }
}
