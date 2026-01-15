import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateSubmissionsTable1735000010001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create submissions table with temporary mongo_object_id columns for foreign keys
    await queryRunner.createTable(
      new Table({
        name: "submissions",
        columns: [
          {
            name: "id",
            type: "char",
            length: "36",
            isPrimary: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "timeStamp",
            type: "datetime",
            isNullable: false,
          },
          {
            name: "roleInSurg",
            type: "varchar",
            length: "100",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "assRoleDesc",
            type: "text",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "otherSurgRank",
            type: "varchar",
            length: "100",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "otherSurgName",
            type: "varchar",
            length: "255",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "isItRevSurg",
            type: "boolean",
            isNullable: false,
          },
          {
            name: "preOpClinCond",
            type: "text",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "insUsed",
            type: "varchar",
            length: "100",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "consUsed",
            type: "varchar",
            length: "100",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "consDetails",
            type: "text",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "subGoogleUid",
            type: "varchar",
            length: "255",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "subStatus",
            type: "enum",
            enum: ["approved", "pending", "rejected"],
            isNullable: false,
            default: "'pending'",
          },
          {
            name: "diagnosisName",
            type: "json",
            isNullable: false,
            comment: "Array of diagnosis names",
          },
          {
            name: "procedureName",
            type: "json",
            isNullable: false,
            comment: "Array of procedure names",
          },
          {
            name: "surgNotes",
            type: "text",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "IntEvents",
            type: "text",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "spOrCran",
            type: "varchar",
            length: "50",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "pos",
            type: "varchar",
            length: "50",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "approach",
            type: "varchar",
            length: "255",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "clinPres",
            type: "text",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "region",
            type: "varchar",
            length: "50",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          // Foreign key columns (temporarily nullable for migration)
          {
            name: "candDocId",
            type: "char",
            length: "36",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
            comment: "Temporary: Will be populated via mapping table",
          },
          {
            name: "procDocId",
            type: "char",
            length: "36",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
            comment: "Temporary: Will be populated via mapping table",
          },
          {
            name: "supervisorDocId",
            type: "char",
            length: "36",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
            comment: "Temporary: Will be populated via mapping table",
          },
          {
            name: "mainDiagDocId",
            type: "char",
            length: "36",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
            comment: "Temporary: Will be populated via mapping table",
          },
          // Temporary columns for migration
          {
            name: "mongo_object_id",
            type: "varchar",
            length: "24",
            isNullable: true,
            comment: "Temporary: Original MongoDB ObjectId for migration mapping",
          },
          {
            name: "mongo_cand_doc_id",
            type: "varchar",
            length: "24",
            isNullable: true,
            comment: "Temporary: MongoDB ObjectId for candidate",
          },
          {
            name: "mongo_proc_doc_id",
            type: "varchar",
            length: "24",
            isNullable: true,
            comment: "Temporary: MongoDB ObjectId for cal_surg",
          },
          {
            name: "mongo_supervisor_doc_id",
            type: "varchar",
            length: "24",
            isNullable: true,
            comment: "Temporary: MongoDB ObjectId for supervisor",
          },
          {
            name: "mongo_main_diag_doc_id",
            type: "varchar",
            length: "24",
            isNullable: true,
            comment: "Temporary: MongoDB ObjectId for main_diag",
          },
          {
            name: "createdAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
          },
          {
            name: "updatedAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
            onUpdate: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Create junction table for submission_proc_cpts (many-to-many)
    await queryRunner.createTable(
      new Table({
        name: "submission_proc_cpts",
        columns: [
          {
            name: "submissionId",
            type: "char",
            length: "36",
            isPrimary: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "procCptId",
            type: "char",
            length: "36",
            isPrimary: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
        ],
      }),
      true
    );

    // Create junction table for submission_icds (many-to-many)
    await queryRunner.createTable(
      new Table({
        name: "submission_icds",
        columns: [
          {
            name: "submissionId",
            type: "char",
            length: "36",
            isPrimary: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "icdId",
            type: "char",
            length: "36",
            isPrimary: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
        ],
      }),
      true
    );

    // Foreign keys will be added after data migration
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("submission_icds");
    await queryRunner.dropTable("submission_proc_cpts");
    await queryRunner.dropTable("submissions");
  }
}
