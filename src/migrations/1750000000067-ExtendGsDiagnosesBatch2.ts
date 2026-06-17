import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendGsDiagnosesBatch21750000000067 implements MigrationInterface {
  name = "ExtendGsDiagnosesBatch21750000000067";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Insert 17 new diagnoses ────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      (
        'DD51/ME24.2',
        'strangulated inguinal hernia',
        'فتق إربي مختنق',
        'Inguinal hernia complicated by strangulation, in which the blood supply to the herniated bowel is compromised due to a tight hernia orifice; constitutes a surgical emergency requiring immediate repair to prevent bowel infarction and perforation; presents with a tender, irreducible groin swelling with systemic signs of bowel ischaemia (vomiting, fever, leucocytosis); operative management involves emergency hernia repair with assessment of bowel viability and resection of non-viable segments.',
        'فتق إربي مختنق بانقطاع تروية الأمعاء المنفتقة بسبب ضيق فوهة الفتق؛ يُعدّ حالة جراحية طارئة تستلزم إصلاحاً فورياً لمنع احتشاء الأمعاء وانثقابها؛ يتظاهر بانتفاخ أُربي متوتر غير قابل للرد مع علامات جهازية لنقص تروية الأمعاء (قيء وحمى وارتفاع كريات الدم البيضاء)؛ الإدارة الجراحية تستوجب إصلاح الفتق الطارئ مع تقييم حيوية الأمعاء واستئصال القطاعات غير القابلة للحياة.'
      ),
      (
        'DB30.Z',
        'large bowel obstruction, unspecified',
        'انسداد الأمعاء الغليظة غير المحدد',
        'Mechanical obstruction of the colon causing proximal colonic dilatation and risk of caecal perforation; common causes include colorectal malignancy (60%), diverticular stricture, colonic volvulus, and extrinsic compression; presents with abdominal distension, constipation or obstipation, vomiting (late), and central abdominal pain; CT is diagnostic and identifies the site and cause; management depends on aetiology — endoscopic stenting as bridge-to-surgery for malignant obstruction, or emergency resection (Hartmann or primary anastomosis with on-table lavage).',
        'انسداد ميكانيكي في القولون يسبب اتساعاً قولونياً قريباً مع خطر انثقاب الأعور؛ الأسباب الشائعة تشمل سرطان القولون والمستقيم (60%)، والتضيق بسبب الرتوج، والتواء القولون، والضغط الخارجي؛ يتظاهر بانتفاخ البطن وإمساك أو احتباس براز وقيء (متأخر) وألم بطني مركزي؛ التصوير المقطعي تشخيصي ويحدد موضع السبب؛ الإدارة تعتمد على المسبب — دعامة بالتنظير كجسر للجراحة في الانسداد الخبيث، أو استئصال طارئ (هارتمان أو مفاغرة أولية مع غسل على الطاولة).'
      ),
      (
        'DB30.0',
        'intussusception of the large intestine',
        'انغلاف الأمعاء الغليظة',
        'Telescoping of a proximal segment of large intestine into a distal segment, causing colonic obstruction and vascular compromise; in adults a pathological lead point (colorectal polyp, malignancy, lipoma) is almost invariably present; less common than small bowel intussusception in adults; presents with colicky abdominal pain, change in bowel habit, and rectal bleeding; CT is diagnostic; treatment is surgical exploration with resection of the involved segment and lead point due to the high prevalence of malignancy.',
        'ارتطام قطعة قريبة من الأمعاء الغليظة داخل قطعة بعيدة مما يسبب انسداداً قولونياً واضطراباً وعائياً؛ لدى البالغين توجد نقطة قيادة مرضية (ورم حميد، ورم خبيث، ورم دهني) في جميع الحالات تقريباً؛ أقل شيوعاً من انغلاف الأمعاء الدقيقة لدى البالغين؛ يتظاهر بألم بطني تقلصي وتغير في عادات الأمعاء ونزيف مستقيمي؛ التصوير المقطعي تشخيصي؛ العلاج هو الاستكشاف الجراحي مع استئصال القطعة المصابة ونقطة القيادة بسبب الانتشار العالي للأورام الخبيثة.'
      ),
      (
        '2F30.5',
        'fibroadenoma of breast',
        'ورم ليفي غدي في الثدي',
        'Most common benign solid breast tumour, arising from lobular epithelium and fibrous stroma; typically presents in women aged 15–35 as a well-circumscribed, mobile, rubbery breast lump; usually hormone-responsive, may enlarge during pregnancy; ultrasound and core biopsy confirm diagnosis; management is observation for small (<3 cm) stable lesions or surgical excision for symptomatic, enlarging, or suspicious lesions; giant fibroadenoma (>5 cm) warrants excision.',
        'أكثر أورام الثدي الصلبة الحميدة شيوعاً، ينشأ من الظهارة الفصيصية والسدى الليفي؛ يتظاهر عادةً لدى النساء بين 15–35 عاماً بكتلة ثديية متحركة مطاطية محددة المعالم؛ عادةً ما يكون مستجيباً للهرمونات وقد يتضخم خلال الحمل؛ الموجات فوق الصوتية والخزعة الجوهرية تؤكد التشخيص؛ الإدارة مراقبة للآفات الصغيرة (<3 سم) المستقرة أو الاستئصال الجراحي للآفات العرضية أو المتضخمة أو المشتبه بها؛ الورم الليفي الغدي العملاق (>5 سم) يستوجب الاستئصال.'
      ),
      (
        '2E65.2',
        'ductal carcinoma in situ of breast',
        'سرطان القنوات في مكانه في الثدي',
        'Non-invasive breast cancer characterised by malignant epithelial cells confined within the ductal basement membrane without stromal invasion; most commonly detected on mammographic screening as microcalcifications; graded by nuclear grade (low, intermediate, high) and presence of comedonecrosis; treatment options include breast-conserving surgery (wide local excision) with adjuvant radiotherapy, or mastectomy for extensive disease; sentinel node biopsy indicated for high-grade DCIS treated by mastectomy; 5-year invasive recurrence risk ~1–2% per year with standard therapy.',
        'سرطان الثدي غير الغازي المتميز بخلايا ظهارية خبيثة محصورة داخل الغشاء القاعدي للقنوات دون غزو السدى؛ يُكتشف في الغالب بالتصوير الشعاعي للثدي كتكلسات دقيقة؛ يُصنَّف بالدرجة النووية (منخفضة، متوسطة، عالية) ووجود نخر الثاقبة؛ خيارات العلاج تشمل الجراحة الحافظة للثدي (الاستئصال الموضعي الواسع) مع إشعاع مساعد، أو استئصال الثدي في المرض الواسع الانتشار؛ خزعة العقدة الحارسة مُشار إليها في DCIS عالي الدرجة المعالَج باستئصال الثدي؛ خطر التكرر الغازي 5 سنوات ~1–2% سنوياً بالعلاج المعياري.'
      ),
      (
        '2C61.1',
        'invasive lobular carcinoma of breast',
        'سرطان الفصيصات الغازي في الثدي',
        'Second most common invasive breast cancer subtype (~10–15%), arising from the terminal duct-lobular unit; characterised by loss of E-cadherin expression leading to cells growing in single-file (Indian file) pattern without cohesion; often multifocal and bilateral; typically oestrogen and progesterone receptor-positive; mammographic detection is more difficult due to the diffuse non-mass-forming growth pattern; treatment follows standard breast cancer protocols — surgery, radiotherapy, and hormone therapy; bilateral risk surveillance is important.',
        'ثاني أكثر أنواع سرطان الثدي الغازي شيوعاً (~10–15%)، ينشأ من الوحدة الفصيصية للقناة الطرفية؛ يتميز بفقدان تعبير E-cadherin مما يجعل الخلايا تنمو في نمط صف هندي دون التماسك؛ كثيراً ما يكون متعدد البؤر وثنائي الجانب؛ عادةً إيجابي لمستقبلات الإستروجين والبروجسترون؛ اكتشافه بالتصوير الشعاعي للثدي أصعب بسبب نمط النمو المنتشر غير المتكتل؛ العلاج يتبع بروتوكولات سرطان الثدي المعيارية — جراحة وإشعاع وعلاج هرموني؛ مراقبة خطر الجانب الثاني مهمة.'
      ),
      (
        '2E65.5',
        'Paget disease of the nipple',
        'مرض باجيت للحلمة',
        'Rare form of breast malignancy presenting as eczema-like changes of the nipple-areola complex, caused by migration of underlying DCIS or invasive carcinoma cells along the ductal epithelium to the nipple skin; almost always associated with underlying intraductal or invasive breast cancer; presents with nipple itching, erythema, scaling, crusting, and nipple destruction; diagnosis by punch biopsy of the nipple (Paget cells — large, pale cells with abundant cytoplasm); treatment: nipple-areola complex resection plus treatment of underlying cancer.',
        'شكل نادر من سرطان الثدي يتظاهر بتغيرات شبيهة بالأكزيما في مجمع الحلمة-هالة الثدي، ينجم عن هجرة خلايا سرطان القنوات في مكانه أو سرطان الغازي الكامن عبر ظهارة القنوات إلى جلد الحلمة؛ يرتبط شبه دائم بسرطان ثدي قنوي أو غازي كامن؛ يتظاهر بحكة الحلمة والاحمرار والتقشير والتقرح وتدمير الحلمة؛ التشخيص بخزعة ثقب للحلمة (خلايا باجيت — خلايا كبيرة شاحبة بسيتوبلازم وفير)؛ العلاج: استئصال مجمع الحلمة-الهالة مع معالجة السرطان الكامن.'
      ),
      (
        'GB20.0',
        'fibrocystic change of breast',
        'تغيرات ليفية كيسية في الثدي',
        'Most common benign breast condition, characterised by stromal fibrosis, cyst formation, and epithelial hyperplasia; affects 50–70% of women during reproductive years; presents as cyclical breast pain (mastalgia), nodularity, and tender lumps that fluctuate with the menstrual cycle; simple cysts can be aspirated under ultrasound guidance; core biopsy excludes malignancy in atypical cases; with atypical ductal hyperplasia (ADH), relative risk of subsequent invasive breast cancer is 4–5 times elevated.',
        'أكثر حالات الثدي الحميدة شيوعاً، يتميز بتليّف السدى وتشكّل الكيسات وتضخم الظهارة؛ يصيب 50–70% من النساء خلال سنوات الإنجاب؛ يتظاهر بألم ثدي دوري (ألم الثدي)، وعقيدية، وكتل مؤلمة تتقلب مع الدورة الشهرية؛ الكيسات البسيطة يمكن شفطها تحت توجيه الموجات فوق الصوتية؛ الخزعة الجوهرية تستبعد الخباثة في الحالات غير النمطية؛ مع فرط تنسج القنوات غير النمطي، يرتفع الخطر النسبي للإصابة بسرطان الثدي الغازي اللاحق 4–5 أضعاف.'
      ),
      (
        'GB22',
        'gynaecomastia',
        'تثدي رجالي',
        'Benign enlargement of male breast glandular tissue due to an imbalance between oestrogen and androgen effects; physiological forms occur in neonates, adolescents, and elderly men; pathological causes include hypogonadism, Klinefelter syndrome, liver cirrhosis, renal failure, hyperthyroidism, and drug-induced (spironolactone, cimetidine, anti-androgens, anabolic steroids); evaluation must exclude male breast carcinoma; management: treat underlying cause; surgical subcutaneous mastectomy for persistent cosmetically significant cases.',
        'تضخم حميد في الأنسجة الغدية للثدي الذكوري بسبب اختلال توازن تأثيرات الإستروجين والأندروجين؛ الأشكال الفيزيولوجية تحدث عند المواليد والمراهقين وكبار السن من الذكور؛ الأسباب المرضية تشمل نقص الغدد التناسلية، ومتلازمة كلاينفلتر، وتليّف الكبد، والفشل الكلوي، وفرط نشاط الغدة الدرقية، والأدوية المُحدِثة (سبيرونولاكتون، سيميتيدين، مضادات الأندروجين، الستيرويدات الابتنائية)؛ يجب أن يستبعد التقييم سرطان الثدي الذكوري؛ الإدارة: علاج السبب الكامن؛ استئصال الثدي تحت الجلد جراحياً للحالات المستمرة المزعجة جمالياً.'
      ),
      (
        '2F30.3',
        'benign phyllodes tumour of breast',
        'ورم أوراق حميد في الثدي',
        'Rare fibroepithelial breast tumour with variable malignant potential, classified as benign, borderline, or malignant based on stromal cellularity, mitotic activity, and margin characteristics; typically presents as a rapidly enlarging, well-circumscribed breast mass in women aged 40–50; ultrasound shows a well-defined lobulated hypoechoic mass; core biopsy may underestimate grade; treatment is wide local excision with adequate (≥1 cm) negative margins to minimise local recurrence; does not require axillary node assessment.',
        'ورم ليفي ظهاري نادر في الثدي ذو إمكانات خبيثة متفاوتة، يُصنَّف كحميد أو حدّي أو خبيث بناءً على خلوية السدى ونشاط الانقسام وخصائص الهوامش؛ يتظاهر عادةً بكتلة ثديية متضخمة سريعاً محددة المعالم لدى النساء بين 40–50 عاماً؛ الموجات فوق الصوتية تظهر كتلة مفصصة ناقصة الصدى واضحة الحدود؛ الخزعة الجوهرية قد تُقلّل تقدير الدرجة؛ العلاج هو الاستئصال الموضعي الواسع بهوامش سلبية كافية (≥1 سم) لتقليل التكرار الموضعي؛ لا يستلزم تقييم العقد الإبطية.'
      ),
      (
        '2E65.0',
        'lobular carcinoma in situ of breast',
        'سرطان الفصيصات في مكانه في الثدي',
        'Non-invasive breast lesion characterised by proliferation of atypical epithelial cells filling and expanding the lobular acini without penetrating the basement membrane; classified as a risk indicator rather than a direct precursor of invasive cancer; confers 8–10 times increased lifetime risk of invasive breast cancer in either breast; typically an incidental finding on biopsy performed for other reasons (not calcified, not mass-forming); management is surveillance mammography and chemoprevention (tamoxifen or raloxifene) rather than surgical excision; bilateral risk requires long-term surveillance.',
        'آفة ثديية غير غازية تتميز بتكاثر خلايا ظهارية غير نمطية تملأ وتوسّع أسيني الفصيصات دون اختراق الغشاء القاعدي؛ تُصنَّف كمؤشر خطر لا كسليف مباشر للسرطان الغازي؛ تمنح خطراً مدى الحياة بلغ 8–10 أضعاف للإصابة بسرطان الثدي الغازي في أي ثدي؛ عادةً اكتشاف عرضي في خزعة أُخذت لأسباب أخرى (ليست متكلسة ولا متكتلة)؛ الإدارة مراقبة بالتصوير الشعاعي للثدي والوقاية الكيماوية (تاموكسيفين أو رالوكسيفين) لا الاستئصال الجراحي؛ خطر الجانبين يستلزم مراقبة طويلة الأمد.'
      ),
      (
        '2B92.0',
        'rectal adenocarcinoma',
        'سرطان الغدد في المستقيم',
        'Malignant tumour of the rectum arising from rectal glandular epithelium; accounts for ~30% of colorectal cancers; staging by TNM and MRI-based mrTNM for local staging (critical for determining resectability and need for neoadjuvant therapy); locally advanced tumours (T3/T4 or node-positive) receive neoadjuvant chemoradiotherapy before surgery; surgical options include low anterior resection (LAR) with total mesorectal excision (TME) or abdominoperineal resection (APR) for distal tumours; permanent colostomy required for APR.',
        'ورم خبيث في المستقيم ينشأ من الظهارة الغدية المستقيمية؛ يمثّل ~30% من سرطانات القولون والمستقيم؛ التصنيف المرحلي بنظام TNM وعلى أساس MRI للتصنيف الموضعي (حاسم لتحديد قابلية الاستئصال والحاجة للعلاج التحضيري المسبق)؛ الأورام المتقدمة موضعياً (T3/T4 أو إيجابية للعقد) تتلقى علاجاً كيماوي-إشعاعياً مساعداً مسبقاً قبل الجراحة؛ الخيارات الجراحية تشمل الاستئصال الأمامي المنخفض مع استئصال كامل للمساريق أو الاستئصال الأمامي الخلفي للأورام البعيدة؛ القولونية الدائمة ضرورية في الاستئصال الأمامي الخلفي.'
      ),
      (
        '2C00.3',
        'squamous cell carcinoma of anus',
        'سرطان الخلايا الحرشفية في الشرج',
        'Malignant tumour arising from the squamous epithelium of the anal canal or anal margin; strongly associated with human papillomavirus (HPV) infection (types 16 and 18), HIV infection, and immunosuppression; presents with rectal bleeding, anal pain, and a palpable mass; diagnosis by biopsy; staging by MRI and CT; unlike rectal cancer, anal SCC is primarily treated by chemoradiotherapy (Nigro protocol: 5-FU, mitomycin C, and radiotherapy) with abdominoperineal resection reserved for recurrent or persistent disease.',
        'ورم خبيث ينشأ من الظهارة الحرشفية للقناة الشرجية أو الهامش الشرجي؛ مرتبط ارتباطاً وثيقاً بعدوى فيروس الورم الحليمي البشري (أنواع 16 و18) وعدوى HIV والكبت المناعي؛ يتظاهر بنزيف مستقيمي وألم شرجي وكتلة ملموسة؛ التشخيص بالخزعة؛ التصنيف المرحلي بالرنين المغناطيسي والتصوير المقطعي؛ على عكس سرطان المستقيم، يُعالج سرطان الخلايا الحرشفية الشرجي أساساً بالعلاج الكيماوي-الإشعاعي (بروتوكول نيغرو: 5-FU وميتوميسين C والإشعاع) مع حجز الاستئصال الأمامي الخلفي للمرض المتكرر أو المستمر.'
      ),
      (
        '2B5B.Z',
        'gastrointestinal stromal tumour, unspecified',
        'ورم السدى الهضمي المعدي المعوي غير المحدد',
        'Most common mesenchymal tumour of the gastrointestinal tract, arising from interstitial cells of Cajal or their precursors; 85–90% have activating mutations in KIT (CD117) or PDGFRA; most common location is stomach (60%), followed by small intestine (30%); risk stratification (size, mitotic index, site, rupture) guides management; primary treatment is surgical resection with clear margins; adjuvant and neoadjuvant imatinib (targeted KIT/PDGFRA inhibitor) significantly reduces recurrence risk in high-risk tumours.',
        'أكثر أورام الجهاز الهضمي اللحمانية شيوعاً، ينشأ من الخلايا البينية لكاجال أو سلائفها؛ 85–90% لديها طفرات منشّطة في KIT (CD117) أو PDGFRA؛ الموضع الأكثر شيوعاً هو المعدة (60%) تليها الأمعاء الدقيقة (30%)؛ تصنيف الخطر (الحجم، مؤشر الانقسام، الموضع، التمزق) يوجّه الإدارة؛ العلاج الأساسي هو الاستئصال الجراحي بهوامش نظيفة؛ الإيماتينيب المساعد وقبل الجراحة (مثبط KIT/PDGFRA الموجّه) يقلص بشكل كبير من خطر التكرار في الأورام عالية الخطر.'
      ),
      (
        '2B90.Y',
        'Lynch syndrome',
        'متلازمة لينش',
        'Hereditary colorectal cancer syndrome caused by germline mutations in mismatch repair (MMR) genes (MLH1, MSH2, MSH6, PMS2) leading to microsatellite instability (MSI-H); autosomal dominant inheritance; confers 30–70% lifetime risk of colorectal cancer (predominantly right-sided) and elevated risks of endometrial, ovarian, gastric, urinary tract, and small bowel cancers; screening colonoscopy every 1–2 years from age 25; prophylactic colectomy or aspirin chemoprevention may be considered; immunotherapy (pembrolizumab) is highly effective for MMR-deficient tumours.',
        'متلازمة سرطان القولون الوراثية الناجمة عن طفرات في الخط الجرثومي في جينات إصلاح التزاوج الخاطئ (MLH1، MSH2، MSH6، PMS2) مما يؤدي إلى عدم استقرار الريبوسات الدقيقة؛ وراثة صبغية سائدة؛ تمنح خطراً مدى الحياة 30–70% للإصابة بسرطان القولون والمستقيم (غالباً الجانب الأيمن) وخطوراً مرتفعة لسرطانات الرحم والمبيض والمعدة المسالك البولية والأمعاء الدقيقة؛ تنظير القولون للفحص كل 1–2 سنوات من سن 25؛ استئصال القولون الوقائي أو الوقاية الكيميائية بالأسبرين قد يُنظر فيهما؛ العلاج المناعي (بيمبروليزوماب) فعّال للغاية في الأورام ناقصة MMR.'
      ),
      (
        '2B91.Z',
        'malignant neoplasm of rectosigmoid junction, unspecified',
        'ورم خبيث في الوصل السيني المستقيمي غير المحدد',
        'Colorectal adenocarcinoma arising at the junction of the sigmoid colon and upper rectum (approximately 15–18 cm from the anal verge); shares features of both sigmoid colon and rectal cancers; staging requires MRI pelvis for local assessment; surgical treatment is typically high anterior resection or low anterior resection (with or without TME depending on exact tumour location relative to peritoneal reflection); may not require neoadjuvant chemoradiotherapy if above the peritoneal reflection and node-negative.',
        'سرطان غدي للقولون والمستقيم ينشأ عند تقاطع القولون السيني والمستقيم العلوي (حوالي 15–18 سم من الحافة الشرجية)؛ يشترك في خصائص سرطانات القولون السيني والمستقيم؛ يتطلب التصنيف المرحلي رنيناً مغناطيسياً للحوض للتقييم الموضعي؛ العلاج الجراحي عادةً استئصال أمامي عالٍ أو منخفض (مع أو بدون TME تبعاً لموضع الورم بالنسبة للانعكاس البريتوني)؛ قد لا يستلزم علاجاً كيماوي-إشعاعياً مسبقاً إذا كان فوق الانعكاس البريتوني وسلبي العقد.'
      ),
      (
        '2C12.02',
        'hepatocellular carcinoma',
        'سرطان الكبد الخلوي',
        'Most common primary liver malignancy, arising from hepatocytes; 80–90% develop in the setting of chronic liver disease (hepatitis B, hepatitis C, alcoholic or NASH-related cirrhosis); diagnosed by multiphasic CT or MRI (arterial enhancement, venous washout pattern) without biopsy in high-risk patients; staging by Barcelona Clinic Liver Cancer (BCLC) classification; treatment options include liver resection (early-stage, adequate hepatic reserve), liver transplantation (Milan criteria), locoregional therapies (TACE, ablation), and systemic targeted therapy (sorafenib, atezolizumab-bevacizumab).',
        'أكثر أورام الكبد الأولية شيوعاً، ينشأ من خلايا الكبد؛ 80–90% تتطور على خلفية مرض كبدي مزمن (التهاب الكبد B، والتهاب الكبد C، وتليّف الكبد الكحولي أو المرتبط بـ NASH)؛ يُشخَّص بالتصوير المقطعي أو الرنين المغناطيسي متعدد الأطوار (تعزيز شرياني، نمط غسيل وريدي) دون خزعة في المرضى عالي الخطورة؛ التصنيف المرحلي بتصنيف عيادة برشلونة للسرطان الكبدي BCLC؛ خيارات العلاج تشمل استئصال الكبد (الشكل المبكر مع احتياطي كبدي كافٍ)، وزرع الكبد (معايير ميلانو)، والعلاجات الموضعية الإقليمية (TACE، الإجهاد الحراري)، والعلاج الجهازي الموجّه (سورافينيب، أتيزوليزوماب-بيفاسيزوماب).'
      )
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    // ── 2. Link all 17 to GS department ──────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
      SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS'
        AND d."icdCode" IN (
          'DD51/ME24.2','DB30.Z','DB30.0',
          '2F30.5','2E65.2','2C61.1','2E65.5','GB20.0','GB22','2F30.3','2E65.0',
          '2B92.0','2C00.3','2B5B.Z','2B90.Y','2B91.Z','2C12.02'
        )
      ON CONFLICT DO NOTHING
    `);

    // ── 3. Link to main_diags ─────────────────────────────────────────────

    // DD51/ME24.2 → bowel obstruction (strangulated inguinal hernia)
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'bowel obstruction' AND d."icdCode" = 'DD51/ME24.2'
      ON CONFLICT DO NOTHING
    `);

    // DD51/ME24.2 also → hernias
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'hernias' AND d."icdCode" = 'DD51/ME24.2'
      ON CONFLICT DO NOTHING
    `);

    // DB30.Z, DB30.0 → bowel obstruction
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'bowel obstruction'
        AND d."icdCode" IN ('DB30.Z','DB30.0')
      ON CONFLICT DO NOTHING
    `);

    // breast lumps & cancer (8 diagnoses)
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'breast lumps & cancer'
        AND d."icdCode" IN ('2F30.5','2E65.2','2C61.1','2E65.5','GB20.0','GB22','2F30.3','2E65.0')
      ON CONFLICT DO NOTHING
    `);

    // colorectal polyps & masses (6 diagnoses)
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'GS' AND md.title = 'colorectal polyps & masses'
        AND d."icdCode" IN ('2B92.0','2C00.3','2B5B.Z','2B90.Y','2B91.Z','2C12.02')
      ON CONFLICT DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = [
      'DD51/ME24.2','DB30.Z','DB30.0',
      '2F30.5','2E65.2','2C61.1','2E65.5','GB20.0','GB22','2F30.3','2E65.0',
      '2B92.0','2C00.3','2B5B.Z','2B90.Y','2B91.Z','2C12.02',
    ];
    const list = codes.map(c => `'${c}'`).join(',');
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" IN (${list}))`);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" IN (${list}))`);
    await queryRunner.query(`DELETE FROM "diagnoses" WHERE "icdCode" IN (${list})`);
  }
}
