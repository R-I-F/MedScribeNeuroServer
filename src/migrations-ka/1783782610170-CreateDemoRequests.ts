import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Landing-page "Book a demo" leads table (docs/BOOK_A_DEMO_PLAN.md).
 * Public POST /demoRequest stores every accepted request here BEFORE the
 * notification email is attempted; `emailedAt` NULL = email skipped (daily
 * budget) or failed. Rows are sales leads — kept forever, no purge sweep.
 */
export class CreateDemoRequests1783782610170 implements MigrationInterface {
  name = "CreateDemoRequests1783782610170";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "demo_requests" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "fullName" character varying(120) NOT NULL,
        "email" character varying(255) NOT NULL,
        "organization" character varying(160),
        "phoneNum" character varying(32),
        "message" character varying(2000),
        "ip" character varying(64) NOT NULL,
        "userAgent" character varying(512),
        "emailedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_demo_requests" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_demo_requests_email_createdAt" ON "demo_requests" ("email", "createdAt")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_demo_requests_ip_createdAt" ON "demo_requests" ("ip", "createdAt")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_demo_requests_emailedAt" ON "demo_requests" ("emailedAt")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_demo_requests_emailedAt"`);
    await queryRunner.query(`DROP INDEX "IDX_demo_requests_ip_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_demo_requests_email_createdAt"`);
    await queryRunner.query(`DROP TABLE "demo_requests"`);
  }
}
