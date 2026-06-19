import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ORTHO proc_cpt corrections after full AAPC CPT verification (2026-06-19).
 *
 * 1. SPIN kyphoplasty was coded 22524 — a code DELETED by the AMA in 2015. The
 *    current lumbar vertebral-augmentation (kyphoplasty) code is 22514.
 * 2. SPIN vertebroplasty was coded 22514 — but 22514 is actually kyphoplasty
 *    (vertebral augmentation). The correct lumbosacral vertebroplasty code is 22511.
 *    (Order matters: free 22514 by moving vertebroplasty first, then move kyphoplasty.)
 * 3. SCOP 29891 is "excision of osteochondral lesion of talus", not generic ankle
 *    debridement — retitled (code unchanged).
 * 4. TUMR 27065 is specifically superficial bone-cyst/benign-tumour excision
 *    (ilium, symphysis pubis, greater trochanter) — title/description tightened.
 *
 * Each changed row has "embedding" reset to NULL for re-embedding.
 * main_diag_procs links reference proc id (not code) so they are unaffected.
 */
export class FixOrthoProcCptCodes1750000000077 implements MigrationInterface {
  name = "FixOrthoProcCptCodes1750000000077";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // (2) vertebroplasty 22514 -> 22511 (must run before kyphoplasty takes 22514)
    await queryRunner.query(`
      UPDATE "proc_cpts"
         SET "numCode" = '22511-00', "embedding" = NULL
       WHERE "alphaCode" = 'SPIN' AND "numCode" = '22514-00' AND "title" = 'Percutaneous vertebroplasty'
    `);
    // (1) kyphoplasty 22524 -> 22514
    await queryRunner.query(`
      UPDATE "proc_cpts"
         SET "numCode" = '22514-00', "embedding" = NULL
       WHERE "alphaCode" = 'SPIN' AND "numCode" = '22524-00' AND "title" = 'Percutaneous kyphoplasty'
    `);

    // (3) SCOP 29891 retitle
    await queryRunner.query(`
      UPDATE "proc_cpts" SET
        "title" = 'Ankle arthroscopy with excision of osteochondral lesion',
        "description" = 'Arthroscopic excision and drilling/microfracture of an osteochondral lesion of the talar dome (or distal tibia) to treat osteochondral defects of the ankle.',
        "ar_title" = 'تنظير الكاحل مع استئصال آفة عظمية غضروفية',
        "ar_description" = 'استئصال وتثقيب/تنضير بالمنظار لآفة عظمية غضروفية في قبة القَعَب (أو الظنبوب البعيد) لمعالجة العيوب العظمية الغضروفية في الكاحل.',
        "embedding" = NULL
       WHERE "alphaCode" = 'SCOP' AND "numCode" = '29891-00'
    `);

    // (4) TUMR 27065 tighten
    await queryRunner.query(`
      UPDATE "proc_cpts" SET
        "title" = 'Excision of superficial bone cyst or benign tumour',
        "description" = 'Excision of a superficial bone cyst or benign bone tumour (eg, of the wing of the ilium, symphysis pubis, or greater trochanter of the femur), with autograft when needed.',
        "ar_title" = 'استئصال كيسة عظمية سطحية أو ورم عظمي حميد',
        "ar_description" = 'استئصال كيسة عظمية سطحية أو ورم عظمي حميد (مثلاً في جناح الحرقفة أو الارتفاق العاني أو المدور الكبير للفخذ)، مع طعم ذاتي عند الحاجة.',
        "embedding" = NULL
       WHERE "alphaCode" = 'TUMR' AND "numCode" = '27065-00'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // reverse kyphoplasty 22514 -> 22524 first (frees 22514)
    await queryRunner.query(`
      UPDATE "proc_cpts"
         SET "numCode" = '22524-00', "embedding" = NULL
       WHERE "alphaCode" = 'SPIN' AND "numCode" = '22514-00' AND "title" = 'Percutaneous kyphoplasty'
    `);
    await queryRunner.query(`
      UPDATE "proc_cpts"
         SET "numCode" = '22514-00', "embedding" = NULL
       WHERE "alphaCode" = 'SPIN' AND "numCode" = '22511-00' AND "title" = 'Percutaneous vertebroplasty'
    `);
    await queryRunner.query(`
      UPDATE "proc_cpts" SET
        "title" = 'Ankle arthroscopy with debridement',
        "description" = 'Arthroscopic debridement of the ankle for osteochondral lesions, impingement, or loose bodies.',
        "ar_title" = 'تنظير الكاحل مع التنضير',
        "ar_description" = 'تنضير بالمنظار للكاحل لآفات العظم والغضروف أو الانحشار أو الأجسام الحرة.',
        "embedding" = NULL
       WHERE "alphaCode" = 'SCOP' AND "numCode" = '29891-00'
    `);
    await queryRunner.query(`
      UPDATE "proc_cpts" SET
        "title" = 'Excision of bone tumour',
        "description" = 'Excision of a benign bone tumour (eg, osteochondroma or osteoid osteoma), with bone graft as needed.',
        "ar_title" = 'استئصال الورم العظمي',
        "ar_description" = 'استئصال ورم عظمي حميد (مثل الورم العظمي الغضروفي أو العظماني السمحاقي) مع ترقيع عظمي عند الحاجة.',
        "embedding" = NULL
       WHERE "alphaCode" = 'TUMR' AND "numCode" = '27065-00'
    `);
  }
}
