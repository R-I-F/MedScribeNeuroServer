import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * Expands insUsed and consUsed from varchar(100) to varchar(1000)
 * to support longer comma-separated lists of instruments and consumables.
 */
export class ExpandInsUsedConsUsedLength1735000090000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      "submissions",
      "insUsed",
      new TableColumn({
        name: "insUsed",
        type: "varchar",
        length: "1000",
        isNullable: false,
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_ci",
      })
    );

    await queryRunner.changeColumn(
      "submissions",
      "consUsed",
      new TableColumn({
        name: "consUsed",
        type: "varchar",
        length: "1000",
        isNullable: false,
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_ci",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      "submissions",
      "insUsed",
      new TableColumn({
        name: "insUsed",
        type: "varchar",
        length: "100",
        isNullable: false,
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_ci",
      })
    );

    await queryRunner.changeColumn(
      "submissions",
      "consUsed",
      new TableColumn({
        name: "consUsed",
        type: "varchar",
        length: "100",
        isNullable: false,
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_ci",
      })
    );
  }
}
