import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Soft-registration sessions for the public semantic-search tool
 * (docs/PUBLIC_SEMANTIC_SEARCH_TOOL_PLAN.md). Append-only; per-email query quota via
 * SUM(queryCount). The id doubles as the opaque sessionId bearer.
 */
export class CreatePublicSearchSessions1783782610230
  implements MigrationInterface
{
  name = "CreatePublicSearchSessions1783782610230";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "public_search_sessions" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "email" character varying(255) NOT NULL,
        "otpHash" character varying(255) NOT NULL,
        "verified" boolean NOT NULL DEFAULT false,
        "verifiedAt" TIMESTAMP,
        "queryCount" integer NOT NULL DEFAULT 0,
        "maxQueries" integer NOT NULL DEFAULT 5,
        "ip" character varying(64) NOT NULL,
        "userAgent" character varying(512),
        "attempts" integer NOT NULL DEFAULT 0,
        "sendCount" integer NOT NULL DEFAULT 1,
        "lastSentAt" TIMESTAMP NOT NULL,
        "otpExpiresAt" TIMESTAMP NOT NULL,
        "sessionExpiresAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_public_search_sessions" PRIMARY KEY ("id")
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_pss_email_createdAt" ON "public_search_sessions" ("email", "createdAt")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pss_ip_createdAt" ON "public_search_sessions" ("ip", "createdAt")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pss_createdAt" ON "public_search_sessions" ("createdAt")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pss_sessionExpiresAt" ON "public_search_sessions" ("sessionExpiresAt")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_pss_otpExpiresAt" ON "public_search_sessions" ("otpExpiresAt")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_pss_otpExpiresAt"`);
    await queryRunner.query(`DROP INDEX "IDX_pss_sessionExpiresAt"`);
    await queryRunner.query(`DROP INDEX "IDX_pss_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_pss_ip_createdAt"`);
    await queryRunner.query(`DROP INDEX "IDX_pss_email_createdAt"`);
    await queryRunner.query(`DROP TABLE "public_search_sessions"`);
  }
}
