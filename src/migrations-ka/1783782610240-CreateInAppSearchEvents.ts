import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Per-user in-form semantic-search usage log (docs/IN_FORM_SEMANTIC_SEARCH_PLAN.md).
 * Powers the 5/user/UTC-day quota (count rows since the UTC-day boundary) + a usage audit.
 */
export class CreateInAppSearchEvents1783782610240 implements MigrationInterface {
  name = "CreateInAppSearchEvents1783782610240";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "in_app_search_events" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "userId" uuid NOT NULL,
        "userRole" character varying(32) NOT NULL,
        "departmentId" uuid,
        "type" character varying(16) NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_in_app_search_events" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_iase_user_createdAt" ON "in_app_search_events" ("userId", "createdAt")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_iase_user_createdAt"`);
    await queryRunner.query(`DROP TABLE "in_app_search_events"`);
  }
}
