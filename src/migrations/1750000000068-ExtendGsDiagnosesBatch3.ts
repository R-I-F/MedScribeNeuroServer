import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendGsDiagnosesBatch31750000000068 implements MigrationInterface {
  name = "ExtendGsDiagnosesBatch31750000000068";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Insert 26 new diagnoses ────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      (
        'DC11.6',
        'choledocholithiasis',
        'حصى في القناة الصفراوية المشتركة',
        'Presence of gallstones in the common bile duct (CBD); may be primary (de novo CBD stone formation) or secondary (migration from gallbladder); presents with biliary colic, obstructive jaundice, and elevated liver enzymes; complicated by cholangitis (Charcot''s triad: fever, jaundice, RUQ pain) or biliary pancreatitis; diagnosis by MRCP or ERCP; treatment is endoscopic sphincterotomy with stone extraction (ERCP), laparoscopic CBD exploration, or open CBD exploration.',
        'وجود حصوات مرارية في القناة الصفراوية المشتركة؛ قد تكون أولية (تشكّل حصوات ابتدائي في القناة) أو ثانوية (انتقال من المرارة)؛ تتظاهر بمغص صفراوي ويرقان انسدادي وارتفاع إنزيمات الكبد؛ مضاعفاتها التهاب الأقنية الصفراوية (ثالوث شاركو: حمى ويرقان وألم في الربع الأيمن العلوي) أو التهاب البنكرياس الصفراوي؛ التشخيص بـ MRCP أو ERCP؛ العلاج بضع الحليمة بالتنظير مع استخراج الحصوات (ERCP)، أو استكشاف القناة الصفراوية بالمنظار، أو الاستكشاف المفتوح.'
      ),
      (
        'DC13',
        'cholangitis',
        'التهاب الأقنية الصفراوية',
        'Bacterial infection of the biliary tract, most commonly secondary to choledocholithiasis causing biliary obstruction with stasis and ascending infection; Charcot''s triad (fever, RUQ pain, jaundice) is present in 50–70%; Reynold''s pentad (Charcot''s + hypotension + altered consciousness) indicates severe/suppurative cholangitis requiring emergency biliary drainage; common organisms: E. coli, Klebsiella, Enterococcus; treatment: IV antibiotics, fluid resuscitation, and urgent biliary decompression via ERCP or percutaneous transhepatic biliary drainage (PTBD).',
        'عدوى بكتيرية في الجهاز الصفراوي، تنجم في الغالب عن انسداد يسببه حصوات القناة الصفراوية مع ركود وعدوى صاعدة؛ ثالوث شاركو (حمى وألم في الربع الأيمن العلوي ويرقان) يحضر في 50–70%؛ خماسي رينولدز (ثالوث شاركو + انخفاض ضغط الدم + تغيّر الوعي) يشير لالتهاب الأقنية القيحي الشديد الذي يستلزم تصريفاً طارئاً للمجرى الصفراوي؛ الكائنات الشائعة: الإشريكية القولونية، والكليبسيلا، والمكوّرات المعوية؛ العلاج: مضادات حيوية وريدية وإنعاش سائل وفك الانسداد الصفراوي العاجل عبر ERCP أو التصريف الصفراوي عبر الجلد.'
      ),
      (
        'DC30.1',
        'pancreatic pseudocyst',
        'كيس بنكرياسي كاذب',
        'Fluid collection enclosed by a fibrous wall without an epithelial lining, arising as a complication of acute pancreatitis (4–6 weeks after the episode) or chronic pancreatitis with ductal disruption; presents with persistent epigastric pain, early satiety, nausea, or a palpable epigastric mass; diagnosis by CT or MRCP; most (>50%) resolve spontaneously; indications for drainage: symptomatic, infected (abscess), enlarging (>6 cm), or causing ductal obstruction; drainage options: endoscopic cystogastrostomy/cystoduodenostomy, percutaneous catheter drainage, or surgical cystojejunostomy.',
        'تجمّع سائل محاط بجدار ليفي دون بطانة ظهارية، ينشأ كمضاعفة لالتهاب البنكرياس الحاد (بعد 4–6 أسابيع من الحدث) أو التهاب البنكرياس المزمن مع انهيار القناة؛ يتظاهر بألم شرسوفي مستمر وشبع مبكر وغثيان أو كتلة شرسوفية ملموسة؛ التشخيص بالتصوير المقطعي أو MRCP؛ معظمها (>50%) تتحلل تلقائياً؛ مؤشرات التصريف: العرضية والمصابة بالخراج والمتضخمة (>6 سم) والمسببة لانسداد القناة؛ خيارات التصريف: التحويل المعدي-الكيسي/الاثني عشري-الكيسي بالتنظير، أو التصريف عبر الجلد بالقسطرة، أو التحويل الصائمي-الكيسي الجراحي.'
      ),
      (
        'DC10.3',
        'gallbladder polyp',
        'سليلة المرارة',
        'Mucosal projections from the gallbladder wall, detected incidentally on ultrasound; majority are cholesterol polyps (70%) or adenomyomatosis and are benign; true adenomatous polyps have malignant potential; risk factors for malignancy: size ≥10 mm, sessile morphology, rapid growth, patient age >50, primary sclerosing cholangitis; management: cholecystectomy for polyps ≥10 mm or symptomatic; surveillance ultrasound every 6–12 months for 6–9 mm polyps; polyps <6 mm with no other risk factors can be reassured.',
        'نتوءات مخاطية من جدار المرارة، تُكتشف عرضياً بالموجات فوق الصوتية؛ معظمها سليلات كوليسترولية (70%) أو ورم ادينوعضلي ذات طابع حميد؛ السليلات الغدية الحقيقية لها إمكانية تحوّل خبيث؛ عوامل الخطر للتحوّل: الحجم ≥10 مم، والشكل الجلسي، والنمو السريع، والعمر >50 سنة، والتهاب الأقنية الصفراوية الصلبة الأولي؛ الإدارة: استئصال المرارة للسليلات ≥10 مم أو العرضية؛ مراقبة بالموجات فوق الصوتية كل 6–12 شهراً للسليلات 6–9 مم؛ السليلات <6 مم دون عوامل خطر أخرى تحتاج للطمأنينة فقط.'
      ),
      (
        'DC12.1',
        'chronic cholecystitis',
        'التهاب المرارة المزمن',
        'Low-grade, recurring inflammation of the gallbladder caused by intermittent obstruction of the cystic duct by gallstones; characterised pathologically by fibrosis, mucosal atrophy, and Rokitansky-Aschoff sinuses; presents with recurrent episodes of biliary colic (postprandial right upper quadrant or epigastric pain radiating to the right scapula, lasting 30 min–3 hours), fatty food intolerance, and bloating; ultrasound shows gallstones with a thickened gallbladder wall; treatment is elective laparoscopic cholecystectomy.',
        'التهاب مزمن متكرر منخفض الدرجة في المرارة ناجم عن انسداد متكرر للقناة الكيسية بحصوات مرارية؛ يتميز نسيجياً بالتليّف وضمور المخاطية وجيوب روكيتانسكي-أشوف؛ يتظاهر بنوبات متكررة من المغص الصفراوي (ألم في الربع الأيمن العلوي أو الشرسوف بعد الطعام يشعّ للكتف الأيمن، يستمر 30 دقيقة – 3 ساعات)، وعدم تحمل الأطعمة الدهنية، وانتفاخ؛ الموجات فوق الصوتية تظهر حصوات مع سماكة جدار المرارة؛ العلاج استئصال المرارة الاختياري بالمنظار.'
      ),
      (
        'DC11.1',
        'cholelithiasis with chronic cholecystitis',
        'حصى المرارة مع التهاب مزمن',
        'Combination of cholelithiasis and chronic cholecystitis, representing the most common symptomatic gallstone disease encountered in surgical practice; repeated episodes of cystic duct obstruction by stones lead to progressive gallbladder wall inflammation, fibrosis, and functional loss; patients present with recurrent biliary colic, dyspepsia, and fatty food intolerance; diagnosis by abdominal ultrasound; treatment is elective laparoscopic cholecystectomy; porcelain gallbladder (dystrophic calcification of the wall) is a potential late complication with variable malignancy risk.',
        'الجمع بين حصوات المرارة والتهاب المرارة المزمن، ويمثّل أكثر أمراض حصوات المرارة العرضية شيوعاً في الممارسة الجراحية؛ تؤدي نوبات متكررة من انسداد القناة الكيسية بالحصوات إلى التهاب تدريجي في جدار المرارة وتليّف وفقدان وظيفي؛ يتظاهر بمغص صفراوي متكرر وعسر هضم وعدم تحمل الدهون؛ التشخيص بالموجات فوق الصوتية البطنية؛ العلاج استئصال المرارة الاختياري بالمنظار؛ المرارة الخزفية (التكلس الحثلي للجدار) مضاعفة متأخرة محتملة بخطر خبيث متغير.'
      ),
      (
        'DB90.0',
        'hepatic abscess',
        'خراج الكبد',
        'Localised collection of pus within the hepatic parenchyma; pyogenic hepatic abscess (most common in developed countries) is most often polymicrobial and arises via portal pyaemia, biliary tract infection, direct extension, or haematogenous spread; amoebic abscess (Entamoeba histolytica) is prevalent in endemic regions; presents with fever, right upper quadrant pain, and hepatomegaly; CT is diagnostic; treatment: IV antibiotics and percutaneous ultrasound/CT-guided drainage; surgery reserved for failure of percutaneous drainage, ruptured abscess, or concurrent surgical pathology.',
        'تجمّع صديدي موضّع داخل حمة الكبد؛ الخراج الكبدي القيحي (الأكثر شيوعاً في الدول المتقدمة) عادةً متعدد الكائنات وينشأ عبر الإنتان البابي أو عدوى المجرى الصفراوي أو الامتداد المباشر أو الانتشار الدموي؛ الخراج الأميبي (المتحولة الحالّة للنسيج) شائع في المناطق الموبوءة؛ يتظاهر بحمى وألم في الربع الأيمن العلوي وتضخم الكبد؛ التصوير المقطعي تشخيصي؛ العلاج: مضادات حيوية وريدية وتصريف موجّه بالموجات فوق الصوتية أو التصوير المقطعي؛ الجراحة محجوزة لفشل التصريف بالقسطرة أو الخراج الممزّق أو الأمراض الجراحية المصاحبة.'
      ),
      (
        '1F73.0',
        'hydatid cyst of liver',
        'كيس أكياس الكبد المائية',
        'Parasitic cyst of the liver caused by larval stage of Echinococcus granulosus; endemic in sheep-rearing regions of the Middle East, Mediterranean, and Central Asia; typically grows slowly and may be asymptomatic for years; complications include rupture (anaphylaxis, peritoneal seeding), infection, and biliary communication (cholangitis, jaundice); diagnosed by serology (anti-Echinococcus IgG) and imaging (CT shows cyst with daughter cysts and pericyst); treatment: PAIR procedure (puncture, aspiration, injection, re-aspiration) for uncomplicated cysts; surgical enucleation or hepatic resection for complicated or large cysts; albendazole perioperatively.',
        'كيس طفيلي في الكبد ناجم عن الطور اليرقي للمشوّكة الحبيبية؛ متوطّن في مناطق تربية الأغنام في الشرق الأوسط والبحر المتوسط وآسيا الوسطى؛ ينمو ببطء وقد يكون كامناً سنوات؛ مضاعفاته تشمل التمزق (صدمة تأقية، البذر البريتوني)، والعدوى، والتواصل الصفراوي (التهاب الأقنية، اليرقان)؛ التشخيص بالأمصال (IgG ضد المشوّكة) والتصوير (التصوير المقطعي يظهر الكيس مع أكياس بنت وطبقة خارجية)؛ العلاج: إجراء PAIR (ثقب وشفط وحقن وإعادة شفط) للأكياس غير المعقدة؛ تحسيس الكيس أو استئصال الكبد للأكياس المعقدة أو الكبيرة؛ ألبيندازول حول فترة العملية.'
      ),
      (
        '2C10.0',
        'pancreatic adenocarcinoma',
        'سرطان البنكرياس الغدي',
        'Most common exocrine pancreatic malignancy (>85%); arises predominantly in the pancreatic head (70%); strongly associated with smoking, chronic pancreatitis, obesity, family history, and germline mutations (BRCA2, PALB2); typically presents at advanced stage with painless jaundice (head tumours), weight loss, and epigastric pain radiating to the back; CA 19-9 is the tumour marker of choice; CT pancreas protocol or MRCP for staging; only ~20% are resectable at diagnosis; surgical treatment: pancreaticoduodenectomy (Whipple), distal pancreatectomy, or total pancreatectomy; adjuvant chemotherapy (FOLFIRINOX or gemcitabine-based) significantly improves survival.',
        'أكثر أورام البنكرياس الخارجي خباثةً (>85%)؛ ينشأ في الغالب في رأس البنكرياس (70%)؛ مرتبط ارتباطاً وثيقاً بالتدخين والتهاب البنكرياس المزمن والسمنة والتاريخ العائلي والطفرات الجرثومية (BRCA2، PALB2)؛ يتظاهر عادةً في مرحلة متقدمة بيرقان غير مؤلم (أورام الرأس) وفقدان وزن وألم شرسوفي يشعّ للخلف؛ CA 19-9 هو الواسم الورمي المفضّل؛ التصوير المقطعي لبروتوكول البنكرياس أو MRCP للتصنيف المرحلي؛ ~20% فقط قابلة للاستئصال عند التشخيص؛ العلاج الجراحي: عملية ويبل (الاستئصال البنكرياسي الاثني عشري)، أو استئصال البنكرياس البعيد، أو استئصال البنكرياس الكامل؛ العلاج الكيماوي المساعد (FOLFIRINOX أو القائم على الجيمسيتابين) يحسّن البقاء بشكل معتبر.'
      ),
      (
        'DA22.Z',
        'gastro-oesophageal reflux disease, unspecified',
        'مرض الارتجاع المعدي المريئي غير المحدد',
        'Condition caused by retrograde flow of gastric contents into the oesophagus, producing troublesome symptoms (heartburn, regurgitation) or complications; classified as non-erosive reflux disease (NERD), erosive oesophagitis (Los Angeles A–D), or complicated GORD (Barrett''s oesophagus, stricture, ulcer); associated with lower oesophageal sphincter (LOS) incompetence, hiatal hernia, obesity, and delayed gastric emptying; medical treatment: PPI therapy (omeprazole, pantoprazole); surgical treatment: laparoscopic anti-reflux surgery (Nissen fundoplication) for PPI-dependent patients with confirmed pathological reflux on pH-impedance study.',
        'حالة ناجمة عن ارتداد محتويات المعدة إلى المريء مسببةً أعراضاً مزعجة (حرقة المعدة والارتجاع) أو مضاعفات؛ تصنَّف إلى مرض ارتجاع غير تآكلي، والتهاب مريء تآكلي (لوس أنجلوس A–D)، وارتجاع معقّد (مريء باريت، التضيّق، القرحة)؛ مرتبط بعدم كفاءة العضلة العاصرة المريئية السفلى والفتق الحجابي والسمنة وبطء إفراغ المعدة؛ العلاج الدوائي: مثبطات مضخة البروتون (أوميبرازول، بانتوبرازول)؛ العلاج الجراحي: عملية فتح البطن الارتجاعية بالمنظار (تثنية نيسن) للمرضى المعتمدين على مثبطات مضخة البروتون مع تأكيد الارتجاع المرضي بدراسة pH-مقاومة الكهرباء.'
      ),
      (
        '2B72.Z',
        'malignant neoplasm of stomach, unspecified',
        'ورم خبيث في المعدة غير المحدد',
        'Gastric adenocarcinoma is the predominant form (>90%); arises in the gastric mucosa and is strongly associated with Helicobacter pylori infection (IARC Group 1 carcinogen), atrophic gastritis, intestinal metaplasia, smoking, high salt diet, and family history; classified as cardia or non-cardia; presents with dysphagia, anorexia, weight loss, anaemia, and epigastric fullness; staging by CT and endoscopic ultrasound (EUS); curative resection for localised disease (total or subtotal gastrectomy with D2 lymphadenectomy); perioperative chemotherapy (FLOT protocol) improves resection rate and survival.',
        'سرطان المعدة الغدي هو الشكل السائد (>90%)؛ ينشأ في مخاطية المعدة ويرتبط ارتباطاً وثيقاً بعدوى الحلزونية البوابية (مجموعة IARC الأولى كمادة مسرطنة) والتهاب المعدة الضموري والحؤول المعوي والتدخين والنظام الغذائي الغني بالملح والتاريخ العائلي؛ يصنَّف إلى موضع الفؤاد أو ما دونه؛ يتظاهر بعسر البلع وفقدان الشهية وفقدان الوزن وفقر الدم والشبع المبكر؛ التصنيف المرحلي بالتصوير المقطعي وتنظير المعدة بالموجات فوق الصوتية؛ الاستئصال الشافي للمرض الموضعي (استئصال معدي كلي أو جزئي مع تشريح العقد D2)؛ العلاج الكيماوي حول الجراحة (بروتوكول FLOT) يحسّن نسبة الاستئصال والبقاء.'
      ),
      (
        'DA42.1',
        'Helicobacter pylori gastritis',
        'التهاب المعدة بالحلزونية البوابية',
        'Chronic active gastritis caused by Helicobacter pylori infection; H. pylori infects ~50% of the world population (higher prevalence in low-income countries); classified by Sydney system as antrum-predominant (associated with peptic ulcer disease) or corpus-predominant (associated with gastric cancer); diagnostic methods: urea breath test, stool antigen test, or biopsy at endoscopy (CLO test, histology, culture); eradication therapy: triple therapy (PPI + clarithromycin + amoxicillin) or bismuth-based quadruple therapy; eradication confirmed by repeat urea breath test 4 weeks post-treatment.',
        'التهاب معدة مزمن نشط ناجم عن عدوى الحلزونية البوابية؛ تصيب الحلزونية البوابية ~50% من سكان العالم (انتشار أعلى في الدول منخفضة الدخل)؛ تصنَّف بنظام سيدني إلى سائدة في الغار (مرتبطة بالقرحة الهضمية) أو سائدة في الجسم (مرتبطة بسرطان المعدة)؛ طرق التشخيص: اختبار تنفس اليوريا واختبار مستضد البراز أو الخزعة بالتنظير (اختبار CLO والفحص النسيجي والزراعة)؛ علاج الاستئصال: العلاج الثلاثي (مثبط مضخة البروتون + كلاريثروميسين + أموكسيسيلين) أو العلاج الرباعي القائم على البزموت؛ يُؤكَّد الاستئصال بتكرار اختبار تنفس اليوريا بعد 4 أسابيع من إنهاء العلاج.'
      ),
      (
        'DA40.0',
        'gastric outlet obstruction',
        'انسداد مخرج المعدة',
        'Obstruction at the pylorus or proximal duodenum impairing gastric emptying; benign causes include peptic ulcer disease (pyloric stenosis from fibrosis/scarring), Crohn''s disease, and pancreatitis; malignant causes include antral/pyloric gastric cancer and pancreatic head tumours; presents with progressive postprandial vomiting of large volumes of undigested food, weight loss, and succussion splash; metabolic derangement: hypokalaemic, hypochloraemic metabolic alkalosis from vomiting; management: fluid and electrolyte correction, nasogastric decompression, endoscopy for diagnosis; definitive treatment based on aetiology (balloon dilatation, gastrojejunostomy, or tumour resection).',
        'انسداد عند البواب أو الاثني عشر القريب يعيق إفراغ المعدة؛ الأسباب الحميدة تشمل القرحة الهضمية (تضيّق البواب من التليّف/الندب) وداء كرون والتهاب البنكرياس؛ الأسباب الخبيثة تشمل سرطان معدي الغار/البواب وأورام رأس البنكرياس؛ يتظاهر بقيء تدريجي بعد الطعام لكميات كبيرة من الطعام غير المهضوم وفقدان وزن وقرقرة الرج؛ الاضطراب الاستقلابي: قلاء استقلابي مع نقص بوتاسيوم ونقص كلور من القيء؛ الإدارة: تصحيح السوائل والشوارد وفك الضغط عبر أنبوب معدي والتنظير للتشخيص؛ العلاج الجذري بحسب المسبب (توسيع بالبالون أو مفاغرة معدية-صائمية أو استئصال الورم).'
      ),
      (
        'DA26.0Z',
        'oesophageal varices, unspecified',
        'دوالي المريء غير المحددة',
        'Dilated submucosal veins in the distal oesophagus caused by portal hypertension, most commonly due to liver cirrhosis; develop when portal pressure gradient exceeds 10 mmHg; present clinically when ruptured, causing massive upper GI haemorrhage (haematemesis, melaena) with high short-term mortality; Baveno VI criteria guide risk stratification; management of acute variceal bleed: resuscitation, vasoactive drugs (terlipressin/octreotide), IV antibiotics, urgent endoscopic band ligation or sclerotherapy; TIPS for refractory bleeding; elective band ligation for primary/secondary prophylaxis.',
        'أوردة تحت مخاطية متوسعة في المريء البعيد ناجمة عن ارتفاع ضغط الوريد البابي، في الغالب بسبب تليّف الكبد؛ تتطور عندما يتجاوز التدرج الضغطي البابي 10 ملم زئبقي؛ تتظاهر سريرياً عند تمزقها بنزيف غزير في الجهاز الهضمي العلوي (قيء دموي وبراز قطراني) مع وفيات قصيرة الأمد مرتفعة؛ معايير بافينو VI توجّه تصنيف الخطر؛ إدارة النزيف الوريدي الحاد: الإنعاش والأدوية الوعائية النشطة (تيرليبريسين/أوكتريوتيد) ومضادات حيوية وريدية وربط وريدي عاجل بالمنظار أو تصليب الوريد؛ TIPS للنزيف المستعصي؛ الربط الاختياري للوقاية الأولية/الثانوية.'
      ),
      (
        '2B70.Z',
        'malignant neoplasm of oesophagus, unspecified',
        'ورم خبيث في المريء غير المحدد',
        'Two main histological subtypes: squamous cell carcinoma (SCC, predominant in upper/middle oesophagus, associated with smoking, alcohol, achalasia) and adenocarcinoma (lower oesophagus/GOJ, associated with Barrett''s oesophagus and GORD); presents with progressive dysphagia (solids then liquids), weight loss, and odynophagia; staging by CT chest/abdomen/pelvis and PET scan; early-stage tumours may be resected by endoscopic mucosal resection; curative intent requires oesophagectomy (Ivor Lewis, McKeown, or transhiatal); perioperative or definitive chemoradiotherapy is the standard for non-operative candidates.',
        'نوعان نسيجيان رئيسيان: سرطان الخلايا الحرشفية (السائد في المريء العلوي/المتوسط، مرتبط بالتدخين والكحول والأكلازيا) والسرطان الغدي (المريء السفلي/الوصل المعدي المريئي، مرتبط بمريء باريت والارتجاع المعدي المريئي)؛ يتظاهر بعسر بلع تدريجي (الصلبيات ثم السوائل) وفقدان وزن وألم عند البلع؛ التصنيف المرحلي بالتصوير المقطعي للصدر والبطن والحوض وتصوير PET؛ الأورام المبكرة قد تُستأصل بالقشط المخاطي بالتنظير؛ القصد الشافي يستلزم استئصال المريء (آيفور لويس أو ماكيون أو عبر الحجاب الحاجز)؛ العلاج الكيماوي-الإشعاعي حول الجراحة أو التحديدي هو المعيار لغير المرشحين للجراحة.'
      ),
      (
        'DD55',
        'epigastric hernia',
        'فتق شرسوفي',
        'Protrusion of extraperitoneal fat or peritoneal content through a defect in the linea alba between the xiphisternum and the umbilicus; accounts for ~3–5% of abdominal hernias; often small and may contain only preperitoneal fat (no sac); presents as a tender midline epigastric lump, typically exacerbated by exertion; strangulation risk is relatively high due to the small size of defects; treatment is surgical repair (open or laparoscopic) with primary suture or mesh reinforcement for larger defects.',
        'بروز دهون خارج البريتون أو محتوى بريتوني عبر عيب في خط الأبيض بين القص الرهاباني والسرة؛ يمثّل ~3–5% من فتوق البطن؛ غالباً صغير ويحتوي فقط دهوناً قبل-بريتونية (دون كيس)؛ يتظاهر بكتلة مؤلمة في خط الوسط الشرسوفي، تشتد عادةً بالجهد؛ خطر الاختناق مرتفع نسبياً بسبب صغر حجم العيوب؛ العلاج إصلاح جراحي (مفتوح أو بالمنظار) بخياطة أولية أو تعزيز بالشبكة للعيوب الأكبر.'
      ),
      (
        'DD50.0',
        'hiatal hernia',
        'فتق حجابي',
        'Protrusion of the stomach (and sometimes other abdominal organs) through the oesophageal hiatus of the diaphragm into the mediastinum; classified as sliding (Type I, most common — 95%), para-oesophageal (Type II), mixed (Type III), and complex (Type IV with other organs); most are asymptomatic or produce symptoms of GORD; large para-oesophageal hernias can cause mechanical obstruction, volvulus, or strangulation; surgical repair (laparoscopic hiatal hernia repair with fundoplication) indicated for symptomatic hernias, complications, or large PEH regardless of symptoms.',
        'بروز المعدة (وأحياناً أعضاء أخرى) عبر الفتحة المريئية للحجاب الحاجز إلى المنصف؛ يصنَّف إلى انزلاقي (النوع I، الأكثر شيوعاً - 95%)، ومحيط المريء (النوع II)، ومختلط (النوع III)، ومعقّد (النوع IV مع أعضاء أخرى)؛ معظمها عديم الأعراض أو يسبب أعراض الارتجاع المعدي المريئي؛ الفتوق الحجابية المجاورة للمريء الكبيرة تسبب انسداداً ميكانيكياً أو التواءً أو اختناقاً؛ الإصلاح الجراحي (إصلاح الفتق الحجابي بالمنظار مع تثنية القاع) مُشار إليه للفتوق العرضية أو المعقّدة أو الكبيرة بغض النظر عن الأعراض.'
      ),
      (
        'DD52/ME24.2',
        'strangulated femoral hernia',
        'فتق فخذي مختنق',
        'Femoral hernia complicated by strangulation with compromise of the blood supply to herniated bowel; femoral hernias have the highest strangulation rate of all groin hernias (up to 40%) due to the narrow, rigid femoral canal; presents as an irreducible, tender, erythematous swelling below and lateral to the pubic tubercle, with systemic signs of bowel ischaemia; requires emergency surgical repair; approach options include low (Lockwood), high (McEvedy), or inguinal (Lotheissen); bowel viability assessed intraoperatively with resection of non-viable segments.',
        'فتق فخذي مختنق مع انقطاع تروية الأمعاء المنفتقة؛ الفتوق الفخذية لديها أعلى معدل اختناق بين جميع فتوق الفخذ (حتى 40%) بسبب ضيق وصلابة القناة الفخذية؛ يتظاهر بانتفاخ غير قابل للرد مؤلم محمرّ أسفل ووحشي الدرنة العانية مع علامات جهازية لنقص تروية الأمعاء؛ يستلزم إصلاحاً جراحياً طارئاً؛ خيارات المنهج تشمل النهج المنخفض (لوكووود)، والعالي (ماكيفيدي)، والإربي (لوثيسن)؛ تقييم حيوية الأمعاء أثناء الجراحة مع استئصال القطاعات غير القابلة للحياة.'
      ),
      (
        'DD53/ME24.2',
        'strangulated umbilical hernia',
        'فتق سري مختنق',
        'Umbilical hernia complicated by strangulation with vascular compromise to the herniated contents (omentum or bowel); more common in adults with large hernias, ascites (cirrhotic patients), or obesity; presents with a tender, irreducible umbilical swelling with overlying skin changes and systemic signs of strangulation; emergency surgical repair is required; often involves resection of infarcted omentum or bowel; primary suture repair or mesh repair depending on defect size; cirrhotic patients require optimisation of ascites before elective repair.',
        'فتق سري مختنق مع تعطّل الأوعية الدموية للمحتويات المنفتقة (ثرب أو أمعاء)؛ أكثر شيوعاً لدى البالغين ذوي الفتوق الكبيرة أو الاستسقاء (مرضى تليّف الكبد) أو السمنة؛ يتظاهر بانتفاخ سري مؤلم غير قابل للرد مع تغيرات في الجلد المغطي وعلامات جهازية للاختناق؛ يتطلب إصلاحاً جراحياً طارئاً؛ كثيراً ما يستلزم استئصال الثرب أو الأمعاء المحتشية؛ إصلاح بالخياطة الأولية أو الشبكة بحسب حجم العيب؛ مرضى تليّف الكبد يحتاجون لضبط الاستسقاء قبل الإصلاح الاختياري.'
      ),
      (
        '5A02.0',
        'Graves disease',
        'مرض جريفز',
        'Autoimmune thyroid disease caused by thyroid-stimulating immunoglobulins (TSI/TRAb) that activate the TSH receptor, leading to diffuse thyroid hyperplasia and hyperthyroidism; most common cause of hyperthyroidism (70–80%); triad of hyperthyroidism, diffuse goitre, and orbitopathy (Graves'' ophthalmopathy); extrathyroidal manifestations include pretibial myxoedema and acropachy; diagnosis by suppressed TSH, elevated free T4/T3, and positive TRAb; treatment options: antithyroid drugs (carbimazole/methimazole), radioiodine ablation (I-131), or total thyroidectomy; thyroidectomy preferred for large goitres, orbitopathy, or antithyroid drug failure.',
        'مرض الغدة الدرقية المناعي الذاتي الناجم عن الغلوبولين المناعي المحفّز للغدة الدرقية (TSI/TRAb) الذي ينشّط مستقبل TSH، مؤدياً إلى تضخم غدة درقية منتشر وفرط نشاط الغدة؛ أكثر أسباب فرط نشاط الغدة الدرقية شيوعاً (70–80%)؛ الثالوث: فرط نشاط الغدة والتضخم المنتشر ومرض العيون (اعتلال عيون جريفز)؛ المظاهر خارج الدرقية تشمل الوذمة الغاريّة الظنبوبية وتراكم أكرو؛ التشخيص بقياس TSH المثبَّط وارتفاع T4/T3 الحر وإيجابية TRAb؛ خيارات العلاج: أدوية مضادة للغدة الدرقية (كاربيمازول/ميثيمازول)، والإبلاد باليود المشع (I-131)، أو الاستئصال الكامل للغدة الدرقية؛ الاستئصال مُفضَّل في التضخم الكبير واعتلال العيون وفشل الأدوية المضادة للغدة.'
      ),
      (
        '5A01.2',
        'nontoxic multinodular goitre',
        'تضخم الغدة الدرقية العقيدي غير السام',
        'Diffuse or nodular enlargement of the thyroid gland without functional abnormality (normal TSH), most commonly caused by iodine deficiency (endemic goitre) or chronic thyroiditis; may grow large enough to cause compressive symptoms (dysphagia, dyspnoea, stridor, hoarseness); risk of autonomous nodule development and subsequent thyrotoxicosis over decades; ultrasound and thyroid function tests are initial investigations; FNA for dominant or rapidly growing nodules; surgical indications: compressive symptoms, retrosternal extension, suspicion of malignancy, or cosmesis; total or near-total thyroidectomy preferred.',
        'تضخم منتشر أو عقيدي في الغدة الدرقية دون اضطراب وظيفي (TSH طبيعي)، يُسببه في الغالب نقص اليود (التضخم المتوطّن) أو التهاب الغدة الدرقية المزمن؛ قد يتضخم حتى يسبب أعراض ضغطية (عسر بلع وضيق تنفس وصرير وبحّة)؛ خطر تطور عقيدة مستقلة ويرقوقية لاحقاً على مدى عقود؛ الموجات فوق الصوتية واختبارات وظائف الغدة الدرقية التحقيقات الأولية؛ FNA للعقيدات السائدة أو سريعة النمو؛ مؤشرات الجراحة: الأعراض الضغطية والامتداد الصدري وشبهة الخباثة أو التجميل؛ الاستئصال الكلي أو شبه الكلي مُفضَّل.'
      ),
      (
        '5A03.20',
        'Hashimoto thyroiditis',
        'التهاب الغدة الدرقية هاشيموتو',
        'Autoimmune thyroiditis characterised by lymphocytic infiltration and destruction of thyroid parenchyma, leading to progressive hypothyroidism; most common cause of hypothyroidism in iodine-sufficient regions; associated with other autoimmune conditions (type 1 diabetes, coeliac disease, vitiligo, Addison''s disease); anti-TPO antibodies and anti-thyroglobulin antibodies are the hallmark serological markers; presents with fatigue, weight gain, cold intolerance, constipation, and goitre; treatment: levothyroxine replacement when hypothyroid; surgical indications are rare (symptomatic goitre, suspicion of malignancy, or compressive symptoms).',
        'التهاب درقي مناعي ذاتي يتميز بارتشاح لمفاوي وتدمير حمة الغدة الدرقية، مما يؤدي إلى قصور تدريجي في الغدة الدرقية؛ أكثر أسباب قصور الغدة الدرقية شيوعاً في المناطق الكافية باليود؛ مرتبط بأمراض مناعية ذاتية أخرى (داء السكري من النوع 1، والداء البطني، والبهاق، ومرض أديسون)؛ أجسام مضادة ضد بيروكسيداز الغدة الدرقية وضد الثيروغلوبولين هي العلامات المصلية المميزة؛ يتظاهر بتعب وزيادة وزن وعدم تحمل البرد وإمساك وتضخم الغدة؛ العلاج: استبدال الليفوثيروكسين عند القصور؛ مؤشرات الجراحة نادرة (تضخم عرضي أو شبهة خباثة أو أعراض ضغطية).'
      ),
      (
        '2D10.4',
        'medullary carcinoma of thyroid',
        'سرطان الغدة الدرقية النخاعي',
        'Malignant tumour arising from parafollicular C-cells that secrete calcitonin; accounts for ~5% of thyroid cancers; 25% are hereditary as part of MEN2A or MEN2B syndrome (RET proto-oncogene mutation) and 75% are sporadic; calcitonin is the key diagnostic biomarker; associated with phaeochromocytoma (MEN2) — must be excluded before surgery; presents as a thyroid nodule; spread to cervical lymph nodes is early and common; treatment: total thyroidectomy with central neck dissection; prophylactic thyroidectomy recommended for RET mutation carriers based on gene variant risk level.',
        'ورم خبيث ينشأ من خلايا C المجاورة للجريبات التي تفرز الكالسيتونين؛ يمثّل ~5% من سرطانات الغدة الدرقية؛ 25% وراثية كجزء من متلازمة MEN2A أو MEN2B (طفرة proto-oncogene RET) و75% عشوائية؛ الكالسيتونين هو الواسم الحيوي التشخيصي الرئيسي؛ مرتبط بورم القواتم (MEN2) — يجب استبعاده قبل الجراحة؛ يتظاهر كعقيدة درقية؛ الانتشار للعقد اللمفاوية العنقية مبكر وشائع؛ العلاج: استئصال الغدة الدرقية الكامل مع تشريح الرقبة المركزي؛ الاستئصال الوقائي للغدة الدرقية مُوصى به لحاملي طفرة RET بناءً على مستوى خطر المتغير الجيني.'
      ),
      (
        '2D10.3',
        'anaplastic carcinoma of thyroid',
        'سرطان الغدة الدرقية اللاتمايزي',
        'Highly aggressive undifferentiated thyroid malignancy with median survival of 3–6 months; accounts for <2% of thyroid cancers but causes >50% of thyroid cancer deaths; presents with rapid neck mass enlargement, dysphagia, dyspnoea, and hoarseness; may arise from dedifferentiation of pre-existing differentiated thyroid carcinoma; histologically shows marked pleomorphism, spindle cells, and giant cells; staged as Stage IVA (intrathyroidal), IVB (extrathyroidal), or IVC (metastatic) — all Stage IV; multimodal treatment: surgery when resectable + radiotherapy + lenvatinib-based chemotherapy; BRAF V600E mutation present in ~40% (responsive to dabrafenib + trametinib).',
        'ورم خبيث درقي لاتمايزي شديد العدوانية بمتوسط بقاء 3–6 أشهر؛ يمثّل <2% من سرطانات الغدة الدرقية لكنه يسبب >50% من وفيات سرطان الغدة الدرقية؛ يتظاهر بتضخم سريع لكتلة الرقبة وعسر بلع وضيق تنفس وبحّة؛ قد ينشأ من تراجع تمايز سرطان درقي متمايز موجود مسبقاً؛ نسيجياً يظهر كثرة أشكال واضحة وخلايا مغزلية وخلايا عملاقة؛ التصنيف المرحلي IVA (داخل الغدة)، IVB (خارج الغدة)، IVC (نقيلي) — جميعها المرحلة IV؛ العلاج متعدد الوسائط: جراحة عند قابلية الاستئصال + إشعاع + علاج كيماوي قائم على لينفاتينيب؛ طفرة BRAF V600E موجودة في ~40% (تستجيب لداbrافينيب + ترامتينيب).'
      ),
      (
        '5A51.0',
        'primary hyperparathyroidism',
        'فرط نشاط الغدة جارة الدرقية الأولي',
        'Excessive secretion of parathyroid hormone (PTH) from one or more parathyroid glands, leading to hypercalcaemia; caused by solitary adenoma (85%), multiglandular hyperplasia (10–15%), or rarely carcinoma (<1%); associated with MEN1 and MEN2A; presents asymptomatically (discovered on routine biochemistry) or with symptoms of hypercalcaemia (bones, groans, stones, psychic moans — renal stones, osteoporosis, nephrocalcinosis, peptic ulcer disease, fatigue, depression); diagnosis: elevated serum calcium with elevated or inappropriately normal PTH; imaging: sestamibi scan and/or 4D CT for adenoma localisation; treatment: parathyroidectomy (minimally invasive for adenoma).',
        'إفراز مفرط لهرمون الغدة جارة الدرقية (PTH) من غدة أو أكثر مما يؤدي إلى فرط كالسيوم الدم؛ ينجم عن ورم حميد منفرد (85%)، أو تضخم متعدد الغدد (10–15%)، أو نادراً سرطان (<1%)؛ مرتبط بمتلازمة MEN1 وMEN2A؛ يتظاهر بدون أعراض (يُكتشف في الكيمياء الحيوية الروتينية) أو بأعراض فرط كالسيوم الدم (عظام وآلام وحصوات وأعراض نفسية — حصوات كلوية وهشاشة العظام وتكلّس كلوي وقرحة هضمية وتعب واكتئاب)؛ التشخيص: ارتفاع الكالسيوم المصلي مع PTH مرتفع أو غير ملائم للحالة الطبيعية؛ التصوير: مسح السيستاميبي أو التصوير المقطعي رباعي الأبعاد لتحديد موضع الورم الحميد؛ العلاج: استئصال الغدة جارة الدرقية (الحد الأدنى من التدخل الجراحي للورم الحميد).'
      ),
      (
        '5A02.2',
        'thyrotoxicosis with toxic multinodular goitre',
        'التسمم الدرقي مع تضخم الغدة العقيدي السام',
        'Hyperthyroidism caused by autonomous thyroid hormone secretion from multiple hyperactive thyroid nodules (Plummer''s disease); characterised by suppressed TSH and elevated free thyroid hormones without TRAb (negative); commonest cause of hyperthyroidism in iodine-deficient regions and in elderly patients; presents with symptoms of thyrotoxicosis (palpitations, heat intolerance, tremor, weight loss) but typically milder than Graves'' disease and rarely associated with orbitopathy; treatment options: radioiodine (I-131) is first-line for most; total thyroidectomy preferred for large goitres, compressive symptoms, or when radioiodine is contraindicated.',
        'فرط نشاط الغدة الدرقية الناجم عن إفراز مستقل لهرمونات الغدة من عقيدات درقية مفرطة النشاط متعددة (مرض بلامر)؛ يتميز بتثبيط TSH وارتفاع الهرمونات الدرقية الحرة دون TRAb (سلبي)؛ أكثر أسباب فرط نشاط الغدة الدرقية شيوعاً في مناطق نقص اليود ولدى كبار السن؛ يتظاهر بأعراض التسمم الدرقي (خفقان وعدم تحمل الحرارة ورعاش وفقدان وزن) لكن عادةً أخف من مرض جريفز ونادراً ما يرتبط باعتلال العيون؛ خيارات العلاج: اليود المشع (I-131) هو الخط الأول لأغلب الحالات؛ استئصال الغدة الكامل مُفضَّل في التضخم الكبير أو الأعراض الضغطية أو عند تناقض اليود المشع.'
      )
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    // ── 2. Link all 26 to GS department ──────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
      SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS'
        AND d."icdCode" IN (
          'DC11.6','DC13','DC30.1','DC10.3','DC12.1','DC11.1','DB90.0','1F73.0','2C10.0',
          'DA22.Z','2B72.Z','DA42.1','DA40.0','DA26.0Z','2B70.Z',
          'DD55','DD50.0','DD52/ME24.2','DD53/ME24.2',
          '5A02.0','5A01.2','5A03.20','2D10.4','2D10.3','5A51.0','5A02.2'
        )
      ON CONFLICT DO NOTHING
    `);

    // ── 3. Link to main_diags ─────────────────────────────────────────────

    // cholecystitis & cholelithiasis (9 diagnoses)
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'cholecystitis & cholelithiasis'
        AND d."icdCode" IN ('DC11.6','DC13','DC30.1','DC10.3','DC12.1','DC11.1','DB90.0','1F73.0','2C10.0')
      ON CONFLICT DO NOTHING
    `);

    // DB90.0 also → acute abdomen
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'acute abdomen' AND d."icdCode" = 'DB90.0'
      ON CONFLICT DO NOTHING
    `);

    // 1F73.0 also → acute abdomen
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'acute abdomen' AND d."icdCode" = '1F73.0'
      ON CONFLICT DO NOTHING
    `);

    // peptic ulcer disease (6 diagnoses)
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'peptic ulcer disease'
        AND d."icdCode" IN ('DA22.Z','2B72.Z','DA42.1','DA40.0','DA26.0Z','2B70.Z')
      ON CONFLICT DO NOTHING
    `);

    // hernias (4 diagnoses)
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'hernias'
        AND d."icdCode" IN ('DD55','DD50.0','DD52/ME24.2','DD53/ME24.2')
      ON CONFLICT DO NOTHING
    `);

    // DD50.0 also → peptic ulcer disease (hiatal hernia causes GORD)
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'peptic ulcer disease' AND d."icdCode" = 'DD50.0'
      ON CONFLICT DO NOTHING
    `);

    // DD52/ME24.2 also → bowel obstruction
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'bowel obstruction' AND d."icdCode" = 'DD52/ME24.2'
      ON CONFLICT DO NOTHING
    `);

    // DD53/ME24.2 also → bowel obstruction
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'bowel obstruction' AND d."icdCode" = 'DD53/ME24.2'
      ON CONFLICT DO NOTHING
    `);

    // thyroid nodules (7 diagnoses)
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'thyroid nodules'
        AND d."icdCode" IN ('5A02.0','5A01.2','5A03.20','2D10.4','2D10.3','5A51.0','5A02.2')
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = [
      'DC11.6','DC13','DC30.1','DC10.3','DC12.1','DC11.1','DB90.0','1F73.0','2C10.0',
      'DA22.Z','2B72.Z','DA42.1','DA40.0','DA26.0Z','2B70.Z',
      'DD55','DD50.0','DD52/ME24.2','DD53/ME24.2',
      '5A02.0','5A01.2','5A03.20','2D10.4','2D10.3','5A51.0','5A02.2',
    ];
    const list = codes.map(c => `'${c}'`).join(',');
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" IN (${list}))`);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" IN (${list}))`);
    await queryRunner.query(`DELETE FROM "diagnoses" WHERE "icdCode" IN (${list})`);
  }
}
