import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

export class AddSubmissionForeignKeys1735000010002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Check existing foreign keys
    const submissionsTable = await queryRunner.getTable("submissions");
    const existingFkNames = submissionsTable?.foreignKeys.map(fk => fk.name) || [];

    // Add foreign key for candDocId (if not exists)
    if (!existingFkNames.includes("FK_submissions_candDocId")) {
      await queryRunner.createForeignKey(
        "submissions",
        new TableForeignKey({
          columnNames: ["candDocId"],
          referencedColumnNames: ["id"],
          referencedTableName: "candidates",
          onDelete: "RESTRICT",
          name: "FK_submissions_candDocId",
        })
      );
    }

    // Add foreign key for procDocId (if not exists)
    if (!existingFkNames.includes("FK_submissions_procDocId")) {
      await queryRunner.createForeignKey(
        "submissions",
        new TableForeignKey({
          columnNames: ["procDocId"],
          referencedColumnNames: ["id"],
          referencedTableName: "cal_surgs",
          onDelete: "RESTRICT",
          name: "FK_submissions_procDocId",
        })
      );
    }

    // Add foreign key for supervisorDocId (if not exists)
    if (!existingFkNames.includes("FK_submissions_supervisorDocId")) {
      await queryRunner.createForeignKey(
        "submissions",
        new TableForeignKey({
          columnNames: ["supervisorDocId"],
          referencedColumnNames: ["id"],
          referencedTableName: "supervisors",
          onDelete: "RESTRICT",
          name: "FK_submissions_supervisorDocId",
        })
      );
    }

    // Add foreign key for mainDiagDocId (if not exists)
    if (!existingFkNames.includes("FK_submissions_mainDiagDocId")) {
      await queryRunner.createForeignKey(
        "submissions",
        new TableForeignKey({
          columnNames: ["mainDiagDocId"],
          referencedColumnNames: ["id"],
          referencedTableName: "main_diags",
          onDelete: "RESTRICT",
          name: "FK_submissions_mainDiagDocId",
        })
      );
    }

    // Add foreign keys for junction tables
    const procCptTable = await queryRunner.getTable("submission_proc_cpts");
    const procCptFkNames = procCptTable?.foreignKeys.map(fk => fk.name) || [];

    if (!procCptFkNames.includes("FK_submission_proc_cpts_submissionId")) {
      await queryRunner.createForeignKey(
        "submission_proc_cpts",
        new TableForeignKey({
          columnNames: ["submissionId"],
          referencedColumnNames: ["id"],
          referencedTableName: "submissions",
          onDelete: "CASCADE",
          name: "FK_submission_proc_cpts_submissionId",
        })
      );
    }

    if (!procCptFkNames.includes("FK_submission_proc_cpts_procCptId")) {
      await queryRunner.createForeignKey(
        "submission_proc_cpts",
        new TableForeignKey({
          columnNames: ["procCptId"],
          referencedColumnNames: ["id"],
          referencedTableName: "proc_cpts",
          onDelete: "CASCADE",
          name: "FK_submission_proc_cpts_procCptId",
        })
      );
    }

    const icdTable = await queryRunner.getTable("submission_icds");
    const icdFkNames = icdTable?.foreignKeys.map(fk => fk.name) || [];

    if (!icdFkNames.includes("FK_submission_icds_submissionId")) {
      await queryRunner.createForeignKey(
        "submission_icds",
        new TableForeignKey({
          columnNames: ["submissionId"],
          referencedColumnNames: ["id"],
          referencedTableName: "submissions",
          onDelete: "CASCADE",
          name: "FK_submission_icds_submissionId",
        })
      );
    }

    if (!icdFkNames.includes("FK_submission_icds_icdId")) {
      await queryRunner.createForeignKey(
        "submission_icds",
        new TableForeignKey({
          columnNames: ["icdId"],
          referencedColumnNames: ["id"],
          referencedTableName: "diagnoses",
          onDelete: "CASCADE",
          name: "FK_submission_icds_icdId",
        })
      );
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys in reverse order
    const submissionTable = await queryRunner.getTable("submissions");
    if (submissionTable) {
      const foreignKeys = submissionTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey("submissions", fk);
      }
    }

    const submissionProcCptsTable = await queryRunner.getTable("submission_proc_cpts");
    if (submissionProcCptsTable) {
      const foreignKeys = submissionProcCptsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey("submission_proc_cpts", fk);
      }
    }

    const submissionIcdsTable = await queryRunner.getTable("submission_icds");
    if (submissionIcdsTable) {
      const foreignKeys = submissionIcdsTable.foreignKeys;
      for (const fk of foreignKeys) {
        await queryRunner.dropForeignKey("submission_icds", fk);
      }
    }
  }
}
