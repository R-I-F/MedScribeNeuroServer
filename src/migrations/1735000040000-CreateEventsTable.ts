import { MigrationInterface, QueryRunner, Table } from "typeorm";

export class CreateEventsTable1735000040000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "events",
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
            name: "type",
            type: "enum",
            enum: ["lecture", "journal", "conf"],
            isNullable: false,
          },
          {
            name: "lectureId",
            type: "char",
            length: "36",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "journalId",
            type: "char",
            length: "36",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "confId",
            type: "char",
            length: "36",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "dateTime",
            type: "datetime",
            isNullable: false,
          },
          {
            name: "location",
            type: "varchar",
            length: "255",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "presenterId",
            type: "char",
            length: "36",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
            comment: "Polymorphic: Supervisor UUID (for lecture/conf) or Candidate UUID (for journal). No FK constraint - enforced in application logic.",
          },
          {
            name: "status",
            type: "enum",
            enum: ["booked", "held", "canceled"],
            isNullable: false,
            default: "'booked'",
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
    await queryRunner.dropTable("events");
  }
}
