import { inject, injectable } from "inversify";
import { IConf, IConfDoc } from "./conf.interface";
import { Model, Types } from "mongoose";
import { Conf } from "./conf.schema";

@injectable()
export class ConfService {
  private confModel: Model<IConf> = Conf;

  public async createConf(confData: IConf): Promise<IConfDoc> | never {
    try {
      const newConf = new this.confModel(confData);
      return await newConf.save();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllConfs(): Promise<IConfDoc[]> | never {
    try {
      return await this.confModel.find().populate('presenter').exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getConfById(id: string): Promise<IConfDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid conf ID");
      }
      return await this.confModel.findById(id).populate('presenter').exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateConf(id: string, updateData: Partial<IConf>): Promise<IConfDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid conf ID");
      }
      return await this.confModel.findByIdAndUpdate(id, updateData, { new: true }).populate('presenter').exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteConf(id: string): Promise<boolean> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid conf ID");
      }
      const result = await this.confModel.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findByGoogleUid(google_uid: string, excludeId?: string): Promise<IConfDoc | null> | never {
    try {
      const query: any = { google_uid };
      if (excludeId && Types.ObjectId.isValid(excludeId)) {
        query._id = { $ne: excludeId };
      }
      return await this.confModel.findOne(query).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findConfsByGoogleUids(google_uids: string[]): Promise<IConfDoc[]> | never {
    try {
      const uniqueUids = [...new Set(google_uids.filter(uid => uid && uid.trim() !== ""))];
      if (uniqueUids.length === 0) {
        return [];
      }
      return await this.confModel.find({ google_uid: { $in: uniqueUids } }).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

