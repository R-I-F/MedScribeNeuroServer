import { MigrationInterface, QueryRunner } from "typeorm";

export class FixCtsAtrialFibIcdName1750000000046 implements MigrationInterface {
  name = "FixCtsAtrialFibIcdName1750000000046";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // BC81.3 = permanent atrial fibrillation; stored name was generic "atrial fibrillation"
    await queryRunner.query(`
      UPDATE "diagnoses"
      SET "icdName" = 'permanent atrial fibrillation',
          "icdArName" = 'الرجفان الأذيني الدائم',
          "embedding" = NULL
      WHERE "icdCode" = 'BC81.3'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      UPDATE "diagnoses"
      SET "icdName" = 'atrial fibrillation',
          "icdArName" = 'الرجفان الأذيني',
          "embedding" = NULL
      WHERE "icdCode" = 'BC81.3'
    `);
  }
}
