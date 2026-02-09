import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * Adds submissionType column and makes candDocId nullable.
 * - submissionType: "candidate" | "supervisor" (default "candidate")
 * - Existing rows in kasr-el-ainy and masr-el-dawly are classified as "candidate"
 * - Supervisor submissions: candDocId = null, subStatus = "approved"
 */
export class AddSubmissionTypeColumn1735000070000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add submissionType column (default 'candidate' for existing rows)
    await queryRunner.addColumn(
      "submissions",
      new TableColumn({
        name: "submissionType",
        type: "enum",
        enum: ["candidate", "supervisor"],
        default: "'candidate'",
        isNullable: false,
      })
    );

    // Existing rows automatically get submissionType = 'candidate' via default

    // Make candDocId nullable (for supervisor submissions)
    await queryRunner.changeColumn(
      "submissions",
      "candDocId",
      new TableColumn({
        name: "candDocId",
        type: "char",
        length: "36",
        isNullable: true,
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_ci",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revert candDocId to NOT NULL (only if no supervisor submissions exist, or they would be orphaned)
    await queryRunner.changeColumn(
      "submissions",
      "candDocId",
      new TableColumn({
        name: "candDocId",
        type: "char",
        length: "36",
        isNullable: false,
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_ci",
      })
    );

    await queryRunner.dropColumn("submissions", "submissionType");
  }
}
