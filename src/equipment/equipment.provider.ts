import { randomUUID } from "crypto";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IEquipmentDoc, IEquipmentInput } from "./equipment.interface";
import { EquipmentEntity } from "./equipment.mDbSchema";
import { UtilService } from "../utils/utils.service";

@injectable()
export class EquipmentProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor(@inject(UtilService) private utilService: UtilService) {}

  public async create(data: IEquipmentInput, dataSource: DataSource): Promise<IEquipmentDoc> | never {
    const repo = dataSource.getRepository(EquipmentEntity);
    const entity = repo.create({ id: randomUUID(), equipment: this.utilService.sanitizeLabel(data.equipment) });
    const saved = await repo.save(entity);
    return saved as unknown as IEquipmentDoc;
  }

  public async update(id: string, data: Partial<IEquipmentInput>, dataSource: DataSource): Promise<IEquipmentDoc | null> | never {
    if (!this.uuidRegex.test(id)) throw new Error("Invalid equipment ID format");
    const repo = dataSource.getRepository(EquipmentEntity);
    const existing = await repo.findOne({ where: { id } });
    if (!existing) return null;
    if (data.equipment !== undefined) existing.equipment = this.utilService.sanitizeLabel(data.equipment);
    const saved = await repo.save(existing);
    return saved as unknown as IEquipmentDoc;
  }

  public async delete(id: string, dataSource: DataSource): Promise<boolean> | never {
    if (!this.uuidRegex.test(id)) throw new Error("Invalid equipment ID format");
    const repo = dataSource.getRepository(EquipmentEntity);
    const result = await repo.delete(id);
    return (result.affected ?? 0) > 0;
  }

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
