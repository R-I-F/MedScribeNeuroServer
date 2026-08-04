import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Candidate to Supervisor promotion (docs/CANDIDATE_TO_SUPERVISOR_PROMOTION_PLAN.md).
 *
 * A candidate promoted in real life keeps his candidate row forever: submissions and
 * clinical_sub reference it with ON DELETE RESTRICT and event_attendance with CASCADE,
 * so the row is the anchor of his whole logbook and can never be deleted or repointed.
 * Promotion therefore CREATES a supervisors row and ARCHIVES the candidate row.
 *
 * archivedAt IS NULL is the "active candidate" predicate: login, forgot-password, the
 * candidate lists and both rankings filter on it. promotedToSupervisorId is the identity
 * link (UNIQUE: two candidates can never collapse into one supervisor) and is what the
 * read-only previous-logbook view resolves on.
 */
export class AddCandidatePromotion1783782610250 implements MigrationInterface {
  name = "AddCandidatePromotion1783782610250";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "candidates" ADD COLUMN "archivedAt" TIMESTAMP`
    );
    await queryRunner.query(
      `ALTER TABLE "candidates" ADD COLUMN "promotedToSupervisorId" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "candidates"
         ADD CONSTRAINT "FK_cand_promotedToSupervisor"
         FOREIGN KEY ("promotedToSupervisorId") REFERENCES "supervisors"("id") ON DELETE SET NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "candidates"
         ADD CONSTRAINT "UQ_cand_promotedToSupervisor" UNIQUE ("promotedToSupervisorId")`
    );
    // Partial index: every active-candidate read filters on archivedAt IS NULL.
    await queryRunner.query(
      `CREATE INDEX "IDX_cand_active" ON "candidates" ("departmentId") WHERE "archivedAt" IS NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "IDX_cand_active"`);
    await queryRunner.query(
      `ALTER TABLE "candidates" DROP CONSTRAINT "UQ_cand_promotedToSupervisor"`
    );
    await queryRunner.query(
      `ALTER TABLE "candidates" DROP CONSTRAINT "FK_cand_promotedToSupervisor"`
    );
    await queryRunner.query(`ALTER TABLE "candidates" DROP COLUMN "promotedToSupervisorId"`);
    await queryRunner.query(`ALTER TABLE "candidates" DROP COLUMN "archivedAt"`);
  }
}
