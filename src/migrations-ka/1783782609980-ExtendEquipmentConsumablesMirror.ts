import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Equipment & consumables become hub-fed mirror tables (full institute, all departments).
 *
 * The hub (LibelusRefApi) now owns the equipment/consumables reference sets —
 * department-linked, bilingual, served by /v1/departments/:deptCode/equipment and
 * /:deptCode/consumables. This migration upgrades the legacy single-department lookup
 * tables into mirrors of that data:
 *   - equipment / consumables gain "arName" + the mirror upsert timestamps
 *   - department_equipment / department_consumables join tables mirror the hub's wiring
 * Rows keep the hub's UUIDs as local PKs (same rule as the other mirror tables), so the
 * future legacy-submission ETL maps old ids by verbatim NS name.
 */
export class ExtendEquipmentConsumablesMirror1783782609980 implements MigrationInterface {
  name = "ExtendEquipmentConsumablesMirror1783782609980";

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "equipment" ADD "arName" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "equipment" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "equipment" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);

    await queryRunner.query(`ALTER TABLE "consumables" ADD "arName" character varying(100)`);
    await queryRunner.query(`ALTER TABLE "consumables" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    await queryRunner.query(`ALTER TABLE "consumables" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`);

    await queryRunner.query(`
      CREATE TABLE "department_equipment" (
        "departmentId" uuid NOT NULL,
        "equipmentId" character(36) NOT NULL,
        CONSTRAINT "PK_department_equipment" PRIMARY KEY ("departmentId", "equipmentId")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "department_equipment"
      ADD CONSTRAINT "FK_department_equipment_department"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "department_equipment"
      ADD CONSTRAINT "FK_department_equipment_equipment"
      FOREIGN KEY ("equipmentId") REFERENCES "equipment"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_department_equipment_equipment" ON "department_equipment" ("equipmentId")`
    );

    await queryRunner.query(`
      CREATE TABLE "department_consumables" (
        "departmentId" uuid NOT NULL,
        "consumableId" character(36) NOT NULL,
        CONSTRAINT "PK_department_consumables" PRIMARY KEY ("departmentId", "consumableId")
      )
    `);
    await queryRunner.query(`
      ALTER TABLE "department_consumables"
      ADD CONSTRAINT "FK_department_consumables_department"
      FOREIGN KEY ("departmentId") REFERENCES "departments"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(`
      ALTER TABLE "department_consumables"
      ADD CONSTRAINT "FK_department_consumables_consumable"
      FOREIGN KEY ("consumableId") REFERENCES "consumables"("id") ON DELETE CASCADE
    `);
    await queryRunner.query(
      `CREATE INDEX "IDX_department_consumables_consumable" ON "department_consumables" ("consumableId")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "department_consumables"`);
    await queryRunner.query(`DROP TABLE "department_equipment"`);
    await queryRunner.query(`ALTER TABLE "consumables" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "consumables" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "consumables" DROP COLUMN "arName"`);
    await queryRunner.query(`ALTER TABLE "equipment" DROP COLUMN "updatedAt"`);
    await queryRunner.query(`ALTER TABLE "equipment" DROP COLUMN "createdAt"`);
    await queryRunner.query(`ALTER TABLE "equipment" DROP COLUMN "arName"`);
  }
}
