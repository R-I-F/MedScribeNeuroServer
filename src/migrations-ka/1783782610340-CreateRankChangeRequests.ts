import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Candidate rank change requests (docs/RANK_CHANGE_REQUEST_PLAN.md).
 *
 * A candidate asks for a new rank from their profile; the institute admin of their department
 * approves or rejects it, and only an approval writes `candidates.rank`. Additive only: no
 * existing table or row is touched.
 */
export class CreateRankChangeRequests1783782610340 implements MigrationInterface {
  name = "CreateRankChangeRequests1783782610340";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "rank_change_requests" (
        "id" uuid PRIMARY KEY DEFAULT gen_random_uuid(),
        "candidateId" uuid NOT NULL,
        "fromRank" varchar(32) NOT NULL,
        "requestedRank" varchar(32) NOT NULL,
        "status" varchar(16) NOT NULL DEFAULT 'pending',
        "reviewedById" uuid,
        "reviewedByRole" varchar(16),
        "reviewNote" varchar(500),
        "reviewedAt" TIMESTAMP,
        "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
        "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "FK_rcr_candidate" FOREIGN KEY ("candidateId") REFERENCES "candidates"("id") ON DELETE CASCADE,
        CONSTRAINT "CHK_rcr_status" CHECK ("status" IN ('pending', 'approved', 'rejected', 'canceled')),
        CONSTRAINT "CHK_rcr_rank_differs" CHECK ("fromRank" <> "requestedRank")
      )
    `);
    await queryRunner.query(
      `CREATE UNIQUE INDEX "UQ_rcr_one_pending" ON "rank_change_requests" ("candidateId") WHERE "status" = 'pending'`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rcr_candidate_created" ON "rank_change_requests" ("candidateId", "createdAt")`
    );
    await queryRunner.query(
      `CREATE INDEX "IDX_rcr_status_created" ON "rank_change_requests" ("status", "createdAt")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "rank_change_requests"`);
  }
}
