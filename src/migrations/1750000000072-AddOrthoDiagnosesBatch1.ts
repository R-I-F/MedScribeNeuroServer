import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ORTHO coverage extension — batch 1 (34 diagnoses).
 * Categories: anterior cruciate ligament injury, fractures (lower extremity),
 * fractures (spine), fractures (upper extremity), meniscal tears,
 * osteoarthritis, osteomyelitis & septic joint, osteonecrosis.
 *
 * All ICD-11 codes verified via icd11_search. Codes already present in the
 * shared table (e.g. NB52.10 owned by NS) are skipped by ON CONFLICT and simply
 * linked to ORTHO. FB81.0 was freed by migration 070 (recode of intertrochanteric
 * fracture) and is reused here for idiopathic aseptic osteonecrosis.
 */
export class AddOrthoDiagnosesBatch11750000000072 implements MigrationInterface {
  name = "AddOrthoDiagnosesBatch11750000000072";

  private static readonly CODES = [
    // ACL injury
    "NC93.63", "NC93.52", "NC93.1Z", "NC76.1Y",
    // fractures (lower extremity)
    "NC92.1Z", "ND13.0", "ND13.1", "ND13.3", "NC92.6", "NC73.0Z", "NC92.4Z",
    // fractures (spine)
    "NB52.10", "NA22.1Z",
    // fractures (upper extremity)
    "NC12.2Z", "NC12.3", "NC12.4Z", "NC32.0", "NC32.1", "NC53.0", "NC33.1",
    // meniscal tears
    "NC93.30", "NC93.31", "FA33.2", "NC93.3Y",
    // osteoarthritis
    "FA02.Z", "FA03.Z", "FA05",
    // osteomyelitis & septic joint
    "FB84.1", "FA90.Z", "1B12.40",
    // osteonecrosis
    "FB81.0", "FB81.2", "FB81.4", "FB81.Y",
  ];

  private async linkMain(runner: QueryRunner, mainDiag: string, codes: string[]): Promise<void> {
    await runner.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md
       JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'ORTHO' AND md.title = $1 AND d."icdCode" = ANY($2)
       ON CONFLICT DO NOTHING`,
      [mainDiag, codes]
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      ('NC93.63','rupture of posterior cruciate ligament','تمزق الرباط الصليبي الخلفي','Traumatic rupture of the posterior cruciate ligament, usually from a dashboard injury or hyperflexion; presents with posterior knee instability and a positive posterior drawer; isolated tears are often managed conservatively, combined/high-grade injuries with reconstruction.','تمزق رضي للرباط الصليبي الخلفي ينجم عادةً عن إصابة لوحة القيادة أو فرط الثني؛ يتظاهر بعدم ثبات خلفي للركبة وعلامة الدرج الخلفي الإيجابية؛ تُعالج التمزقات المنفردة محافظةً غالباً والإصابات المركبة بإعادة البناء.'),
      ('NC93.52','rupture of medial collateral ligament of knee','تمزق الرباط الجانبي الإنسي للركبة','Tear of the medial (tibial) collateral ligament from a valgus stress to the knee; causes medial joint-line pain and valgus laxity; most isolated grade I–II tears heal with bracing, while grade III or multiligament injuries may require repair or reconstruction.','تمزق الرباط الجانبي الإنسي (الظنبوبي) للركبة بفعل إجهاد أروح؛ يسبب ألماً على خط المفصل الإنسي وارتخاءً أروحياً؛ تلتئم معظم التمزقات المنفردة من الدرجتين الأولى والثانية بالتجبير، بينما قد تستلزم الدرجة الثالثة أو الإصابات متعددة الأربطة الإصلاح أو إعادة البناء.'),
      ('NC93.1Z','dislocation of patella','خلع الرضفة','Lateral displacement of the patella out of the trochlear groove, often during a twisting injury with the knee in flexion; predisposed by trochlear dysplasia and patella alta; recurrent dislocation may require MPFL reconstruction or a tibial-tubercle realignment.','إزاحة وحشية للرضفة خارج الأخدود البكري، تحدث غالباً أثناء إصابة التوائية والركبة في وضع الثني؛ يهيّئ لها خلل التنسج البكري وارتفاع الرضفة؛ قد يستلزم الخلع المتكرر إعادة بناء الرباط الرضفي الفخذي الإنسي أو إعادة محاذاة الأحدوبة الظنبوبية.'),
      ('NC76.1Y','rupture of quadriceps tendon','تمزق وتر العضلة رباعية الرؤوس','Rupture of the quadriceps tendon above the patella, typically in patients over 40 with a sudden eccentric load; presents with a suprapatellar gap and inability to actively extend the knee; treated by urgent surgical repair to restore the extensor mechanism.','تمزق وتر العضلة رباعية الرؤوس فوق الرضفة، يحدث عادةً لدى من تجاوزوا الأربعين مع حمل لا مركزي مفاجئ؛ يتظاهر بفجوة فوق الرضفة وعجز عن بسط الركبة فاعلاً؛ يُعالج بالإصلاح الجراحي العاجل لاستعادة آلية البسط.'),

      ('NC92.1Z','fracture of upper end of tibia','كسر النهاية العلوية لعظم الظنبوب','Tibial plateau fracture involving the articular surface of the proximal tibia, commonly from axial loading or high-energy trauma; classified by Schatzker type; displaced or depressed fractures require open reduction and internal fixation to restore joint congruity.','كسر هضبة الظنبوب المتضمن للسطح المفصلي للنهاية القريبة من الظنبوب، ينجم عادةً عن تحميل محوري أو رضح عالي الطاقة؛ يُصنَّف وفق نمط شاتزكر؛ تستلزم الكسور المنزاحة أو المنخسفة الرد المفتوح والتثبيت الداخلي لاستعادة تطابق المفصل.'),
      ('ND13.0','fracture of calcaneus','كسر العقب','Fracture of the heel bone, usually from an axial load such as a fall from height; intra-articular displaced fractures involving the subtalar joint may require ORIF; associated with spinal and lower-limb injuries that must be excluded.','كسر عظم العقب، ينجم عادةً عن حمل محوري كالسقوط من ارتفاع؛ قد تستلزم الكسور المنزاحة داخل المفصل المتضمنة للمفصل تحت الكاحل الرد المفتوح والتثبيت الداخلي؛ يرتبط بإصابات العمود الفقري والطرف السفلي الواجب استبعادها.'),
      ('ND13.1','fracture of talus','كسر عظم القَعَب','Fracture of the talus, frequently of the neck, from forced dorsiflexion; carries a high risk of avascular necrosis owing to the precarious blood supply; displaced fractures require urgent anatomical reduction and fixation.','كسر عظم القَعَب، وكثيراً ما يكون في العنق نتيجة فرط الثني الظهري؛ يحمل خطراً مرتفعاً للنخر اللاوعائي بسبب الإمداد الدموي الهش؛ تستلزم الكسور المنزاحة رداً تشريحياً وتثبيتاً عاجلين.'),
      ('ND13.3','fracture of metatarsal bone','كسر عظم مشط القدم','Fracture of a metatarsal bone from direct trauma or stress; fifth-metatarsal base (Jones) fractures have a high non-union risk; most are treated conservatively, while displaced or Jones fractures in athletes may need fixation.','كسر عظم مشطي للقدم نتيجة رضح مباشر أو إجهاد؛ كسور قاعدة المشط الخامس (كسر جونز) ترتفع فيها مخاطر عدم الالتئام؛ تُعالج معظمها محافظةً، بينما قد تحتاج الكسور المنزاحة أو كسور جونز لدى الرياضيين إلى تثبيت.'),
      ('NC92.6','fracture of lateral malleolus','كسر الكعب الوحشي','Fracture of the distal fibula at the ankle (lateral malleolus); classified by the Weber system relative to the syndesmosis; stable isolated fractures are managed in a boot, while unstable or bimalleolar patterns require ORIF.','كسر الشظية البعيدة عند الكاحل (الكعب الوحشي)؛ يُصنَّف بنظام فيبر نسبةً إلى الارتفاق؛ تُعالج الكسور المستقرة المنفردة بحذاء طبي، بينما تستلزم الأنماط غير المستقرة أو مزدوجة الكعب الرد المفتوح والتثبيت الداخلي.'),
      ('NC73.0Z','dislocation of hip','خلع الورك','Traumatic dislocation of the hip, usually posterior from a dashboard injury; an orthopaedic emergency requiring prompt reduction to reduce the risk of femoral-head avascular necrosis; associated acetabular fractures must be excluded.','خلع رضي للورك، يكون عادةً خلفياً نتيجة إصابة لوحة القيادة؛ حالة إسعافية عظمية تستلزم رداً عاجلاً للحد من خطر النخر اللاوعائي لرأس الفخذ؛ يجب استبعاد كسور الحُق المرافقة.'),
      ('NC92.4Z','fracture of fibula','كسر الشظية','Fracture of the fibular shaft from direct trauma or in association with tibial/ankle injuries; isolated shaft fractures are usually stable and treated conservatively unless associated with ankle instability.','كسر جدل الشظية نتيجة رضح مباشر أو بالاقتران مع إصابات الظنبوب أو الكاحل؛ كسور الجدل المنفردة مستقرة عادةً وتُعالج محافظةً ما لم ترافقها عدم ثباتية الكاحل.'),

      ('NB52.10','fracture of sacrum','كسر العجز','Fracture of the sacrum, often part of a pelvic-ring injury or from a fall; Denis zone classification guides risk to sacral nerve roots; displaced or neurologically involved fractures may require lumbopelvic fixation.','كسر العجز، يكون غالباً جزءاً من إصابة حلقة الحوض أو نتيجة سقوط؛ يوجّه تصنيف مناطق دينيس خطر إصابة الجذور العصبية العجزية؛ قد تستلزم الكسور المنزاحة أو ذات الإصابة العصبية تثبيتاً قطنياً حوضياً.'),
      ('NA22.1Z','fracture of second cervical vertebra','كسر الفقرة العنقية الثانية','Fracture of the axis (C2), including odontoid (dens) and hangman fractures; a common cervical-spine injury in the elderly after falls; management ranges from rigid collar to halo immobilisation or surgical fixation depending on type and displacement.','كسر الفقرة المحورية (C2)، ويشمل كسور السن (النتوء السني) وكسر الجلّاد؛ إصابة شائعة للعمود العنقي لدى المسنين بعد السقوط؛ تتراوح المعالجة بين الطوق الصلب وتثبيت الهالة أو التثبيت الجراحي حسب النمط والإزاحة.'),

      ('NC12.2Z','fracture of upper end of humerus','كسر النهاية العلوية لعظم العضد','Proximal humerus fracture, common in osteoporotic elderly after a fall; classified by the Neer system on the number of displaced parts; most minimally displaced fractures are treated non-operatively, while displaced multipart fractures may need fixation or arthroplasty.','كسر النهاية القريبة لعظم العضد، شائع لدى المسنين المصابين بترقق العظام بعد السقوط؛ يُصنَّف بنظام نير وفق عدد الأجزاء المنزاحة؛ تُعالج معظم الكسور قليلة الإزاحة محافظةً، بينما قد تحتاج الكسور المنزاحة متعددة الأجزاء إلى تثبيت أو استبدال مفصل.'),
      ('NC12.3','fracture of shaft of humerus','كسر جدل عظم العضد','Fracture of the humeral diaphysis; at risk of radial nerve injury causing wrist drop; most are treated in a functional brace, with fixation reserved for open fractures, polytrauma, or failure of alignment.','كسر جدل عظم العضد؛ معرّض لإصابة العصب الكعبري المسببة لتدلي الرسغ؛ تُعالج معظمها بجبيرة وظيفية، ويُحتفظ بالتثبيت للكسور المفتوحة ومتعدد الرضوح أو فشل المحاذاة.'),
      ('NC12.4Z','fracture of lower end of humerus','كسر النهاية السفلية لعظم العضد','Distal humerus fracture, including supracondylar fractures common in children; intra-articular adult fractures usually require ORIF; neurovascular status (brachial artery, median/radial/ulnar nerves) must be assessed.','كسر النهاية البعيدة لعظم العضد، ويشمل الكسور فوق اللقمية الشائعة لدى الأطفال؛ تستلزم كسور البالغين داخل المفصل عادةً الرد المفتوح والتثبيت الداخلي؛ يجب تقييم الحالة الوعائية العصبية (الشريان العضدي والأعصاب المتوسط والكعبري والزندي).'),
      ('NC32.0','fracture of upper end of ulna','كسر النهاية العلوية لعظم الزند','Fracture of the proximal ulna, typically the olecranon, from a fall onto the elbow or direct trauma; displaced fractures disrupt the extensor mechanism and require tension-band wiring or plate fixation.','كسر النهاية القريبة لعظم الزند، وهو عادةً الزُّج (النتوء المرفقي)، نتيجة السقوط على المرفق أو رضح مباشر؛ تعطّل الكسور المنزاحة آلية البسط وتستلزم تثبيتاً بسلك شد التوتر أو بصفيحة.'),
      ('NC32.1','fracture of head of radius','كسر رأس عظم الكعبرة','Radial head fracture from a fall on an outstretched hand; the commonest elbow fracture in adults; classified by Mason; non-displaced fractures are mobilised early, while comminuted fractures may need fixation or radial-head replacement.','كسر رأس عظم الكعبرة نتيجة السقوط على يد ممدودة؛ أشيع كسور المرفق لدى البالغين؛ يُصنَّف بتصنيف ميسون؛ تُحرَّك الكسور غير المنزاحة مبكراً، بينما قد تحتاج الكسور المفتتة إلى تثبيت أو استبدال رأس الكعبرة.'),
      ('NC53.0','fracture of scaphoid bone of hand','كسر العظم الزورقي لليد','Fracture of the scaphoid from a fall on the outstretched hand; presents with anatomical-snuffbox tenderness; high non-union and avascular-necrosis risk (especially proximal pole) warrants a low threshold for casting or percutaneous screw fixation.','كسر العظم الزورقي نتيجة السقوط على يد ممدودة؛ يتظاهر بإيلام في علبة السعوط التشريحية؛ ارتفاع خطر عدم الالتئام والنخر اللاوعائي (خاصةً القطب القريب) يستوجب عتبة منخفضة للتجبير أو التثبيت بمسمار عبر الجلد.'),
      ('NC33.1','dislocation of elbow','خلع المرفق','Traumatic dislocation of the elbow, most often posterolateral, from a fall on the outstretched hand; reduced under sedation and checked for associated fractures (terrible triad); early mobilisation prevents stiffness.','خلع رضي للمرفق، غالباً خلفي وحشي، نتيجة السقوط على يد ممدودة؛ يُرَد تحت التركين ويُفحَص للكسور المرافقة (الثالوث المروّع)؛ التحريك المبكر يمنع التيبس.'),

      ('NC93.30','tear of medial meniscus','تمزق الغضروف الهلالي الإنسي','Tear of the medial meniscus, often from a twisting injury or degeneration; presents with joint-line pain, catching, and effusion; symptomatic tears are managed by arthroscopic meniscal repair or partial meniscectomy.','تمزق الغضروف الهلالي الإنسي، يحدث غالباً بإصابة التوائية أو بالتنكس؛ يتظاهر بألم خط المفصل والانحشار والانصباب؛ تُعالج التمزقات العرضية بالإصلاح أو الاستئصال الجزئي بالمنظار.'),
      ('NC93.31','tear of lateral meniscus','تمزق الغضروف الهلالي الوحشي','Tear of the lateral meniscus, often associated with ACL injuries; presents with lateral joint-line pain and mechanical symptoms; treated arthroscopically by repair or partial meniscectomy depending on tear pattern and vascularity.','تمزق الغضروف الهلالي الوحشي، يرافق غالباً إصابات الرباط الصليبي الأمامي؛ يتظاهر بألم خط المفصل الوحشي وأعراض ميكانيكية؛ يُعالج بالمنظار إصلاحاً أو استئصالاً جزئياً حسب نمط التمزق والتروية.'),
      ('FA33.2','derangement of meniscus due to old tear or injury','اختلال الغضروف الهلالي بسبب تمزق أو إصابة قديمة','Chronic internal derangement of the knee from an old meniscal tear; presents with recurrent locking, instability, and degenerative joint-line changes; arthroscopic debridement or partial meniscectomy relieves mechanical symptoms.','اختلال داخلي مزمن للركبة ناجم عن تمزق هلالي قديم؛ يتظاهر بانغلاق متكرر وعدم ثبات وتغيرات تنكسية على خط المفصل؛ يخفّف التنضير أو الاستئصال الجزئي بالمنظار الأعراض الميكانيكية.'),
      ('NC93.3Y','other specified current tear of meniscus','تمزق حالي آخر محدد للغضروف الهلالي','Other specified acute meniscal tear patterns (e.g. bucket-handle, radial, root tears) not classified as purely medial or lateral; bucket-handle tears cause a locked knee and warrant urgent arthroscopic repair.','أنماط أخرى محددة من التمزقات الهلالية الحادة (مثل تمزق مقبض الدلو والتمزق الشعاعي وتمزق الجذر) غير المصنفة كإنسية أو وحشية صرفة؛ يسبب تمزق مقبض الدلو ركبةً مقفلة ويستوجب إصلاحاً بالمنظار عاجلاً.'),

      ('FA02.Z','osteoarthritis of wrist or hand','الفصال العظمي للرسغ أو اليد','Degenerative osteoarthritis of the wrist or hand joints, classically the thumb carpometacarpal (basal) joint; presents with pain, stiffness, and grip weakness; surgical options include trapeziectomy or joint arthrodesis when conservative care fails.','الفصال العظمي التنكسي لمفاصل الرسغ أو اليد، وكلاسيكياً المفصل الرسغي السنعي للإبهام (القاعدي)؛ يتظاهر بألم وتيبّس وضعف القبض؛ تشمل الخيارات الجراحية استئصال شبه المنحرف أو إيثاق المفصل عند فشل العلاج المحافظ.'),
      ('FA03.Z','osteoarthritis of ankle','الفصال العظمي للكاحل','Osteoarthritis of the ankle, most often post-traumatic following a malleolar fracture; presents with pain, stiffness, and reduced range of motion; advanced disease is treated by ankle arthrodesis or total ankle replacement.','الفصال العظمي للكاحل، وأكثره رضي المنشأ بعد كسر الكعب؛ يتظاهر بألم وتيبّس ونقص مدى الحركة؛ يُعالج المرض المتقدم بإيثاق الكاحل أو استبدال مفصل الكاحل الكامل.'),
      ('FA05','polyosteoarthritis','الفصال العظمي المتعدد','Generalised osteoarthritis affecting multiple joints, often involving the hands, knees, and hips in the same patient; managed with analgesia, physiotherapy, and joint-specific surgery (arthroplasty) for the most affected joints.','فصال عظمي معمّم يصيب عدة مفاصل، ويشمل غالباً اليدين والركبتين والوركين في المريض نفسه؛ يُدار بالمسكنات والعلاج الطبيعي والجراحة الخاصة بالمفصل (استبدال المفصل) للمفاصل الأشد تأثراً.'),

      ('FB84.1','acute osteomyelitis','التهاب العظم والنقي الحاد','Acute infection of bone, usually haematogenous in children (metaphysis of long bones) or contiguous in adults; presents with localised pain, fever, and raised inflammatory markers; treated with prolonged antibiotics and surgical drainage/debridement when abscess or sequestrum forms.','عدوى حادة في العظم، تكون عادةً دموية المنشأ لدى الأطفال (مشاش العظام الطويلة) أو بالتماس لدى البالغين؛ تتظاهر بألم موضعي وحمى وارتفاع واسمات الالتهاب؛ تُعالج بمضادات حيوية مطوَّلة وتصريف/تنضير جراحي عند تكوّن خراج أو عظم نخر.'),
      ('FA90.Z','infection of vertebra','عدوى الفقرة','Vertebral osteomyelitis/spondylodiscitis, infection of a vertebral body and adjacent disc, often haematogenous (Staph aureus or, endemically, tuberculous); presents with insidious back pain and raised inflammatory markers; MRI is diagnostic; treated with targeted antibiotics and surgery for instability, abscess, or neural compromise.','التهاب الفقار والقرص، عدوى جسم الفقرة والقرص المجاور، تكون غالباً دموية المنشأ (المكورات العنقودية الذهبية أو السل في المناطق الموبوءة)؛ تتظاهر بألم ظهر ماكر وارتفاع واسمات الالتهاب؛ التصوير بالرنين تشخيصي؛ تُعالج بمضادات حيوية موجهة والجراحة عند عدم الثبات أو الخراج أو الإصابة العصبية.'),
      ('1B12.40','tuberculosis of bones or joints','سل العظام والمفاصل','Skeletal tuberculosis, including Pott disease of the spine and tuberculous arthritis of large joints; presents with chronic pain, swelling, and cold abscesses; treated with prolonged antituberculous chemotherapy and surgery for deformity, instability, or neural compression.','السل الهيكلي، ويشمل داء بوت في العمود الفقري والتهاب المفاصل السلي للمفاصل الكبيرة؛ يتظاهر بألم مزمن وتورّم وخراجات باردة؛ يُعالج بعلاج كيميائي مضاد للسل مطوَّل والجراحة عند التشوه أو عدم الثبات أو الانضغاط العصبي.'),

      ('FB81.0','idiopathic aseptic osteonecrosis','النخر العظمي اللاإنتاني مجهول السبب','Avascular (aseptic) necrosis of bone of unknown cause, classically of the femoral head; ischaemia leads to subchondral collapse and secondary osteoarthritis; early disease may be treated with core decompression, advanced collapse with arthroplasty.','نخر عظمي لاوعائي (لاإنتاني) مجهول السبب، وكلاسيكياً في رأس الفخذ؛ يؤدي نقص التروية إلى انهيار تحت غضروفي وفصال عظمي ثانوي؛ يُعالج المرض المبكر بفك ضغط النواة، والانهيار المتقدم باستبدال المفصل.'),
      ('FB81.2','drug-induced osteonecrosis','النخر العظمي المحدث بالأدوية','Osteonecrosis caused by drugs, most commonly long-term corticosteroids (also bisphosphonates causing jaw necrosis); the femoral head is frequently affected; management mirrors other osteonecrosis with core decompression or arthroplasty.','نخر عظمي ناجم عن الأدوية، وأشيعها الستيرويدات القشرية طويلة الأمد (وكذلك البيسفوسفونات المسببة لنخر الفك)؛ يتأثر رأس الفخذ كثيراً؛ تماثل المعالجة سائر أنواع النخر بفك ضغط النواة أو استبدال المفصل.'),
      ('FB81.4','osteonecrosis due to haemoglobinopathy','النخر العظمي بسبب اعتلال الخضاب','Osteonecrosis secondary to a haemoglobinopathy, classically sickle-cell disease causing femoral- and humeral-head avascular necrosis from microvascular occlusion; managed with supportive care, joint-preserving surgery, or arthroplasty for collapse.','نخر عظمي ثانوي لاعتلال الخضاب، وكلاسيكياً فقر الدم المنجلي المسبب لنخر لاوعائي في رأسي الفخذ والعضد بسبب انسداد الأوعية الدقيقة؛ يُدار بالرعاية الداعمة والجراحة الحافظة للمفصل أو استبدال المفصل عند الانهيار.'),
      ('FB81.Y','other specified osteonecrosis','نخر عظمي آخر محدد','Other specified secondary osteonecrosis (e.g. post-radiation, dysbaric/caisson, or associated with other systemic disease) not otherwise classified; treatment targets the underlying cause and joint preservation or replacement.','نخر عظمي ثانوي آخر محدد (مثل ما بعد الإشعاع أو مرض الغطس/القيسون أو المرتبط بمرض جهازي آخر) غير المصنف بطريقة أخرى؛ يستهدف العلاج السبب الكامن والحفاظ على المفصل أو استبداله.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    // link all to ORTHO department
    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'ORTHO' AND d."icdCode" = ANY($1)
       ON CONFLICT DO NOTHING`,
      [AddOrthoDiagnosesBatch11750000000072.CODES]
    );

    // link to main_diags
    await this.linkMain(queryRunner, "anterior cruciate ligament injury", ["NC93.63", "NC93.52", "NC93.1Z", "NC76.1Y"]);
    await this.linkMain(queryRunner, "fractures (lower extremity)", ["NC92.1Z", "ND13.0", "ND13.1", "ND13.3", "NC92.6", "NC73.0Z", "NC92.4Z"]);
    await this.linkMain(queryRunner, "fractures (spine)", ["NB52.10", "NA22.1Z"]);
    await this.linkMain(queryRunner, "fractures (upper extremity)", ["NC12.2Z", "NC12.3", "NC12.4Z", "NC32.0", "NC32.1", "NC53.0", "NC33.1"]);
    await this.linkMain(queryRunner, "meniscal tears", ["NC93.30", "NC93.31", "FA33.2", "NC93.3Y"]);
    await this.linkMain(queryRunner, "osteoarthritis", ["FA02.Z", "FA03.Z", "FA05"]);
    await this.linkMain(queryRunner, "osteomyelitis & septic joint", ["FB84.1", "FA90.Z", "1B12.40"]);
    await this.linkMain(queryRunner, "osteonecrosis", ["FB81.0", "FB81.2", "FB81.4", "FB81.Y"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddOrthoDiagnosesBatch11750000000072.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))`, [codes]);
    // NB52.10 is shared (owned by NS) — do not delete the diagnosis row, only unlink (done above).
    await queryRunner.query(`DELETE FROM "diagnoses" WHERE "icdCode" = ANY($1) AND "icdCode" <> 'NB52.10'`, [codes]);
  }
}
