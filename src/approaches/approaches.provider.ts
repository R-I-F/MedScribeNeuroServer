import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { IApproachDoc } from "./approaches.interface";
import { ApproachEntity } from "./approaches.mDbSchema";

@injectable()
export class ApproachesProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  public async getAll(dataSource: DataSource): Promise<IApproachDoc[]> | never {
    try {
      const repo = dataSource.getRepository(ApproachEntity);
      const rows = await repo.find();
      return rows as unknown as IApproachDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getById(id: string, dataSource: DataSource): Promise<IApproachDoc | null> | never {
    try {
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid approach ID format");
      }
      const repo = dataSource.getRepository(ApproachEntity);
      const row = await repo.findOne({ where: { id } });
      return row as unknown as IApproachDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
