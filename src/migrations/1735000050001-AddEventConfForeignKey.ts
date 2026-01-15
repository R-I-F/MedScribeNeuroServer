import { MigrationInterface, QueryRunner, TableForeignKey } from "typeorm";

export class AddEventConfForeignKey1735000050001 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add foreign key for confId
    await queryRunner.createForeignKey(
      "events",
      new TableForeignKey({
        columnNames: ["confId"],
        referencedColumnNames: ["id"],
        referencedTableName: "confs",
        onDelete: "RESTRICT",
        name: "FK_events_confId",
      })
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const eventsTable = await queryRunner.getTable("events");
    if (eventsTable) {
      const foreignKeys = eventsTable.foreignKeys;
      for (const fk of foreignKeys) {
        if (fk.name === "FK_events_confId") {
          await queryRunner.dropForeignKey("events", fk);
        }
      }
    }
  }
}
