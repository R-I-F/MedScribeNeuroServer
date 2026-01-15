import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateHospitalMappingTable1735000005000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create migration mapping table for Hospital
    await queryRunner.createTable(
      new Table({
        name: "migration_hospital_map",
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
            name: "eng_name",
            type: "varchar",
            length: "100",
            isNullable: false,
            comment: "Business key for verification",
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "arab_name",
            type: "varchar",
            length: "100",
            isNullable: false,
            comment: "Business key for verification",
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
        ],
      }),
      true
    );

    // Create index on eng_name for faster lookups
    await queryRunner.createIndex(
      "migration_hospital_map",
      new TableIndex({
        name: "idx_migration_hospital_eng_name",
        columnNames: ["eng_name"],
      })
    );

    // Create index on arab_name for faster lookups
    await queryRunner.createIndex(
      "migration_hospital_map",
      new TableIndex({
        name: "idx_migration_hospital_arab_name",
        columnNames: ["arab_name"],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("migration_hospital_map");
  }
}
