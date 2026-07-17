import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Create the `institutions` table and seed the single KA row.
 *
 * Part of the "drop multi-tenancy" refactor (docs/DROP_MULTITENANCY_INSTITUTION_TABLE_PLAN.md):
 * the institution stops being an env/hardcoded constant and becomes ONE documented DB row — the
 * source of truth for the feature flags (isAcademic/isPractical/isClinical) that gate ~44
 * frontend branch points and several backend paths.
 *
 * Purely additive: no tenant table has an `institutionId` column (verified), so no FK closure.
 * Seed id = the historical INSTITUTION_ID so stale JWT institutionId claims stay coherent.
 */
export class CreateInstitutionsTable1783782610150 implements MigrationInterface {
  name = "CreateInstitutionsTable1783782610150";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "institutions" (
        "id" uuid NOT NULL,
        "code" character varying(100) NOT NULL,
        "name" character varying(255) NOT NULL,
        "department" character varying(100),
        "isActive" boolean NOT NULL DEFAULT true,
        "isAcademic" boolean NOT NULL DEFAULT true,
        "isPractical" boolean NOT NULL DEFAULT true,
        "isClinical" boolean NOT NULL DEFAULT true,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "PK_institutions" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_institutions_code" UNIQUE ("code")
      )
    `);

    // Seed the single KA institution (values = the retired INSTITUTION_* env vars).
    await queryRunner.query(`
      INSERT INTO "institutions"
        ("id", "code", "name", "department", "isActive", "isAcademic", "isPractical", "isClinical")
      VALUES (
        '550e8400-e29b-41d4-a716-446655440000',
        'cairo-university',
        'Kasr El Ainy / Cairo University',
        'neurosurgery',
        true, true, true, true
      )
      ON CONFLICT ("id") DO NOTHING
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "institutions"`);
  }
}
