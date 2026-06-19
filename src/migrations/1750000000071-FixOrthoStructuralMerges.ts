import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ORTHO structural fixes.
 *
 * 1. Three ORTHO diagnoses were duplicates of NS rows but carried WRONG codes:
 *      - 'lumbar disc herniation'        FA30.0 (FA30.0 is actually hallux valgus)
 *      - 'lumbar spinal stenosis'        FA31.0
 *      - 'fracture of lumbar vertebra'   FB20.0
 *    The correctly-coded equivalents already exist (owned by NS):
 *      FA80.9 (lumbar disc degeneration with prolapse), FA82 (spinal stenosis),
 *      NB52.0 (lumbar spine fracture).
 *    We MERGE: link the existing shared row to ORTHO (dept + main_diag) and
 *    delete the wrongly-coded ORTHO duplicate. This also frees FA30.0 for reuse
 *    (acquired hallux valgus) by migration 073.
 *
 * 2. The intertrochanteric-fracture row (recoded to NC72.30 in migration 070)
 *    was spuriously linked to the 'osteonecrosis' main_diag in addition to its
 *    correct 'fractures (lower extremity)' link. Remove the bogus link.
 */
export class FixOrthoStructuralMerges1750000000071 implements MigrationInterface {
  name = "FixOrthoStructuralMerges1750000000071";

  // [oldOrthoCode, sharedTargetCode, orthoMainDiagTitle]
  private static readonly MERGES: [string, string, string][] = [
    ["FA30.0", "FA80.9", "spinal stenosis"],
    ["FA31.0", "FA82", "spinal stenosis"],
    ["FB20.0", "NB52.0", "fractures (spine)"],
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [oldCode, target, mainDiag] of FixOrthoStructuralMerges1750000000071.MERGES) {
      // link shared row to ORTHO department
      await queryRunner.query(
        `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
         SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
         WHERE dept.code = 'ORTHO' AND d."icdCode" = $1
         ON CONFLICT DO NOTHING`,
        [target]
      );
      // link shared row to the ORTHO main_diag
      await queryRunner.query(
        `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
         SELECT md.id, d.id FROM "main_diags" md
         JOIN "departments" dept ON md."departmentId" = dept.id
         CROSS JOIN "diagnoses" d
         WHERE dept.code = 'ORTHO' AND md.title = $1 AND d."icdCode" = $2
         ON CONFLICT DO NOTHING`,
        [mainDiag, target]
      );
      // delete the wrongly-coded duplicate row (links first)
      await queryRunner.query(
        `DELETE FROM "main_diag_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`,
        [oldCode]
      );
      await queryRunner.query(
        `DELETE FROM "department_diagnoses" WHERE "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`,
        [oldCode]
      );
      await queryRunner.query(`DELETE FROM "diagnoses" WHERE "icdCode" = $1`, [oldCode]);
    }

    // remove the spurious intertrochanteric (NC72.30) -> osteonecrosis link
    await queryRunner.query(`
      DELETE FROM "main_diag_diagnoses"
      WHERE "mainDiagId" = (
              SELECT md.id FROM "main_diags" md
              JOIN "departments" dept ON md."departmentId" = dept.id
              WHERE dept.code = 'ORTHO' AND md.title = 'osteonecrosis')
        AND "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = 'NC72.30')
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 1. restore the spurious osteonecrosis link
    await queryRunner.query(`
      INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
      SELECT md.id, d.id FROM "main_diags" md
      JOIN "departments" dept ON md."departmentId" = dept.id
      CROSS JOIN "diagnoses" d
      WHERE dept.code = 'ORTHO' AND md.title = 'osteonecrosis' AND d."icdCode" = 'NC72.30'
      ON CONFLICT DO NOTHING
    `);

    // 2. recreate the three merged-away rows and relink to ORTHO
    const restore: [string, string, string, string, string, string][] = [
      [
        "FA30.0", "spinal stenosis",
        "lumbar disc herniation", "انزلاق الغضروف القطني",
        "Herniation of a lumbar intervertebral disc with displacement of nucleus pulposus, commonly causing radiculopathy/sciatica.",
        "انزلاق غضروف بين فقرات قطنية مع إزاحة النواة اللبية، يسبب عادةً اعتلال الجذور وعرق النسا.",
      ],
      [
        "FA31.0", "spinal stenosis",
        "lumbar spinal stenosis", "تضيق قناة العمود الفقري القطني",
        "Narrowing of the lumbar spinal canal compressing neural elements, causing neurogenic claudication and back/leg pain.",
        "تضيق القناة الشوكية القطنية يضغط على العناصر العصبية مسبباً عرجاً عصبياً وألماً في الظهر والساق.",
      ],
      [
        "FB20.0", "fractures (spine)",
        "fracture of lumbar vertebra", "كسر الفقرة القطنية",
        "Traumatic fracture of a lumbar vertebra, ranging from compression to burst fractures.",
        "كسر رضي في فقرة قطنية يتراوح بين الكسور الانضغاطية والكسور الانفجارية.",
      ],
    ];
    for (const [code, mainDiag, en, ar, desc, arDesc] of restore) {
      // remove the ORTHO links to the shared target re-added in up()
      // (targets: FA30.0->FA80.9, FA31.0->FA82, FB20.0->NB52.0)
      // handled below per-row mapping
      await queryRunner.query(
        `INSERT INTO "diagnoses" ("icdCode","icdName","icdArName","description","arDescription")
         VALUES ($1,$2,$3,$4,$5) ON CONFLICT ("icdCode") DO NOTHING`,
        [code, en, ar, desc, arDesc]
      );
      await queryRunner.query(
        `INSERT INTO "department_diagnoses" ("departmentId","diagnosisId")
         SELECT dept.id, d.id FROM "departments" dept CROSS JOIN "diagnoses" d
         WHERE dept.code = 'ORTHO' AND d."icdCode" = $1 ON CONFLICT DO NOTHING`,
        [code]
      );
      await queryRunner.query(
        `INSERT INTO "main_diag_diagnoses" ("mainDiagId","diagnosisId")
         SELECT md.id, d.id FROM "main_diags" md
         JOIN "departments" dept ON md."departmentId" = dept.id
         CROSS JOIN "diagnoses" d
         WHERE dept.code = 'ORTHO' AND md.title = $1 AND d."icdCode" = $2 ON CONFLICT DO NOTHING`,
        [mainDiag, code]
      );
    }

    // unlink the shared targets from ORTHO (reverse of up step)
    const unlink: [string, string][] = [
      ["FA80.9", "spinal stenosis"],
      ["FA82", "spinal stenosis"],
      ["NB52.0", "fractures (spine)"],
    ];
    for (const [target, mainDiag] of unlink) {
      await queryRunner.query(
        `DELETE FROM "main_diag_diagnoses"
         WHERE "mainDiagId" = (SELECT md.id FROM "main_diags" md
                JOIN "departments" dept ON md."departmentId" = dept.id
                WHERE dept.code = 'ORTHO' AND md.title = $1)
           AND "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $2)`,
        [mainDiag, target]
      );
      await queryRunner.query(
        `DELETE FROM "department_diagnoses"
         WHERE "departmentId" = (SELECT id FROM "departments" WHERE code = 'ORTHO')
           AND "diagnosisId" = (SELECT id FROM "diagnoses" WHERE "icdCode" = $1)`,
        [target]
      );
    }
  }
}
