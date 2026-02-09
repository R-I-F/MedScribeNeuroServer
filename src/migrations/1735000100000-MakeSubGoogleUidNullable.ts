import { MigrationInterface, QueryRunner, TableColumn } from "typeorm";

/**
 * Makes subGoogleUid nullable so webapp-created submissions do not require it.
 * Existing rows keep their values; new rows may have NULL.
 * UNIQUE is kept so existing UIDs remain unique; multiple NULLs are allowed in MySQL/MariaDB.
 */
export class MakeSubGoogleUidNullable1735000100000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      "submissions",
      "subGoogleUid",
      new TableColumn({
        name: "subGoogleUid",
        type: "varchar",
        length: "255",
        isNullable: true,
        isUnique: true,
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_ci",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.changeColumn(
      "submissions",
      "subGoogleUid",
      new TableColumn({
        name: "subGoogleUid",
        type: "varchar",
        length: "255",
        isNullable: false,
        isUnique: true,
        charset: "utf8mb4",
        collation: "utf8mb4_unicode_ci",
      })
    );
  }
}
