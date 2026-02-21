import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IApproachDoc, IApproachInput } from "./approaches.interface";
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

  public async create(data: IApproachInput, dataSource: DataSource): Promise<IApproachDoc> | never {
    try {
      return await this.approachesProvider.create(data, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async update(id: string, data: Partial<IApproachInput>, dataSource: DataSource): Promise<IApproachDoc | null> | never {
    try {
      return await this.approachesProvider.update(id, data, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async delete(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      return await this.approachesProvider.delete(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
