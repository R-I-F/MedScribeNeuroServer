import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Scaled lectures framework (defaultdb reference data).
 *
 * Replaces the legacy flat per-tenant `lectures` table (lectureTitle/google_uid/mainTopic/level)
 * with a scaled, bilingual, per-department academic-curriculum model:
 *
 *   departments → lecture_topics → lectures
 *
 *  - lecture_topics   per-department curriculum groupings (the old free-text `mainTopic`),
 *                     bilingual title, ordered; UNIQUE(departmentId, title)
 *  - lectures         one lecture per row: the outline number (e.g. "1.3.2") split into its own
 *                     `lectureNumber` column, bilingual title (number prefix stripped), and the
 *                     msc|md `level` (nullable — some source rows have no derivable level).
 *
 * The legacy `google_uid` (a pre-production migration artifact) is intentionally dropped.
 * Full design: docs/LECTURES_SCALED_MODULE_PLAN.md
 */
export class CreateLecturesFramework1750000000188 implements MigrationInterface {
  name = "CreateLecturesFramework1750000000188";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "lecture_topics" (
        "id"           UUID NOT NULL DEFAULT gen_random_uuid(),
        "departmentId" UUID NOT NULL,
        "title"        VARCHAR(200) NOT NULL,
        "arTitle"      VARCHAR(200),
        "sortOrder"    INTEGER NOT NULL DEFAULT 0,
        "createdAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt"    TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_lecture_topics" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_lecture_topics_dept_title" UNIQUE ("departmentId", "title"),
        CONSTRAINT "FK_lecture_topics_department" FOREIGN KEY ("departmentId")
          REFERENCES "departments" ("id") ON DELETE CASCADE
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_lecture_topics_departmentId" ON "lecture_topics" ("departmentId")
    `);

    await queryRunner.query(`
      CREATE TABLE "lectures" (
        "id"            UUID NOT NULL DEFAULT gen_random_uuid(),
        "topicId"       UUID NOT NULL,
        "lectureNumber" VARCHAR(20),
        "title"         VARCHAR(300) NOT NULL,
        "arTitle"       VARCHAR(300),
        "level"         VARCHAR(10),
        "sortOrder"     INTEGER NOT NULL DEFAULT 0,
        "createdAt"     TIMESTAMP NOT NULL DEFAULT NOW(),
        "updatedAt"     TIMESTAMP NOT NULL DEFAULT NOW(),
        CONSTRAINT "PK_lectures" PRIMARY KEY ("id"),
        CONSTRAINT "FK_lectures_topic" FOREIGN KEY ("topicId")
          REFERENCES "lecture_topics" ("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_lectures_level" CHECK ("level" IN ('msc', 'md'))
      )
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_lectures_topicId" ON "lectures" ("topicId")
    `);
    await queryRunner.query(`
      CREATE INDEX "IDX_lectures_level" ON "lectures" ("level")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "lectures"`);
    await queryRunner.query(`DROP TABLE "lecture_topics"`);
  }
}
