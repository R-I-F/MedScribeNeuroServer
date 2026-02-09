import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { ICalSurg, ICalSurgDoc } from "./calSurg.interface";
import { CalSurgEntity } from "./calSurg.mDbSchema";
import { Repository, Between, In, MoreThanOrEqual, LessThanOrEqual } from "typeorm";

@injectable()
export class CalSurgService {
  public async createCalSurg(calSurgData: ICalSurg, dataSource: DataSource): Promise<ICalSurgDoc> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
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
      const newCalSurg = calSurgRepository.create(entityData);
      const savedCalSurg = await calSurgRepository.save(newCalSurg) as unknown as CalSurgEntity;
      
      // Load with relations for return
      const result = await calSurgRepository.findOne({
        where: { id: savedCalSurg.id },
        relations: ["hospital", "arabProc"],
      });
      
      return result as unknown as ICalSurgDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkCalSurg(calSurgData: ICalSurg[], dataSource: DataSource): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
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
      const newCalSurgs = calSurgRepository.create(entityDataArray);
      const savedCalSurgs = await calSurgRepository.save(newCalSurgs);
      
      // Load with relations for return
      const ids = savedCalSurgs.map(cs => cs.id);
      const results = await calSurgRepository.find({
        where: { id: In(ids) },
        relations: ["hospital", "arabProc"],
      });
      
      return results as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgById(calSurgId: string, dataSource: DataSource): Promise<ICalSurgDoc> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(calSurgId)) {
        throw new Error("Invalid calSurg ID format");
      }
      
      const calSurg = await calSurgRepository.findOne({
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

  public async getAllCalSurg(dataSource: DataSource): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const calSurgs = await calSurgRepository.find({
        relations: ["hospital", "arabProc"],
        order: { procDate: "DESC" },
      });
      
      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Dashboard: calSurg within last 60 days, stripped of formLink and google_uid
   */
  public async getCalSurgDashboard(dataSource: DataSource): Promise<any[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - 60);
      cutoff.setHours(0, 0, 0, 0);

      const calSurgs = await calSurgRepository.find({
        where: { procDate: MoreThanOrEqual(cutoff) },
        relations: ["hospital", "arabProc"],
        order: { procDate: "DESC" },
      });

      return calSurgs.map((cs) => {
        const { formLink, google_uid, createdAt, updatedAt, ...rest } = cs as any;
        return {
          ...rest,
          _id: rest.id ?? rest._id,
          hospital: rest.hospital ? { _id: rest.hospital.id, engName: rest.hospital.engName, arabName: rest.hospital.arabName } : undefined,
          arabProc: rest.arabProc ? { _id: rest.arabProc.id, title: rest.arabProc.title, numCode: rest.arabProc.numCode, alphaCode: rest.arabProc.alphaCode, description: rest.arabProc.description } : undefined,
        };
      });
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgByDateRange(startDate: Date, endDate: Date, dataSource: DataSource): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const calSurgs = await calSurgRepository.find({
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

  public async getCalSurgByMonth(year: number, month: number, dataSource: DataSource): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const startDate = new Date(year, month - 1, 1); // month is 0-indexed
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month
      
      const calSurgs = await calSurgRepository.find({
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

  public async getCalSurgByDay(date: Date, dataSource: DataSource): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);
      
      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);
      
      const calSurgs = await calSurgRepository.find({
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

  public async getCalSurgByYear(year: number, dataSource: DataSource): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const startDate = new Date(year, 0, 1); // January 1st
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st
      
      const calSurgs = await calSurgRepository.find({
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
  }, dataSource: DataSource): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
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

      let calSurgs = await calSurgRepository.find({
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

  public async findCalSurgByGoogleUid(google_uid: string, dataSource: DataSource): Promise<ICalSurgDoc | null> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      if (!google_uid || google_uid.trim() === "") {
        return null;
      }
      const calSurg = await calSurgRepository.findOne({
        where: { google_uid: google_uid.trim() },
      });
      return calSurg as unknown as ICalSurgDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findCalSurgsByGoogleUids(google_uids: string[], dataSource: DataSource): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const uniqueUids = [...new Set(google_uids.filter(uid => uid && uid.trim() !== ""))];
      if (uniqueUids.length === 0) {
        return [];
      }
      const calSurgs = await calSurgRepository.find({
        where: { google_uid: In(uniqueUids) },
      });
      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateCalSurg(id: string, updateData: Partial<ICalSurg>, dataSource: DataSource): Promise<ICalSurgDoc> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid calSurg ID format");
      }

      // Check if calSurg exists
      const existingCalSurg = await calSurgRepository.findOne({
        where: { id },
      });

      if (!existingCalSurg) {
        throw new Error(`CalSurg with id ${id} not found`);
      }

      // Map interface fields to entity fields
      const entityUpdateData: any = {};
      if (updateData.timeStamp !== undefined) entityUpdateData.timeStamp = updateData.timeStamp;
      if (updateData.patientName !== undefined) entityUpdateData.patientName = updateData.patientName;
      if (updateData.patientDob !== undefined) entityUpdateData.patientDob = updateData.patientDob;
      if (updateData.gender !== undefined) entityUpdateData.gender = updateData.gender;
      if (updateData.hospital !== undefined) entityUpdateData.hospitalId = updateData.hospital;
      if (updateData.arabProc !== undefined) entityUpdateData.arabProcId = updateData.arabProc;
      if (updateData.procDate !== undefined) entityUpdateData.procDate = updateData.procDate;
      if (updateData.google_uid !== undefined) entityUpdateData.google_uid = updateData.google_uid;
      if (updateData.formLink !== undefined) entityUpdateData.formLink = updateData.formLink;

      // Update the entity
      await calSurgRepository.update(id, entityUpdateData);

      // Load with relations for return
      const updatedCalSurg = await calSurgRepository.findOne({
        where: { id },
        relations: ["hospital", "arabProc"],
      });

      if (!updatedCalSurg) {
        throw new Error(`CalSurg with id ${id} not found after update`);
      }

      return updatedCalSurg as unknown as ICalSurgDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteCalSurg(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const result = await calSurgRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  // Additional database-only methods can be added here as needed
}