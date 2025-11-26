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

  public async createCand(candData: ICand): Promise<ICandDoc | never> {
    try {
      const newCand: ICandDoc = await new this.candModel(candData).save();
      return newCand;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandByEmail(email: string): Promise<ICandDoc | null> {
    try {
      const cand = await this.candModel.findOne({ email });
      return cand;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async resetAllCandidatePasswords(
    hashedPassword: string
  ): Promise<number> {
    try {
      const result = await this.candModel.updateMany({}, { $set: { password: hashedPassword } });
      return (result as { modifiedCount?: number }).modifiedCount ?? 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
