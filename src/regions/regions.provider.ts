import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { IRegionDoc } from "./regions.interface";
import { RegionEntity } from "./regions.mDbSchema";

@injectable()
export class RegionsProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  public async getAll(dataSource: DataSource): Promise<IRegionDoc[]> | never {
    try {
      const repo = dataSource.getRepository(RegionEntity);
      const rows = await repo.find();
      return rows as unknown as IRegionDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getById(id: string, dataSource: DataSource): Promise<IRegionDoc | null> | never {
    try {
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid region ID format");
      }
      const repo = dataSource.getRepository(RegionEntity);
      const row = await repo.findOne({ where: { id } });
      return row as unknown as IRegionDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
