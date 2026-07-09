import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OPHTHAL (Ophthalmology) academic lectures — PART 2 of 2.
 *
 * Adds the eye-surgery and eye-pathology lectures (Course 6, Modules 2 & 3) to the two topics
 * created by PART 1 (migration 215). Same source, same rules as PART 1:
 *   "Master (MSC) Degree Program and Courses Specifications for Ophthalmology",
 *   Department of Ophthalmology, Faculty of Medicine, Assiut University, 2021-2022/2022-2023.
 *   Citation in MEDICAL_CODE_AUDITS/OPHTHAL/LECTURES_OPHTHAL.md.
 *
 * Split out because the full OPHTHAL curriculum exceeds ~180 VALUES rows. **`level` = 'msc' on
 * every row** (the Master programme). Bilingual (EN + AR). The two topics ('eye surgery',
 * 'eye pathology') already exist (created by 215); this migration only inserts lectures.
 *
 * down() deletes only the lectures under those two OPHTHAL topics (it does NOT drop the topics —
 * 215 owns them). Full teardown order is 217 then 215 (reverse-timestamp), which is correct.
 */
export class AuthorOphthalLecturesPart21750000000217 implements MigrationInterface {
  name = "AuthorOphthalLecturesPart21750000000217";

  // { topic, num, en, ar } — level 'msc' for all. sortOrder derived.
  private readonly LECTURES: Array<{ topic: string; num: string; en: string; ar: string }> = [
    // ── Topic 6: eye surgery (Course 6, Module 2) — chapter = subspecialty group ──
    // ch1: refraction, contact lenses, refractive surgery & low vision
    { topic: "eye surgery", num: "1.1.1", en: "microbial keratitis with contact lens wear", ar: "التهاب القرنية الميكروبي مع ارتداء العدسات اللاصقة" },
    { topic: "eye surgery", num: "1.1.2", en: "keratitis after laser surgery", ar: "التهاب القرنية بعد جراحة الليزر" },
    { topic: "eye surgery", num: "1.1.3", en: "errors of refraction", ar: "عيوب الانكسار" },
    { topic: "eye surgery", num: "1.1.4", en: "blindness and low vision", ar: "العمى وضعف البصر" },
    // ch2: cornea, external diseases & refractive surgery
    { topic: "eye surgery", num: "2.1.1", en: "lid inflammations", ar: "التهابات الجفن" },
    { topic: "eye surgery", num: "2.1.2", en: "lid tumours", ar: "أورام الجفن" },
    { topic: "eye surgery", num: "2.1.3", en: "conjunctival infections", ar: "عدوى الملتحمة" },
    { topic: "eye surgery", num: "2.1.4", en: "conjunctival inflammations", ar: "التهابات الملتحمة" },
    { topic: "eye surgery", num: "2.1.5", en: "conjunctival degeneration", ar: "تنكس الملتحمة" },
    { topic: "eye surgery", num: "2.1.6", en: "corneal ulcerative and non-ulcerative lesions", ar: "آفات القرنية التقرحية وغير التقرحية" },
    { topic: "eye surgery", num: "2.1.7", en: "different types of keratitis", ar: "أنواع مختلفة من التهاب القرنية" },
    // ch3: glaucoma
    { topic: "eye surgery", num: "3.1.1", en: "congenital glaucoma", ar: "الجلوكوما الخلقية" },
    { topic: "eye surgery", num: "3.1.2", en: "angle closure glaucoma", ar: "جلوكوما انسداد الزاوية" },
    { topic: "eye surgery", num: "3.1.3", en: "open angle glaucoma", ar: "الجلوكوما مفتوحة الزاوية" },
    { topic: "eye surgery", num: "3.1.4", en: "ocular hypertension", ar: "ارتفاع ضغط العين" },
    { topic: "eye surgery", num: "3.1.5", en: "low tension glaucoma", ar: "الجلوكوما منخفضة التوتر" },
    { topic: "eye surgery", num: "3.1.6", en: "secondary glaucomas (lens-induced, neovascular, uveitic, haemorrhagic, silicone-filled eyes)", ar: "الجلوكوما الثانوية (المستحثة بالعدسة والوعائية الوليدة والعنبية والنزفية والعيون المملوءة بالسيليكون)" },
    { topic: "eye surgery", num: "3.1.7", en: "traumatic glaucomas", ar: "الجلوكوما الرضحية" },
    // ch4: cataract
    { topic: "eye surgery", num: "4.1.1", en: "different types of cataract", ar: "أنواع الساد المختلفة" },
    { topic: "eye surgery", num: "4.1.2", en: "postoperative complications of cataract surgery", ar: "مضاعفات ما بعد جراحة الساد" },
    // ch5: uveitis
    { topic: "eye surgery", num: "5.1.1", en: "anterior uveitis", ar: "التهاب العنبية الأمامي" },
    { topic: "eye surgery", num: "5.1.2", en: "posterior uveitis", ar: "التهاب العنبية الخلفي" },
    { topic: "eye surgery", num: "5.1.3", en: "uveitis in children", ar: "التهاب العنبية عند الأطفال" },
    // ch6: eye in systemic diseases
    { topic: "eye surgery", num: "6.1.1", en: "ocular complications of diabetes", ar: "المضاعفات العينية لداء السكري" },
    { topic: "eye surgery", num: "6.1.2", en: "ocular complications of blood disorders", ar: "المضاعفات العينية لاضطرابات الدم" },
    { topic: "eye surgery", num: "6.1.3", en: "ocular complications of endocrinal disorders", ar: "المضاعفات العينية لاضطرابات الغدد الصماء" },
    // ch7: neuro-ophthalmology
    { topic: "eye surgery", num: "7.1.1", en: "visual pathway abnormalities", ar: "اضطرابات المسار البصري" },
    { topic: "eye surgery", num: "7.1.2", en: "myasthenia gravis", ar: "الوهن العضلي الوبيل" },
    { topic: "eye surgery", num: "7.1.3", en: "optic neuropathies", ar: "اعتلالات العصب البصري" },
    // ch8: oculoplastic surgery and orbit
    { topic: "eye surgery", num: "8.1.1", en: "orbital inflammations", ar: "التهابات الحجاج" },
    { topic: "eye surgery", num: "8.1.2", en: "lacrimal gland disorders", ar: "اضطرابات الغدة الدمعية" },
    { topic: "eye surgery", num: "8.1.3", en: "lacrimal drainage system disorders (canaliculi, sac, duct)", ar: "اضطرابات جهاز تصريف الدمع (القنيات والكيس والقناة)" },
    // ch9: vitreoretinal diseases
    { topic: "eye surgery", num: "9.1.1", en: "retinal detachment", ar: "انفصال الشبكية" },
    { topic: "eye surgery", num: "9.1.2", en: "retinopathies", ar: "اعتلالات الشبكية" },
    { topic: "eye surgery", num: "9.1.3", en: "maculopathies", ar: "اعتلالات البقعة الصفراء" },
    { topic: "eye surgery", num: "9.1.4", en: "intraocular infections", ar: "العدوى داخل العين" },
    { topic: "eye surgery", num: "9.1.5", en: "retinopathy of prematurity (ROP)", ar: "اعتلال الشبكية عند الخُدّج (ROP)" },
    { topic: "eye surgery", num: "9.1.6", en: "cryotherapy burn", ar: "حرق العلاج بالتبريد" },
    // ch10: pediatric ophthalmology and strabismus
    { topic: "eye surgery", num: "10.1.1", en: "neonatal ophthalmia", ar: "الرمد الوليدي" },
    { topic: "eye surgery", num: "10.1.2", en: "dacryocystitis in children", ar: "التهاب كيس الدمع عند الأطفال" },
    { topic: "eye surgery", num: "10.1.3", en: "amblyopia", ar: "الغمش (كسل العين)" },
    { topic: "eye surgery", num: "10.1.4", en: "strabismus in children", ar: "الحول عند الأطفال" },
    { topic: "eye surgery", num: "10.1.5", en: "childhood cataract", ar: "الساد عند الأطفال" },
    { topic: "eye surgery", num: "10.1.6", en: "congenital cataract", ar: "الساد الخلقي" },
    // ch11: ocular oncology
    { topic: "eye surgery", num: "11.1.1", en: "retinoblastoma", ar: "الورم الأرومي الشبكي" },
    { topic: "eye surgery", num: "11.1.2", en: "benign and malignant melanomas", ar: "الأورام الميلانينية الحميدة والخبيثة" },

    // ── Topic 7: eye pathology (Course 6, Module 3) ──
    { topic: "eye pathology", num: "1.1.1", en: "pathology of the eyelid", ar: "باثولوجيا الجفن" },
    { topic: "eye pathology", num: "1.1.2", en: "pathology of the conjunctiva", ar: "باثولوجيا الملتحمة" },
    { topic: "eye pathology", num: "1.1.3", en: "pathology of the cornea", ar: "باثولوجيا القرنية" },
    { topic: "eye pathology", num: "1.1.4", en: "pathology of the iris", ar: "باثولوجيا القزحية" },
    { topic: "eye pathology", num: "1.1.5", en: "pathology of the lens", ar: "باثولوجيا العدسة" },
    { topic: "eye pathology", num: "1.1.6", en: "pathology of the ciliary body", ar: "باثولوجيا الجسم الهدبي" },
    { topic: "eye pathology", num: "1.1.7", en: "pathology of the ciliary processes", ar: "باثولوجيا النتوءات الهدبية" },
    { topic: "eye pathology", num: "1.1.8", en: "pathology of the anterior chamber angle", ar: "باثولوجيا زاوية الحجرة الأمامية" },
    { topic: "eye pathology", num: "1.1.9", en: "pathology of the sclera and episcleral structures", ar: "باثولوجيا الصلبة والتراكيب فوق الصلبة" },
    { topic: "eye pathology", num: "1.1.10", en: "pathology of the vitreous", ar: "باثولوجيا الجسم الزجاجي" },
    { topic: "eye pathology", num: "1.1.11", en: "pathology of the optic nerve", ar: "باثولوجيا العصب البصري" },
    { topic: "eye pathology", num: "1.1.12", en: "pathology of the visual pathway", ar: "باثولوجيا المسار البصري" },
    { topic: "eye pathology", num: "1.1.13", en: "pathology of the macula", ar: "باثولوجيا البقعة الصفراء" },
    { topic: "eye pathology", num: "1.1.14", en: "pathology of the retina", ar: "باثولوجيا الشبكية" },
    { topic: "eye pathology", num: "1.1.15", en: "pathology of the choroid", ar: "باثولوجيا المشيمية" },
    { topic: "eye pathology", num: "1.1.16", en: "pathology of the orbit", ar: "باثولوجيا الحجاج" },
    { topic: "eye pathology", num: "1.1.17", en: "ocular infections", ar: "العدوى العينية" },
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
    // Delete only the lectures under the two part-2 topics (do NOT drop the topics — 215 owns them).
    await queryRunner.query(`
      DELETE FROM "lectures" lx
      USING "lecture_topics" lt, "departments" d
      WHERE lx."topicId" = lt."id"
        AND lt."departmentId" = d."id"
        AND d."code" = 'OPHTHAL'
        AND lt."title" IN ('eye surgery', 'eye pathology')
    `);
  }
}
