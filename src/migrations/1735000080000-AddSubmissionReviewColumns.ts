import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * Adds review-related columns to submissions table.
 * - review: optional text comment from supervisor
 * - reviewedAt: when the review was performed
 * - reviewedBy: supervisor who performed the review (FK to supervisors.id)
 */
export class AddSubmissionReviewColumns1735000080000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumn(
      "submissions",
      new TableColumn({
        name: "review",
        type: "text",
        isNullable: true,
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_ci",
      })
    );

    await queryRunner.addColumn(
      "submissions",
      new TableColumn({
        name: "reviewedAt",
        type: "datetime",
        isNullable: true,
      })
    );

    await queryRunner.addColumn(
      "submissions",
      new TableColumn({
        name: "reviewedBy",
        type: "char",
        length: "36",
        isNullable: true,
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_ci",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropColumn("submissions", "reviewedBy");
    await queryRunner.dropColumn("submissions", "reviewedAt");
    await queryRunner.dropColumn("submissions", "review");
  }
}
