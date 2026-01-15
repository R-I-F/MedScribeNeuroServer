import { inject, injectable } from "inversify";
import { IJournal, IJournalDoc } from "./journal.interface";
import { Model, Types } from "mongoose";
import { Journal } from "./journal.schema";

@injectable()
export class JournalService {
  private journalModel: Model<IJournal> = Journal;

  public async createJournal(journalData: IJournal): Promise<IJournalDoc> | never {
    try {
      const newJournal = new this.journalModel(journalData);
      return await newJournal.save();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllJournals(): Promise<IJournalDoc[]> | never {
    try {
      return await this.journalModel.find().exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getJournalById(id: string): Promise<IJournalDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid journal ID");
      }
      return await this.journalModel.findById(id).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateJournal(id: string, updateData: Partial<IJournal>): Promise<IJournalDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid journal ID");
      }
      return await this.journalModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteJournal(id: string): Promise<boolean> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid journal ID");
      }
      const result = await this.journalModel.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findByGoogleUid(google_uid: string, excludeId?: string): Promise<IJournalDoc | null> | never {
    try {
      const query: any = { google_uid };
      if (excludeId && Types.ObjectId.isValid(excludeId)) {
        query._id = { $ne: excludeId };
      }
      return await this.journalModel.findOne(query).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkJournals(journalDataArray: IJournal[]): Promise<IJournalDoc[]> | never {
    try {
      return await this.journalModel.insertMany(journalDataArray);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findJournalsByGoogleUids(google_uids: string[]): Promise<IJournalDoc[]> | never {
    try {
      const uniqueUids = [...new Set(google_uids.filter(uid => uid && uid.trim() !== ""))];
      if (uniqueUids.length === 0) {
        return [];
      }
      return await this.journalModel.find({ google_uid: { $in: uniqueUids } }).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

