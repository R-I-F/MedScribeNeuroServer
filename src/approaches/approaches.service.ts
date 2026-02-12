import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IApproachDoc } from "./approaches.interface";
import { ApproachesProvider } from "./approaches.provider";

@injectable()
export class ApproachesService {
  constructor(@inject(ApproachesProvider) private approachesProvider: ApproachesProvider) {}

  public async getAll(dataSource: DataSource): Promise<IApproachDoc[]> | never {
    try {
      return await this.approachesProvider.getAll(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getById(id: string, dataSource: DataSource): Promise<IApproachDoc | null> | never {
    try {
      return await this.approachesProvider.getById(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
