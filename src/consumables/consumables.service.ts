import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IConsumableDoc, IConsumableInput, IConsumableUpdateInput } from "./consumables.interface";
import { ConsumablesProvider } from "./consumables.provider";

@injectable()
export class ConsumablesService {
  constructor(@inject(ConsumablesProvider) private consumablesProvider: ConsumablesProvider) {}

  public async getAll(dataSource: DataSource): Promise<IConsumableDoc[]> | never {
    try {
      return await this.consumablesProvider.getAll(dataSource);
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

  public async create(data: IConsumableInput, dataSource: DataSource): Promise<IConsumableDoc> | never {
    try {
      return await this.consumablesProvider.create(data, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async update(id: string, data: Partial<IConsumableInput>, dataSource: DataSource): Promise<IConsumableDoc | null> | never {
    try {
      return await this.consumablesProvider.update(id, data, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async delete(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      return await this.consumablesProvider.delete(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
