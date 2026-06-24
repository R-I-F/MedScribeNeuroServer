import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * MFS coverage extension — batch 1 of 2 (categories 1-6: benign oral tumors, cleft lip &
 * palate, dental implants, dentoalveolar surgery, facial trauma, impacted teeth).
 * Inserts 37 new diagnoses and links 40 additions (incl. shared PRS cleft-subtype rows) to
 * MFS + their main_diags. All ICD-11 codes verified via icd11_search (see AUDIT_MFS.md "2D").
 * Runs after MIG-A (111).
 */
export class AddMfsDiagnosesBatch11750000000112 implements MigrationInterface {
  name = "AddMfsDiagnosesBatch11750000000112";

  private static readonly CODES = [
    // benign oral tumors
    "DA05.1", "DA06.2", "DA01.00", "FB80.0", "DA01.15",
    // cleft lip & palate
    "LA40.0", "LA40.1", "LA42.0", "LA42.1", "LA4Z", "LA51", "LA56",
    // dental implants
    "DA0A.2", "DA0D.Y", "LA30.0", "LA30.1",
    // dentoalveolar surgery
    "DA08.0", "DA08.3", "DA09.0", "DA09.4", "DA09.70", "DA09.71", "DA0C.4", "DA0C.0", "DA0C.Y", "DA0B.6", "DA0B.Y", "DA06.1", "CA0A.Y&XA1R64", "DA0D.5",
    // facial trauma
    "NA02.2Y", "NA02.2Z", "NA02.20", "NA0D.02", "NA0D.03", "NA0D.06", "NA0D.13", "NA0D.15", "NA0D.1Z",
    // impacted teeth
    "DA07.6Y", "DA07.61",
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
      ('DA05.1','developmental nonodontogenic cyst of oral region','كيسة تطورية غير سنّية المنشأ في المنطقة الفموية','Fissural developmental cyst of the jaws (eg nasopalatine duct cyst) not derived from tooth-forming tissue; enucleated when symptomatic.','كيسة تطورية شِقّية في الفكين (مثل كيسة القناة الأنفية الحنكية) لا تنشأ من نسيج تكوين الأسنان؛ تُجتثّ عند ظهور الأعراض.'),
      ('DA06.2','torus or exostosis of jaw','ناتئ عظمي في الفك (حنكي/فكي سفلي)','Benign bony outgrowth of the palate (torus palatinus) or lingual mandible (torus mandibularis); removed if interfering with a denture.','نمو عظمي حميد في الحنك (الناتئ الحنكي) أو الفك السفلي اللساني (الناتئ الفكي)؛ يُزال إذا أعاق تركيب الطقم.'),
      ('DA01.00','oral leukoplakia','الطُّلاوة الفموية','A white mucosal patch that cannot be rubbed off, a potentially malignant disorder; biopsied and excised/monitored for dysplasia.','لطخة بيضاء على الغشاء المخاطي لا تُزال بالفرك، اضطراب محتمل الخباثة؛ تُؤخذ خزعة وتُستأصل/تُراقب لخلل التنسّج.'),
      ('FB80.0','fibrous dysplasia of jaw','خلل التنسّج الليفي للفك','Replacement of jaw bone by fibro-osseous tissue causing painless facial swelling/asymmetry; contoured surgically when deforming.','استبدال عظم الفك بنسيج ليفي عظمي مسبباً تورّماً/عدم تناظر وجهي غير مؤلم؛ يُنحَت جراحياً عند التشوّه.'),
      ('DA01.15','recurrent aphthous stomatitis','التهاب الفم القلاعي الناكس','Recurrent painful oral mucosal ulcers (aphthae); managed symptomatically, surgical relevance for differential of persistent ulcers.','قرحات فموية مخاطية مؤلمة متكررة (قلاع)؛ تُدار عَرَضياً، وأهميتها الجراحية في التشخيص التفريقي للقرحات المستمرة.'),
      ('LA4Z','cleft of lip, alveolus and palate','شق الشفة والحويصلة والحنك','Combined cleft involving lip, alveolus and palate requiring staged lip and palate repair and alveolar bone grafting.','شق مشترك يشمل الشفة والحويصلة والحنك يتطلب إصلاحاً مرحلياً للشفة والحنك وترقيع العظم السنخي.'),
      ('LA51','facial cleft','الشق الوجهي','Rare craniofacial (Tessier) cleft beyond the typical lip/palate clefts; reconstructed by craniofacial surgery.','شق قحفي وجهي نادر (تيسييه) خارج شقوق الشفة/الحنك النموذجية؛ يُرمَّم بجراحة قحفية وجهية.'),
      ('LA56','Pierre Robin sequence','تسلسل بيير روبان','Triad of micrognathia, glossoptosis and airway obstruction often with cleft palate; managed by airway support and mandibular distraction.','ثلاثي صغر الفك وتراجع اللسان وانسداد المجرى الهوائي وغالباً مع شق الحنك؛ يُدار بدعم المجرى الهوائي وتشتيت الفك السفلي.'),
      ('DA0A.2','atrophy of edentulous alveolar ridge','ضمور الحَرف السنخي عديم الأسنان','Resorption of the alveolar bone after tooth loss reducing ridge height/width; reconstructed by grafting prior to implants.','امتصاص العظم السنخي بعد فقد الأسنان مع نقص ارتفاع/عرض الحَرف؛ يُعاد بناؤه بالترقيع قبل الزرع.'),
      ('DA0D.Y','disorder of edentulous alveolar ridge','اضطراب الحَرف السنخي عديم الأسنان','Flabby or irregular edentulous ridge (eg fibrous hyperplasia) impairing prosthesis fit; corrected by pre-prosthetic surgery.','حَرف سنخي رخو أو غير منتظم (مثل الفرط التنسّجي الليفي) يعيق تركيب التعويض؛ يُصحَّح بجراحة ما قبل التعويض.'),
      ('LA30.0','anodontia','انعدام الأسنان','Congenital complete absence of teeth (severe oligodontia variant); managed with implant-supported prosthetic rehabilitation.','الغياب الخلقي الكامل للأسنان (نمط شديد من قلة الأسنان)؛ يُدار بإعادة تأهيل تعويضي مدعوم بالزرعات.'),
      ('LA30.1','hypodontia','نقص الأسنان','Congenital absence of one or a few teeth, the commonest dental anomaly; gaps restored by implants or orthodontics.','الغياب الخلقي لسن واحد أو عدد قليل من الأسنان، أشيع شذوذ سنّي؛ تُعوَّض الفجوات بالزرعات أو التقويم.'),
      ('DA08.0','dental caries','تسوّس الأسنان','Bacterial demineralisation of tooth structure; advanced caries necessitating extraction or surgical management of sequelae.','إزالة معدنية جرثومية لبنية السن؛ التسوّس المتقدم يستلزم القلع أو المعالجة الجراحية للمضاعفات.'),
      ('DA08.3','nontraumatic fracture of tooth','الكسر غير الرضحي للسن','Pathological (eg cracked tooth, vertical root fracture) tooth fracture without trauma; often requires extraction.','كسر سن مرضي (مثل السن المتشقق أو كسر الجذر العمودي) دون رضّ؛ غالباً يتطلب القلع.'),
      ('DA09.0','pulpitis','التهاب لُبّ السن','Inflammation of the dental pulp (reversible/irreversible) from caries; treated by endodontics or extraction.','التهاب لُبّ السن (قابل/غير قابل للعكس) ناجم عن التسوّس؛ يُعالَج بمعالجة لبّية أو قلع.'),
      ('DA09.4','pulp degeneration','تنكّس لُبّ السن','Degenerative pulp change (eg pulp calcification/necrosis) complicating endodontic or surgical management.','تغيّر تنكّسي في لُبّ السن (مثل التكلّس/النخر اللبّي) يعقّد المعالجة اللبّية أو الجراحية.'),
      ('DA09.70','acute apical periodontitis of pulpal origin','التهاب دواعم السن القمي الحاد ذو المنشأ اللبّي','Acute periradicular inflammation from an infected pulp causing pain on biting; managed by drainage/endodontics or extraction.','التهاب حاد حول الجذر ناجم عن لُبّ مُلتهب يسبب ألماً عند العض؛ يُدار بالتصريف/المعالجة اللبّية أو القلع.'),
      ('DA09.71','chronic apical periodontitis','التهاب دواعم السن القمي المزمن','Chronic periapical inflammation/granuloma at the root apex; treated by endodontic surgery (apicectomy) or extraction.','التهاب/ورم حُبيبي مزمن حول قمة الجذر؛ يُعالَج بجراحة لبّية (قطع الذروة) أو القلع.'),
      ('DA0C.4','periodontal abscess','خراج دواعم السن','Localised purulent infection of the periodontal tissues; drained and managed by debridement or extraction.','عدوى قيحية موضعية في أنسجة دواعم السن؛ تُصرَّف وتُدار بالتنضير أو القلع.'),
      ('DA0C.0','acute periodontitis','التهاب دواعم السن الحاد','Acute inflammation of the tooth-supporting tissues with attachment loss; managed by debridement and supportive surgery.','التهاب حاد للأنسجة الداعمة للسن مع فقد الارتباط؛ يُدار بالتنضير والجراحة الداعمة.'),
      ('DA0C.Y','chronic periodontitis','التهاب دواعم السن المزمن','Chronic destructive periodontal disease causing bone loss and tooth mobility; treated by periodontal/regenerative surgery.','مرض دواعم سن مدمّر مزمن يسبب فقد العظم وحركة الأسنان؛ يُعالَج بجراحة دواعم السن/إعادة التوليد.'),
      ('DA0B.6','pericoronitis','التهاب ما حول التاج','Inflammation of soft tissue over a partially erupted tooth (commonly lower third molar); treated by irrigation or operculectomy/extraction.','التهاب النسيج الرخو فوق سن بازغ جزئياً (غالباً الرحى الثالثة السفلية)؛ يُعالَج بالغسل أو استئصال الغطاء/القلع.'),
      ('DA0B.Y','gingivitis','التهاب اللثة','Plaque-induced gingival inflammation; reversible with hygiene, relevant pre-operatively to oral surgery.','التهاب لثة ناجم عن اللويحة؛ قابل للعكس بالعناية، ومهم قبل الجراحة الفموية.'),
      ('DA06.1','alveolar osteitis (dry socket)','التهاب العظم السنخي (السنخ الجاف)','Painful loss of the blood clot from an extraction socket with exposed bone; managed by dressing and irrigation.','فقد مؤلم للخثرة الدموية من سنخ القلع مع انكشاف العظم؛ يُدار بالضماد والغسل.'),
      ('CA0A.Y&XA1R64','oroantral fistula','الناسور الفموي الجيبي (الفكي العلوي)','Abnormal communication between the mouth and maxillary sinus, usually after upper molar extraction; closed by a local flap.','اتصال شاذ بين الفم والجيب الفكي العلوي، عادةً بعد قلع رحى علوية؛ يُغلَق بشريحة موضعية.'),
      ('DA0D.5','gingival ulceration','تقرّح اللثة','Ulcerative lesion of the gingiva requiring biopsy to exclude malignancy and surgical management.','آفة تقرّحية في اللثة تتطلب خزعة لاستبعاد الخباثة والمعالجة الجراحية.'),
      ('NA02.2Y','orbital wall fracture','كسر جدار الحجاج','Fracture of the medial or lateral orbital wall, often with the floor; repaired by orbital reconstruction.','كسر الجدار الإنسي أو الوحشي للحجاج، غالباً مع القاع؛ يُصلَح بإعادة بناء الحجاج.'),
      ('NA02.2Z','orbital fracture, unspecified','كسر الحجاج غير المحدد','Orbital bony fracture of unspecified wall; assessed for enophthalmos/diplopia and reconstructed as needed.','كسر عظمي للحجاج غير محدد الجدار؛ يُقيَّم لغؤور العين/الشفع ويُعاد بناؤه عند اللزوم.'),
      ('NA02.20','orbital roof fracture','كسر سقف الحجاج','Fracture of the orbital roof (frontal bone), risking dural injury/CSF leak; managed with neurosurgical input.','كسر سقف الحجاج (العظم الجبهي) مع خطر إصابة الأم الجافية/تسرب السائل الدماغي الشوكي؛ يُدار بمشاركة جراحة الأعصاب.'),
      ('NA0D.02','fracture of tooth (enamel-dentin)','كسر السن (المينائي العاجي)','Traumatic crown fracture through enamel and dentine without pulp exposure; restored or extracted by extent.','كسر تاجي رضحي عبر المينا والعاج دون انكشاف اللب؛ يُرمَّم أو يُقلَع حسب الامتداد.'),
      ('NA0D.03','complicated crown fracture','كسر تاج السن المعقّد','Traumatic crown fracture with pulp exposure requiring endodontic treatment or extraction.','كسر تاجي رضحي مع انكشاف اللب يتطلب معالجة لبّية أو قلعاً.'),
      ('NA0D.06','root fracture','كسر جذر السن','Traumatic fracture of the tooth root; managed by splinting or extraction depending on level.','كسر رضحي لجذر السن؛ يُدار بالتجبير أو القلع حسب المستوى.'),
      ('NA0D.13','lateral luxation of tooth','الخلع الجانبي للسن','Traumatic lateral displacement of a tooth with alveolar wall fracture; repositioned and splinted.','إزاحة جانبية رضحية للسن مع كسر الجدار السنخي؛ يُعاد التموضع ويُجبَّر.'),
      ('NA0D.15','avulsion of tooth','قلع السن الرضحي (الانخلاع)','Complete traumatic displacement of a tooth out of its socket; treated by replantation and splinting.','إزاحة رضحية كاملة للسن خارج سنخه؛ يُعالَج بإعادة الزرع والتجبير.'),
      ('NA0D.1Z','injury of periodontal tissues','إصابة أنسجة دواعم السن','Traumatic injury of the periodontal ligament/supporting tissues (concussion/subluxation); managed conservatively or by splinting.','إصابة رضحية لرباط دواعم السن/الأنسجة الداعمة (ارتجاج/خلع جزئي)؛ تُدار بالتحفظ أو التجبير.'),
      ('DA07.6Y','disturbance in tooth eruption','اضطراب بزوغ الأسنان','Failure or delay of tooth eruption (eg primary failure of eruption); managed by surgical exposure or extraction.','فشل أو تأخّر بزوغ الأسنان (مثل الفشل الأولي للبزوغ)؛ يُدار بالكشف الجراحي أو القلع.'),
      ('DA07.61','ankylosis of teeth','التحام السن بالعظم','Fusion of tooth root to alveolar bone preventing eruption/movement; surgically removed when problematic.','التحام جذر السن بالعظم السنخي يمنع البزوغ/الحركة؛ يُزال جراحياً عند التسبّب بمشكلة.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'MFS' AND d."icdCode" = ANY($1) ON CONFLICT DO NOTHING`,
      [AddMfsDiagnosesBatch11750000000112.CODES]);

    await this.linkMain(queryRunner, "benign oral tumors", ["DA05.1", "DA06.2", "DA01.00", "FB80.0", "DA01.15"]);
    await this.linkMain(queryRunner, "cleft lip & palate", ["LA40.0", "LA40.1", "LA42.0", "LA42.1", "LA4Z", "LA51", "LA56"]);
    await this.linkMain(queryRunner, "dental implants", ["DA0A.2", "DA0D.Y", "LA30.0", "LA30.1"]);
    await this.linkMain(queryRunner, "dentoalveolar surgery", ["DA08.0", "DA08.3", "DA09.0", "DA09.4", "DA09.70", "DA09.71", "DA0C.4", "DA0C.0", "DA0C.Y", "DA0B.6", "DA0B.Y", "DA06.1", "CA0A.Y&XA1R64", "DA0D.5"]);
    await this.linkMain(queryRunner, "facial trauma", ["NA02.2Y", "NA02.2Z", "NA02.20", "NA0D.02", "NA0D.03", "NA0D.06", "NA0D.13", "NA0D.15", "NA0D.1Z"]);
    await this.linkMain(queryRunner, "impacted teeth", ["DA07.6Y", "DA07.61", "LA30.0", "LA30.1"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddMfsDiagnosesBatch11750000000112.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id WHERE dept.code = 'MFS')`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'MFS')`, [codes]);
    await queryRunner.query(`DELETE FROM "diagnoses" d WHERE d."icdCode" = ANY($1) AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = d.id)`, [codes]);
  }
}
