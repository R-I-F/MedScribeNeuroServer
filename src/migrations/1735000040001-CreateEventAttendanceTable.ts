import { MigrationInterface, QueryRunner, Table, TableIndex, TableForeignKey } from "typeorm";

export class CreateEventAttendanceTable1735000040001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "event_attendance",
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
            name: "eventId",
            type: "char",
            length: "36",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "candidateId",
            type: "char",
            length: "36",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
          },
          {
            name: "addedBy",
            type: "char",
            length: "36",
            isNullable: false,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
            comment: "UUID of who added this attendance (instituteAdmin, supervisor, or candidate). No FK constraint - enforced in application logic.",
          },
          {
            name: "addedByRole",
            type: "enum",
            enum: ["instituteAdmin", "supervisor", "candidate"],
            isNullable: false,
          },
          {
            name: "flagged",
            type: "boolean",
            default: false,
            isNullable: false,
          },
          {
            name: "flaggedBy",
            type: "char",
            length: "36",
            isNullable: true,
            charset: "utf8mb4",
            collation: "utf8mb4_unicode_ci",
            comment: "UUID of who flagged this attendance. No FK constraint - enforced in application logic.",
          },
          {
            name: "flaggedAt",
            type: "datetime",
            isNullable: true,
          },
          {
            name: "points",
            type: "int",
            default: 1,
            isNullable: false,
          },
          {
            name: "createdAt",
            type: "datetime",
            default: "CURRENT_TIMESTAMP",
          },
        ],
      }),
      true
    );

    // Create unique index on (eventId, candidateId) to ensure one attendance record per candidate per event
    await queryRunner.createIndex(
      "event_attendance",
      new TableIndex({
        name: "idx_event_attendance_unique",
        columnNames: ["eventId", "candidateId"],
        isUnique: true,
      })
    );

    // Add foreign key to events table
    await queryRunner.createForeignKey(
      "event_attendance",
      new TableForeignKey({
        columnNames: ["eventId"],
        referencedColumnNames: ["id"],
        referencedTableName: "events",
        onDelete: "CASCADE",
        name: "FK_event_attendance_eventId",
      })
    );

    // Add foreign key to candidates table
    await queryRunner.createForeignKey(
      "event_attendance",
      new TableForeignKey({
        columnNames: ["candidateId"],
        referencedColumnNames: ["id"],
        referencedTableName: "candidates",
        onDelete: "CASCADE",
        name: "FK_event_attendance_candidateId",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable("event_attendance");
  }
}
