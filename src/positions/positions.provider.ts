import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { IPositionDoc } from "./positions.interface";
import { PositionEntity } from "./positions.mDbSchema";

@injectable()
export class PositionsProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  public async getAll(dataSource: DataSource): Promise<IPositionDoc[]> | never {
    try {
      const repo = dataSource.getRepository(PositionEntity);
      const rows = await repo.find();
      return rows as unknown as IPositionDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getById(id: string, dataSource: DataSource): Promise<IPositionDoc | null> | never {
    try {
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid position ID format");
      }
      const repo = dataSource.getRepository(PositionEntity);
      const row = await repo.findOne({ where: { id } });
      return row as unknown as IPositionDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
