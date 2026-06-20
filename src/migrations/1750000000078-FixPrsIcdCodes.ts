import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * PRS ICD-11 audit — fixes 21 wrong/approximate codes on existing PRS diagnoses.
 *
 * The original PRS coverage (migration 019) used many out-of-chapter codes
 * (skin-disease "E*" codes for injuries, developmental "L*" codes for tumours,
 * etc.). All replacements verified via icd11_search (WHO ICD-11 2024-01).
 *
 * Two rows are shared with other departments and the fix corrects them there too:
 *   - NA14.0 → NA41.Z  brachial plexus injury (shared with NS)
 *   - LB20.0 → EK70.0Z epidermoid cyst        (shared with PEDSURG)
 *
 * Burns are re-anchored to the ICD-11 depth ladder (ND92.1/.2/.3, trunk being the
 * representative large surface — ICD-11 has no region-agnostic depth leaf) and
 * frostbite to the surgically-relevant "with tissue necrosis" leaf.
 *
 * Every changed row has "embedding" reset to NULL so the backfill re-embeds it.
 */
export class FixPrsIcdCodes1750000000078 implements MigrationInterface {
  name = "FixPrsIcdCodes1750000000078";

  // [oldCode, newCode] — concept unchanged, only the code + embedding are updated.
  private static readonly SIMPLE: [string, string][] = [
    ["ED00.0", "LA42.Z"], // cleft palate
    ["ED00.1", "LA40.Z"], // cleft lip
    ["EH61.0", "LB79.Z"], // syndactyly
    ["EH63.0", "LB78.Z"], // polydactyly
    ["ED91.0", "EE60.0Z"], // keloid scar
    ["ED91.1", "EE60.1"], // hypertrophic scar
    ["NA14.0", "NA41.Z"], // brachial plexus injury  (shared: NS)
    ["EK90.0", "EH90.Z"], // pressure ulcer
    ["LA70.0", "BD54"], // diabetic foot ulcer
    ["LA91.2", "1B71.Z"], // necrotizing fasciitis
    ["2F31.0", "2C32.Z"], // basal cell carcinoma
    ["2F33.0", "2C31.Z"], // cutaneous squamous cell carcinoma
    ["LB20.0", "EK70.0Z"], // epidermoid cyst  (shared: PEDSURG)
    ["2C30.0", "2C30.Z"], // melanoma of skin (parent → unspecified leaf)
    ["2E80.0", "2E80.0Z"], // lipoma (parent → unspecified leaf)
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── simple code-only recodes ──────────────────────────────────────────
    for (const [oldCode, newCode] of FixPrsIcdCodes1750000000078.SIMPLE) {
      await queryRunner.query(
        `UPDATE "diagnoses" SET "icdCode" = $1, "embedding" = NULL WHERE "icdCode" = $2`,
        [newCode, oldCode]
      );
    }

    // ── burns: re-anchor to ICD-11 depth ladder + rename ──────────────────
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode" = 'ND92.1',
        "icdName" = 'superficial partial-thickness burn',
        "icdArName" = 'حرق سطحي جزئي السماكة',
        "description" = 'A second-degree (superficial partial-thickness) burn involving the epidermis and superficial dermis; presents with painful, moist erythema and blistering; usually heals with dressings without surgery.',
        "arDescription" = 'حرق من الدرجة الثانية (سطحي جزئي السماكة) يشمل البشرة والأدمة السطحية؛ يتظاهر باحمرار رطب مؤلم وفقاعات؛ يلتئم عادةً بالضمادات دون جراحة.',
        "embedding" = NULL
      WHERE "icdCode" = 'EJ40.0'
    `);
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode" = 'ND92.2',
        "icdName" = 'deep partial-thickness burn',
        "icdArName" = 'حرق عميق جزئي السماكة',
        "description" = 'A deep second-degree (deep partial-thickness) burn extending into the deep dermis; presents with pale, less sensate skin and sluggish capillary refill; often requires tangential excision and skin grafting.',
        "arDescription" = 'حرق من الدرجة الثانية العميقة (عميق جزئي السماكة) يمتد إلى الأدمة العميقة؛ يتظاهر بجلد شاحب أقل إحساساً وامتلاء شعري بطيء؛ يحتاج غالباً إلى استئصال مماسي وتطعيم جلدي.',
        "embedding" = NULL
      WHERE "icdCode" = 'EJ41.0'
    `);
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode" = 'ND92.3',
        "icdName" = 'full-thickness burn',
        "icdArName" = 'حرق كامل السماكة',
        "description" = 'A third-degree (full-thickness) burn destroying the entire dermis; presents with a leathery, insensate, dry eschar; requires excision and skin grafting or flap reconstruction.',
        "arDescription" = 'حرق من الدرجة الثالثة (كامل السماكة) يدمّر كامل الأدمة؛ يتظاهر بخشارة جلدية متيبسة جافة عديمة الإحساس؛ يستلزم استئصالاً وتطعيماً جلدياً أو ترميماً بشريحة.',
        "embedding" = NULL
      WHERE "icdCode" = 'EJ42.0'
    `);
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode" = 'NE41',
        "icdName" = 'frostbite with tissue necrosis',
        "icdArName" = 'عضة الصقيع مع نخر النسيج',
        "description" = 'Deep frostbite causing tissue necrosis from a freezing injury, typically of fingers, toes, nose or ears; after demarcation the necrotic tissue requires debridement or amputation and reconstruction.',
        "arDescription" = 'عضة صقيع عميقة تسبب نخر النسيج نتيجة إصابة بالتجمد، وعادةً في الأصابع وأصابع القدم والأنف والأذنين؛ بعد التحدد يستلزم النسيج النخري التنضير أو البتر والترميم.',
        "embedding" = NULL
      WHERE "icdCode" = 'EJ50.0'
    `);

    // ── scar contracture → generic cutaneous scar (relinked in migration 079) ──
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode" = 'EH94',
        "icdName" = 'scar of skin',
        "icdArName" = 'ندبة جلدية',
        "description" = 'A symptomatic or disfiguring cutaneous scar (traumatic, post-surgical or post-burn) that may be unstable, adherent, contracted or cosmetically unacceptable; managed by scar revision, excision, Z-plasty or resurfacing.',
        "arDescription" = 'ندبة جلدية عرضية أو مشوّهة (رضية أو بعد جراحة أو بعد حرق) قد تكون غير مستقرة أو ملتصقة أو متقفعة أو غير مقبولة تجميلياً؛ تُعالج بتصحيح الندبة أو الاستئصال أو رأب Z أو إعادة التسطيح.',
        "embedding" = NULL
      WHERE "icdCode" = 'ED91.2'
    `);

    // ── giant cell tumour of soft tissue → cutaneous sarcoma ────────────────
    // The exact ICD-11 soft-parts GCT code (2F7C) is already taken (NS), as is
    // 2F7Z; recode this wrong-coded row to the free, PRS-relevant "Cutaneous
    // sarcoma" (2C35) — a wide-excision + reconstruction entity.
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode" = '2C35',
        "icdName" = 'cutaneous sarcoma',
        "icdArName" = 'الساركومة الجلدية',
        "description" = 'A malignant sarcoma arising in the skin or superficial soft tissue; treated by wide local excision with margin control and reconstruction of the resulting defect by graft or flap.',
        "arDescription" = 'ساركومة خبيثة تنشأ في الجلد أو النسيج الرخو السطحي؛ تُعالَج بالاستئصال الواسع الموضعي مع ضبط الحواف وترميم العيب الناتج بطعم أو شريحة.',
        "embedding" = NULL
      WHERE "icdCode" = '2B72.0'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [oldCode, newCode] of FixPrsIcdCodes1750000000078.SIMPLE) {
      await queryRunner.query(
        `UPDATE "diagnoses" SET "icdCode" = $1, "embedding" = NULL WHERE "icdCode" = $2`,
        [oldCode, newCode]
      );
    }
    // descriptions are left intact on revert (originals not preserved); only
    // the code/name/embedding are rolled back.
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode" = 'EJ40.0', "icdName" = 'burn of first degree', "icdArName" = 'حرق الدرجة الأولى', "embedding" = NULL
      WHERE "icdCode" = 'ND92.1'
    `);
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode" = 'EJ41.0', "icdName" = 'burn of second degree', "icdArName" = 'حرق الدرجة الثانية', "embedding" = NULL
      WHERE "icdCode" = 'ND92.2'
    `);
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode" = 'EJ42.0', "icdName" = 'burn of third degree', "icdArName" = 'حرق الدرجة الثالثة', "embedding" = NULL
      WHERE "icdCode" = 'ND92.3'
    `);
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode" = 'EJ50.0', "icdName" = 'frostbite', "icdArName" = 'عضة الصقيع', "embedding" = NULL
      WHERE "icdCode" = 'NE41'
    `);
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode" = 'ED91.2', "icdName" = 'contracture of scar', "icdArName" = 'تقفع الندبة', "embedding" = NULL
      WHERE "icdCode" = 'EH94'
    `);
    await queryRunner.query(`
      UPDATE "diagnoses" SET
        "icdCode" = '2B72.0', "icdName" = 'giant cell tumour of soft tissue', "icdArName" = 'ورم الخلايا العملاقة في الأنسجة الرخوة', "embedding" = NULL
      WHERE "icdCode" = '2C35'
    `);
  }
}
