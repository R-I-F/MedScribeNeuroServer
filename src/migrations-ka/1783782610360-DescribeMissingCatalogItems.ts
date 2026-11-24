import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Replace the bare "Other" procedure/diagnosis with search first, then a required description
 * (docs/OTHER_FIELD_SEMANTIC_SEARCH_PLAN.md, Stage J).
 *
 * Additive only:
 * - submissions gain the two described texts (NULL on every existing row; old "Other" rows stay as they are).
 * - in_app_search_events gains the search log fields: what the user typed, what came back, and what
 *   they did next, plus a `purpose` so the "Not listed?" search has its own daily cap.
 * - new catalog_gaps table: one row per described item, for the department's "Not in catalogue" list.
 */
export class DescribeMissingCatalogItems1783782610360 implements MigrationInterface {
  name = "DescribeMissingCatalogItems1783782610360";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "submissions" ADD COLUMN "otherProcedureText" varchar(120)`);
    await queryRunner.query(`ALTER TABLE "submissions" ADD COLUMN "otherDiagnosisText" varchar(120)`);

    await queryRunner.query(`ALTER TABLE "in_app_search_events" ADD COLUMN "purpose" varchar(16) NOT NULL DEFAULT 'assist'`);
    await queryRunner.query(`ALTER TABLE "in_app_search_events" ADD COLUMN "query" text`);
    await queryRunner.query(`ALTER TABLE "in_app_search_events" ADD COLUMN "mainDiagId" uuid`);
    await queryRunner.query(`ALTER TABLE "in_app_search_events" ADD COLUMN "results" jsonb`);
    await queryRunner.query(`ALTER TABLE "in_app_search_events" ADD COLUMN "outcome" varchar(16)`);
    await queryRunner.query(`ALTER TABLE "in_app_search_events" ADD COLUMN "pickedCode" varchar(32)`);
    await queryRunner.query(
      `ALTER TABLE "in_app_search_events" ADD CONSTRAINT "CHK_iase_purpose" CHECK ("purpose" IN ('assist', 'missing'))`
    );
    await queryRunner.query(
      `ALTER TABLE "in_app_search_events" ADD CONSTRAINT "CHK_iase_outcome" CHECK ("outcome" IS NULL OR "outcome" IN ('picked', 'none'))`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_iase_user_purpose_created" ON "in_app_search_events" ("userId", "purpose", "createdAt")`
    );
    await queryRunner.query(`CREATE INDEX "IDX_iase_created" ON "in_app_search_events" ("createdAt")`);

    await queryRunner.query(`
      CREATE TABLE "catalog_gaps" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "departmentId" uuid,
        "mainDiagId" uuid,
        "kind" varchar(16) NOT NULL,
        "text" varchar(120) NOT NULL,
        "normalizedText" varchar(120) NOT NULL,
        "submissionId" uuid NOT NULL,
        "searchEventId" uuid,
        "status" varchar(16) NOT NULL DEFAULT 'open',
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_cg_submission" FOREIGN KEY ("submissionId") REFERENCES "submissions"("id") ON DELETE CASCADE,
        CONSTRAINT "FK_cg_search_event" FOREIGN KEY ("searchEventId") REFERENCES "in_app_search_events"("id") ON DELETE SET NULL,
        CONSTRAINT "CHK_cg_kind" CHECK ("kind" IN ('procedure', 'diagnosis')),
        CONSTRAINT "CHK_cg_status" CHECK ("status" IN ('open', 'reported', 'dismissed')),
        CONSTRAINT "UQ_cg_submission_kind" UNIQUE ("submissionId", "kind")
      )
    `);
    await queryRunner.query(`CREATE INDEX "IDX_cg_dept_norm" ON "catalog_gaps" ("departmentId", "normalizedText")`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "catalog_gaps"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_iase_created"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_iase_user_purpose_created"`);
    await queryRunner.query(`ALTER TABLE "in_app_search_events" DROP CONSTRAINT IF EXISTS "CHK_iase_outcome"`);
    await queryRunner.query(`ALTER TABLE "in_app_search_events" DROP CONSTRAINT IF EXISTS "CHK_iase_purpose"`);
    for (const col of ["pickedCode", "outcome", "results", "mainDiagId", "query", "purpose"]) {
      await queryRunner.query(`ALTER TABLE "in_app_search_events" DROP COLUMN IF EXISTS "${col}"`);
    }
    await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN IF EXISTS "otherDiagnosisText"`);
    await queryRunner.query(`ALTER TABLE "submissions" DROP COLUMN IF EXISTS "otherProcedureText"`);
  }
}
