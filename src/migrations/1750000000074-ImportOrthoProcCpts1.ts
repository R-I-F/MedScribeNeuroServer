import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ORTHO proc_cpts — batch 1 of 2 (44 procedures).
 * Groups: ARTH (joint arthroplasty), SCOP (arthroscopy), FIXN (fracture fixation).
 *
 * CPT codes are standard AMA Orthopaedic Surgery codes applied from domain
 * knowledge (key codes spot-checked against published references). numCode uses
 * the canonical "NNNNN-00" form used elsewhere in this table. Links to main_diags
 * are added by migration 076.
 */
export class ImportOrthoProcCpts11750000000074 implements MigrationInterface {
  name = "ImportOrthoProcCpts11750000000074";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES

      -- ── ARTH: joint arthroplasty / replacement ──────────────────────────
      ('Total knee arthroplasty','ARTH','27447-00','Replacement of the femoral, tibial, and patellar articular surfaces with prosthetic components; definitive treatment for end-stage knee osteoarthritis.','استبدال مفصل الركبة الكامل','استبدال الأسطح المفصلية للفخذ والظنبوب والرضفة بمكوّنات صناعية؛ العلاج الجذري للفصال العظمي للركبة في مراحله النهائية.'),
      ('Unicompartmental knee arthroplasty','ARTH','27446-00','Replacement of a single (medial or lateral) compartment of the knee, preserving the cruciate ligaments and unaffected compartments in isolated osteoarthritis.','استبدال حجرة واحدة من مفصل الركبة','استبدال حجرة واحدة (إنسية أو وحشية) من الركبة مع الحفاظ على الرباطين الصليبيين والحجرات السليمة في الفصال المعزول.'),
      ('Revision total knee arthroplasty','ARTH','27487-00','Revision of a failed knee replacement with exchange of the femoral and tibial components for loosening, infection, instability, or wear.','مراجعة استبدال مفصل الركبة الكامل','مراجعة مفصل ركبة بديل فاشل مع تبديل المكوّنين الفخذي والظنبوبي بسبب الارتخاء أو العدوى أو عدم الثبات أو التآكل.'),
      ('Total hip arthroplasty','ARTH','27130-00','Replacement of the femoral head and acetabulum with prosthetic components; definitive treatment for end-stage hip osteoarthritis and avascular necrosis.','استبدال مفصل الورك الكامل','استبدال رأس الفخذ والحُق بمكوّنات صناعية؛ العلاج الجذري للفصال العظمي للورك والنخر اللاوعائي في مراحلهما النهائية.'),
      ('Hip hemiarthroplasty','ARTH','27125-00','Partial hip replacement of the femoral head only (eg, bipolar/unipolar stem), typically for displaced femoral-neck fractures in older patients.','استبدال نصفي لمفصل الورك','استبدال جزئي للورك يشمل رأس الفخذ فقط، عادةً لكسور عنق الفخذ المنزاحة لدى المسنين.'),
      ('Revision total hip arthroplasty','ARTH','27134-00','Revision of a failed hip replacement with exchange of both acetabular and femoral components for loosening, infection, or periprosthetic fracture.','مراجعة استبدال مفصل الورك الكامل','مراجعة مفصل ورك بديل فاشل مع تبديل المكوّنين الحُقّي والفخذي بسبب الارتخاء أو العدوى أو الكسر حول الطرف الصناعي.'),
      ('Total shoulder arthroplasty','ARTH','23472-00','Replacement of the glenohumeral joint (humeral head and glenoid) with prosthetic components for advanced shoulder arthritis or cuff arthropathy.','استبدال مفصل الكتف الكامل','استبدال المفصل العضدي الحقاني (رأس العضد والحُقّ) بمكوّنات صناعية للفصال المتقدم أو اعتلال الكفة.'),
      ('Shoulder hemiarthroplasty','ARTH','23470-00','Partial shoulder replacement of the humeral head only, used for proximal humerus fractures or isolated humeral-head disease.','استبدال نصفي لمفصل الكتف','استبدال جزئي للكتف يشمل رأس العضد فقط، يُستخدم لكسور العضد القريب أو إصابة رأس العضد المعزولة.'),
      ('Total elbow arthroplasty','ARTH','24363-00','Replacement of the ulnohumeral joint with a linked or unlinked prosthesis for end-stage elbow arthritis or unreconstructable distal humerus fracture.','استبدال مفصل المرفق الكامل','استبدال المفصل الزندي العضدي بطرف صناعي مترابط أو غير مترابط للفصال المتقدم أو كسور العضد البعيدة غير القابلة للترميم.'),
      ('Total ankle arthroplasty','ARTH','27702-00','Replacement of the tibiotalar joint with a prosthetic implant, preserving motion as an alternative to arthrodesis in end-stage ankle arthritis.','استبدال مفصل الكاحل الكامل','استبدال المفصل الظنبوبي القعبي بطرف صناعي مع الحفاظ على الحركة كبديل للإيثاق في الفصال المتقدم للكاحل.'),

      -- ── SCOP: arthroscopy ────────────────────────────────────────────────
      ('Diagnostic knee arthroscopy','SCOP','29870-00','Minimally invasive arthroscopic inspection of the knee joint to assess intra-articular pathology when imaging is inconclusive.','تنظير الركبة التشخيصي','فحص تنظيري بسيط التوغل لمفصل الركبة لتقييم الأمراض داخل المفصل عند عدم حسم التصوير.'),
      ('Knee arthroscopy with meniscectomy','SCOP','29881-00','Arthroscopic partial meniscectomy of a torn medial or lateral meniscus, trimming the unstable fragment to relieve mechanical symptoms.','استئصال غضروف هلالي بالمنظار','استئصال جزئي بالمنظار لغضروف هلالي ممزق إنسي أو وحشي بقص الجزء غير المستقر لتخفيف الأعراض الميكانيكية.'),
      ('Knee arthroscopy with medial and lateral meniscectomy','SCOP','29880-00','Arthroscopic partial meniscectomy of both the medial and lateral menisci within the same knee.','استئصال الغضروفين الهلاليين الإنسي والوحشي بالمنظار','استئصال جزئي بالمنظار للغضروفين الهلاليين الإنسي والوحشي في الركبة نفسها.'),
      ('Knee arthroscopy with meniscus repair','SCOP','29882-00','Arthroscopic suture repair of a peripheral (vascular zone) meniscal tear to preserve the meniscus, especially in younger patients.','إصلاح الغضروف الهلالي بالمنظار','إصلاح بالمنظار بالخياطة لتمزق هلالي محيطي (في المنطقة الوعائية) للحفاظ على الغضروف، خاصةً لدى الشباب.'),
      ('Knee arthroscopy with chondroplasty','SCOP','29877-00','Arthroscopic debridement and shaving of damaged articular cartilage of the knee to smooth chondral surfaces and remove unstable flaps.','رأب الغضروف بالمنظار للركبة','تنضير وحفّ بالمنظار للغضروف المفصلي المتضرر في الركبة لتنعيم الأسطح وإزالة الشظايا غير المستقرة.'),
      ('Arthroscopic anterior cruciate ligament reconstruction','SCOP','29888-00','Arthroscopic reconstruction of the ACL using an autograft or allograft to restore anterior knee stability.','إعادة بناء الرباط الصليبي الأمامي بالمنظار','إعادة بناء الرباط الصليبي الأمامي بالمنظار باستخدام طعم ذاتي أو مأخوذ لاستعادة الثبات الأمامي للركبة.'),
      ('Arthroscopic posterior cruciate ligament reconstruction','SCOP','29889-00','Arthroscopic reconstruction of the PCL with a graft to restore posterior knee stability in symptomatic instability.','إعادة بناء الرباط الصليبي الخلفي بالمنظار','إعادة بناء الرباط الصليبي الخلفي بالمنظار بطعم لاستعادة الثبات الخلفي للركبة في عدم الثبات العرضي.'),
      ('Arthroscopic rotator cuff repair','SCOP','29827-00','Arthroscopic suture-anchor reattachment of a torn rotator cuff tendon to its humeral footprint.','إصلاح الكفة المدورة بالمنظار','إعادة تثبيت بالمنظار لوتر الكفة المدورة الممزق إلى موضعه على العضد بمراسٍ خيطية.'),
      ('Arthroscopic subacromial decompression','SCOP','29826-00','Arthroscopic acromioplasty and bursectomy to enlarge the subacromial space and relieve rotator-cuff impingement.','فك الانضغاط تحت الأخرم بالمنظار','رأب الأخرم واستئصال الجراب بالمنظار لتوسيع الحيز تحت الأخرم وتخفيف انحشار الكفة المدورة.'),
      ('Arthroscopic shoulder capsulorrhaphy (Bankart repair)','SCOP','29806-00','Arthroscopic repair of the labrum and capsule for recurrent anterior shoulder instability.','رأب محفظة الكتف بالمنظار (إصلاح بانكارت)','إصلاح بالمنظار للشفا والمحفظة لعدم الثبات الأمامي المتكرر للكتف.'),
      ('Hip arthroscopy with labral repair','SCOP','29916-00','Arthroscopic repair of an acetabular labral tear, often with treatment of femoroacetabular impingement.','تنظير الورك مع إصلاح الشفا','إصلاح بالمنظار لتمزق الشفا الحُقّي، وغالباً مع معالجة الانحشار الفخذي الحُقّي.'),
      ('Ankle arthroscopy with debridement','SCOP','29891-00','Arthroscopic debridement of the ankle for osteochondral lesions, impingement, or loose bodies.','تنظير الكاحل مع التنضير','تنضير بالمنظار للكاحل لآفات العظم والغضروف أو الانحشار أو الأجسام الحرة.'),

      -- ── FIXN: fracture fixation ──────────────────────────────────────────
      ('ORIF of femoral neck fracture','FIXN','27236-00','Open reduction and internal fixation (or prosthetic replacement) of an intracapsular femoral-neck fracture using cannulated screws or a fixed-angle device.','رد وتثبيت داخلي لكسر عنق الفخذ','رد مفتوح وتثبيت داخلي (أو استبدال صناعي) لكسر عنق الفخذ داخل المحفظة بمسامير مجوّفة أو جهاز ثابت الزاوية.'),
      ('Fixation of intertrochanteric fracture with plate and screw','FIXN','27244-00','Stabilisation of an intertrochanteric femoral fracture with a sliding hip screw and side plate.','تثبيت كسر بين المدورين بصفيحة ومسمار','تثبيت كسر الفخذ بين المدورين بمسمار ورك منزلق وصفيحة جانبية.'),
      ('Intramedullary nailing of trochanteric femoral fracture','FIXN','27245-00','Stabilisation of an intertrochanteric or subtrochanteric femoral fracture with a cephalomedullary nail.','تسمير نقوي لكسر الفخذ المدوري','تثبيت كسر الفخذ بين المدورين أو تحت المدور بمسمار نقوي رأسي.'),
      ('ORIF of femoral shaft fracture','FIXN','27506-00','Open reduction and internal fixation of a femoral diaphyseal fracture, typically with a locked intramedullary nail.','رد وتثبيت داخلي لكسر جدل الفخذ','رد مفتوح وتثبيت داخلي لكسر جدل عظم الفخذ، عادةً بمسمار نقوي مقفل.'),
      ('ORIF of tibial plateau fracture','FIXN','27535-00','Open reduction and internal fixation of a tibial plateau fracture with plate and screws to restore articular congruity.','رد وتثبيت داخلي لكسر هضبة الظنبوب','رد مفتوح وتثبيت داخلي لكسر هضبة الظنبوب بصفيحة ومسامير لاستعادة تطابق السطح المفصلي.'),
      ('Intramedullary nailing of tibial shaft fracture','FIXN','27759-00','Stabilisation of a tibial diaphyseal fracture with a locked intramedullary nail.','تسمير نقوي لكسر جدل الظنبوب','تثبيت كسر جدل الظنبوب بمسمار نقوي مقفل.'),
      ('ORIF of bimalleolar ankle fracture','FIXN','27814-00','Open reduction and internal fixation of an unstable bimalleolar ankle fracture with plates and screws.','رد وتثبيت داخلي لكسر الكاحل مزدوج الكعب','رد مفتوح وتثبيت داخلي لكسر كاحل غير مستقر مزدوج الكعب بصفائح ومسامير.'),
      ('ORIF of lateral malleolus fracture','FIXN','27792-00','Open reduction and internal fixation of a distal fibular (lateral malleolus) fracture with a plate and screws.','رد وتثبيت داخلي لكسر الكعب الوحشي','رد مفتوح وتثبيت داخلي لكسر الشظية البعيدة (الكعب الوحشي) بصفيحة ومسامير.'),
      ('ORIF of calcaneal fracture','FIXN','28415-00','Open reduction and internal fixation of a displaced intra-articular calcaneal fracture to restore the subtalar joint and heel shape.','رد وتثبيت داخلي لكسر العقب','رد مفتوح وتثبيت داخلي لكسر العقب المنزاح داخل المفصل لاستعادة المفصل تحت الكاحل وشكل العقب.'),
      ('ORIF of talus fracture','FIXN','28445-00','Open reduction and internal fixation of a displaced talar neck or body fracture to reduce avascular-necrosis risk.','رد وتثبيت داخلي لكسر القَعَب','رد مفتوح وتثبيت داخلي لكسر منزاح في عنق أو جسم عظم القَعَب للحد من خطر النخر اللاوعائي.'),
      ('ORIF of proximal humerus fracture','FIXN','23615-00','Open reduction and internal fixation of a displaced proximal humerus fracture with a locking plate.','رد وتثبيت داخلي لكسر العضد القريب','رد مفتوح وتثبيت داخلي لكسر منزاح في النهاية القريبة للعضد بصفيحة مقفلة.'),
      ('ORIF of humeral shaft fracture','FIXN','24515-00','Open reduction and internal fixation of a humeral diaphyseal fracture with a plate and screws.','رد وتثبيت داخلي لكسر جدل العضد','رد مفتوح وتثبيت داخلي لكسر جدل عظم العضد بصفيحة ومسامير.'),
      ('ORIF of distal humerus fracture','FIXN','24546-00','Open reduction and internal fixation of an intercondylar/transcondylar distal humerus fracture with dual-column plating.','رد وتثبيت داخلي لكسر العضد البعيد','رد مفتوح وتثبيت داخلي لكسر بين اللقمتين في العضد البعيد بتثبيت عمودي مزدوج بالصفائح.'),
      ('ORIF of olecranon fracture','FIXN','24685-00','Open reduction and internal fixation of an olecranon fracture with tension-band wiring or plate to restore the extensor mechanism.','رد وتثبيت داخلي لكسر الزُّج المرفقي','رد مفتوح وتثبيت داخلي لكسر الزُّج المرفقي بسلك شد التوتر أو صفيحة لاستعادة آلية البسط.'),
      ('ORIF of distal radius fracture','FIXN','25609-00','Open reduction and internal fixation of a displaced intra-articular distal radius fracture with a volar locking plate.','رد وتثبيت داخلي لكسر الكعبرة البعيد','رد مفتوح وتثبيت داخلي لكسر منزاح داخل المفصل في الكعبرة البعيدة بصفيحة راحية مقفلة.'),
      ('ORIF of carpal scaphoid fracture','FIXN','25628-00','Open or percutaneous reduction and internal fixation of a scaphoid fracture with a headless compression screw.','رد وتثبيت داخلي لكسر العظم الزورقي','رد مفتوح أو عبر الجلد وتثبيت داخلي لكسر العظم الزورقي بمسمار ضاغط عديم الرأس.'),
      ('ORIF of clavicle fracture','FIXN','23515-00','Open reduction and internal fixation of a displaced midshaft or distal clavicle fracture with a contoured plate.','رد وتثبيت داخلي لكسر الترقوة','رد مفتوح وتثبيت داخلي لكسر منزاح في جدل أو نهاية الترقوة بصفيحة مُحدَّبة.'),
      ('ORIF of metacarpal fracture','FIXN','26615-00','Open reduction and internal fixation of a displaced metacarpal fracture with plates, screws, or K-wires.','رد وتثبيت داخلي لكسر عظم مشط اليد','رد مفتوح وتثبيت داخلي لكسر منزاح في عظم مشط اليد بصفائح أو مسامير أو أسلاك كيرشنر.'),
      ('Application of uniplane external fixator','FIXN','20690-00','Application of a uniplanar external fixation frame for unstable, open, or contaminated fractures and damage-control orthopaedics.','تركيب مثبّت خارجي أحادي المستوى','تركيب إطار تثبيت خارجي أحادي المستوى للكسور غير المستقرة أو المفتوحة أو الملوّثة وجراحة السيطرة على الضرر.'),
      ('Debridement of open fracture','FIXN','11010-00','Surgical debridement and irrigation of skin, subcutaneous tissue, muscle, and bone associated with an open fracture.','تنضير الكسر المفتوح','تنضير وغسل جراحي للجلد والنسيج تحت الجلد والعضل والعظم المرافق لكسر مفتوح.'),
      ('Prophylactic fixation of proximal femur','FIXN','27187-00','Prophylactic internal fixation of an impending pathological fracture of the femoral neck or proximal femur with a nail or plate.','التثبيت الوقائي للفخذ القريب','تثبيت داخلي وقائي لكسر مرضي وشيك في عنق أو النهاية القريبة للفخذ بمسمار أو صفيحة.'),
      ('Removal of deep orthopaedic implant','FIXN','20680-00','Surgical removal of a deep implant (plate, screws, nail, or wires) after fracture union or for hardware-related symptoms or infection.','إزالة الزرعة العظمية العميقة','إزالة جراحية لزرعة عميقة (صفيحة أو مسامير أو مسمار أو أسلاك) بعد التحام الكسر أو بسبب أعراض متعلقة بالعتاد أو العدوى.')
      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "proc_cpts" WHERE "alphaCode" IN ('ARTH','SCOP','FIXN')
    `);
  }
}
