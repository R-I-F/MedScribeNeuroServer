import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ENT audit — MIG-D batch 2 of 3: nose / sinus / larynx / pharynx / tonsil / OSA diagnoses
 * (29 rows). Adenoid- and tonsil-hypertrophy rows are dual-linked to "obstructive sleep apnea".
 * INSERT ... ON CONFLICT("icdCode") DO NOTHING then link ENT dept + main_diags.
 */
export class AddEntDiagnosesBatch2750000000134 implements MigrationInterface {
  name = "AddEntDiagnosesBatch2750000000134";

  private async add(r: QueryRunner, code: string, en: string, ar: string, enD: string, arD: string, mds: string[]): Promise<void> {
    await r.query(
      `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("icdCode") DO NOTHING`, [code, en, ar, enD, arD]);
    await r.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = 'ENT' AND d."icdCode" = $1 ON CONFLICT DO NOTHING`, [code]);
    for (const md of mds) {
      await r.query(
        `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
         SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
         CROSS JOIN "diagnoses" d
         WHERE dept.code = 'ENT' AND md.title = $2 AND d."icdCode" = $1 ON CONFLICT DO NOTHING`, [code, md]);
    }
  }

  private async remove(r: QueryRunner, code: string): Promise<void> {
    await r.query(
      `DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
         AND "mainDiagId" IN (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'ENT')`, [code]);
    await r.query(
      `DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)
         AND "departmentId" = (SELECT id FROM "departments" WHERE code = 'ENT')`, [code]);
    await r.query(
      `DELETE FROM "diagnoses" WHERE "icdCode" = $1
         AND NOT EXISTS (SELECT 1 FROM "department_diagnoses" dd WHERE dd."diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1))`, [code]);
  }

  public async up(q: QueryRunner): Promise<void> {
    // ── chronic sinusitis ───────────────────────────────────────────────────────────
    await this.add(q, "CA08.0Z", "allergic rhinitis", "التهاب الأنف التحسسي",
      "IgE-mediated nasal inflammation with sneezing, rhinorrhoea and obstruction; a driver of chronic rhinosinusitis.",
      "التهاب أنفي وسيطه الغلوبولين المناعي E مع عطاس وسيلان وانسداد؛ من محرّكات التهاب الجيوب المزمن.",
      ["chronic sinusitis"]);
    await this.add(q, "CA0C", "cyst or mucocele of nose or nasal sinus", "كيسة أو قيلة مخاطية في الأنف أو الجيب الأنفي",
      "Mucus-filled expansile lesion of a paranasal sinus that can erode bone; treated by endoscopic marsupialisation.",
      "آفة متوسعة مملوءة بالمخاط في الجيب جانب الأنفي قد تتآكل العظم؛ تُعالَج بالتسقيف بالمنظار.",
      ["chronic sinusitis"]);
    await this.add(q, "CA01&XA1R64", "acute maxillary sinusitis", "التهاب الجيب الفكي الحاد",
      "Acute infection of the maxillary sinus; may be odontogenic and require drainage if complicated.",
      "عدوى حادة للجيب الفكي؛ قد تكون سنّية المنشأ وتتطلب التصريف عند حدوث مضاعفات.",
      ["chronic sinusitis"]);
    await this.add(q, "1F20.11", "chronic aspergillosis of the paranasal sinuses", "داء الرشاشيات المزمن للجيوب جانب الأنفية",
      "Non-invasive fungal ball or chronic granulomatous sinus aspergillosis; removed endoscopically.",
      "كرة فطرية غير غازية أو داء رشاشيات جيبي حبيبومي مزمن؛ يُزال بالمنظار.",
      ["chronic sinusitis"]);

    // ── deviated septum (nasal-airway disorders) ────────────────────────────────────
    await this.add(q, "CA0E", "hypertrophy of nasal turbinates", "تضخم القرينات الأنفية",
      "Enlarged inferior turbinates causing nasal obstruction; managed by turbinate reduction.",
      "تضخم القرينات السفلية مسبباً انسداداً أنفياً؛ يُدار بتصغير القرينات.",
      ["deviated septum"]);
    await this.add(q, "CA0Y&XA8D47", "perforation of nasal septum", "ثقب الحاجز الأنفي",
      "Septal defect from trauma, surgery, cocaine or vasculitis causing crusting, whistling and epistaxis.",
      "عيب حاجزي من رض أو جراحة أو كوكايين أو التهاب وعائي مسبباً تقشّراً وصفيراً ورعافاً.",
      ["deviated septum"]);
    await this.add(q, "CA0K.Y&XA43C9", "furuncle of nose", "دُمَّل الأنف",
      "Infection of the nasal vestibule; dangerous because of potential cavernous-sinus thrombosis spread.",
      "عدوى دهليز الأنف؛ خطيرة لاحتمال انتشارها إلى خثار الجيب الكهفي.",
      ["deviated septum"]);
    await this.add(q, "LA70.2", "choanal atresia", "رتق القمع الأنفي",
      "Congenital bony/membranous blockage of the posterior nasal aperture; bilateral form is a neonatal emergency.",
      "انسداد خلقي عظمي/غشائي للفتحة الأنفية الخلفية؛ الشكل الثنائي طارئ وليدي.",
      ["deviated septum"]);
    await this.add(q, "NA00.3&XJ1C6", "nasal septal haematoma", "ورم دموي في الحاجز الأنفي",
      "Subperichondrial septal blood collection after trauma; drained urgently to avoid septal abscess and saddle deformity.",
      "تجمع دموي تحت سمحاق غضروف الحاجز بعد رض؛ يُصرَّف عاجلاً لتجنب خراج الحاجز وتشوه السرج.",
      ["deviated septum"]);

    // ── nasal polyps ────────────────────────────────────────────────────────────────
    await this.add(q, "CA0J.Y", "antrochoanal polyp", "السليلة الفكية القمعية",
      "Solitary polyp arising in the maxillary antrum and prolapsing to the choana; excised endoscopically.",
      "سليلة منفردة تنشأ في الجيب الفكي وتتدلى إلى القمع الأنفي؛ تُستأصل بالمنظار.",
      ["nasal polyps"]);
    await this.add(q, "2E90.6", "juvenile nasopharyngeal angiofibroma", "الورم الليفي الوعائي للبلعوم الأنفي اليفعي",
      "Benign but locally aggressive vascular tumour of adolescent males; embolisation precedes surgical resection.",
      "ورم وعائي حميد لكن عدواني موضعياً عند الذكور المراهقين؛ يسبق الانصمام الاستئصالَ الجراحي.",
      ["nasal polyps"]);
    await this.add(q, "ND72.1", "foreign body in nostril", "جسم أجنبي في فتحة الأنف",
      "Nasal foreign body, common in children; removed to prevent aspiration and unilateral foul rhinorrhoea.",
      "جسم أجنبي أنفي، شائع عند الأطفال؛ يُزال لمنع الاستنشاق والسيلان الأنفي النتن أحادي الجانب.",
      ["nasal polyps"]);

    // ── laryngeal pathology ─────────────────────────────────────────────────────────
    await this.add(q, "CA0H.0", "paralysis of vocal cords or larynx", "شلل الحبلين الصوتيين أو الحنجرة",
      "Vocal-fold immobility from recurrent-laryngeal-nerve injury; causes hoarseness or airway compromise if bilateral.",
      "عدم حركة الحبل الصوتي من إصابة العصب الحنجري الراجع؛ يسبب بحّة أو اختلال المجرى الهوائي عند الثنائية.",
      ["laryngeal pathology"]);
    await this.add(q, "CA0H.2", "nodules of vocal cords", "عُقَيدات الحبلين الصوتيين",
      "Bilateral benign 'singer's nodules' from phonotrauma; treated with voice therapy, occasionally microsurgery.",
      "عُقَيدات حميدة ثنائية «عُقَيدات المغنين» من رض صوتي؛ تُعالَج بمعالجة الصوت وأحياناً الجراحة المجهرية.",
      ["laryngeal pathology"]);
    await this.add(q, "CA05.0", "acute laryngitis", "التهاب الحنجرة الحاد",
      "Acute self-limiting inflammation of the larynx with hoarseness, usually viral.",
      "التهاب حاد محدود ذاتياً للحنجرة مع بحّة، فيروسي عادة.",
      ["laryngeal pathology"]);
    await this.add(q, "LA71.0", "congenital laryngomalacia", "ليونة الحنجرة الخلقية",
      "Floppy supraglottic larynx; the commonest cause of neonatal stridor, occasionally needing supraglottoplasty.",
      "حنجرة فوق مزمارية رخوة؛ أشيع أسباب الصرير الوليدي، تحتاج أحياناً رأب فوق المزمار.",
      ["laryngeal pathology"]);
    await this.add(q, "CA0G", "chronic laryngitis or laryngotracheitis", "التهاب الحنجرة أو الحنجرة والرغامى المزمن",
      "Persistent laryngeal inflammation from reflux, smoking or voice abuse; includes Reinke oedema.",
      "التهاب حنجري مستمر من الجزر أو التدخين أو إساءة استخدام الصوت؛ يشمل وذمة راينكه.",
      ["laryngeal pathology"]);
    await this.add(q, "ND72.3", "foreign body in larynx", "جسم أجنبي في الحنجرة",
      "Laryngeal foreign body causing acute airway obstruction; an emergency requiring removal.",
      "جسم أجنبي حنجري مسبباً انسداداً حاداً للمجرى الهوائي؛ طارئ يتطلب الإزالة.",
      ["laryngeal pathology"]);
    await this.add(q, "CB62", "postprocedural subglottic stenosis", "تضيق تحت المزمار بعد الإجراءات",
      "Acquired subglottic narrowing, usually post-intubation; managed by dilation, laser or laryngotracheal reconstruction.",
      "تضيق مكتسب تحت المزمار، عادة بعد التنبيب؛ يُدار بالتوسيع أو الليزر أو إعادة بناء الحنجرة والرغامى.",
      ["laryngeal pathology"]);
    await this.add(q, "CA0H.Y", "granuloma of larynx", "حُبيبوم الحنجرة",
      "Posterior-glottic granuloma from intubation, reflux or vocal abuse; managed medically or by excision.",
      "حُبيبوم خلف مزماري من التنبيب أو الجزر أو إساءة استخدام الصوت؛ يُدار طبياً أو بالاستئصال.",
      ["laryngeal pathology"]);
    await this.add(q, "CA06.1", "acute epiglottitis and supraglottitis", "التهاب لسان المزمار وفوق المزمار الحاد",
      "Rapidly progressive supraglottic infection threatening the airway; an emergency requiring airway control.",
      "عدوى فوق مزمارية سريعة التطور تهدد المجرى الهوائي؛ طارئ يتطلب السيطرة على المجرى الهوائي.",
      ["laryngeal pathology"]);
    await this.add(q, "LA71.Y", "congenital laryngeal web", "الشبكة الحنجرية الخلقية",
      "Congenital glottic web from incomplete recanalisation; causes stridor or weak cry, divided endoscopically.",
      "شبكة مزمارية خلقية من عدم اكتمال إعادة التقني؛ تسبب صريراً أو بكاءً ضعيفاً، تُشَقّ بالمنظار.",
      ["laryngeal pathology"]);

    // ── tonsillitis & adenoid hypertrophy (hypertrophy rows dual-linked to OSA) ──────
    await this.add(q, "CA0F.1", "hypertrophy of adenoids", "تضخم اللحمية (الناميات الأنفية)",
      "Enlarged nasopharyngeal tonsil causing nasal obstruction and otitis media; adenoidectomy when symptomatic.",
      "تضخم اللوزة البلعومية الأنفية مسبباً انسداداً أنفياً والتهاب أذن وسطى؛ استئصال اللحمية عند الأعراض.",
      ["tonsillitis & adenoid hypertrophy", "obstructive sleep apnea"]);
    await this.add(q, "CA0F.0", "hypertrophy of tonsils", "تضخم اللوزتين",
      "Palatine-tonsil enlargement causing obstruction and dysphagia; a leading cause of paediatric sleep apnoea.",
      "تضخم اللوزتين الحنكيتين مسبباً انسداداً وعسر بلع؛ سبب رئيسي لانقطاع النفس النومي عند الأطفال.",
      ["tonsillitis & adenoid hypertrophy", "obstructive sleep apnea"]);
    await this.add(q, "CA0K.0", "retropharyngeal or parapharyngeal abscess", "خراج خلف البلعوم أو جانب البلعوم",
      "Deep-neck-space abscess threatening the airway and mediastinum; drained surgically with antibiotics.",
      "خراج في حيز الرقبة العميق يهدد المجرى الهوائي والمنصف؛ يُصرَّف جراحياً مع المضادات الحيوية.",
      ["tonsillitis & adenoid hypertrophy"]);
    await this.add(q, "DA01.30", "Ludwig angina", "ذبحة لودفيغ",
      "Bilateral submandibular-space cellulitis of dental origin causing floor-of-mouth swelling and airway threat.",
      "التهاب نسيج خلوي ثنائي في الحيز تحت الفك سنّي المنشأ مسبباً تورم أرضية الفم وتهديد المجرى الهوائي.",
      ["tonsillitis & adenoid hypertrophy"]);

    // ── obstructive sleep apnea ─────────────────────────────────────────────────────
    await this.add(q, "MD11.Y", "snoring", "الشخير",
      "Noisy vibratory breathing in sleep; evaluated as part of the sleep-disordered-breathing spectrum.",
      "تنفس اهتزازي صاخب أثناء النوم؛ يُقيَّم ضمن طيف اضطرابات التنفس النومي.",
      ["obstructive sleep apnea"]);
    await this.add(q, "7A40.Z", "central sleep apnoea", "انقطاع النفس النومي المركزي",
      "Apnoea from absent respiratory drive rather than upper-airway obstruction; distinguished on polysomnography.",
      "انقطاع نفس ناتج عن غياب الدافع التنفسي لا انسداد المجرى الهوائي العلوي؛ يُميَّز بتخطيط النوم.",
      ["obstructive sleep apnea"]);
    await this.add(q, "7A42.0", "obesity hypoventilation syndrome", "متلازمة نقص التهوية بالسمنة",
      "Daytime hypercapnia in obesity with sleep-disordered breathing; managed with non-invasive ventilation and weight loss.",
      "فرط ثاني أكسيد الكربون النهاري في السمنة مع اضطراب تنفس نومي؛ يُدار بالتهوية غير الباضعة وإنقاص الوزن.",
      ["obstructive sleep apnea"]);
  }

  public async down(q: QueryRunner): Promise<void> {
    for (const code of [
      "CA08.0Z", "CA0C", "CA01&XA1R64", "1F20.11",
      "CA0E", "CA0Y&XA8D47", "CA0K.Y&XA43C9", "LA70.2", "NA00.3&XJ1C6",
      "CA0J.Y", "2E90.6", "ND72.1",
      "CA0H.0", "CA0H.2", "CA05.0", "LA71.0", "CA0G", "ND72.3", "CB62", "CA0H.Y", "CA06.1", "LA71.Y",
      "CA0F.1", "CA0F.0", "CA0K.0", "DA01.30",
      "MD11.Y", "7A40.Z", "7A42.0",
    ]) {
      await this.remove(q, code);
    }
  }
}
