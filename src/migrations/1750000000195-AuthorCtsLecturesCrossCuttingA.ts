import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * CTS academic lectures — ISCP Cardiothoracic Surgery Curriculum (Aug 2021), Appendix 2.
 * Part 5 (Cross-cutting A): topics 17–18 (Transplantation and Surgery for Heart Failure,
 * Congenital Heart Disease). Topics created in migration 191.
 * section 1 = KNOWLEDGE/CLINICAL, section 2 = TECHNICAL/OPERATIVE. `level` = NULL (MSc/MD sourced
 * later). Faithful transcription; the CHD knowledge conditions list is transcribed verbatim (two
 * exact echoes — a repeated "norwood procedure" and "single ventricle" — deduped); the operative
 * sub-headers ("surgical management of the following … conditions") are dropped and their listed
 * conditions kept as section-2 operative items; per-item competence rating numbers stripped.
 */
export class AuthorCtsLecturesCrossCuttingA1750000000195 implements MigrationInterface {
  name = "AuthorCtsLecturesCrossCuttingA1750000000195";

  private readonly TOPIC_INDEX: Record<string, number> = {
    "Transplantation and Surgery for Heart Failure": 17,
    "Congenital Heart Disease": 18,
  };

  private readonly LECTURES: Array<{ topic: string; section: 1 | 2; en: string; ar: string }> = [
    // ── 17. Transplantation and Surgery for Heart Failure ── (section 1: knowledge + clinical)
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "pathophysiology and causes of heart failure", ar: "الفيزيولوجيا المرضية وأسباب قصور القلب" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "pathophysiology and causes of respiratory failure", ar: "الفيزيولوجيا المرضية وأسباب القصور التنفسي" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "transplant immunology: major and minor histocompatibility antigen systems, mechanisms of immune activation and pathological consequences for transplanted organs", ar: "مناعة الزرع: أنظمة مستضدات التوافق النسيجي الرئيسية والثانوية وآليات التنشيط المناعي والعواقب المرضية للأعضاء المزروعة" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "pharmacology: drugs used in cardiac and respiratory failure, immunosuppression and treatment of rejection", ar: "الأدوية: الأدوية المستخدمة في قصور القلب والتنفس وكبت المناعة وعلاج الرفض" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "indications for, contraindications to and assessment for heart transplantation", ar: "دواعي وموانع وتقييم زراعة القلب" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "indications for, contraindications to and assessment for lung and heart/lung transplantation", ar: "دواعي وموانع وتقييم زراعة الرئة والقلب/الرئة" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "indications for ecmo", ar: "دواعي الأكسجة الغشائية خارج الجسم (ECMO)" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "indications for vad", ar: "دواعي جهاز مساعدة البطين (VAD)" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "criteria for brain stem death, management of the brain-dead donor, criteria for matching donor and recipient", ar: "معايير موت جذع الدماغ وتدبير المتبرع الميت دماغيًا ومعايير مطابقة المتبرع والمتلقي" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "management of patients after intrathoracic organ transplantation, including complications", ar: "تدبير المرضى بعد زراعة الأعضاء داخل الصدر بما في ذلك المضاعفات" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "results of heart transplantation, lung transplantation and non-transplant interventions for heart failure", ar: "نتائج زراعة القلب وزراعة الرئة والتدخلات غير الزرعية لقصور القلب" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "resynchronisation therapy: techniques and indications", ar: "علاج إعادة التزامن: التقنيات والدواعي" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "management of brain-dead donor", ar: "تدبير المتبرع الميت دماغيًا" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "assessment and selection of patients for cardiothoracic transplantation", ar: "تقييم واختيار المرضى لزراعة القلب والصدر" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "management of post op cardiothoracic transplant patient", ar: "تدبير مريض زراعة القلب والصدر بعد الجراحة" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "management of complications of cardiothoracic transplant surgery", ar: "تدبير مضاعفات جراحة زراعة القلب والصدر" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 1, en: "management of rejection", ar: "تدبير الرفض" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "transplantation", ar: "الزرع" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "transvenous myocardial biopsy", ar: "خزعة عضلة القلب عبر الوريد" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "donor retrieval", ar: "استخلاص العضو من المتبرع" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "ex-vivo donor organ management", ar: "تدبير عضو المتبرع خارج الجسم" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "implantation of heart", ar: "زرع القلب" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "implantation of lung", ar: "زرع الرئة" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "implantation of heart/lung block", ar: "زرع كتلة القلب/الرئة" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "surgery for heart failure", ar: "جراحة قصور القلب" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "surgical revascularisation for ischaemic cardiomyopathy", ar: "إعادة التوعية الجراحية لاعتلال عضلة القلب الإقفاري" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "ventricular reverse remodelling surgery", ar: "جراحة إعادة التشكيل العكسي للبطين" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "mitral valve repair for cardiac failure", ar: "إصلاح الصمام التاجي لقصور القلب" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "cannulation for ecmo", ar: "القنطرة للأكسجة الغشائية خارج الجسم (ECMO)" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "implantation of epicardial electrodes for resynchronisation therapy", ar: "زرع الأقطاب الكهربائية فوق القلبية لعلاج إعادة التزامن" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "implantation of extracorporeal vad", ar: "زرع جهاز مساعدة البطين خارج الجسم" },
    { topic: "Transplantation and Surgery for Heart Failure", section: 2, en: "implantation of intracorporeal vad", ar: "زرع جهاز مساعدة البطين داخل الجسم" },
    // ── 18. Congenital Heart Disease ── (section 1: knowledge + conditions + clinical)
    { topic: "Congenital Heart Disease", section: 1, en: "relevant general physiology of childhood", ar: "الفسيولوجيا العامة ذات الصلة للطفولة" },
    { topic: "Congenital Heart Disease", section: 1, en: "fetal circulation and circulatory changes at birth", ar: "الدوران الجنيني وتغيرات الدوران عند الولادة" },
    { topic: "Congenital Heart Disease", section: 1, en: "haemodynamics; physiology and measurement including shunt calculations", ar: "الديناميكا الدموية؛ الفسيولوجيا والقياس بما في ذلك حسابات التحويلة" },
    { topic: "Congenital Heart Disease", section: 1, en: "physiology of pulmonary vasculature", ar: "فسيولوجيا الأوعية الرئوية" },
    { topic: "Congenital Heart Disease", section: 1, en: "myocardial cellular physiology in immature myocardium", ar: "الفسيولوجيا الخلوية لعضلة القلب غير الناضجة" },
    { topic: "Congenital Heart Disease", section: 1, en: "physiology of cardiopulmonary bypass in children - including low flow and circulatory arrest", ar: "فسيولوجيا المجازة القلبية الرئوية عند الأطفال - بما في ذلك التدفق المنخفض وتوقف الدوران" },
    { topic: "Congenital Heart Disease", section: 1, en: "anatomy and embryology of the heart", ar: "تشريح وأجنة القلب" },
    { topic: "Congenital Heart Disease", section: 1, en: "coronary anatomy and variants", ar: "تشريح الشرايين التاجية وتنوعاتها" },
    { topic: "Congenital Heart Disease", section: 1, en: "anatomy of the peripheral vascular system and vascular conduits including aortopulmonary shunts", ar: "تشريح الجهاز الوعائي المحيطي والقنوات الوعائية بما في ذلك التحويلات الأبهرية الرئوية" },
    { topic: "Congenital Heart Disease", section: 1, en: "sequential cardiac analysis and terminology of cardiac malformations", ar: "التحليل القلبي التسلسلي ومصطلحات التشوهات القلبية" },
    { topic: "Congenital Heart Disease", section: 1, en: "effect of growth and pregnancy", ar: "تأثير النمو والحمل" },
    { topic: "Congenital Heart Disease", section: 1, en: "drugs used in the treatment of congenital heart disease, including perioperative management and anaesthesia", ar: "الأدوية المستخدمة في علاج أمراض القلب الخلقية بما في ذلك التدبير حول الجراحي والتخدير" },
    { topic: "Congenital Heart Disease", section: 1, en: "diagnosis, investigation and treatment of congenital heart disease", ar: "تشخيص وفحص وعلاج أمراض القلب الخلقية" },
    { topic: "Congenital Heart Disease", section: 1, en: "results of congenital surgery - survival, common complications and management", ar: "نتائج جراحة القلب الخلقية - البقيا والمضاعفات الشائعة وتدبيرها" },
    { topic: "Congenital Heart Disease", section: 1, en: "late complications of surgery for congenital heart disease", ar: "المضاعفات المتأخرة لجراحة أمراض القلب الخلقية" },
    { topic: "Congenital Heart Disease", section: 1, en: "role of interventional cardiology in congenital heart disease", ar: "دور طب القلب التداخلي في أمراض القلب الخلقية" },
    { topic: "Congenital Heart Disease", section: 1, en: "role of mechanical assist (iabp, vad and ecmo)", ar: "دور المساعدة الميكانيكية (IABP وVAD وECMO)" },
    { topic: "Congenital Heart Disease", section: 1, en: "indications for referral for transplantation in congenital heart disease", ar: "دواعي الإحالة للزراعة في أمراض القلب الخلقية" },
    { topic: "Congenital Heart Disease", section: 1, en: "risk assessment and stratification in congenital surgery", ar: "تقييم وتصنيف المخاطر في جراحة القلب الخلقية" },
    { topic: "Congenital Heart Disease", section: 1, en: "cardiopulmonary resuscitation in children and in patients with congenital heart disease", ar: "الإنعاش القلبي الرئوي عند الأطفال ومرضى أمراض القلب الخلقية" },
    { topic: "Congenital Heart Disease", section: 1, en: "patent ductus arteriosus", ar: "القناة الشريانية السالكة" },
    { topic: "Congenital Heart Disease", section: 1, en: "aortopulmonary window", ar: "النافذة الأبهرية الرئوية" },
    { topic: "Congenital Heart Disease", section: 1, en: "atrial septal defect", ar: "عيب الحاجز الأذيني" },
    { topic: "Congenital Heart Disease", section: 1, en: "ventricular septal defect", ar: "عيب الحاجز البطيني" },
    { topic: "Congenital Heart Disease", section: 1, en: "coarctation", ar: "تضيّق الأبهر" },
    { topic: "Congenital Heart Disease", section: 1, en: "pa banding and shunts", ar: "تطويق الشريان الرئوي والتحويلات" },
    { topic: "Congenital Heart Disease", section: 1, en: "aortopulmonary and venous shunts", ar: "التحويلات الأبهرية الرئوية والوريدية" },
    { topic: "Congenital Heart Disease", section: 1, en: "transposition of the great arteries / switch procedure", ar: "تبدّل الشرايين الكبيرة / عملية التبديل" },
    { topic: "Congenital Heart Disease", section: 1, en: "congenitally corrected tga", ar: "التبدّل المصحح خلقيًا للشرايين الكبيرة" },
    { topic: "Congenital Heart Disease", section: 1, en: "single ventricle/univentricular heart", ar: "البطين المفرد / القلب أحادي البطين" },
    { topic: "Congenital Heart Disease", section: 1, en: "tetralogy of fallot/pulmonary atresia plus vsd", ar: "رباعية فالو / رتق الرئوي مع عيب الحاجز البطيني" },
    { topic: "Congenital Heart Disease", section: 1, en: "fontan procedure", ar: "عملية فونتان" },
    { topic: "Congenital Heart Disease", section: 1, en: "rastelli procedure", ar: "عملية راستيلي" },
    { topic: "Congenital Heart Disease", section: 1, en: "hypoplastic left heart and norwood procedure", ar: "القلب الأيسر ناقص التنسج وعملية نوروود" },
    { topic: "Congenital Heart Disease", section: 1, en: "truncus arteriosus", ar: "الجذع الشرياني" },
    { topic: "Congenital Heart Disease", section: 1, en: "double outlet right ventricle", ar: "البطين الأيمن مزدوج المخرج" },
    { topic: "Congenital Heart Disease", section: 1, en: "pulmonary atresia plus vsd and mapcas", ar: "رتق الرئوي مع عيب الحاجز البطيني والشرايين الجانبية الأبهرية الرئوية الكبيرة (MAPCAs)" },
    { topic: "Congenital Heart Disease", section: 1, en: "pulmonary atresia and intact septum", ar: "رتق الرئوي مع سلامة الحاجز" },
    { topic: "Congenital Heart Disease", section: 1, en: "partial and complete atrioventricular septal defects", ar: "عيوب الحاجز الأذيني البطيني الجزئية والكاملة" },
    { topic: "Congenital Heart Disease", section: 1, en: "anomalies of the pulmonary venous drainage (partial and total)", ar: "شذوذات التصريف الوريدي الرئوي (الجزئي والكلي)" },
    { topic: "Congenital Heart Disease", section: 1, en: "anomalies of systemic venous drainage", ar: "شذوذات التصريف الوريدي الجهازي" },
    { topic: "Congenital Heart Disease", section: 1, en: "congenital aortic valve disease (including supra-valve stenosis)", ar: "مرض الصمام الأبهري الخلقي (بما في ذلك التضيق فوق الصمامي)" },
    { topic: "Congenital Heart Disease", section: 1, en: "lv outflow tract obstruction", ar: "انسداد مسار تدفق البطين الأيسر" },
    { topic: "Congenital Heart Disease", section: 1, en: "sinus of valsalva aneurysm", ar: "أمهات دم جيب فالسالفا" },
    { topic: "Congenital Heart Disease", section: 1, en: "congenital mitral valve disease", ar: "مرض الصمام التاجي الخلقي" },
    { topic: "Congenital Heart Disease", section: 1, en: "congenital tricuspid valve disease (including ebstein's abnormality)", ar: "مرض الصمام ثلاثي الشرف الخلقي (بما في ذلك شذوذ إبشتاين)" },
    { topic: "Congenital Heart Disease", section: 1, en: "anomalies of the coronary arteries (including alcapa)", ar: "شذوذات الشرايين التاجية (بما في ذلك ALCAPA)" },
    { topic: "Congenital Heart Disease", section: 1, en: "vascular rings", ar: "الحلقات الوعائية" },
    { topic: "Congenital Heart Disease", section: 1, en: "cardiac tumours", ar: "أورام القلب" },
    { topic: "Congenital Heart Disease", section: 1, en: "pericardial disease", ar: "مرض التامور" },
    { topic: "Congenital Heart Disease", section: 1, en: "aortic valve disease including ross procedure", ar: "مرض الصمام الأبهري بما في ذلك عملية روس" },
    { topic: "Congenital Heart Disease", section: 1, en: "mitral valve disease", ar: "مرض الصمام التاجي" },
    { topic: "Congenital Heart Disease", section: 1, en: "tricuspid valve disease including ebstein's abnormality", ar: "مرض الصمام ثلاثي الشرف بما في ذلك شذوذ إبشتاين" },
    { topic: "Congenital Heart Disease", section: 1, en: "extra cardiac conduits", ar: "القنوات خارج القلبية" },
    { topic: "Congenital Heart Disease", section: 1, en: "interrupted aortic arch", ar: "انقطاع القوس الأبهري" },
    { topic: "Congenital Heart Disease", section: 1, en: "total anomalous pulmonary venous drainage", ar: "التصريف الوريدي الرئوي الشاذ الكلي" },
    { topic: "Congenital Heart Disease", section: 1, en: "extracorporeal membrane oxygenation and vad", ar: "الأكسجة الغشائية خارج الجسم وجهاز مساعدة البطين" },
    { topic: "Congenital Heart Disease", section: 1, en: "transplantation for congenital heart disease", ar: "الزراعة في أمراض القلب الخلقية" },
    { topic: "Congenital Heart Disease", section: 1, en: "cardiovascular system and general history and examination of child or adult with congenital heart disease", ar: "الجهاز القلبي الوعائي والتاريخ والفحص العام للطفل أو البالغ المصاب بمرض القلب الخلقي" },
    { topic: "Congenital Heart Disease", section: 1, en: "routine haematology and biochemical investigations in children", ar: "الفحوص الروتينية الدموية والكيميائية الحيوية عند الأطفال" },
    { topic: "Congenital Heart Disease", section: 1, en: "cardiac catheterisation data including interpretation of haemodynamic data, shunt and resistance calculations", ar: "بيانات القسطرة القلبية بما في ذلك تفسير البيانات الديناميكية الدموية وحسابات التحويلة والمقاومة" },
    { topic: "Congenital Heart Disease", section: 1, en: "echocardiography in congenital heart disease, including 2d, doppler and toe", ar: "تخطيط صدى القلب في أمراض القلب الخلقية بما في ذلك ثنائي الأبعاد والدوبلر وعبر المريء (TOE)" },
    { topic: "Congenital Heart Disease", section: 1, en: "principles of paediatric intensive care", ar: "مبادئ العناية المركزة للأطفال" },
    { topic: "Congenital Heart Disease", section: 1, en: "management of adults and children following congenital heart surgery", ar: "تدبير البالغين والأطفال بعد جراحة القلب الخلقية" },
    { topic: "Congenital Heart Disease", section: 1, en: "management of complications of congenital surgery", ar: "تدبير مضاعفات جراحة القلب الخلقية" },
    { topic: "Congenital Heart Disease", section: 1, en: "cardiopulmonary resuscitation in children and congenital heart disease", ar: "الإنعاش القلبي الرئوي عند الأطفال وفي أمراض القلب الخلقية" },
    { topic: "Congenital Heart Disease", section: 1, en: "diagnosis and treatment of cardiac arrhythmias in congenital heart disease", ar: "تشخيص وعلاج اضطرابات النظم القلبي في أمراض القلب الخلقية" },
    { topic: "Congenital Heart Disease", section: 2, en: "sternotomy - open and close", ar: "شق القص - الفتح والإغلاق" },
    { topic: "Congenital Heart Disease", section: 2, en: "thoracotomy - open and close", ar: "بضع الصدر - الفتح والإغلاق" },
    { topic: "Congenital Heart Disease", section: 2, en: "preparation for and management of cardiopulmonary bypass including partial bypass", ar: "التحضير لإدارة المجازة القلبية الرئوية بما في ذلك المجازة الجزئية" },
    { topic: "Congenital Heart Disease", section: 2, en: "approaches for ecmo, cannulation and management", ar: "مداخل الأكسجة الغشائية خارج الجسم والقنطرة والتدبير" },
    { topic: "Congenital Heart Disease", section: 2, en: "patent ductus arteriosus", ar: "القناة الشريانية السالكة" },
    { topic: "Congenital Heart Disease", section: 2, en: "atrial septal defect", ar: "عيب الحاجز الأذيني" },
    { topic: "Congenital Heart Disease", section: 2, en: "ventricular septal defect", ar: "عيب الحاجز البطيني" },
    { topic: "Congenital Heart Disease", section: 2, en: "coarctation", ar: "تضيّق الأبهر" },
    { topic: "Congenital Heart Disease", section: 2, en: "pa banding and shunts", ar: "تطويق الشريان الرئوي والتحويلات" },
    { topic: "Congenital Heart Disease", section: 2, en: "aortopulmonary window", ar: "النافذة الأبهرية الرئوية" },
    { topic: "Congenital Heart Disease", section: 2, en: "vascular ring", ar: "الحلقة الوعائية" },
    { topic: "Congenital Heart Disease", section: 2, en: "aortopulmonary and venous shunts", ar: "التحويلات الأبهرية الرئوية والوريدية" },
    { topic: "Congenital Heart Disease", section: 2, en: "partial atrioventricular septal defect", ar: "عيب الحاجز الأذيني البطيني الجزئي" },
    { topic: "Congenital Heart Disease", section: 2, en: "aortic and mitral valve surgery including ross procedure", ar: "جراحة الصمام الأبهري والتاجي بما في ذلك عملية روس" },
    { topic: "Congenital Heart Disease", section: 2, en: "open aortic valvotomy", ar: "بضع الصمام الأبهري المفتوح" },
    { topic: "Congenital Heart Disease", section: 2, en: "open pulmonary valvotomy", ar: "بضع الصمام الرئوي المفتوح" },
    { topic: "Congenital Heart Disease", section: 2, en: "tricuspid valve surgery including ebstein's", ar: "جراحة الصمام ثلاثي الشرف بما في ذلك إبشتاين" },
    { topic: "Congenital Heart Disease", section: 2, en: "tetralogy of fallot/pulmonary atresia plus vsd", ar: "رباعية فالو / رتق الرئوي مع عيب الحاجز البطيني" },
    { topic: "Congenital Heart Disease", section: 2, en: "fontan procedures", ar: "عمليات فونتان" },
    { topic: "Congenital Heart Disease", section: 2, en: "extra cardiac conduits and their replacement", ar: "القنوات خارج القلبية واستبدالها" },
    { topic: "Congenital Heart Disease", section: 2, en: "complete atrioventricular septal defect", ar: "عيب الحاجز الأذيني البطيني الكامل" },
    { topic: "Congenital Heart Disease", section: 2, en: "interrupted aortic arch", ar: "انقطاع القوس الأبهري" },
    { topic: "Congenital Heart Disease", section: 2, en: "total anomalous pulmonary venous drainage", ar: "التصريف الوريدي الرئوي الشاذ الكلي" },
    { topic: "Congenital Heart Disease", section: 2, en: "transposition of the great arteries (switch procedure)", ar: "تبدّل الشرايين الكبيرة (عملية التبديل)" },
    { topic: "Congenital Heart Disease", section: 2, en: "rastelli procedure", ar: "عملية راستيلي" },
    { topic: "Congenital Heart Disease", section: 2, en: "norwood procedure", ar: "عملية نوروود" },
    { topic: "Congenital Heart Disease", section: 2, en: "truncus arteriosus repair", ar: "إصلاح الجذع الشرياني" },
    { topic: "Congenital Heart Disease", section: 2, en: "double outlet right ventricle", ar: "البطين الأيمن مزدوج المخرج" },
    { topic: "Congenital Heart Disease", section: 2, en: "pulmonary atresia plus vsd and mapcas", ar: "رتق الرئوي مع عيب الحاجز البطيني والشرايين الجانبية الأبهرية الرئوية الكبيرة (MAPCAs)" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");
    const counters = new Map<string, number>();
    const rows = this.LECTURES.map((l) => {
      const c = this.TOPIC_INDEX[l.topic];
      const key = `${l.topic}|${l.section}`;
      const n = (counters.get(key) ?? 0) + 1;
      counters.set(key, n);
      const num = `${c}.${l.section}.${n}`;
      const ord = c * 1_000_000 + l.section * 1_000 + n;
      return `('${q(l.topic)}', '${q(num)}', '${q(l.en)}', '${q(l.ar)}', ${ord})`;
    });
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).join(",\n          ");
      await queryRunner.query(`
        INSERT INTO "lectures" ("topicId", "lectureNumber", "title", "arTitle", "level", "sortOrder")
        SELECT lt."id", v.number, v.title, v.ar, NULL, v.ord
        FROM (VALUES ${batch}) AS v(topic, number, title, ar, ord)
        JOIN "departments" d ON d."code" = 'CTS'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "lectures" lx
      USING "lecture_topics" lt, "departments" d
      WHERE lx."topicId" = lt."id" AND lt."departmentId" = d."id" AND d."code" = 'CTS'
        AND lt."title" IN ('Transplantation and Surgery for Heart Failure', 'Congenital Heart Disease')
    `);
  }
}
