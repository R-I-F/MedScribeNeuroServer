import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Authentication-event log (docs/ACTIVE_USERS_ANALYTICS_PLAN.md, Stage A1).
 * Logins are recorded nowhere else, so this is their single source of truth (not a
 * duplicate of any operational table). Append-only: one row per successful login.
 * Powers the `login` signal of the Active-Users read model and the rolling quarterly
 * active-users signup cap.
 */
export class CreateLoginEvents1783782610180 implements MigrationInterface {
  name = "CreateLoginEvents1783782610180";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "login_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "userRole" character varying(32) NOT NULL,
        "departmentId" uuid,
        "loggedInAt" TIMESTAMP NOT NULL DEFAULT now(),
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_login_events" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_login_events_loggedInAt" ON "login_events" ("loggedInAt")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_login_events_dept_loggedInAt" ON "login_events" ("departmentId", "loggedInAt")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_login_events_user_loggedInAt" ON "login_events" ("userId", "loggedInAt")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_login_events_role_loggedInAt" ON "login_events" ("userRole", "loggedInAt")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_login_events_role_loggedInAt"`);
    await queryRunner.query(`DROP INDEX "IDX_login_events_user_loggedInAt"`);
    await queryRunner.query(`DROP INDEX "IDX_login_events_dept_loggedInAt"`);
    await queryRunner.query(`DROP INDEX "IDX_login_events_loggedInAt"`);
    await queryRunner.query(`DROP TABLE "login_events"`);
  }
}
