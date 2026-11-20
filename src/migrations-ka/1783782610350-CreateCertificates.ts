import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Verifiable E-Certificates (docs/PLATFORM_ENHANCEMENT_PLAN.md, Stage B).
 *
 * One row per issued certificate. The PDF itself is not stored: the row keeps the short public
 * code printed on the PDF (and in its QR code), who and when it was issued, and a snapshot of
 * the headline numbers printed on it, so the public verify page can show what was certified at
 * issue time and an edited PDF can be told apart. `dataHash` is a SHA-256 of that snapshot.
 *
 * `aiSummary` / `aiSummaryHash` cache the Gemini summary (Stage D): when the snapshot text sent to
 * Gemini is unchanged, the last summary is reused instead of calling Gemini again.
 *
 * Additive only; nothing existing changes. down() drops the table.
 */
export class CreateCertificates1783782610350 implements MigrationInterface {
  name = "CreateCertificates1783782610350";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "certificates" (
        "id" uuid NOT NULL DEFAULT gen_random_uuid(),
        "code" character varying(16) NOT NULL,
        "candidateId" uuid NOT NULL,
        "departmentId" uuid,
        "kind" character varying(16) NOT NULL DEFAULT 'final',
        "issuedByRole" character varying(32) NOT NULL,
        "issuedById" uuid,
        "periodFrom" date,
        "periodTo" date,
        "summary" jsonb NOT NULL,
        "dataHash" character(64) NOT NULL,
        "aiSummary" text,
        "aiSummaryHash" character(64),
        "issuedAt" TIMESTAMP NOT NULL DEFAULT now(),
        "revokedAt" TIMESTAMP,
        "revokedReason" text,
        "revokedById" uuid,
        CONSTRAINT "PK_certificates" PRIMARY KEY ("id"),
        CONSTRAINT "UQ_certificates_code" UNIQUE ("code"),
        CONSTRAINT "CHK_certificates_kind" CHECK ("kind" IN ('interim', 'final')),
        CONSTRAINT "FK_certificates_candidate"
          FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE RESTRICT,
        CONSTRAINT "FK_certificates_department"
          FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE SET NULL
      )
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_certificates_candidate_issued" ON "certificates" ("candidateId", "issuedAt" DESC)`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "certificates"`);
  }
}
