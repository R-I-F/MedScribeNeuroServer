import { inject, injectable } from "inversify";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";
import { ICand, ICandDoc } from "./cand.interface";
import { Model } from "mongoose";
import { Cand } from "./cand.schema";
import { CandProvider } from "./cand.provider";
import bcryptjs from "bcryptjs";

injectable();
export class CandService {
  constructor(@inject(CandProvider) private candProvider: CandProvider) {}
  private candModel: Model<ICand> = Cand;

  public async createBulkCands(candData: ICand[]) {
    try {
      // Hash passwords before inserting (for bulk operations from external sources)
      const hashedCandData = await Promise.all(
        candData.map(async (cand) => {
          if (cand.password) {
            const hashedPassword = await bcryptjs.hash(cand.password, 10);
            return { ...cand, password: hashedPassword };
          }
          return cand;
        })
      );
      const newCandArr: ICandDoc[] = await this.candModel.insertMany(hashedCandData);
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

  public async findCandidatesByEmails(emails: string[]): Promise<ICandDoc[]> | never {
    try {
      const uniqueEmails = [...new Set(emails.filter(email => email && email.trim() !== ""))];
      if (uniqueEmails.length === 0) {
        return [];
      }
      return await this.candModel.find({ email: { $in: uniqueEmails } }).exec();
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

  public async getAllCandidates(): Promise<ICandDoc[]> | never {
    try {
      const allCandidates = await this.candModel.find({}).exec();
      return allCandidates;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandById(id: string): Promise<ICandDoc | null> | never {
    try {
      return await this.candModel.findById(id).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async resetCandidatePassword(id: string): Promise<ICandDoc | null> | never {
    try {
      const defaultPassword = "MEDscrobe01$";
      const hashedPassword = await bcryptjs.hash(defaultPassword, 10);
      const updatedCandidate = await this.candModel.findByIdAndUpdate(
        id,
        { $set: { password: hashedPassword } },
        { new: true }
      ).exec();
      return updatedCandidate;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
