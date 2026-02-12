import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IRegionDoc } from "./regions.interface";
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
}
