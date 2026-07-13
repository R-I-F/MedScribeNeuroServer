import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IEquipmentDoc } from "./equipment.interface";
import { EquipmentProvider } from "./equipment.provider";

@injectable()
export class EquipmentService {
  constructor(@inject(EquipmentProvider) private equipmentProvider: EquipmentProvider) {}

  public async getAllByDepartment(departmentId: string, dataSource: DataSource): Promise<IEquipmentDoc[]> | never {
    try {
      return await this.equipmentProvider.getAllByDepartment(departmentId, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getById(id: string, dataSource: DataSource): Promise<IEquipmentDoc | null> | never {
    try {
      return await this.equipmentProvider.getById(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
