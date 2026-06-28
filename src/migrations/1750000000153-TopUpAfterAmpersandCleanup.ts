import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Follow-up to migration 152 (ampersand-code removal). The 14 merges in 152 deduplicated
 * redundant rows, dropping VASC and HBP to 96 diagnoses and PEDSURG to 99, and the TRS
 * "immunologic rejection" category to 3. This migration restores every department to the
 * project's ≥100 floor and that category to ≥5 by adding genuinely-distinct, ICD-11-verified
 * diagnoses, plus links the (renamed) NE84 transplant-rejection row into immunologic rejection.
 * All codes icd11_search-verified single leaves.
 */
export class TopUpAfterAmpersandCleanup1750000000153 implements MigrationInterface {
  name = "TopUpAfterAmpersandCleanup1750000000153";

  private async add(r: QueryRunner, dept: string, code: string, en: string, ar: string, enD: string, arD: string, mds: string[]): Promise<void> {
    await r.query(
      `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
       VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("icdCode") DO NOTHING`, [code, en, ar, enD, arD]);
    await r.query(
      `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
       SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
       WHERE dept.code = $1 AND d."icdCode" = $2 ON CONFLICT DO NOTHING`, [dept, code]);
    for (const md of mds) {
      await r.query(
        `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
         SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
         CROSS JOIN "diagnoses" d WHERE dept.code = $1 AND md.title = $3 AND d."icdCode" = $2 ON CONFLICT DO NOTHING`,
        [dept, code, md]);
    }
  }
  private async remove(r: QueryRunner, code: string): Promise<void> {
    await r.query(`DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`, [code]);
    await r.query(`DELETE FROM "diagnoses" WHERE "icdCode" = $1`, [code]);
  }

  public async up(q: QueryRunner): Promise<void> {
    // ── VASC +4 ──────────────────────────────────────────────────────────────
    await this.add(q, "VASC", "4A44.8", "thromboangiitis obliterans (Buerger disease)", "التهاب الأوعية والخثار المسد (داء برغر)",
      "Inflammatory, segmental thrombotic occlusion of small and medium distal arteries in young smokers; causes digital ischaemia and may require amputation.",
      "انسداد خثاري التهابي مجزّأ للشرايين الصغيرة والمتوسطة البعيدة لدى المدخنين الشباب؛ يسبب إقفار الأصابع وقد يستلزم البتر.", ["peripheral artery disease"]);
    await this.add(q, "VASC", "BD42.Z", "Raynaud phenomenon", "ظاهرة رينو",
      "Episodic vasospasm of the digital arteries causing colour change and pain on cold or stress; severe secondary forms may cause digital ulceration.",
      "تشنّج وعائي نوبي للشرايين الإصبعية يسبب تبدّل اللون والألم مع البرد أو التوتر؛ قد تسبب الأشكال الثانوية الشديدة تقرّح الأصابع.", ["peripheral artery disease"]);
    await this.add(q, "VASC", "BD74.Z", "chronic venous insufficiency", "القصور الوريدي المزمن",
      "Chronic lower-limb venous hypertension from valvular incompetence causing oedema, skin changes and venous ulceration.",
      "ارتفاع ضغط وريدي مزمن في الطرف السفلي بسبب قصور الصمامات يسبب الوذمة وتبدلات الجلد والقرحة الوريدية.", ["varicose veins"]);
    await this.add(q, "VASC", "BD52.1", "acquired arteriovenous fistula", "الناسور الشرياني الوريدي المكتسب",
      "Abnormal acquired communication between an artery and vein (traumatic or iatrogenic) causing high-output shunting; repaired surgically or endovascularly.",
      "اتصال مكتسب شاذ بين شريان ووريد (رضّي أو علاجي المنشأ) يسبب تحويلاً عالي النتاج؛ يُصلَح جراحياً أو بالأشعة التداخلية.", ["arteriovenous fistula"]);

    // ── HBP +4 ───────────────────────────────────────────────────────────────
    await this.add(q, "HBP", "DC10.3", "polyp of gallbladder", "بوليب المرارة",
      "Mucosal projection of the gallbladder wall; cholesterol polyps are benign, but lesions over 1 cm warrant cholecystectomy for malignancy risk.",
      "نتوء مخاطي في جدار المرارة؛ بوليبات الكولسترول حميدة، لكن الآفات الأكبر من 1 سم تستدعي استئصال المرارة لخطر الخباثة.", ["cholecystitis & choledocholithiasis"]);
    await this.add(q, "HBP", "DB96.2Z", "primary sclerosing cholangitis", "التهاب الأقنية الصفراوية المصلّب البدئي",
      "Chronic fibrosing inflammation of intra- and extra-hepatic bile ducts; associated with IBD and cholangiocarcinoma, may progress to transplant.",
      "التهاب ليفي مزمن للأقنية الصفراوية داخل وخارج الكبد؛ يرتبط بالداء المعوي الالتهابي وسرطان الأقنية، وقد يتطوّر إلى الزرع.", ["biliary stricture"]);
    await this.add(q, "HBP", "2E81.0Y", "haemangioma of liver", "ورم وعائي دموي كبدي",
      "Commonest benign liver tumour, a vascular malformation usually found incidentally; large symptomatic lesions may need resection.",
      "أشيع ورم كبدي حميد، تشوّه وعائي يُكتشف عادةً عَرَضاً؛ قد تحتاج الآفات الكبيرة العَرَضية إلى الاستئصال.", ["benign liver lesions"]);
    await this.add(q, "HBP", "DC11.Y", "Mirizzi syndrome", "متلازمة ميريزي",
      "Extrinsic compression of the common hepatic duct by an impacted cystic-duct stone causing obstructive jaundice; needs careful surgical management.",
      "انضغاط خارجي للقناة الكبدية المشتركة بحصاة منحشرة في القناة المرارية يسبب يرقاناً انسدادياً؛ يحتاج تدبيراً جراحياً دقيقاً.", ["cholecystitis & choledocholithiasis"]);

    // ── PEDSURG +1 ───────────────────────────────────────────────────────────
    await this.add(q, "PEDSURG", "LB02", "gastroschisis", "انشقاق المعدة (انفتاق الأحشاء الخلقي)",
      "Congenital full-thickness abdominal wall defect, usually right of the umbilicus, with herniated bowel uncovered by a sac; repaired by primary or staged closure.",
      "عيب خلقي كامل السماكة في جدار البطن، عادةً يمين السرّة، مع انفتاق أمعاء دون كيس مغطٍّ؛ يُصلَح بإغلاق بدئي أو متدرّج.", ["abdominal wall defects"]);

    // ── TRS "immunologic rejection" → restore to 5 ───────────────────────────
    await this.add(q, "TRS", "3A20.4", "passenger lymphocyte syndrome (alloimmune haemolysis post-transplant)", "متلازمة اللمفاويات الراكبة (انحلال دم مناعي بعد الزرع)",
      "Donor-derived lymphocytes producing antibodies against recipient red cells after ABO-mismatched organ transplant, causing immune haemolytic anaemia.",
      "لمفاويات من المتبرّع تنتج أضداداً ضد كريات المتلقّي الحمراء بعد زرع عضو غير متوافق الزمر، مسبّبة فقر دم انحلالي مناعي.", ["immunologic rejection"]);
    // link the renamed NE84 (failure or rejection of transplanted organ) into immunologic rejection
    await q.query(
      `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
       SELECT md.id, d.id FROM "main_diags" md JOIN "departments" dept ON md."departmentId" = dept.id
       CROSS JOIN "diagnoses" d WHERE dept.code = 'TRS' AND md.title = 'immunologic rejection' AND d."icdCode" = 'NE84' ON CONFLICT DO NOTHING`);
  }

  public async down(q: QueryRunner): Promise<void> {
    await q.query(
      `DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'NE84')
         AND "mainDiagId" = (SELECT md.id FROM "main_diags" md JOIN "departments" d ON md."departmentId" = d.id WHERE d.code = 'TRS' AND md.title = 'immunologic rejection')`);
    for (const code of ["4A44.8","BD42.Z","BD74.Z","BD52.1","DC10.3","DB96.2Z","2E81.0Y","DC11.Y","LB02","3A20.4"]) await this.remove(q, code);
  }
}
