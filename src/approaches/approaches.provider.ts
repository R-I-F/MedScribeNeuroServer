import { randomUUID } from "crypto";
import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { IApproachDoc, IApproachInput } from "./approaches.interface";
import { ApproachEntity } from "./approaches.mDbSchema";

@injectable()
export class ApproachesProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  public async create(data: IApproachInput, dataSource: DataSource): Promise<IApproachDoc> | never {
    const repo = dataSource.getRepository(ApproachEntity);
    const entity = repo.create({ id: randomUUID(), approach: data.approach });
    const saved = await repo.save(entity);
    return saved as unknown as IApproachDoc;
  }

  public async update(id: string, data: Partial<IApproachInput>, dataSource: DataSource): Promise<IApproachDoc | null> | never {
    if (!this.uuidRegex.test(id)) throw new Error("Invalid approach ID format");
    const repo = dataSource.getRepository(ApproachEntity);
    const existing = await repo.findOne({ where: { id } });
    if (!existing) return null;
    if (data.approach !== undefined) existing.approach = data.approach;
    const saved = await repo.save(existing);
    return saved as unknown as IApproachDoc;
  }

  public async delete(id: string, dataSource: DataSource): Promise<boolean> | never {
    if (!this.uuidRegex.test(id)) throw new Error("Invalid approach ID format");
    const repo = dataSource.getRepository(ApproachEntity);
    const result = await repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

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
