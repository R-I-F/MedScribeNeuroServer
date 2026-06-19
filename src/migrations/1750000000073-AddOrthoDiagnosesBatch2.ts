import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ORTHO coverage extension — batch 2 (39 diagnoses) + 4 new main_diag
 * categories (bone tumours, foot & ankle disorders, hand & wrist disorders,
 * paediatric & developmental conditions).
 *
 * Categories topped up: pathologic fractures, rotator cuff pathology,
 * spinal stenosis (cervical degenerative spine), spondylolisthesis.
 *
 * Shared codes (owned by other departments) are skipped by ON CONFLICT and only
 * linked to ORTHO: FA80.1 (NS), FA8Z (NS "facet arthropathy"), 8C10.1 (NS),
 * FA70.0 (NS kyphosis), FB51.0 (PRS Dupuytren). FA30.0 (acquired hallux valgus)
 * was freed by migration 071 (merge of the mis-coded lumbar-disc row).
 */
export class AddOrthoDiagnosesBatch21750000000073 implements MigrationInterface {
  name = "AddOrthoDiagnosesBatch21750000000073";

  private static readonly NEW_MAIN_DIAGS: [string, string][] = [
    ["bone tumours", "أورام العظام"],
    ["foot & ankle disorders", "اضطرابات القدم والكاحل"],
    ["hand & wrist disorders", "اضطرابات اليد والرسغ"],
    ["paediatric & developmental conditions", "الحالات العظمية للأطفال والتطورية"],
  ];

  // codes that are SHARED (owned by other depts) — never delete in down()
  private static readonly SHARED = ["FA80.1", "FA8Z", "8C10.1", "FA70.0", "FB51.0"];

  private static readonly CODES = [
    // pathologic fractures
    "FB8Y", "FB83.1Z", "FB83.11",
    // rotator cuff pathology
    "FB53.0", "FB40.3",
    // spinal stenosis (cervical degenerative)
    "FA80.1", "FA8Z", "8B42",
    // spondylolisthesis
    "FA84.0", "FA84.1", "FA81.0",
    // bone tumours
    "2B51.Z", "2B52.Z", "2B50.Z", "2F7B", "FB80.6", "FB80.5", "2A83.1", "2E83.Z",
    // foot & ankle disorders
    "FA30.0", "FA31.5", "NC96.02", "FB40.1", "FA31.7", "FA30.2", "8C11.6",
    // hand & wrist disorders
    "FB51.0", "FB42.2", "FB40.4", "FB40.5", "8C10.1", "FA30.Y",
    // paediatric & developmental
    "LB74.0", "LB98.00", "FB82.2", "FB82.1", "FA70.1", "FA70.0", "LB73.2Y",
  ];

  private async linkMain(runner: QueryRunner, mainDiag: string, codes: string[]): Promise<void> {
    await runner.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md
       JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'ORTHO' AND md.title = $1 AND d."icdCode" = ANY($2)
       ON CONFLICT DO NOTHING`,
      [mainDiag, codes]
    );
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 0. create the 4 new ORTHO main_diags ──────────────────────────────
    for (const [title, arTitle] of AddOrthoDiagnosesBatch21750000000073.NEW_MAIN_DIAGS) {
      await queryRunner.query(
        `INSERT INTO "main_diags" ("title","arTitle","departmentId")
         SELECT $1, $2, dept.id FROM "departments" dept WHERE dept.code = 'ORTHO'
         ON CONFLICT ("title","departmentId") DO NOTHING`,
        [title, arTitle]
      );
    }

    // ── 1. insert diagnoses ───────────────────────────────────────────────
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      ('FB8Y','fracture of bone in neoplastic disease','كسر العظم في الداء الورمي','Pathological fracture through bone weakened by a primary or metastatic neoplasm; common sites are the proximal femur and humerus; management includes prophylactic or stabilising fixation (intramedullary nail, endoprosthesis) and oncological treatment of the underlying tumour.','كسر مرضي عبر عظم أضعفه ورم أولي أو نقيلي؛ المواضع الشائعة هي النهاية القريبة للفخذ والعضد؛ تشمل المعالجة التثبيت الوقائي أو المثبِّت (مسمار نقوي، طرف صناعي داخلي) والعلاج الورمي للورم الكامن.'),
      ('FB83.1Z','osteoporosis','ترقق العظام','Systemic skeletal disorder of low bone mass and microarchitectural deterioration predisposing to fragility fractures (hip, vertebra, distal radius); diagnosed by DEXA; relevant to orthopaedics for fragility-fracture fixation and secondary fracture prevention with antiresorptive therapy.','اضطراب هيكلي جهازي يتسم بانخفاض كتلة العظم وتدهور البنية الدقيقة مما يهيّئ لكسور هشاشية (الورك، الفقرة، الكعبرة البعيدة)؛ يُشخَّص بمقياس الامتصاص الثنائي للأشعة؛ يهم العظام في تثبيت الكسور الهشاشية والوقاية من الكسور الثانوية بالعلاج المضاد للارتشاف.'),
      ('FB83.11','postmenopausal osteoporosis','ترقق العظام بعد سن اليأس','Type I osteoporosis resulting from oestrogen deficiency after menopause, characterised by accelerated trabecular bone loss and a propensity for vertebral and distal-radius fragility fractures; managed with bisphosphonates, denosumab, and fracture fixation as required.','ترقق العظام من النمط الأول الناجم عن نقص الإستروجين بعد سن اليأس، ويتسم بفقد متسارع للعظم التربيقي وميل لكسور هشاشية في الفقرات والكعبرة البعيدة؛ يُدار بالبيسفوسفونات والدينوسوماب وتثبيت الكسور عند الحاجة.'),

      ('FB53.0','adhesive capsulitis of shoulder','التهاب محفظة الكتف اللاصق','Frozen shoulder — progressive painful stiffness of the glenohumeral joint from capsular fibrosis and contracture; associated with diabetes; managed with physiotherapy, intra-articular steroid, hydrodilatation, and arthroscopic capsular release for refractory cases.','الكتف المتجمدة — تيبّس مؤلم تدريجي في المفصل العضدي الحقاني بسبب تليّف المحفظة وتقفّعها؛ يرتبط بالسكري؛ يُدار بالعلاج الطبيعي وحقن الستيرويد داخل المفصل والتوسيع المائي والتحرير المحفظي بالمنظار في الحالات العنيدة.'),
      ('FB40.3','calcific tendinitis of shoulder','التهاب الوتر الكلسي للكتف','Deposition of calcium hydroxyapatite within the rotator-cuff tendons (commonly supraspinatus) causing acute or chronic shoulder pain; managed with physiotherapy, ultrasound-guided barbotage, or arthroscopic excision of the deposit when refractory.','ترسّب هيدروكسي أباتيت الكالسيوم داخل أوتار الكفة المدورة (غالباً فوق الشوكة) مسبباً ألم كتف حاداً أو مزمناً؛ يُدار بالعلاج الطبيعي والرشف الموجّه بالأمواج فوق الصوتية أو الاستئصال بالمنظار عند المقاومة.'),

      ('FA80.1','intervertebral disc degeneration of cervical spine with prolapse','تنكس القرص بين الفقرات العنقية مع انزلاق','Cervical disc prolapse with herniation of nucleus pulposus causing radiculopathy or, with central herniation, myelopathy; managed with analgesia and physiotherapy, with anterior cervical discectomy and fusion or disc replacement for persistent deficit.','انزلاق القرص العنقي مع فتق النواة اللبية مسبباً اعتلال جذور أو اعتلال نخاع عند الفتق المركزي؛ يُدار بالمسكنات والعلاج الطبيعي، مع استئصال القرص العنقي الأمامي والإيثاق أو استبدال القرص عند العجز المستمر.'),
      ('FA8Z','facet arthropathy','اعتلال المفصل الوجيهي','Degenerative condition of the spine including facet-joint osteoarthritis and spondylosis causing axial neck or back pain; may contribute to foraminal stenosis; managed with physiotherapy, medial-branch blocks/radiofrequency ablation, and fusion in selected cases.','حالة تنكسية في العمود الفقري تشمل الفصال العظمي للمفصل الوجيهي والداء الفقاري مسببةً ألم رقبة أو ظهر محوري؛ قد يسهم في تضيق الثقبة؛ يُدار بالعلاج الطبيعي وحصر الفرع الإنسي/الاستئصال بالترددات الراديوية والإيثاق في حالات منتقاة.'),
      ('8B42','cervical disc disorder with myelopathy','اعتلال النخاع بسبب اضطراب القرص العنقي','Cervical spondylotic myelopathy — spinal-cord compression from degenerative disc and osteophyte disease causing gait disturbance, hand clumsiness, and hyperreflexia; the commonest cause of cord dysfunction in adults; treated by decompressive surgery (anterior discectomy/corpectomy or posterior laminectomy/laminoplasty).','اعتلال النخاع الفقاري العنقي — انضغاط الحبل الشوكي بسبب الداء التنكسي للقرص والنواتئ العظمية مسبباً اضطراب المشية وخرق اليد وفرط المنعكسات؛ أشيع أسباب خلل الحبل لدى البالغين؛ يُعالج بجراحة فك الضغط (استئصال القرص/الجسم الفقري الأمامي أو استئصال الصفيحة/رأبها الخلفي).'),

      ('FA84.0','spondylolisthesis with pars defect','الانزلاق الفقاري مع عيب البرزخ','Isthmic spondylolisthesis — forward slip of a vertebra due to a defect of the pars interarticularis, most often at L5–S1 in adolescents and young adults; presents with back pain and hamstring tightness; high-grade or progressive slips may require decompression and fusion.','الانزلاق الفقاري البرزخي — انزلاق أمامي لفقرة بسبب عيب في البرزخ المفصلي، وأكثره عند L5–S1 لدى المراهقين والشباب؛ يتظاهر بألم ظهر وشدّ في أوتار المأبض؛ قد تستلزم الانزلاقات عالية الدرجة أو المتفاقمة فك الضغط والإيثاق.'),
      ('FA84.1','spondylolisthesis without pars defect','الانزلاق الفقاري دون عيب البرزخ','Degenerative spondylolisthesis — forward slip of a vertebra without a pars defect, from facet and disc degeneration, typically at L4–L5 in older adults; causes neurogenic claudication and is treated with decompression and instrumented fusion when symptomatic.','الانزلاق الفقاري التنكسي — انزلاق أمامي لفقرة دون عيب برزخي، ناجم عن تنكس المفاصل الوجيهية والقرص، وعادةً عند L4–L5 لدى كبار السن؛ يسبب عرجاً عصبياً ويُعالج بفك الضغط والإيثاق المُجهَّز عند ظهور الأعراض.'),
      ('FA81.0','spondylolysis with slippage','انحلال الفقار مع انزلاق','Spondylolysis (a pars interarticularis stress fracture) that has progressed to vertebral slippage; common in young athletes performing repetitive hyperextension; managed with activity modification and bracing, with surgical repair or fusion for persistent symptoms or progression.','انحلال الفقار (كسر إجهادي في البرزخ المفصلي) الذي تطوّر إلى انزلاق فقري؛ شائع لدى الرياضيين الصغار الذين يكررون فرط البسط؛ يُدار بتعديل النشاط والتجبير، مع الإصلاح الجراحي أو الإيثاق عند استمرار الأعراض أو التفاقم.'),

      ('2B51.Z','osteosarcoma of bone','الساركومة العظمية','The commonest primary malignant bone tumour, arising in the metaphysis of long bones (distal femur, proximal tibia, proximal humerus) in adolescents; presents with pain and a mass; treated with neoadjuvant chemotherapy followed by wide limb-salvage resection or amputation.','أشيع الأورام العظمية الأولية الخبيثة، ينشأ في مشاش العظام الطويلة (الفخذ البعيد، الظنبوب القريب، العضد القريب) لدى المراهقين؛ يتظاهر بألم وكتلة؛ يُعالج بعلاج كيميائي مُحدِث للضمور يتبعه استئصال واسع حافظ للطرف أو بتر.'),
      ('2B52.Z','Ewing sarcoma of bone','ساركومة إيوينغ في العظم','A highly malignant small round-cell tumour of bone in children and young adults, often affecting the diaphysis of long bones and the pelvis; presents with pain, swelling, and systemic symptoms; treated with multi-agent chemotherapy, surgery, and/or radiotherapy.','ورم خبيث شديد من الخلايا المدورة الصغيرة في العظم لدى الأطفال والشباب، يصيب غالباً جدل العظام الطويلة والحوض؛ يتظاهر بألم وتورّم وأعراض جهازية؛ يُعالج بعلاج كيميائي متعدد العوامل والجراحة و/أو المعالجة الشعاعية.'),
      ('2B50.Z','chondrosarcoma','الساركومة الغضروفية','A malignant cartilage-forming bone tumour, typically in adults over 40 affecting the pelvis, proximal femur, and shoulder girdle; relatively chemo- and radio-resistant; treated primarily by wide surgical resection.','ورم عظمي خبيث مكوّن للغضروف، عادةً لدى البالغين فوق الأربعين يصيب الحوض والفخذ القريب وزنّار الكتف؛ مقاوم نسبياً للعلاج الكيميائي والشعاعي؛ يُعالج أساساً بالاستئصال الجراحي الواسع.'),
      ('2F7B','giant cell tumour of bone','الورم ذو الخلايا العملاقة في العظم','A locally aggressive tumour of uncertain behaviour at the epiphysis/metaphysis of long bones (commonly distal femur and proximal tibia) in young adults; presents with pain and a lytic lesion; treated by intralesional curettage with adjuvant or wide resection; denosumab is an adjunct.','ورم عدواني موضعياً غير محدد السلوك في مشاش/كردوس العظام الطويلة (غالباً الفخذ البعيد والظنبوب القريب) لدى الشباب؛ يتظاهر بألم وآفة حالّة للعظم؛ يُعالج بالكشط داخل الآفة مع مساعد أو بالاستئصال الواسع؛ والدينوسوماب علاج مساعد.'),
      ('FB80.6','aneurysmal bone cyst','الكيسة العظمية المُمَدِّدة','A benign but expansile, blood-filled osteolytic lesion of bone, common in the metaphysis of long bones and the spine in those under 20; presents with pain or pathological fracture; treated by curettage and bone grafting, with sclerotherapy or embolisation as alternatives.','آفة عظمية سليمة لكنها متمددة حالّة للعظم ومملوءة بالدم، شائعة في كردوس العظام الطويلة والعمود الفقري لدى من هم دون العشرين؛ تتظاهر بألم أو كسر مرضي؛ تُعالج بالكشط وترقيع العظم، مع المعالجة بالتصليب أو الإصمام كبدائل.'),
      ('FB80.5','solitary bone cyst','الكيسة العظمية المنفردة','A simple (unicameral) fluid-filled benign bone cyst, typically in the proximal humerus or femur of children; often asymptomatic until pathological fracture; treated by observation, steroid/bone-marrow injection, or curettage and grafting.','كيسة عظمية سليمة بسيطة (وحيدة الحجرة) مملوءة بالسوائل، عادةً في العضد القريب أو الفخذ لدى الأطفال؛ غالباً لا عرضية حتى حدوث كسر مرضي؛ تُعالج بالمراقبة أو حقن الستيرويد/نقي العظم أو الكشط والترقيع.'),
      ('2A83.1','plasma cell myeloma','الورم النقوي المتعدد','Multiple myeloma — a malignant clonal proliferation of plasma cells producing lytic bone lesions, hypercalcaemia, anaemia, and renal impairment; orthopaedic relevance is pathological/impending fracture fixation and vertebral augmentation; treated systemically with chemotherapy and bone-targeted agents.','الورم النقوي المتعدد — تكاثر نسيلي خبيث للخلايا البلازمية يُنتج آفات عظمية حالّة وفرط كالسيوم الدم وفقر دم وقصور كلوي؛ أهميته العظمية في تثبيت الكسور المرضية أو الوشيكة وتدعيم الفقرات؛ يُعالج جهازياً بالعلاج الكيميائي والعوامل الموجّهة للعظم.'),
      ('2E83.Z','benign osteogenic tumour','ورم عظمي حميد','A benign bone tumour such as osteoid osteoma, osteoblastoma, or osteochondroma; osteoid osteoma causes night pain relieved by NSAIDs and is treated by radiofrequency ablation, while symptomatic osteochondromas are excised.','ورم عظمي حميد كالورم العظماني السمحاقي أو الورم الأرومي العظمي أو الورم العظمي الغضروفي؛ يسبب الورم العظماني السمحاقي ألماً ليلياً تخففه مضادات الالتهاب اللاستيرويدية ويُعالج بالاستئصال بالترددات الراديوية، بينما تُستأصل الأورام العظمية الغضروفية العرضية.'),

      ('FA30.0','acquired hallux valgus','الوكع الأبهمي المكتسب','Acquired lateral deviation of the great toe at the first metatarsophalangeal joint with a prominent medial bunion; caused by biomechanical and footwear factors; managed with orthotics and footwear, with corrective osteotomy (e.g. scarf/chevron) for painful deformity.','انحراف وحشي مكتسب لإبهام القدم عند المفصل المشطي السلامي الأول مع نتوء إنسي بارز (وكعة)؛ ينجم عن عوامل ميكانيكية حيوية وأحذية؛ يُدار بالتقويمات والأحذية، مع قطع العظم التصحيحي (مثل سكارف/شيفرون) للتشوه المؤلم.'),
      ('FA31.5','acquired pes planus','القدم المسطحة المكتسبة','Acquired flat foot from collapse of the medial longitudinal arch, commonly due to posterior tibial tendon dysfunction in adults; presents with medial foot pain and hindfoot valgus; managed with orthotics, with tendon reconstruction and osteotomy or fusion for advanced deformity.','القدم المسطحة المكتسبة بسبب انهيار القوس الطولي الإنسي، وغالباً نتيجة خلل وظيفة الوتر الظنبوبي الخلفي لدى البالغين؛ تتظاهر بألم القدم الإنسي وأروح مؤخرة القدم؛ تُدار بالتقويمات، مع إعادة بناء الوتر وقطع العظم أو الإيثاق للتشوه المتقدم.'),
      ('NC96.02','rupture of Achilles tendon','تمزق وتر أخيل','Rupture of the Achilles tendon, typically in middle-aged recreational athletes during sudden push-off; presents with a palpable gap and a positive Thompson test; treated by functional bracing or surgical repair depending on patient factors.','تمزق وتر أخيل، عادةً لدى الرياضيين الترفيهيين في منتصف العمر أثناء الدفع المفاجئ؛ يتظاهر بفجوة مجسوسة واختبار طومسون إيجابي؛ يُعالج بالتجبير الوظيفي أو الإصلاح الجراحي حسب عوامل المريض.'),
      ('FB40.1','plantar fasciitis','التهاب اللفافة الأخمصية','Degenerative/inflammatory disorder of the plantar fascia at its calcaneal origin causing inferior heel pain worst on the first steps of the day; managed with stretching, orthoses, and night splints, with extracorporeal shockwave or surgical release rarely required.','اضطراب تنكسي/التهابي في اللفافة الأخمصية عند منشئها العقبي مسبباً ألماً أسفل العقب يكون أشدّ في الخطوات الأولى من اليوم؛ يُدار بالتمطيط والتقويمات وجبائر الليل، ونادراً ما تلزم الأمواج الصادمة خارج الجسم أو التحرير الجراحي.'),
      ('FA31.7','acquired clubfoot','حنف القدم المكتسب','Acquired equinovarus (clubfoot) deformity in a previously normal foot, usually from neuromuscular disease, trauma, or contracture rather than congenital causes; managed with bracing/orthoses, with soft-tissue release, tendon transfer, or osteotomy for fixed deformity.','تشوه القدم الفحجي (الحنف) المكتسب في قدم كانت سويةً، ناجم عادةً عن مرض عصبي عضلي أو رضح أو تقفّع لا عن أسباب خلقية؛ يُدار بالتجبير والتقويمات، مع تحرير الأنسجة الرخوة أو نقل الوتر أو قطع العظم للتشوه الثابت.'),
      ('FA30.2','acquired hammer toe','إصبع القدم المطرقية المكتسبة','Acquired flexion deformity of the proximal interphalangeal joint of a lesser toe with extension at the metatarsophalangeal joint; causes painful dorsal callus from footwear; treated with footwear modification, with flexor tenotomy, PIP arthrodesis, or osteotomy for fixed deformity.','تشوه ثني مكتسب في المفصل بين السلاميات القريب لإصبع قدم أصغر مع بسط عند المفصل المشطي السلامي؛ يسبب جسأة ظهرية مؤلمة من الحذاء؛ يُعالج بتعديل الأحذية، مع بضع الوتر القابض أو إيثاق المفصل بين السلاميات القريب أو قطع العظم للتشوه الثابت.'),
      ('8C11.6','lesion of plantar nerve','آفة العصب الأخمصي','Morton neuroma — a perineural fibrosis of an interdigital plantar nerve, usually the third web space, causing burning forefoot pain and toe paraesthesia; managed with footwear, orthoses, and steroid injection, with surgical excision for refractory cases.','ورم مورتون العصبي — تليّف حول العصب الأخمصي بين الأصابع، عادةً في المسافة الثالثة، مسبباً ألماً حارقاً في مقدمة القدم وتنملاً في الأصابع؛ يُدار بالأحذية والتقويمات وحقن الستيرويد، مع الاستئصال الجراحي للحالات العنيدة.'),

      ('FB51.0','palmar fascial fibromatosis','الورم الليفي للفافة الراحية','Dupuytren disease — progressive fibrous contracture of the palmar fascia forming nodules and cords that flex the ring and little fingers; treated with needle fasciotomy, collagenase injection, or open fasciectomy for functional impairment.','داء دوبويتران — تقفّع ليفي تدريجي للفافة الراحية يكوّن عقيدات وحبالاً تثني البنصر والخنصر؛ يُعالج ببضع اللفافة بالإبرة أو حقن الكولاجيناز أو استئصال اللفافة المفتوح عند ضعف الوظيفة.'),
      ('FB42.2','ganglion','الكيسة العقدية','A benign mucin-filled cyst arising from a joint capsule or tendon sheath, most commonly on the dorsal wrist; presents with a firm, sometimes painful swelling; managed with reassurance, aspiration, or surgical excision for symptomatic or recurrent lesions.','كيسة سليمة مملوءة بالمخاط تنشأ من محفظة مفصل أو غمد وتر، وأشيعها على ظهر الرسغ؛ تتظاهر بتورّم صلب مؤلم أحياناً؛ تُدار بالطمأنة أو الرشف أو الاستئصال الجراحي للآفات العرضية أو الناكسة.'),
      ('FB40.4','trigger finger','الإصبع الزنادية','Stenosing tenosynovitis of a digital flexor tendon at the A1 pulley causing painful catching or locking of the finger; managed with splinting and corticosteroid injection, with surgical A1 pulley release for persistent triggering.','التهاب غمد الوتر المضيِّق لوتر قابض إصبعي عند البكرة A1 مسبباً انحشاراً أو انغلاقاً مؤلماً للإصبع؛ يُدار بالتجبير وحقن الستيرويد، مع تحرير البكرة A1 جراحياً عند استمرار الزناد.'),
      ('FB40.5','radial styloid tenosynovitis','التهاب غمد الوتر للناتئ الإبري الكعبري','De Quervain tenosynovitis — stenosing tenosynovitis of the first dorsal compartment tendons (APL and EPB) causing radial wrist pain with a positive Finkelstein test; managed with splinting and steroid injection, with surgical release if refractory.','داء دي كرفان — التهاب غمد الوتر المضيِّق لأوتار الحجيرة الظهرية الأولى مسبباً ألماً كعبرياً في الرسغ مع اختبار فينكلشتاين إيجابي؛ يُدار بالتجبير وحقن الستيرويد، مع التحرير الجراحي عند المقاومة.'),
      ('8C10.1','lesion of ulnar nerve','آفة العصب الزندي','Cubital tunnel syndrome — compression of the ulnar nerve at the elbow causing little-finger numbness, intrinsic hand-muscle weakness, and a positive Tinel sign; managed with night splinting and activity modification, with in-situ decompression or anterior transposition surgically.','متلازمة النفق الزندي — انضغاط العصب الزندي عند المرفق مسبباً خدراً في الخنصر وضعف عضلات اليد الداخلية وعلامة تينل إيجابية؛ يُدار بالتجبير الليلي وتعديل النشاط، مع فك الضغط في الموضع أو النقل الأمامي جراحياً.'),
      ('FA30.Y','mallet finger','الإصبع المطرقية','Mallet finger — loss of active extension at the distal interphalangeal joint from disruption of the terminal extensor tendon (tendinous or bony avulsion); treated by continuous DIP extension splinting for 6–8 weeks, with fixation for large displaced bony fragments.','الإصبع المطرقية — فقد البسط الفاعل عند المفصل بين السلاميات البعيد بسبب انقطاع الوتر الباسط الطرفي (قلع وتري أو عظمي)؛ يُعالج بتجبير بسط المفصل البعيد المستمر لمدة 6–8 أسابيع، مع التثبيت للشظايا العظمية الكبيرة المنزاحة.'),

      ('LB74.0','developmental dysplasia of hip','خلل التنسج الوركي التطوري','Developmental dysplasia of the hip — abnormal acetabular and femoral-head development ranging from instability to frank dislocation in infants; detected by Ortolani/Barlow tests and ultrasound; treated with a Pavlik harness in infancy and closed/open reduction with osteotomy in late presentation.','خلل التنسج الوركي التطوري — تطوّر غير طبيعي للحُق ورأس الفخذ يتراوح من عدم الثبات إلى الخلع الصريح لدى الرضّع؛ يُكتشف باختباري أورتولاني وبارلو والأمواج فوق الصوتية؛ يُعالج بحمالة بافليك في الرضاعة والرد المغلق/المفتوح مع قطع العظم في التظاهر المتأخر.'),
      ('LB98.00','talipes equinovarus','حنف القدم الفحجي الخلقي','Congenital clubfoot — a fixed equinus, varus, adductus, and cavus deformity of the foot present at birth; the mainstay of treatment is the Ponseti method of serial casting and percutaneous Achilles tenotomy, with surgery reserved for resistant or relapsed cases.','حنف القدم الخلقي — تشوه ثابت بالقدم يجمع الفحج والعطف الإنسي والتقريب والتقوّس موجود عند الولادة؛ ركيزة العلاج طريقة بونسيتي بالتجبير المتسلسل وبضع وتر أخيل عبر الجلد، مع الجراحة للحالات المقاومة أو الناكسة.'),
      ('FB82.2','slipped upper femoral epiphysis','انزلاق المشاش الفخذي العلوي','Slipped upper (capital) femoral epiphysis — displacement of the proximal femoral epiphysis through the physis in adolescents, often overweight; presents with hip or referred knee pain and an externally rotated limb; treated by urgent in-situ percutaneous screw fixation.','انزلاق المشاش الفخذي العلوي — إزاحة مشاش الفخذ القريب عبر الصفيحة المشاشية لدى المراهقين، وغالباً زائدي الوزن؛ يتظاهر بألم في الورك أو ألم ركبة محوّل وطرف مدوّر خارجياً؛ يُعالج بالتثبيت العاجل بمسمار عبر الجلد في الموضع.'),
      ('FB82.1','juvenile osteochondrosis of femoral head','نخر مشاش رأس الفخذ عند الأطفال','Legg-Calvé-Perthes disease — idiopathic avascular necrosis of the femoral head epiphysis in children, causing hip pain and a limp; managed with containment (bracing, physiotherapy) and femoral or pelvic osteotomy to preserve femoral-head sphericity.','داء بيرثيس — نخر لاوعائي مجهول السبب في مشاش رأس الفخذ لدى الأطفال، يسبب ألم الورك والعرج؛ يُدار بالاحتواء (التجبير، العلاج الطبيعي) وقطع العظم الفخذي أو الحوضي للحفاظ على كروية رأس الفخذ.'),
      ('FA70.1','scoliosis','الجنف','Three-dimensional lateral curvature with rotation of the spine; adolescent idiopathic scoliosis is the commonest form; monitored by Cobb angle, with bracing for moderate progressive curves and posterior instrumented fusion for severe curves (>45–50°).','انحناء جانبي ثلاثي الأبعاد مع دوران في العمود الفقري؛ الجنف مجهول السبب لدى المراهقين هو أشيع الأشكال؛ يُراقَب بزاوية كوب، مع التجبير للانحناءات المتوسطة المتفاقمة والإيثاق الخلفي المُجهَّز للانحناءات الشديدة (>45–50°).'),
      ('FA70.0','kyphosis','الحداب','Excessive sagittal (forward) curvature of the spine; Scheuermann disease is a structural adolescent kyphosis from anterior vertebral wedging; managed with physiotherapy and bracing, with posterior fusion for severe or progressive deformity and neurological risk.','زيادة الانحناء السهمي (الأمامي) للعمود الفقري؛ داء شويرمان حداب بنيوي لدى المراهقين بسبب توتّد الفقرات الأمامي؛ يُدار بالعلاج الطبيعي والتجبير، مع الإيثاق الخلفي للتشوه الشديد أو المتفاقم وخطر الإصابة العصبية.'),
      ('LB73.2Y','congenital scoliosis','الجنف الخلقي','Congenital scoliosis from vertebral malformations (failure of formation, e.g. hemivertebra, or failure of segmentation) present at birth; risk of rapid progression warrants early monitoring, with growth-modulating or fusion surgery for progressive curves.','جنف خلقي ناجم عن تشوهات فقرية (فشل التشكّل كنصف الفقرة أو فشل التفلّق) موجود عند الولادة؛ خطر التفاقم السريع يستوجب مراقبة مبكرة، مع جراحة تعديل النمو أو الإيثاق للانحناءات المتفاقمة.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    // ── 2. link all to ORTHO department ───────────────────────────────────
    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'ORTHO' AND d."icdCode" = ANY($1)
       ON CONFLICT DO NOTHING`,
      [AddOrthoDiagnosesBatch21750000000073.CODES]
    );

    // ── 3. link to main_diags ─────────────────────────────────────────────
    await this.linkMain(queryRunner, "pathologic fractures", ["FB8Y", "FB83.1Z", "FB83.11"]);
    await this.linkMain(queryRunner, "rotator cuff pathology", ["FB53.0", "FB40.3"]);
    await this.linkMain(queryRunner, "spinal stenosis", ["FA80.1", "FA8Z", "8B42"]);
    await this.linkMain(queryRunner, "spondylolisthesis", ["FA84.0", "FA84.1", "FA81.0"]);
    await this.linkMain(queryRunner, "bone tumours", ["2B51.Z", "2B52.Z", "2B50.Z", "2F7B", "FB80.6", "FB80.5", "2A83.1", "2E83.Z"]);
    await this.linkMain(queryRunner, "foot & ankle disorders", ["FA30.0", "FA31.5", "NC96.02", "FB40.1", "FA31.7", "FA30.2", "8C11.6"]);
    await this.linkMain(queryRunner, "hand & wrist disorders", ["FB51.0", "FB42.2", "FB40.4", "FB40.5", "8C10.1", "FA30.Y"]);
    await this.linkMain(queryRunner, "paediatric & developmental conditions", ["LB74.0", "LB98.00", "FB82.2", "FB82.1", "FA70.1", "FA70.0", "LB73.2Y"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddOrthoDiagnosesBatch21750000000073.CODES;
    const shared = AddOrthoDiagnosesBatch21750000000073.SHARED;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1))`, [codes]);
    // delete only ORTHO-owned new rows; keep rows shared with other depts
    await queryRunner.query(`DELETE FROM "diagnoses" WHERE "icdCode" = ANY($1) AND NOT ("icdCode" = ANY($2))`, [codes, shared]);
    // remove the 4 new main_diags (now unlinked)
    for (const [title] of AddOrthoDiagnosesBatch21750000000073.NEW_MAIN_DIAGS) {
      await queryRunner.query(
        `DELETE FROM "main_diags" WHERE "title" = $1 AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'ORTHO')`,
        [title]
      );
    }
  }
}
