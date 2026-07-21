import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { Between, In, MoreThanOrEqual } from "typeorm";
import { ICalSurg, ICalSurgDoc } from "./calSurg.interface";
import { CalSurgEntity } from "./calSurg.mDbSchema";

@injectable()
export class CalSurgService {
  public async createCalSurg(calSurgData: ICalSurg, dataSource: DataSource): Promise<ICalSurgDoc> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      // Map interface fields to entity fields (hospital/procCpt are UUIDs in interface, but entity uses hospitalId/procCptId)
      const entityData: any = {
        timeStamp: calSurgData.timeStamp,
        patientName: calSurgData.patientName,
        patientNameAr: calSurgData.patientNameAr,
        patientNameEn: calSurgData.patientNameEn,
        patientDob: calSurgData.patientDob,
        gender: calSurgData.gender,
        hospitalId: calSurgData.hospital,
        procCptId: calSurgData.procCpt,
        clerkProcId: calSurgData.clerkProcId,
        clerkId: calSurgData.clerkId,
        departmentId: calSurgData.departmentId,
        procDate: calSurgData.procDate,
        google_uid: calSurgData.google_uid,
        formLink: calSurgData.formLink,
      };
      const newCalSurg = calSurgRepository.create(entityData);
      const savedCalSurg = await calSurgRepository.save(newCalSurg) as unknown as CalSurgEntity;
      
      // Load with relations for return
      const result = await calSurgRepository.findOne({
        where: { id: savedCalSurg.id },
        relations: ["hospital", "procCpt", "clerkProc"],
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
        patientNameAr: data.patientNameAr,
        patientNameEn: data.patientNameEn,
        patientDob: data.patientDob,
        gender: data.gender,
        hospitalId: data.hospital,
        procCptId: data.procCpt,
        clerkProcId: data.clerkProcId,
        clerkId: data.clerkId,
        departmentId: data.departmentId,
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
        relations: ["hospital", "procCpt", "clerkProc"],
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
        relations: ["hospital", "procCpt", "clerkProc"],
      });
      
      if (!calSurg) {
        throw new Error(`CalSurg with id ${calSurgId} not found`);
      }
      
      return calSurg as unknown as ICalSurgDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /** Recent-first (clerk work queue): latest created/edited rows, updatedAt DESC, bounded. */
  public async getRecentCalSurg(take: number, dataSource: DataSource, departmentId?: string | null): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const calSurgs = await calSurgRepository.find({
        where: { ...(departmentId ? { departmentId } : {}) },
        relations: ["hospital", "procCpt", "clerkProc"],
        order: { updatedAt: "DESC" },
        take,
      });
      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllCalSurg(dataSource: DataSource, departmentId?: string | null): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const calSurgs = await calSurgRepository.find({
        where: { ...(departmentId ? { departmentId } : {}) },
        relations: ["hospital", "procCpt", "clerkProc"],
        order: { procDate: "DESC" },
      });

      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /** Max rows for dashboard to avoid unbounded slow queries (last 60 days can be large). */
  private static readonly DASHBOARD_TAKE = 1000;

  /**
   * Dashboard: calSurg within last 60 days, stripped of formLink and google_uid.
   * Bounded by DASHBOARD_TAKE; ensure idx_cal_surgs_proc_date exists for performance.
   */
  public async getCalSurgDashboard(dataSource: DataSource, departmentId?: string | null): Promise<any[]> | never {
    try {
      return await this.computeCalSurgDashboard(dataSource, departmentId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Fetches and shapes CalSurg dashboard. Used by getCalSurgDashboard.
   * Bounded by DASHBOARD_TAKE; ensure idx_cal_surgs_proc_date exists for performance.
   */
  private async computeCalSurgDashboard(dataSource: DataSource, departmentId?: string | null): Promise<any[]> {
    const calSurgRepository = dataSource.getRepository(CalSurgEntity);
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() - 60);
    cutoff.setHours(0, 0, 0, 0);

    const calSurgs = await calSurgRepository.find({
      where: { procDate: MoreThanOrEqual(cutoff), ...(departmentId ? { departmentId } : {}) },
      relations: ["hospital", "procCpt", "clerkProc"],
      order: { procDate: "DESC" },
      take: CalSurgService.DASHBOARD_TAKE,
    });

    return calSurgs.map((cs) => {
      const { formLink, google_uid, createdAt, updatedAt, ...rest } = cs as any;
      return {
        ...rest,
        _id: rest.id ?? rest._id,
        hospital: rest.hospital ? { _id: rest.hospital.id, engName: rest.hospital.engName, arabName: rest.hospital.arabName } : undefined,
        // Procedure (proc_cpts, hub-mirrored, EN title + AR arTitle). Absent when no procedure recorded.
        procCpt: rest.procCpt ? { _id: rest.procCpt.id, title: rest.procCpt.title, arTitle: rest.procCpt.arTitle, numCode: rest.procCpt.numCode, alphaCode: rest.procCpt.alphaCode } : undefined,
        // What the clerk actually typed (learning pipeline), in both languages — the calendar
        // shows the phrase per UI language (AR: titleAr, EN: titleEn; plan §2.5).
        clerkProc: rest.clerkProc
          ? { _id: rest.clerkProc.id, title: rest.clerkProc.title, titleAr: rest.clerkProc.titleAr, titleEn: rest.clerkProc.titleEn }
          : undefined,
      };
    });
  }

  public async getCalSurgByDateRange(startDate: Date, endDate: Date, dataSource: DataSource, departmentId?: string | null): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const calSurgs = await calSurgRepository.find({
        where: {
          procDate: Between(startDate, endDate),
          ...(departmentId ? { departmentId } : {}),
        },
        relations: ["hospital", "procCpt", "clerkProc"],
        order: { procDate: "ASC" },
      });

      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgByMonth(year: number, month: number, dataSource: DataSource, departmentId?: string | null): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const startDate = new Date(year, month - 1, 1); // month is 0-indexed
      const endDate = new Date(year, month, 0, 23, 59, 59, 999); // Last day of month

      const calSurgs = await calSurgRepository.find({
        where: {
          procDate: Between(startDate, endDate),
          ...(departmentId ? { departmentId } : {}),
        },
        relations: ["hospital", "procCpt", "clerkProc"],
        order: { procDate: "ASC" },
      });

      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgByDay(date: Date, dataSource: DataSource, departmentId?: string | null): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const startDate = new Date(date);
      startDate.setHours(0, 0, 0, 0);

      const endDate = new Date(date);
      endDate.setHours(23, 59, 59, 999);

      const calSurgs = await calSurgRepository.find({
        where: {
          procDate: Between(startDate, endDate),
          ...(departmentId ? { departmentId } : {}),
        },
        relations: ["hospital", "procCpt", "clerkProc"],
        order: { procDate: "ASC" },
      });

      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgByYear(year: number, dataSource: DataSource, departmentId?: string | null): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const startDate = new Date(year, 0, 1); // January 1st
      const endDate = new Date(year, 11, 31, 23, 59, 59, 999); // December 31st

      const calSurgs = await calSurgRepository.find({
        where: {
          procDate: Between(startDate, endDate),
          ...(departmentId ? { departmentId } : {}),
        },
        relations: ["hospital", "procCpt", "clerkProc"],
        order: { procDate: "ASC" },
      });

      return calSurgs as unknown as ICalSurgDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalSurgWithFilters(filters: {
    hospitalId?: string;
    procTitle?: string;
    procNumCode?: string;
    month?: number;
    year?: number;
    startDate?: Date;
    endDate?: Date;
  }, dataSource: DataSource, departmentId?: string | null): Promise<ICalSurgDoc[]> | never {
    try {
      const calSurgRepository = dataSource.getRepository(CalSurgEntity);
      const whereConditions: any = {};

      // Optional department scope (dept-scoped institute admins); null = institution-wide
      if (departmentId) {
        whereConditions.departmentId = departmentId;
      }

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
        relations: ["hospital", "procCpt", "clerkProc"],
        order: { procDate: "ASC" },
      });

      // Filter by procedure title (EN or AR) or code after loading relations
      if (filters.procTitle || filters.procNumCode) {
        calSurgs = calSurgs.filter(cs => {
          if (!cs.procCpt) return false;
          if (filters.procTitle) {
            const q = filters.procTitle.toLowerCase();
            const matches =
              cs.procCpt.title?.toLowerCase().includes(q) ||
              cs.procCpt.arTitle?.toLowerCase().includes(q);
            if (!matches) return false;
          }
          if (filters.procNumCode && !cs.procCpt.numCode?.includes(filters.procNumCode)) {
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
      if (updateData.patientNameAr !== undefined) entityUpdateData.patientNameAr = updateData.patientNameAr;
      if (updateData.patientNameEn !== undefined) entityUpdateData.patientNameEn = updateData.patientNameEn;
      if (updateData.patientDob !== undefined) entityUpdateData.patientDob = updateData.patientDob;
      if (updateData.gender !== undefined) entityUpdateData.gender = updateData.gender;
      if (updateData.hospital !== undefined) entityUpdateData.hospitalId = updateData.hospital;
      if (updateData.procCpt !== undefined) entityUpdateData.procCptId = updateData.procCpt;
      if (updateData.procDate !== undefined) entityUpdateData.procDate = updateData.procDate;
      if (updateData.google_uid !== undefined) entityUpdateData.google_uid = updateData.google_uid;
      if (updateData.formLink !== undefined) entityUpdateData.formLink = updateData.formLink;

      // Update the entity
      await calSurgRepository.update(id, entityUpdateData);

      // Load with relations for return
      const updatedCalSurg = await calSurgRepository.findOne({
        where: { id },
        relations: ["hospital", "procCpt", "clerkProc"],
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