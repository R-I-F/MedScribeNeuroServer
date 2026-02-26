import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IConsumableDoc, IConsumableInput, IConsumableUpdateInput } from "./consumables.interface";
import { ConsumableEntity } from "./consumables.mDbSchema";
import { UtilService } from "../utils/utils.service";

@injectable()
export class ConsumablesProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(@inject(UtilService) private utilService: UtilService) {}

  public async create(data: IConsumableInput, dataSource: DataSource): Promise<IConsumableDoc> | never {
    const repo = dataSource.getRepository(ConsumableEntity);
    const entity = repo.create({ id: randomUUID(), consumables: this.utilService.sanitizeLabel(data.consumables) });
    const saved = await repo.save(entity);
    return saved as unknown as IConsumableDoc;
  }

  public async update(id: string, data: Partial<IConsumableInput>, dataSource: DataSource): Promise<IConsumableDoc | null> | never {
    if (!this.uuidRegex.test(id)) throw new Error("Invalid consumable ID format");
    const repo = dataSource.getRepository(ConsumableEntity);
    const existing = await repo.findOne({ where: { id } });
    if (!existing) return null;
    if (data.consumables !== undefined) existing.consumables = this.utilService.sanitizeLabel(data.consumables);
    const saved = await repo.save(existing);
    return saved as unknown as IConsumableDoc;
  }

  public async delete(id: string, dataSource: DataSource): Promise<boolean> | never {
    if (!this.uuidRegex.test(id)) throw new Error("Invalid consumable ID format");
    const repo = dataSource.getRepository(ConsumableEntity);
    const result = await repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

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
