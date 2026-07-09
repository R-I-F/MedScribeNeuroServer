import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ENT (Otolaryngology) academic lectures — transcribed from the ISCP Otolaryngology Curriculum
 * (Aug 2021), Appendix 2 "Otolaryngology Syllabus". Reference cited in
 * MEDICAL_CODE_AUDITS/ENT/LECTURES_ENT.md.
 *
 * The syllabus's Category → Topic structure maps onto the framework: lecture_topics = the 4 ENT
 * subspecialty CATEGORIES (Paediatric Otolaryngology, Otology, Rhinology, Head and Neck — Laryngology
 * and Thyroid/Parathyroid filed under Head and Neck), lectures = the Topic entries (each with its own
 * Objective). Per-topic Knowledge/Clinical/Technical bullets are lecture content, not separate lectures.
 * Anomalous singleton Category values (all SI = Rh) placed under Rhinology; one duplicate deduped;
 * "P2 P3 SI" competence-marker suffixes stripped from titles. Faithful transcription — nothing invented.
 * Each lecture is section 1 (KNOWLEDGE/CLINICAL), numbered <topic>.1.<n>. **`level` is NULL**: the ISCP
 * P2/P3/SI markers are training-phase tiers, NOT the Egyptian MSc/MD construct, so level is left NULL.
 * Bilingual (EN + AR).
 */
export class AuthorEntLectures1750000000214 implements MigrationInterface {
  name = "AuthorEntLectures1750000000214";

  // [englishTopic, arabicTopic] — 4 ISCP ENT subspecialty categories, in document order
  private readonly TOPICS: Array<[string, string]> = [
    ["paediatric otolaryngology", "أنف وأذن وحنجرة الأطفال"],
    ["otology", "طب الأذن"],
    ["rhinology", "طب الأنف"],
    ["head and neck", "الرأس والرقبة"],
  ];

  // section 1 = KNOWLEDGE/CLINICAL. { topic, en, ar } — Topic entries in document order.
  private readonly LECTURES: Array<{ topic: string; en: string; ar: string }> = [
    // ── 1. paediatric otolaryngology ──
    { topic: "paediatric otolaryngology", en: "foreign bodies in the ear canal and uadt", ar: "الأجسام الغريبة في قناة الأذن والسبيل الهوائي الهضمي العلوي" },
    { topic: "paediatric otolaryngology", en: "trauma to the ear, upper aero digestive tract and neck", ar: "إصابات الأذن والسبيل الهوائي الهضمي العلوي والرقبة" },
    { topic: "paediatric otolaryngology", en: "epistaxis in a child", ar: "الرعاف لدى الطفل" },
    { topic: "paediatric otolaryngology", en: "airway pathology in childhood", ar: "أمراض مجرى الهواء في الطفولة" },
    { topic: "paediatric otolaryngology", en: "the drooling child", ar: "الطفل المُسيل للُّعاب" },
    { topic: "paediatric otolaryngology", en: "acute tonsillitis, diseases of the adenoids and their complications", ar: "التهاب اللوزتين الحاد وأمراض الناميات (اللحمية) ومضاعفاتها" },
    { topic: "paediatric otolaryngology", en: "ent-related syndromes and cleft palate", ar: "المتلازمات المتعلقة بالأنف والأذن والحنجرة وشق الحنك" },
    { topic: "paediatric otolaryngology", en: "congenital and acquired neck masses", ar: "كتل الرقبة الخلقية والمكتسبة" },
    { topic: "paediatric otolaryngology", en: "language delay and dysphonia in childhood", ar: "تأخر اللغة وخلل الصوت في الطفولة" },
    { topic: "paediatric otolaryngology", en: "head and neck malignancy in childhood", ar: "الأورام الخبيثة للرأس والرقبة في الطفولة" },
    { topic: "paediatric otolaryngology", en: "congenital abnormalities of the ear", ar: "التشوهات الخلقية للأذن" },
    { topic: "paediatric otolaryngology", en: "congenital deafness", ar: "الصمم الخلقي" },
    { topic: "paediatric otolaryngology", en: "the dizzy child", ar: "الطفل المصاب بالدوار" },
    { topic: "paediatric otolaryngology", en: "otitis media (acute, chronic and with effusion) and complications and conditions of the external auditory canal", ar: "التهاب الأذن الوسطى (الحاد والمزمن والمصحوب بانصباب) ومضاعفاته وحالات قناة السمع الخارجية" },
    { topic: "paediatric otolaryngology", en: "facial palsy in childhood", ar: "شلل الوجه في الطفولة" },
    { topic: "paediatric otolaryngology", en: "rhinitis", ar: "التهاب الأنف" },
    { topic: "paediatric otolaryngology", en: "nasal obstruction", ar: "انسداد الأنف" },
    { topic: "paediatric otolaryngology", en: "obstructive sleep apnoea", ar: "انقطاع النفس النومي الانسدادي" },
    // ── 2. otology ──
    { topic: "otology", en: "non-infective, acquired lesions of the pinna and external ear canal", ar: "الآفات المكتسبة غير العدوائية للصيوان وقناة الأذن الخارجية" },
    { topic: "otology", en: "infective conditions of the pinna and external ear canal", ar: "الحالات العدوائية للصيوان وقناة الأذن الخارجية" },
    { topic: "otology", en: "trauma", ar: "الإصابات" },
    { topic: "otology", en: "acute otitis media and sequelae", ar: "التهاب الأذن الوسطى الحاد وعواقبه" },
    { topic: "otology", en: "chronic suppurative otitis media and sequelae", ar: "التهاب الأذن الوسطى القيحي المزمن وعواقبه" },
    { topic: "otology", en: "adult hearing loss", ar: "فقدان السمع لدى البالغين" },
    { topic: "otology", en: "tinnitus", ar: "طنين الأذن" },
    { topic: "otology", en: "facial palsy", ar: "شلل الوجه" },
    { topic: "otology", en: "disorders of balance", ar: "اضطرابات التوازن" },
    { topic: "otology", en: "lateral skull base tumours", ar: "أورام قاعدة الجمجمة الجانبية" },
    // ── 3. rhinology ──
    { topic: "rhinology", en: "epistaxis", ar: "الرعاف" },
    { topic: "rhinology", en: "nasal trauma and deformity", ar: "إصابة الأنف وتشوهه" },
    { topic: "rhinology", en: "acute and chronic rhinosinusitis", ar: "التهاب الأنف والجيوب الحاد والمزمن" },
    { topic: "rhinology", en: "nose and sinus inflammation including allergy", ar: "التهاب الأنف والجيوب بما في ذلك التحسس" },
    { topic: "rhinology", en: "congenital abnormalities of the nose and sinuses", ar: "التشوهات الخلقية للأنف والجيوب" },
    { topic: "rhinology", en: "facial pain", ar: "ألم الوجه" },
    { topic: "rhinology", en: "pituitary disease", ar: "أمراض الغدة النخامية" },
    { topic: "rhinology", en: "disorders of olfaction", ar: "اضطرابات الشم" },
    { topic: "rhinology", en: "sinonasal neoplasms including anterior skull base tumours", ar: "أورام الأنف والجيوب بما في ذلك أورام قاعدة الجمجمة الأمامية" },
    { topic: "rhinology", en: "csf leaks / skull base defect", ar: "تسرب السائل الدماغي الشوكي / عيب قاعدة الجمجمة" },
    { topic: "rhinology", en: "extended endonasal skull base procedures", ar: "إجراءات قاعدة الجمجمة الأنفية الموسعة" },
    { topic: "rhinology", en: "orbital disorders", ar: "اضطرابات الحجاج" },
    { topic: "rhinology", en: "septorhinoplasty", ar: "رأب الحاجز والأنف" },
    { topic: "rhinology", en: "congenital abnormalities of the face", ar: "التشوهات الخلقية للوجه" },
    { topic: "rhinology", en: "cosmetic surgery", ar: "الجراحة التجميلية" },
    { topic: "rhinology", en: "reconstruction", ar: "إعادة البناء" },
    // ── 4. head and neck ──
    { topic: "head and neck", en: "adenoid and tonsillar pathology in adults", ar: "أمراض الناميات واللوزتين لدى البالغين" },
    { topic: "head and neck", en: "airway obstruction in adults", ar: "انسداد مجرى الهواء لدى البالغين" },
    { topic: "head and neck", en: "aetiology and management of craniocervical trauma in adults", ar: "مسببات وتدبير إصابات القحف والعنق لدى البالغين" },
    { topic: "head and neck", en: "disorders of swallowing", ar: "اضطرابات البلع" },
    { topic: "head and neck", en: "aetiology and management of cervical sepsis", ar: "مسببات وتدبير الإنتان العنقي" },
    { topic: "head and neck", en: "cervical lymphadenopathy in adults", ar: "اعتلال العقد الليمفاوية العنقية لدى البالغين" },
    { topic: "head and neck", en: "head and neck malignancies in the upper aerodigestive tract excluding the oral cavity", ar: "الأورام الخبيثة للرأس والرقبة في السبيل الهوائي الهضمي العلوي باستثناء التجويف الفموي" },
    { topic: "head and neck", en: "investigation and management of the neck lump", ar: "فحص وتدبير كتلة الرقبة" },
    { topic: "head and neck", en: "neoplastic salivary gland disease", ar: "أمراض الغدد اللعابية الورمية" },
    { topic: "head and neck", en: "non-neoplastic salivary gland disease", ar: "أمراض الغدد اللعابية غير الورمية" },
    { topic: "head and neck", en: "thyroid and parathyroid disease", ar: "أمراض الغدة الدرقية وجارة الدرقية" },
    { topic: "head and neck", en: "oral pathology", ar: "أمراض الفم" },
    { topic: "head and neck", en: "sleep related breathing disorders", ar: "اضطرابات التنفس المتعلقة بالنوم" },
    { topic: "head and neck", en: "laryngology and voice disorders", ar: "طب الحنجرة واضطرابات الصوت" },
    { topic: "head and neck", en: "tracheostomy care module (adult)", ar: "وحدة رعاية فغر الرغامى (البالغون)" },
    { topic: "head and neck", en: "skin cancer", ar: "سرطان الجلد" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");

    // ── Topics (all 4) ──
    const topicRows = this.TOPICS.map(([en, ar], i) => `('${q(en)}', '${q(ar)}', ${i})`).join(",\n        ");
    await queryRunner.query(`
      INSERT INTO "lecture_topics" ("departmentId", "title", "arTitle", "sortOrder")
      SELECT d."id", v.title, v.ar, v.ord
      FROM "departments" d
      CROSS JOIN (VALUES ${topicRows}) AS v(title, ar, ord)
      WHERE d."code" = 'ENT'
    `);

    // ── Lectures (section 1, level NULL) ──
    const topicIndex = new Map(this.TOPICS.map(([en], i) => [en, i + 1]));
    const counters = new Map<string, number>();
    const rows = this.LECTURES.map((l) => {
      const c = topicIndex.get(l.topic)!;
      const n = (counters.get(l.topic) ?? 0) + 1;
      counters.set(l.topic, n);
      const num = `${c}.1.${n}`;
      const ord = c * 1_000_000 + 1_000 + n;
      return `('${q(l.topic)}', '${q(num)}', '${q(l.en)}', '${q(l.ar)}', ${ord})`;
    });
    const batchSize = 50;
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize).join(",\n          ");
      await queryRunner.query(`
        INSERT INTO "lectures" ("topicId", "lectureNumber", "title", "arTitle", "level", "sortOrder")
        SELECT lt."id", v.number, v.title, v.ar, NULL, v.ord
        FROM (VALUES ${batch}) AS v(topic, number, title, ar, ord)
        JOIN "departments" d ON d."code" = 'ENT'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Deleting the ENT topics cascades to their lectures.
    await queryRunner.query(`
      DELETE FROM "lecture_topics" lt
      USING "departments" d
      WHERE lt."departmentId" = d."id" AND d."code" = 'ENT'
    `);
  }
}
