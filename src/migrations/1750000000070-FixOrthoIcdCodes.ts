import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * ORTHO ICD-11 audit — code fixes.
 *
 * 17 diagnoses carried wrong ICD-11 codes. The dominant error was coding
 * traumatic fractures/dislocations in the FB* (musculoskeletal *disease*)
 * chapter instead of the N* (injury) chapter; plus several cross-chapter
 * mismaps (osteomyelitis in a developmental-anomaly code, meniscal tear using
 * a femur-fracture code, osteoarthritis using injury codes, rotator cuff tear
 * using a wrong arthropathy code).
 *
 * Each row only changes "icdCode"; the existing icdName/icdArName/description
 * were already clinically correct for the concept. "embedding" is reset to
 * NULL so the backfill re-embeds each row.
 *
 * NOTE: FB81.0 (intertrochanteric fracture) is freed here for reuse by a later
 * migration (idiopathic aseptic osteonecrosis). Ordering matters: 070 < 072.
 */
export class FixOrthoIcdCodes1750000000070 implements MigrationInterface {
  name = "FixOrthoIcdCodes1750000000070";

  // [oldCode, newCode]
  private static readonly RECODES: [string, string][] = [
    ["NC71.0", "NC93.62"], // rupture of anterior cruciate ligament
    ["FB50.0", "NC92.2"],  // fracture of shaft of tibia
    ["FB70.0", "NC92.0"],  // fracture of patella
    ["FB80.0", "NC72.2Z"], // fracture of neck of femur
    ["FB80.2", "NC72.4"],  // subtrochanteric fracture of femur
    ["FB83.0", "NC72.5"],  // fracture of shaft of femur
    ["FB91.0", "NC92.Y"],  // fracture of ankle
    ["FB81.0", "NC72.30"], // intertrochanteric fracture of femur
    ["FA72.0", "NC13.0"],  // dislocation of shoulder joint
    ["FB50.1", "NC32.5Z"], // fracture of lower end of radius
    ["FB91.1", "NC53.3Z"], // fracture of metacarpal bone of hand
    ["NC12.0", "NC12.0Z"], // fracture of clavicle (parent -> leaf)
    ["NC72.0", "NC93.3Z"], // tear of meniscus of knee (was a femur-fracture code)
    ["NC90.0", "FA01.Z"],  // osteoarthritis of knee (was an injury code)
    ["NC90.1", "FA00.Z"],  // osteoarthritis of hip (was an injury code)
    ["LA91.1", "FB84.Z"],  // osteomyelitis (was a developmental-anomaly code)
    ["FA71.0", "NC16.0Y"], // rotator cuff injury/tear (FB53.1 already taken by syndrome)
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const [oldCode, newCode] of FixOrthoIcdCodes1750000000070.RECODES) {
      await queryRunner.query(
        `UPDATE "diagnoses" SET "icdCode" = $1, "embedding" = NULL WHERE "icdCode" = $2`,
        [newCode, oldCode]
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const [oldCode, newCode] of FixOrthoIcdCodes1750000000070.RECODES) {
      await queryRunner.query(
        `UPDATE "diagnoses" SET "icdCode" = $1, "embedding" = NULL WHERE "icdCode" = $2`,
        [oldCode, newCode]
      );
    }
  }
}
