import { MigrationInterface, QueryRunner } from "typeorm";

// All ICD-11 codes in this migration are ⚠️ UNVERIFIED (findacode.com unavailable).
// Verify at next audit cycle.
export class ExtendCtsDiagnoses1750000000057 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── INSERT 36 new diagnoses ───────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      ('1B11.0','Rheumatic aortic valve stenosis','تضيق الصمام الأورطي الروماتيزمي','Narrowing of the aortic valve caused by rheumatic heart disease, producing left ventricular outflow obstruction and pressure overload. Surgical valve replacement is the definitive treatment.','تضيق في الصمام الأورطي ناجم عن الروماتيزم القلبي يسبب انسداداً في مخرج البطين الأيسر وزيادة في الضغط. استبدال الصمام جراحياً هو العلاج الحاسم.'),
      ('1B11.1','Rheumatic aortic valve insufficiency','قصور الصمام الأورطي الروماتيزمي','Aortic valve regurgitation due to rheumatic fever causing chronic volume overload of the left ventricle and progressive heart failure. Managed by surgical valve replacement or repair.','قلس الصمام الأورطي الناجم عن الحمى الروماتيزمية يسبب زيادة حجمية مزمنة في البطين الأيسر وقصوراً قلبياً تدريجياً. يُعالج جراحياً.'),
      ('1F70.1','Hydatid cyst of lung','كيسة مائية في الرئة','Cystic pulmonary lesion caused by Echinococcus granulosus larval infection. Presents with cough, chest pain, or haemoptysis; rupture causes anaphylaxis. Surgical excision (cystectomy/pericystectomy) is the treatment of choice.','آفة كيسية رئوية بفعل المشوكات الحبيبية. تتظاهر بالسعال وألم الصدر أو نفث الدم؛ تمزقها يسبب الحساسية المفرطة. الاستئصال الجراحي هو خيار العلاج المفضل.'),
      ('1F22.0','Pulmonary aspergilloma','الرشاشية الرئوية الكروية','Fungal ball formed by Aspergillus colonising a pre-existing pulmonary cavity such as a tuberculosis scar or emphysematous bulla. Presents with haemoptysis. Surgical resection is indicated for recurrent or life-threatening bleeding.','كرة فطرية تتكون من رشاشيات تستوطن تجويفاً رئوياً سابقاً. تتظاهر بنفث الدم؛ يُشار إلى الاستئصال الجراحي عند النزف المتكرر أو المهدد للحياة.'),
      ('BC81.4','Atrial flutter','الرفيف الأذيني','Organised rapid macro-reentrant atrial tachycardia at 250–350 bpm producing characteristic sawtooth flutter waves with variable AV conduction. Surgical Maze procedure or catheter ablation is performed when associated with structural heart disease.','تسرع قلبي أذيني بمعدل 250–350 نبضة/دقيقة مع موجات الرفيف المميزة وتوصيل أذيني بطيني متغير. يُعالج بإجراء المتاهة الجراحية أو الاستئصال بالقسطرة عند ارتباطه بأمراض قلبية بنيوية.'),
      ('BC53','Sick sinus syndrome','متلازمة العقدة الجيبية المريضة','Dysfunction of the sinoatrial node causing symptomatic bradycardia, sinus pauses, chronotropic incompetence, or tachycardia-bradycardia syndrome. Permanent dual-chamber pacemaker implantation is the definitive treatment.','خلل في العقدة الجيبية الأذينية يسبب بطء القلب العرضي أو التوقفات الجيبية أو متلازمة تسرع-بطء القلب. تركيب جهاز ضبط النبض الدائم ثنائي الغرفة هو العلاج النهائي.'),
      ('BC72','Wolff-Parkinson-White syndrome','متلازمة ولف-باركنسون-وايت','Ventricular pre-excitation caused by an accessory atrioventricular pathway (Bundle of Kent), producing delta waves, short PR interval, and paroxysmal supraventricular tachycardia. Surgical or catheter ablation of the accessory pathway is curative.','الإثارة البطينية المبكرة الناجمة عن مسار أذيني بطيني إضافي تنتج موجات دلتا وتسرع قلبياً انتيابياً. الإزالة الجراحية أو بالقسطرة للمسار الإضافي علاج شافٍ.'),
      ('LB71.1','Pectus carinatum','الصدر الكيلي','Congenital chest wall deformity with protrusion of the sternum and costal cartilages (pigeon chest). Causes restrictive symptoms and psychological impact. Corrected by open Ravitch technique or dynamic bracing in growing children.','تشوه خلقي في جدار الصدر يتميز ببروز القص وغضاريف الأضلاع (صدر الحمامة). يُصحح جراحياً بطريقة رافيتش المفتوحة أو بالتجبير الديناميكي في الأطفال.'),
      ('LA88.3','Congenital pulmonary valve stenosis','تضيق الصمام الرئوي الخلقي','Congenital narrowing of the pulmonary valve causing right ventricular outflow obstruction, ranging from mild (incidental finding) to severe (neonatal cyanosis, right heart failure). Treatment includes balloon valvuloplasty or surgical valvotomy and valve replacement.','تضيق خلقي في الصمام الرئوي يسبب انسداداً في مخرج البطين الأيمن من خفيف إلى شديد. يُعالج بالتوسيع بالبالون أو البضع الجراحي واستبدال الصمام.'),
      ('LA93.0','Partial anomalous pulmonary venous connection','الاتصال الوريدي الرئوي الشاذ الجزئي','Congenital anomaly in which one or more (but not all) pulmonary veins drain into the right atrium or systemic veins rather than the left atrium, creating a left-to-right shunt. Repaired surgically by redirecting anomalous drainage.','شذوذ خلقي تصب فيه واحدة أو أكثر (لكن ليس كل) الأوردة الرئوية في الأذين الأيمن. يُصلح جراحياً بتحويل مسار الصرف الشاذ.'),
      ('LA8D.0','Pulmonary atresia with intact ventricular septum','انعدام ثقبة الصمام الرئوي مع سلامة الحاجز البطيني','Critical cyanotic congenital heart defect with complete absence of pulmonary valve opening and intact interventricular septum, causing severe neonatal cyanosis. Staged management: neonatal Blalock-Taussig shunt or catheter-based valvotomy, followed by definitive Glenn and Fontan completion.','عيب قلبي خلقي زرقاوي بالغ الخطورة مع غياب تام لفتحة الصمام الرئوي وسلامة الحاجز البطيني. تدبيره مرحلي: وصلة بلالوك-توسيج أو البضع بالقسطرة ثم إتمام دورة فونتان.'),
      ('LA89.0','Tricuspid atresia','انعدام ثقبة الصمام ثلاثي الشرفات','Complete absence of the tricuspid valve orifice causing obligatory mixing of systemic and pulmonary venous blood with severe cyanosis. Managed by staged palliative surgeries: modified BT shunt, bidirectional Glenn, then Fontan completion.','غياب تام لفتحة الصمام ثلاثي الشرفات يسبب اختلاطاً إلزامياً للدم مع زرقة شديدة. يُدار بمراحل جراحية تنتهي بتدوير فونتان.'),
      ('LA93.1','Total anomalous pulmonary venous connection','الاتصال الوريدي الرئوي الشاذ الكلي','All four pulmonary veins drain anomalously into the right atrium or systemic venous system, causing severe cyanosis, pulmonary hypertension, and right heart failure. Requires urgent surgical repair in the neonatal period.','تصب جميع الأوردة الرئوية الأربعة بشكل شاذ في الأذين الأيمن. تستلزم تصحيحاً جراحياً عاجلاً في فترة حديثي الولادة.'),
      ('LA8E','Common arterial trunk','جذع الشريان المشترك','Single arterial vessel arising from the base of the heart supplying systemic, pulmonary, and coronary circulations, always with a VSD. Surgical repair involves VSD closure and placement of a right ventricle-to-pulmonary artery conduit.','وعاء شرياني واحد ينشأ من قاعدة القلب يغذي الدورات الجهازية والرئوية والتاجية مع عيب الحاجز البطيني. يشمل الترميم إغلاق العيب وتركيب موصل بين البطين الأيمن والشريان الرئوي.'),
      ('LA8F','Hypoplastic left heart syndrome','متلازمة نقص تنسج القلب الأيسر','Spectrum of congenital cardiac malformations with severe underdevelopment of left heart structures (mitral valve, left ventricle, aortic valve, aorta). Managed by staged Norwood–Glenn–Fontan surgical pathway or cardiac transplantation.','طيف من التشوهات القلبية الخلقية مع قصور تطور شديد في هياكل القلب الأيسر. يُعالج بثلاث مراحل جراحية (نوروود-غلن-فونتان) أو زرع القلب.'),
      ('BD10.2','Post-infarction ventricular septal defect','عيب الحاجز البطيني بعد الاحتشاء','Mechanical complication of acute myocardial infarction with rupture of the interventricular septum causing an acute left-to-right shunt, haemodynamic deterioration, and cardiogenic shock. Requires urgent surgical or percutaneous closure.','اختلاط ميكانيكي لاحتشاء عضلة القلب الحاد مع تمزق الحاجز البطيني يسبب تحويلاً حاداً من اليسار إلى اليمين وصدمة قلبية. يستلزم إغلاقاً جراحياً أو عبر القسطرة عاجلاً.'),
      ('BD10.3','Left ventricular aneurysm','أم دم البطين الأيسر','Discrete dyskinetic or akinetic bulging of the left ventricular wall following transmural myocardial infarction, causing impaired contractility, ventricular arrhythmias, and thrombus formation. Surgical aneurysmectomy or endoventricular patch reconstruction restores ventricular geometry.','بروز موضعي خامد في جدار البطين الأيسر يتلو الاحتشاء العابر للجدار، يسبب ضعف الانقباض وعدم انتظام القلب وتكوّن الخثرة. الاستئصال الجراحي أو الترقيع الداخلي يعيد هندسة البطين.'),
      ('BC43.3','Restrictive cardiomyopathy','اعتلال عضلة القلب التقييدي','Cardiomyopathy characterised by increased ventricular wall stiffness with preserved systolic function but severely impaired diastolic filling. Causes include amyloidosis, haemochromatosis, and endomyocardial fibrosis. Cardiac transplantation may be required in advanced cases.','اعتلال عضلي قلبي بزيادة صلابة جدار البطين مع ضعف شديد في الامتلاء الانبساطي. أسبابه تشمل الداء النشواني والداء الحديدي. قد يستلزم زرع القلب في الحالات المتقدمة.'),
      ('BC43.4','Arrhythmogenic right ventricular cardiomyopathy','اعتلال عضلة البطين الأيمن اللانظمي','Inherited cardiomyopathy with fibrofatty replacement of right ventricular myocardium causing life-threatening ventricular arrhythmias, sudden cardiac death, and right heart failure. ICD implantation is standard; cardiac transplantation in refractory cases.','اعتلال عضلي وراثي بالتحول الدهني الليفي لعضلة البطين الأيمن يسبب عدم انتظام بطيني مهدداً للحياة. يُعالج بمزيل الرجفان القابل للزرع وزرع القلب في الحالات المقاومة.'),
      ('BD11.1','Right ventricular failure','قصور البطين الأيمن','Impaired right ventricular contractility causing systemic venous congestion, peripheral oedema, ascites, and hepatic congestion. Causes include pulmonary hypertension, RV infarction, and end-stage left heart failure. RVAD implantation or cardiac transplantation may be required.','ضعف في انقباض البطين الأيمن يؤدي إلى احتقان وريدي جهازي وذمة محيطية وحبن. قد يستلزم جهاز مساعدة البطين الأيمن أو زرع القلب.'),
      ('2B30.Z','Hodgkin lymphoma - unspecified','لمفوما هودجكين - غير محددة','Malignant lymphoma of the lymphatic system frequently presenting as an anterior mediastinal mass in young adults, particularly the nodular sclerosing subtype. Surgical biopsy or mediastinoscopy confirms diagnosis; multimodal therapy follows.','ورم خبيث في الجهاز اللمفاوي يتظاهر في الغالب ككتلة منصفية أمامية لدى الشباب. تؤكد الخزعة الجراحية أو المنظار المنصفي التشخيص.'),
      ('2F35.Z','Benign neoplasm of peripheral nerves - unspecified','الورم الحميد للأعصاب المحيطية - غير محدد','Neurogenic tumours of the posterior mediastinum including schwannoma, neurofibroma, and ganglioneuroma. The most common posterior mediastinal tumours in adults; typically asymptomatic but may cause pain or spinal cord compression. Surgical excision is curative.','أورام عصبية حميدة في المنصف الخلفي تشمل الورم الليفي العصبي والعقدي العصبي. الاستئصال الجراحي علاج شافٍ.'),
      ('CA96.0','Bronchogenic cyst','كيسة قصبية','Congenital cystic lesion of the mediastinum or lung arising from abnormal budding of the foregut. Often discovered incidentally; may cause compression symptoms, infection, or rupture. Surgical excision is recommended regardless of symptoms.','آفة كيسية خلقية في المنصف أو الرئة ناجمة عن تبرعم شاذ من المعى الأمامي. تُكتشف غالباً صدفةً؛ الاستئصال الجراحي مُوصى به.'),
      ('2E01.3','Secondary malignant neoplasm of pleura','الورم الخبيث الثانوي للجنب','Metastatic spread to the pleura from primary malignancies (lung, breast, mesothelioma, lymphoma), causing malignant pleural effusion and chest pain. Surgical options include pleurodesis, pleurectomy-decortication, or pleuropneumonectomy for mesothelioma.','انتشار ثانوي للأورام الخبيثة إلى الجنب مسبباً انصباباً جنبياً خبيثاً وألماً صدرياً. تشمل الخيارات الجراحية الإلصاق الجنبي وتقشير الجنب.'),
      ('BB83','Haemopericardium','الدم التأموري','Blood in the pericardial cavity due to cardiac trauma, aortic dissection, ventricular rupture, or procedure-related complications. Causes rapid cardiac tamponade requiring immediate surgical decompression (pericardiotomy or pericardial window).','وجود الدم في التجويف التأموري نتيجة رضح قلبي أو تشريح الأبهر أو تمزق البطين. يسبب دكاكاً قلبياً سريعاً يستلزم تفريجاً جراحياً فورياً.'),
      ('CB28.Z','Fibrothorax - unspecified','الصدر الليفي - غير محدد','Organised pleural fibrin deposition causing fusion of visceral and parietal pleura with restrictive lung disease, resulting from unresolved haemothorax, empyema, or tuberculous pleuritis. Surgical decortication restores pulmonary function.','ترسب منظم للفيبرين الجنبي يسبب التصاق الجنبين مع مرض رئوي تقييدي ناتج عن انصباب جنبي أو دبيلة غير مُعالجة. التقشير الجراحي يستعيد الوظيفة الرئوية.'),
      ('CB24.2','Tension pneumothorax','استرواح الصدر الضاغط','Life-threatening pneumothorax with progressive air trapping under pressure causing mediastinal shift, compression of contralateral lung and great vessels, and cardiovascular collapse. Requires immediate needle decompression followed by tube thoracostomy.','استرواح صدر مهدد للحياة مع احتباس هوائي متصاعد يسبب انزياح المنصف وانهياراً قلبياً وعائياً. يستلزم تفريجاً فورياً بالإبرة ثم أنبوب التصريف.'),
      ('NB32.1','Traumatic pneumothorax','استرواح الصدر الرضي','Pneumothorax resulting from penetrating or blunt chest trauma causing pleural laceration and air entry into the pleural space. Frequently associated with haemothorax (haemopneumothorax). Managed with intercostal tube thoracostomy.','استرواح صدر ناجم عن رضح صدري نافذ أو حاد يُدخل الهواء إلى التجويف الجنبي. غالباً ما يرافقه دم جنبي. يُدار بأنبوب التصريف الصدري.'),
      ('2C25.3','Small cell carcinoma of bronchus or lung','سرطان الخلايا الصغيرة للقصبة أو الرئة','Aggressive high-grade neuroendocrine carcinoma with rapid growth, early metastasis, and frequent paraneoplastic syndromes. Predominantly central tumour. Limited-stage disease may be considered for surgical resection combined with chemoradiotherapy.','سرطان عصبي صماوي عالي الدرجة سريع التضاعف والانتشار مع متلازمات متكررة. المراحل المحدودة قد تستفيد من الجراحة مع العلاج الكيميائي الإشعاعي.'),
      ('2C25.4','Squamous cell carcinoma of bronchus or lung','سرطان الخلايا الحرشفية للقصبة أو الرئة','Central bronchogenic malignancy arising from bronchial epithelium, closely associated with smoking. Presents with haemoptysis and central airway obstruction. Surgical resection (lobectomy or pneumonectomy) offers best outcomes in resectable early-stage disease.','سرطان قصبي مركزي ينشأ من ظهارة القصبات ومرتبط بالتدخين. يتظاهر بنفث الدم وانسداد المجرى الهوائي المركزي. الاستئصال الجراحي يُعطي أفضل نتائج في المراحل المبكرة.'),
      ('2C25.5','Adenocarcinoma of lung','سرطان الغدة في الرئة','The most common peripheral lung malignancy arising from alveolar or bronchial glandular epithelium; more common in non-smokers and women. Peripheral location favours early detection. Surgical lobectomy or segmentectomy is the standard treatment for resectable disease.','أكثر الأورام الرئوية الطرفية شيوعاً، ينشأ من الظهارة الغدية. شائع في غير المدخنين. الاستئصال الجراحي للفص أو القطعة هو المعيار للمرض القابل للاستئصال.'),
      ('BD50.4','Thoracoabdominal aortic aneurysm','أم دم الأبهر الصدري البطني','Aortic aneurysm extending from the thoracic into the abdominal aorta, involving visceral and renal arteries (Crawford classification I–IV). Requires complex open thoracoabdominal graft replacement with branch vessel reimplantation or endovascular repair.','توسع في الأبهر يمتد من الصدر إلى البطن ويشمل الشرايين الحشوية والكلوية. يستلزم استبدال الأبهر بطعم معقد مع إعادة زرع الشرايين الفرعية.'),
      ('NB30.0','Traumatic rupture of thoracic aorta','تمزق الأبهر الصدري الرضي','Traumatic disruption of the thoracic aorta, most commonly at the aortic isthmus after rapid-deceleration injury (road traffic accidents). A surgical or endovascular emergency; TEVAR (thoracic endovascular aortic repair) is the preferred approach.','تمزق رضي في الأبهر الصدري وأكثره شيوعاً عند برزخ الأبهر بعد رضح التباطؤ السريع. حالة طارئة يُفضل فيها التدخل الداخلي الوعائي الصدري.'),
      ('1B12.Z','Rheumatic tricuspid valve disease - unspecified','مرض الصمام ثلاثي الشرفات الروماتيزمي - غير محدد','Tricuspid valve stenosis or regurgitation attributable to rheumatic fever. Frequently coexists with rheumatic mitral and aortic disease as part of multi-valve involvement. Addressed at the time of combined valve surgery.','تضيق أو قلس في الصمام ثلاثي الشرفات منسوب للحمى الروماتيزمية. كثيراً ما يتزامن مع أمراض الصمام التاجي والأورطي ضمن أمراض متعددة الصمامات.'),
      ('1B13.Z','Rheumatic combined valve disease - unspecified','مرض الصمامات المتعددة الروماتيزمي - غير محدد','Multi-valve rheumatic heart disease affecting two or more valves simultaneously with stenosis and/or regurgitation. Requires complex surgical planning for combined valve repair or staged replacement to optimise haemodynamic outcomes.','مرض قلبي روماتيزمي يصيب صمامين أو أكثر في آنٍ واحد. يستلزم تخطيطاً جراحياً معقداً لترميم أو استبدال الصمامات المتعددة.'),
      ('BB63.2','Mitral valve prolapse','هبوط الصمام التاجي','Systolic billowing of one or both mitral valve leaflets into the left atrium, causing mitral regurgitation of variable severity. Severe prolapse with significant regurgitation requires surgical valve repair (preferred) or replacement.','هبوط وريقات الصمام التاجي نحو الأذين الأيسر خلال الانقباض مسبباً قلساً تاجياً متفاوت الشدة. يستلزم الهبوط الشديد ترميم الصمام جراحياً أو استبداله.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    // ── Link all 36 to CTS department ────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
      SELECT dept.id, d.id
      FROM "departments" dept
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS'
        AND d."icdCode" IN (
          '1B11.0','1B11.1','1F70.1','1F22.0','BC81.4','BC53','BC72',
          'LB71.1','LA88.3','LA93.0','LA8D.0','LA89.0','LA93.1','LA8E','LA8F',
          'BD10.2','BD10.3','BC43.3','BC43.4','BD11.1',
          '2B30.Z','2F35.Z','CA96.0','2E01.3','BB83',
          'CB28.Z','CB24.2','NB32.1',
          '2C25.3','2C25.4','2C25.5',
          'BD50.4','NB30.0','1B12.Z','1B13.Z','BB63.2'
        )
      ON CONFLICT DO NOTHING
    `);

    // ── Link to main_diags ────────────────────────────────────────────────

    // aortic valve disease
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'aortic valve disease'
        AND d."icdCode" IN ('1B11.0','1B11.1','1B13.Z')
      ON CONFLICT DO NOTHING
    `);

    // benign lung / airway disease
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'benign lung / airway disease'
        AND d."icdCode" IN ('1F70.1','1F22.0')
      ON CONFLICT DO NOTHING
    `);

    // cardiac arrhythmias
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'cardiac arrhythmias'
        AND d."icdCode" IN ('BC81.4','BC53','BC72','BC43.4')
      ON CONFLICT DO NOTHING
    `);

    // chest wall deformities / tumors
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'chest wall deformities / tumors'
        AND d."icdCode" IN ('LB71.1')
      ON CONFLICT DO NOTHING
    `);

    // congenital acyanotic heart defect
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'congenital acyanotic heart defect'
        AND d."icdCode" IN ('LA88.3','LA93.0')
      ON CONFLICT DO NOTHING
    `);

    // congenital cyanotic heart defect
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'congenital cyanotic heart defect'
        AND d."icdCode" IN ('LA8D.0','LA89.0','LA93.1','LA8E','LA8F')
      ON CONFLICT DO NOTHING
    `);

    // coronary artery disease (cad)
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'coronary artery disease (cad)'
        AND d."icdCode" IN ('BD10.2','BD10.3')
      ON CONFLICT DO NOTHING
    `);

    // heart failure & cardiomyopathy
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'heart failure & cardiomyopathy'
        AND d."icdCode" IN ('BC43.3','BC43.4','BD11.1','BD10.3')
      ON CONFLICT DO NOTHING
    `);

    // mediastinal mass / thymoma
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'mediastinal mass / thymoma'
        AND d."icdCode" IN ('2B30.Z','2F35.Z','CA96.0')
      ON CONFLICT DO NOTHING
    `);

    // metastatic/secondary lung disease
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'metastatic/secondary lung disease'
        AND d."icdCode" IN ('2E01.3')
      ON CONFLICT DO NOTHING
    `);

    // mitral valve disease
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'mitral valve disease'
        AND d."icdCode" IN ('BB63.2','BC81.4','1B13.Z')
      ON CONFLICT DO NOTHING
    `);

    // pericardial disease
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'pericardial disease'
        AND d."icdCode" IN ('BB83')
      ON CONFLICT DO NOTHING
    `);

    // pleural effusion & empyema
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'pleural effusion & empyema'
        AND d."icdCode" IN ('CB28.Z','2E01.3')
      ON CONFLICT DO NOTHING
    `);

    // pneumothorax & bullous disease
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'pneumothorax & bullous disease'
        AND d."icdCode" IN ('CB24.2','NB32.1')
      ON CONFLICT DO NOTHING
    `);

    // primary lung cancer
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'primary lung cancer'
        AND d."icdCode" IN ('2C25.3','2C25.4','2C25.5')
      ON CONFLICT DO NOTHING
    `);

    // thoracic aortic aneurysm / dissection
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'thoracic aortic aneurysm / dissection'
        AND d."icdCode" IN ('BD50.4','NB30.0')
      ON CONFLICT DO NOTHING
    `);

    // tricuspid / multi-valve disease
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'CTS' AND md.title = 'tricuspid / multi-valve disease'
        AND d."icdCode" IN ('1B12.Z','1B13.Z')
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = [
      '1B11.0','1B11.1','1F70.1','1F22.0','BC81.4','BC53','BC72',
      'LB71.1','LA88.3','LA93.0','LA8D.0','LA89.0','LA93.1','LA8E','LA8F',
      'BD10.2','BD10.3','BC43.3','BC43.4','BD11.1',
      '2B30.Z','2F35.Z','CA96.0','2E01.3','BB83',
      'CB28.Z','CB24.2','NB32.1',
      '2C25.3','2C25.4','2C25.5',
      'BD50.4','NB30.0','1B12.Z','1B13.Z','BB63.2',
    ];
    const list = codes.map(c => `'${c}'`).join(',');
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" IN (${list}))`);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" IN (${list}))`);
    await queryRunner.query(`DELETE FROM "diagnoses" WHERE "icdCode" IN (${list})`);
  }
}
