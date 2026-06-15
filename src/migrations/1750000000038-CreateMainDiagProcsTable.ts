import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateMainDiagProcsTable1750000000038 implements MigrationInterface {
  name = "CreateMainDiagProcsTable1750000000038";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "main_diag_procs" (
        "mainDiagId" UUID NOT NULL,
        "procCptId"  UUID NOT NULL,
        CONSTRAINT "PK_main_diag_procs" PRIMARY KEY ("mainDiagId", "procCptId"),
        CONSTRAINT "FK_mdp_mainDiag" FOREIGN KEY ("mainDiagId") REFERENCES "main_diags"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_mdp_procCpt"  FOREIGN KEY ("procCptId")  REFERENCES "proc_cpts"("id") ON DELETE CASCADE
      )
    `);

    await queryRunner.query(`CREATE INDEX "IDX_mdp_mainDiagId" ON "main_diag_procs" ("mainDiagId")`);
    await queryRunner.query(`CREATE INDEX "IDX_mdp_procCptId"  ON "main_diag_procs" ("procCptId")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "main_diag_procs"`);
  }
}
