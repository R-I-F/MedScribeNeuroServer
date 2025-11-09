import { injectable, inject } from "inversify";
import { ISub, ISubDoc } from "./interfaces/sub.interface";
import { Model } from "mongoose";
import { Sub } from "./sub.schema";

@injectable()
export class SubService {
  constructor() {}
  private subModel: Model<ISub> = Sub;

  public async createBulkSub(subData: ISub[]): Promise<ISubDoc[]> {
    try {
      // console.log("subData ", subData[0])
      const newSubArr = await this.subModel.insertMany(subData);
      return newSubArr;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getAllSubs(): Promise<ISubDoc[]> {
    try {
      const allSubs = await this.subModel.find({});
      return allSubs;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}