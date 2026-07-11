import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Widen the mirror's name/title/description columns to `text`. The original widths were sized
 * for the neurosurgery-only dataset; serving ALL departments brings longer lecture/topic
 * titles, procedure titles/descriptions and ICD names that overflow the old varchar limits.
 * `text` avoids truncating medical reference data. Purely a widening — no data change.
 */
export class WidenMirrorTextColumns1783782609930 implements MigrationInterface {
  name = "WidenMirrorTextColumns1783782609930";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "main_diags" ALTER COLUMN "title" TYPE text`);
    await queryRunner.query(`ALTER TABLE "diagnoses" ALTER COLUMN "icdName" TYPE text`);

    await queryRunner.query(`ALTER TABLE "proc_cpts" ALTER COLUMN "title" TYPE text`);
    await queryRunner.query(`ALTER TABLE "proc_cpts" ALTER COLUMN "description" TYPE text`);
    await queryRunner.query(`ALTER TABLE "proc_cpts" ALTER COLUMN "alphaCode" TYPE character varying(20)`);
    await queryRunner.query(`ALTER TABLE "proc_cpts" ALTER COLUMN "numCode" TYPE character varying(20)`);

    await queryRunner.query(`ALTER TABLE "lectures" ALTER COLUMN "lectureTitle" TYPE text`);
    await queryRunner.query(`ALTER TABLE "lectures" ALTER COLUMN "mainTopic" TYPE text`);
    await queryRunner.query(`ALTER TABLE "lectures" ALTER COLUMN "arTitle" TYPE text`);

    await queryRunner.query(`ALTER TABLE "lecture_topics" ALTER COLUMN "title" TYPE text`);
    await queryRunner.query(`ALTER TABLE "lecture_topics" ALTER COLUMN "arTitle" TYPE text`);
  }

  public async down(_queryRunner: QueryRunner): Promise<void> {
    // Intentional no-op: narrowing text back to varchar(n) could truncate/reject existing
    // multi-department data. The widening is forward-only.
  }
}
