import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * activity_read_model - the read-only unified VIEW for the Active-Users dashboard
 * (docs/ACTIVE_USERS_ANALYTICS_PLAN.md, Stage A5).
 *
 * It stores NOTHING. It projects the existing operational tables (submissions,
 * event_attendance, clinical_sub, cal_surgs, events) plus login_events into one
 * normalized shape (actorId, actorRole, departmentId, activityType, occurredAt).
 * The source tables remain the single source of truth for their facts; this is the
 * read side (CQRS-lite), so it can never drift from source. If scale ever demands it,
 * swap this for a MATERIALIZED VIEW (a derived cache, still not authoritative) without
 * changing the analytics provider.
 *
 * Type notes for the UNION: submissions.reviewedBy is char(36) while every other actor
 * column is uuid, so it is cast to uuid; role/type string literals are cast to text so
 * they unify cleanly with the varchar creator/role columns.
 *
 * Depends on migrations 180 (login_events) and 190 (events.createdBy/createdByRole),
 * which the timestamp ordering guarantees run first.
 */
export class CreateActivityReadModel1783782610210
  implements MigrationInterface
{
  name = "CreateActivityReadModel1783782610210";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE VIEW "activity_read_model" AS
          SELECT "candDocId" AS "actorId",
                 'candidate'::text AS "actorRole",
                 "departmentId" AS "departmentId",
                 'submission'::text AS "activityType",
                 "createdAt" AS "occurredAt"
            FROM "submissions"
           WHERE "submissionType" = 'candidate' AND "candDocId" IS NOT NULL
        UNION ALL
          SELECT "candidateId", 'candidate'::text, "departmentId", 'event_attendance'::text, "createdAt"
            FROM "event_attendance"
        UNION ALL
          SELECT "candDocId", 'candidate'::text, "departmentId", 'clinical_submission'::text, "createdAt"
            FROM "clinical_sub"
        UNION ALL
          SELECT "reviewedBy"::uuid, 'supervisor'::text, "departmentId", 'surgical_review'::text, "reviewedAt"
            FROM "submissions"
           WHERE "reviewedBy" IS NOT NULL AND "reviewedAt" IS NOT NULL
        UNION ALL
          SELECT "supervisorDocId", 'supervisor'::text, "departmentId", 'clinical_review'::text, "reviewedAt"
            FROM "clinical_sub"
           WHERE "supervisorDocId" IS NOT NULL AND "reviewedAt" IS NOT NULL
        UNION ALL
          SELECT "clerkId", 'clerk'::text, "departmentId", 'calsurg_create'::text, "createdAt"
            FROM "cal_surgs"
           WHERE "clerkId" IS NOT NULL
        UNION ALL
          SELECT "createdBy", "createdByRole"::text, "departmentId", 'event_create'::text, "createdAt"
            FROM "events"
           WHERE "createdBy" IS NOT NULL
        UNION ALL
          SELECT "userId", "userRole"::text, "departmentId", 'login'::text, "loggedInAt"
            FROM "login_events"
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP VIEW "activity_read_model"`);
  }
}
