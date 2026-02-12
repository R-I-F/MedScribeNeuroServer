import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IPositionDoc } from "./positions.interface";
import { PositionsProvider } from "./positions.provider";

@injectable()
export class PositionsService {
  constructor(@inject(PositionsProvider) private positionsProvider: PositionsProvider) {}

  public async getAll(dataSource: DataSource): Promise<IPositionDoc[]> | never {
    try {
      return await this.positionsProvider.getAll(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getById(id: string, dataSource: DataSource): Promise<IPositionDoc | null> | never {
    try {
      return await this.positionsProvider.getById(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
