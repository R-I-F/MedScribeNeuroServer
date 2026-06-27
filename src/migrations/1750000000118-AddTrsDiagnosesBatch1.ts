import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * TRS coverage extension — diagnoses batch 1 of 3 (liver + renal transplant indications).
 * Inserts 33 new diagnoses (some already exist as shared rows — 2C12.02 HCC [GS/HBP/SOC],
 * DB96.2Z PSC [HBP], DB99.2 hepatorenal [HBP] — ON CONFLICT skips the insert and links TRS)
 * and links them to TRS + their main_diags (liver transplant, donor hepatectomy, multi-organ,
 * renal transplant, donor nephrectomy). All ICD-11 codes verified via icd11_search (AUDIT_TRS.md 2D).
 * Runs after MIG-A (117).
 */
export class AddTrsDiagnosesBatch11750000000118 implements MigrationInterface {
  name = "AddTrsDiagnosesBatch11750000000118";

  private static readonly CODES = [
    // liver
    "DB94.3", "DB92.1", "DB96.0", "DB96.2Z", "2C12.02", "5C64.00", "5C64.10", "5C5A", "LB20.21",
    "DB91.Z", "DB99.10", "DB99.2", "DB99.5", "DA26.0Z/DB98.7Z", "DB94.1Z", "LB20.00", "DB93.Y",
    "2C12.10", "2C12.01",
    // renal
    "GB40/MF8Y&XT8W", "GB41", "GB40&XT8W", "GB40", "4A40.0Y", "4A44.A1", "LD2H.Y", "GB56.5",
    "GB56.Y", "GB55.Z", "3A21.2", "MF85", "5C60.1", "5D00.1",
  ];

  private async linkMain(r: QueryRunner, mainDiag: string, codes: string[]): Promise<void> {
    await r.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'TRS' AND md.title = $1 AND d."icdCode" = ANY($2) ON CONFLICT DO NOTHING`, [mainDiag, codes]);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      ('DB94.3','alcoholic cirrhosis of liver','تليّف الكبد الكحولي','End-stage cirrhosis from chronic alcohol use; a leading indication for liver transplantation after a documented period of abstinence.','تليّف كبدي بالمرحلة النهائية ناجم عن إدمان الكحول المزمن؛ من أبرز دواعي زراعة الكبد بعد فترة موثّقة من الامتناع.'),
      ('DB92.1','non-alcoholic steatohepatitis','التهاب الكبد الدهني غير الكحولي','Metabolic (MASH/NASH) fatty-liver disease progressing to cirrhosis; an increasingly common transplant indication.','مرض الكبد الدهني الاستقلابي المترقّي إلى تليّف؛ من الدواعي المتزايدة لزراعة الكبد.'),
      ('DB96.0','autoimmune hepatitis','التهاب الكبد المناعي الذاتي','Chronic immune-mediated hepatitis that may progress to cirrhosis and end-stage liver failure requiring transplantation.','التهاب كبد مزمن مناعي المنشأ قد يترقّى إلى تليّف وفشل كبدي نهائي يستلزم الزراعة.'),
      ('DB96.2Z','primary sclerosing cholangitis','التهاب الأقنية الصفراوية المُصَلِّب الأولي','Progressive fibro-obliterative cholangiopathy causing biliary cirrhosis; a transplant indication, with risk of cholangiocarcinoma.','اعتلال صفراوي ليفي انسدادي مترقٍّ يسبب تليّفاً صفراوياً؛ من دواعي الزراعة مع خطر سرطان الأقنية الصفراوية.'),
      ('2C12.02','hepatocellular carcinoma','سرطانة الخلايا الكبدية','Primary liver cancer arising in cirrhosis; transplantation within Milan criteria is a curative option.','سرطان الكبد الأولي الناشئ في كبد متليّف؛ تُعدّ الزراعة ضمن معايير ميلانو خياراً شافياً.'),
      ('5C64.00','Wilson disease','داء ويلسون','Inherited copper-overload disorder causing cirrhosis and acute liver failure; transplantation is curative for the hepatic disease.','اضطراب وراثي بفرط تراكم النحاس يسبب التليّف والفشل الكبدي الحاد؛ الزراعة شافية للمرض الكبدي.'),
      ('5C64.10','hereditary haemochromatosis','داء ترسّب الأصبغة الدموية الوراثي','Inherited iron-overload disease causing cirrhosis and hepatocellular carcinoma; an indication for liver transplantation.','مرض وراثي بفرط الحديد يسبب التليّف وسرطان الخلايا الكبدية؛ من دواعي زراعة الكبد.'),
      ('5C5A','alpha-1 antitrypsin deficiency','عوز ألفا-1 أنتيتربسين','Inherited deficiency causing both liver cirrhosis and emphysema; a transplant indication for the hepatic (and sometimes pulmonary) disease.','عوز وراثي يسبب تليّف الكبد والنفاخ الرئوي؛ من دواعي الزراعة للمرض الكبدي (وأحياناً الرئوي).'),
      ('LB20.21','biliary atresia','رتق القنوات الصفراوية','Congenital obliteration of the bile ducts; the commonest indication for paediatric liver transplantation after failed Kasai portoenterostomy.','انسداد خلقي للقنوات الصفراوية؛ أشيع دواعي زراعة الكبد لدى الأطفال بعد فشل عملية كاساي.'),
      ('DB91.Z','acute (fulminant) hepatic failure','الفشل الكبدي الحاد (الصاعق)','Sudden severe loss of liver function with encephalopathy in a previously normal liver; an emergency transplant indication.','فقد حاد شديد لوظيفة الكبد مع اعتلال دماغي في كبد سليم سابقاً؛ من دواعي الزراعة الطارئة.'),
      ('DB99.10','polycystic liver disease','داء الكبد متعدد الكيسات','Massive hepatic cystic disease causing symptomatic hepatomegaly; transplantation is considered for severe disabling cases.','مرض كيسي كبدي واسع يسبب ضخامة كبد عَرَضية؛ تُدرَس الزراعة في الحالات الشديدة المُعجِزة.'),
      ('DB99.2','hepatorenal syndrome','المتلازمة الكبدية الكلوية','Functional renal failure complicating advanced cirrhosis; an indication for liver or combined liver-kidney transplantation.','فشل كلوي وظيفي يعقّد التليّف المتقدّم؛ من دواعي زراعة الكبد أو الزراعة المشتركة كبد-كلية.'),
      ('DB99.5','hepatic encephalopathy','الاعتلال الدماغي الكبدي','Neuropsychiatric dysfunction from hepatic insufficiency and portosystemic shunting; refractory cases support transplant listing.','خلل عصبي نفسي ناجم عن القصور الكبدي والتحويلة البابية الجهازية؛ تدعم الحالات المُعَنّدة إدراج المريض للزراعة.'),
      ('DA26.0Z/DB98.7Z','oesophageal varices with portal hypertension','دوالي المريء مع ارتفاع ضغط الدم البابي','Portosystemic collaterals from cirrhotic portal hypertension at risk of life-threatening bleeding; managed by banding, TIPS or transplantation.','مفاغرات بابية جهازية ناجمة عن ارتفاع ضغط الدم البابي التليّفي معرّضة لنزف مهدّد للحياة؛ تُدار بالربط أو التحويلة أو الزراعة.'),
      ('DB94.1Z','alcoholic hepatitis','التهاب الكبد الكحولي','Acute inflammatory alcohol-related liver injury; severe steroid-non-responsive cases may be considered for early transplantation.','إصابة كبدية التهابية حادة مرتبطة بالكحول؛ قد تُدرَس الحالات الشديدة غير المستجيبة للستيرويد للزراعة المبكّرة.'),
      ('LB20.00','Caroli disease','داء كارولي','Congenital fibropolycystic dilatation of intrahepatic bile ducts causing recurrent cholangitis; transplantation for diffuse disease.','توسّع خلقي ليفي كيسي للأقنية الصفراوية داخل الكبد يسبب التهاب أقنية متكرراً؛ الزراعة للمرض المنتشر.'),
      ('DB93.Y','secondary biliary cirrhosis','التليّف الكبدي الصفراوي الثانوي','Cirrhosis from chronic large-duct biliary obstruction; an indication for transplantation when end-stage.','تليّف ناجم عن انسداد صفراوي مزمن في الأقنية الكبيرة؛ من دواعي الزراعة عند بلوغ المرحلة النهائية.'),
      ('2C12.10','intrahepatic cholangiocarcinoma','سرطانة الأقنية الصفراوية داخل الكبد','Malignancy of the intrahepatic bile ducts; selected early cases are managed by resection or, in protocols, transplantation.','ورم خبيث في الأقنية الصفراوية داخل الكبد؛ تُدار الحالات المبكّرة المنتقاة بالاستئصال أو بالزراعة ضمن بروتوكولات.'),
      ('2C12.01','hepatoblastoma','الورم الأرومي الكبدي','The commonest paediatric liver malignancy; unresectable tumours after chemotherapy are an indication for liver transplantation.','أشيع ورم كبدي خبيث لدى الأطفال؛ الأورام غير القابلة للاستئصال بعد العلاج الكيميائي من دواعي زراعة الكبد.'),
      ('GB40/MF8Y&XT8W','focal segmental glomerulosclerosis','التصلّب الكبيبي البؤري القطعي','A podocytopathy causing nephrotic-range proteinuria and progressive renal failure; can recur in the renal allograft.','اعتلال خلايا قدمية يسبب بيلة بروتينية بمدى كلائي وفشلاً كلوياً مترقّياً؛ قد يتكرّر في الكلية المزروعة.'),
      ('GB41','membranous nephropathy','اعتلال الكلية الغشائي','Immune-complex glomerulopathy presenting with nephrotic syndrome and a leading cause of end-stage renal disease in adults.','اعتلال كبيبي بالمعقّدات المناعية يتظاهر بالمتلازمة الكلائية ومن أبرز أسباب المرض الكلوي النهائي لدى البالغين.'),
      ('GB40&XT8W','chronic glomerulonephritis','التهاب كبيبات الكلى المزمن','Chronic nephritic syndrome of varied aetiology progressing to end-stage renal disease requiring transplantation.','متلازمة كلوية مزمنة متعددة الأسباب تترقّى إلى مرض كلوي نهائي يستلزم الزراعة.'),
      ('GB40','rapidly progressive glomerulonephritis','التهاب كبيبات الكلى سريع التقدّم','Crescentic nephritis causing acute kidney failure over weeks; may lead to dialysis dependence and transplantation.','التهاب كلية هلالي يسبب فشلاً كلوياً حاداً خلال أسابيع؛ قد يؤدّي إلى الاعتماد على غسيل الكلى والزراعة.'),
      ('4A40.0Y','lupus nephritis','التهاب الكلية الذئبي','Glomerular involvement of systemic lupus erythematosus; severe forms progress to end-stage renal disease.','إصابة كبيبية في الذئبة الحمامية الجهازية؛ تترقّى الأشكال الشديدة إلى مرض كلوي نهائي.'),
      ('4A44.A1','granulomatosis with polyangiitis','الورام الحبيبي مع التهاب الأوعية المتعدّد','ANCA-associated small-vessel vasculitis causing crescentic glomerulonephritis and renal failure.','التهاب أوعية صغيرة مرتبط بالأضداد السيتوبلازمية للعدلات يسبب التهاباً كبيبياً هلالياً وفشلاً كلوياً.'),
      ('LD2H.Y','Alport syndrome','متلازمة ألبورت','Hereditary type IV collagen defect causing progressive nephritis, deafness and end-stage renal disease.','عيب وراثي في الكولاجين من النوع الرابع يسبب التهاب كلية مترقّياً وصمماً ومرضاً كلوياً نهائياً.'),
      ('GB56.5','reflux nephropathy with vesicoureteral reflux','اعتلال الكلية الارتجاعي مع الجزر المثاني الحالبي','Renal scarring from vesicoureteral reflux and recurrent pyelonephritis; a paediatric cause of end-stage renal disease.','تندّب كلوي ناجم عن الجزر المثاني الحالبي والتهاب الحويضة والكلية المتكرّر؛ سبب لمرض الكلى النهائي لدى الأطفال.'),
      ('GB56.Y','obstructive nephropathy','اعتلال الكلية الانسدادي','Renal damage from chronic urinary tract obstruction (eg posterior urethral valves) progressing to renal failure.','تلف كلوي ناجم عن انسداد مزمن في السبيل البولي (مثل الصمامات الإحليلية الخلفية) يترقّى إلى الفشل الكلوي.'),
      ('GB55.Z','chronic pyelonephritis','التهاب الحويضة والكلية المزمن','Chronic tubulo-interstitial nephritis from recurrent infection or reflux causing renal scarring and failure.','التهاب كلوي خلالي أنبوبي مزمن ناجم عن العدوى المتكرّرة أو الجزر يسبب تندّباً كلوياً وفشلاً.'),
      ('3A21.2','haemolytic uraemic syndrome','المتلازمة الانحلالية اليوريمية','Thrombotic microangiopathy with haemolysis, thrombocytopenia and acute kidney injury; atypical forms cause end-stage renal disease.','اعتلال وعائي مجهري خثاري مع انحلال دم ونقص صفيحات وأذية كلوية حادة؛ تسبب أشكاله غير النمطية مرضاً كلوياً نهائياً.'),
      ('MF85','anti-glomerular basement membrane disease','داء الغشاء القاعدي الكبيبي المضاد','Anti-GBM (Goodpasture) antibody disease causing crescentic glomerulonephritis and rapidly progressive renal failure.','داء الأضداد للغشاء القاعدي الكبيبي (غودباستشر) يسبب التهاباً كبيبياً هلالياً وفشلاً كلوياً سريع التقدّم.'),
      ('5C60.1','nephropathic cystinosis','البيلة السيستينية الكلوية','Lysosomal cystine-storage disorder causing Fanconi syndrome and childhood end-stage renal disease.','اضطراب خزن السيستين الجُسيمي الحالّ يسبب متلازمة فانكوني ومرضاً كلوياً نهائياً في الطفولة.'),
      ('5D00.1','AA amyloidosis','الداء النشواني من النوع AA','Reactive systemic amyloidosis from chronic inflammation with amyloid deposition in the kidney causing nephrotic syndrome and renal failure.','داء نشواني جهازي ارتكاسي ناجم عن الالتهاب المزمن مع ترسّب النشواني في الكلية يسبب متلازمة كلائية وفشلاً كلوياً.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'TRS' AND d."icdCode" = ANY($1) ON CONFLICT DO NOTHING`,
      [AddTrsDiagnosesBatch11750000000118.CODES]);

    const liver = ["DB94.3", "DB92.1", "DB96.0", "DB96.2Z", "2C12.02", "5C64.00", "5C64.10", "5C5A", "LB20.21",
      "DB91.Z", "DB99.10", "DB99.2", "DB99.5", "DA26.0Z/DB98.7Z", "DB94.1Z", "LB20.00", "DB93.Y", "2C12.10", "2C12.01"];
    const renal = ["GB40/MF8Y&XT8W", "GB41", "GB40&XT8W", "GB40", "4A40.0Y", "4A44.A1", "LD2H.Y", "GB56.5",
      "GB56.Y", "GB55.Z", "3A21.2", "MF85", "5C60.1", "5D00.1"];

    await this.linkMain(queryRunner, "liver transplant", liver);
    await this.linkMain(queryRunner, "renal transplant", renal);
    // hepatorenal also supports a combined liver-kidney (multi-organ) listing
    await this.linkMain(queryRunner, "multi-organ transplant", ["DB99.2"]);
    // donor categories draw on the recipient indications they serve (≥5 each)
    await this.linkMain(queryRunner, "donor hepatectomy", ["DB94.3", "2C12.02", "DB96.0", "DB91.Z", "DB99.5"]);
    await this.linkMain(queryRunner, "donor nephrectomy", ["4A40.0Y", "GB40&XT8W", "GB56.5", "GB55.Z", "3A21.2"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddTrsDiagnosesBatch11750000000118.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id WHERE dept.code = 'TRS')`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'TRS')`, [codes]);
    await queryRunner.query(`DELETE FROM "diagnoses" d WHERE d."icdCode" = ANY($1) AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = d.id)`, [codes]);
  }
}
