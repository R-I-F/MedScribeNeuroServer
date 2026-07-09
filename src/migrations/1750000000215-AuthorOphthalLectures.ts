import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OPHTHAL (Ophthalmology) academic lectures — PART 1 of 2.
 *
 * Transcribed faithfully from a source-0 Egyptian faculty postgraduate curriculum:
 *   "Master (MSC) Degree Program and Courses Specifications for Ophthalmology",
 *   Department of Ophthalmology, Faculty of Medicine, Assiut University (Quality Assurance Unit),
 *   2021-2022 / 2022-2023 (approved 27-11-2022).
 *   https://aun.edu.eg/medicine/sites/default/files/Postgraduate/Master$MD/ophthalmology/Ophthalmology%20master%20program%20%20and%20courses%20specification.pdf
 *   Citation recorded in MEDICAL_CODE_AUDITS/OPHTHAL/LECTURES_OPHTHAL.md.
 *
 * The reference's own top-level structure (6 courses; Course 6 "Ophthalmology" split into its
 * 3 modules) maps onto 8 lecture_topics. Lectures = exactly the items the courses' "Course
 * contents (topics/modules)" tables + ILO disease lists enumerate — nothing invented, nothing
 * padded. Numbering `<chapter>.<section>.<lecture>` is stable ordering; for the clinical module
 * the chapter digit preserves the source's subspecialty grouping.
 *
 * **`level` = 'msc' on every row** — the document is explicitly the *Master (MSC)* degree
 * program, so all its courses are MSc-level (authoritatively sourced, not derived from a number
 * heuristic). Bilingual (EN + AR) from the start; brain convention per project (n/a here).
 *
 * PART 1 creates all 8 topics and the lectures for topics 0–5 (anatomy, physiology, optics,
 * general surgery, internal medicine & neurology, eye medicine). PART 2 (migration 217) adds the
 * eye-surgery and eye-pathology lectures. down() of PART 1 deletes every OPHTHAL lecture_topic
 * (cascade removes all OPHTHAL lectures, including any added by PART 2).
 */
export class AuthorOphthalLectures1750000000215 implements MigrationInterface {
  name = "AuthorOphthalLectures1750000000215";

  // [englishTopic, arabicTopic, sortOrder]
  private readonly TOPICS: Array<[string, string, number]> = [
    ["anatomy of the eye", "تشريح العين", 0],
    ["physiology of the eye", "فسيولوجيا العين", 1],
    ["optics and refraction", "البصريات والانكسار", 2],
    ["general surgery", "الجراحة العامة", 3],
    ["internal medicine and neurological diseases", "الأمراض الباطنية والعصبية", 4],
    ["eye medicine", "طب العيون", 5],
    ["eye surgery", "جراحة العيون", 6],
    ["eye pathology", "باثولوجيا العين", 7],
  ];

  // { topic, num, en, ar }  — level is 'msc' for all (Master programme). sortOrder derived.
  private readonly LECTURES: Array<{ topic: string; num: string; en: string; ar: string }> = [
    // ── Topic 0: anatomy of the eye (Course 1) ──
    { topic: "anatomy of the eye", num: "1.1.1", en: "cornea", ar: "القرنية" },
    { topic: "anatomy of the eye", num: "1.1.2", en: "conjunctiva", ar: "الملتحمة" },
    { topic: "anatomy of the eye", num: "1.1.3", en: "lacrimal system", ar: "الجهاز الدمعي" },
    { topic: "anatomy of the eye", num: "1.1.4", en: "anterior chamber angle", ar: "زاوية الحجرة الأمامية" },
    { topic: "anatomy of the eye", num: "1.1.5", en: "sclera and episcleral structures", ar: "الصلبة والتراكيب فوق الصلبة" },
    { topic: "anatomy of the eye", num: "1.1.6", en: "lens", ar: "العدسة" },
    { topic: "anatomy of the eye", num: "1.1.7", en: "choroid", ar: "المشيمية" },
    { topic: "anatomy of the eye", num: "1.1.8", en: "iris", ar: "القزحية" },
    { topic: "anatomy of the eye", num: "1.1.9", en: "ciliary body", ar: "الجسم الهدبي" },
    { topic: "anatomy of the eye", num: "1.1.10", en: "ciliary processes", ar: "النتوءات الهدبية" },
    { topic: "anatomy of the eye", num: "1.1.11", en: "optic nerve structure", ar: "بنية العصب البصري" },
    { topic: "anatomy of the eye", num: "1.1.12", en: "optic nerve vasculature", ar: "الإمداد الدموي للعصب البصري" },
    { topic: "anatomy of the eye", num: "1.1.13", en: "cranial nerves 3, 4, 6, 7", ar: "الأعصاب القحفية 3 و4 و6 و7" },
    { topic: "anatomy of the eye", num: "1.1.14", en: "anatomy of the macula", ar: "تشريح البقعة الصفراء" },
    { topic: "anatomy of the eye", num: "1.1.15", en: "retina", ar: "الشبكية" },
    { topic: "anatomy of the eye", num: "1.1.16", en: "vitreous", ar: "الجسم الزجاجي" },
    { topic: "anatomy of the eye", num: "1.1.17", en: "extraocular muscles", ar: "عضلات العين الخارجية" },
    { topic: "anatomy of the eye", num: "1.1.18", en: "eyelids", ar: "الجفون" },
    { topic: "anatomy of the eye", num: "1.1.19", en: "orbit", ar: "الحجاج (محجر العين)" },

    // ── Topic 1: physiology of the eye (Course 2) ──
    { topic: "physiology of the eye", num: "1.1.1", en: "precorneal tear film", ar: "الغشاء الدمعي أمام القرنية" },
    { topic: "physiology of the eye", num: "1.1.2", en: "tears", ar: "الدموع" },
    { topic: "physiology of the eye", num: "1.1.3", en: "accommodation", ar: "التكيف (المطابقة البصرية)" },
    { topic: "physiology of the eye", num: "1.1.4", en: "corneal sensation", ar: "الإحساس القرني" },
    { topic: "physiology of the eye", num: "1.1.5", en: "basic and reflex tear secretion", ar: "الإفراز الدمعي الأساسي والانعكاسي" },
    { topic: "physiology of the eye", num: "1.1.6", en: "aqueous humor composition", ar: "تركيب الخلط المائي" },
    { topic: "physiology of the eye", num: "1.1.7", en: "aqueous humor formation", ar: "تكوين الخلط المائي" },
    { topic: "physiology of the eye", num: "1.1.8", en: "biodynamics of aqueous humor", ar: "الديناميكا الحيوية للخلط المائي" },
    { topic: "physiology of the eye", num: "1.1.9", en: "ocular circulation", ar: "الدورة الدموية للعين" },
    { topic: "physiology of the eye", num: "1.1.10", en: "intraocular pressure", ar: "ضغط العين الداخلي" },
    { topic: "physiology of the eye", num: "1.1.11", en: "physiology of the lens", ar: "فسيولوجيا العدسة" },
    { topic: "physiology of the eye", num: "1.1.12", en: "physiology of the ciliary body", ar: "فسيولوجيا الجسم الهدبي" },
    { topic: "physiology of the eye", num: "1.1.13", en: "physiology of the iris", ar: "فسيولوجيا القزحية" },
    { topic: "physiology of the eye", num: "1.1.14", en: "physiology of the vitreous", ar: "فسيولوجيا الجسم الزجاجي" },
    { topic: "physiology of the eye", num: "1.1.15", en: "physiology of the cornea", ar: "فسيولوجيا القرنية" },
    { topic: "physiology of the eye", num: "1.1.16", en: "retinal circulation", ar: "الدورة الدموية للشبكية" },
    { topic: "physiology of the eye", num: "1.1.17", en: "types of ocular motility", ar: "أنواع حركية العين" },
    { topic: "physiology of the eye", num: "1.1.18", en: "control of ocular motility", ar: "التحكم في حركية العين" },
    { topic: "physiology of the eye", num: "1.1.19", en: "sympathetic innervation of the eye", ar: "التعصيب الودي للعين" },
    { topic: "physiology of the eye", num: "1.1.20", en: "parasympathetic innervation of the eye", ar: "التعصيب نظير الودي للعين" },
    { topic: "physiology of the eye", num: "1.1.21", en: "physiology of the lid and conjunctiva", ar: "فسيولوجيا الجفن والملتحمة" },
    { topic: "physiology of the eye", num: "1.1.22", en: "physiology of the lacrimal apparatus (secretory and drainage parts)", ar: "فسيولوجيا الجهاز الدمعي (الأجزاء الإفرازية والتصريفية)" },
    { topic: "physiology of the eye", num: "1.1.23", en: "physiology of the retina", ar: "فسيولوجيا الشبكية" },
    { topic: "physiology of the eye", num: "1.1.24", en: "physiology of the choroid", ar: "فسيولوجيا المشيمية" },
    { topic: "physiology of the eye", num: "1.1.25", en: "physiology of the sclera", ar: "فسيولوجيا الصلبة" },

    // ── Topic 2: optics and refraction (Course 3) ──
    { topic: "optics and refraction", num: "1.1.1", en: "lens formula", ar: "معادلة العدسة" },
    { topic: "optics and refraction", num: "1.1.2", en: "astigmatic lenses", ar: "العدسات الأسطيغماتية" },
    { topic: "optics and refraction", num: "1.1.3", en: "notation of lenses", ar: "تدوين العدسات" },
    { topic: "optics and refraction", num: "1.1.4", en: "notation of prisms", ar: "تدوين المواشير" },
    { topic: "optics and refraction", num: "1.1.5", en: "identification of unknown lenses", ar: "تحديد العدسات المجهولة" },
    { topic: "optics and refraction", num: "1.1.6", en: "aberrations of lenses", ar: "زيوغ العدسات" },
    { topic: "optics and refraction", num: "1.1.7", en: "lens materials", ar: "مواد العدسات" },
    { topic: "optics and refraction", num: "1.1.8", en: "clinical optics", ar: "البصريات السريرية" },
    { topic: "optics and refraction", num: "1.1.9", en: "visual acuity", ar: "حدة الإبصار" },
    { topic: "optics and refraction", num: "1.1.10", en: "ametropia", ar: "اعتلال الانكسار (أميتروبيا)" },
    { topic: "optics and refraction", num: "1.1.11", en: "optical parameters affecting retinal image size", ar: "العوامل البصرية المؤثرة على حجم صورة الشبكية" },
    { topic: "optics and refraction", num: "1.1.12", en: "accommodative problems", ar: "مشاكل التكيف البصري" },
    { topic: "optics and refraction", num: "1.1.13", en: "refractive errors", ar: "عيوب الانكسار" },
    { topic: "optics and refraction", num: "1.1.14", en: "correction of ametropia", ar: "تصحيح اعتلال الانكسار" },
    { topic: "optics and refraction", num: "1.1.15", en: "problems of spectacles in aphakia", ar: "مشاكل النظارات في انعدام العدسة" },
    { topic: "optics and refraction", num: "1.1.16", en: "calculation of intraocular lens power", ar: "حساب قوة العدسة داخل العين" },

    // ── Topic 3: general surgery (Course 4) ──
    { topic: "general surgery", num: "1.1.1", en: "basic surgical techniques", ar: "التقنيات الجراحية الأساسية" },
    { topic: "general surgery", num: "1.1.2", en: "types of anesthesia", ar: "أنواع التخدير" },
    { topic: "general surgery", num: "1.1.3", en: "thyroid diseases and thyroid eye disease", ar: "أمراض الغدة الدرقية ومرض العين الدرقي" },
    { topic: "general surgery", num: "1.1.4", en: "differential diagnosis of neck swelling", ar: "التشخيص التفريقي لتورم الرقبة" },
    { topic: "general surgery", num: "1.1.5", en: "shock and resuscitation", ar: "الصدمة والإنعاش" },
    { topic: "general surgery", num: "1.1.6", en: "haemorrhage", ar: "النزف" },
    { topic: "general surgery", num: "1.1.7", en: "facial fractures", ar: "كسور الوجه" },
    { topic: "general surgery", num: "1.1.8", en: "head trauma", ar: "إصابات الرأس" },

    // ── Topic 4: internal medicine and neurological diseases (Course 5, units 1 + 2) ──
    // chapter 1 = internal medicine
    { topic: "internal medicine and neurological diseases", num: "1.1.1", en: "diabetes mellitus and its complications", ar: "داء السكري ومضاعفاته" },
    { topic: "internal medicine and neurological diseases", num: "1.1.2", en: "hypertension and its complications", ar: "ارتفاع ضغط الدم ومضاعفاته" },
    { topic: "internal medicine and neurological diseases", num: "1.1.3", en: "eye manifestations in rheumatological diseases", ar: "المظاهر العينية في الأمراض الروماتيزمية" },
    { topic: "internal medicine and neurological diseases", num: "1.1.4", en: "renal diseases related to the eye", ar: "أمراض الكلى المرتبطة بالعين" },
    { topic: "internal medicine and neurological diseases", num: "1.1.5", en: "hyperviscosity disorders", ar: "اضطرابات فرط اللزوجة" },
    { topic: "internal medicine and neurological diseases", num: "1.1.6", en: "pituitary gland disorders", ar: "اضطرابات الغدة النخامية" },
    // chapter 2 = neurology
    { topic: "internal medicine and neurological diseases", num: "2.1.1", en: "ophthalmoplegia and cranial nerve palsies related to the eye", ar: "شلل العين وشلل الأعصاب القحفية المرتبطة بالعين" },
    { topic: "internal medicine and neurological diseases", num: "2.1.2", en: "visual field changes associated with optic pathway lesions", ar: "تغيرات المجال البصري المصاحبة لآفات المسار البصري" },
    { topic: "internal medicine and neurological diseases", num: "2.1.3", en: "eye manifestations of myasthenia gravis", ar: "المظاهر العينية للوهن العضلي الوبيل" },
    { topic: "internal medicine and neurological diseases", num: "2.1.4", en: "multiple sclerosis", ar: "التصلب المتعدد" },
    { topic: "internal medicine and neurological diseases", num: "2.1.5", en: "stroke", ar: "السكتة الدماغية" },

    // ── Topic 5: eye medicine (Course 6, Module 1) — chapter = subspecialty group ──
    // ch1: refraction, contact lenses, refractive surgery & low vision
    { topic: "eye medicine", num: "1.1.1", en: "myopia", ar: "قصر النظر" },
    { topic: "eye medicine", num: "1.1.2", en: "hypermetropia", ar: "طول النظر" },
    { topic: "eye medicine", num: "1.1.3", en: "astigmatism (regular, irregular, keratoconus)", ar: "الاستجماتيزم (المنتظم وغير المنتظم والقرنية المخروطية)" },
    { topic: "eye medicine", num: "1.1.4", en: "presbyopia", ar: "طول النظر الشيخوخي" },
    { topic: "eye medicine", num: "1.1.5", en: "media opacities", ar: "عتامات الأوساط الشفافة" },
    { topic: "eye medicine", num: "1.1.6", en: "contact lenses", ar: "العدسات اللاصقة" },
    { topic: "eye medicine", num: "1.1.7", en: "contact lens complications", ar: "مضاعفات العدسات اللاصقة" },
    // ch2: cornea, external diseases & refractive surgery
    { topic: "eye medicine", num: "2.1.1", en: "red eye", ar: "العين الحمراء" },
    { topic: "eye medicine", num: "2.1.2", en: "corneal ulcers", ar: "قرحات القرنية" },
    { topic: "eye medicine", num: "2.1.3", en: "infective corneal ulcers (bacterial, viral, fungal)", ar: "قرحات القرنية العدوائية (البكتيرية والفيروسية والفطرية)" },
    { topic: "eye medicine", num: "2.1.4", en: "non-infective corneal ulcers (allergic, degenerative, ischemic)", ar: "قرحات القرنية غير العدوائية (التحسسية والتنكسية ونقص التروية)" },
    { topic: "eye medicine", num: "2.1.5", en: "superficial and deep corneal opacities", ar: "عتامات القرنية السطحية والعميقة" },
    { topic: "eye medicine", num: "2.1.6", en: "inflammatory lesions of the skin of the lid", ar: "الآفات الالتهابية لجلد الجفن" },
    { topic: "eye medicine", num: "2.1.7", en: "chalazion and stye", ar: "البردة والشعيرة (الجليجل)" },
    { topic: "eye medicine", num: "2.1.8", en: "blepharitis", ar: "التهاب حافة الجفن" },
    { topic: "eye medicine", num: "2.1.9", en: "lid margin deformities", ar: "تشوهات حافة الجفن" },
    { topic: "eye medicine", num: "2.1.10", en: "conjunctival infections", ar: "عدوى الملتحمة" },
    { topic: "eye medicine", num: "2.1.11", en: "conjunctival degenerative lesions", ar: "الآفات التنكسية للملتحمة" },
    { topic: "eye medicine", num: "2.1.12", en: "xerosis", ar: "جفاف الملتحمة (الزيروزيس)" },
    // ch3: glaucoma
    { topic: "eye medicine", num: "3.1.1", en: "primary congenital glaucoma", ar: "الجلوكوما الخلقية الأولية" },
    { topic: "eye medicine", num: "3.1.2", en: "primary angle closure glaucoma", ar: "جلوكوما انسداد الزاوية الأولية" },
    { topic: "eye medicine", num: "3.1.3", en: "secondary angle closure glaucoma", ar: "جلوكوما انسداد الزاوية الثانوية" },
    { topic: "eye medicine", num: "3.1.4", en: "primary open angle glaucoma", ar: "الجلوكوما الأولية مفتوحة الزاوية" },
    { topic: "eye medicine", num: "3.1.5", en: "secondary open angle glaucoma", ar: "الجلوكوما الثانوية مفتوحة الزاوية" },
    // ch4: cataract
    { topic: "eye medicine", num: "4.1.1", en: "senile cataract", ar: "الساد الشيخوخي" },
    { topic: "eye medicine", num: "4.1.2", en: "complicated cataract", ar: "الساد المعقد" },
    { topic: "eye medicine", num: "4.1.3", en: "drug-induced cataract", ar: "الساد الناتج عن الأدوية" },
    { topic: "eye medicine", num: "4.1.4", en: "cataract in systemic diseases", ar: "الساد في الأمراض الجهازية" },
    // ch5: uveitis
    { topic: "eye medicine", num: "5.1.1", en: "acute anterior and posterior uveitis", ar: "التهاب العنبية الأمامي والخلفي الحاد" },
    { topic: "eye medicine", num: "5.1.2", en: "chronic uveitis", ar: "التهاب العنبية المزمن" },
    { topic: "eye medicine", num: "5.1.3", en: "inflammatory posterior uveitis", ar: "التهاب العنبية الخلفي الالتهابي" },
    // ch6: eye in systemic diseases
    { topic: "eye medicine", num: "6.1.1", en: "ocular changes in diabetes", ar: "التغيرات العينية في داء السكري" },
    { topic: "eye medicine", num: "6.1.2", en: "ocular changes in hypertension and atherosclerosis", ar: "التغيرات العينية في ارتفاع ضغط الدم وتصلب الشرايين" },
    { topic: "eye medicine", num: "6.1.3", en: "ocular changes in dysthyroid disease", ar: "التغيرات العينية في اضطراب الغدة الدرقية" },
    // ch7: neuro-ophthalmology
    { topic: "eye medicine", num: "7.1.1", en: "optic neuropathies", ar: "اعتلالات العصب البصري" },
    { topic: "eye medicine", num: "7.1.2", en: "ocular motor neuropathies", ar: "اعتلالات الأعصاب المحركة للعين" },
    { topic: "eye medicine", num: "7.1.3", en: "nystagmus", ar: "الرأرأة (تراقص العين)" },
    { topic: "eye medicine", num: "7.1.4", en: "pupillary abnormalities", ar: "اضطرابات حدقة العين" },
    { topic: "eye medicine", num: "7.1.5", en: "visual field defects", ar: "عيوب المجال البصري" },
    { topic: "eye medicine", num: "7.1.6", en: "myasthenia gravis", ar: "الوهن العضلي الوبيل" },
    { topic: "eye medicine", num: "7.1.7", en: "carotid-cavernous fistula", ar: "الناسور السباتي الكهفي" },
    // ch8: oculoplastic surgery and orbit
    { topic: "eye medicine", num: "8.1.1", en: "common craniosynostoses and other congenital malformations", ar: "تعظم الدروز الجمجمية الشائع والتشوهات الخلقية الأخرى" },
    { topic: "eye medicine", num: "8.1.2", en: "epiphora in children", ar: "الدماع (زيادة الدمع) عند الأطفال" },
    { topic: "eye medicine", num: "8.1.3", en: "canaliculitis, dacryocystitis, dacryoadenitis, preseptal and orbital cellulitis", ar: "التهاب القنية الدمعية وكيس الدمع والغدة الدمعية والنسيج الخلوي أمام الحاجز والحجاجي" },
    { topic: "eye medicine", num: "8.1.4", en: "thyroid ophthalmopathy", ar: "اعتلال العين الدرقي" },
    // ch9: vitreoretinal diseases
    { topic: "eye medicine", num: "9.1.1", en: "primary and secondary retinal detachment", ar: "انفصال الشبكية الأولي والثانوي" },
    { topic: "eye medicine", num: "9.1.2", en: "age-related macular degeneration (ARMD)", ar: "التنكس البقعي المرتبط بالعمر (ARMD)" },
    { topic: "eye medicine", num: "9.1.3", en: "choroidal neovascularization", ar: "الأوعية الدموية الوليدة المشيمية" },
    { topic: "eye medicine", num: "9.1.4", en: "high myopia", ar: "قصر النظر الشديد" },
    { topic: "eye medicine", num: "9.1.5", en: "macular holes", ar: "ثقوب البقعة الصفراء" },
    { topic: "eye medicine", num: "9.1.6", en: "cystoid macular edema", ar: "الوذمة البقعية الكيسية" },
    { topic: "eye medicine", num: "9.1.7", en: "central serous chorioretinopathy", ar: "اعتلال الشبكية والمشيمية المصلي المركزي" },
    { topic: "eye medicine", num: "9.1.8", en: "retinal arterial and venous obstructions", ar: "انسدادات شرايين وأوردة الشبكية" },
    { topic: "eye medicine", num: "9.1.9", en: "diabetic retinopathy", ar: "اعتلال الشبكية السكري" },
    { topic: "eye medicine", num: "9.1.10", en: "hypertensive retinopathy", ar: "اعتلال الشبكية الارتفاع ضغطي" },
    { topic: "eye medicine", num: "9.1.11", en: "peripheral retinal vascular occlusive disease", ar: "مرض انسداد الأوعية الطرفية للشبكية" },
    { topic: "eye medicine", num: "9.1.12", en: "acquired retinal vascular diseases", ar: "أمراض الأوعية الدموية الشبكية المكتسبة" },
    { topic: "eye medicine", num: "9.1.13", en: "retinal pigment epithelial detachment", ar: "انفصال طبقة الظهارة الصباغية للشبكية" },
    { topic: "eye medicine", num: "9.1.14", en: "posterior uveitis syndromes and endophthalmitis", ar: "متلازمات التهاب العنبية الخلفي والتهاب باطن المقلة" },
    // ch10: pediatric ophthalmology and strabismus
    { topic: "eye medicine", num: "10.1.1", en: "amblyopia", ar: "الغمش (كسل العين)" },
    { topic: "eye medicine", num: "10.1.2", en: "strabismus in children", ar: "الحول عند الأطفال" },
    { topic: "eye medicine", num: "10.1.3", en: "childhood cataract", ar: "الساد عند الأطفال" },
    { topic: "eye medicine", num: "10.1.4", en: "congenital cataract", ar: "الساد الخلقي" },
    { topic: "eye medicine", num: "10.1.5", en: "neonatal ophthalmia", ar: "الرمد الوليدي" },
    { topic: "eye medicine", num: "10.1.6", en: "dacryocystitis in children", ar: "التهاب كيس الدمع عند الأطفال" },
    // ch11: ocular oncology
    { topic: "eye medicine", num: "11.1.1", en: "conjunctival tumours", ar: "أورام الملتحمة" },
    // ch12: ophthalmic investigations
    { topic: "eye medicine", num: "12.1.1", en: "fluorescein angiography", ar: "تصوير الأوعية بالفلوريسين" },
    { topic: "eye medicine", num: "12.1.2", en: "indocyanine green angiography", ar: "تصوير الأوعية بأخضر الإندوسيانين" },
    { topic: "eye medicine", num: "12.1.3", en: "optical coherence tomography", ar: "التصوير المقطعي للترابط البصري (OCT)" },
    { topic: "eye medicine", num: "12.1.4", en: "pachymetry", ar: "قياس سُمك القرنية (باكيمتري)" },
    { topic: "eye medicine", num: "12.1.5", en: "perimetry", ar: "قياس المجال البصري (بيريمتري)" },
    { topic: "eye medicine", num: "12.1.6", en: "electrophysiological tests", ar: "الاختبارات الكهروفسيولوجية" },
    { topic: "eye medicine", num: "12.1.7", en: "red reflex examination", ar: "فحص المنعكس الأحمر" },
    { topic: "eye medicine", num: "12.1.8", en: "streak retinoscope use", ar: "استخدام مقياس الظل الشبكي الشريطي" },
    { topic: "eye medicine", num: "12.1.9", en: "ophthalmic ultrasonography", ar: "التصوير بالموجات فوق الصوتية للعين" },
    { topic: "eye medicine", num: "12.1.10", en: "keratometry", ar: "قياس تحدب القرنية (كيراتومتري)" },
    { topic: "eye medicine", num: "12.1.11", en: "contact lens fitting", ar: "تركيب العدسات اللاصقة" },
  ];

  private sortOrder(num: string): number {
    const parts = num.split(".");
    const ch = parseInt(parts[0], 10) || 0;
    const sec = parseInt(parts[1], 10) || 0;
    const lec = parseInt(parts[2], 10) || 0;
    return ch * 1_000_000 + sec * 1_000 + lec * 10;
  }

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    // ── Topics (all 8; part 2 reuses topics 6–7) ──
    const topicRows = this.TOPICS.map(([t, ar, ord]) => `('${q(t)}', '${q(ar)}', ${ord})`).join(", ");
    await queryRunner.query(`
      INSERT INTO "lecture_topics" ("departmentId", "title", "arTitle", "sortOrder")
      SELECT d."id", v.title, v."arTitle", v.ord
      FROM "departments" d
      CROSS JOIN (VALUES ${topicRows}) AS v(title, "arTitle", ord)
      WHERE d."code" = 'OPHTHAL'
    `);

    // ── Lectures (topics 0–5) — all level 'msc' (Master programme). Batched. ──
    const batchSize = 50;
    for (let i = 0; i < this.LECTURES.length; i += batchSize) {
      const batch = this.LECTURES.slice(i, i + batchSize);
      const rows = batch
        .map((l) => `('${q(l.topic)}', '${q(l.num)}', '${q(l.en)}', '${q(l.ar)}', 'msc', ${this.sortOrder(l.num)})`)
        .join(",\n          ");
      await queryRunner.query(`
        INSERT INTO "lectures" ("topicId", "lectureNumber", "title", "arTitle", "level", "sortOrder")
        SELECT lt."id", v.number, v.title, v."arTitle", v.level, v.ord
        FROM (VALUES ${rows}) AS v(topic, number, title, "arTitle", level, ord)
        JOIN "departments" d ON d."code" = 'OPHTHAL'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Deleting the OPHTHAL topics cascades to all their lectures (incl. any added by part 2).
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'OPHTHAL'
    `);
  }
}
