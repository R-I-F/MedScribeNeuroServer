import { inject, injectable } from "inversify";
import { ICalSurg, ICalSurgDoc } from "./calSurg.interface";
import { AppDataSource } from "../config/database.config";
import { CalSurgEntity } from "./calSurg.mDbSchema";
import { Repository, Between, In, MoreThanOrEqual, LessThanOrEqual } from "typeorm";

@injectable()
export class CalSurgService {
  private calSurgRepository: Repository<CalSurgEntity>;

  constructor() {
    this.calSurgRepository = AppDataSource.getRepository(CalSurgEntity);
  }

  public async createCalSurg(calSurgData: ICalSurg): Promise<ICalSurgDoc> | never {
    try {
      // Map interface fields to entity fields (hospital/arabProc are UUIDs in interface, but entity uses hospitalId/arabProcId)
      const entityData: any = {
        timeStamp: calSurgData.timeStamp,
        patientName: calSurgData.patientName,
        patientDob: calSurgData.patientDob,
        gender: calSurgData.gender,
        hospitalId: calSurgData.hospital,
        arabProcId: calSurgData.arabProc,
        procDate: calSurgData.procDate,
        google_uid: calSurgData.google_uid,
        formLink: calSurgData.formLink,
      };
      const newCalSurg = this.calSurgRepository.create(entityData);
      const savedCalSurg = await this.calSurgRepository.save(newCalSurg) as unknown as CalSurgEntity;
      
      // Load with relations for return
      const result = await this.calSurgRepository.findOne({
        where: { id: savedCalSurg.id },
        relations: ["hospital", "arabProc"],
      });
      
      return result as unknown as ICalSurgDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkCalSurg(calSurgData: ICalSurg[]): Promise<ICalSurgDoc[]> | never {
    try {
      // Map interface fields to entity fields
      const entityDataArray = calSurgData.map(data => ({
        timeStamp: data.timeStamp,
        patientName: data.patientName,
        patientDob: data.patientDob,
        gender: data.gender,
        hospitalId: data.hospital,
        arabProcId: data.arabProc,
        procDate: data.procDate,
        google_uid: data.google_uid,
        formLink: data.formLink,
      }));
      const newCalSurgs = this.calSurgRepository.create(entityDataArray);
      const savedCalSurgs = await this.calSurgRepository.save(newCalSurgs);
      
      // Load with relations for return
      const ids = savedCalSurgs.map(cs => cs.id);
      const results = await this.calSurgRepository.find({
        where: { id: In(ids) },
        relations: ["hospital", "arabProc"],
      });
      
      return results as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgById(calSurgId: string): Promise<ICalSurgDoc> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(calSurgId)) {
        throw new Error("Invalid calSurg ID format");
      }
      
      const calSurg = await this.calSurgRepository.findOne({
        where: { id: calSurgId },
        relations: ["hospital", "arabProc"],
      });
      
      if (!calSurg) {
        throw new Error(`CalSurg with id ${calSurgId} not found`);
      }
      
      return calSurg as unknown as ICalSurgDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllCalSurg(): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgs = await this.calSurgRepository.find({
        relations: ["hospital", "arabProc"],
        order: { procDate: "DESC" },
      });
      
      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgByDateRange(startDate: Date, endDate: Date): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgs = await this.calSurgRepository.find({
        where: {
          procDate: Between(startDate, endDate),
        },
        relations: ["hospital", "arabProc"],
        order: { procDate: "ASC" },
      });
      
      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgByMonth(year: number, month: number): Promise<ICalSurgDoc[]> | never {
    try {
      const startDate = new Date(year, month - 1, 1); // month is 0-indexed
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month
      
      const calSurgs = await this.calSurgRepository.find({
        where: {
          procDate: Between(startDate, endDate),
        },
        relations: ["hospital", "arabProc"],
        order: { procDate: "ASC" },
      });
      
      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgByDay(date: Date): Promise<ICalSurgDoc[]> | never {
    try {
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      const calSurgs = await this.calSurgRepository.find({
        where: {
          procDate: Between(startDate, endDate),
        },
        relations: ["hospital", "arabProc"],
        order: { procDate: "ASC" },
      });
      
      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgByYear(year: number): Promise<ICalSurgDoc[]> | never {
    try {
      const startDate = new Date(year, 0, 1); // January 1st
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st
      
      const calSurgs = await this.calSurgRepository.find({
        where: {
          procDate: Between(startDate, endDate),
        },
        relations: ["hospital", "arabProc"],
        order: { procDate: "ASC" },
      });
      
      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgWithFilters(filters: {
    hospitalId?: string;
    arabProcTitle?: string;
    arabProcNumCode?: string;
    month?: number;
    year?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ICalSurgDoc[]> | never {
    try {
      const whereConditions: any = {};

      // Hospital filtering
      if (filters.hospitalId) {
        whereConditions.hospitalId = filters.hospitalId;
      }

      // Date filtering
      if (filters.startDate && filters.endDate) {
        whereConditions.procDate = Between(filters.startDate, filters.endDate);
      } else if (filters.month && filters.year) {
        const startDate = new Date(filters.year, filters.month - 1, 1);
        const endDate = new Date(filters.year, filters.month, 0, 23, 59, 59, 999);
        whereConditions.procDate = Between(startDate, endDate);
      } else if (filters.year) {
        const startDate = new Date(filters.year, 0, 1);
        const endDate = new Date(filters.year, 11, 31, 23, 59, 59, 999);
        whereConditions.procDate = Between(startDate, endDate);
      } else if (filters.month) {
        const now = new Date();
        const startDate = new Date(now.getFullYear(), filters.month - 1, 1);
        const endDate = new Date(now.getFullYear(), filters.month, 0, 23, 59, 59, 999);
        whereConditions.procDate = Between(startDate, endDate);
      }

      let calSurgs = await this.calSurgRepository.find({
        where: whereConditions,
        relations: ["hospital", "arabProc"],
        order: { procDate: "ASC" },
      });

      // Filter by arabProc title or numCode after loading relations
      if (filters.arabProcTitle || filters.arabProcNumCode) {
        calSurgs = calSurgs.filter(cs => {
          if (!cs.arabProc) return false;
          if (filters.arabProcTitle && !cs.arabProc.title?.toLowerCase().includes(filters.arabProcTitle.toLowerCase())) {
            return false;
          }
          if (filters.arabProcNumCode && !cs.arabProc.numCode?.includes(filters.arabProcNumCode)) {
            return false;
          }
          return true;
        });
      }

      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findCalSurgByGoogleUid(google_uid: string): Promise<ICalSurgDoc | null> | never {
    try {
      if (!google_uid || google_uid.trim() === "") {
        return null;
      }
      const calSurg = await this.calSurgRepository.findOne({
        where: { google_uid: google_uid.trim() },
      });
      return calSurg as unknown as ICalSurgDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findCalSurgsByGoogleUids(google_uids: string[]): Promise<ICalSurgDoc[]> | never {
    try {
      const uniqueUids = [...new Set(google_uids.filter(uid => uid && uid.trim() !== ""))];
      if (uniqueUids.length === 0) {
        return [];
      }
      const calSurgs = await this.calSurgRepository.find({
        where: { google_uid: In(uniqueUids) },
      });
      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteCalSurg(id: string): Promise<boolean> | never {
    try {
      const result = await this.calSurgRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  // Additional database-only methods can be added here as needed
}