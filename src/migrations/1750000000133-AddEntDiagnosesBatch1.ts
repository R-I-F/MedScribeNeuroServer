import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ENT audit — MIG-D batch 1 of 3: ear / hearing / otitis / mastoid / tympanic-membrane
 * diagnoses (23 rows). INSERT ... ON CONFLICT("icdCode") DO NOTHING (some rows shared with
 * NS — e.g. 2A02.3 vestibular schwannoma, 8B88.0 Bell palsy), then link department_diagnoses
 * (ENT) + main_diag_diagnoses (by title). All ICD-11 codes icd11_search-verified (AUDIT_ENT.md 2D).
 */
export class AddEntDiagnosesBatch1750000000133 implements MigrationInterface {
  name = "AddEntDiagnosesBatch1750000000133";

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
    // ── hearing loss ────────────────────────────────────────────────────────────────
    await this.add(q, "AB54", "presbycusis", "صمم الشيخوخة",
      "Age-related bilateral sensorineural hearing loss; managed with hearing aids and audiological rehabilitation.",
      "فقدان السمع الحسي العصبي الثنائي المرتبط بالتقدم في العمر؛ يُدار بالمعينات السمعية وإعادة التأهيل السمعي.",
      ["hearing loss"]);
    await this.add(q, "AB37", "noise-induced hearing loss", "فقدان السمع المُحدَث بالضجيج",
      "Sensorineural hearing loss from chronic noise exposure, typically a 4 kHz audiometric notch; occupational and preventable.",
      "فقدان سمع حسي عصبي ناتج عن التعرض المزمن للضجيج، نموذجياً بانخفاض سمعي عند 4 كيلوهرتز؛ مهني وقابل للوقاية.",
      ["hearing loss"]);
    await this.add(q, "AB51.0", "acquired conductive hearing loss", "فقدان السمع التوصيلي المكتسب",
      "Hearing loss from impaired sound transmission through the external or middle ear; often surgically correctable.",
      "فقدان سمع ناتج عن خلل في توصيل الصوت عبر الأذن الخارجية أو الوسطى؛ غالباً قابل للتصحيح جراحياً.",
      ["hearing loss"]);
    await this.add(q, "MC41", "tinnitus", "طنين الأذن",
      "Perception of sound without an external source; investigated to exclude retrocochlear or vascular pathology.",
      "إدراك صوت دون مصدر خارجي؛ يُحقَّق فيه لاستبعاد أمراض ما خلف القوقعة أو الأمراض الوعائية.",
      ["hearing loss"]);
    await this.add(q, "2A02.3", "vestibular schwannoma (acoustic neuroma)", "الورم الشفاني الدهليزي (الورم العصبي السمعي)",
      "Benign tumour of the vestibular nerve at the cerebellopontine angle; presents with unilateral hearing loss and tinnitus.",
      "ورم حميد للعصب الدهليزي في الزاوية الجسرية المخيخية؛ يتظاهر بفقدان سمع أحادي الجانب وطنين.",
      ["hearing loss"]);
    await this.add(q, "AB30.1", "labyrinthitis", "التهاب التيه",
      "Inflammation of the inner-ear labyrinth causing vertigo and sensorineural hearing loss, often post-infectious.",
      "التهاب تيه الأذن الداخلية مسبباً الدوار وفقدان السمع الحسي العصبي، غالباً بعد عدوى.",
      ["hearing loss"]);
    await this.add(q, "AB30.0", "vestibular neuritis", "التهاب العصب الدهليزي",
      "Acute isolated vertigo from vestibular-nerve inflammation with preserved hearing; self-limiting.",
      "دوار حاد معزول ناتج عن التهاب العصب الدهليزي مع الحفاظ على السمع؛ محدود ذاتياً.",
      ["hearing loss"]);
    await this.add(q, "AB53", "ototoxic hearing loss", "فقدان السمع السُّمّي الأذني",
      "Sensorineural hearing loss caused by ototoxic drugs (aminoglycosides, cisplatin, loop diuretics).",
      "فقدان سمع حسي عصبي ناتج عن أدوية سامة للأذن (أمينوغليكوزيدات، سيسبلاتين، مدرات العروة).",
      ["hearing loss"]);
    await this.add(q, "AB51.Z", "acquired hearing impairment", "ضعف السمع المكتسب",
      "Acquired deafness of unspecified type; baseline category pending audiometric characterisation.",
      "صمم مكتسب غير محدد النوع؛ فئة أساسية بانتظار التوصيف بقياس السمع.",
      ["hearing loss"]);

    // ── otitis media with effusion (incl. external-ear infections) ───────────────────
    await this.add(q, "AA82", "chronic serous or mucoid otitis media", "التهاب الأذن الوسطى المصلي أو المخاطي المزمن",
      "Otitis media with effusion ('glue ear'); common in children, may require ventilation-tube insertion.",
      "التهاب الأذن الوسطى بالإفرازات («الأذن الصمغية»)؛ شائع عند الأطفال وقد يتطلب وضع أنبوب تهوية.",
      ["otitis media with effusion"]);
    await this.add(q, "AA3Z", "otitis externa", "التهاب الأذن الخارجية",
      "Inflammation of the external auditory canal; treated with aural toilet and topical antimicrobials.",
      "التهاب قناة الأذن الخارجية؛ يُعالَج بتنظيف الأذن ومضادات الميكروبات الموضعية.",
      ["otitis media with effusion"]);
    await this.add(q, "AA02", "malignant otitis externa", "التهاب الأذن الخارجية الخبيث",
      "Necrotising skull-base osteomyelitis from Pseudomonas, typically in diabetics; a surgical emergency.",
      "التهاب عظم قاعدة الجمجمة الناخر بالزائفة، نموذجياً عند مرضى السكري؛ طارئ جراحي.",
      ["otitis media with effusion"]);
    await this.add(q, "AB10.Z", "Eustachian tube dysfunction", "خلل وظيفة قناة استاكيوس",
      "Impaired middle-ear ventilation causing aural fullness and retraction; underlies effusion and cholesteatoma.",
      "ضعف تهوية الأذن الوسطى مسبباً امتلاء الأذن والانسحاب؛ يكمن خلف الإفرازات والورم الصفراوي.",
      ["otitis media with effusion"]);
    await this.add(q, "AB17", "adhesive middle ear disease", "مرض الأذن الوسطى اللاصق",
      "Retracted atelectatic tympanic membrane adherent to the middle-ear structures following chronic effusion.",
      "انسحاب طبلة الأذن الضامرة والتصاقها ببنى الأذن الوسطى بعد إفرازات مزمنة.",
      ["otitis media with effusion"]);
    await this.add(q, "AA42", "impacted cerumen", "انحشار الصملاخ",
      "Obstructing ear wax causing conductive hearing loss; removed by syringing, microsuction or curettage.",
      "صملاخ مُسِدّ يسبب فقدان سمع توصيلي؛ يُزال بالغسيل أو الشفط المجهري أو الكشط.",
      ["otitis media with effusion"]);
    await this.add(q, "AA40.2", "cholesteatoma of external auditory canal", "الورم الصفراوي لقناة الأذن الخارجية",
      "Keratin accumulation eroding the bony ear canal; debrided and may need canalplasty.",
      "تراكم الكيراتين المُتآكِل للقناة العظمية للأذن؛ يُنضَّر وقد يحتاج رأب القناة.",
      ["otitis media with effusion"]);
    await this.add(q, "NA00.2&XJ1C6&XA4E71", "haematoma of auricle", "ورم دموي في صيوان الأذن",
      "Subperichondrial blood collection from blunt trauma; drained urgently to prevent cauliflower-ear deformity.",
      "تجمع دموي تحت السمحاق الغضروفي من رض كليل؛ يُصرَّف بشكل عاجل لمنع تشوه أذن القرنبيط.",
      ["otitis media with effusion"]);
    await this.add(q, "AA04&XA6ZY6", "perichondritis of external ear", "التهاب سمحاق غضروف الأذن الخارجية",
      "Infection of auricular cartilage perichondrium, often post-piercing or trauma; risks cartilage necrosis.",
      "عدوى سمحاق غضروف الصيوان، غالباً بعد ثقب أو رض؛ يهدد بنخر الغضروف.",
      ["otitis media with effusion"]);

    // ── mastoiditis ─────────────────────────────────────────────────────────────────
    await this.add(q, "8B88.0", "facial nerve (Bell) palsy", "شلل العصب الوجهي (شلل بِل)",
      "Acute peripheral facial-nerve weakness; otogenic causes (otitis, cholesteatoma) are surgically relevant.",
      "ضعف حاد محيطي للعصب الوجهي؛ الأسباب الأذنية المنشأ (التهاب الأذن، الورم الصفراوي) ذات صلة جراحية.",
      ["mastoiditis"]);
    await this.add(q, "AB11.2", "petrositis", "التهاب العظم الصخري",
      "Spread of mastoid infection to the petrous apex; Gradenigo triad is the classic presentation.",
      "انتشار عدوى الخشاء إلى قمة العظم الصخري؛ ثالوث غرادينيغو هو التظاهر التقليدي.",
      ["mastoiditis"]);

    // ── tympanic membrane perforation ───────────────────────────────────────────────
    await this.add(q, "AB16", "tympanosclerosis", "تصلب الطبلة",
      "Hyaline/calcific plaques in the tympanic membrane and middle ear after chronic inflammation; may impair hearing.",
      "لويحات زجاجية/كلسية في طبلة الأذن والأذن الوسطى بعد التهاب مزمن؛ قد تُضعِف السمع.",
      ["tympanic membrane perforation"]);
    await this.add(q, "NA0A.2", "traumatic rupture of ear drum", "تمزق طبلة الأذن الرضحي",
      "Tympanic-membrane perforation from barotrauma, blast or penetrating injury; most heal spontaneously.",
      "ثقب طبلة الأذن من الرض الضغطي أو الانفجاري أو الإصابة النافذة؛ معظمها يلتئم تلقائياً.",
      ["tympanic membrane perforation"]);
    await this.add(q, "AB18", "discontinuity or dislocation of ear ossicles", "انقطاع أو خلع عُظيمات الأذن",
      "Ossicular-chain disruption (commonly incudostapedial) causing conductive hearing loss; treated by ossiculoplasty.",
      "انقطاع سلسلة العُظيمات (شائعاً السنديانية الركابية) مسبباً فقدان سمع توصيلي؛ يُعالَج برأب العُظيمات.",
      ["tympanic membrane perforation"]);
  }

  public async down(q: QueryRunner): Promise<void> {
    for (const code of [
      "AB54", "AB37", "AB51.0", "MC41", "2A02.3", "AB30.1", "AB30.0", "AB53", "AB51.Z",
      "AA82", "AA3Z", "AA02", "AB10.Z", "AB17", "AA42", "AA40.2", "NA00.2&XJ1C6&XA4E71", "AA04&XA6ZY6",
      "8B88.0", "AB11.2", "AB16", "NA0A.2", "AB18",
    ]) {
      await this.remove(q, code);
    }
  }
}
