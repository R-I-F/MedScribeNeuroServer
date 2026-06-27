import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OBGYN coverage extension — diagnoses batch 1 of 3 (obstetric: cesarean section, vaginal
 * delivery complications, ectopic pregnancy, miscarriage, placental abnormalities).
 * Inserts 38 new diagnoses and links them to OBGYN + their main_diags. Three codes are
 * reused after MIG-A (124) freed them to their correct WHO meaning: JB40.0=puerperal sepsis,
 * JB00.0=preterm labour. All ICD-11 codes verified via icd11_search (AUDIT_OBGYN.md 2D).
 * Runs after MIG-A (124).
 */
export class AddObgynDiagnosesBatch11750000000125 implements MigrationInterface {
  name = "AddObgynDiagnosesBatch11750000000125";

  private static readonly CODES = [
    "JA82.1", "JB05.4", "JA84.2", "KB20.Z", "JA82.2", "JA80.0", "JA86.5", "JA63.2", "JA8A.2", "JB08.0",
    "JB03.Z", "JB06.0", "JB09.2", "JB09.3", "JB0B.0", "JA43.1", "JA23", "JA24.2", "JB40.0", "JB42.1", "JA61.3",
    "JA01.1", "JA01.2", "JA01.Y", "JA01.0",
    "JA40.0", "JA00.24", "JA05.0/1G40", "GA33", "JA84.3",
    "JA88.1", "JA89.Z", "JA89.3", "JA87", "JA88.0", "KA20.1Z", "JA41.Z", "JB00.0",
  ];

  private async linkMain(r: QueryRunner, mainDiag: string, codes: string[]): Promise<void> {
    await r.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'OBGYN' AND md.title = $1 AND d."icdCode" = ANY($2) ON CONFLICT DO NOTHING`, [mainDiag, codes]);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      ('JA82.1','maternal care for breech presentation','رعاية الأم للمجيء المقعدي','Fetus presenting buttocks/feet first at term; a common indication for elective caesarean section or external cephalic version.','الجنين يتقدّم بالمقعدة/القدمين عند التمام؛ من الدواعي الشائعة للقيصرية الاختيارية أو التدوير الخارجي.'),
      ('JB05.4','obstructed labour due to fetopelvic disproportion','تعسّر الولادة بسبب عدم التناسب الحوضي الجنيني','Labour obstructed when the fetal head is too large for the maternal pelvis; an indication for caesarean section.','تعسّر المخاض حين يكون رأس الجنين أكبر من حوض الأم؛ من دواعي القيصرية.'),
      ('JA84.2','maternal care due to uterine scar from previous caesarean','رعاية الأم لندبة رحمية من قيصرية سابقة','Pregnancy with a scarred uterus from prior caesarean; managed by repeat caesarean or trial of labour with rupture risk.','حمل برحم مندوب من قيصرية سابقة؛ يُدار بقيصرية متكررة أو محاولة مخاض مع خطر التمزق.'),
      ('KB20.Z','intrauterine hypoxia (fetal distress)','نقص الأكسجة داخل الرحم (شدة جنينية)','Non-reassuring fetal status from intrauterine hypoxia detected on monitoring; an indication for expedited caesarean or instrumental delivery.','حالة جنينية غير مطمئنة بسبب نقص الأكسجة داخل الرحم تُكتشف بالمراقبة؛ من دواعي القيصرية العاجلة أو الولادة الآلية.'),
      ('JA82.2','maternal care for transverse or oblique lie','رعاية الأم للمجيء المعترض أو المائل','Abnormal fetal lie across or oblique to the uterine axis precluding vaginal delivery; an indication for caesarean section.','وضع جنيني غير طبيعي معترض أو مائل لمحور الرحم يمنع الولادة المهبلية؛ من دواعي القيصرية.'),
      ('JA80.0','twin pregnancy','الحمل التوأمي','Multiple gestation with two fetuses; higher risk of malpresentation and complications often requiring caesarean delivery.','حمل متعدد بجنينين؛ خطر أعلى لسوء المجيء والمضاعفات يستلزم غالباً القيصرية.'),
      ('JA86.5','maternal care for suspected macrosomia','رعاية الأم لضخامة الجنين المشتبهة','Suspected large-for-dates fetus increasing the risk of shoulder dystocia and obstructed labour; may indicate caesarean.','جنين مشتبه بكبر حجمه يزيد خطر عسر الكتف وتعسّر الولادة؛ قد يستلزم القيصرية.'),
      ('JA63.2','gestational diabetes mellitus','داء السكري الحملي','Glucose intolerance first recognised in pregnancy; associated with macrosomia and an increased caesarean rate.','عدم تحمّل الغلوكوز يُكتشف أول مرة في الحمل؛ يرتبط بضخامة الجنين وزيادة معدّل القيصرية.'),
      ('JA8A.2','morbidly adherent placenta (placenta accreta)','المشيمة الملتصقة (المشيمة المُلتحمة)','Abnormal placental invasion of the myometrium (accreta/increta/percreta); a major cause of obstetric haemorrhage requiring caesarean hysterectomy.','غزو مشيمي شاذ لعضلة الرحم (ملتصقة/منغرسة/نافذة)؛ سبب رئيس للنزف الولادي يستلزم استئصال الرحم القيصري.'),
      ('JB08.0','labour or delivery complicated by cord prolapse','مخاض أو ولادة معقّدة بهبوط الحبل السري','Umbilical cord descends below the presenting part with cord compression; an obstetric emergency requiring immediate caesarean.','هبوط الحبل السري أسفل الجزء المتقدّم مع انضغاطه؛ طارئ ولادي يستلزم قيصرية فورية.'),
      ('JB03.Z','long (prolonged) labour','المخاض المطوّل','Abnormally prolonged labour from inefficient uterine action or obstruction; managed by augmentation or operative delivery.','مخاض مطوّل بشكل غير طبيعي بسبب ضعف الفعل الرحمي أو الإعاقة؛ يُدار بالتعزيز أو الولادة الجراحية.'),
      ('JB06.0','obstructed labour due to shoulder dystocia','تعسّر الولادة بسبب عسر الكتف','Impaction of the fetal shoulders after delivery of the head; an obstetric emergency managed by manoeuvres to avoid neonatal injury.','انحشار كتفي الجنين بعد ولادة الرأس؛ طارئ ولادي يُدار بمناورات لتجنّب أذية الوليد.'),
      ('JB09.2','third degree perineal laceration during delivery','تمزّق العجان من الدرجة الثالثة أثناء الولادة','Obstetric tear involving the anal sphincter complex; requires meticulous surgical repair to preserve continence.','تمزّق ولادي يشمل معقّد المصرّة الشرجية؛ يتطلّب إصلاحاً جراحياً دقيقاً للحفاظ على التحكّم.'),
      ('JB09.3','fourth degree perineal laceration during delivery','تمزّق العجان من الدرجة الرابعة أثناء الولادة','Obstetric tear extending through the anal sphincter into the rectal mucosa; repaired in layers in theatre.','تمزّق ولادي يمتد عبر المصرّة الشرجية إلى مخاطية المستقيم؛ يُصلَح بالطبقات في غرفة العمليات.'),
      ('JB0B.0','retained placenta without haemorrhage','احتباس المشيمة دون نزف','Failure to deliver the placenta within the normal third stage; managed by manual removal to prevent haemorrhage.','فشل خروج المشيمة خلال المرحلة الثالثة الطبيعية؛ يُدار بالإزالة اليدوية لمنع النزف.'),
      ('JA43.1','postpartum uterine atony (atonic postpartum haemorrhage)','وَنى الرحم بعد الولادة (نزف ولادي ونائي)','Failure of the uterus to contract after delivery causing primary postpartum haemorrhage; managed by uterotonics and surgery.','فشل تقلّص الرحم بعد الولادة مسبّباً نزفاً ولادياً أولياً؛ يُدار بمقبّضات الرحم والجراحة.'),
      ('JA23','gestational hypertension','ارتفاع ضغط الدم الحملي','New-onset hypertension after 20 weeks without proteinuria; may progress to pre-eclampsia and influence delivery timing.','ارتفاع ضغط حديث بعد الأسبوع العشرين دون بيلة بروتينية؛ قد يترقّى إلى ما قبل الارتعاج ويؤثّر في توقيت الولادة.'),
      ('JA24.2','HELLP syndrome','متلازمة هيلب','Severe pre-eclampsia variant with haemolysis, elevated liver enzymes and low platelets; an indication for urgent delivery.','نمط شديد من ما قبل الارتعاج مع انحلال دم وارتفاع إنزيمات الكبد ونقص الصفيحات؛ من دواعي الولادة العاجلة.'),
      ('JB40.0','puerperal sepsis','الإنتان النفاسي','Postpartum genital tract infection (endometritis) with systemic sepsis; a leading cause of maternal morbidity.','عدوى السبيل التناسلي بعد الولادة (التهاب بطانة الرحم) مع إنتان جهازي؛ سبب رئيس لاعتلال الأمومة.'),
      ('JB42.1','amniotic fluid embolism','انصمام السائل الأمنيوسي','Catastrophic obstetric collapse from amniotic fluid entering the maternal circulation; managed by intensive resuscitation.','انهيار ولادي كارثي بسبب دخول السائل الأمنيوسي الدوران الأمومي؛ يُدار بالإنعاش المكثّف.'),
      ('JA61.3','deep vein thrombosis in pregnancy','تجلّط الأوردة العميقة في الحمل','Venous thromboembolism in pregnancy/puerperium, a leading cause of maternal death; managed with anticoagulation.','انصمام خثاري وريدي في الحمل/النفاس، سبب رئيس لوفاة الأمومة؛ يُدار بمضادات التخثّر.'),
      ('JA01.1','tubal pregnancy','الحمل الأنبوبي','Ectopic implantation in the fallopian tube, the commonest ectopic site; managed by salpingectomy/salpingostomy or methotrexate.','انغراس هاجر في قناة فالوب، أشيع مواقع الحمل الهاجر؛ يُدار باستئصال البوق/فتح البوق أو الميثوتركسيت.'),
      ('JA01.2','ovarian pregnancy','الحمل المبيضي','Rare ectopic implantation on the ovary; managed by cystectomy or oophorectomy.','انغراس هاجر نادر على المبيض؛ يُدار باستئصال الكيسة أو المبيض.'),
      ('JA01.Y','cervical or other specified ectopic pregnancy','الحمل العنقي أو الهاجر المحدّد الآخر','Ectopic implantation at the cervix or other unusual site at high bleeding risk; managed medically or surgically.','انغراس هاجر في عنق الرحم أو موقع غير معتاد آخر بخطر نزف مرتفع؛ يُدار طبياً أو جراحياً.'),
      ('JA01.0','abdominal pregnancy','الحمل البطني','Rare ectopic implantation within the peritoneal cavity; a life-threatening condition requiring laparotomy.','انغراس هاجر نادر داخل التجويف البريتوني؛ حالة مهدّدة للحياة تتطلّب فتح البطن.'),
      ('JA40.0','threatened abortion','الإجهاض المنذر','Vaginal bleeding in early pregnancy with a closed cervix and viable fetus; managed expectantly.','نزف مهبلي في الحمل المبكّر مع عنق مغلق وجنين حيّ؛ يُدار بالترقّب.'),
      ('JA00.24','incomplete abortion','الإجهاض غير التام','Partial expulsion of products of conception with retained tissue; managed by evacuation of the uterus.','طرد جزئي لنواتج الحمل مع نسيج محتبس؛ يُدار بإفراغ الرحم.'),
      ('JA05.0/1G40','sepsis following abortion (septic abortion)','الإنتان التالي للإجهاض (الإجهاض الإنتاني)','Uterine infection complicating abortion with systemic sepsis; managed by antibiotics and urgent evacuation.','عدوى رحمية تعقّد الإجهاض مع إنتان جهازي؛ تُدار بالمضادات الحيوية والإفراغ العاجل.'),
      ('GA33','recurrent pregnancy loss','الإجهاض المتكرّر','Three or more consecutive pregnancy losses; investigated for anatomic, genetic, endocrine and thrombophilic causes.','ثلاث خسارات حملية متتالية أو أكثر؛ تُستقصى لأسباب تشريحية ووراثية وغدّية وخثارية.'),
      ('JA84.3','maternal care for cervical incompetence','رعاية الأم لقصور عنق الرحم','Painless cervical dilatation causing mid-trimester loss; managed by cervical cerclage.','اتساع عنق الرحم غير المؤلم مسبّباً خسارة في الثلث الثاني؛ يُدار بتطويق عنق الرحم.'),
      ('JA88.1','chorioamnionitis','التهاب المشيماء والسلى','Infection of the amniotic sac and membranes complicating pregnancy; an indication for expedited delivery and antibiotics.','عدوى الكيس الأمنيوسي والأغشية تعقّد الحمل؛ من دواعي الولادة العاجلة والمضادات الحيوية.'),
      ('JA89.Z','premature rupture of membranes','تمزّق الأغشية الباكر','Rupture of the fetal membranes before labour onset at term; increases infection risk and may necessitate induction.','تمزّق الأغشية الجنينية قبل بدء المخاض عند التمام؛ يزيد خطر العدوى وقد يستلزم التحريض.'),
      ('JA89.3','preterm premature rupture of membranes','تمزّق الأغشية الباكر قبل الأوان','Membrane rupture before 37 weeks; a leading cause of preterm birth managed by latency and steroids.','تمزّق الأغشية قبل الأسبوع 37؛ سبب رئيس للولادة المبتسرة يُدار بالكمون والستيرويدات.'),
      ('JA87','maternal care for polyhydramnios','رعاية الأم لكثرة السائل الأمنيوسي','Excessive amniotic fluid associated with fetal anomalies and malpresentation; raises caesarean risk.','زيادة السائل الأمنيوسي المرتبطة بشذوذات جنينية وسوء المجيء؛ ترفع خطر القيصرية.'),
      ('JA88.0','oligohydramnios','قلّة السائل الأمنيوسي','Reduced amniotic fluid associated with growth restriction and cord compression in labour.','نقص السائل الأمنيوسي المرتبط بتقييد النمو وانضغاط الحبل في المخاض.'),
      ('KA20.1Z','intrauterine growth restriction','تقييد النمو داخل الرحم','Failure of the fetus to reach its growth potential; monitored closely and may require early delivery.','فشل بلوغ الجنين إمكانه النمائي؛ يُراقب عن كثب وقد يستلزم الولادة المبكّرة.'),
      ('JA41.Z','antepartum haemorrhage','النزف السابق للولادة','Bleeding from the genital tract after 24 weeks before delivery (eg praevia/abruption); a major obstetric emergency.','نزف من السبيل التناسلي بعد الأسبوع 24 قبل الولادة (مثل المنزاحة/الانفصال)؛ طارئ ولادي كبير.'),
      ('JB00.0','preterm labour without delivery','المخاض المبتسر دون ولادة','Regular contractions with cervical change before 37 weeks; managed by tocolysis and steroids.','تقلّصات منتظمة مع تغيّر عنقي قبل الأسبوع 37؛ يُدار بمثبّطات المخاض والستيرويدات.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'OBGYN' AND d."icdCode" = ANY($1) ON CONFLICT DO NOTHING`,
      [AddObgynDiagnosesBatch11750000000125.CODES]);

    await this.linkMain(queryRunner, "cesarean section",
      ["JA82.1", "JB05.4", "JA84.2", "KB20.Z", "JA82.2", "JA80.0", "JA86.5", "JA63.2", "JA8A.2", "JB08.0"]);
    await this.linkMain(queryRunner, "vaginal delivery complications",
      ["JB03.Z", "JB06.0", "JB09.2", "JB09.3", "JB0B.0", "JA43.1", "JA23", "JA24.2", "JB40.0", "JB42.1", "JA61.3", "KB20.Z", "JB08.0", "JB05.4"]);
    await this.linkMain(queryRunner, "ectopic pregnancy", ["JA01.1", "JA01.2", "JA01.Y", "JA01.0"]);
    await this.linkMain(queryRunner, "miscarriage", ["JA40.0", "JA00.24", "JA05.0/1G40", "GA33", "JA84.3"]);
    await this.linkMain(queryRunner, "placental abnormalities",
      ["JA88.1", "JA89.Z", "JA89.3", "JA87", "JA88.0", "KA20.1Z", "JA41.Z", "JB00.0", "JA8A.2", "JB0B.0"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddObgynDiagnosesBatch11750000000125.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id WHERE dept.code = 'OBGYN')`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'OBGYN')`, [codes]);
    await queryRunner.query(`DELETE FROM "diagnoses" d WHERE d."icdCode" = ANY($1) AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = d.id)`, [codes]);
  }
}
