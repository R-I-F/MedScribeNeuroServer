import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendGsDiagnosesBatch11750000000066 implements MigrationInterface {
  name = "ExtendGsDiagnosesBatch11750000000066";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Insert 15 new diagnoses ────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      (
        'NB91.4Z',
        'injury of pancreas, unspecified',
        'إصابة البنكرياس غير المحددة',
        'Traumatic injury to the pancreas, most commonly caused by blunt abdominal trauma (steering-wheel, handlebar); classified by AAST grade I–V based on ductal involvement; presentations range from isolated contusion to complete transection with main pancreatic duct disruption; amylase elevation is an early indicator; management ranges from drainage alone (grades I–II) to distal pancreatectomy or Whipple procedure (grades IV–V).',
        'إصابة رضية للبنكرياس، ينجم أغلبها عن رضح بطني حاد (عجلة القيادة، المقود)؛ تصنَّف وفق درجات AAST I–V بناءً على تأثر القناة البنكرياسية؛ تتراوح المظاهر بين كدمة بسيطة وبتر كامل مع قطع القناة البنكرياسية الرئيسية؛ ارتفاع الأميلاز مؤشر مبكر؛ تتراوح المعالجة بين التصريف وحده (الدرجتان I–II) واستئصال البنكرياس البعيد أو عملية ويبل (الدرجتان IV–V).'
      ),
      (
        'NB91.7Z',
        'injury of small intestine, unspecified',
        'إصابة الأمعاء الدقيقة غير المحددة',
        'Traumatic injury to the small intestine, typically resulting from blunt (deceleration, lap-belt) or penetrating (stab/gunshot) abdominal trauma; spectrum includes contusion, mesenteric haematoma, serosal tear, and full-thickness perforation; perforations cause peritonitis and require prompt operative repair (primary suture or resection with anastomosis) to prevent sepsis.',
        'إصابة رضية في الأمعاء الدقيقة، تنجم عادةً عن رضح حاد (إبطاء مفاجئ، حزام الأمان) أو رضح نافذ (طعن/رصاص)؛ يتراوح الطيف بين الكدمة والورم الدموي المساريقي والتمزق المصلي والانثقاب الجداري الكامل؛ الانثقابات تسبب التهاب الصفاق وتستوجب تدخلاً جراحياً عاجلاً (إصلاح أولي أو استئصال مع مفاغرة) لمنع الإنتان.'
      ),
      (
        'NB91.8Z',
        'injury of colon, unspecified',
        'إصابة القولون غير المحددة',
        'Traumatic injury to the colon from blunt or penetrating abdominal trauma; less common than small bowel injury in blunt trauma but more frequent in penetrating trauma; colonic injuries carry higher infection risk due to faecal contamination; management depends on haemodynamic stability, degree of contamination, and time from injury — options include primary repair, resection with anastomosis, or diverting colostomy (Hartmann procedure).',
        'إصابة رضية في القولون ناجمة عن رضح بطني حاد أو نافذ؛ أقل شيوعاً من إصابات الأمعاء الدقيقة في الرضح الحاد لكنها أكثر في الرضح النافذ؛ تحمل خطراً أعلى للعدوى بسبب التلوث البرازي؛ المعالجة تعتمد على الاستقرار الديناميكي الدموي ودرجة التلوث والوقت منذ الإصابة — خيارات الإصلاح الأولي أو الاستئصال مع المفاغرة أو القولونية التحويلية (عملية هارتمان).'
      ),
      (
        'DD30.0',
        'acute mesenteric ischaemia',
        'نقص تروية المساريق الحاد',
        'Sudden reduction in intestinal blood flow leading to bowel ischaemia and infarction; causes include superior mesenteric artery embolism (most common, ~50%), arterial thrombosis, mesenteric venous thrombosis, and non-occlusive mesenteric ischaemia (NOMI); presents with severe periumbilical pain out of proportion to physical findings; early CT angiography is diagnostic; treatment is urgent surgical or endovascular revascularisation followed by bowel resection of non-viable segments; mortality exceeds 60% when diagnosis is delayed.',
        'انخفاض مفاجئ في تدفق الدم المعوي يؤدي إلى نقص تروية الأمعاء واحتشائها؛ الأسباب تشمل انصمام شريان المساريق العلوي (الأكثر شيوعاً ~50%)، والتخثر الشرياني، والتخثر الوريدي المساريقي، ونقص التروية المساريقية غير الانسدادي؛ يتظاهر بألم شديد حول السرة لا يتناسب مع الفحص الجسدي؛ التصوير المقطعي الوعائي المبكر هو المعيار التشخيصي؛ العلاج هو الاستعادة العاجلة للتروية جراحياً أو بالتداخل الوعائي تليها استئصال قطاعات الأمعاء غير الحيّة؛ تتجاوز الوفاة 60% عند تأخر التشخيص.'
      ),
      (
        'ME24.9Z',
        'gastrointestinal bleeding, unspecified',
        'نزيف الجهاز الهضمي غير المحدد',
        'Bleeding from any site within the gastrointestinal tract, classified as upper (proximal to ligament of Treitz) or lower (distal); upper GI bleeding (peptic ulcer, varices, Mallory-Weiss) presents as haematemesis or melaena; lower GI bleeding (diverticular, angiodysplasia, colorectal malignancy) presents as haematochezia; initial management includes haemodynamic resuscitation, PPI therapy for upper GI bleeding, urgent endoscopy for localisation and haemostasis.',
        'نزيف من أي موضع في الجهاز الهضمي، يصنَّف إلى علوي (قبل رباط تريتز) وسفلي (بعده)؛ نزيف الجهاز الهضمي العلوي (القرحة الهضمية، الدوالي، تمزق مالوري-فايس) يتظاهر بالقيء الدموي أو البراز القطراني؛ نزيف الجهاز الهضمي السفلي (الرتوج، تشوه الأوعية، سرطان القولون) يتظاهر بنزيف دموي مشرق في البراز؛ الإدارة الأولية تشمل الإنعاش الديناميكي الدموي وعلاج مثبطات مضخة البروتون والتنظير العاجل للتحديد والإيقاف.'
      ),
      (
        'ME24.A1',
        'haemorrhage of anus and rectum',
        'نزيف الشرج والمستقيم',
        'Bleeding originating from the anorectal region; causes include haemorrhoids (most common), anal fissure, anorectal tumour, proctitis, solitary rectal ulcer, and rectal varices; presents as bright-red blood per rectum, on tissue paper, or dripping into the toilet pan; workup includes proctoscopy and/or flexible sigmoidoscopy/colonoscopy to exclude neoplasia; treatment is directed at the underlying cause.',
        'نزيف ينشأ من المنطقة الشرجية الشرجية المستقيمية؛ الأسباب تشمل البواسير (الأكثر شيوعاً)، والشق الشرجي، وأورام المستقيم الشرجية، والتهاب المستقيم، والقرحة المستقيمية المنفردة، والدوالي المستقيمية؛ يتظاهر بدم أحمر فاتح من المستقيم أو على ورق المرحاض أو منتثراً في الإناء؛ التقييم يشمل التنظير الشرجي أو التنظير الانعطافي/التنظير الكولوني لاستبعاد الأورام؛ العلاج يستهدف السبب الجذري.'
      ),
      (
        'DB50.1',
        'anal fistula',
        'ناسور شرجي',
        'Abnormal tract between the anal canal or rectum and the perianal skin, most commonly arising from a cryptoglandular infection that tracks through the sphincter complex; classified by Parks classification into intersphincteric, transsphincteric, suprasphincteric, and extrasphincteric types; associated with Crohn''s disease, tuberculosis, and pelvic sepsis; treatment requires surgical drainage (fistulotomy for simple low fistulas; seton, fibrin glue, LIFT, or advancement flap for complex high fistulas) to prevent continence damage.',
        'قناة مرضية غير طبيعية بين القناة الشرجية أو المستقيم والجلد المحيط بالشرج، تنشأ في الغالب من عدوى غدية شرجية تمتد عبر معقد العضلة العاصرة؛ تصنَّف بتصنيف باركس إلى بين-عاصر، وعبر-عاصر، وفوق-عاصر، وخارج-عاصر؛ مرتبطة بداء كرون والسل والإنتان الحوضي؛ تستلزم المعالجة التصريف الجراحي (فتح الناسور للنواسير المنخفضة البسيطة؛ الليكس أو الغراء الفيبريني أو LIFT أو رفرف التقدم للنواسير العالية المعقدة) لتفادي الإضرار بالامتناع.'
      ),
      (
        'DB31.2',
        'rectal prolapse',
        'استرخاء المستقيم',
        'Full-thickness protrusion of the rectum through the anal orifice; classified as mucosal, partial-thickness, or complete (procidentia); risk factors include chronic straining, multiparity, pelvic floor weakness, and neurological conditions; presents with a reducible or irreducible mass protruding from the anus, mucous discharge, and faecal incontinence; treatment options include perineal approaches (Delorme, Altemeier) and abdominal rectopexy (open or laparoscopic) for surgical correction.',
        'بروز جداري كامل للمستقيم عبر الفتحة الشرجية؛ يصنَّف إلى مخاطي وجزئي السماكة وكامل (استرخاء تام)؛ عوامل الخطر تشمل الإجهاد المزمن، وتعدد الولادات، وضعف عضلات قاع الحوض، والحالات العصبية؛ يتظاهر بكتلة قابلة أو غير قابلة للإرجاع تبرز من الشرج مع إفراز مخاطي وسلس براز؛ خيارات المعالجة تشمل المناهج العجانية (دولورم، ألتماير) وتثبيت المستقيم بالبطن (مفتوح أو بالمنظار) للإصلاح الجراحي.'
      ),
      (
        'DA91.0',
        'intussusception of small intestine',
        'انغلاف الأمعاء الدقيقة',
        'Telescoping of a proximal segment of small intestine (intussusceptum) into a distal segment (intussuscipiens), causing bowel obstruction and vascular compromise; in adults, a pathological lead point (polyp, tumour, Meckel''s diverticulum) is present in the majority; presents with colicky abdominal pain, vomiting, and a sausage-shaped abdominal mass; CT is diagnostic; treatment in adults is primarily surgical exploration and resection due to the high likelihood of a malignant lead point.',
        'ارتطام قطعة قريبة من الأمعاء الدقيقة (المنغلِف) داخل قطعة بعيدة (المنغلَف فيه)، مما يسبب انسداداً معوياً واضطراباً وعائياً؛ لدى البالغين توجد نقطة قيادة مرضية (ورم حميد، ورم خبيث، رتج ميكل) في أغلب الحالات؛ يتظاهر بألم بطني تقلصي وقيء وكتلة بطنية مستطيلة على شكل سجقة؛ التصوير المقطعي تشخيصي؛ العلاج عند البالغين هو الاستكشاف الجراحي والاستئصال بسبب احتمالية عالية لنقطة قيادة خبيثة.'
      ),
      (
        'DB61',
        'perianal venous thrombosis',
        'تجلط وريدي حول الشرج',
        'Acute thrombosis of an external haemorrhoidal or perianal subcutaneous vein forming a tender bluish perianal lump; caused by straining, constipation, prolonged sitting, or diarrhoea; presents with sudden severe perianal pain and a tense, purple subcutaneous nodule; treatment within 72 hours is excision under local anaesthesia for immediate relief; conservative management (analgesia, warm soaks, topical nitroglycerin) is appropriate for presentations beyond 72 hours when pain is subsiding.',
        'تجلط حاد في وريد بواسير خارجي أو وريد تحت جلدي حول الشرج يكوّن كتلة شرجية مؤلمة مزرقة؛ ينجم عن الإجهاد والإمساك والجلوس المطوّل أو الإسهال؛ يتظاهر بألم شرجي حاد مفاجئ وعقيدة بنفسجية متوترة تحت الجلد؛ العلاج خلال 72 ساعة هو الاستئصال تحت تخدير موضعي للراحة الفورية؛ المعالجة المحافظة (مسكنات، نقع دافئ، نيتروغليسرين موضعي) مناسبة في الحالات التي تتجاوز 72 ساعة عند تراجع الألم.'
      ),
      (
        'LB15.0',
        'Meckel diverticulum',
        'رتج ميكل',
        'Congenital true diverticulum of the ileum arising from incomplete obliteration of the omphalomesenteric duct; follows the "rule of 2s" (2% prevalence, 2 feet from ileocaecal valve, 2 inches long, 2:1 male predominance); may contain ectopic gastric or pancreatic mucosa; complications include bleeding (from ectopic gastric mucosa causing peptic ulceration), intestinal obstruction (via intussusception, volvulus, or internal herniation), and Meckel''s diverticulitis; treatment is diverticulectomy or ileal resection for symptomatic cases.',
        'رتج حقيقي خلقي في اللفائفي ينجم عن عدم اندثار القناة السُّرية-المساريقية؛ يتبع "قاعدة الثنائيات" (انتشار 2%، على بعد 2 قدم من الصمام اللفائفي الأعوري، طوله 2 إنش، نسبة ذكور 2:1)؛ قد يحتوي مخاطية معدية أو بنكرياسية خارج مكانها الطبيعي؛ المضاعفات تشمل النزيف (من المخاطية المعدية المسببة لتقرح هضمي)، وانسداد الأمعاء (عبر الانغلاف أو الالتواء أو الفتق الداخلي)، والتهاب رتج ميكل؛ العلاج هو رتجية الاستئصال أو استئصال اللفائفي للحالات العرضية.'
      ),
      (
        'DB10.00',
        'perforated appendicitis with generalised peritonitis',
        'التهاب الزائدة الدودية المثقوب مع التهاب صفاق عام',
        'Acute appendicitis complicated by perforation of the appendix with generalised spread of faeculent or purulent material into the peritoneal cavity; represents the most severe end of the appendicitis spectrum; presents with diffuse abdominal rigidity, severe pain, and systemic signs of sepsis; CT confirms free air or generalised peritoneal soiling; treatment is emergency appendectomy (open or laparoscopic) with peritoneal lavage and antibiotic coverage; carries higher morbidity (wound infection, intra-abdominal abscess, prolonged ileus) than uncomplicated appendicitis.',
        'التهاب الزائدة الدودية الحاد المتعقد بانثقاب الزائدة مع انتشار عام للمواد البرازية أو القيحية في تجويف الصفاق؛ يمثّل أشد مراحل طيف التهاب الزائدة خطورة؛ يتظاهر بصلابة بطنية منتشرة وألم شديد وعلامات إنتانية جهازية؛ التصوير المقطعي يؤكد الهواء الحر أو التلوث الصفاقي العام؛ العلاج هو استئصال الزائدة الدودية الطارئ (مفتوح أو بالمنظار) مع غسيل الصفاق وتغطية بالمضادات الحيوية؛ يحمل مراضة أعلى (عدوى الجرح، خراج داخل البطن، إيليوس مطوَّل) مقارنةً بالتهاب الزائدة غير المعقد.'
      ),
      (
        '5A44',
        'metabolic syndrome',
        'متلازمة التمثيل الغذائي',
        'Cluster of interrelated metabolic risk factors comprising central obesity (elevated waist circumference), dyslipidaemia (elevated triglycerides, low HDL-cholesterol), elevated fasting plasma glucose or impaired glucose tolerance, and elevated blood pressure; defined by IDF or ATP III criteria; strongly associated with insulin resistance; confers two-fold increased risk of cardiovascular disease and five-fold increased risk of type 2 diabetes; management involves lifestyle modification (diet, exercise, weight loss) and targeted pharmacotherapy for individual risk factors.',
        'مجموعة من عوامل الخطر الاستقلابية المترابطة تشمل السمنة المركزية (ارتفاع محيط الخصر)، وخلل الدهون (ارتفاع الدهون الثلاثية، وانخفاض الكوليسترول مرتفع الكثافة)، وارتفاع سكر الدم الصيامي أو ضعف تحمّل الغلوكوز، وارتفاع ضغط الدم؛ يُعرَّف بمعايير IDF أو ATP III؛ مرتبط ارتباطاً وثيقاً بمقاومة الأنسولين؛ يُضاعف خطر أمراض القلب والأوعية ضعفين ويُضاعف خطر النوع الثاني من السكري خمسة أضعاف؛ الإدارة تشمل تعديل نمط الحياة (النظام الغذائي، الرياضة، فقدان الوزن) والعلاج الدوائي الموجّه لعوامل الخطر الفردية.'
      ),
      (
        'DB92.0',
        'non-alcoholic fatty liver disease',
        'مرض الكبد الدهني غير الكحولي',
        'Hepatic steatosis (fat accumulation in >5% of hepatocytes) occurring in the absence of significant alcohol consumption; the hepatic manifestation of metabolic syndrome, strongly associated with obesity, type 2 diabetes, dyslipidaemia, and insulin resistance; spectrum ranges from simple steatosis (reversible) to non-alcoholic steatohepatitis (NASH) and cirrhosis; diagnosis by imaging (ultrasound, MRI-PDFF) or liver biopsy; primary treatment is weight loss (≥7–10%) via diet and exercise, with emerging pharmacotherapy (semaglutide, resmetirom).',
        'تراكم دهون في الكبد (في >5% من خلايا الكبد) في غياب استهلاك كحولي معتبر؛ هو المظهر الكبدي لمتلازمة التمثيل الغذائي، ويرتبط ارتباطاً وثيقاً بالسمنة وداء السكري من النوع الثاني وخلل الدهون ومقاومة الأنسولين؛ يتراوح الطيف من التدهن البسيط (قابل للانعكاس) إلى التهاب الكبد الدهني غير الكحولي وتليّف الكبد؛ التشخيص بالتصوير (الموجات فوق الصوتية أو MRI-PDFF) أو خزعة الكبد؛ العلاج الأساسي هو إنقاص الوزن (≥7–10%) بالنظام الغذائي والرياضة، مع ظهور علاجات دوائية واعدة (سيماغلوتايد، ريزمتيروم).'
      ),
      (
        'DB92.1',
        'non-alcoholic steatohepatitis',
        'التهاب الكبد الدهني غير الكحولي',
        'Progressive subtype of non-alcoholic fatty liver disease characterised by hepatic steatosis with hepatocyte injury (ballooning degeneration), lobular inflammation, and varying degrees of fibrosis; 20% of NAFLD patients have NASH; risk of progression to cirrhosis and hepatocellular carcinoma is significantly higher than in simple steatosis; diagnosis requires liver biopsy (NAS score ≥5); pharmacological treatment includes vitamin E (non-diabetics) and pioglitazone; bariatric surgery can induce NASH resolution in obese patients.',
        'نمط تدريجي من مرض الكبد الدهني غير الكحولي يتميز بتدهن كبدي مع إصابة خلوية (تنكّس بالوني)، والتهاب فصيصي، وتليف بدرجات متفاوتة؛ 20% من مرضى NAFLD لديهم NASH؛ خطر التطور إلى تليّف الكبد والسرطان الكبدي الخلوي أعلى بكثير من التدهن البسيط؛ يستلزم التشخيص خزعة الكبد (درجة NAS ≥5)؛ العلاج الدوائي يشمل فيتامين E (غير السكريين) والبيوغليتازون؛ جراحة السمنة يمكن أن تحقق شفاءً من NASH لدى المرضى البدينين.'
      )
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    // ── 2. Link all 15 to GS department ──────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
      SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS'
        AND d."icdCode" IN (
          'NB91.4Z','NB91.7Z','NB91.8Z',
          'DD30.0','ME24.9Z','ME24.A1','DB50.1','DB31.2','DA91.0','DB61','LB15.0',
          'DB10.00',
          '5A44','DB92.0','DB92.1'
        )
      ON CONFLICT DO NOTHING
    `);

    // ── 3. Link to main_diags ─────────────────────────────────────────────

    // abdominal trauma
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'abdominal trauma'
        AND d."icdCode" IN ('NB91.4Z','NB91.7Z','NB91.8Z')
      ON CONFLICT DO NOTHING
    `);

    // acute abdomen (8 diagnoses)
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'acute abdomen'
        AND d."icdCode" IN ('DD30.0','ME24.9Z','ME24.A1','DB50.1','DB31.2','DA91.0','DB61','LB15.0')
      ON CONFLICT DO NOTHING
    `);

    // DA91.0 also → bowel obstruction
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'bowel obstruction' AND d."icdCode" = 'DA91.0'
      ON CONFLICT DO NOTHING
    `);

    // LB15.0 also → bowel obstruction
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'bowel obstruction' AND d."icdCode" = 'LB15.0'
      ON CONFLICT DO NOTHING
    `);

    // appendicitis
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'appendicitis' AND d."icdCode" = 'DB10.00'
      ON CONFLICT DO NOTHING
    `);

    // DB10.00 also → perforated viscus
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'perforated viscus' AND d."icdCode" = 'DB10.00'
      ON CONFLICT DO NOTHING
    `);

    // bariatric conditions
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'bariatric conditions'
        AND d."icdCode" IN ('5A44','DB92.0','DB92.1')
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = [
      'NB91.4Z','NB91.7Z','NB91.8Z',
      'DD30.0','ME24.9Z','ME24.A1','DB50.1','DB31.2','DA91.0','DB61','LB15.0',
      'DB10.00',
      '5A44','DB92.0','DB92.1',
    ];
    const list = codes.map(c => `'${c}'`).join(',');
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" IN (${list}))`);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" IN (${list}))`);
    await queryRunner.query(`DELETE FROM "diagnoses" WHERE "icdCode" IN (${list})`);
  }
}
