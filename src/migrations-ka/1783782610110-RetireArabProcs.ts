import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Retire the legacy `arab_procs` table (user decision 2026-07-15). Every calendar surgery
 * already carries `procCptId` via the approved arab_procs→proc_cpts clinical mapping
 * (4,608/4,608 — zero rows have an Arabic link without a CPT link), and proc_cpts now
 * carry Arabic (`arTitle`/`arDescription`, honest-mirror resync).
 *
 * The ONLY thing preserved is `proc_aliases`: a minimal internal lookup (colloquial Arabic
 * name → procCptId) derived from the approved mapping. It exists solely so the external
 * Google-sheet calendar import can keep resolving incoming procedure names ("غضروف") to
 * proc_cpts. It has no module, no routes, no UI — disclosed to the user, deletable on ask.
 *
 * down() restores the schema only (arab_procs data is not recoverable; re-ETL from prod).
 */
export class RetireArabProcs1783782610110 implements MigrationInterface {
  name = "RetireArabProcs1783782610110";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "proc_aliases" (
        "alias" text NOT NULL,
        "procCptId" uuid NOT NULL,
        CONSTRAINT "PK_proc_aliases" PRIMARY KEY ("alias"),
        CONSTRAINT "FK_proc_aliases_proc_cpt" FOREIGN KEY ("procCptId") REFERENCES "proc_cpts"("id") ON DELETE CASCADE
      )`
    );
    // Derive alias → procCpt from the approved mapping as applied to cal_surgs
    // (verified unambiguous: each arabProc maps to exactly one procCpt; 73 of 81 in use).
    await queryRunner.query(
      `INSERT INTO "proc_aliases" ("alias", "procCptId")
        SELECT a."title", m."procCptId"
          FROM "arab_procs" a
          JOIN (SELECT DISTINCT "arabProcId", "procCptId" FROM "cal_surgs"
                 WHERE "arabProcId" IS NOT NULL AND "procCptId" IS NOT NULL) m
            ON m."arabProcId" = a."id"`
    );
    await queryRunner.query(`ALTER TABLE "cal_surgs" DROP CONSTRAINT "FK_41335c8d6a533c782640bae52d7"`);
    await queryRunner.query(`ALTER TABLE "cal_surgs" DROP COLUMN "arabProcId"`);
    await queryRunner.query(`DROP TABLE "arab_procs"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "arab_procs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" character varying(255) NOT NULL,
        "alphaCode" character varying(20) NOT NULL,
        "numCode" character varying(20) NOT NULL,
        "description" text,
        "departmentId" uuid,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_arab_procs" PRIMARY KEY ("id")
      )`
    );
    await queryRunner.query(`ALTER TABLE "cal_surgs" ADD COLUMN "arabProcId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "cal_surgs" ADD CONSTRAINT "FK_41335c8d6a533c782640bae52d7" FOREIGN KEY ("arabProcId") REFERENCES "arab_procs"("id") ON DELETE RESTRICT`
    );
    await queryRunner.query(`DROP TABLE "proc_aliases"`);
  }
}
