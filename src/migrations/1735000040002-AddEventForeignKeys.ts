import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

export class AddEventForeignKeys1735000040002 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add foreign key for lectureId
    await queryRunner.createForeignKey(
      "events",
      new TableForeignKey({
        columnNames: ["lectureId"],
        referencedColumnNames: ["id"],
        referencedTableName: "lectures",
        onDelete: "RESTRICT",
        name: "FK_events_lectureId",
      })
    );

    // Add foreign key for journalId
    await queryRunner.createForeignKey(
      "events",
      new TableForeignKey({
        columnNames: ["journalId"],
        referencedColumnNames: ["id"],
        referencedTableName: "journals",
        onDelete: "RESTRICT",
        name: "FK_events_journalId",
      })
    );

    // Note: confId FK will be added later when confs table is migrated
    // presenterId has no FK constraint (polymorphic relationship - enforced in application logic)
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop foreign keys
    const eventsTable = await queryRunner.getTable("events");
    if (eventsTable) {
      const foreignKeys = eventsTable.foreignKeys;
      for (const fk of foreignKeys) {
        if (fk.name === "FK_events_lectureId" || fk.name === "FK_events_journalId") {
          await queryRunner.dropForeignKey("events", fk);
        }
      }
    }
  }
}
