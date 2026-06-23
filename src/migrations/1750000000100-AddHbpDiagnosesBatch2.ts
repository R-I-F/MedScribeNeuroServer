import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * HBP coverage extension — batch 2 of 2 (34 diagnoses).
 * Categories: benign liver lesions, hepatocellular carcinoma (primary liver malignancies),
 * cholecystitis & choledocholithiasis, liver cirrhosis & portal hypertension, metastatic
 * liver disease.
 *
 * All ICD-11 codes verified via icd11_search (see MEDICAL_CODE_AUDITS/HBP/AUDIT_HBP.md).
 * Shared rows owned by GS (DC12.1 chronic cholecystitis, DB92.1 NASH) are skipped by
 * ON CONFLICT and simply linked to HBP. The "metastatic liver disease" category is documented
 * as a narrow category (4 dx) — few distinct ICD-11 secondary-neoplasm entities exist.
 */
export class AddHbpDiagnosesBatch21750000000100 implements MigrationInterface {
  name = "AddHbpDiagnosesBatch21750000000100";

  private static readonly CODES = [
    "2E92.7", "DB99.1Z", "DB99.10", "DB98.2", "2E81.2Y",
    "2C12.01", "2B56.3", "2C12.00", "2C12.0Y", "2B5Y&XH9GF8",
    "DC12.0Z", "DC12.1", "DC12.0Y", "DC11.Y", "DA91.30", "DC14.3", "DC10.4", "DC10.00", "DC11.4",
    "DA43.0", "DB99.5", "DB99.2", "DB98.3", "ME04.Z", "DB98.5", "DB98.4", "DC50.00", "DB94.1Z", "DB92.1", "DB96.1Z", "DA43.3",
    "2D82", "2D91", "2E2Z",
  ];

  private async linkMain(r: QueryRunner, mainDiag: string, codes: string[]): Promise<void> {
    await r.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md
       JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'HBP' AND md.title = $1 AND d."icdCode" = ANY($2)
       ON CONFLICT DO NOTHING`, [mainDiag, codes]);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      ('2E92.7','hepatocellular adenoma','الورم الغدي للخلايا الكبدية','Benign hepatocellular neoplasm, usually in women on oral contraceptives; resected for size >5 cm, the beta-catenin subtype, or rupture/haemorrhage risk.','ورم كبدي حميد، غالباً لدى النساء المستخدمات لمانعات الحمل الفموية؛ يُستأصل إذا تجاوز 5 سم أو كان من نمط بيتا-كاتينين أو لخطر التمزق/النزف.'),
      ('DB99.1Z','simple cyst of liver','الكيسة الكبدية البسيطة','A solitary benign serous (simple) hepatic cyst; usually observed, with laparoscopic deroofing/fenestration if large and symptomatic.','كيسة كبدية مصلية بسيطة منفردة حميدة؛ تُراقَب عادةً، مع إزالة السقف/التنفيس بالمنظار إذا كانت كبيرة وعرضية.'),
      ('DB99.10','polycystic liver disease','داء الكبد متعدد الكيسات','Multiple hepatic cysts (often with autosomal-dominant polycystic kidney disease) causing massive hepatomegaly; managed by fenestration, resection or transplantation.','أكياس كبدية متعددة (غالباً مع داء الكلى متعدد الكيسات السائد) تسبب ضخامة كبدية هائلة؛ تُدار بالتنفيس أو الاستئصال أو الزرع.'),
      ('DB98.2','nodular regenerative hyperplasia of liver','فرط التنسج العقدي التجديدي للكبد','Diffuse benign hepatic nodularity without fibrosis causing non-cirrhotic portal hypertension; managed by treating the portal hypertension.','تعقّد كبدي حميد منتشر دون تليف يسبب ارتفاع ضغط الوريد البابي غير التشمعي؛ يُدار بمعالجة ارتفاع الضغط البابي.'),
      ('2E81.2Y','infantile haemangioma of liver','الورم الوعائي الطفلي للكبد','Benign infantile hepatic vascular tumour; large lesions may cause high-output failure and are treated medically (propranolol) or by resection/embolisation.','ورم وعائي كبدي طفلي حميد؛ قد تسبب الآفات الكبيرة قصوراً قلبياً عالي النتاج وتُعالَج دوائياً (بروبرانولول) أو بالاستئصال/الإصمام.'),
      ('2C12.01','hepatoblastoma','الورم الأرومي الكبدي','The commonest primary liver malignancy of childhood; treated by chemotherapy and hepatic resection or transplantation.','أشيع ورم كبدي خبيث أولي في الطفولة؛ يُعالَج بالعلاج الكيميائي والاستئصال الكبدي أو الزرع.'),
      ('2B56.3','angiosarcoma of liver','الساركومة الوعائية للكبد','A rare aggressive primary hepatic vascular sarcoma (linked to vinyl chloride/thorotrast); resected when feasible but with poor prognosis.','ساركومة وعائية كبدية أولية نادرة عدوانية (مرتبطة بكلوريد الفينيل/الثوروتراست)؛ تُستأصل عند الإمكان لكن إنذارها سيئ.'),
      ('2C12.00','combined hepatocellular-cholangiocarcinoma','السرطانة المختلطة الكبدية والقنوية الصفراوية','A primary liver cancer with both hepatocellular and cholangiocarcinoma components; treated by resection with a prognosis between the two.','سرطان كبدي أولي يحوي مكونين خلوي كبدي وقنوي صفراوي؛ يُعالَج بالاستئصال وإنذاره بين الورمين.'),
      ('2C12.0Y','carcinoma of liver','سرطانة الكبد','Other specified primary hepatic carcinoma, including fibrolamellar carcinoma (younger patients, non-cirrhotic liver); treated by hepatic resection.','سرطانة كبدية أولية أخرى محددة، تشمل السرطانة الليفية الصفائحية (مرضى أصغر سناً، كبد غير متشمع)؛ تُعالَج بالاستئصال الكبدي.'),
      ('2B5Y&XH9GF8','epithelioid haemangioendothelioma of liver','الورم البطاني الوعائي الظهاراني للكبد','A rare low-to-intermediate-grade vascular tumour of the liver, often multifocal; managed by resection or transplantation.','ورم وعائي كبدي نادر منخفض إلى متوسط الدرجة، غالباً متعدد البؤر؛ يُدار بالاستئصال أو الزرع.'),
      ('DC12.0Z','acute acalculous cholecystitis','التهاب المرارة الحاد اللاحصوي','Acute gallbladder inflammation without stones, typically in critically-ill patients; treated by cholecystostomy or cholecystectomy.','التهاب مرارة حاد دون حصوات، عادةً لدى المرضى الحرجين؛ يُعالَج بفغر المرارة أو استئصالها.'),
      ('DC12.1','chronic cholecystitis','التهاب المرارة المزمن','Chronic gallbladder inflammation, usually with gallstones, causing recurrent biliary pain; treated by elective cholecystectomy.','التهاب مرارة مزمن، عادةً مع حصوات، يسبب ألماً صفراوياً متكرراً؛ يُعالَج باستئصال المرارة الانتقائي.'),
      ('DC12.0Y','empyema of gallbladder','دبيلة المرارة','Suppurative gallbladder filled with pus (empyema/gangrenous cholecystitis); a surgical emergency requiring urgent cholecystectomy or drainage.','مرارة قيحية ممتلئة بالصديد (دبيلة/التهاب مرارة مواتي)؛ حالة جراحية طارئة تتطلب استئصالاً عاجلاً أو تصريفاً.'),
      ('DC11.Y','Mirizzi syndrome','متلازمة ميريزي','Extrinsic compression/erosion of the common hepatic duct by an impacted cystic-duct stone causing obstructive jaundice; treated by careful cholecystectomy ± biliary repair.','ضغط/تآكل خارجي للقناة الكبدية المشتركة بحصاة منحشرة في القناة المرارية مسبباً يرقاناً انسدادياً؛ يُعالَج باستئصال مرارة حذر مع إصلاح صفراوي عند الحاجة.'),
      ('DA91.30','gallstone ileus','علوص الحصاة الصفراوية','Mechanical small-bowel obstruction by a large gallstone passing through a cholecystoenteric fistula; treated by enterolithotomy.','انسداد ميكانيكي للأمعاء الدقيقة بحصاة صفراوية كبيرة عبر ناسور مراري معوي؛ يُعالَج باستخراج الحصاة من الأمعاء.'),
      ('DC14.3','adenomyomatosis of gallbladder','الورام الغدي العضلي للمرارة','Benign hyperplastic gallbladder-wall thickening with Rokitansky-Aschoff sinuses; cholecystectomy when symptomatic or when malignancy cannot be excluded.','تثخّن حميد مفرط التنسّج لجدار المرارة مع جيوب روكيتانسكي-آشوف؛ يُستأصل عند ظهور الأعراض أو تعذّر استبعاد الخباثة.'),
      ('DC10.4','cholesterolosis of gallbladder','الترسّب الكوليستيرولي للمرارة','Cholesterol deposition in the gallbladder mucosa (strawberry gallbladder); usually incidental, cholecystectomy if symptomatic.','ترسّب الكوليستيرول في مخاطية المرارة (المرارة الفرولية)؛ غالباً عرضي عابر، ويُستأصل عند وجود أعراض.'),
      ('DC10.00','obstruction of cystic duct','انسداد القناة المرارية','Obstruction/stricture of the cystic duct (often by an impacted stone) causing a mucocele or cholecystitis; treated by cholecystectomy.','انسداد/تضيّق القناة المرارية (غالباً بحصاة منحشرة) مسبباً قيلة مخاطية أو التهاب مرارة؛ يُعالَج باستئصال المرارة.'),
      ('DC11.4','calculus of bile duct with cholangitis','حصاة القناة الصفراوية مع التهاب الأقنية','Common-bile-duct stone with acute (often suppurative) cholangitis; an emergency treated by urgent ERCP biliary decompression and antibiotics.','حصاة في القناة الصفراوية المشتركة مع التهاب أقنية حاد (غالباً قيحي)؛ حالة طارئة تُعالَج بتخفيف الضغط الصفراوي العاجل بالتنظير والمضادات الحيوية.'),
      ('DA43.0','gastric varices','دوالي المعدة','Dilated gastric submucosal veins from portal hypertension; bleeding is treated by endoscopic cyanoacrylate injection, BRTO or TIPS.','أوردة معدية تحت مخاطية متوسّعة بسبب ارتفاع ضغط الوريد البابي؛ يُعالَج النزيف بحقن السيانوأكريلات بالتنظير أو BRTO أو TIPS.'),
      ('DB99.5','hepatic encephalopathy','الاعتلال الدماغي الكبدي','Neuropsychiatric dysfunction from portosystemic shunting and hyperammonaemia in liver failure; managed with lactulose, rifaximin and shunt modification.','خلل عصبي نفسي ناجم عن التحويل البابي الجهازي وفرط الأمونيا في فشل الكبد؛ يُدار باللاكتولوز والريفاكسيمين وتعديل التحويلة.'),
      ('DB99.2','hepatorenal syndrome','المتلازمة الكبدية الكلوية','Functional renal failure complicating advanced liver disease/portal hypertension; managed with vasoconstrictors and albumin, definitively by liver transplantation.','فشل كلوي وظيفي يعقّد مرض الكبد المتقدم/ارتفاع الضغط البابي؛ يُدار بمقبّضات الأوعية والألبومين، وعلاجه الجذري زرع الكبد.'),
      ('DB98.3','portal vein thrombosis','خثار الوريد البابي','Thrombotic occlusion of the portal vein causing portal hypertension and variceal bleeding; managed by anticoagulation or TIPS.','انسداد خثاري للوريد البابي يسبب ارتفاع الضغط البابي ونزف الدوالي؛ يُدار بمضادات التخثر أو TIPS.'),
      ('ME04.Z','ascites','الحبن (الاستسقاء البطني)','Pathological intraperitoneal fluid, most often from cirrhosis/portal hypertension; managed by salt restriction, diuretics, paracentesis or TIPS.','سائل مرضي داخل الصفاق، غالباً من التشمع/ارتفاع الضغط البابي؛ يُدار بتقييد الملح والمدرّات والبزل أو TIPS.'),
      ('DB98.5','Budd-Chiari syndrome','متلازمة بود-خياري','Hepatic venous outflow obstruction causing congestive hepatomegaly, ascites and portal hypertension; treated by anticoagulation, angioplasty/stenting, TIPS or transplantation.','انسداد التدفق الوريدي الكبدي مسبباً ضخامة كبدية احتقانية وحبناً وارتفاع ضغط بابي؛ يُعالَج بمضادات التخثر أو رأب الوعاء/الدعامة أو TIPS أو الزرع.'),
      ('DB98.4','splenic vein thrombosis','خثار الوريد الطحالي','Splenic-vein thrombosis causing left-sided (sinistral) portal hypertension and gastric varices; treated by splenectomy when bleeding.','خثار الوريد الطحالي مسبباً ارتفاع ضغط بابي أيسر ودوالي معدية؛ يُعالَج باستئصال الطحال عند النزف.'),
      ('DC50.00','spontaneous bacterial peritonitis','التهاب الصفاق الجرثومي العفوي','Infection of ascitic fluid without a surgical source in cirrhotic patients; diagnosed by ascitic neutrophil count and treated with antibiotics.','عدوى السائل الحبني دون مصدر جراحي لدى مرضى التشمع؛ يُشخَّص بعدّ العدلات في السائل ويُعالَج بالمضادات الحيوية.'),
      ('DB94.1Z','alcoholic hepatitis','التهاب الكبد الكحولي','Acute inflammatory liver injury from heavy alcohol use, with jaundice and liver failure; managed by abstinence, nutrition and corticosteroids in severe cases.','إصابة كبدية التهابية حادة ناجمة عن تعاطي الكحول الشديد مع يرقان وفشل كبدي؛ تُدار بالامتناع والتغذية والستيرويدات في الحالات الشديدة.'),
      ('DB92.1','non-alcoholic steatohepatitis','التهاب الكبد الدهني غير الكحولي','Steatohepatitis (NASH) with hepatocyte injury and fibrosis from metabolic dysfunction; can progress to cirrhosis and hepatocellular carcinoma.','التهاب كبد دهني (NASH) مع أذية الخلايا الكبدية وتليف ناجم عن خلل استقلابي؛ قد يتطور إلى تشمع وسرطانة خلايا كبدية.'),
      ('DB96.1Z','primary biliary cholangitis','التهاب الأقنية الصفراوية الصفراوي الأولي','Chronic autoimmune destruction of small intrahepatic bile ducts leading to cholestasis and cirrhosis; treated with ursodeoxycholic acid, transplant for end-stage disease.','تدمير مناعي ذاتي مزمن للأقنية الصفراوية الصغيرة داخل الكبد يؤدي إلى ركود صفراوي وتشمع؛ يُعالَج بحمض أورسوديوكسيكوليك، والزرع للمرحلة النهائية.'),
      ('DA43.3','portal hypertensive gastropathy','اعتلال المعدة بارتفاع ضغط الوريد البابي','Congestive gastric mucosal changes from portal hypertension causing chronic GI bleeding; managed by reducing portal pressure (beta-blockers, TIPS).','تغيّرات احتقانية في مخاطية المعدة بسبب ارتفاع الضغط البابي تسبب نزفاً هضمياً مزمناً؛ يُدار بخفض الضغط البابي (حاصرات بيتا، TIPS).'),
      ('2D82','metastasis in extrahepatic bile ducts','نقيلة في الأقنية الصفراوية خارج الكبد','Secondary malignant involvement of the extrahepatic bile ducts causing obstructive jaundice; managed by biliary stenting or palliative bypass.','إصابة خبيثة ثانوية للأقنية الصفراوية خارج الكبد تسبب يرقاناً انسدادياً؛ تُدار بالدعامة الصفراوية أو المجازة التلطيفية.'),
      ('2D91','metastasis in peritoneum (carcinomatosis)','نقيلة في الصفاق (السرطنة البريتونية)','Peritoneal carcinomatosis from a hepatobiliary/GI primary; managed by cytoreduction ± HIPEC in selected cases or palliative care.','سرطنة بريتونية من ورم أولي كبدي صفراوي/هضمي؛ تُدار باستئصال الأورام مع HIPEC في حالات مختارة أو الرعاية التلطيفية.'),
      ('2E2Z','malignant neoplasm metastasis, unspecified','ورم خبيث نقيلي غير محدد','Disseminated/unspecified-site metastatic malignancy involving the liver and abdomen; managed by systemic therapy and palliation.','ورم خبيث نقيلي منتشر/غير محدد الموضع يشمل الكبد والبطن؛ يُدار بالعلاج الجهازي والتلطيف.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'HBP' AND d."icdCode" = ANY($1) ON CONFLICT DO NOTHING`,
      [AddHbpDiagnosesBatch21750000000100.CODES]);

    await this.linkMain(queryRunner, "benign liver lesions", ["2E92.7", "DB99.1Z", "DB99.10", "DB98.2", "2E81.2Y"]);
    await this.linkMain(queryRunner, "hepatocellular carcinoma", ["2C12.01", "2B56.3", "2C12.00", "2C12.0Y", "2B5Y&XH9GF8"]);
    await this.linkMain(queryRunner, "cholecystitis & choledocholithiasis", ["DC12.0Z", "DC12.1", "DC12.0Y", "DC11.Y", "DA91.30", "DC14.3", "DC10.4", "DC10.00", "DC11.4"]);
    await this.linkMain(queryRunner, "liver cirrhosis & portal hypertension", ["DA43.0", "DB99.5", "DB99.2", "DB98.3", "ME04.Z", "DB98.5", "DB98.4", "DC50.00", "DB94.1Z", "DB92.1", "DB96.1Z", "DA43.3"]);
    await this.linkMain(queryRunner, "metastatic liver disease", ["2D82", "2D91", "2E2Z"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddHbpDiagnosesBatch21750000000100.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))`, [codes]);
    await queryRunner.query(
      `DELETE FROM "diagnoses" d WHERE d."icdCode" = ANY($1)
         AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = d.id)`, [codes]);
  }
}
