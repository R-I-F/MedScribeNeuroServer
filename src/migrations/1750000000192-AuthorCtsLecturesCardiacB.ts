import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * CTS academic lectures — ISCP Cardiothoracic Surgery Curriculum (Aug 2021), Appendix 2.
 * Part 2: Cardiac topics 4–7 (Ischaemic Heart Disease, Heart Valve Disease, Aorta and Vascular
 * Disease, Miscellaneous Cardiac Conditions). Topics were created in migration 191; this adds
 * their lectures. section 1 = KNOWLEDGE/CLINICAL syllabus items, section 2 = TECHNICAL/OPERATIVE.
 * `level` = NULL (MSc/MD not derivable from ISCP — sourced later). Faithful; nothing invented.
 */
export class AuthorCtsLecturesCardiacB1750000000192 implements MigrationInterface {
  name = "AuthorCtsLecturesCardiacB1750000000192";

  // topic → its index in the 20-topic list (for numbering <idx>.<section>.<n>)
  private readonly TOPIC_INDEX: Record<string, number> = {
    "Ischaemic Heart Disease": 4,
    "Heart Valve Disease": 5,
    "Aorta and Vascular Disease": 6,
    "Miscellaneous Cardiac Conditions": 7,
  };

  private readonly LECTURES: Array<{ topic: string; section: 1 | 2; en: string; ar: string }> = [
    // ── 4. Ischaemic Heart Disease ──
    { topic: "Ischaemic Heart Disease", section: 1, en: "anatomy of the heart and coronary arteries and anomalies of the coronary arteries", ar: "تشريح القلب والشرايين التاجية وتشوهات الشرايين التاجية" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "diagnosis, investigation and assessment of ischaemic heart disease", ar: "تشخيص وفحص وتقييم مرض القلب الإقفاري" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "risk stratification of patients undergoing coronary surgery", ar: "تصنيف مخاطر المرضى الخاضعين لجراحة الشرايين التاجية" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "operative treatment - off-pump and on-pump surgery", ar: "العلاج الجراحي - الجراحة بدون مضخة وبالمضخة" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "results of surgery, survival, graft patency, short and long term complications", ar: "نتائج الجراحة والبقيا وسلامة الطعم والمضاعفات القصيرة والطويلة المدى" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "choice of conduits for grafting", ar: "اختيار القنوات (الطعوم) للتوصيل" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "arterial revascularisation", ar: "إعادة التروية الشريانية" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "redo coronary artery surgery", ar: "إعادة جراحة الشرايين التاجية" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "role of pci and non-operative treatment in ischaemic heart disease", ar: "دور القسطرة التداخلية (PCI) والعلاج غير الجراحي في مرض القلب الإقفاري" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "management of cardiovascular risk factors", ar: "تدبير عوامل الخطر القلبية الوعائية" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "acute complications of myocardial infarction and ischaemic heart disease", ar: "المضاعفات الحادة لاحتشاء عضلة القلب ومرض القلب الإقفاري" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "chronic complications of ischaemic heart disease - including vsd, mitral regurgitation, lv aneurysm", ar: "المضاعفات المزمنة لمرض القلب الإقفاري - بما في ذلك عيب الحاجز البطيني والقلس الميترالي وأم الدم البطينية اليسرى" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "cardiac rehabilitation following surgery for ischaemic heart disease", ar: "إعادة التأهيل القلبي بعد جراحة مرض القلب الإقفاري" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "cardiovascular system - general history and examination, including conduit, drug history, identification of comorbidity and risk assessment", ar: "الجهاز القلبي الوعائي - التاريخ المرضي والفحص العام بما في ذلك تقييم القنوات والتاريخ الدوائي وتحديد الأمراض المصاحبة وتقييم المخاطر" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "interpretation of coronary angiography (including invasive flow measures (ffr) and intravascular ultrasound (ivus))", ar: "تفسير تصوير الشرايين التاجية (بما في ذلك قياسات التدفق التداخلية FFR والأمواج فوق الصوتية داخل الوعاء IVUS)" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "interpretation of cardiac catheterisation data", ar: "تفسير بيانات القسطرة القلبية" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "interpretation of echocardiography (transthoracic and transesophageal) including 2d, doppler, 3d and stress echo", ar: "تفسير تخطيط صدى القلب (عبر الصدر وعبر المريء) بما في ذلك ثنائي وثلاثي الأبعاد ودوبلر وإيكو الجهد" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "interpretation of nuclear cardiology", ar: "تفسير طب القلب النووي" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "management of the post cardiac surgical patient", ar: "تدبير المريض بعد جراحة القلب" },
    { topic: "Ischaemic Heart Disease", section: 1, en: "management of complications of coronary surgery", ar: "تدبير مضاعفات جراحة الشرايين التاجية" },
    { topic: "Ischaemic Heart Disease", section: 2, en: "saphenous vein harvest", ar: "حصاد الوريد الصافن" },
    { topic: "Ischaemic Heart Disease", section: 2, en: "internal mammary artery harvest", ar: "حصاد الشريان الثديي الباطن" },
    { topic: "Ischaemic Heart Disease", section: 2, en: "radial artery harvest", ar: "حصاد الشريان الكعبري" },
    { topic: "Ischaemic Heart Disease", section: 2, en: "proximal coronary anastomosis", ar: "المفاغرة التاجية القريبة" },
    { topic: "Ischaemic Heart Disease", section: 2, en: "distal coronary anastomosis", ar: "المفاغرة التاجية البعيدة" },
    { topic: "Ischaemic Heart Disease", section: 2, en: "isolated, first-time coronary surgery on pump", ar: "جراحة الشرايين التاجية المعزولة لأول مرة بالمضخة" },
    { topic: "Ischaemic Heart Disease", section: 2, en: "isolated, first-time coronary artery surgery off pump (opcab)", ar: "جراحة الشرايين التاجية المعزولة لأول مرة بدون مضخة (OPCAB)" },
    { topic: "Ischaemic Heart Disease", section: 2, en: "minimally invasive surgical coronary artery surgery techniques (including midcab)", ar: "تقنيات جراحة الشرايين التاجية طفيفة التوغل (بما في ذلك MIDCAB)" },
    { topic: "Ischaemic Heart Disease", section: 2, en: "redo coronary artery surgery", ar: "إعادة جراحة الشرايين التاجية" },
    { topic: "Ischaemic Heart Disease", section: 2, en: "surgery for acute complications of ischaemic heart disease (including post-infarction vsd, mitral regurgitation)", ar: "جراحة المضاعفات الحادة لمرض القلب الإقفاري (بما في ذلك عيب الحاجز البطيني بعد الاحتشاء والقلس الميترالي)" },
    { topic: "Ischaemic Heart Disease", section: 2, en: "surgery for chronic complications of ischaemic heart disease (including ischaemic mitral regurgitation and left ventricular aneurysm)", ar: "جراحة المضاعفات المزمنة لمرض القلب الإقفاري (بما في ذلك القلس الميترالي الإقفاري وأم الدم البطينية اليسرى)" },
    // ── 5. Heart Valve Disease ──
    { topic: "Heart Valve Disease", section: 1, en: "anatomy of the heart, chambers, valves and their anomalies", ar: "تشريح القلب والحجرات والصمامات وتشوهاتها" },
    { topic: "Heart Valve Disease", section: 1, en: "cardiovascular physiology, including valve physiology and haemodynamics", ar: "الفسيولوجيا القلبية الوعائية بما في ذلك فسيولوجيا الصمامات والديناميكا الدموية" },
    { topic: "Heart Valve Disease", section: 1, en: "electrophysiology, including conduction disorders", ar: "الفسيولوجيا الكهربية بما في ذلك اضطرابات التوصيل" },
    { topic: "Heart Valve Disease", section: 1, en: "pathophysiology of valve incompetence and stenosis", ar: "الفيزيولوجيا المرضية لقصور الصمامات وتضيقها" },
    { topic: "Heart Valve Disease", section: 1, en: "consequences of valve disease on cardiac function and morphology", ar: "عواقب أمراض الصمامات على وظيفة القلب وبنيته" },
    { topic: "Heart Valve Disease", section: 1, en: "pathophysiology of mixed valve disease and combined valve pathology (e.g. aortic and mitral)", ar: "الفيزيولوجيا المرضية لمرض الصمامات المختلط والباثولوجيا الصمامية المشتركة (مثل الأبهري والميترالي)" },
    { topic: "Heart Valve Disease", section: 1, en: "combined valvular and ischaemic heart disease", ar: "مرض القلب الصمامي والإقفاري المشترك" },
    { topic: "Heart Valve Disease", section: 1, en: "atrial fibrillation and other arrhythmias", ar: "الرجفان الأذيني واضطرابات النظم الأخرى" },
    { topic: "Heart Valve Disease", section: 1, en: "endocarditis - native and prosthetic valve", ar: "التهاب الشغاف - الصمام الأصلي والصناعي" },
    { topic: "Heart Valve Disease", section: 1, en: "diagnosis, investigation and assessment of valvular heart disease", ar: "تشخيص وفحص وتقييم مرض القلب الصمامي" },
    { topic: "Heart Valve Disease", section: 1, en: "timing of surgical intervention in valve disease", ar: "توقيت التدخل الجراحي في مرض الصمامات" },
    { topic: "Heart Valve Disease", section: 1, en: "risk stratification of patients undergoing valve surgery", ar: "تصنيف مخاطر المرضى الخاضعين لجراحة الصمامات" },
    { topic: "Heart Valve Disease", section: 1, en: "options for operative management", ar: "خيارات التدبير الجراحي" },
    { topic: "Heart Valve Disease", section: 1, en: "valve replacement/repair (mechanical, biological stented and stentless grafts, homografts and autografts)", ar: "استبدال/إصلاح الصمام (ميكانيكي، طعوم حيوية مدعمة وغير مدعمة، طعوم مثلية وذاتية)" },
    { topic: "Heart Valve Disease", section: 1, en: "valve design: materials, configuration and biomechanics", ar: "تصميم الصمام: المواد والتشكيل والميكانيكا الحيوية" },
    { topic: "Heart Valve Disease", section: 1, en: "results of valve surgery – survival, valve thrombosis, endocarditis, bleeding", ar: "نتائج جراحة الصمامات – البقيا وتجلط الصمام والتهاب الشغاف والنزف" },
    { topic: "Heart Valve Disease", section: 1, en: "surgery for disease of the conduction system", ar: "جراحة أمراض جهاز التوصيل" },
    { topic: "Heart Valve Disease", section: 1, en: "surgical treatment of arrhythmias", ar: "العلاج الجراحي لاضطرابات النظم" },
    { topic: "Heart Valve Disease", section: 1, en: "cardiovascular system - general history and examination including drug history, identification of co-morbidity and risk assessment", ar: "الجهاز القلبي الوعائي - التاريخ المرضي والفحص العام بما في ذلك التاريخ الدوائي وتحديد الأمراض المصاحبة وتقييم المخاطر" },
    { topic: "Heart Valve Disease", section: 1, en: "interpretation of coronary angiography", ar: "تفسير تصوير الشرايين التاجية" },
    { topic: "Heart Valve Disease", section: 1, en: "interpretation of cardiac catheterisation data, including left and right heart data", ar: "تفسير بيانات القسطرة القلبية بما في ذلك بيانات القلب الأيسر والأيمن" },
    { topic: "Heart Valve Disease", section: 1, en: "interpretation of echocardiography (transthoracic and transesophageal) including 2d, doppler, 3d and stress echo", ar: "تفسير تخطيط صدى القلب (عبر الصدر وعبر المريء) بما في ذلك ثنائي وثلاثي الأبعاد ودوبلر وإيكو الجهد" },
    { topic: "Heart Valve Disease", section: 1, en: "non-operative management of endocarditis", ar: "التدبير غير الجراحي لالتهاب الشغاف" },
    { topic: "Heart Valve Disease", section: 1, en: "management of the complications of valve surgery", ar: "تدبير مضاعفات جراحة الصمامات" },
    { topic: "Heart Valve Disease", section: 1, en: "anticoagulation management including complications", ar: "تدبير مضادات التخثر بما في ذلك المضاعفات" },
    { topic: "Heart Valve Disease", section: 2, en: "isolated, uncomplicated aortic valve replacement (biological or mechanical)", ar: "استبدال الصمام الأبهري المعزول غير المعقد (حيوي أو ميكانيكي)" },
    { topic: "Heart Valve Disease", section: 2, en: "isolated, uncomplicated mitral valve replacement", ar: "استبدال الصمام الميترالي المعزول غير المعقد" },
    { topic: "Heart Valve Disease", section: 2, en: "tricuspid valve surgery", ar: "جراحة الصمام ثلاثي الشرفات" },
    { topic: "Heart Valve Disease", section: 2, en: "aortic valve and graft surgery", ar: "جراحة الصمام الأبهري والطعم" },
    { topic: "Heart Valve Disease", section: 2, en: "mitral valve and graft surgery", ar: "جراحة الصمام الميترالي والطعم" },
    { topic: "Heart Valve Disease", section: 2, en: "surgical strategies for managing the small aortic root", ar: "الاستراتيجيات الجراحية لتدبير الجذر الأبهري الصغير" },
    { topic: "Heart Valve Disease", section: 2, en: "redo valve surgery", ar: "إعادة جراحة الصمامات" },
    { topic: "Heart Valve Disease", section: 2, en: "valve surgery for endocarditis", ar: "جراحة الصمامات لالتهاب الشغاف" },
    { topic: "Heart Valve Disease", section: 2, en: "techniques for surgical ablation of arrhythmias (+/- occlusion of the la appendage)", ar: "تقنيات الاستئصال الجراحي لاضطرابات النظم (مع أو بدون إغلاق الزائدة الأذينية اليسرى)" },
    { topic: "Heart Valve Disease", section: 2, en: "mitral valve repair", ar: "إصلاح الصمام الميترالي" },
    { topic: "Heart Valve Disease", section: 2, en: "isolated, uncomplicated aortic valve replacement (sutureless)", ar: "استبدال الصمام الأبهري المعزول غير المعقد (بدون خياطة)" },
    { topic: "Heart Valve Disease", section: 2, en: "minimally invasive aortic valve replacement", ar: "استبدال الصمام الأبهري طفيف التوغل" },
    { topic: "Heart Valve Disease", section: 2, en: "minimally invasive mitral valve repair/replacement", ar: "إصلاح/استبدال الصمام الميترالي طفيف التوغل" },
    { topic: "Heart Valve Disease", section: 2, en: "transcatheter treatment of aortic valve disease (including non-transfemoral tavi)", ar: "العلاج عبر القسطرة لمرض الصمام الأبهري (بما في ذلك TAVI غير عبر الفخذ)" },
    { topic: "Heart Valve Disease", section: 2, en: "transcatheter treatment of structural heart valve disease (transfemoral tavi, mitral valve etc.)", ar: "العلاج عبر القسطرة لأمراض صمامات القلب البنيوية (TAVI عبر الفخذ والصمام الميترالي وغيرها)" },
    // ── 6. Aorta and Vascular Disease ──
    { topic: "Aorta and Vascular Disease", section: 1, en: "pathophysiology of hypothermia including the effects upon haemoglobin, metabolic rate and ph with their management", ar: "الفيزيولوجيا المرضية لانخفاض الحرارة بما في ذلك التأثيرات على الهيموغلوبين ومعدل الأيض ودرجة الحموضة وتدبيرها" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "anatomy of the heart, pericardium and great vessels and their anomalies", ar: "تشريح القلب والتامور والأوعية الكبيرة وتشوهاتها" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "anatomy of the peripheral vascular system", ar: "تشريح الجهاز الوعائي الطرفي" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "blood supply of the spinal cord", ar: "الإمداد الدموي للنخاع الشوكي" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "pathology of aortic disease", ar: "باثولوجيا مرض الأبهر" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "natural history of aortic disease", ar: "التاريخ الطبيعي لمرض الأبهر" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "diagnosis, investigation and assessment of aortic disease", ar: "تشخيص وفحص وتقييم مرض الأبهر" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "knowledge of operative treatment, including spinal cord and cerebral preservation strategies", ar: "معرفة العلاج الجراحي بما في ذلك استراتيجيات حماية النخاع الشوكي والمخ" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "acute aortic syndromes (including type a & b aortic dissection, intramural haematoma and penetrating aortic ulcers)", ar: "المتلازمات الأبهرية الحادة (بما في ذلك تسلخ الأبهر النوع A وB والورم الدموي داخل الجدار والقرح الأبهرية المخترقة)" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "traumatic aortic rupture", ar: "تمزق الأبهر الرضحي" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "thoracoabdominal aneurysm", ar: "أم الدم الصدرية البطنية" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "results of major aorta vascular surgery – survival, complication rates", ar: "نتائج جراحة الأبهر الوعائية الكبرى – البقيا ومعدلات المضاعفات" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "non-surgical management including the role of endovascular stenting", ar: "التدبير غير الجراحي بما في ذلك دور الدعامات داخل الوعائية" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "management of cardiovascular and non-cardiovascular risk factors", ar: "تدبير عوامل الخطر القلبية الوعائية وغير القلبية الوعائية" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "cardiovascular system - general history and examination including assessment of pre-operative complications, drug history, identification of co-morbidity and risk assessment", ar: "الجهاز القلبي الوعائي - التاريخ المرضي والفحص العام بما في ذلك تقييم مضاعفات ما قبل الجراحة والتاريخ الدوائي وتحديد الأمراض المصاحبة وتقييم المخاطر" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "interpretation of angiography and aortography", ar: "تفسير تصوير الأوعية وتصوير الأبهر" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "interpretation of echocardiography (transthoracic and transesophageal) including 2d, doppler, 3d and stress echo", ar: "تفسير تخطيط صدى القلب (عبر الصدر وعبر المريء) بما في ذلك ثنائي وثلاثي الأبعاد ودوبلر وإيكو الجهد" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "interpretation of ct scanning", ar: "تفسير التصوير المقطعي المحوسب" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "interpretation of mri scanning", ar: "تفسير التصوير بالرنين المغناطيسي" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "management of the post cardiac surgical patient after major aortic surgery", ar: "تدبير المريض بعد جراحة القلب عقب جراحة الأبهر الكبرى" },
    { topic: "Aorta and Vascular Disease", section: 1, en: "management of the complications of major aortic surgery", ar: "تدبير مضاعفات جراحة الأبهر الكبرى" },
    { topic: "Aorta and Vascular Disease", section: 2, en: "preparation for and management of cardiopulmonary bypass, including alternative, non-bypass strategies for descending aortic surgery", ar: "التحضير للمجازة القلبية الرئوية وتدبيرها بما في ذلك الاستراتيجيات البديلة بدون مجازة لجراحة الأبهر النازل" },
    { topic: "Aorta and Vascular Disease", section: 2, en: "organ protection strategies including hypothermic circulatory arrest (hca), retrograde cerebral perfusion (rcp) and selective antegrade cerebral perfusion (sacp)", ar: "استراتيجيات حماية الأعضاء بما في ذلك توقف الدورة الدموية مع خفض الحرارة (HCA) والإرواء المخي الرجوعي (RCP) والإرواء المخي الأمامي الانتقائي (SACP)" },
    { topic: "Aorta and Vascular Disease", section: 2, en: "axillary cannulation", ar: "قنيطة الشريان الإبطي" },
    { topic: "Aorta and Vascular Disease", section: 2, en: "surgery for acute dissection of the ascending aorta", ar: "جراحة التسلخ الحاد للأبهر الصاعد" },
    { topic: "Aorta and Vascular Disease", section: 2, en: "aortic root replacement", ar: "استبدال الجذر الأبهري" },
    { topic: "Aorta and Vascular Disease", section: 2, en: "complex aortic surgery including arch surgery, descending aortic and thoracoabdominal aortic surgery", ar: "جراحة الأبهر المعقدة بما في ذلك جراحة القوس والأبهر النازل والأبهر الصدري البطني" },
    { topic: "Aorta and Vascular Disease", section: 2, en: "replacement of the ascending aorta (interposition graft) +/- avr", ar: "استبدال الأبهر الصاعد (طعم بيني) مع أو بدون استبدال الصمام الأبهري" },
    { topic: "Aorta and Vascular Disease", section: 2, en: "valve-sparing aortic root replacement", ar: "استبدال الجذر الأبهري مع الحفاظ على الصمام" },
    // ── 7. Miscellaneous Cardiac Conditions ──
    { topic: "Miscellaneous Cardiac Conditions", section: 1, en: "pathophysiology, diagnosis and management of primary and secondary cardiac tumours", ar: "الفيزيولوجيا المرضية وتشخيص وتدبير أورام القلب الأولية والثانوية" },
    { topic: "Miscellaneous Cardiac Conditions", section: 1, en: "pathophysiology, diagnosis and management of acute pulmonary embolus", ar: "الفيزيولوجيا المرضية وتشخيص وتدبير الانصمام الرئوي الحاد" },
    { topic: "Miscellaneous Cardiac Conditions", section: 1, en: "pathophysiology, diagnosis and management of chronic thromboembolic pulmonary disease", ar: "الفيزيولوجيا المرضية وتشخيص وتدبير المرض الرئوي الانصمامي التخثري المزمن" },
    { topic: "Miscellaneous Cardiac Conditions", section: 1, en: "alternatives to endocardial pacing and the complications of conventional pacing/rhythm management devices", ar: "بدائل تنظيم ضربات القلب داخل الشغاف ومضاعفات أجهزة تنظيم الضربات/النظم التقليدية" },
    { topic: "Miscellaneous Cardiac Conditions", section: 1, en: "pathophysiology, diagnosis and management of hypertrophic obstructive cardiomyopathy", ar: "الفيزيولوجيا المرضية وتشخيص وتدبير اعتلال عضلة القلب الضخامي الانسدادي" },
    { topic: "Miscellaneous Cardiac Conditions", section: 1, en: "management of patients with cardiac tumours", ar: "تدبير المرضى المصابين بأورام القلب" },
    { topic: "Miscellaneous Cardiac Conditions", section: 1, en: "management of patients with acute pulmonary embolus", ar: "تدبير المرضى المصابين بالانصمام الرئوي الحاد" },
    { topic: "Miscellaneous Cardiac Conditions", section: 1, en: "management of patients with complications of conventional endocardial pacing", ar: "تدبير المرضى المصابين بمضاعفات تنظيم الضربات داخل الشغاف التقليدي" },
    { topic: "Miscellaneous Cardiac Conditions", section: 1, en: "management of patients with hypertrophic obstructive cardiomyopathy", ar: "تدبير المرضى المصابين باعتلال عضلة القلب الضخامي الانسدادي" },
    { topic: "Miscellaneous Cardiac Conditions", section: 2, en: "surgery for removal of cardiac tumour (including atrial myxoma)", ar: "جراحة استئصال ورم القلب (بما في ذلك الورم المخاطي الأذيني)" },
    { topic: "Miscellaneous Cardiac Conditions", section: 2, en: "pulmonary embolectomy", ar: "استئصال الصمة الرئوية" },
    { topic: "Miscellaneous Cardiac Conditions", section: 2, en: "insertion of permanent epicardial pacing lead", ar: "إدخال سلك تنظيم ضربات فوق القلب الدائم" },
    { topic: "Miscellaneous Cardiac Conditions", section: 2, en: "removal of infected pacing system", ar: "إزالة نظام تنظيم الضربات المصاب بالعدوى" },
    { topic: "Miscellaneous Cardiac Conditions", section: 2, en: "surgery for hypertrophic obstructive cardiomyopathies (including myomectomy)", ar: "جراحة اعتلال عضلة القلب الضخامي الانسدادي (بما في ذلك استئصال العضلة)" },
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
        AND lt."title" IN ('Ischaemic Heart Disease', 'Heart Valve Disease', 'Aorta and Vascular Disease', 'Miscellaneous Cardiac Conditions')
    `);
  }
}
