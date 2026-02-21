import { randomUUID } from "crypto";
import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { IPositionDoc, IPositionInput } from "./positions.interface";
import { PositionEntity } from "./positions.mDbSchema";

@injectable()
export class PositionsProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  public async create(data: IPositionInput, dataSource: DataSource): Promise<IPositionDoc> | never {
    const repo = dataSource.getRepository(PositionEntity);
    const entity = repo.create({ id: randomUUID(), position: data.position });
    const saved = await repo.save(entity);
    return saved as unknown as IPositionDoc;
  }

  public async update(id: string, data: Partial<IPositionInput>, dataSource: DataSource): Promise<IPositionDoc | null> | never {
    if (!this.uuidRegex.test(id)) throw new Error("Invalid position ID format");
    const repo = dataSource.getRepository(PositionEntity);
    const existing = await repo.findOne({ where: { id } });
    if (!existing) return null;
    if (data.position !== undefined) existing.position = data.position;
    const saved = await repo.save(existing);
    return saved as unknown as IPositionDoc;
  }

  public async delete(id: string, dataSource: DataSource): Promise<boolean> | never {
    if (!this.uuidRegex.test(id)) throw new Error("Invalid position ID format");
    const repo = dataSource.getRepository(PositionEntity);
    const result = await repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

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
