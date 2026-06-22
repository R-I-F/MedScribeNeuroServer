import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PEDSURG coverage extension — batch 2 of 2 (37 diagnoses).
 * Categories: pediatric tumor resection, soft tissue & skin lesions, pyloric stenosis,
 * umbilical hernia, thoracic & lung anomalies, appendicitis, intussusception,
 * congenital diaphragmatic hernia, hydrocele, imperforate anus.
 *
 * All ICD-11 codes verified via icd11_search. Codes already present as shared rows are
 * skipped by ON CONFLICT and simply linked to PEDSURG.
 */
export class AddPedsurgDiagnosesBatch21750000000094 implements MigrationInterface {
  name = "AddPedsurgDiagnosesBatch21750000000094";

  private static readonly CODES = [
    "2C12.01", "2B55.Z", "2F32.0", "2F32.Y", "2A85.6", "2F78&XA6KU8", "2C80.2", "2B30.Z", "3B81.5Z",
    "DA05.Y&XA0SH3", "DA05.Y", "LC40", "LA90.1Z", "2E81.2Z", "EG63.0", "LA21.Y", "2E80.00", "LA31.2", "BD90.0&XA5XT7",
    "DA40.0", "LB13.Y", "KB80", "DA22.Z",
    "DD55", "LB03.Y", "KA65.1",
    "CA44", "CB24", "CB04.1", "CB21.1", "LA73.1",
    "2B81.2",
    "DB30.0", "DB30.0&XA6J68",
    "DD50.0",
    "LB53.Z",
    "DB35.Y",
  ];

  private async linkMain(r: QueryRunner, mainDiag: string, codes: string[]): Promise<void> {
    await r.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md
       JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'PEDSURG' AND md.title = $1 AND d."icdCode" = ANY($2)
       ON CONFLICT DO NOTHING`, [mainDiag, codes]);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      ('2C12.01','hepatoblastoma','الورم الأرومي الكبدي','The commonest primary liver malignancy of infancy; raised alpha-fetoprotein; treated by neoadjuvant chemotherapy and hepatic resection or transplant.','أشيع ورم كبدي خبيث أولي في الرضاعة؛ يرتفع فيه ألفا فيتوبروتين؛ يُعالَج بالعلاج الكيميائي التمهيدي والاستئصال الكبدي أو الزرع.'),
      ('2B55.Z','rhabdomyosarcoma','الساركومة العضلية المخططة','The commonest paediatric soft-tissue sarcoma (head/neck, genitourinary, extremity); managed by multimodal chemotherapy, surgery and radiotherapy.','أشيع ساركومة نسيج رخو لدى الأطفال (الرأس والعنق والجهاز البولي التناسلي والأطراف)؛ تُدار بعلاج كيميائي متعدد الوسائط والجراحة والعلاج الإشعاعي.'),
      ('2F32.0','sacrococcygeal teratoma','الورم المسخي العجزي العصعصي','The commonest neonatal germ-cell tumour, arising at the coccyx; resected with the coccyx to prevent recurrence.','أشيع ورم خلايا جرثومية وليدي، ينشأ عند العصعص؛ يُستأصل مع العصعص لمنع النكس.'),
      ('2F32.Y','ovarian teratoma','الورم المسخي المبيضي','Benign mature cystic teratoma (dermoid) of the ovary in girls, occasionally complicated by torsion; treated by ovary-sparing cystectomy.','ورم مسخي كيسي ناضج حميد (جلداني) في مبيض الفتيات، يتعقّد أحياناً بالالتواء؛ يُعالَج باستئصال الكيس مع الحفاظ على المبيض.'),
      ('2A85.6','Burkitt lymphoma','لمفومة بوركيت','A highly aggressive B-cell non-Hodgkin lymphoma that commonly presents as an abdominal/ileocaecal mass in children; treated by intensive chemotherapy, surgery for complications.','لمفومة لاهودجكينية بائية شديدة العدوانية تتظاهر عادةً بكتلة بطنية/لفائفية أعورية لدى الأطفال؛ تُعالَج بعلاج كيميائي مكثّف والجراحة للمضاعفات.'),
      ('2F78&XA6KU8','congenital mesoblastic nephroma','الورم الكلوي الأرومي المتوسط الخلقي','The commonest congenital renal tumour of the neonate, usually benign; treated by radical nephrectomy.','أشيع ورم كلوي خلقي عند الوليد، حميد عادةً؛ يُعالَج باستئصال الكلية الجذري.'),
      ('2C80.2','germ cell tumour of testis','ورم الخلايا الجرثومية للخصية','Paediatric testicular germ-cell tumour (often yolk-sac type) presenting as a painless scrotal mass with raised AFP; treated by inguinal orchidectomy.','ورم خلايا جرثومية خصوي لدى الأطفال (غالباً من نوع كيس المح) يتظاهر بكتلة صفنية غير مؤلمة مع ارتفاع ألفا فيتوبروتين؛ يُعالَج باستئصال الخصية الإربي.'),
      ('2B30.Z','Hodgkin lymphoma','لمفومة هودجكين','Lymphoma presenting with painless cervical/mediastinal lymphadenopathy in older children; diagnosed by excisional node biopsy, treated by chemoradiotherapy.','لمفومة تتظاهر باعتلال عقد لمفية رقبية/منصفية غير مؤلم لدى الأطفال الأكبر؛ تُشخَّص بخزعة عقدة استئصالية وتُعالَج بالعلاج الكيميائي الإشعاعي.'),
      ('3B81.5Z','splenic cyst','كيس الطحال','A congenital (epidermoid) or post-traumatic cyst of the spleen; large or symptomatic cysts are treated by partial splenectomy or cyst deroofing.','كيس طحالي خلقي (بشروي) أو رضحي المنشأ؛ تُعالَج الأكياس الكبيرة أو العرضية باستئصال طحال جزئي أو إزالة سقف الكيس.'),
      ('DA05.Y&XA0SH3','thyroglossal duct cyst','الكيس الدرقي اللساني','A midline neck cyst from a persistent thyroglossal tract, moving on swallowing; excised with the central hyoid body (Sistrunk procedure).','كيس رقبي ناصف من بقاء القناة الدرقية اللسانية، يتحرك مع البلع؛ يُستأصل مع جسم العظم اللامي المركزي (عملية سيسترنك).'),
      ('DA05.Y','branchial cleft cyst','الكيس الخيشومي (كيس الشق الخيشومي)','A lateral neck cyst or sinus from a persistent branchial apparatus; excised completely including any tract to prevent recurrent infection.','كيس أو ناسور رقبي جانبي من بقاء الجهاز الخيشومي؛ يُستأصل كاملاً بما في ذلك أي مسار لمنع العدوى المتكررة.'),
      ('LC40','dermoid cyst','الكيس الجلداني (الأدمي)','A congenital inclusion cyst along embryonic fusion lines (e.g. external angular, midline), excised intact.','كيس انحشاري خلقي على خطوط الانصهار الجنينية (مثل الزاوية الخارجية أو الخط الناصف)، يُستأصل سليماً.'),
      ('LA90.1Z','cystic hygroma (lymphatic malformation)','الورم اللمفي الكيسي (التشوه اللمفاوي)','A macrocystic lymphatic malformation, usually of the neck/axilla in infancy; treated by sclerotherapy or surgical excision.','تشوه لمفاوي كبير الأكياس، غالباً في الرقبة أو الإبط في الرضاعة؛ يُعالَج بالعلاج بالتصليب أو الاستئصال الجراحي.'),
      ('2E81.2Z','infantile haemangioma','الورم الوعائي الطفلي','The commonest benign vascular tumour of infancy that proliferates then involutes; problematic lesions treated with propranolol or excision.','أشيع ورم وعائي حميد في الرضاعة يتكاثر ثم يتراجع؛ تُعالَج الآفات المُشكِلة بالبروبرانولول أو الاستئصال.'),
      ('EG63.0','sacrococcygeal pilonidal sinus','الناسور الشعري العجزي العصعصي','A natal-cleft sinus containing hair and debris, prone to recurrent abscess in adolescents; treated by excision or off-midline flap closure.','ناسور في الشق الأليوي يحتوي شعراً وفضلات، عرضة لخراج متكرر لدى المراهقين؛ يُعالَج بالاستئصال أو إغلاق برقعة خارج الخط الناصف.'),
      ('LA21.Y','preauricular sinus','الناسور أمام الأذني (النقرة أمام الأذنية)','A congenital pit/sinus anterior to the ear from incomplete fusion of the auricular hillocks; excised if recurrently infected.','نقرة/ناسور خلقي أمام الأذن من عدم اكتمال انصهار حديبات الصيوان؛ يُستأصل إذا تكررت عدواه.'),
      ('2E80.00','superficial subcutaneous lipoma','الورم الشحمي تحت الجلد','A benign subcutaneous fatty tumour; excised for size, symptoms or diagnostic uncertainty.','ورم شحمي حميد تحت الجلد؛ يُستأصل بسبب الحجم أو الأعراض أو عدم اليقين التشخيصي.'),
      ('LA31.2','ankyloglossia (tongue-tie)','التصاق اللسان (اللسان المربوط)','A short lingual frenulum restricting tongue movement and interfering with feeding/speech; released by frenotomy or frenuloplasty.','لجام لساني قصير يقيّد حركة اللسان ويعيق الرضاعة/النطق؛ يُحرَّر ببضع اللجام أو رأب اللجام.'),
      ('BD90.0&XA5XT7','acute cervical lymphadenitis','التهاب العقد اللمفية الرقبية الحاد','Acute suppurative infection of cervical lymph nodes in children; treated with antibiotics and incision and drainage when an abscess forms.','عدوى قيحية حادة للعقد اللمفية الرقبية لدى الأطفال؛ تُعالَج بالمضادات الحيوية والشق والتصريف عند تكوّن خراج.'),
      ('DA40.0','gastric outlet obstruction','انسداد مخرج المعدة','Obstruction at the pylorus/antrum (web, stricture or extrinsic cause) presenting with non-bilious vomiting; relieved surgically per cause.','انسداد عند البواب/الغار (غشاء أو تضيّق أو سبب خارجي) يتظاهر بقيء غير صفراوي؛ يُزال جراحياً حسب السبب.'),
      ('LB13.Y','congenital gastric duplication','ازدواج المعدة الخلقي','A foregut duplication cyst of the stomach causing a mass, obstruction or bleeding; excised surgically.','كيس ازدواج من الأمعاء الأمامية للمعدة يسبب كتلة أو انسداداً أو نزفاً؛ يُستأصل جراحياً.'),
      ('KB80','gastro-oesophageal reflux disease in newborn','الارتجاع المعدي المريئي عند حديثي الولادة','Pathological neonatal reflux causing failure to thrive, aspiration or apnoea; medically managed, with fundoplication for refractory cases.','ارتجاع وليدي مرضي يسبب فشل النمو أو الشفط أو انقطاع النفس؛ يُدار دوائياً، مع طيّ القاع للحالات المعنّدة.'),
      ('DA22.Z','gastro-oesophageal reflux disease','داء الارتجاع المعدي المريئي','Chronic reflux of gastric contents causing oesophagitis and respiratory symptoms in children; antireflux surgery for complicated or refractory disease.','ارتجاع مزمن لمحتويات المعدة يسبب التهاب المريء وأعراضاً تنفسية لدى الأطفال؛ جراحة مضادة للارتجاع للمرض المتعقّد أو المعنّد.'),
      ('DD55','epigastric hernia','الفتق الشرسوفي (فوق المعدي)','A midline ventral hernia through the linea alba above the umbilicus, often containing preperitoneal fat; repaired surgically.','فتق بطني ناصف عبر الخط الأبيض فوق السرّة، يحتوي غالباً شحماً ما قبل صفاقي؛ يُصلَح جراحياً.'),
      ('LB03.Y','persistent omphalomesenteric (vitelline) duct','بقاء القناة السرّية المساريقية (المحّية)','Persistence of the vitelline duct between ileum and umbilicus causing umbilical discharge or a band; excised surgically.','بقاء القناة المحّية بين اللفائفي والسرّة مسبّباً إفرازاً سرّياً أو حزمة؛ يُستأصل جراحياً.'),
      ('KA65.1','omphalitis of newborn','التهاب السرّة عند حديثي الولادة','Bacterial infection of the umbilical stump in the neonate; risk of necrotising fasciitis/sepsis, treated with antibiotics and surgical debridement if spreading.','عدوى جرثومية لجذمور السرّة عند الوليد؛ خطر التهاب اللفافة الناخر/الإنتان، تُعالَج بالمضادات الحيوية والتنضير الجراحي عند الانتشار.'),
      ('CA44','pyothorax (empyema of pleura)','الدبيلة الجنبية (تقيّح الصدر)','Purulent pleural effusion, usually complicating paediatric pneumonia; treated by drainage, fibrinolytics or VATS decortication.','انصباب جنبي قيحي، يعقّد عادةً ذات الرئة لدى الأطفال؛ يُعالَج بالتصريف أو حالّات الفبرين أو تقشير بالتنظير الصدري.'),
      ('CB24','chylous effusion (chylothorax)','الانصباب الكيلوسي (انصباب لمفي بالصدر)','Accumulation of chyle in the pleural space (post-surgical or congenital); managed by drainage, diet and ligation/embolisation of the thoracic duct if persistent.','تراكم الكيلوس في الحيز الجنبي (بعد الجراحة أو خلقي)؛ يُدار بالتصريف والحمية وربط/إصمام القناة الصدرية إذا استمر.'),
      ('CB04.1','congenital chylothorax','الانصباب الكيلوسي الخلقي','Congenital pulmonary lymphatic dysplasia causing neonatal chylous pleural effusion and respiratory distress; managed by drainage and dietary modification.','خلل تنسّج لمفي رئوي خلقي يسبب انصباباً جنبياً كيلوسياً وليدياً وضائقة تنفسية؛ يُدار بالتصريف وتعديل الحمية.'),
      ('CB21.1','spontaneous pneumothorax','استرواح الصدر العفوي','Spontaneous air in the pleural space, often from a ruptured apical bleb in tall adolescents; recurrent cases treated by VATS bullectomy and pleurodesis.','هواء عفوي في الحيز الجنبي، غالباً من تمزّق فقاعة قمّية لدى المراهقين الطوال؛ تُعالَج الحالات المتكررة باستئصال الفقاعات بالتنظير وإلصاق الجنب.'),
      ('LA73.1','congenital tracheomalacia','ليونة الرغامى الخلقية','Congenital weakness of the tracheal wall causing dynamic airway collapse, stridor and recurrent infection; severe cases need aortopexy or tracheal support.','ضعف خلقي في جدار الرغامى يسبب انخماص المجرى الهوائي الديناميكي والصرير والعدوى المتكررة؛ تحتاج الحالات الشديدة إلى تثبيت الأبهر أو دعم الرغامى.'),
      ('2B81.2','neuroendocrine (carcinoid) tumour of appendix','الورم العصبي الصمّاوي (السرطاوي) للزائدة الدودية','The commonest appendiceal tumour in children, usually an incidental finding at appendicectomy; appendicectomy is curative for small tip lesions.','أشيع ورم زائدي لدى الأطفال، يُكتشف عادةً عرَضاً عند استئصال الزائدة؛ يكون استئصال الزائدة شافياً للآفات الصغيرة في القمة.'),
      ('DB30.0','intussusception of large intestine','انغلاف الأمعاء الغليظة','Telescoping of large bowel into the adjacent segment; reduced by air/contrast enema, with surgery for failed reduction or a pathological lead point.','انزلاق الأمعاء الغليظة داخل القطعة المجاورة؛ يُرَد بحقنة هوائية/ظليلة، مع الجراحة عند فشل الرد أو وجود نقطة قائدة مرضية.'),
      ('DB30.0&XA6J68','caecal intussusception','انغلاف الأعور','Intussusception originating at the caecum; managed by enema reduction or operative reduction/resection if irreducible.','انغلاف ينشأ عند الأعور؛ يُدار بالرد بالحقنة الشرجية أو الرد/الاستئصال الجراحي إذا تعذّر رده.'),
      ('DD50.0','diaphragmatic hernia (traumatic/acquired)','الفتق الحجابي (الرضحي/المكتسب)','An acquired defect in the diaphragm (e.g. after blunt trauma) allowing abdominal viscera into the chest; repaired surgically.','عيب مكتسب في الحجاب الحاجز (مثلاً بعد رضح كليل) يسمح بدخول الأحشاء البطنية إلى الصدر؛ يُصلَح جراحياً.'),
      ('LB53.Z','hypospadias','المبال التحتاني (الإحليل التحتي)','A congenital ventral location of the urethral meatus with associated chordee; corrected by single- or staged urethroplasty.','موضع بطني خلقي لفوهة الإحليل مع انحناء القضيب المرافق؛ يُصحَّح برأب الإحليل بمرحلة واحدة أو مراحل.'),
      ('DB35.Y','juvenile rectal polyp','السليلة المستقيمية اليفعية','A benign hamartomatous rectal polyp, the commonest cause of painless rectal bleeding in young children; treated by colonoscopic or transanal polypectomy.','سليلة مستقيمية عُتومية حميدة، أشيع سبب لنزف مستقيمي غير مؤلم لدى صغار الأطفال؛ تُعالَج باستئصال السليلة بالتنظير القولوني أو عبر الشرج.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'PEDSURG' AND d."icdCode" = ANY($1) ON CONFLICT DO NOTHING`,
      [AddPedsurgDiagnosesBatch21750000000094.CODES]);

    await this.linkMain(queryRunner, "pediatric tumor resection", ["2C12.01", "2B55.Z", "2F32.0", "2F32.Y", "2A85.6", "2F78&XA6KU8", "2C80.2", "2B30.Z", "3B81.5Z"]);
    await this.linkMain(queryRunner, "soft tissue & skin lesions", ["DA05.Y&XA0SH3", "DA05.Y", "LC40", "LA90.1Z", "2E81.2Z", "EG63.0", "LA21.Y", "2E80.00", "LA31.2", "BD90.0&XA5XT7"]);
    await this.linkMain(queryRunner, "pyloric stenosis", ["DA40.0", "LB13.Y", "KB80", "DA22.Z"]);
    await this.linkMain(queryRunner, "umbilical hernia", ["DD55", "LB03.Y", "KA65.1"]);
    await this.linkMain(queryRunner, "thoracic & lung anomalies", ["CA44", "CB24", "CB04.1", "CB21.1", "LA73.1"]);
    await this.linkMain(queryRunner, "appendicitis", ["2B81.2"]);
    await this.linkMain(queryRunner, "intussusception", ["DB30.0", "DB30.0&XA6J68"]);
    await this.linkMain(queryRunner, "congenital diaphragmatic hernia", ["DD50.0"]);
    await this.linkMain(queryRunner, "hydrocele", ["LB53.Z"]);
    await this.linkMain(queryRunner, "imperforate anus", ["DB35.Y"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddPedsurgDiagnosesBatch21750000000094.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))`, [codes]);
    await queryRunner.query(
      `DELETE FROM "diagnoses" d WHERE d."icdCode" = ANY($1)
         AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = d.id)`, [codes]);
  }
}
