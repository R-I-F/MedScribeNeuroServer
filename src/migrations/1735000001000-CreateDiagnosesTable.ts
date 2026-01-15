import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateDiagnosesTable1735000001000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "diagnoses",
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
            name: "icdCode",
            type: "varchar",
            length: "255",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "icdName",
            type: "varchar",
            length: "500",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "neuroLogName",
            type: "json",
            isNullable: true,
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
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("diagnoses");
  }
}
