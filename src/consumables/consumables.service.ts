import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IConsumableDoc } from "./consumables.interface";
import { ConsumablesProvider } from "./consumables.provider";

@injectable()
export class ConsumablesService {
  constructor(@inject(ConsumablesProvider) private consumablesProvider: ConsumablesProvider) {}

  public async getAllByDepartment(departmentId: string, dataSource: DataSource): Promise<IConsumableDoc[]> | never {
    try {
      return await this.consumablesProvider.getAllByDepartment(departmentId, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getById(id: string, dataSource: DataSource): Promise<IConsumableDoc | null> | never {
    try {
      return await this.consumablesProvider.getById(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
