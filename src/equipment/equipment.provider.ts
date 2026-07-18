import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { IEquipmentDoc } from "./equipment.interface";

/**
 * Read-only equipment lookups over the LOCAL MIRROR (synced from the hub by
 * RefMirrorService). The legacy `{ id, equipment }` read shape is preserved by
 * selecting exactly those columns; the mirror carries all departments, so list
 * reads are scoped via department_equipment. Writes moved to the hub pipeline.
 */
@injectable()
export class EquipmentProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  public async getAllByDepartment(departmentId: string, dataSource: DataSource): Promise<IEquipmentDoc[]> | never {
    try {
      return await dataSource.query(
        `SELECT e."id", e."equipment", e."arName"
           FROM "equipment" e
           JOIN "department_equipment" de ON de."equipmentId" = e."id"
          WHERE de."departmentId" = $1
          ORDER BY e."equipment"`,
        [departmentId]
      );
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getById(id: string, dataSource: DataSource): Promise<IEquipmentDoc | null> | never {
    try {
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid equipment ID format");
      }
      const rows = await dataSource.query(
        `SELECT "id", "equipment", "arName" FROM "equipment" WHERE "id" = $1`,
        [id]
      );
      return rows[0] ?? null;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
