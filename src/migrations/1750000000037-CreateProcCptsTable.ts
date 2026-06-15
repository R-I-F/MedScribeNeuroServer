import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateProcCptsTable1750000000037 implements MigrationInterface {
  name = "CreateProcCptsTable1750000000037";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "proc_cpts" (
        "id"             UUID          NOT NULL DEFAULT gen_random_uuid(),
        "title"          VARCHAR(100)  NOT NULL,
        "alphaCode"      VARCHAR(10)   NOT NULL,
        "numCode"        VARCHAR(10)   NOT NULL,
        "description"    VARCHAR(500)  NOT NULL,
        "ar_title"       VARCHAR(100)  NULL,
        "ar_description" VARCHAR(500)  NULL,
        "createdAt"      TIMESTAMP     NOT NULL DEFAULT now(),
        "updatedAt"      TIMESTAMP     NOT NULL DEFAULT now(),
        CONSTRAINT "PK_proc_cpts" PRIMARY KEY ("id")
      )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "proc_cpts"`);
  }
}
