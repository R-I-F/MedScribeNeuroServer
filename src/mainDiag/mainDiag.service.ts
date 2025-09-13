import { inject, injectable } from "inversify";
import { IMainDiag, IMainDiagDoc } from "./mainDiag.interface";
import { Model } from "mongoose";
import { MainDiag } from "./mainDiag.schema";
import { MainDiagProvider } from "./mainDiag.provider"

injectable();
export class CandService {
  constructor(@inject(MainDiagProvider) private mainDiagProvider: MainDiagProvider) {}
  private mainDiagModel: Model<IMainDiag> = MainDiag;

  public async createMainDiag(mainDiagData: IMainDiag) {
    try {
      const newMainDiag: IMainDiag = await new this.mainDiagModel(mainDiagData);
      return newMainDiag;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
