import { inject, injectable } from "inversify";
import { ICalSurg, ICalSurgDoc } from "./calSurg.interface";
import { Model } from "mongoose";
import { CalSurg } from "./calSurg.schema";

@injectable()
export class CalSurgService {
  constructor() {}

  private calSurgModel: Model<ICalSurg> = CalSurg

  public async createCalSurg(calSurgData: ICalSurg): Promise<ICalSurgDoc> {
    try {
      const newCalSurg = await new this.calSurgModel(calSurgData).save();
      return newCalSurg;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkCalSurg(calSurgData: ICalSurg[]): Promise<ICalSurgDoc[]> {
    try {
      const newCalSurgArr = await this.calSurgModel.insertMany(calSurgData);
      return newCalSurgArr;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgById(calSurgId: string): Promise<ICalSurgDoc> {
    try {
      const calSurg = await this.calSurgModel
        .findById(calSurgId)
        .populate('hospital')
        .populate('arabProc')
        .exec();
      
      if (!calSurg) {
        throw new Error(`CalSurg with id ${calSurgId} not found`);
      }
      
      return calSurg;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllCalSurg(): Promise<ICalSurgDoc[]> {
    try {
      const calSurgs = await this.calSurgModel
        .find({})
        .populate('hospital')
        .populate('arabProc')
        .exec();
      
      return calSurgs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgByDateRange(startDate: Date, endDate: Date): Promise<ICalSurgDoc[]> {
    try {
      const calSurgs = await this.calSurgModel
        .find({
          procDate: {
            $gte: startDate,
            $lte: endDate
          }
        })
        .populate('hospital')
        .populate('arabProc')
        .sort({ procDate: 1 }) // Sort by procedure date ascending
        .exec();
      
      return calSurgs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgByMonth(year: number, month: number): Promise<ICalSurgDoc[]> {
    try {
      const startDate = new Date(year, month - 1, 1); // month is 0-indexed
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month
      
      const calSurgs = await this.calSurgModel
        .find({
          procDate: {
            $gte: startDate,
            $lte: endDate
          }
        })
        .populate('hospital')
        .populate('arabProc')
        .sort({ procDate: 1 })
        .exec();
      
      return calSurgs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgByDay(date: Date): Promise<ICalSurgDoc[]> {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      const calSurgs = await this.calSurgModel
        .find({
          procDate: {
            $gte: startDate,
            $lte: endDate
          }
        })
        .populate('hospital')
        .populate('arabProc')
        .sort({ procDate: 1 })
        .exec();
      
      return calSurgs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgByYear(year: number): Promise<ICalSurgDoc[]> {
    try {
      const startDate = new Date(year, 0, 1); // January 1st
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st
      
      const calSurgs = await this.calSurgModel
        .find({
          procDate: {
            $gte: startDate,
            $lte: endDate
          }
        })
        .populate('hospital')
        .populate('arabProc')
        .sort({ procDate: 1 })
        .exec();
      
      return calSurgs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  // Additional database-only methods can be added here as needed
}