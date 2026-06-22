import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PEDSURG coverage extension — batch 1 of 2 (40 diagnoses).
 * Categories: abdominal wall defects, umbilical hernia, appendicitis, thoracic & lung
 * anomalies, congenital diaphragmatic hernia, esophageal atresia, hydrocele,
 * imperforate anus, inguinal hernia, malrotation & volvulus, neonatal emergencies.
 *
 * All ICD-11 codes verified via icd11_search (see MEDICAL_CODE_AUDITS/PEDSURG/AUDIT_PEDSURG.md
 * "2D — Candidate diagnoses"). Codes already present as shared rows (owned by GS etc.) are
 * skipped by ON CONFLICT and simply linked to PEDSURG.
 */
export class AddPedsurgDiagnosesBatch11750000000093 implements MigrationInterface {
  name = "AddPedsurgDiagnosesBatch11750000000093";

  private static readonly CODES = [
    "LB31.3", "LB17.3", "LD2F.10", "LB03.0",
    "DB10.00", "DB10.01", "DB11.6",
    "LA75.4", "LA75.6", "LA75.5", "LA74.Y", "LB73.13",
    "LB00.Y", "LB00.1", "LB13.1",
    "LB12.1Z", "LB12.2", "LB12.3", "LB12.Y",
    "GB00.0", "BD75.1", "GB01.0", "LB52.0",
    "LB42.2", "GC04.0", "LB17.Y", "DB51",
    "DD51/ME24.2", "DD51&XT44", "DD52", "LB4Y",
    "DA91.1", "DB30.1&XA8YJ9", "DA40.2", "DD50.2Z",
    "LB15.1", "LB16.0", "KB87.2", "LB20.21", "LB21.0",
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
      ('LB31.3','exstrophy of urinary bladder','انقلاب المثانة البولية','Congenital failure of the lower abdominal wall and anterior bladder wall to close, exposing the bladder mucosa; staged surgical closure with bladder-neck and abdominal-wall reconstruction.','فشل خلقي في انغلاق جدار البطن السفلي والجدار الأمامي للمثانة فتنكشف مخاطية المثانة؛ يُعالج بإغلاق جراحي مرحلي مع إعادة بناء عنق المثانة وجدار البطن.'),
      ('LB17.3','cloacal exstrophy','انقلاب المذرق (المجمع)','The most severe ventral-body-wall defect (OEIS complex) combining omphalocele, exstrophy, imperforate anus and spinal defects; requires complex staged neonatal reconstruction.','أشد عيوب الجدار البطني الأمامي (مركّب OEIS) ويجمع القيلة السرية والانقلاب ورتق الشرج وعيوب العمود الفقري؛ يتطلب إعادة بناء وليدية مرحلية معقّدة.'),
      ('LD2F.10','prune belly syndrome','متلازمة البطن البرقوقية','Triad of deficient abdominal-wall musculature, bilateral undescended testes and urinary-tract dilatation; managed by abdominoplasty, orchidopexy and urinary-tract reconstruction.','ثلاثي من نقص عضلات جدار البطن وخصيتين غير نازلتين وتوسّع السبيل البولي؛ يُدار برأب البطن وتثبيت الخصية وإعادة بناء السبيل البولي.'),
      ('LB03.0','patent urachus','بقاء القناة السرّية (المصران السرّي السالك)','Persistence of the allantoic (urachal) duct between bladder and umbilicus causing urine leakage from the navel; treated by surgical excision of the urachal remnant.','بقاء القناة المسارية (السرّية) بين المثانة والسرّة مسبّباً تسرّب البول من السرّة؛ يُعالَج باستئصال جراحي لبقايا القناة السرّية.'),
      ('DB10.00','acute appendicitis with generalised peritonitis','التهاب الزائدة الحاد مع التهاب الصفاق المعمم','Perforated appendicitis with free intraperitoneal pus and diffuse peritonitis; requires urgent appendicectomy, peritoneal lavage and antibiotics.','التهاب زائدة منثقب مع قيح حرّ داخل الصفاق والتهاب صفاق منتشر؛ يتطلب استئصال زائدة عاجلاً وغسيلاً صفاقياً ومضادات حيوية.'),
      ('DB10.01','appendicular abscess (appendicitis with localised peritonitis)','خراج الزائدة الدودية','Walled-off appendicular abscess from contained perforation; managed by image-guided drainage and antibiotics, often with interval appendicectomy.','خراج زائدي محصور ناجم عن انثقاب محتوى؛ يُدار بالتصريف الموجّه بالتصوير والمضادات الحيوية، وغالباً باستئصال زائدة مؤجَّل.'),
      ('DB11.6','mucocele of appendix','القيلة المخاطية للزائدة الدودية','Cystic dilatation of the appendix by mucin from luminal obstruction; excised intact to avoid pseudomyxoma peritonei.','توسّع كيسي للزائدة بالمخاط نتيجة انسداد اللمعة؛ يُستأصل سليماً تجنّباً للورم المخاطي الكاذب للصفاق.'),
      ('LA75.4','congenital pulmonary airway malformation (CCAM)','تشوه المجرى الهوائي الرئوي الخلقي','Multicystic dysplastic lung lesion (formerly CCAM/CPAM); risk of infection and pneumothorax; symptomatic or large lesions undergo lobectomy.','آفة رئوية متعددة الأكياس خلل التنسج (سابقاً CCAM/CPAM)؛ خطر العدوى واسترواح الصدر؛ تُستأصل الآفات العرضية أو الكبيرة بفص رئوي.'),
      ('LA75.6','congenital pulmonary sequestration','العزل الرئوي الخلقي','Non-functioning lung tissue with a systemic arterial supply, intra- or extralobar; treated by resection or feeding-vessel embolisation.','نسيج رئوي غير وظيفي ذو إمداد شرياني جهازي، داخل الفص أو خارجه؛ يُعالَج بالاستئصال أو إصمام الوعاء المغذّي.'),
      ('LA75.5','congenital lobar emphysema','انتفاخ الرئة الفصّي الخلقي','Progressive hyperinflation of a pulmonary lobe causing neonatal respiratory distress and mediastinal shift; symptomatic cases need lobectomy.','فرط انتفاخ متفاقم لفصّ رئوي يسبب ضائقة تنفسية وليدية وانزياح المنصف؛ تحتاج الحالات العرضية إلى استئصال الفص.'),
      ('LA74.Y','congenital bronchogenic cyst','الكيس القصبي المنشأ الخلقي','Foregut-derived mediastinal or intrapulmonary cyst lined by respiratory epithelium; excised for compression, infection or diagnosis.','كيس منصفي أو داخل رئوي مشتق من الأمعاء الأمامية مبطّن بظهارة تنفسية؛ يُستأصل للضغط أو العدوى أو التشخيص.'),
      ('LB73.13','pectus excavatum','الصدر القمعي (الغائر)','Posterior depression of the sternum and costal cartilages; severe deformity is corrected by minimally invasive (Nuss) bar or open (Ravitch) repair.','انخفاض خلفي لعظم القص والغضاريف الضلعية؛ يُصحَّح التشوه الشديد بقضيب طفيف التوغل (ناس) أو إصلاح مفتوح (رافيتش).'),
      ('LB00.Y','eventration of diaphragm','ارتخاء الحجاب الحاجز','Abnormal elevation of an intact but thinned/paralysed hemidiaphragm; symptomatic cases are treated by diaphragmatic plication.','ارتفاع شاذ لنصف حجاب حاجز سليم لكن رقيق أو مشلول؛ تُعالَج الحالات العرضية بطيّ الحجاب الحاجز.'),
      ('LB00.1','absence (agenesis) of diaphragm','غياب الحجاب الحاجز (عدم التخلّق)','Severe congenital absence of part or all of a hemidiaphragm with herniation of viscera into the chest; requires prosthetic or muscle-flap repair.','غياب خلقي شديد لجزء أو كامل نصف الحجاب الحاجز مع فتق الأحشاء إلى الصدر؛ يتطلب إصلاحاً برقعة صناعية أو شريحة عضلية.'),
      ('LB13.1','congenital hiatus hernia','فتق الحجاب الحاجز الفجوي الخلقي','Congenital herniation of the stomach through the oesophageal hiatus causing reflux and feeding difficulty; managed by fundoplication and hiatal repair.','فتق خلقي للمعدة عبر الفجوة المريئية يسبب الارتجاع وصعوبة التغذية؛ يُدار بطيّ القاع وإصلاح الفجوة.'),
      ('LB12.1Z','oesophageal atresia without fistula','رتق المريء دون ناسور','Pure (long-gap) oesophageal atresia with no tracheo-oesophageal fistula; managed by gastrostomy then delayed primary repair or oesophageal replacement.','رتق مريء صرف (فجوة طويلة) دون ناسور رغامي مريئي؛ يُدار بفغر المعدة ثم إصلاح أولي مؤجَّل أو استبدال المريء.'),
      ('LB12.2','tracheo-oesophageal fistula without atresia (H-type)','الناسور الرغامي المريئي دون رتق (النوع H)','Isolated H-type fistula between trachea and oesophagus presenting with coughing on feeds and recurrent pneumonia; divided surgically via a cervical approach.','ناسور معزول من النوع H بين الرغامى والمريء يتظاهر بالسعال عند الرضاعة والتهاب رئة متكرر؛ يُقطع جراحياً عبر مدخل رقبي.'),
      ('LB12.3','congenital oesophageal stenosis','تضيّق المريء الخلقي','Intrinsic congenital narrowing of the oesophagus (often tracheobronchial remnants) causing dysphagia; treated by dilatation or resection.','تضيّق خلقي ذاتي للمريء (غالباً بقايا رغامية قصبية) يسبب عسر البلع؛ يُعالَج بالتوسيع أو الاستئصال.'),
      ('LB12.Y','oesophageal duplication cyst','كيس ازدواج المريء','Foregut duplication cyst adjacent to the oesophagus causing compression or dysphagia; excised surgically.','كيس ازدواج من الأمعاء الأمامية مجاور للمريء يسبب الضغط أو عسر البلع؛ يُستأصل جراحياً.'),
      ('GB00.0','encysted hydrocele','القيلة المائية المكيّسة','A loculated hydrocele of the cord or tunica that does not communicate with the peritoneum; excised if persistent or symptomatic.','قيلة مائية محجَّرة في الحبل أو الغلالة لا تتصل بالصفاق؛ تُستأصل إذا استمرت أو كانت عرضية.'),
      ('BD75.1','scrotal varicocele','دوالي الصفن (القيلة الدوالية)','Dilatation of the pampiniform venous plexus, usually left-sided in adolescents; large or symptomatic lesions affecting testicular growth are ligated.','توسّع الضفيرة الوريدية المحلاقية، غالباً أيسر لدى المراهقين؛ تُربَط الآفات الكبيرة أو العرضية المؤثرة في نمو الخصية.'),
      ('GB01.0','torsion of testis','انفتال الخصية','Twisting of the spermatic cord causing acute ischaemia of the testis; a surgical emergency requiring urgent detorsion and bilateral orchidopexy.','التواء الحبل المنوي مسبباً نقص تروية حاد للخصية؛ حالة جراحية طارئة تتطلب فك الالتواء العاجل وتثبيت الخصيتين.'),
      ('LB52.0','ectopic testis','الخصية الهاجرة (المنتبذة)','A testis that has descended outside the normal scrotal path (e.g. perineal, femoral); relocated by orchidopexy.','خصية نزلت خارج المسار الصفني الطبيعي (مثل العجاني أو الفخذي)؛ تُعاد بتثبيت الخصية.'),
      ('LB42.2','congenital rectovaginal fistula','الناسور المستقيمي المهبلي الخلقي','Abnormal congenital communication between rectum and vagina, part of an anorectal malformation; repaired by posterior sagittal anorectoplasty.','اتصال خلقي شاذ بين المستقيم والمهبل ضمن تشوه شرجي مستقيمي؛ يُصلَح برأب الشرج والمستقيم الإكليلي الخلفي.'),
      ('GC04.0','rectourethral fistula','الناسور المستقيمي الإحليلي','Communication between rectum and urethra, the commonest fistula in male anorectal malformation; divided during PSARP.','اتصال بين المستقيم والإحليل، أشيع ناسور في التشوه الشرجي المستقيمي عند الذكور؛ يُقطع أثناء رأب الشرج الإكليلي الخلفي.'),
      ('LB17.Y','rectal duplication cyst','كيس ازدواج المستقيم','Hindgut duplication cyst adjacent to the rectum presenting as a presacral mass or obstruction; excised surgically.','كيس ازدواج من الأمعاء الخلفية مجاور للمستقيم يتظاهر بكتلة أمام عجزية أو انسداد؛ يُستأصل جراحياً.'),
      ('DB51','stenosis of anal canal','تضيّق القناة الشرجية','Narrowing of the anal canal (congenital or post-operative) causing constipation and obstructed defecation; treated by dilatation or anoplasty.','تضيّق القناة الشرجية (خلقي أو بعد الجراحة) يسبب الإمساك وعسر التغوّط؛ يُعالَج بالتوسيع أو رأب الشرج.'),
      ('DD51/ME24.2','obstructed (incarcerated) inguinal hernia','فتق إربي محتبس (مع انسداد)','Irreducible inguinal hernia with bowel obstruction in an infant; a surgical emergency requiring urgent reduction and herniotomy.','فتق إربي غير قابل للرد مع انسداد معوي لدى الرضيع؛ حالة جراحية طارئة تتطلب رداً عاجلاً وقطع الفتق.'),
      ('DD51&XT44','recurrent inguinal hernia','فتق إربي ناكس','Re-herniation after a previous inguinal hernia repair; re-explored and repaired, addressing the missed sac or recurrence cause.','عودة الفتق بعد إصلاح فتق إربي سابق؛ يُعاد استكشافه وإصلاحه مع معالجة الكيس المُغفَل أو سبب النكس.'),
      ('DD52','femoral hernia','فتق فخذي','Herniation through the femoral canal below the inguinal ligament; rare in children, with high incarceration risk, repaired surgically.','فتق عبر القناة الفخذية أسفل الرباط الإربي؛ نادر لدى الأطفال وعالي خطر الاحتباس، ويُصلَح جراحياً.'),
      ('LB4Y','hydrocele of the canal of Nuck','القيلة المائية لقناة نوك','The female equivalent of a cord hydrocele, a fluid collection in the patent processus vaginalis of the inguinal canal; excised with high ligation.','المكافئ الأنثوي لقيلة الحبل، تجمّع سائل في الناتئ المهبلي السالك بالقناة الإربية؛ يُستأصل مع ربط عالٍ.'),
      ('DA91.1','volvulus of small intestine (midgut volvulus)','انفتال الأمعاء الدقيقة (انفتال الأمعاء المتوسطة)','Twisting of the midgut around a narrow mesenteric pedicle (with malrotation) causing acute strangulating obstruction; emergency Ladd procedure and detorsion.','التواء الأمعاء المتوسطة حول معنق مساريقي ضيّق (مع سوء الدوران) مسبباً انسداداً خانقاً حاداً؛ عملية لاد طارئة وفك الالتواء.'),
      ('DB30.1&XA8YJ9','sigmoid volvulus','انفتال القولون السيني','Torsion of a redundant sigmoid colon causing large-bowel obstruction; treated by endoscopic detorsion and elective sigmoid resection.','التواء قولون سيني فائض يسبب انسداد الأمعاء الغليظة؛ يُعالَج بفك الالتواء بالمنظار واستئصال سيني انتقائي.'),
      ('DA40.2','gastric volvulus','انفتال المعدة','Abnormal rotation of the stomach (organoaxial or mesenteroaxial) causing obstruction and strangulation; managed by detorsion and gastropexy.','دوران شاذ للمعدة (عضوي محوري أو مساريقي محوري) يسبب الانسداد والاختناق؛ يُدار بفك الالتواء وتثبيت المعدة.'),
      ('DD50.2Z','intra-abdominal (internal) hernia','الفتق الداخلي البطني','Herniation of bowel through a mesenteric or peritoneal defect causing obstruction; reduced and the defect closed at surgery.','فتق الأمعاء عبر عيب مساريقي أو صفاقي يسبب الانسداد؛ يُرَد ويُغلَق العيب جراحياً.'),
      ('LB15.1','atresia of small intestine (jejunoileal atresia)','رتق الأمعاء الدقيقة (الصائم واللفائفي)','Congenital interruption of the jejunal or ileal lumen presenting with neonatal bilious vomiting and distension; resected with primary anastomosis.','انقطاع خلقي للمعة الصائم أو اللفائفي يتظاهر بقيء صفراوي وانتفاخ وليدي؛ يُستأصل مع مفاغرة أولية.'),
      ('LB16.0','congenital atresia of large intestine (colonic atresia)','رتق الأمعاء الغليظة (رتق القولون)','Rare congenital atresia of the colon causing distal bowel obstruction in the newborn; managed by resection and staged or primary anastomosis.','رتق خلقي نادر للقولون يسبب انسداداً معوياً قاصياً عند الوليد؛ يُدار بالاستئصال والمفاغرة المرحلية أو الأولية.'),
      ('KB87.2','meconium ileus without perforation','العلوص العقيي (انسداد العقي)','Distal ileal obstruction by inspissated meconium, almost always associated with cystic fibrosis; relieved by contrast enema or enterotomy.','انسداد لفائفي قاصي بالعقي المتيبّس، يرتبط دائماً تقريباً بالتليّف الكيسي؛ يُزال بحقنة شرجية ظليلة أو فغر معوي.'),
      ('LB20.21','biliary atresia','رتق القنوات الصفراوية','Progressive obliteration of the extrahepatic bile ducts causing neonatal cholestasis; treated by Kasai portoenterostomy, with transplant for failure.','انسداد متفاقم للقنوات الصفراوية خارج الكبد يسبب ركوداً صفراوياً وليدياً؛ يُعالَج بمفاغرة كاساي البابية المعوية، مع الزرع عند الفشل.'),
      ('LB21.0','annular pancreas','البنكرياس الحلقي','A ring of pancreatic tissue encircling the duodenum causing congenital duodenal obstruction; bypassed by duodenoduodenostomy.','حلقة من نسيج البنكرياس تطوّق الاثني عشر مسبّبة انسداداً اثني عشرياً خلقياً؛ يُتجاوَز بمفاغرة اثني عشرية اثني عشرية.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'PEDSURG' AND d."icdCode" = ANY($1) ON CONFLICT DO NOTHING`,
      [AddPedsurgDiagnosesBatch11750000000093.CODES]);

    await this.linkMain(queryRunner, "abdominal wall defects", ["LB31.3", "LB17.3", "LD2F.10"]);
    await this.linkMain(queryRunner, "umbilical hernia", ["LB03.0"]);
    await this.linkMain(queryRunner, "appendicitis", ["DB10.00", "DB10.01", "DB11.6"]);
    await this.linkMain(queryRunner, "thoracic & lung anomalies", ["LA75.4", "LA75.6", "LA75.5", "LA74.Y", "LB73.13"]);
    await this.linkMain(queryRunner, "congenital diaphragmatic hernia", ["LB00.Y", "LB00.1", "LB13.1"]);
    await this.linkMain(queryRunner, "esophageal atresia", ["LB12.1Z", "LB12.2", "LB12.3", "LB12.Y"]);
    await this.linkMain(queryRunner, "hydrocele", ["GB00.0", "BD75.1", "GB01.0", "LB52.0"]);
    await this.linkMain(queryRunner, "imperforate anus", ["LB42.2", "GC04.0", "LB17.Y", "DB51"]);
    await this.linkMain(queryRunner, "inguinal hernia", ["DD51/ME24.2", "DD51&XT44", "DD52", "LB4Y"]);
    await this.linkMain(queryRunner, "malrotation & volvulus", ["DA91.1", "DB30.1&XA8YJ9", "DA40.2", "DD50.2Z"]);
    await this.linkMain(queryRunner, "neonatal emergencies", ["LB15.1", "LB16.0", "KB87.2", "LB20.21", "LB21.0"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddPedsurgDiagnosesBatch11750000000093.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))`, [codes]);
    // Shared rows (already owned by other depts via ON CONFLICT) must not be deleted; delete only PEDSURG-introduced rows.
    await queryRunner.query(
      `DELETE FROM "diagnoses" d WHERE d."icdCode" = ANY($1)
         AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = d.id)`, [codes]);
  }
}
