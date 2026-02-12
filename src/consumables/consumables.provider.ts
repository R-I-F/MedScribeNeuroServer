import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { IConsumableDoc } from "./consumables.interface";
import { ConsumableEntity } from "./consumables.mDbSchema";

@injectable()
export class ConsumablesProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  public async getAll(dataSource: DataSource): Promise<IConsumableDoc[]> | never {
    try {
      const repo = dataSource.getRepository(ConsumableEntity);
      const rows = await repo.find();
      return rows as unknown as IConsumableDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getById(id: string, dataSource: DataSource): Promise<IConsumableDoc | null> | never {
    try {
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid consumable ID format");
      }
      const repo = dataSource.getRepository(ConsumableEntity);
      const row = await repo.findOne({ where: { id } });
      return row as unknown as IConsumableDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
