import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Multi-department (full-institute) support on the KA spoke. Mirrors the hub's department
 * wiring so the spoke can serve every department, and gives each user a department.
 *
 *  - departments                 mirror of hub departments (FK target)
 *  - main_diags.departmentId      direct FK → departments (mirror of hub)
 *  - department_diagnoses         M2M dept↔diagnosis (diagnoses stay shared)
 *  - lecture_topics(.departmentId) + lectures.topicId   (topic carries the department)
 *  - {candidates,supervisors,institute_admins,clerks}.departmentId  FK → departments
 *
 * All new user/reference columns are nullable (rollout-safe); the reference mirror sync
 * populates the reference side.
 */
export class AddDepartmentScoping1783782609920 implements MigrationInterface {
  name = "AddDepartmentScoping1783782609920";

  public async up(queryRunner: QueryRunner): Promise<void> {
    // departments (hub UUID kept as PK).
    await queryRunner.query(`
      CREATE TABLE "departments" (
        "id" uuid NOT NULL,
        "code" character varying(50) NOT NULL,
        "name" character varying(255) NOT NULL,
        "arName" character varying(255),
        "isAcademic" boolean NOT NULL DEFAULT true,
        "isPractical" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_departments" PRIMARY KEY ("id")
      )
    `);

    // main_diags.departmentId → departments
    await queryRunner.query(`ALTER TABLE "main_diags" ADD COLUMN "departmentId" uuid`);
    await queryRunner.query(`
      ALTER TABLE "main_diags"
      ADD CONSTRAINT "FK_main_diags_department"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // department_diagnoses (M2M)
    await queryRunner.query(`
      CREATE TABLE "department_diagnoses" (
        "departmentId" uuid NOT NULL,
        "diagnosisId" uuid NOT NULL,
        CONSTRAINT "PK_department_diagnoses" PRIMARY KEY ("departmentId", "diagnosisId")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "department_diagnoses"
      ADD CONSTRAINT "FK_department_diagnoses_department"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE ON UPDATE NO ACTION
    `);
    await queryRunner.query(`
      ALTER TABLE "department_diagnoses"
      ADD CONSTRAINT "FK_department_diagnoses_diagnosis"
      FOREIGN KEY ("diagnosisId") REFERENCES "diagnoses"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);
    await queryRunner.query(`CREATE INDEX "IDX_department_diagnoses_diagnosis" ON "department_diagnoses" ("diagnosisId")`);

    // lecture_topics (departmentId FK) + lectures.topicId
    await queryRunner.query(`
      CREATE TABLE "lecture_topics" (
        "id" uuid NOT NULL,
        "title" character varying(255) NOT NULL,
        "arTitle" character varying(255),
        "sortOrder" integer NOT NULL DEFAULT 0,
        "departmentId" uuid NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_lecture_topics" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "lecture_topics"
      ADD CONSTRAINT "FK_lecture_topics_department"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    await queryRunner.query(`ALTER TABLE "lectures" ADD COLUMN "topicId" uuid`);
    await queryRunner.query(`ALTER TABLE "lectures" ADD COLUMN "lectureNumber" character varying(50)`);
    await queryRunner.query(`ALTER TABLE "lectures" ADD COLUMN "sortOrder" integer`);
    await queryRunner.query(`ALTER TABLE "lectures" ADD COLUMN "arTitle" character varying(255)`);
    await queryRunner.query(`
      ALTER TABLE "lectures"
      ADD CONSTRAINT "FK_lectures_topic"
      FOREIGN KEY ("topicId") REFERENCES "lecture_topics"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
    `);

    // Per-user departmentId (candidate / supervisor / institute_admin / clerk[secretary]).
    for (const table of ["candidates", "supervisors", "institute_admins", "clerks"]) {
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN "departmentId" uuid`);
      await queryRunner.query(`
        ALTER TABLE "${table}"
        ADD CONSTRAINT "FK_${table}_department"
        FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE NO ACTION ON UPDATE NO ACTION
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    for (const table of ["candidates", "supervisors", "institute_admins", "clerks"]) {
      await queryRunner.query(`ALTER TABLE "${table}" DROP CONSTRAINT "FK_${table}_department"`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "departmentId"`);
    }

    await queryRunner.query(`ALTER TABLE "lectures" DROP CONSTRAINT "FK_lectures_topic"`);
    await queryRunner.query(`ALTER TABLE "lectures" DROP COLUMN "arTitle"`);
    await queryRunner.query(`ALTER TABLE "lectures" DROP COLUMN "sortOrder"`);
    await queryRunner.query(`ALTER TABLE "lectures" DROP COLUMN "lectureNumber"`);
    await queryRunner.query(`ALTER TABLE "lectures" DROP COLUMN "topicId"`);
    await queryRunner.query(`DROP TABLE "lecture_topics"`);

    await queryRunner.query(`DROP TABLE "department_diagnoses"`);

    await queryRunner.query(`ALTER TABLE "main_diags" DROP CONSTRAINT "FK_main_diags_department"`);
    await queryRunner.query(`ALTER TABLE "main_diags" DROP COLUMN "departmentId"`);

    await queryRunner.query(`DROP TABLE "departments"`);
  }
}
