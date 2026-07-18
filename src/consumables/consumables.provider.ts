import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { IConsumableDoc } from "./consumables.interface";

/**
 * Read-only consumable lookups over the LOCAL MIRROR (synced from the hub by
 * RefMirrorService). The legacy `{ id, consumables }` read shape is preserved by
 * selecting exactly those columns; the mirror carries all departments, so list
 * reads are scoped via department_consumables. Writes moved to the hub pipeline.
 */
@injectable()
export class ConsumablesProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  public async getAllByDepartment(departmentId: string, dataSource: DataSource): Promise<IConsumableDoc[]> | never {
    try {
      return await dataSource.query(
        `SELECT c."id", c."consumables", c."arName"
           FROM "consumables" c
           JOIN "department_consumables" dc ON dc."consumableId" = c."id"
          WHERE dc."departmentId" = $1
          ORDER BY c."consumables"`,
        [departmentId]
      );
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getById(id: string, dataSource: DataSource): Promise<IConsumableDoc | null> | never {
    try {
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid consumable ID format");
      }
      const rows = await dataSource.query(
        `SELECT "id", "consumables", "arName" FROM "consumables" WHERE "id" = $1`,
        [id]
      );
      return rows[0] ?? null;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
