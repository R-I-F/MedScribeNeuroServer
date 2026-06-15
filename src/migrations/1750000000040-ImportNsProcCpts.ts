import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Imports all 96 NS proc_cpts from production KA MySQL (read-only source).
 * Adds Arabic title + description (new columns not in production).
 * numCode normalised to lowercase to collapse duplicate casing pairs.
 * Adds a unique index on (alphaCode, numCode) to prevent future duplicates.
 */
export class ImportNsProcCpts1750000000040 implements MigrationInterface {
  name = "ImportNsProcCpts1750000000040";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Unique natural key — prevents the duplicate-casing pairs in source data
    await queryRunner.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS "UQ_proc_cpts_alphaCode_numCode"
        ON "proc_cpts" ("alphaCode", "numCode")
    `);

    await queryRunner.query(`
      INSERT INTO "proc_cpts" ("title","alphaCode","numCode","description","ar_title","ar_description") VALUES

      -- CRAN: burr-hole / minor cranial access
      ('csf diversion neither vp shunt nor etv','CRAN','61107-00',
       'twist drill hole(s) for subdural, intracerebral, or ventricular puncture; for implanting ventricular catheter, pressure recording device, or other intracerebral monitoring device',
       'تحويل السائل الدماغي الشوكي (غير شنت VP أو ETV)',
       'إجراء ثقب بالمثقاب لتحويل السائل الدماغي الشوكي دون اللجوء إلى شنت بطيني بريتوني أو بطينوستومي داخلية بالمنظار.'),

      ('evd','CRAN','61107-01',
       'twist drill hole(s) for subdural, intracerebral, or ventricular puncture; for implanting ventricular catheter, pressure recording device, or other intracerebral monitoring device',
       'تصريف بطيني خارجي',
       'تركيب قسطرة بطينية خارجية لتصريف السائل الدماغي الشوكي أو قياس الضغط داخل القحف عبر ثقبة بالمثقاب.'),

      ('csf diversion otherwise','CRAN','61107-04',
       'twist drill hole(s) for subdural, intracerebral, or ventricular puncture; for implanting ventricular catheter, pressure recording device, or other intracerebral monitoring device',
       'تحويل السائل الدماغي الشوكي (أسلوب آخر)',
       'تحويل السائل الدماغي الشوكي بأسلوب غير اعتيادي عبر ثقبة مثقاب لأغراض تشخيصية أو علاجية.'),

      ('burr holes','CRAN','61108-00',
       'Small skull openings to relieve pressure or access brain.',
       'ثقوب المثقاب',
       'فتحات صغيرة في الجمجمة بواسطة المثقاب الجراحي للوصول إلى الدماغ أو تخفيف الضغط داخل القحف.'),

      ('biopsy','CRAN','61140-00',
       'burr hole(s) or trephine; with biopsy of brain or intracranial lesion',
       'خزعة دماغية',
       'أخذ عينة نسيجية من آفة دماغية أو داخل القحف عبر ثقبة مثقاب أو تربان للفحص النسيجي.'),

      ('ventriculosubgaleal shunt','CRAN','61210-00',
       'burr hole(s); for implanting ventricular catheter, reservoir, eeg electrode(s), pressure recording device, or other cerebral monitoring device',
       'شنت بطيني تحت الجلدرة',
       'تحويل مؤقت للسائل الدماغي الشوكي من البطين إلى الفضاء تحت الجلدرة، يُستخدم في حديثي الولادة كإجراء تجسيري ريثما يتحمل الطفل الشنت الدائم.'),

      ('craniotomy for further procedure','CRAN','61304-00',
       'Removing skull section for brain surgery access.',
       'قراضة القحف لإجراء آخر',
       'رفع قطعة عظمية من الجمجمة للوصول إلى الدماغ تمهيداً لإجراء جراحي آخر.'),

      ('evacuation of the hematoma','CRAN','61312-00',
       'craniectomy or craniotomy for evacuation of hematoma, supratentorial; extradural or subdural',
       'إخلاء الورم الدموي',
       'إخلاء ورم دموي فوق الخيمة المخيخية (فوق الجافية أو تحتها) عبر قراضة أو فتح القحف.'),

      ('evacuation','CRAN','61313-00',
       'craniectomy or craniotomy for evacuation of hematoma, supratentorial; intracerebral',
       'إخلاء الدم',
       'إخلاء ورم دموي داخل المخ فوق الخيمة المخيخية عبر قراضة أو فتح القحف.'),

      ('bony decompression','CRAN','61322-00',
       'craniectomy or craniotomy, decompressive, with or without duraplasty, for treatment of intracranial hypertension, without evacuation of associated intraparenchymal hematoma; without lobectomy',
       'إزالة ضغط عظمي',
       'قراضة أو فتح قحف تخفيفي لعلاج ارتفاع الضغط داخل القحف دون إخلاء ورم دموي حمي مصاحب ودون استئصال فص.'),

      ('decompressive craniectomy','CRAN','61322-01',
       'craniectomy or craniotomy, decompressive, with or without duraplasty, for treatment of intracranial hypertension, without evacuation of associated intraparenchymal hematoma; without lobectomy',
       'قراضة الجمجمة التخفيفية',
       'إزالة قطعة عظمية من الجمجمة بصورة دائمة لتخفيف ارتفاع الضغط داخل القحف في الحالات الحرجة.'),

      ('decompressive craniotomy','CRAN','61322-02',
       'craniectomy or craniotomy, decompressive, with or without duraplasty, for treatment of intracranial hypertension, without evacuation of associated intraparenchymal hematoma; without lobectomy',
       'فتح القحف التخفيفي',
       'فتح القحف مؤقتاً لتخفيف ضغط الدماغ مع إعادة القطعة العظمية في مرحلة لاحقة.'),

      ('duroplasty','CRAN','61322-03',
       'craniectomy or craniotomy, decompressive, with or without duraplasty, for treatment of intracranial hypertension, without evacuation of associated intraparenchymal hematoma; without lobectomy',
       'رأب الجافية',
       'توسيع الأم الجافية بترقيع صناعي أو طبيعي لتوفير مساحة إضافية لتمدد الدماغ وتخفيف الضغط داخل القحف.'),

      ('microvascular decompression','CRAN','61458-00',
       'craniectomy, suboccipital; for exploration or decompression of cranial nerves',
       'إزالة الضغط الوعائي الدقيق',
       'عملية تحت القذالية لإزالة ضغط الأوعية الدموية عن جذر العصب القحفي، تُستخدم في علاج الألم العصبي التوأمي وتشنج نصف الوجه.'),

      ('subtotal resection','CRAN','61510-00',
       'craniectomy, trephination, bone flap craniotomy; for excision of brain tumor, supratentorial, except meningioma',
       'استئصال جزئي',
       'استئصال جزء من ورم دماغي فوق الخيمة المخيخية (غير سحائي) بقدر ما تسمح السلامة الجراحية.'),

      ('gross total resection','CRAN','61510-01',
       'craniectomy, trephination, bone flap craniotomy; for excision of brain tumor, supratentorial, except meningioma',
       'استئصال كلي',
       'استئصال الورم الدماغي فوق الخيمة المخيخية بالكامل أو بنسبة عالية جداً (غير سحائي).'),

      ('cyst fenestration','CRAN','61516-00',
       'invasive cyst drainage surgery',
       'فنسترة الكيس',
       'فتح جراحي للكيس داخل القحف بهدف تصريف محتواه وتخفيف الضغط المرتبط به.'),

      ('lesionectomy','CRAN','61534-00',
       'craniotomy with elevation of bone flap; for excision of epileptogenic focus without electrocorticography during surgery',
       'استئصال البؤرة الصرعية',
       'استئصال البؤرة المسببة للصرع دون استخدام التخطيط الكهربائي للقشرة أثناء الجراحة.'),

      ('lobectomy','CRAN','61537-00',
       'craniotomy with elevation of bone flap; for lobectomy, temporal lobe, without electrocorticography during surgery',
       'استئصال الفص الدماغي',
       'استئصال الفص الصدغي أو فص دماغي آخر لعلاج الصرع المقاوم للعلاج الدوائي.'),

      ('callostomy','CRAN','61541-00',
       'craniotomy with elevation of bone flap; for transection of corpus callosum',
       'قطع الجسم الثفني',
       'بضع الجسم الثفني لمنع انتشار النشاط الصرعي بين نصفي الكرة المخية في الصرع المقاوم.'),

      ('hemispherectomy','CRAN','61543-00',
       'craniotomy with elevation of bone flap; for partial or subtotal (functional) hemispherectomy',
       'استئصال نصف الكرة المخية',
       'استئصال جزئي أو وظيفي لنصف الكرة المخية في حالات الصرع الشديد المقاوم المرتبط بتلف نصف كروي واسع.'),

      ('amygdalohippocampectomy','CRAN','61566-00',
       'craniotomy with elevation of bone flap; for selective amygdalohippocampectomy',
       'استئصال اللوزة والحصين الانتقائي',
       'استئصال انتقائي للوزة والحصين لعلاج الصرع الفص الصدغي الإنسي.'),

      ('foreign body removal','CRAN','61570-00',
       'craniectomy or craniotomy; with excision of foreign body from brain',
       'إزالة جسم غريب من الدماغ',
       'إزالة جسم غريب من حمة الدماغ أو التجويف القحفي عبر قراضة أو فتح القحف.'),

      ('coiling','CRAN','61624-00',
       'coiling',
       'لف الأوعية (كويلينج)',
       'إجراء تدخلي داخل الأوعية لإدخال ملفات معدنية داخل أم الدم الدماغية لإيقاف تروية التجويف ومنع التمزق.'),

      ('stenting','CRAN','61635-00',
       'stenting for ischemic stroke',
       'تركيب الدعامة الوعائية',
       'تركيب دعامة داخل الشريان المسدود لعلاج السكتة الدماغية الإقفارية أو تضيق الشرايين الدماغية.'),

      ('balloon angioplasty','CRAN','61640-00',
       'balloon angioplasty',
       'رأب الأوعية بالبالون',
       'توسيع الشريان الدماغي المتضيق بواسطة بالون داخل الأوعية لتحسين التروية الدماغية.'),

      ('wrapping','CRAN','61697-00',
       'surgery of complex intracranial aneurysm, intracranial approach; carotid circulation',
       'تغليف أم الدم',
       'تغليف أم الدم الدماغية المعقدة بمواد حيوية لتقوية جدارها ومنع التمزق حين يتعذر التثبيط.'),

      ('clipping','CRAN','61703-00',
       'surgery of intracranial aneurysm, cervical approach by application of occluding clamp to cervical carotid artery',
       'تثبيط أم الدم',
       'تطبيق مشبك معدني على عنق أم الدم الدماغية لإغلاق تجويفها وإيقاف التدفق الدموي إليها.'),

      ('direct bypass','CRAN','61711-00',
       'anastomosis, arterial, extracranial-intracranial (eg, middle cerebral/cortical) arteries',
       'مجازة وعائية مباشرة',
       'مفاغرة شريانية مباشرة بين شريان خارج القحف وشريان دماغي قشري لتحسين التروية الدماغية.'),

      ('indirect bypass','CRAN','61711-01',
       'anastomosis, arterial, extracranial-intracranial (eg, middle cerebral/cortical) arteries',
       'مجازة وعائية غير مباشرة',
       'تقنية تحويل تدريجي للدم إلى الدماغ عبر تلاصق أنسجة وعائية خارج وداخل القحف دون مفاغرة مباشرة.'),

      ('lesion','CRAN','61715-00',
       'ultrasonic ablation',
       'استئصال الآفة بالموجات فوق الصوتية',
       'تدمير آفة دماغية محددة باستخدام طاقة الموجات فوق الصوتية المركزة كإجراء علاجي وظيفي.'),

      ('deep brain stimulation','CRAN','61863-00',
       'twist drill, burr hole, craniotomy, or craniectomy with stereotactic implantation of neurostimulator electrode array in subcortical site',
       'تحفيز الدماغ العميق',
       'زرع أقطاب كهربائية بدقة ثلاثية الأبعاد في مناطق تحت قشرية (مهاد، كرة شاحبة، نواة تحت مهادية) لتعديل نشاط الدوائر العصبية في اضطرابات الحركة والصرع والألم.'),

      ('elevation of depressed fracture','CRAN','62000-00',
       'elevation of depressed skull fracture; simple, extradural',
       'رفع الكسر المنخفض',
       'رفع قطعة عظمية منخفضة من الجمجمة ناجمة عن الصدمة لتخفيف الضغط على الدماغ، بسيطة خارج الجافية.'),

      ('foraminoplasty','CRAN','62161-00',
       'neuroendoscopy, intracranial; with dissection of adhesions, fenestration of septum pellucidum or intraventricular cysts',
       'رأب الثقبة البطينية',
       'توسيع ثقبة مونرو أو إزالة التصاقات بطينية وتفنيس أكياس بطينية أو الحاجز الشفاف بالمنظار العصبي داخل القحف.'),

      ('septostomy','CRAN','62161-01',
       'neuroendoscopy, intracranial; with dissection of adhesions, fenestration of septum pellucidum or intraventricular cysts',
       'بضع الحاجز الشفاف',
       'إحداث فتحة في الحاجز الشفاف بالمنظار العصبي لتوحيد البطينين الجانبيين وتخفيف استسقاء الدماغ المحلي.'),

      ('etv','CRAN','62201-00',
       'ventriculocisternostomy, third ventricle; stereotactic, neuroendoscopic method',
       'بطينوستومي الثالث الداخلية بالمنظار',
       'إحداث فتحة في قاع البطين الثالث بالمنظار العصبي لتحويل السائل الدماغي الشوكي مباشرة إلى الصهاريج القاعدية بديلاً عن الشنت.'),

      -- FUSN: spinal fusion & instrumentation
      ('kyphoplasty','FUSN','22513-00',
       'kyphoplasty',
       'رأب الحدب',
       'حقن أسمنت العظام في جسم فقرة مكسورة بعد توسيعها بالون لاستعادة الارتفاع وتثبيت الكسر الانضغاطي.'),

      ('spinal fusion','FUSN','22612-00',
       'arthrodesis, posterior or posterolateral technique, single level; lumbar',
       'دمج العمود الفقري',
       'دمج فقرتين أو أكثر معاً بتقنية خلفية أو خلفية جانبية لمستوى واحد قطني لتثبيت العمود الفقري وتخفيف الألم.'),

      ('fusion','FUSN','22612-01',
       'arthrodesis, posterior or posterolateral technique, single interspace; lumbar',
       'اندماج فقري',
       'اندماج بين فقرتين بالتقنية الخلفية أو الخلفية الجانبية في المستوى القطني.'),

      ('posterior fusion','FUSN','22612-02',
       'arthrodesis, posterior or posterolateral technique, single interspace; lumbar',
       'اندماج فقري خلفي',
       'دمج فقري بالنهج الخلفي يشمل تحضير الفضاء بين الفقرات وزرع مادة العظام لتحقيق الاندماج.'),

      ('intertransverse fusion','FUSN','22612-03',
       'arthrodesis, posterior or posterolateral technique, single interspace; lumbar',
       'اندماج عبر النواتئ العرضية',
       'دمج فقري بالتقنية الخلفية الجانبية عبر النواتئ العرضية في المستوى القطني.'),

      ('intervertebral fusion','FUSN','22630-00',
       'arthrodesis, posterior interbody technique, including laminectomy and/or discectomy to prepare interspace; lumbar',
       'اندماج بين الفقرات',
       'دمج جسمين فقريين عبر التقنية الخلفية بين الجسمين مع تحضير الفضاء باستئصال الصفيحة و/أو الديسك.'),

      ('removal of prolapsed disc','FUSN','22630-01',
       'arthrodesis, posterior interbody technique, including laminectomy and/or discectomy to prepare interspace; lumbar',
       'إزالة الديسك المنزلق',
       'استئصال الديسك المنزلق أو المنفتق ضمن مرحلة تحضير الفضاء قبل الدمج الفقري بالتقنية الخلفية.'),

      ('fixation via wires','FUSN','22841-00',
       'spinal wiring',
       'تثبيت فقري بالأسلاك',
       'تثبيت الفقرات باستخدام أسلاك جراحية لدعم الدمج الفقري أو معالجة عدم استقرار العمود الفقري.'),

      ('fixation via hooks','FUSN','22842-00',
       'posterior spinal instrumentation',
       'تثبيت فقري بالخطافات',
       'تثبيت العمود الفقري من الخلف باستخدام خطافات فولاذية تثبت على الصفائح أو النواتئ الشوكية.'),

      ('fixation via pedicle screws and rods','FUSN','22842-01',
       'posterior spinal instrumentation',
       'تثبيت بمسامير العنيق والقضبان',
       'تثبيت العمود الفقري من الخلف باستخدام مسامير تُزرع في عنيق الفقرة وتُربط بقضبان معدنية لتحقيق استقرار قوي.'),

      ('fixation otherwise','FUSN','22842-02',
       'posterior spinal instrumentation',
       'تثبيت فقري بأسلوب آخر',
       'تثبيت العمود الفقري من الخلف بأدوات جراحية أخرى غير المسامير والخطافات والأسلاك الاعتيادية.'),

      ('fixation via screws and plate','FUSN','22845-00',
       'anterior spinal instrumentation',
       'تثبيت بالمسامير والصفيحة الأمامية',
       'تثبيت العمود الفقري من الأمام باستخدام صفيحة معدنية ومسامير تُثبَّت على الأجسام الفقرية.'),

      -- LAM: laminectomy / spinal decompression
      ('foraminotomy','LAM','0274t-00',
       'percutaneous foraminotomy',
       'توسيع الثقبة الفقرية بالجلد',
       'توسيع الثقبة الفقرية بتقنية경피ية لتخفيف الضغط على الجذر العصبي.'),

      ('traction and immobilization','LAM','20660-00',
       'cervical traction',
       'شد الرقبة وتثبيتها',
       'تطبيق قوى شد على العمود الفقري العنقي بهدف تفريج الضغط عن الجذور العصبية والمفاصل.'),

      ('vertebroplasty','LAM','22511-00',
       'vertebroplasty',
       'رأب الفقرة',
       'حقن أسمنت العظام مباشرة في جسم فقرة مكسورة لتثبيت الكسر وتخفيف الألم دون استعادة الارتفاع.'),

      ('fenestration','LAM','63042-00',
       'laminotomy (hemilaminectomy), with decompression of nerve root(s), including partial facetectomy, foraminotomy and/or excision of herniated intervertebral disc, reexploration, single interspace; lumbar',
       'فنسترة الصفيحة الفقرية',
       'استئصال جزء من الصفيحة الفقرية (نصف استئصال) لإزالة الضغط عن الجذر العصبي مع استئصال جزئي للمفصل الوجيهي وتوسيع الثقبة و/أو استئصال الديسك المنفتق.'),

      ('laminectomy','LAM','63047-00',
       'laminectomy, facetectomy and foraminotomy (unilateral or bilateral with decompression of spinal cord, cauda equina and/or nerve root[s]), single vertebral segment; lumbar',
       'استئصال الصفيحة الفقرية',
       'استئصال الصفيحة الفقرية والمفصل الوجيهي وتوسيع الثقبة في مقطع قطني واحد لإزالة الضغط عن الحبل الشوكي أو ذيل الفرس أو الجذور العصبية.'),

      ('decompression','LAM','63047-01',
       'laminectomy, facetectomy and foraminotomy (unilateral or bilateral with decompression of spinal cord, cauda equina and/or nerve root[s]), single vertebral segment; lumbar',
       'إزالة الضغط الفقري',
       'إزالة الضغط عن الحبل الشوكي أو الجذور العصبية عبر استئصال الصفيحة وتوسيع الثقبة في المستوى القطني.'),

      ('laminoplasty','LAM','63050-00',
       'laminoplasty, cervical, with decompression of the spinal cord, 2 or more vertebral segments',
       'رأب الصفيحة الفقرية',
       'توسيع القناة الشوكية العنقية بإعادة تشكيل الصفيحة الفقرية مع الحفاظ عليها لإزالة الضغط عن الحبل الشوكي في مقطعين أو أكثر.'),

      ('korpectomy','LAM','63087-00',
       'vertebral corpectomy (vertebral body resection), partial or complete, combined thoracolumbar approach with decompression of spinal cord, cauda equina or nerve root(s), lower thoracic or lumbar; single segment',
       'استئصال جسم الفقرة',
       'استئصال جزئي أو كامل لجسم فقرة صدرية سفلية أو قطنية عبر نهج مشترك خلفي-أمامي لإزالة الضغط عن الحبل الشوكي أو ذيل الفرس.'),

      ('drez','LAM','63170-00',
       'laminectomy with myelotomy (eg, bischof or drez type), cervical, thoracic, or thoracolumbar',
       'عملية DREZ',
       'استئصال الصفيحة مع بضع منطقة دخول الجذر الظهري (DREZ) لعلاج الألم المزمن الشديد المقاوم للعلاج.'),

      ('rhizotomy','LAM','63185-00',
       'laminectomy with rhizotomy; 1 or 2 segments',
       'قطع الجذر العصبي',
       'استئصال الصفيحة مع قطع جذر عصبي واحد أو اثنين لعلاج الألم المزمن أو التشنج العضلي الشديد.'),

      ('cordotomy','LAM','63197-00',
       'laminectomy with cordotomy, with section of both spinothalamic tracts, 1 stage; thoracic',
       'قطع الحبل الشوكي',
       'استئصال الصفيحة مع قطع المسالك الشوكية المهادية في المستوى الصدري لعلاج الألم الشديد المقاوم من الأورام أو الحالات الأخرى.'),

      ('release of the tethered cord','LAM','63200-00',
       'laminectomy, with release of tethered spinal cord, lumbar',
       'تحرير الحبل الشوكي المربوط',
       'استئصال الصفيحة القطنية مع تحرير الحبل الشوكي المربوط بالأنسجة الندبية أو الشحمية لمنع تطور العجز العصبي.'),

      ('spinal cord stimulation','LAM','63650-00',
       'spinal cord stimulator electrode placement',
       'تحفيز الحبل الشوكي',
       'زرع أقطاب كهربائية في الفضاء فوق الجافية لتحفيز الحبل الشوكي وعلاج الألم المزمن المقاوم.'),

      ('repair duroplasty','LAM','63709-00',
       'repair of dural/cerebrospinal fluid leak or pseudomeningocele, with laminectomy',
       'ترميم الجافية ورأبها',
       'إصلاح تسرب السائل الدماغي الشوكي أو كيس السحايا الكاذب مع استئصال الصفيحة الفقرية.'),

      ('duroplasty','LAM','63709-01',
       'repair of dural/cerebrospinal fluid leak or pseudomeningocele, with laminectomy',
       'رأب الجافية الشوكية',
       'ترقيع الأم الجافية لإصلاح تمزقها أو تسرب السائل الدماغي الشوكي مع إجراء استئصال الصفيحة.'),

      ('lumboperitoneal shunt','LAM','63741-00',
       'creation of shunt, lumbar, subarachnoid-peritoneal, -pleural, or other; without laminectomy',
       'شنت قطني بريتوني',
       'تحويل السائل الدماغي الشوكي من الفضاء تحت العنكبوتي القطني إلى تجويف البطن دون استئصال صفيحة.'),

      ('foraminal block (peri-radicular)','LAM','64483-00',
       'foraminal block',
       'حقن حول الجذر العصبي',
       'حقن مخدر موضعي و/أو كورتيكوستيرويد حول الجذر العصبي عند مستوى الثقبة لعلاج الألم الجذري.'),

      ('local injection','LAM','64493-00',
       'lumbar facet injection',
       'حقن موضعي للمفصل الوجيهي',
       'حقن المفصل الوجيهي القطني بمخدر موضعي وكورتيكوستيرويد لعلاج آلام أسفل الظهر الناجمة عن المفاصل الوجيهية.'),

      ('facet block','LAM','64493-01',
       'lumbar facet injection',
       'حصار المفصل الوجيهي',
       'تخدير المفصل الوجيهي القطني بحقن موضعية لتشخيص آلام الظهر المنشأ الوجيهي وعلاجها.'),

      ('radiofrequency ablation','LAM','64636-00',
       'lumbar radiofrequency ablation',
       'استئصال بالترددات الراديوية',
       'استخدام طاقة الترددات الراديوية لتدمير الأعصاب الوجيهية القطنية وعلاج الألم المزمن المنشأ الوجيهي.'),

      -- MNR: minor / bedside procedures
      ('debridment','MNR','11044-00',
       'wound debridement',
       'تنضير الجرح',
       'إزالة الأنسجة الميتة والملوثة والأجسام الغريبة من الجرح لتهيئة بيئة مناسبة للالتئام.'),

      ('tissue excision','MNR','11044-01',
       'wound debridement',
       'استئصال نسيج',
       'استئصال الأنسجة التالفة أو المصابة من الجرح كجزء من عملية التنضير الجراحي.'),

      ('basic surgical step (sutures or muscle separation)','MNR','12001-00',
       'Standard techniques: suturing, muscle separation, tissue handling.',
       'خطوة جراحية أساسية (خياطة أو فصل العضلات)',
       'تقنيات جراحية أساسية تشمل الخياطة وفصل العضلات والتعامل مع الأنسجة كخطوات مكملة ضمن الإجراء الجراحي.'),

      ('wound closure','MNR','13121-00',
       'wound repair',
       'إغلاق الجرح',
       'إغلاق الجرح الجراحي بالخياطة أو الدبابيس أو غيرها من وسائل الإغلاق الجراحي لتسهيل الالتئام.'),

      ('ventricular tapping','MNR','61000-00',
       'ventricular tap',
       'شفط بطيني',
       'سحب السائل الدماغي الشوكي مباشرة من البطين الدماغي عبر ثقبة للتشخيص أو لتخفيف الضغط بصورة مؤقتة.'),

      ('manometry','MNR','61020-00',
       'ventricular manometry',
       'قياس الضغط البطيني',
       'قياس ضغط السائل الدماغي الشوكي داخل البطين عبر قسطرة بطينية لتقييم ارتفاع الضغط داخل القحف.'),

      ('tapping','MNR','61020-01',
       'ventricular tap',
       'شفط السائل البطيني',
       'سحب كمية من السائل الدماغي الشوكي من البطين لتخفيف الضغط أو لأغراض تشخيصية.'),

      ('lumbar puncture','MNR','62270-00',
       'lumbar puncture',
       'البزل القطني',
       'إدخال إبرة في الفضاء تحت العنكبوتي القطني لسحب السائل الدماغي الشوكي أو قياس ضغطه أو حقن دواء.'),

      ('tap test','MNR','62272-00',
       'spinal tap',
       'اختبار البزل',
       'سحب كمية من السائل الدماغي الشوكي بالبزل القطني لتقييم استجابة المريض وتشخيص استسقاء الدماغ طبيعي الضغط.'),

      ('lumbar csf drainage','MNR','62272-01',
       'spinal tap',
       'تصريف السائل الدماغي الشوكي القطني',
       'تصريف السائل الدماغي الشوكي عبر إبرة قطنية للتشخيص أو لتخفيف الضغط بشكل مؤقت.'),

      ('vacuum drainage','MNR','97605-00',
       'vac placement',
       'تصريف شفطي (VAC)',
       'تركيب نظام ضغط سالب (VAC) للتصريف المستمر للجرح وتحسين التئامه في الجروح المعقدة أو المصابة.'),

      -- NONE
      ('other procedure','NONE','00000-00',
       'other procedures',
       'إجراء آخر',
       'إجراء جراحي أو طبي لا ينتمي إلى الفئات المحددة المدرجة في القائمة.'),

      -- PRPH: peripheral nerve
      ('vagal nerve compression','PRPH','0908t-00',
       'vagal nerve stimulator implantation',
       'تحفيز العصب المبهم',
       'زرع جهاز تحفيز العصب المبهم تحت الجلد وتوصيل أقطابه بالعصب المبهم الأيسر لعلاج الصرع المقاوم والاكتئاب.'),

      ('tarsal tunnel','PRPH','28035-00',
       'tarsal tunnel release',
       'تحرير النفق الرصغي',
       'بضع الرباط الخلفي الظنبوبي السفلي لتخفيف الضغط عن العصب الظنبوبي داخل النفق الرصغي.'),

      ('ulnar nerve entrapment (cubital tunnel syndrome)','PRPH','64718-00',
       'ulnar nerve release at the elbow',
       'تحرير العصب الزندي (متلازمة النفق الزندي)',
       'بضع الرباط الضاغط عند المرفق لتحرير العصب الزندي من النفق الزندي وعلاج التنميل والضعف في الأصابع.'),

      ('carpal tunnel','PRPH','64721-00',
       'carpal tunnel release',
       'تحرير النفق الرسغي',
       'بضع الرباط الرسغي العرضي لتوسيع النفق الرسغي وتخفيف الضغط عن العصب المتوسط وعلاج متلازمة النفق الرسغي.'),

      ('peripheral nerve tumor','PRPH','64790-00',
       'peripheral nerve sheath tumor excision',
       'استئصال ورم غمد العصب المحيطي',
       'استئصال ورم غمد العصب المحيطي (كورم شوان أو ورم ليفي عصبي) مع الحفاظ على سلامة العصب قدر الإمكان.'),

      ('nerve injury otherwise','PRPH','64856-00',
       'major peripheral nerve repair',
       'إصلاح إصابة العصب المحيطي',
       'إصلاح عصب محيطي رئيسي مقطوع أو متضرر بتقنيات الجراحة الدقيقة وإعادة الوصل العصبي.'),

      ('sciatic nerve injury','PRPH','64858-00',
       'sciatic neurorrhaphy',
       'إصلاح العصب الوركي',
       'إعادة توصيل العصب الوركي المقطوع أو المتضرر بتقنيات خياطة العصب الدقيقة.'),

      ('brachial plexus injury','PRPH','64861-00',
       'brachial plexus repair',
       'إصلاح الضفيرة العضدية',
       'إصلاح إصابة الضفيرة العضدية بتقنيات متعددة كخياطة العصب المباشرة أو زرع طعم عصبي أو نقل الجذور.'),

      -- VSHN: ventriculoperitoneal shunts
      ('laparoscopic implantation of the ventricular catheter','VSHN','62160-00',
       'endoscopic shunt placement',
       'زرع القسطرة البطينية بالمنظار',
       'زرع القسطرة البطينية لنظام الشنت تحت توجيه المنظار العصبي لتحقيق دقة أعلى في وضع القسطرة داخل البطين.'),

      ('irrigation and lavage','VSHN','62160-01',
       'neuroendoscopy, intracranial, for placement or replacement of ventricular catheter and attachment to shunt system or external drainage',
       'ري وغسيل بطيني',
       'غسيل تجويف البطين وريّه بالمنظار العصبي مع تبديل القسطرة البطينية أو ربطها بنظام التصريف.'),

      ('vp shunt','VSHN','62223-00',
       'creation of shunt; ventriculo-peritoneal, -pleural, other terminus',
       'شنت بطيني بريتوني',
       'إنشاء نظام تحويل السائل الدماغي الشوكي من البطين الدماغي إلى تجويف البطن أو الصدر لعلاج استسقاء الدماغ.'),

      ('vp shunt (programmable)','VSHN','62223-01',
       'creation of shunt; ventriculo-peritoneal, -pleural, other terminus',
       'شنت بطيني بريتوني (قابل للبرمجة)',
       'إنشاء شنت بطيني بريتوني بصمام قابل للضبط خارجياً لتعديل معدل تصريف السائل الدماغي الشوكي حسب الحاجة.'),

      ('vp shunt (fixed pressure)','VSHN','62223-02',
       'creation of shunt; ventriculo-peritoneal, -pleural, other terminus',
       'شنت بطيني بريتوني (ضغط ثابت)',
       'إنشاء شنت بطيني بريتوني بصمام ضغط ثابت محدد مسبقاً لتصريف السائل الدماغي الشوكي.')

      ON CONFLICT ("alphaCode","numCode") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM "proc_cpts"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "UQ_proc_cpts_alphaCode_numCode"`);
  }
}
