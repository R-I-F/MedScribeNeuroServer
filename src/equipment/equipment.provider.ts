import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { IEquipmentDoc } from "./equipment.interface";
import { EquipmentEntity } from "./equipment.mDbSchema";

@injectable()
export class EquipmentProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  public async getAll(dataSource: DataSource): Promise<IEquipmentDoc[]> | never {
    try {
      const repo = dataSource.getRepository(EquipmentEntity);
      const rows = await repo.find();
      return rows as unknown as IEquipmentDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getById(id: string, dataSource: DataSource): Promise<IEquipmentDoc | null> | never {
    try {
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid equipment ID format");
      }
      const repo = dataSource.getRepository(EquipmentEntity);
      const row = await repo.findOne({ where: { id } });
      return row as unknown as IEquipmentDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
