import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateProcCptsTable1735000002000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "proc_cpts",
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
            length: "100",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "alphaCode",
            type: "varchar",
            length: "10",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "numCode",
            type: "varchar",
            length: "10",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "description",
            type: "varchar",
            length: "500",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
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
    await queryRunner.dropTable("proc_cpts");
  }
}
