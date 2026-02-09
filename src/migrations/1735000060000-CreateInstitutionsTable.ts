import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateInstitutionsTable1735000060000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "institutions",
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
            name: "code",
            type: "varchar",
            length: "100",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "name",
            type: "varchar",
            length: "255",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "databaseName",
            type: "varchar",
            length: "100",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "isAcademic",
            type: "tinyint",
            width: 1,
            default: 1,
            isNullable: false,
          },
          {
            name: "isPractical",
            type: "tinyint",
            width: 1,
            default: 1,
            isNullable: false,
          },
          {
            name: "isActive",
            type: "tinyint",
            width: 1,
            default: 1,
            isNullable: false,
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
    await queryRunner.dropTable("institutions");
  }
}
