import { inject, injectable } from "inversify";
import { IMainDiag, IMainDiagDoc, IMainDiagInput, IMainDiagUpdateInput } from "./mainDiag.interface";
import { MainDiagProvider } from "./mainDiag.provider";

@injectable()
export class MainDiagService {
  constructor(@inject(MainDiagProvider) private mainDiagProvider: MainDiagProvider) {}

  public async createMainDiag(validatedReq: IMainDiagInput): Promise<IMainDiagDoc> | never {
    try {
      return await this.mainDiagProvider.createMainDiag(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllMainDiags(): Promise<IMainDiagDoc[]> | never {
    try {
      return await this.mainDiagProvider.getAllMainDiags();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getMainDiagById(validatedReq: { id: string }): Promise<IMainDiagDoc | null> | never {
    try {
      return await this.mainDiagProvider.getMainDiagById(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateMainDiag(validatedReq: IMainDiagUpdateInput): Promise<IMainDiagDoc | null> | never {
    try {
      return await this.mainDiagProvider.updateMainDiag(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteMainDiag(validatedReq: { id: string }): Promise<boolean> | never {
    try {
      return await this.mainDiagProvider.deleteMainDiag(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
