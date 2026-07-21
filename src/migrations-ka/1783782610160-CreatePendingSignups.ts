import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * OTP-verified signup staging table (docs/OTP_SIGNUP_VERIFICATION_PLAN.md).
 * Registrations land here first; the real candidates/supervisors row is created only
 * when the emailed 6-digit code is verified within 15 minutes. Expired/rejected rows
 * are deleted (read-time enforcement + periodic purge sweep) — no FK to user tables.
 */
export class CreatePendingSignups1783782610160 implements MigrationInterface {
  name = "CreatePendingSignups1783782610160";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "pending_signups_role_enum" AS ENUM ('candidate', 'supervisor')`
    );
    await queryRunner.query(`
      CREATE TABLE "pending_signups" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "role" "pending_signups_role_enum" NOT NULL,
        "email" character varying(255) NOT NULL,
        "payload" jsonb NOT NULL,
        "otpHash" character varying(255) NOT NULL,
        "attempts" integer NOT NULL DEFAULT 0,
        "sendCount" integer NOT NULL DEFAULT 1,
        "lastSentAt" TIMESTAMP NOT NULL,
        "expiresAt" TIMESTAMP NOT NULL,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_pending_signups" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pending_signups_email_role" ON "pending_signups" ("email", "role")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pending_signups_expiresAt" ON "pending_signups" ("expiresAt")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_pending_signups_expiresAt"`);
    await queryRunner.query(`DROP INDEX "IDX_pending_signups_email_role"`);
    await queryRunner.query(`DROP TABLE "pending_signups"`);
    await queryRunner.query(`DROP TYPE "pending_signups_role_enum"`);
  }
}
