import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateMainDiagsTable1735000004002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create main_diags table
    await queryRunner.createTable(
      new Table({
        name: "main_diags",
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
            name: "title",
            type: "varchar",
            length: "200",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "mongo_object_id",
            type: "varchar",
            length: "24",
            isNullable: true,
            comment: "Temporary: Original MongoDB ObjectId for migration mapping",
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

    // Create junction table for main_diag_diagnoses (many-to-many)
    await queryRunner.createTable(
      new Table({
        name: "main_diag_diagnoses",
        columns: [
          {
            name: "mainDiagId",
            type: "char",
            length: "36",
            isPrimary: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "diagnosisId",
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

    // Create junction table for main_diag_procs (many-to-many)
    await queryRunner.createTable(
      new Table({
        name: "main_diag_procs",
        columns: [
          {
            name: "mainDiagId",
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

    // Add foreign keys for main_diag_diagnoses
    await queryRunner.createForeignKey(
      "main_diag_diagnoses",
      new TableForeignKey({
        columnNames: ["mainDiagId"],
        referencedColumnNames: ["id"],
        referencedTableName: "main_diags",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "main_diag_diagnoses",
      new TableForeignKey({
        columnNames: ["diagnosisId"],
        referencedColumnNames: ["id"],
        referencedTableName: "diagnoses",
        onDelete: "CASCADE",
      })
    );

    // Add foreign keys for main_diag_procs
    await queryRunner.createForeignKey(
      "main_diag_procs",
      new TableForeignKey({
        columnNames: ["mainDiagId"],
        referencedColumnNames: ["id"],
        referencedTableName: "main_diags",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createForeignKey(
      "main_diag_procs",
      new TableForeignKey({
        columnNames: ["procCptId"],
        referencedColumnNames: ["id"],
        referencedTableName: "proc_cpts",
        onDelete: "CASCADE",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("main_diag_procs");
    await queryRunner.dropTable("main_diag_diagnoses");
    await queryRunner.dropTable("main_diags");
  }
}
