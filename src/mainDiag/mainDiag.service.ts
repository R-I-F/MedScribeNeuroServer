import { inject, injectable } from "inversify";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";
import { ICand, ICandDoc } from "./cand.interface";
import { Model } from "mongoose";
import { Cand } from "./cand.schema";
import { CandProvider } from "./cand.provider";

injectable();
export class CandService {
  constructor(@inject(CandProvider) private candProvider: CandProvider) {}
  private candModel: Model<ICand> = Cand;

  public async createBulkCands(candData: ICand[]) {
    try {
      const newCandArr: ICandDoc[] = await this.candModel.insertMany(candData);
      return newCandArr;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createCandsFromExternal(validatedReq: Partial<IExternalRow>) {
    const items = await this.candProvider.provideCandsFromExternal(
      validatedReq
    );
    const newCandArr = await this.createBulkCands(items);
    return newCandArr;
  }
}
