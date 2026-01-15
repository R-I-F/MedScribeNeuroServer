import { MigrationInterface, QueryRunner, Table, TableForeignKey } from "typeorm";

export class CreateCalSurgsTable1735000005002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create cal_surgs table
    await queryRunner.createTable(
      new Table({
        name: "cal_surgs",
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
            name: "timeStamp",
            type: "datetime",
            isNullable: false,
          },
          {
            name: "patientName",
            type: "varchar",
            length: "255",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "patientDob",
            type: "date",
            isNullable: false,
          },
          {
            name: "gender",
            type: "enum",
            enum: ["male", "female"],
            isNullable: false,
          },
          {
            name: "hospitalId",
            type: "char",
            length: "36",
            isNullable: true, // Will be set to NOT NULL after migration
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "arabProcId",
            type: "char",
            length: "36",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "procDate",
            type: "date",
            isNullable: false,
          },
          {
            name: "google_uid",
            type: "varchar",
            length: "255",
            isNullable: true,
          },
          {
            name: "formLink",
            type: "text",
            isNullable: true,
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

    // Add foreign key for hospital
    await queryRunner.createForeignKey(
      "cal_surgs",
      new TableForeignKey({
        columnNames: ["hospitalId"],
        referencedColumnNames: ["id"],
        referencedTableName: "hospitals",
        onDelete: "RESTRICT",
      })
    );

    // Add foreign key for arabProc (nullable)
    await queryRunner.createForeignKey(
      "cal_surgs",
      new TableForeignKey({
        columnNames: ["arabProcId"],
        referencedColumnNames: ["id"],
        referencedTableName: "arab_procs",
        onDelete: "SET NULL",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("cal_surgs");
  }
}
