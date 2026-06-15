import { MigrationInterface, QueryRunner } from "typeorm";

export class ResolvePartialCptMatches1750000000044 implements MigrationInterface {
  name = "ResolvePartialCptMatches1750000000044";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. 61108-00 "burr holes" — description update ─────────────────────
    // CPT 61108 = twist drill hole for evacuation/drainage of subdural hematoma
    // (not a generic "burr holes" code — 61105 is burr hole for subdural puncture,
    //  61107 is for ventricular catheter; 61108 is specifically subdural hematoma drainage)
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "description" = 'Twist drill hole(s) for evacuation or drainage of subdural hematoma'
      WHERE "alphaCode" = 'CRAN' AND "numCode" = '61108-00'
    `);

    // ── 2. 61304-00 "craniotomy for further procedure" — description update ─
    // CPT 61304 = craniectomy or craniotomy for exploration, diagnosis, or
    // decompression of cranial nerves (not a generic surgical access code)
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "description" = 'Craniectomy or craniotomy for exploration, diagnosis, or decompression of cranial nerves'
      WHERE "alphaCode" = 'CRAN' AND "numCode" = '61304-00'
    `);

    // ── 3. 22513-00 "kyphoplasty" → "kyphoplasty (thoracic)" ─────────────
    // CPT 22513 = thoracic only. Lumbar kyphoplasty = 22514 (different code).
    // Title clarified so residents know this code is thoracic-level specific.
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title"       = 'kyphoplasty (thoracic)',
          "description" = 'Percutaneous vertebral augmentation (kyphoplasty), thoracic vertebral body, initial level'
      WHERE "alphaCode" = 'FUSN' AND "numCode" = '22513-00'
    `);

    // ── 4. 22630-01 "removal of prolapsed disc" → "discectomy (as part of interbody fusion)" ─
    // CPT 22630 includes discectomy as prep for posterior interbody fusion (PLIF/TLIF).
    // Standalone discectomy = 63030/63042. Title clarified to avoid confusion.
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title"       = 'discectomy (as part of interbody fusion)',
          "description" = 'Discectomy performed as part of posterior interbody arthrodesis (PLIF/TLIF); included in CPT 22630 — not standalone discectomy'
      WHERE "alphaCode" = 'FUSN' AND "numCode" = '22630-01'
    `);

    // ── 5. 22842 group — description updates (segment count scope) ─────────
    // CPT 22842 = posterior segmental instrumentation, 3–6 vertebral segments.
    // The 3–6 segment requirement is clinically important and was missing from descriptions.
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "description" = 'Posterior segmental instrumentation via hooks; 3 to 6 vertebral segments'
      WHERE "alphaCode" = 'FUSN' AND "numCode" = '22842-00'
    `);
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "description" = 'Posterior segmental instrumentation via pedicle screws and rods; 3 to 6 vertebral segments'
      WHERE "alphaCode" = 'FUSN' AND "numCode" = '22842-01'
    `);
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "description" = 'Posterior segmental instrumentation, other method; 3 to 6 vertebral segments'
      WHERE "alphaCode" = 'FUSN' AND "numCode" = '22842-02'
    `);

    // ── 6. 0274T-00 "Foraminotomy" → "percutaneous foraminotomy (cervical / thoracic)" ─
    // 0274T (Category III) is specifically percutaneous, cervical or thoracic only.
    // Open lumbar foraminotomy is coded as 63042 (already in DB).
    // Title and AR clarified to prevent residents from using this for open/lumbar cases.
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title"          = 'percutaneous foraminotomy (cervical / thoracic)',
          "description"    = 'Percutaneous laminotomy/foraminotomy, interlaminar approach, cervical or thoracic; soft tissue decompression (Category III tracking code)',
          "ar_title"       = 'توسيع الثقبة الفقرية بالجلد (عنقي / صدري)',
          "ar_description" = 'توسيع الثقبة الفقرية أو فتح الصفيحة الفقرية بتقنية جلدية عبر المنهج بين الصفائح لتخفيف ضغط الأنسجة الرخوة على المستوى العنقي أو الصدري.'
      WHERE "alphaCode" = 'LAM' AND "numCode" = '0274T-00'
    `);

    // ── 7. 20660-00 "traction and immobilization" → "cranial tongs / traction (Gardner-Wells)" ─
    // CPT 20660 = application of cranial tongs, caliper, or stereotactic frame.
    // Not a generic cervical traction code — it specifically codes the tong/caliper application.
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title"          = 'cranial tongs / traction (Gardner-Wells)',
          "description"    = 'Application of cranial tongs, caliper, or halo device (eg, Gardner-Wells) for cervical traction or immobilization',
          "ar_title"       = 'تثبيت عنقي بالملقط الرأسي (غاردنر-ويلز)',
          "ar_description" = 'تطبيق ملقط رأسي أو إطار هالو عبر دبابيس في الجمجمة لشد العمود الفقري العنقي أو تثبيته في حالات الصدمات أو عدم الاستقرار.'
      WHERE "alphaCode" = 'LAM' AND "numCode" = '20660-00'
    `);

    // ── 8. 11044-00 "debridment" → "debridement (bone)" ──────────────────
    // CPT 11044 = debridement of bone specifically (includes overlying soft tissue
    // if performed). General skin/subcutaneous debridement = 11042.
    // Also fixes the spelling error ("debridment" → "debridement").
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title"       = 'debridement (bone)',
          "description" = 'Debridement of bone (includes epidermis, dermis, subcutaneous tissue, muscle and/or fascia if performed); first 20 sq cm or less'
      WHERE "alphaCode" = 'MNR' AND "numCode" = '11044-00'
    `);

    // ── 9. 11044-01 "tissue excision" → "debridement (bone), additional" ──
    // Same code as 11044-00, same bone-debridement specificity. Title "tissue excision"
    // was misleadingly generic — bone debridement is what this code captures.
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title"       = 'debridement (bone), additional',
          "description" = 'Debridement of bone (includes overlying soft tissue if performed); additional 20 sq cm or less'
      WHERE "alphaCode" = 'MNR' AND "numCode" = '11044-01'
    `);

    // ── 10. 13121-00 "wound closure" → "complex wound repair (scalp / extremity)" ─
    // CPT 13121 = complex repair, scalp/arms/legs, 1.1–2.5 cm only.
    // Cannot be used for trunk, large wounds, or craniotomy closure (all included
    // in the primary procedure code). Title made specific so residents don't misapply it.
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title"       = 'complex wound repair (scalp / extremity)',
          "description" = 'Complex repair of scalp, arms, or legs; 1.1 to 2.5 cm'
      WHERE "alphaCode" = 'MNR' AND "numCode" = '13121-00'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restore exact original values from migration 040 (or 042 for 0274T)

    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title"       = 'wound closure',
          "description" = 'wound repair'
      WHERE "alphaCode" = 'MNR' AND "numCode" = '13121-00'
    `);

    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title"       = 'tissue excision',
          "description" = 'wound debridement'
      WHERE "alphaCode" = 'MNR' AND "numCode" = '11044-01'
    `);

    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title"       = 'debridment',
          "description" = 'wound debridement'
      WHERE "alphaCode" = 'MNR' AND "numCode" = '11044-00'
    `);

    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title"          = 'traction and immobilization',
          "description"    = 'cervical traction',
          "ar_title"       = 'شد الرقبة وتثبيتها',
          "ar_description" = 'تطبيق قوى شد على العمود الفقري العنقي بهدف تفريج الضغط عن الجذور العصبية والمفاصل.'
      WHERE "alphaCode" = 'LAM' AND "numCode" = '20660-00'
    `);

    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title"          = 'Foraminotomy',
          "description"    = 'Percutaneous foraminotomy',
          "ar_title"       = 'توسيع الثقبة الفقرية',
          "ar_description" = 'توسيع الثقبة الفقرية بتقنية جراحية للتخفيف من الضغط على الجذر العصبي الناتج عن تضيق الثقبة الفقرية.'
      WHERE "alphaCode" = 'LAM' AND "numCode" = '0274T-00'
    `);

    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "description" = 'posterior spinal instrumentation'
      WHERE "alphaCode" = 'FUSN' AND "numCode" = '22842-02'
    `);
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "description" = 'posterior spinal instrumentation'
      WHERE "alphaCode" = 'FUSN' AND "numCode" = '22842-01'
    `);
    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "description" = 'posterior spinal instrumentation'
      WHERE "alphaCode" = 'FUSN' AND "numCode" = '22842-00'
    `);

    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title"       = 'removal of prolapsed disc',
          "description" = 'arthrodesis, posterior interbody technique, including laminectomy and/or discectomy to prepare interspace; lumbar'
      WHERE "alphaCode" = 'FUSN' AND "numCode" = '22630-01'
    `);

    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "title"       = 'kyphoplasty',
          "description" = 'kyphoplasty'
      WHERE "alphaCode" = 'FUSN' AND "numCode" = '22513-00'
    `);

    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "description" = 'Removing skull section for brain surgery access.'
      WHERE "alphaCode" = 'CRAN' AND "numCode" = '61304-00'
    `);

    await queryRunner.query(`
      UPDATE "proc_cpts"
      SET "description" = 'Small skull openings to relieve pressure or access brain.'
      WHERE "alphaCode" = 'CRAN' AND "numCode" = '61108-00'
    `);
  }
}
