import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * MFS coverage extension — batch 2 of 2 (categories 7-12: jaw cysts & pathology, jaw
 * fractures, oral cancer, orthognathic surgery, salivary gland pathology, TMJ disorders).
 * Inserts 36 new diagnoses and links 39 additions (incl. shared ORTHO MRONJ and SOC
 * lip/tongue-SCC rows) to MFS + their main_diags. Codes verified via icd11_search.
 * Runs after MIG-A (111).
 */
export class AddMfsDiagnosesBatch21750000000113 implements MigrationInterface {
  name = "AddMfsDiagnosesBatch21750000000113";

  private static readonly CODES = [
    // jaw cysts & pathology
    "DA06.0", "FB81.5", "FB81.2", "LD24.22",
    // jaw fractures
    "NA02.40", "NA02.41", "NA02.42", "NA02.70", "NA02.73", "NA02.74", "NA02.75", "NA02.76",
    // oral cancer
    "2B63.0", "2B64.0", "2B65.1", "2B65.0", "2B61.Z", "2E60.0", "2B62.0", "2B60.1",
    // orthognathic surgery
    "DA0E.1", "DA0E.00", "DA0E.5Z", "DA0E.6", "LA52", "LD2F.16",
    // salivary gland pathology
    "DA04.4", "DA04.2", "DA04.5", "DA04.0", "DA04.1", "DA04.Y", "2B67.Z", "2B67.0", "2E91.Z",
    // temporomandibular joint disorders
    "NA03.0", "FA34.2&XA2SM2", "FA34.4&XA2SM2", "DA0E.7",
  ];

  private async linkMain(r: QueryRunner, mainDiag: string, codes: string[]): Promise<void> {
    await r.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d
       WHERE dept.code = 'MFS' AND md.title = $1 AND d."icdCode" = ANY($2) ON CONFLICT DO NOTHING`, [mainDiag, codes]);
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription") VALUES
      ('DA06.0','osteomyelitis of jaw','التهاب العظم والنقي في الفك','Infective inflammation of the jaw bone (commonly mandible) with sequestrum formation; treated by debridement/sequestrectomy and antibiotics.','التهاب عظمي نقوي إنتاني في عظم الفك (غالباً الفك السفلي) مع تشكّل عظم مُتنخّر؛ يُعالَج بالتنضير/استئصال العظم المتنخّر والصادات.'),
      ('FB81.5','osteoradionecrosis of jaw','النخر العظمي الإشعاعي للفك','Non-healing exposed irradiated jaw bone after head-and-neck radiotherapy; managed by debridement, hyperbaric oxygen or resection/reconstruction.','عظم فك مُشَعّ مكشوف لا يلتئم بعد المعالجة الإشعاعية للرأس والعنق؛ يُدار بالتنضير والأكسجين عالي الضغط أو الاستئصال/إعادة البناء.'),
      ('LD24.22','cherubism','داء الوُجنة الملائكية (الكروبية)','Familial bilateral fibro-osseous expansion of the jaws in children causing cherubic facies; contoured surgically after stabilisation.','توسّع ليفي عظمي ثنائي عائلي للفكين عند الأطفال يسبب مظهر الوجه الملائكي؛ يُنحَت جراحياً بعد الاستقرار.'),
      ('NA02.40','Le Fort I fracture','كسر لوفور من النوع الأول','Horizontal maxillary fracture separating the alveolus/palate from the upper midface; reduced and plated.','كسر فكي علوي أفقي يفصل الحويصلة/الحنك عن منتصف الوجه العلوي؛ يُرَدّ ويُثبَّت بالصفائح.'),
      ('NA02.41','Le Fort II fracture','كسر لوفور من النوع الثاني','Pyramidal midface fracture through the nasofrontal region and maxilla; reduced and rigidly fixed.','كسر هرمي لمنتصف الوجه عبر المنطقة الأنفية الجبهية والفك العلوي؛ يُرَدّ ويُثبَّت بإحكام.'),
      ('NA02.42','Le Fort III fracture','كسر لوفور من النوع الثالث','Craniofacial disjunction separating the midface from the skull base; treated by reconstruction of facial buttresses.','انفصال قحفي وجهي يفصل منتصف الوجه عن قاعدة الجمجمة؛ يُعالَج بإعادة بناء الدعامات الوجهية.'),
      ('NA02.70','fracture of condylar process of mandible','كسر الناتئ اللقمي للفك السفلي','Fracture of the mandibular condyle, the commonest mandibular fracture site; managed by IMF or open reduction.','كسر لقمة الفك السفلي، أشيع موقع لكسور الفك السفلي؛ يُدار بالتثبيت بين الفكين أو الرد المفتوح.'),
      ('NA02.73','fracture of ramus of mandible','كسر فرع الفك السفلي','Fracture of the mandibular ramus; reduced and internally fixed.','كسر فرع الفك السفلي؛ يُرَدّ ويُثبَّت داخلياً.'),
      ('NA02.74','fracture of angle of mandible','كسر زاوية الفك السفلي','Fracture at the mandibular angle, often associated with the third molar; plated via intraoral approach.','كسر في زاوية الفك السفلي، يرتبط غالباً بالرحى الثالثة؛ يُثبَّت بالصفائح عبر مدخل داخل الفم.'),
      ('NA02.75','fracture of alveolar margin of mandible','كسر الحافة السنخية للفك السفلي','Dentoalveolar fracture of the mandibular alveolar ridge; reduced and splinted.','كسر سنّي سنخي للحَرف السنخي في الفك السفلي؛ يُرَدّ ويُجبَّر.'),
      ('NA02.76','fracture of symphysis of mandible','كسر ارتفاق الفك السفلي','Fracture at the mandibular symphysis/parasymphysis; rigidly fixed with plates.','كسر في ارتفاق/جانب ارتفاق الفك السفلي؛ يُثبَّت بإحكام بالصفائح.'),
      ('2B63.0','squamous cell carcinoma of gum','سرطانة الخلايا الحرشفية للثة','Gingival/alveolar squamous cell carcinoma, frequently invading underlying bone; treated by resection with marginal/segmental mandibulectomy.','سرطانة حرشفية لثوية/سنخية، تغزو غالباً العظم الكامن؛ تُعالَج بالاستئصال مع قطع هامشي/قطعي للفك السفلي.'),
      ('2B64.0','squamous cell carcinoma of floor of mouth','سرطانة الخلايا الحرشفية لأرضية الفم','Floor-of-mouth squamous cell carcinoma; treated by wide resection with neck dissection and reconstruction.','سرطانة حرشفية في أرضية الفم؛ تُعالَج باستئصال واسع مع تجريف العنق والترميم.'),
      ('2B65.1','squamous cell carcinoma of palate','سرطانة الخلايا الحرشفية للحنك','Squamous cell carcinoma of the hard/soft palate; resected with maxillectomy and prosthetic/flap reconstruction.','سرطانة حرشفية للحنك الصلب/الرخو؛ تُستأصل مع قطع الفك العلوي وترميم تعويضي/بشريحة.'),
      ('2B65.0','adenocarcinoma of palate','السرطانة الغدية للحنك','Minor-salivary-gland-type adenocarcinoma of the palate; treated by wide local resection.','سرطانة غدية من نوع الغدد اللعابية الصغرى في الحنك؛ تُعالَج باستئصال موضعي واسع.'),
      ('2B61.Z','carcinoma of base of tongue','سرطانة قاعدة اللسان','Malignancy of the tongue base (oropharynx), often HPV-related; treated by chemoradiotherapy or transoral resection.','ورم خبيث في قاعدة اللسان (البلعوم الفموي)، غالباً مرتبط بفيروس الورم الحليمي؛ يُعالَج بالعلاج الكيميائي الإشعاعي أو الاستئصال عبر الفم.'),
      ('2E60.0','carcinoma in situ of oral cavity','سرطانة لابدة في التجويف الفموي','High-grade dysplasia/carcinoma in situ of the oral mucosa; treated by complete excision with surveillance.','خلل تنسّج شديد/سرطانة لابدة في الغشاء المخاطي الفموي؛ تُعالَج بالاستئصال الكامل مع المراقبة.'),
      ('DA0E.1','prognathism or retrognathism','تقدّم أو تراجع الفك','Sagittal jaw-cranial base discrepancy (maxillary/mandibular prognathism or retrognathism) causing malocclusion/facial imbalance; corrected by orthognathic surgery.','تفاوت سهمي بين الفك وقاعدة الجمجمة (تقدّم أو تراجع الفك العلوي/السفلي) يسبب سوء الإطباق/عدم توازن الوجه؛ يُصحَّح بجراحة تقويم الفكين.'),
      ('DA0E.00','micrognathia','صغر الفك','Congenital or acquired underdevelopment of the jaw (usually mandible); corrected by distraction osteogenesis or advancement.','نقص نمو الفك خلقي أو مكتسب (عادةً الفك السفلي)؛ يُصحَّح بتوليد العظم بالتشتيت أو التقديم.'),
      ('DA0E.5Z','malocclusion','سوء الإطباق','Abnormal dental occlusion (Class II/III, open/cross bite) with skeletal component; treated by combined orthodontic-orthognathic management.','إطباق سنّي شاذ (الصنف الثاني/الثالث، العضّة المفتوحة/المتصالبة) مع مكوّن هيكلي؛ يُعالَج بإدارة تقويمية جراحية مشتركة.'),
      ('DA0E.6','dentofacial functional abnormality','شذوذ وظيفي سنّي وجهي','Functional dentofacial abnormality (eg from abnormal swallowing/mouth breathing) contributing to malocclusion; addressed in orthognathic planning.','شذوذ وظيفي سنّي وجهي (مثلاً من البلع الشاذ/التنفّس الفموي) يساهم في سوء الإطباق؛ يُعالَج ضمن تخطيط تقويم الفكين.'),
      ('LA52','facial asymmetry','عدم تناظر الوجه','Developmental or acquired facial asymmetry (eg condylar pathology, hemifacial conditions); corrected by orthognathic/contouring surgery.','عدم تناظر وجهي تطوري أو مكتسب (مثل أمراض اللقمة، الحالات نصفية الوجه)؛ يُصحَّح بجراحة تقويم الفكين/تحديد الملامح.'),
      ('LD2F.16','hemifacial microsomia','صغر نصف الوجه','Congenital underdevelopment of one side of the face (ear, mandible, soft tissue); reconstructed by staged craniofacial/orthognathic surgery.','نقص نمو خلقي في أحد جانبي الوجه (الأذن، الفك السفلي، النسيج الرخو)؛ يُرمَّم بجراحة قحفية وجهية/تقويمية مرحلية.'),
      ('DA04.4','sialolithiasis','حصيات الغدد اللعابية','Salivary gland/duct stone (commonly submandibular) causing obstructive swelling; removed by sialolithotomy or sialendoscopy.','حصاة في الغدة/القناة اللعابية (غالباً تحت الفك) تسبب تورّماً انسدادياً؛ تُزال بشقّ الحصاة أو تنظير اللعاب.'),
      ('DA04.2','sialadenitis','التهاب الغدة اللعابية','Acute or chronic inflammation of a salivary gland; managed medically or by gland excision for recurrent disease.','التهاب حاد أو مزمن في الغدة اللعابية؛ يُدار طبياً أو باستئصال الغدة في المرض المتكرر.'),
      ('DA04.5','mucocele or ranula','القيلة المخاطية أو الضفدعية','Mucous extravasation cyst of a minor salivary gland (mucocele) or sublingual gland (ranula); excised with the feeding gland.','كيسة ارتشاح مخاطي لغدة لعابية صغرى (قيلة مخاطية) أو الغدة تحت اللسان (قيلة ضفدعية)؛ تُستأصل مع الغدة المغذّية.'),
      ('DA04.0','atrophy of salivary gland','ضمور الغدة اللعابية','Atrophy of a salivary gland (eg post-obstruction/radiation) causing xerostomia; relevant to salivary surgery planning.','ضمور الغدة اللعابية (مثلاً بعد الانسداد/الإشعاع) مسبباً جفاف الفم؛ مهم في تخطيط جراحة اللعاب.'),
      ('DA04.1','hypertrophy of salivary gland','تضخّم الغدة اللعابية','Non-neoplastic enlargement of a salivary gland (sialadenosis); evaluated to exclude tumour.','تضخّم غير ورمي في الغدة اللعابية (داء الغدة اللعابية)؛ يُقيَّم لاستبعاد الورم.'),
      ('DA04.Y','fistula of salivary gland','ناسور الغدة اللعابية','Salivary fistula (eg post-parotidectomy or traumatic) with persistent salivary leak; managed by conservative or surgical measures.','ناسور لعابي (مثلاً بعد استئصال النكفية أو رضحي) مع تسرّب لعابي مستمر؛ يُدار بتدابير تحفظية أو جراحية.'),
      ('2B67.Z','malignant neoplasm of parotid gland','ورم خبيث في الغدة النكفية','Parotid gland carcinoma; treated by parotidectomy with facial-nerve preservation and neck dissection as indicated.','سرطانة الغدة النكفية؛ تُعالَج باستئصال النكفية مع الحفاظ على العصب الوجهي وتجريف العنق حسب الاستطباب.'),
      ('2B67.0','adenocarcinoma of parotid gland','السرطانة الغدية للغدة النكفية','Adenocarcinoma (incl. salivary-gland types) of the parotid; resected by parotidectomy.','سرطانة غدية (تشمل أنماط الغدد اللعابية) في الغدة النكفية؛ تُستأصل باستئصال النكفية.'),
      ('2E91.Z','Warthin tumour (adenolymphoma)','ورم وارثين (الورم الغدي اللمفي)','Benign cystic papillary salivary tumour, typically of the parotid in older smokers; excised by partial parotidectomy.','ورم لعابي حليمي كيسي حميد، عادةً في النكفية لدى المدخّنين كبار السن؛ يُستأصل باستئصال نكفية جزئي.'),
      ('NA03.0','dislocation of temporomandibular joint','خلع المفصل الصدغي الفكي','Anterior dislocation of the mandibular condyle with locked open mouth; reduced manually, recurrent cases treated surgically.','خلع أمامي للقمة الفك السفلي مع انغلاق الفم مفتوحاً؛ يُرَدّ يدوياً، وتُعالَج الحالات المتكررة جراحياً.'),
      ('FA34.2&XA2SM2','recurrent dislocation of temporomandibular joint','الخلع المتكرر للمفصل الصدغي الفكي','Habitual/recurrent TMJ dislocation from joint hypermobility; treated by eminectomy or capsular procedures.','خلع متكرر/معتاد للمفصل الصدغي الفكي بسبب فرط حركة المفصل؛ يُعالَج باستئصال الحدبة أو إجراءات المحفظة.'),
      ('FA34.4&XA2SM2','ankylosis of temporomandibular joint','قَسَط (التحام) المفصل الصدغي الفكي','Fibrous or bony fusion of the TMJ limiting mouth opening (trismus); treated by gap/interpositional arthroplasty.','التحام ليفي أو عظمي للمفصل الصدغي الفكي يحدّ من فتح الفم (الضزز)؛ يُعالَج برأب المفصل بالفجوة/الإقحام.'),
      ('DA0E.7','dentofacial parafunctional disorder','اضطراب وظيفي مرافق سنّي وجهي','Parafunctional habits (bracing/thrusting/bruxism) contributing to TMJ dysfunction and occlusal wear; managed conservatively.','عادات وظيفية مرافقة (شدّ/دفع الفك/صرير الأسنان) تساهم في خلل المفصل الصدغي الفكي وتآكل الإطباق؛ تُدار بالتحفظ.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'MFS' AND d."icdCode" = ANY($1) ON CONFLICT DO NOTHING`,
      [AddMfsDiagnosesBatch21750000000113.CODES]);

    await this.linkMain(queryRunner, "jaw cysts & pathology", ["DA06.0", "FB81.5", "FB81.2", "LD24.22"]);
    await this.linkMain(queryRunner, "jaw fractures", ["NA02.40", "NA02.41", "NA02.42", "NA02.70", "NA02.73", "NA02.74", "NA02.75", "NA02.76"]);
    await this.linkMain(queryRunner, "oral cancer", ["2B63.0", "2B64.0", "2B65.1", "2B65.0", "2B61.Z", "2E60.0", "2B62.0", "2B60.1"]);
    await this.linkMain(queryRunner, "orthognathic surgery", ["DA0E.1", "DA0E.00", "DA0E.5Z", "DA0E.6", "LA52", "LD2F.16"]);
    await this.linkMain(queryRunner, "salivary gland pathology", ["DA04.4", "DA04.2", "DA04.5", "DA04.0", "DA04.1", "DA04.Y", "2B67.Z", "2B67.0", "2E91.Z"]);
    await this.linkMain(queryRunner, "temporomandibular joint disorders", ["NA03.0", "FA34.2&XA2SM2", "FA34.4&XA2SM2", "DA0E.7"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddMfsDiagnosesBatch21750000000113.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id WHERE dept.code = 'MFS')`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'MFS')`, [codes]);
    await queryRunner.query(`DELETE FROM "diagnoses" d WHERE d."icdCode" = ANY($1) AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = d.id)`, [codes]);
  }
}
