import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Clerk procedures — self-learning input pipeline (docs/CLERK_PROCS_LEARNING_PIPELINE_PLAN.md).
 *
 *   clerk_procs: the clerk's raw procedure text, learned once per (department, title):
 *     semantic search (hub /v1/procedure-search) resolves the best proc_cpt + its main
 *     diagnosis; repeats reuse the row (no re-search).
 *   cal_surgs: + clerkProcId (what the clerk actually entered) and the bilingual patient
 *     name slots (patientNameAr/patientNameEn; `patientName` stays as-typed original).
 */
export class ClerkProcsLearningPipeline1783782610130 implements MigrationInterface {
  name = "ClerkProcsLearningPipeline1783782610130";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "clerk_procs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "title" text NOT NULL,
        "departmentId" uuid NOT NULL,
        "clerkId" uuid,
        "procCptId" uuid,
        "mainDiagId" uuid,
        "matchScore" real,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_clerk_procs" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_clerk_procs_dept_title" UNIQUE ("departmentId", "title"),
        CONSTRAINT "FK_clerk_procs_department" FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_clerk_procs_clerk" FOREIGN KEY ("clerkId") REFERENCES "clerks"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_clerk_procs_proc_cpt" FOREIGN KEY ("procCptId") REFERENCES "proc_cpts"("id") ON DELETE SET NULL,
        CONSTRAINT "FK_clerk_procs_main_diag" FOREIGN KEY ("mainDiagId") REFERENCES "main_diags"("id") ON DELETE SET NULL
      )`
    );
    await queryRunner.query(`ALTER TABLE "cal_surgs" ADD COLUMN "clerkProcId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "cal_surgs" ADD CONSTRAINT "FK_cal_surgs_clerk_proc" FOREIGN KEY ("clerkProcId") REFERENCES "clerk_procs"("id") ON DELETE SET NULL`
    );
    await queryRunner.query(`ALTER TABLE "cal_surgs" ADD COLUMN "patientNameAr" text`);
    await queryRunner.query(`ALTER TABLE "cal_surgs" ADD COLUMN "patientNameEn" text`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "cal_surgs" DROP COLUMN "patientNameEn"`);
    await queryRunner.query(`ALTER TABLE "cal_surgs" DROP COLUMN "patientNameAr"`);
    await queryRunner.query(`ALTER TABLE "cal_surgs" DROP CONSTRAINT "FK_cal_surgs_clerk_proc"`);
    await queryRunner.query(`ALTER TABLE "cal_surgs" DROP COLUMN "clerkProcId"`);
    await queryRunner.query(`DROP TABLE "clerk_procs"`);
  }
}
