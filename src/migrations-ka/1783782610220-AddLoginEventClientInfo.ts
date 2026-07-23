import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds client attribution to login_events (docs/ACTIVE_USERS_ANALYTICS_PLAN.md).
 * Captures the IP and user-agent of each login so a suspicious login can be traced
 * to a device/location (the forensic gap flagged in the ElBaroody review). The
 * `activity_read_model` view is recreated to carry `ip`/`userAgent` (NULL for every
 * non-login source) so the super-admin per-user drill-down can surface them.
 */
export class AddLoginEventClientInfo1783782610220 implements MigrationInterface {
  name = "AddLoginEventClientInfo1783782610220";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW "activity_read_model"`);
    await queryRunner.query(`ALTER TABLE "login_events" ADD "ip" character varying(64)`);
    await queryRunner.query(`ALTER TABLE "login_events" ADD "userAgent" character varying(512)`);
    await queryRunner.query(`CREATE INDEX "IDX_login_events_ip" ON "login_events" ("ip")`);
    await queryRunner.query(this.viewSql(true));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW "activity_read_model"`);
    await queryRunner.query(`DROP INDEX "IDX_login_events_ip"`);
    await queryRunner.query(`ALTER TABLE "login_events" DROP COLUMN "userAgent"`);
    await queryRunner.query(`ALTER TABLE "login_events" DROP COLUMN "ip"`);
    await queryRunner.query(this.viewSql(false));
  }

  /** withClient=true adds the ip/userAgent columns (NULL for non-login sources). */
  private viewSql(withClient: boolean): string {
    const nulls = withClient ? `, NULL::varchar AS "ip", NULL::varchar AS "userAgent"` : ``;
    const nullsBare = withClient ? `, NULL::varchar, NULL::varchar` : ``;
    const loginTail = withClient ? `, "ip", "userAgent"` : ``;
    return `
      CREATE VIEW "activity_read_model" AS
          SELECT "candDocId" AS "actorId", 'candidate'::text AS "actorRole", "departmentId" AS "departmentId",
                 'submission'::text AS "activityType", "createdAt" AS "occurredAt"${nulls}
            FROM "submissions"
           WHERE "submissionType" = 'candidate' AND "candDocId" IS NOT NULL
        UNION ALL
          SELECT "candidateId", 'candidate'::text, "departmentId", 'event_attendance'::text, "createdAt"${nullsBare}
            FROM "event_attendance"
        UNION ALL
          SELECT "candDocId", 'candidate'::text, "departmentId", 'clinical_submission'::text, "createdAt"${nullsBare}
            FROM "clinical_sub"
        UNION ALL
          SELECT "reviewedBy"::uuid, 'supervisor'::text, "departmentId", 'surgical_review'::text, "reviewedAt"${nullsBare}
            FROM "submissions"
           WHERE "reviewedBy" IS NOT NULL AND "reviewedAt" IS NOT NULL
        UNION ALL
          SELECT "supervisorDocId", 'supervisor'::text, "departmentId", 'clinical_review'::text, "reviewedAt"${nullsBare}
            FROM "clinical_sub"
           WHERE "supervisorDocId" IS NOT NULL AND "reviewedAt" IS NOT NULL
        UNION ALL
          SELECT "clerkId", 'clerk'::text, "departmentId", 'calsurg_create'::text, "createdAt"${nullsBare}
            FROM "cal_surgs" WHERE "clerkId" IS NOT NULL
        UNION ALL
          SELECT "createdBy", "createdByRole"::text, "departmentId", 'event_create'::text, "createdAt"${nullsBare}
            FROM "events" WHERE "createdBy" IS NOT NULL
        UNION ALL
          SELECT "userId", "userRole"::text, "departmentId", 'login'::text, "loggedInAt"${loginTail}
            FROM "login_events"
    `;
  }
}
