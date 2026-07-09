import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OBGYN (Obstetrics & Gynaecology) academic lectures — transcribed from the RCOG "MRCOG Syllabus and
 * Knowledge Requirements for Core Curriculum" (Royal College of Obstetricians and Gynaecologists),
 * the "Detailed Knowledge Requirements" of its 15 core Knowledge Areas. Reference cited in
 * MEDICAL_CODE_AUDITS/OBGYN/LECTURES_OBGYN.md.
 *
 * Part 2 (final): Management of Delivery, Postpartum Problems, Gynaecological Problems, Subfertility, Sexual & Reproductive Health, Early Pregnancy Care, Gynaecological Oncology, Urogynaecology lectures. Topics created in migration 212.
 *
 * lecture_topics = the MRCOG Knowledge Areas; lectures = their Detailed Knowledge Requirement topics
 * (numbered <topic>.1.<n>). The two generic professional Knowledge Areas (Clinical skills; Teaching
 * and research) are excluded as non-OBGYN-specific competency content (documented in the audit file).
 * Faithful transcription — nothing invented (repeated "understand the epidemiology … of" boilerplate
 * reduced to the condition name). **`level` is NULL** on every row: MRCOG uses Part 1/2/3 competence
 * levels, NOT the Egyptian MSc/MD construct, so level is left NULL (sourced later) not guessed. Bilingual.
 */
export class AuthorObgynLecturesDeliveryPostpartumGynae1750000000213 implements MigrationInterface {
  name = "AuthorObgynLecturesDeliveryPostpartumGynae1750000000213";

  // topic → its index in the 13-topic list (for numbering <idx>.1.<n>)
  private readonly TOPIC_INDEX: Record<string, number> = {
    "management of delivery": 6,
    "postpartum problems": 7,
    "gynaecological problems": 8,
    "subfertility": 9,
    "sexual and reproductive health": 10,
    "early pregnancy care": 11,
    "gynaecological oncology": 12,
    "urogynaecology and pelvic floor problems": 13,
  };

  // section 1 = KNOWLEDGE. { topic, en, ar }
  private readonly LECTURES: Array<{ topic: string; en: string; ar: string }> = [
    // ── 6. management of delivery ──
    { topic: "management of delivery", en: "normal vaginal delivery", ar: "الولادة المهبلية الطبيعية" },
    { topic: "management of delivery", en: "operative vaginal delivery", ar: "الولادة المهبلية الجراحية" },
    { topic: "management of delivery", en: "complex vaginal delivery", ar: "الولادة المهبلية المعقدة" },
    { topic: "management of delivery", en: "retained placenta", ar: "احتباس المشيمة" },
    { topic: "management of delivery", en: "management of female genital mutilation", ar: "تدبير تشويه الأعضاء التناسلية الأنثوية" },
    { topic: "management of delivery", en: "malpresentation (brow, face, shoulder, variable lie)", ar: "سوء المجيء (الجبهي والوجهي والكتفي والوضع المتغير)" },
    { topic: "management of delivery", en: "malpositions", ar: "سوء الأوضاع" },
    { topic: "management of delivery", en: "manual rotation of the fetal head", ar: "التدوير اليدوي لرأس الجنين" },
    { topic: "management of delivery", en: "outlet forceps/ventouse", ar: "ملقط/محجم المخرج" },
    { topic: "management of delivery", en: "mid-cavity forceps/ventouse", ar: "ملقط/محجم منتصف الحوض" },
    { topic: "management of delivery", en: "rotational forceps/ventouse", ar: "الملقط/المحجم التدويري" },
    { topic: "management of delivery", en: "pelvic floor anatomy", ar: "تشريح قاع الحوض" },
    { topic: "management of delivery", en: "episiotomy", ar: "بضع الفرج (العجان)" },
    { topic: "management of delivery", en: "perineal trauma and repair", ar: "إصابة العجان وإصلاحها" },
    { topic: "management of delivery", en: "female genital mutilation", ar: "تشويه الأعضاء التناسلية الأنثوية" },
    { topic: "management of delivery", en: "assisted breech delivery", ar: "الولادة المقعدية بمساعدة" },
    { topic: "management of delivery", en: "breech extraction", ar: "استخراج المقعد" },
    { topic: "management of delivery", en: "twin delivery", ar: "ولادة التوأم" },
    { topic: "management of delivery", en: "high order multiple births", ar: "الولادات المتعددة عالية الرتبة" },
    { topic: "management of delivery", en: "shoulder dystocia", ar: "عسر ولادة الكتف" },
    { topic: "management of delivery", en: "caesarean section", ar: "العملية القيصرية" },
    { topic: "management of delivery", en: "anaesthesia", ar: "التخدير" },
    { topic: "management of delivery", en: "the unconscious patient", ar: "المريض فاقد الوعي" },
    { topic: "management of delivery", en: "resuscitation", ar: "الإنعاش" },
    { topic: "management of delivery", en: "intensive care", ar: "الرعاية المركزة" },
    // ── 7. postpartum problems ──
    { topic: "postpartum problems", en: "normal and abnormal postpartum period", ar: "فترة النفاس الطبيعية وغير الطبيعية" },
    { topic: "postpartum problems", en: "techniques for the control of postpartum haemorrhage", ar: "تقنيات السيطرة على نزف ما بعد الولادة" },
    { topic: "postpartum problems", en: "appropriate use of blood and blood products", ar: "الاستخدام الملائم للدم ومشتقاته" },
    { topic: "postpartum problems", en: "manual removal of placenta", ar: "الإزالة اليدوية للمشيمة" },
    { topic: "postpartum problems", en: "bimanual compression of uterus", ar: "الضغط اليدوي الثنائي على الرحم" },
    { topic: "postpartum problems", en: "exploration of genital tract", ar: "استكشاف القناة التناسلية" },
    { topic: "postpartum problems", en: "cervical laceration (identification and repair)", ar: "تمزق عنق الرحم (التعرف والإصلاح)" },
    { topic: "postpartum problems", en: "drug management of haemorrhage", ar: "التدبير الدوائي للنزف" },
    { topic: "postpartum problems", en: "balloon tamponade of uterus", ar: "الدك بالبالون للرحم" },
    { topic: "postpartum problems", en: "laparotomy including b lynch stitch", ar: "فتح البطن بما في ذلك غرزة بي-لينش" },
    { topic: "postpartum problems", en: "radiological embolisation", ar: "الانصمام الشعاعي" },
    { topic: "postpartum problems", en: "ligation of internal iliac arteries", ar: "ربط الشرايين الحرقفية الباطنة" },
    { topic: "postpartum problems", en: "caesarean hysterectomy", ar: "استئصال الرحم القيصري" },
    { topic: "postpartum problems", en: "perineal surgery", ar: "جراحة العجان" },
    { topic: "postpartum problems", en: "repair of episiotomy, second- third- fourth- degree laceration", ar: "إصلاح بضع الفرج والتمزق من الدرجة الثانية والثالثة والرابعة" },
    { topic: "postpartum problems", en: "retained placenta", ar: "احتباس المشيمة" },
    { topic: "postpartum problems", en: "postpartum and postoperative complications", ar: "مضاعفات ما بعد الولادة وما بعد الجراحة" },
    { topic: "postpartum problems", en: "postnatal review", ar: "المراجعة بعد الولادة" },
    { topic: "postpartum problems", en: "contraception", ar: "منع الحمل" },
    { topic: "postpartum problems", en: "postpartum and postoperative complications, including pathophysiology, diagnosis, management and prognosis in puerperal psychological disorders (blues, depression), mood disorders, reactions to pregnancy loss", ar: "مضاعفات ما بعد الولادة وما بعد الجراحة بما في ذلك الفيزيولوجيا المرضية والتشخيص والتدبير والمآل في الاضطرابات النفسية النفاسية (الكآبة والاكتئاب) واضطرابات المزاج وردود الفعل لفقدان الحمل" },
    { topic: "postpartum problems", en: "perperal sepsis, mastisis, urinary tract infection", ar: "الإنتان النفاسي والتهاب الثدي وعدوى المسالك البولية" },
    { topic: "postpartum problems", en: "breast cancer", ar: "سرطان الثدي" },
    { topic: "postpartum problems", en: "sequelae of obstetric events", ar: "عواقب الأحداث التوليدية" },
    { topic: "postpartum problems", en: "recognition of normality", ar: "التعرف على الحالة الطبيعية" },
    { topic: "postpartum problems", en: "resuscitation of newborn", ar: "إنعاش حديث الولادة" },
    { topic: "postpartum problems", en: "common problems of the neonate (aetiology, management sequelae)", ar: "المشاكل الشائعة لحديث الولادة (المسببات والتدبير والعواقب)" },
    { topic: "postpartum problems", en: "feeding", ar: "التغذية" },
    // ── 8. gynaecological problems ──
    { topic: "gynaecological problems", en: "paediatric gynaecology", ar: "أمراض النساء لدى الأطفال" },
    { topic: "gynaecological problems", en: "menstrual disorders", ar: "اضطرابات الطمث" },
    { topic: "gynaecological problems", en: "fibroids and non menstrual bleeding (intermenstrual, postcoital)", ar: "الأورام الليفية والنزف غير الطمثي (بين الطمثين وبعد الجماع)" },
    { topic: "gynaecological problems", en: "problems of the climacteric", ar: "مشاكل سن اليأس" },
    { topic: "gynaecological problems", en: "amenorrhoea and endocrine disorders", ar: "انقطاع الطمث والاضطرابات الصماوية" },
    { topic: "gynaecological problems", en: "vulval disorders", ar: "اضطرابات الفرج" },
    { topic: "gynaecological problems", en: "vaginal discharge (non sexually transmitted causes)", ar: "الإفرازات المهبلية (الأسباب غير المنقولة جنسيًا)" },
    { topic: "gynaecological problems", en: "pelvic pain", ar: "الألم الحوضي" },
    { topic: "gynaecological problems", en: "benign ovarian neoplasms and functional ovarian cysts", ar: "الأورام المبيضية الحميدة والكيسات المبيضية الوظيفية" },
    { topic: "gynaecological problems", en: "emergency gynaecology", ar: "طوارئ أمراض النساء" },
    { topic: "gynaecological problems", en: "congenital abnormalities of genital tract", ar: "الشذوذات الخلقية للقناة التناسلية" },
    { topic: "gynaecological problems", en: "puberty", ar: "البلوغ" },
    // ── 9. subfertility ──
    { topic: "subfertility", en: "indications, limitations and interpretation of investigations", ar: "دواعي وقيود وتفسير الفحوص" },
    { topic: "subfertility", en: "indications, techniques, limitations and complications of surgery in relation to", ar: "دواعي وتقنيات وقيود ومضاعفات الجراحة المتعلقة بنقص الخصوبة" },
    { topic: "subfertility", en: "indications, limitations and complications of assisted reproductive techniques", ar: "دواعي وقيود ومضاعفات تقنيات الإنجاب المساعد" },
    { topic: "subfertility", en: "legal and ethical issues", ar: "القضايا القانونية والأخلاقية" },
    { topic: "subfertility", en: "indications, limitations and interpretation of investigative techniques", ar: "دواعي وقيود وتفسير التقنيات الاستقصائية" },
    { topic: "subfertility", en: "operative investigative procedures", ar: "الإجراءات الاستقصائية الجراحية" },
    { topic: "subfertility", en: "indications, limitations and complications of surgery in relation to male and female infertility", ar: "دواعي وقيود ومضاعفات الجراحة المتعلقة بالعقم عند الذكور والإناث" },
    // ── 10. sexual and reproductive health ──
    { topic: "sexual and reproductive health", en: "reversible, irreversible and emergency contraception and termination of pregnancy", ar: "منع الحمل العكوس وغير العكوس والطارئ وإنهاء الحمل" },
    { topic: "sexual and reproductive health", en: "the laws relating to termination of pregnancy, sexually transmitted infections, (stis), consent, child protection and the sexual offences act 2003", ar: "القوانين المتعلقة بإنهاء الحمل والعداوى المنقولة جنسيًا والموافقة وحماية الطفل وقانون الجرائم الجنسية 2003" },
    { topic: "sexual and reproductive health", en: "recall the effect of addictive and self-harming behaviours, especially substance misuse and gambling, on personal and community health and poverty", ar: "استرجاع تأثير السلوكيات الإدمانية وإيذاء الذات، خاصة إساءة استخدام المواد والقمار، على الصحة الفردية والمجتمعية والفقر" },
    { topic: "sexual and reproductive health", en: "sexually transmitted infections including hiv/aids", ar: "العداوى المنقولة جنسيًا بما في ذلك فيروس نقص المناعة/الإيدز" },
    { topic: "sexual and reproductive health", en: "sexual problems", ar: "المشاكل الجنسية" },
    { topic: "sexual and reproductive health", en: "fertility control methods", ar: "طرق ضبط الخصوبة" },
    { topic: "sexual and reproductive health", en: "contraceptive failure", ar: "فشل وسائل منع الحمل" },
    { topic: "sexual and reproductive health", en: "non-use of contraception due to e.g. social factors, cultural factors, sexual/ domestic abuse, poor service access/delivery", ar: "عدم استخدام وسائل منع الحمل بسبب عوامل مثل العوامل الاجتماعية والثقافية والإساءة الجنسية/المنزلية وضعف الوصول للخدمة" },
    { topic: "sexual and reproductive health", en: "termination of pregnancy", ar: "إنهاء الحمل" },
    { topic: "sexual and reproductive health", en: "aftercare for termination of pregnancy", ar: "الرعاية اللاحقة لإنهاء الحمل" },
    { topic: "sexual and reproductive health", en: "other issues related to termination of pregnancy", ar: "القضايا الأخرى المتعلقة بإنهاء الحمل" },
    { topic: "sexual and reproductive health", en: "gender dysphoria", ar: "اضطراب الهوية الجنسية" },
    { topic: "sexual and reproductive health", en: "socio-economic consequences", ar: "العواقب الاجتماعية الاقتصادية" },
    { topic: "sexual and reproductive health", en: "management options", ar: "خيارات التدبير" },
    { topic: "sexual and reproductive health", en: "sexually transmitted infections including hiv/ aids", ar: "العداوى المنقولة جنسيًا بما في ذلك فيروس نقص المناعة/الإيدز" },
    { topic: "sexual and reproductive health", en: "referral pathways to local expertise in the field of psychosexual medicine and sexual dysfunction", ar: "مسارات الإحالة إلى الخبرة المحلية في مجال الطب النفسي الجنسي والخلل الوظيفي الجنسي" },
    // ── 11. early pregnancy care ──
    { topic: "early pregnancy care", en: "trophoblastic disease and ectopic pregnancy", ar: "الداء الأرومي الغاذي والحمل خارج الرحم" },
    { topic: "early pregnancy care", en: "medical management of ectopic pregnancy", ar: "التدبير الطبي للحمل خارج الرحم" },
    { topic: "early pregnancy care", en: "indications and limitations of investigations", ar: "دواعي وقيود الفحوص" },
    { topic: "early pregnancy care", en: "understanding of management options", ar: "فهم خيارات التدبير" },
    { topic: "early pregnancy care", en: "prognosis after miscarriage(s) and ectopic pregnancy", ar: "المآل بعد الإجهاض والحمل خارج الرحم" },
    // ── 12. gynaecological oncology ──
    { topic: "gynaecological oncology", en: "figo classifications for gynaecological tumours", ar: "تصنيفات FIGO لأورام النساء" },
    { topic: "gynaecological oncology", en: "palliative and terminal care", ar: "الرعاية التلطيفية ورعاية المرحلة النهائية" },
    { topic: "gynaecological oncology", en: "relief of symptoms", ar: "تخفيف الأعراض" },
    { topic: "gynaecological oncology", en: "community support roles", ar: "أدوار الدعم المجتمعي" },
    { topic: "gynaecological oncology", en: "indications and limitations in relation to screening and investigative techniques", ar: "الدواعي والقيود المتعلقة بالمسح الكشفي والتقنيات الاستقصائية" },
    { topic: "gynaecological oncology", en: "diagnostic imaging", ar: "التصوير التشخيصي" },
    { topic: "gynaecological oncology", en: "awareness of hpv vaccination", ar: "الوعي بالتطعيم ضد فيروس الورم الحليمي البشري" },
    { topic: "gynaecological oncology", en: "knowledge of gynaecological oncology multidisciplinary team meeting", ar: "معرفة اجتماع الفريق متعدد التخصصات لأورام النساء" },
    // ── 13. urogynaecology and pelvic floor problems ──
    { topic: "urogynaecology and pelvic floor problems", en: "indications and limitations of investigations", ar: "دواعي وقيود الفحوص" },
    { topic: "urogynaecology and pelvic floor problems", en: "indications, techniques, limitations and complications of non-surgical treatment", ar: "دواعي وتقنيات وقيود ومضاعفات العلاج غير الجراحي" },
    { topic: "urogynaecology and pelvic floor problems", en: "indications, techniques, limitations and complications of drug treatment", ar: "دواعي وتقنيات وقيود ومضاعفات العلاج الدوائي" },
    { topic: "urogynaecology and pelvic floor problems", en: "indications, techniques, limitations and complications of surgical treatment", ar: "دواعي وتقنيات وقيود ومضاعفات العلاج الجراحي" },
    { topic: "urogynaecology and pelvic floor problems", en: "indications and limitations of urodynamic investigations", ar: "دواعي وقيود فحوص ديناميكا البول" },
    { topic: "urogynaecology and pelvic floor problems", en: "indications and limitations of imaging", ar: "دواعي وقيود التصوير" },
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    const q = (s: string) => s.replace(/'/g, "''");
    const topicIndex = new Map(Object.entries(this.TOPIC_INDEX));

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
        JOIN "departments" d ON d."code" = 'OBGYN'
        JOIN "lecture_topics" lt ON lt."departmentId" = d."id" AND lt."title" = v.topic
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      DELETE FROM "lectures" lx
      USING "lecture_topics" lt, "departments" d
      WHERE lx."topicId" = lt."id" AND lt."departmentId" = d."id" AND d."code" = 'OBGYN'
        AND lt."title" IN ('management of delivery', 'postpartum problems', 'gynaecological problems', 'subfertility', 'sexual and reproductive health', 'early pregnancy care', 'gynaecological oncology', 'urogynaecology and pelvic floor problems')
    `);
  }
}
