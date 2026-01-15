import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateConfsTable1735000050000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "confs",
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
            name: "confTitle",
            type: "varchar",
            length: "255",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "google_uid",
            type: "varchar",
            length: "255",
            isNullable: false,
            isUnique: true,
          },
          {
            name: "presenterId",
            type: "char",
            length: "36",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "date",
            type: "date",
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

    // Add foreign key for presenterId
    await queryRunner.createForeignKey(
      "confs",
      new TableForeignKey({
        columnNames: ["presenterId"],
        referencedColumnNames: ["id"],
        referencedTableName: "supervisors",
        onDelete: "RESTRICT",
        name: "FK_confs_presenterId",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("confs");
  }
}
