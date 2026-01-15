import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateArabProcMappingTable1735000005001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create migration mapping table for ArabProc
    await queryRunner.createTable(
      new Table({
        name: "migration_arab_proc_map",
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
            comment: "MariaDB UUID",
          },
          {
            name: "num_code",
            type: "varchar",
            length: "255",
            isNullable: false,
            comment: "Business key for verification",
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
        ],
      }),
      true
    );

    // Create index on num_code for faster lookups
    await queryRunner.createIndex(
      "migration_arab_proc_map",
      new TableIndex({
        name: "idx_migration_arab_proc_num_code",
        columnNames: ["num_code"],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("migration_arab_proc_map");
  }
}
