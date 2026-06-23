import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * HBP coverage extension — batch 1 of 2 (40 diagnoses).
 * Categories: acute pancreatitis, chronic pancreatitis, pancreatic cancer, ampullary cancer,
 * cholangiocarcinoma, bile duct injuries, biliary stricture.
 *
 * All ICD-11 codes verified via icd11_search (see MEDICAL_CODE_AUDITS/HBP/AUDIT_HBP.md,
 * "2D — Candidate diagnoses"). Codes already present as shared rows (eg LB20.20 choledochal
 * cyst owned by PEDSURG) are skipped by ON CONFLICT and simply linked to HBP. Postcoordinated
 * codes (eg 2C10.0&XH3PG9) are stored verbatim as the icdCode.
 */
export class AddHbpDiagnosesBatch11750000000099 implements MigrationInterface {
  name = "AddHbpDiagnosesBatch11750000000099";

  private static readonly CODES = [
    "DC31.0", "DC31.1", "DC31.3", "DC31.Y", "DC34", "NB91.4Z", "DC31.4",
    "DC32.0", "DC32.1", "DC32.2", "DC32.3", "DC33", "DC35.2", "DC35.Z", "LB21.1",
    "2C10.Y", "2E92.9", "DC30.Z", "DC30.0", "2C10.0&XH3PG9", "2C10.1&XH8DS0", "2C10.1&XH0U20", "2C10.0&XH7CY5",
    "2E92.6", "2E61.3", "2B80.00", "2C16.Y", "2C16.1", "2B80.01",
    "2C17.0", "2C13.0", "2C12.1Y",
    "DC10.2", "NB91.2", "ME24.35", "DC10.0Z",
    "LB20.20", "LB20.00", "LB20.22", "DC11.4&XA4415",
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
      ('DC31.0','acute idiopathic pancreatitis','التهاب البنكرياس الحاد مجهول السبب','Acute pancreatitis with no identifiable cause after exclusion of gallstones, alcohol and metabolic factors; managed supportively with monitoring for complications.','التهاب بنكرياس حاد دون سبب محدد بعد استبعاد الحصوات والكحول والعوامل الاستقلابية؛ يُدار بالدعم ومراقبة المضاعفات.'),
      ('DC31.1','acute alcohol-induced pancreatitis','التهاب البنكرياس الحاد الكحولي','Acute pancreatitis precipitated by alcohol; a common cause requiring supportive care, alcohol cessation and surveillance for necrosis or pseudocyst.','التهاب بنكرياس حاد ناجم عن الكحول؛ سبب شائع يتطلب رعاية داعمة والامتناع عن الكحول ومراقبة النخر أو الكيسة الكاذبة.'),
      ('DC31.3','acute drug-induced pancreatitis','التهاب البنكرياس الحاد الدوائي','Acute pancreatitis triggered by a causative drug (eg azathioprine, valproate); treated by withdrawing the agent and supportive management.','التهاب بنكرياس حاد ناجم عن دواء مسبب (مثل الآزاثيوبرين أو الفالبروات)؛ يُعالَج بسحب الدواء والرعاية الداعمة.'),
      ('DC31.Y','acute necrotising pancreatitis','التهاب البنكرياس الحاد النخري','Severe acute pancreatitis with parenchymal/peripancreatic necrosis; high-morbidity course managed by a step-up approach (drainage then minimally invasive or open necrosectomy) if infected.','التهاب بنكرياس حاد شديد مع نخر للنسيج وما حول البنكرياس؛ مسار عالي المراضة يُدار بنهج تصاعدي (تصريف ثم إزالة نخر طفيفة التوغل أو مفتوحة) عند العدوى.'),
      ('DC34','obstructive pancreatitis','التهاب البنكرياس الانسدادي','Pancreatitis caused by obstruction of the pancreatic duct (stone, stricture or tumour); relieved by endoscopic or surgical ductal drainage.','التهاب بنكرياس ناجم عن انسداد القناة البنكرياسية (حصاة أو تضيّق أو ورم)؛ يُعالَج بتصريف القناة بالتنظير أو الجراحة.'),
      ('NB91.4Z','injury of pancreas','إصابة البنكرياس','Traumatic pancreatic injury (contusion, laceration or ductal disruption); graded by ductal involvement and managed from observation to distal pancreatectomy.','إصابة بنكرياسية رضحية (كدمة أو تمزق أو انقطاع القناة)؛ تُصنَّف حسب إصابة القناة وتُدار من المراقبة إلى استئصال البنكرياس البعيد.'),
      ('DC31.4','hereditary acute pancreatitis','التهاب البنكرياس الحاد الوراثي','Acute pancreatitis on a hereditary (PRSS1/SPINK1) background with recurrent attacks from young age and raised lifetime pancreatic-cancer risk.','التهاب بنكرياس حاد على خلفية وراثية (PRSS1/SPINK1) مع نوبات متكررة من سن مبكرة وخطر متزايد لسرطان البنكرياس مدى الحياة.'),
      ('DC32.0','calcific chronic pancreatitis','التهاب البنكرياس المزمن المتكلس','Chronic pancreatitis with intraductal calcification and stones, causing pain and exocrine/endocrine insufficiency; managed by endotherapy or drainage/resection surgery.','التهاب بنكرياس مزمن مع تكلّس وحصوات داخل القناة، يسبب الألم وقصوراً خارجي/داخلي الإفراز؛ يُدار بالعلاج التنظيري أو جراحة التصريف/الاستئصال.'),
      ('DC32.1','groove pancreatitis','التهاب البنكرياس الأخدودي','Focal chronic pancreatitis of the groove between the pancreatic head, duodenum and bile duct; may mimic carcinoma and require pancreaticoduodenectomy.','التهاب بنكرياس مزمن بؤري في الأخدود بين رأس البنكرياس والاثني عشر والقناة الصفراوية؛ قد يحاكي السرطان ويتطلب استئصالاً بنكرياسياً اثني عشرياً.'),
      ('DC32.2','hereditary chronic pancreatitis','التهاب البنكرياس المزمن الوراثي','Chronic pancreatitis from germline mutations (PRSS1, CFTR, SPINK1) with early onset, progressive fibrosis and markedly raised pancreatic-cancer risk.','التهاب بنكرياس مزمن ناجم عن طفرات جينية (PRSS1، CFTR، SPINK1) مع بداية مبكرة وتليف متفاقم وخطر مرتفع لسرطان البنكرياس.'),
      ('DC32.3','chronic alcohol-induced pancreatitis','التهاب البنكرياس المزمن الكحولي','The commonest cause of chronic pancreatitis; chronic alcohol use leads to ductal fibrosis, calcification, intractable pain and insufficiency.','أشيع أسباب التهاب البنكرياس المزمن؛ يؤدي تعاطي الكحول المزمن إلى تليف القناة والتكلّس والألم المعند والقصور.'),
      ('DC33','autoimmune pancreatitis','التهاب البنكرياس المناعي الذاتي','IgG4-related (type 1) or duct-centric (type 2) autoimmune pancreatitis presenting with a mass or obstructive jaundice mimicking cancer; responds to steroids.','التهاب بنكرياس مناعي ذاتي مرتبط بـ IgG4 (النوع 1) أو متمركز حول القناة (النوع 2) يتظاهر بكتلة أو يرقان انسدادي يحاكي السرطان؛ يستجيب للستيرويدات.'),
      ('DC35.2','pancreatic exocrine insufficiency','القصور البنكرياسي خارجي الإفراز','Pancreatic steatorrhoea from loss of exocrine function (chronic pancreatitis, resection or cancer); managed with pancreatic enzyme replacement.','إسهال دهني بنكرياسي نتيجة فقد الوظيفة خارجية الإفراز (التهاب مزمن أو استئصال أو سرطان)؛ يُدار بتعويض الإنزيمات البنكرياسية.'),
      ('DC35.Z','pancreatic duct calculus','حصاة القناة البنكرياسية','Calculus and dilatation of the pancreatic duct in chronic pancreatitis causing obstructive pain; cleared endoscopically, by lithotripsy or surgical drainage.','حصاة وتوسّع في القناة البنكرياسية ضمن التهاب البنكرياس المزمن مسببة ألماً انسدادياً؛ تُزال بالتنظير أو تفتيت الحصى أو التصريف الجراحي.'),
      ('LB21.1','pancreas divisum','البنكرياس المنقسم','The commonest congenital pancreatic-duct anomaly, with dorsal-duct drainage through the minor papilla; may cause recurrent pancreatitis treated by minor-papilla sphincterotomy.','أشيع شذوذ خلقي للقناة البنكرياسية، مع تصريف القناة الظهرية عبر الحليمة الصغرى؛ قد يسبب التهاب بنكرياس متكرراً يُعالَج ببضع عضلة الحليمة الصغرى.'),
      ('2C10.Y','pancreatic carcinoma','سرطانة البنكرياس','Malignant exocrine pancreatic carcinoma (ductal type and variants); the leading periampullary malignancy, resectable by pancreaticoduodenectomy or distal pancreatectomy.','سرطانة بنكرياسية خبيثة خارجية الإفراز (النوع القنوي ومتغيراته)؛ أبرز أورام محيط الحليمة الخبيثة، تُستأصل بعملية ويبل أو استئصال البنكرياس البعيد.'),
      ('2E92.9','functioning pancreatic neuroendocrine tumour','ورم البنكرياس العصبي الصمّي الوظيفي','Benign/low-grade endocrine pancreatic tumour (insulinoma, gastrinoma) secreting hormones; localised and enucleated or resected.','ورم بنكرياسي صمّي حميد أو منخفض الدرجة (ورم إنسوليني، ورم غاستريني) يفرز الهرمونات؛ يُحدَّد ويُستأصل أو يُجتثّ.'),
      ('DC30.Z','pancreatic cystic neoplasm','الورم الكيسي البنكرياسي','Cystic pancreatic neoplasm (mucinous or serous cystic neoplasm) requiring characterisation; resected when symptomatic or harbouring malignant-risk features.','ورم كيسي بنكرياسي (مخاطي أو مصلي) يتطلب توصيفاً؛ يُستأصل عند ظهور أعراض أو سمات خطر الخباثة.'),
      ('DC30.0','true cyst of pancreas','الكيسة الحقيقية للبنكرياس','A true (epithelial-lined) or retention cyst of the pancreas, distinct from a pseudocyst; resected or drained if symptomatic or indeterminate.','كيسة حقيقية (مبطّنة بالظهارة) أو احتباسية للبنكرياس تختلف عن الكيسة الكاذبة؛ تُستأصل أو تُصرَّف عند ظهور الأعراض أو عدم التحديد.'),
      ('2C10.0&XH3PG9','acinar cell carcinoma of pancreas','سرطانة الخلايا العنبية للبنكرياس','A rare malignant exocrine pancreatic tumour of acinar differentiation, sometimes with lipase hypersecretion; treated by resection.','ورم بنكرياسي خبيث نادر خارجي الإفراز ذو تمايز عنبي، يصاحبه أحياناً فرط إفراز الليباز؛ يُعالَج بالاستئصال.'),
      ('2C10.1&XH8DS0','pancreatic neuroendocrine tumour','الورم العصبي الصمّي البنكرياسي','Well-differentiated neuroendocrine tumour of the pancreas (functioning or non-functioning); resected by enucleation or formal pancreatectomy.','ورم عصبي صمّي بنكرياسي جيد التمايز (وظيفي أو غير وظيفي)؛ يُستأصل بالاجتثاث أو استئصال بنكرياسي رسمي.'),
      ('2C10.1&XH0U20','neuroendocrine carcinoma of pancreas','السرطانة العصبية الصمّية للبنكرياس','Poorly-differentiated, high-grade neuroendocrine carcinoma of the pancreas with aggressive behaviour; managed with chemotherapy and selective resection.','سرطانة عصبية صمّية بنكرياسية رديئة التمايز عالية الدرجة وعدوانية السلوك؛ تُدار بالعلاج الكيميائي والاستئصال الانتقائي.'),
      ('2C10.0&XH7CY5','mixed ductal-neuroendocrine carcinoma of pancreas','السرطانة المختلطة القنوية-العصبية الصمّية للبنكرياس','A mixed pancreatic neoplasm combining ductal adenocarcinoma and neuroendocrine carcinoma components; treated by resection and combined oncological therapy.','ورم بنكرياسي مختلط يجمع مكونات السرطانة الغدية القنوية والسرطانة العصبية الصمّية؛ يُعالَج بالاستئصال والعلاج الأورامي المشترك.'),
      ('2E92.6','adenoma of ampulla of Vater','ورم غدي حميد لأمبولة فاتر','Benign (often intestinal-type) adenoma of the ampulla of Vater, a premalignant lesion; removed by endoscopic ampullectomy or transduodenal excision.','ورم غدي حميد (غالباً من النوع المعوي) لأمبولة فاتر، آفة سابقة للخباثة؛ يُزال باستئصال الحليمة بالتنظير أو الاستئصال عبر الاثني عشر.'),
      ('2E61.3','carcinoma in situ of ampulla of Vater','سرطانة لابدة لأمبولة فاتر','High-grade dysplasia/carcinoma in situ of the ampulla of Vater; treated by ampullectomy or pancreaticoduodenectomy depending on extent.','خلل تنسّج شديد/سرطانة لابدة في أمبولة فاتر؛ تُعالَج باستئصال الحليمة أو عملية ويبل حسب الامتداد.'),
      ('2B80.00','adenocarcinoma of duodenum','السرطانة الغدية للاثني عشر','Periampullary duodenal adenocarcinoma presenting with obstruction or bleeding; resected by pancreaticoduodenectomy or segmental duodenal resection.','سرطانة غدية اثني عشرية محيطة بالحليمة تتظاهر بالانسداد أو النزيف؛ تُستأصل بعملية ويبل أو استئصال اثني عشري قطعي.'),
      ('2C16.Y','malignant neoplasm of ampulla of Vater','ورم خبيث في أمبولة فاتر','Other specified ampullary malignancy (eg pancreatobiliary-type carcinoma) presenting with obstructive jaundice; resected by pancreaticoduodenectomy.','ورم خبيث آخر محدد في الأمبولة (مثل السرطانة من النوع البنكرياسي الصفراوي) يتظاهر باليرقان الانسدادي؛ يُستأصل بعملية ويبل.'),
      ('2C16.1','neuroendocrine neoplasm of ampulla of Vater','الورم العصبي الصمّي لأمبولة فاتر','Neuroendocrine neoplasm of the ampulla of Vater, frequently associated with neurofibromatosis; resected by local excision or pancreaticoduodenectomy.','ورم عصبي صمّي في أمبولة فاتر، يرتبط كثيراً بالورام الليفي العصبي؛ يُستأصل موضعياً أو بعملية ويبل.'),
      ('2B80.01','neuroendocrine neoplasm of duodenum','الورم العصبي الصمّي للاثني عشر','Duodenal neuroendocrine tumour (eg gastrinoma, somatostatinoma, carcinoid); resected endoscopically or surgically by size and grade.','ورم عصبي صمّي اثني عشري (مثل الورم الغاستريني أو السوماتوستاتيني أو السرطاوي)؛ يُستأصل بالتنظير أو الجراحة حسب الحجم والدرجة.'),
      ('2C17.0','extrahepatic (distal) cholangiocarcinoma','سرطانة الأقنية الصفراوية خارج الكبد (القاصية)','Adenocarcinoma of the distal extrahepatic bile duct presenting with painless obstructive jaundice; resected by pancreaticoduodenectomy.','سرطانة غدية للقناة الصفراوية القاصية خارج الكبد تتظاهر بيرقان انسدادي غير مؤلم؛ تُستأصل بعملية ويبل.'),
      ('2C13.0','adenocarcinoma of the gallbladder','السرطانة الغدية للمرارة','Gallbladder carcinoma, often discovered incidentally after cholecystectomy; treated by extended cholecystectomy with liver-bed and nodal resection.','سرطانة المرارة، تُكتشف غالباً عرضياً بعد استئصال المرارة؛ تُعالَج باستئصال مرارة موسّع مع استئصال سرير الكبد والعقد.'),
      ('2C12.1Y','intrahepatic bile duct carcinoma','سرطانة الأقنية الصفراوية داخل الكبد (نوع آخر)','Other specified malignancy of the intrahepatic bile ducts; managed by hepatic resection where feasible.','ورم خبيث آخر محدد للأقنية الصفراوية داخل الكبد؛ يُدار بالاستئصال الكبدي حيثما أمكن.'),
      ('DC10.2','fistula of gallbladder or bile duct','ناسور المرارة أو القناة الصفراوية','Abnormal biliary communication / bile leak (eg cholecystoenteric fistula or post-cholecystectomy leak); managed by ERCP drainage or surgical repair.','اتصال صفراوي شاذ/تسرب صفراوي (مثل الناسور المراري المعوي أو التسرب بعد استئصال المرارة)؛ يُدار بالتصريف بالتنظير أو الإصلاح الجراحي.'),
      ('NB91.2','injury of gallbladder','إصابة المرارة','Traumatic or iatrogenic injury of the gallbladder (contusion, laceration, perforation); usually managed by cholecystectomy.','إصابة رضحية أو علاجية المنشأ للمرارة (كدمة أو تمزق أو انثقاب)؛ تُدار عادةً باستئصال المرارة.'),
      ('ME24.35','perforation of gallbladder or bile ducts','انثقاب المرارة أو الأقنية الصفراوية','Perforation/rupture of the gallbladder or bile ducts causing bile peritonitis; an emergency treated by drainage and cholecystectomy or biliary repair.','انثقاب/تمزق المرارة أو الأقنية الصفراوية مسبباً التهاب صفاق صفراوي؛ حالة طارئة تُعالَج بالتصريف واستئصال المرارة أو الإصلاح الصفراوي.'),
      ('DC10.0Z','obstruction of gallbladder or bile ducts','انسداد المرارة أو الأقنية الصفراوية','Non-calculous obstruction of the gallbladder or bile ducts (stricture, compression); relieved by stenting or surgical bypass.','انسداد غير حصوي للمرارة أو الأقنية الصفراوية (تضيّق أو ضغط)؛ يُعالَج بالدعامة أو المجازة الجراحية.'),
      ('LB20.20','choledochal cyst','كيس القناة الصفراوية المشتركة','Congenital cystic dilatation of the biliary tree (Todani classification) with malignancy risk; treated by cyst excision and Roux-en-Y hepaticojejunostomy.','توسّع كيسي خلقي للشجرة الصفراوية (تصنيف توداني) مع خطر الخباثة؛ يُعالَج باستئصال الكيس ومفاغرة كبدية صائمية رو-آن-واي.'),
      ('LB20.00','Caroli disease','داء كارولي','Congenital saccular dilatation of the intrahepatic bile ducts (fibropolycystic liver disease) predisposing to stones, cholangitis and cholangiocarcinoma.','توسّع كيسي خلقي للأقنية الصفراوية داخل الكبد (مرض الكبد الليفي الكيسي) يهيّئ للحصوات والتهاب الأقنية وسرطان الأقنية الصفراوية.'),
      ('LB20.22','congenital stricture of bile ducts','التضيّق الخلقي للأقنية الصفراوية','Congenital stenosis/stricture of the bile ducts causing obstructive jaundice in infancy; corrected by biliary-enteric reconstruction.','تضيّق خلقي للأقنية الصفراوية يسبب يرقاناً انسدادياً في الطفولة؛ يُصحَّح بإعادة بناء صفراوية معوية.'),
      ('DC11.4&XA4415','hepatolithiasis with cholangitis','حصيات الأقنية الكبدية مع التهاب الأقنية','Intrahepatic duct stones with recurrent pyogenic cholangitis; managed by stone clearance, ductal drainage and segmental hepatectomy for atrophic segments.','حصيات في الأقنية داخل الكبد مع التهاب أقنية قيحي متكرر؛ تُدار بإزالة الحصى وتصريف القناة واستئصال كبدي قطعي للقطع الضامرة.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'HBP' AND d."icdCode" = ANY($1) ON CONFLICT DO NOTHING`,
      [AddHbpDiagnosesBatch11750000000099.CODES]);

    await this.linkMain(queryRunner, "acute pancreatitis", ["DC31.0", "DC31.1", "DC31.3", "DC31.Y", "DC34", "NB91.4Z", "DC31.4"]);
    await this.linkMain(queryRunner, "chronic pancreatitis", ["DC32.0", "DC32.1", "DC32.2", "DC32.3", "DC33", "DC35.2", "DC35.Z", "LB21.1"]);
    await this.linkMain(queryRunner, "pancreatic cancer", ["2C10.Y", "2E92.9", "DC30.Z", "DC30.0", "2C10.0&XH3PG9", "2C10.1&XH8DS0", "2C10.1&XH0U20", "2C10.0&XH7CY5"]);
    await this.linkMain(queryRunner, "ampullary cancer", ["2E92.6", "2E61.3", "2B80.00", "2C16.Y", "2C16.1", "2B80.01"]);
    await this.linkMain(queryRunner, "cholangiocarcinoma", ["2C17.0", "2C13.0", "2C12.1Y"]);
    await this.linkMain(queryRunner, "bile duct injuries", ["DC10.2", "NB91.2", "ME24.35", "DC10.0Z"]);
    await this.linkMain(queryRunner, "biliary stricture", ["LB20.20", "LB20.00", "LB20.22", "DC11.4&XA4415"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddHbpDiagnosesBatch11750000000099.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))`, [codes]);
    // Delete only HBP-introduced rows; shared rows (still linked to another dept) are preserved.
    await queryRunner.query(
      `DELETE FROM "diagnoses" d WHERE d."icdCode" = ANY($1)
         AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = d.id)`, [codes]);
  }
}
