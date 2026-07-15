import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Drop `proc_aliases` (user decision 2026-07-15: "break it, i dont care about that now").
 * The Google-sheet calendar import no longer resolves colloquial Arabic procedure names —
 * it now matches only exact proc_cpts `title`/`arTitle`; unmatched rows import with no
 * procedure (procCptId NULL), same as any unrecognized value.
 */
export class DropProcAliases1783782610120 implements MigrationInterface {
  name = "DropProcAliases1783782610120";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "proc_aliases"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Schema only — the alias data came from the retired arab_procs mapping and is not restorable here.
    await queryRunner.query(
      `CREATE TABLE "proc_aliases" (
        "alias" text NOT NULL,
        "procCptId" uuid NOT NULL,
        CONSTRAINT "PK_proc_aliases" PRIMARY KEY ("alias"),
        CONSTRAINT "FK_proc_aliases_proc_cpt" FOREIGN KEY ("procCptId") REFERENCES "proc_cpts"("id") ON DELETE CASCADE
      )`
    );
  }
}
