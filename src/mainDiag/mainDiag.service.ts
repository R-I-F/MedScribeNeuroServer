import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IMainDiag, IMainDiagDoc, IMainDiagInput, IMainDiagUpdateInput } from "./mainDiag.interface";
import { MainDiagProvider } from "./mainDiag.provider";

@injectable()
export class MainDiagService {
  constructor(@inject(MainDiagProvider) private mainDiagProvider: MainDiagProvider) {}

  public async createMainDiag(validatedReq: IMainDiagInput, dataSource: DataSource): Promise<IMainDiagDoc> | never {
    try {
      return await this.mainDiagProvider.createMainDiag(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllMainDiags(dataSource: DataSource): Promise<IMainDiagDoc[]> | never {
    try {
      return await this.mainDiagProvider.getAllMainDiags(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getMainDiagById(validatedReq: { id: string }, dataSource: DataSource): Promise<IMainDiagDoc | null> | never {
    try {
      return await this.mainDiagProvider.getMainDiagById(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateMainDiag(validatedReq: IMainDiagUpdateInput, dataSource: DataSource): Promise<IMainDiagDoc | null> | never {
    try {
      return await this.mainDiagProvider.updateMainDiag(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteMainDiag(validatedReq: { id: string }, dataSource: DataSource): Promise<boolean> | never {
    try {
      return await this.mainDiagProvider.deleteMainDiag(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async removeProcsFromMainDiag(
    mainDiagId: string,
    numCodes: string[],
    dataSource: DataSource
  ): Promise<IMainDiagDoc | null> | never {
    try {
      return await this.mainDiagProvider.removeProcsFromMainDiag(mainDiagId, numCodes, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async removeDiagnosisFromMainDiag(
    mainDiagId: string,
    icdCodes: string[],
    dataSource: DataSource
  ): Promise<IMainDiagDoc | null> | never {
    try {
      return await this.mainDiagProvider.removeDiagnosisFromMainDiag(mainDiagId, icdCodes, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
