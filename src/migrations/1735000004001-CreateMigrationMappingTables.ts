import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";

export class CreateMigrationMappingTables1735000004001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create migration mapping table for Diagnosis
    await queryRunner.createTable(
      new Table({
        name: "migration_diagnosis_map",
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
            name: "icd_code",
            type: "varchar",
            length: "255",
            isNullable: false,
            comment: "Business key for verification",
          },
        ],
      }),
      true
    );

    // Create index on icd_code for faster lookups
    await queryRunner.createIndex(
      "migration_diagnosis_map",
      new TableIndex({
        name: "idx_migration_diagnosis_icd_code",
        columnNames: ["icd_code"],
      })
    );

    // Create migration mapping table for ProcCpt
    await queryRunner.createTable(
      new Table({
        name: "migration_proc_cpt_map",
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
            length: "10",
            isNullable: false,
            comment: "Business key for verification",
          },
        ],
      }),
      true
    );

    // Create index on num_code for faster lookups
    await queryRunner.createIndex(
      "migration_proc_cpt_map",
      new TableIndex({
        name: "idx_migration_proc_cpt_num_code",
        columnNames: ["num_code"],
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("migration_proc_cpt_map");
    await queryRunner.dropTable("migration_diagnosis_map");
  }
}
