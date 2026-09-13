import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * AI Office (docs/AI_OFFICE_PLAN.md).
 *
 * 1. candidates + supervisors gain `aiOfficeMember` (the role the super-admin grants) and
 *    `departmentOther` (a department name typed at the AI Office signup when the university
 *    department is not one we mirror). `departmentId` stops being NOT NULL, but a CHECK keeps
 *    the old guarantee for everyone else: only an AI Office member with a typed department may
 *    have no department.
 * 2. `ai_office_activities`: one row per activity a member registers (the in-app replacement of
 *    the "AI Office - Activity Registration" Google Form). Exactly one of candidateId /
 *    supervisorId is set. Columns shared by every form section are real columns so statistics
 *    are plain SQL; each section's own extra fields live in `details`.
 * 3. `ai_office_access_requests`: an AI Office signup that hit an existing account. Kept as an
 *    audit trail and to rate-limit the notification email.
 */
export class CreateAiOffice1783782610330 implements MigrationInterface {
  name = "CreateAiOffice1783782610330";

  public async up(queryRunner: QueryRunner): Promise<void> {
    for (const table of ["candidates", "supervisors"]) {
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD COLUMN "aiOfficeMember" boolean NOT NULL DEFAULT false`
      );
      await queryRunner.query(`ALTER TABLE "${table}" ADD COLUMN "departmentOther" varchar(160)`);
      await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "departmentId" DROP NOT NULL`);
      await queryRunner.query(
        `ALTER TABLE "${table}" ADD CONSTRAINT "CHK_${table}_dept_or_ai_office"
           CHECK ("departmentId" IS NOT NULL OR ("aiOfficeMember" AND "departmentOther" IS NOT NULL))`
      );
      await queryRunner.query(
        `CREATE INDEX "IDX_${table}_ai_office_member" ON "${table}" ("aiOfficeMember") WHERE "aiOfficeMember"`
      );
    }

    await queryRunner.query(`
      CREATE TABLE "ai_office_activities" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "candidateId" uuid,
        "supervisorId" uuid,
        "activityType" varchar(32) NOT NULL,
        "title" text,
        "status" varchar(32),
        "activityDate" date,
        "notes" text,
        "details" jsonb NOT NULL DEFAULT '{}'::jsonb,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_aio_act_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_aio_act_supervisor" FOREIGN KEY ("supervisorId") REFERENCES "supervisors"("id") ON DELETE RESTRICT,
        CONSTRAINT "CHK_aio_act_one_member" CHECK (num_nonnulls("candidateId", "supervisorId") = 1),
        CONSTRAINT "CHK_aio_act_type" CHECK ("activityType" IN
          ('project_review', 'journal_club', 'symposium', 'partner_meeting', 'qualification', 'project_study', 'other_task')),
        CONSTRAINT "CHK_aio_act_details_object" CHECK (jsonb_typeof("details") = 'object')
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_aio_act_candidate_created" ON "ai_office_activities" ("candidateId", "createdAt")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_aio_act_supervisor_created" ON "ai_office_activities" ("supervisorId", "createdAt")`
    );
    await queryRunner.query(`CREATE INDEX "IDX_aio_act_type" ON "ai_office_activities" ("activityType")`);

    await queryRunner.query(`
      CREATE TABLE "ai_office_access_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "email" varchar(255) NOT NULL,
        "requestedRole" varchar(16) NOT NULL,
        "existingRole" varchar(16) NOT NULL,
        "existingUserId" uuid NOT NULL,
        "fullName" varchar(120) NOT NULL,
        "departmentLabel" varchar(160),
        "ip" varchar(64) NOT NULL,
        "userAgent" varchar(512),
        "emailedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "CHK_aio_req_requested_role" CHECK ("requestedRole" IN ('candidate', 'supervisor')),
        CONSTRAINT "CHK_aio_req_existing_role" CHECK ("existingRole" IN ('candidate', 'supervisor'))
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_aio_req_email_created" ON "ai_office_access_requests" ("email", "createdAt")`
    );
    await queryRunner.query(`CREATE INDEX "IDX_aio_req_emailed" ON "ai_office_access_requests" ("emailedAt")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Restoring NOT NULL on departmentId would fail for department-less AI Office accounts, and
    // deleting or guessing a department for real people is not something a rollback may do.
    for (const table of ["candidates", "supervisors"]) {
      const rows: Array<{ n: string }> = await queryRunner.query(
        `SELECT COUNT(*) AS n FROM "${table}" WHERE "departmentId" IS NULL`
      );
      if (Number(rows[0]?.n ?? 0) > 0) {
        throw new Error(
          `Cannot revert CreateAiOffice: ${rows[0].n} ${table} have no department (AI Office signups). ` +
            `Assign them a department first.`
        );
      }
    }

    await queryRunner.query(`DROP TABLE "ai_office_access_requests"`);
    await queryRunner.query(`DROP TABLE "ai_office_activities"`);

    for (const table of ["candidates", "supervisors"]) {
      await queryRunner.query(`DROP INDEX "IDX_${table}_ai_office_member"`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP CONSTRAINT "CHK_${table}_dept_or_ai_office"`);
      await queryRunner.query(`ALTER TABLE "${table}" ALTER COLUMN "departmentId" SET NOT NULL`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "departmentOther"`);
      await queryRunner.query(`ALTER TABLE "${table}" DROP COLUMN "aiOfficeMember"`);
    }
  }
}
