import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateSubmissionMappingTables1735000010000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create migration mapping table for Candidates
    await queryRunner.createTable(
      new Table({
        name: "migration_candidate_map",
        columns: [
          {
            name: "mongo_object_id",
            type: "varchar",
            length: "24",
            isPrimary: true,
            comment: "MongoDB ObjectId",
          },
          {
            name: "maria_uuid",
            type: "char",
            length: "36",
            isNullable: false,
            isUnique: true,
            comment: "MariaDB UUID",
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "email",
            type: "varchar",
            length: "255",
            isNullable: false,
            isUnique: true,
            comment: "Business key for verification",
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
        ],
      }),
      true
    );

    // Create index on email for faster lookups
    await queryRunner.createIndex(
      "migration_candidate_map",
      new TableIndex({
        name: "idx_migration_candidate_email",
        columnNames: ["email"],
      })
    );

    // Create migration mapping table for Supervisors
    await queryRunner.createTable(
      new Table({
        name: "migration_supervisor_map",
        columns: [
          {
            name: "mongo_object_id",
            type: "varchar",
            length: "24",
            isPrimary: true,
            comment: "MongoDB ObjectId",
          },
          {
            name: "maria_uuid",
            type: "char",
            length: "36",
            isNullable: false,
            isUnique: true,
            comment: "MariaDB UUID",
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "email",
            type: "varchar",
            length: "255",
            isNullable: false,
            isUnique: true,
            comment: "Business key for verification",
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
        ],
      }),
      true
    );

    // Create index on email for faster lookups
    await queryRunner.createIndex(
      "migration_supervisor_map",
      new TableIndex({
        name: "idx_migration_supervisor_email",
        columnNames: ["email"],
      })
    );

    // Create migration mapping table for MainDiags
    await queryRunner.createTable(
      new Table({
        name: "migration_main_diag_map",
        columns: [
          {
            name: "mongo_object_id",
            type: "varchar",
            length: "24",
            isPrimary: true,
            comment: "MongoDB ObjectId",
          },
          {
            name: "maria_uuid",
            type: "char",
            length: "36",
            isNullable: false,
            isUnique: true,
            comment: "MariaDB UUID",
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "title",
            type: "varchar",
            length: "200",
            isNullable: false,
            comment: "Business key for verification",
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
        ],
      }),
      true
    );

    // Create index on title for faster lookups
    await queryRunner.createIndex(
      "migration_main_diag_map",
      new TableIndex({
        name: "idx_migration_main_diag_title",
        columnNames: ["title"],
      })
    );

    // Create migration mapping table for CalSurgs
    // Note: Using mongo_object_id as primary key since cal_surgs may not have unique business keys
    await queryRunner.createTable(
      new Table({
        name: "migration_cal_surg_map",
        columns: [
          {
            name: "mongo_object_id",
            type: "varchar",
            length: "24",
            isPrimary: true,
            comment: "MongoDB ObjectId",
          },
          {
            name: "maria_uuid",
            type: "char",
            length: "36",
            isNullable: false,
            isUnique: true,
            comment: "MariaDB UUID",
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "google_uid",
            type: "varchar",
            length: "255",
            isNullable: true,
            comment: "Optional business key for verification",
          },
        ],
      }),
      true
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("migration_cal_surg_map");
    await queryRunner.dropTable("migration_main_diag_map");
    await queryRunner.dropTable("migration_supervisor_map");
    await queryRunner.dropTable("migration_candidate_map");
  }
}
