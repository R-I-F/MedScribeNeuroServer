import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * TRS coverage extension — diagnoses batch 2 of 3 (heart + lung + pancreas transplant
 * indications). Inserts 28 new diagnoses (5A11 type 2 diabetes already exists [GS] — ON
 * CONFLICT links only) and links them to TRS + their main_diags (heart transplant, lung
 * transplant, multi-organ transplant, transplant complications, pancreas transplant). All
 * ICD-11 codes verified via icd11_search (AUDIT_TRS.md 2D). Runs after MIG-D batch 1 (118).
 */
export class AddTrsDiagnosesBatch21750000000119 implements MigrationInterface {
  name = "AddTrsDiagnosesBatch21750000000119";

  private static readonly CODES = [
    // heart
    "BC43.0Z", "BA51.Z", "BC43.1Z", "BC43.2Z", "BC43.6", "BC42.Z", "LA8Z", "BC20.1", "BC44", "BC43.3",
    // lung
    "CA25.Z", "BB01.0", "CA24", "4B20.0", "CA70.Z", "BB01.0/LA8Z", "CB07.Z", "CA26.0", "CB03.Z",
    "BB01.3", "CA21.Z", "CB05.1", "BB00.1", "BB01.0/DB98.7Z",
    // pancreas
    "9B71.0Z", "8C03.0", "5A11", "DC32.Z",
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
      ('BC43.0Z','dilated cardiomyopathy','اعتلال عضلة القلب التوسّعي','Dilation and systolic dysfunction of the ventricles causing refractory heart failure; the commonest indication for heart transplantation.','توسّع البطينين وخلل انقباضي يسبب قصور قلب مُعَنّداً؛ أشيع دواعي زراعة القلب.'),
      ('BA51.Z','ischaemic cardiomyopathy','اعتلال عضلة القلب الإقفاري','End-stage heart failure from coronary artery disease and prior infarction; a leading transplant indication.','قصور قلب بالمرحلة النهائية ناجم عن داء الشرايين التاجية واحتشاء سابق؛ من أبرز دواعي الزراعة.'),
      ('BC43.1Z','hypertrophic cardiomyopathy','اعتلال عضلة القلب الضخامي','Genetic myocardial hypertrophy; end-stage burnt-out (hypokinetic) disease may require transplantation.','ضخامة عضلية قلبية وراثية؛ قد يستلزم المرض النهائي المنطفئ (ناقص الحركة) الزراعة.'),
      ('BC43.2Z','restrictive cardiomyopathy','اعتلال عضلة القلب التقييدي','Impaired ventricular filling from a stiff myocardium causing diastolic heart failure; a transplant indication.','اختلال امتلاء البطين بسبب عضلة قلبية متيبّسة يسبب قصور قلب انبساطياً؛ من دواعي الزراعة.'),
      ('BC43.6','arrhythmogenic ventricular cardiomyopathy','اعتلال عضلة القلب المُسبّب لاضطراب النظم','Fibrofatty replacement of the myocardium causing ventricular arrhythmias and heart failure; may require transplantation.','استبدال ليفي دهني للعضلة القلبية يسبب اضطرابات نظم بطينية وقصور قلب؛ قد يستلزم الزراعة.'),
      ('BC42.Z','myocarditis','التهاب عضلة القلب','Inflammation of the myocardium that may cause fulminant or chronic heart failure progressing to transplantation.','التهاب العضلة القلبية قد يسبب قصور قلب صاعقاً أو مزمناً يترقّى إلى الزراعة.'),
      ('LA8Z','congenital heart disease','عيب القلب الخلقي','Complex congenital cardiac malformations with end-stage failure after palliative surgery; an indication for heart transplantation.','تشوّهات قلبية خلقية معقّدة مع فشل بالمرحلة النهائية بعد جراحة تلطيفية؛ من دواعي زراعة القلب.'),
      ('BC20.1','rheumatic heart disease','مرض القلب الرثوي','Chronic rheumatic valvular disease causing end-stage heart failure when not amenable to valve surgery.','مرض صمامي رثوي مزمن يسبب قصور قلب بالمرحلة النهائية عند تعذّر جراحة الصمام.'),
      ('BC44','noncompaction cardiomyopathy','اعتلال عضلة القلب الإسفنجي (عدم الانضغاط)','Left-ventricular noncompaction causing heart failure, arrhythmia and thromboembolism; advanced cases require transplantation.','عدم انضغاط البطين الأيسر يسبب قصور قلب واضطراب نظم وانصمام خثاري؛ تستلزم الحالات المتقدّمة الزراعة.'),
      ('BC43.3','congenital cardiomyopathy (endocardial fibroelastosis)','اعتلال عضلة القلب الخلقي (التليّف المرن الشغافي)','Endocardial fibroelastosis and other congenital cardiomyopathies presenting with infantile heart failure; a paediatric transplant indication.','التليّف المرن الشغافي واعتلالات عضلة القلب الخلقية الأخرى تتظاهر بقصور قلب رضعي؛ من دواعي الزراعة لدى الأطفال.'),
      ('CA25.Z','cystic fibrosis','التليّف الكيسي','Inherited multisystem disease causing bronchiectasis and respiratory failure; a leading indication for bilateral lung transplantation.','مرض وراثي متعدد الأجهزة يسبب توسّع القصبات وفشلاً تنفسياً؛ من أبرز دواعي زراعة الرئتين الثنائية.'),
      ('BB01.0','pulmonary arterial hypertension','ارتفاع ضغط الشريان الرئوي','Progressive pulmonary vascular disease causing right heart failure; an indication for lung or heart-lung transplantation.','مرض وعائي رئوي مترقٍّ يسبب قصور القلب الأيمن؛ من دواعي زراعة الرئة أو القلب-الرئة.'),
      ('CA24','bronchiectasis','توسّع القصبات','Permanent bronchial dilatation with chronic infection and respiratory failure; severe non-CF disease may require lung transplantation.','توسّع قصبي دائم مع عدوى مزمنة وفشل تنفسي؛ قد يستلزم المرض الشديد غير المرتبط بالتليّف الكيسي زراعة الرئة.'),
      ('4B20.0','sarcoidosis of lung','الساركويد الرئوي','Granulomatous interstitial lung disease that can progress to pulmonary fibrosis and respiratory failure requiring transplantation.','مرض رئوي خلالي حُبيبي قد يترقّى إلى تليّف رئوي وفشل تنفسي يستلزم الزراعة.'),
      ('CA70.Z','hypersensitivity pneumonitis','الالتهاب الرئوي فرط التحسّسي','Immune-mediated interstitial lung disease from inhaled antigens progressing to fibrosis and end-stage respiratory failure.','مرض رئوي خلالي مناعي ناجم عن مستضدات مستنشقة يترقّى إلى تليّف وفشل تنفسي نهائي.'),
      ('BB01.0/LA8Z','Eisenmenger syndrome','متلازمة أيزنمنغر','Irreversible pulmonary hypertension and shunt reversal complicating congenital heart disease; an indication for heart-lung transplantation.','ارتفاع ضغط رئوي غير عكوس وانعكاس التحويلة يعقّد عيب القلب الخلقي؛ من دواعي زراعة القلب-الرئة.'),
      ('CB07.Z','lymphangioleiomyomatosis','الورام العضلي الأملس اللمفاوي','Cystic lung disease of women causing progressive airflow obstruction and respiratory failure; a lung transplant indication.','مرض رئوي كيسي يصيب النساء يسبب انسداداً هوائياً مترقّياً وفشلاً تنفسياً؛ من دواعي زراعة الرئة.'),
      ('CA26.0','chronic obliterative bronchiolitis','التهاب القصيبات السادّ المزمن','Small-airway fibrosis; as bronchiolitis obliterans syndrome it is the chief form of chronic lung-allograft rejection, and a re-transplant indication.','تليّف الطرق الهوائية الصغيرة؛ يمثّل بوصفه متلازمة التهاب القصيبات السادّ الشكل الرئيس للرفض المزمن للطعم الرئوي، ومن دواعي إعادة الزراعة.'),
      ('CB03.Z','idiopathic interstitial pneumonitis','الالتهاب الرئوي الخلالي مجهول السبب','Non-IPF idiopathic interstitial pneumonia (eg NSIP) progressing to fibrosis and respiratory failure requiring transplantation.','التهاب رئوي خلالي مجهول السبب من غير نمط التليّف الرئوي مجهول السبب (مثل NSIP) يترقّى إلى تليّف وفشل تنفسي يستلزم الزراعة.'),
      ('BB01.3','chronic thromboembolic pulmonary hypertension','ارتفاع ضغط الدم الرئوي الخثاري الصمي المزمن','Pulmonary hypertension from organised thromboemboli; inoperable disease may require lung transplantation.','ارتفاع ضغط رئوي ناجم عن صمات خثارية متنظّمة؛ قد يستلزم المرض غير القابل للجراحة زراعة الرئة.'),
      ('CA21.Z','pulmonary emphysema','النفاخ الرئوي','Destruction of alveolar walls (including alpha-1 antitrypsin related) causing airflow obstruction and respiratory failure; a transplant indication.','تخرّب الجدر السنخية (بما في ذلك المرتبط بعوز ألفا-1 أنتيتربسين) يسبب انسداداً هوائياً وفشلاً تنفسياً؛ من دواعي الزراعة.'),
      ('CB05.1','interstitial lung disease with connective tissue disease','مرض الرئة الخلالي المصاحب لمرض النسيج الضام','Interstitial fibrosis complicating connective-tissue disease (eg scleroderma) progressing to respiratory failure.','تليّف خلالي يعقّد مرض النسيج الضام (مثل تصلّب الجلد) يترقّى إلى فشل تنفسي.'),
      ('BB00.1','chronic pulmonary thromboembolism','الانصمام الخثاري الرئوي المزمن','Organised chronic pulmonary emboli causing vascular obstruction; may underlie chronic thromboembolic pulmonary hypertension.','صمات رئوية خثارية مزمنة متنظّمة تسبب انسداداً وعائياً؛ قد تكمن وراء ارتفاع ضغط الدم الرئوي الخثاري المزمن.'),
      ('BB01.0/DB98.7Z','portopulmonary hypertension','ارتفاع ضغط الدم الرئوي البابي','Pulmonary arterial hypertension complicating portal hypertension; affects candidacy for and timing of liver transplantation.','ارتفاع ضغط شرياني رئوي يعقّد ارتفاع ضغط الدم البابي؛ يؤثّر في أهلية وتوقيت زراعة الكبد.'),
      ('9B71.0Z','diabetic retinopathy','اعتلال الشبكية السكري','Microvascular retinal complication of diabetes; with nephropathy it supports simultaneous pancreas-kidney transplantation.','مضاعفة شبكية وعائية مجهرية للسكري؛ تدعم مع اعتلال الكلية الزراعة المتزامنة للبنكرياس والكلية.'),
      ('8C03.0','diabetic polyneuropathy','الاعتلال العصبي السكري المتعدّد','Distal symmetric peripheral neuropathy of diabetes; a marker of end-organ damage supporting pancreas transplantation.','اعتلال عصبي محيطي متناظر بعيد في السكري؛ مؤشّر على أذية الأعضاء الانتهائية يدعم زراعة البنكرياس.'),
      ('5A11','type 2 diabetes mellitus','داء السكري من النوع الثاني','Insulin-resistant diabetes; selected insulin-dependent cases with renal failure undergo pancreas-after-kidney or simultaneous transplantation.','سكري بمقاومة الإنسولين؛ تخضع حالات منتقاة معتمدة على الإنسولين مع فشل كلوي للزراعة المتزامنة أو البنكرياس بعد الكلية.'),
      ('DC32.Z','chronic pancreatitis','التهاب البنكرياس المزمن','Irreversible pancreatic inflammation with intractable pain; total pancreatectomy with islet autotransplantation is a surgical option.','التهاب بنكرياسي لا عكوس مع ألم مُعَنّد؛ الاستئصال الكلي للبنكرياس مع زرع الجزر الذاتي خيار جراحي.')
      ON CONFLICT ("icdCode") DO NOTHING
    `);

    await queryRunner.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'TRS' AND d."icdCode" = ANY($1) ON CONFLICT DO NOTHING`,
      [AddTrsDiagnosesBatch21750000000119.CODES]);

    const heart = ["BC43.0Z", "BA51.Z", "BC43.1Z", "BC43.2Z", "BC43.6", "BC42.Z", "LA8Z", "BC20.1", "BC44", "BC43.3"];
    const lung = ["CA25.Z", "BB01.0", "CA24", "4B20.0", "CA70.Z", "BB01.0/LA8Z", "CB07.Z", "CA26.0", "CB03.Z",
      "BB01.3", "CA21.Z", "CB05.1", "BB00.1", "BB01.0/DB98.7Z"];
    const pancreas = ["9B71.0Z", "8C03.0", "5A11", "DC32.Z"];

    await this.linkMain(queryRunner, "heart transplant", heart);
    await this.linkMain(queryRunner, "lung transplant", lung);
    await this.linkMain(queryRunner, "pancreas transplant", pancreas);
    // Eisenmenger & portopulmonary HTN also belong to combined heart-lung / liver-lung listings
    await this.linkMain(queryRunner, "multi-organ transplant", ["BB01.0/LA8Z", "BB01.0/DB98.7Z"]);
    // bronchiolitis obliterans = chronic lung-allograft rejection (a complication)
    await this.linkMain(queryRunner, "transplant complications", ["CA26.0"]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const codes = AddTrsDiagnosesBatch21750000000119.CODES;
    await queryRunner.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id WHERE dept.code = 'TRS')`, [codes]);
    await queryRunner.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" IN (SELECT id FROM "diagnoses" WHERE "icdCode" = ANY($1)) AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'TRS')`, [codes]);
    await queryRunner.query(`DELETE FROM "diagnoses" d WHERE d."icdCode" = ANY($1) AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = d.id)`, [codes]);
  }
}
