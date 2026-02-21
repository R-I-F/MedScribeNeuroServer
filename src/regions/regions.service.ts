import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IRegionDoc, IRegionInput } from "./regions.interface";
import { RegionsProvider } from "./regions.provider";

@injectable()
export class RegionsService {
  constructor(@inject(RegionsProvider) private regionsProvider: RegionsProvider) {}

  public async getAll(dataSource: DataSource): Promise<IRegionDoc[]> | never {
    try {
      return await this.regionsProvider.getAll(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getById(id: string, dataSource: DataSource): Promise<IRegionDoc | null> | never {
    try {
      return await this.regionsProvider.getById(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async create(data: IRegionInput, dataSource: DataSource): Promise<IRegionDoc> | never {
    try {
      return await this.regionsProvider.create(data, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async update(id: string, data: Partial<IRegionInput>, dataSource: DataSource): Promise<IRegionDoc | null> | never {
    try {
      return await this.regionsProvider.update(id, data, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async delete(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      return await this.regionsProvider.delete(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
