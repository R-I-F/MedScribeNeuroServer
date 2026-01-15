import { injectable, inject } from "inversify";
import { ISubDoc } from "../sub/interfaces/sub.interface";
import { ISupervisorDoc } from "../supervisor/supervisor.interface";
import { ICandDoc } from "../cand/cand.interface";
import { ICalSurgDoc } from "../calSurg/calSurg.interface";
import { IHospitalDoc } from "../hospital/hospital.interface";
import { IEventDoc } from "../event/event.interface";
import { SubService } from "../sub/sub.service";
import { SupervisorService } from "../supervisor/supervisor.service";
import { CandService } from "../cand/cand.service";
import { CalSurgService } from "../calSurg/calSurg.service";
import { HospitalService } from "../hospital/hospital.service";
import { Model, Types } from "mongoose";
import { Event } from "../event/event.schema";
import { Supervisor } from "../supervisor/supervisor.schema";
import { Cand } from "../cand/cand.schema";
import { ICanceledEventReportItem } from "./reports.interface";

@injectable()
export class ReportsService {
  constructor(
    @inject(SubService) private subService: SubService,
    @inject(SupervisorService) private supervisorService: SupervisorService,
    @inject(CandService) private candService: CandService,
    @inject(CalSurgService) private calSurgService: CalSurgService,
    @inject(HospitalService) private hospitalService: HospitalService
  ) {}

  private eventModel: Model<any> = Event;

  public async getAllSupervisors(): Promise<ISupervisorDoc[]> | never {
    try {
      return await this.supervisorService.getAllSupervisors();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllCandidates(): Promise<ICandDoc[]> | never {
    try {
      return await this.candService.getAllCandidates();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSubmissionsBySupervisorId(
    supervisorId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ISubDoc[]> | never {
    try {
      const allSubs = await this.subService.getSubsBySupervisorId(supervisorId);
      
      if (startDate && endDate) {
        return allSubs.filter(sub => {
          const subDate = sub.timeStamp;
          if (!subDate) return false;
          return subDate >= startDate && subDate <= endDate;
        });
      }
      
      return allSubs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSubmissionsByCandidateId(
    candidateId: string,
    startDate?: Date,
    endDate?: Date
  ): Promise<ISubDoc[]> | never {
    try {
      const allSubs = await this.subService.getSubsByCandidateId(candidateId);
      
      if (startDate && endDate) {
        return allSubs.filter(sub => {
          const subDate = sub.timeStamp;
          if (!subDate) return false;
          return subDate >= startDate && subDate <= endDate;
        });
      }
      
      return allSubs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllCalendarProcedures(filters: {
    hospitalId?: string;
    month?: number;
    year?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<ICalSurgDoc[]> | never {
    try {
      return await this.calSurgService.getCalSurgWithFilters(filters);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllHospitals(): Promise<IHospitalDoc[]> | never {
    try {
      return await this.hospitalService.getAllHospitals();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllSubmissions(): Promise<ISubDoc[]> | never {
    try {
      return await this.subService.getAllSubs();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCanceledEventsReportData(
    startDate?: Date,
    endDate?: Date
  ): Promise<ICanceledEventReportItem[]> | never {
    try {
      const dateQuery: any = {};
      if (startDate) dateQuery.$gte = startDate;
      if (endDate) dateQuery.$lte = endDate;

      const query: any = { status: "canceled" };
      if (Object.keys(dateQuery).length > 0) {
        query.dateTime = dateQuery;
      }

      const events: IEventDoc[] = await this.eventModel
        .find(query)
        .sort({ dateTime: -1 })
        .populate("lecture")
        .populate("journal")
        .populate("conf")
        .populate("attendance.candidate")
        .exec();

      if (!events || events.length === 0) {
        return [];
      }

      // Batch fetch presenters (supervisors for lecture/conf, candidates for journal)
      const supervisorPresenterIds: Types.ObjectId[] = [];
      const candidatePresenterIds: Types.ObjectId[] = [];

      for (const e of events) {
        const presenterId = e.presenter as any;
        if (!presenterId) continue;
        if (e.type === "lecture" || e.type === "conf") {
          if (Types.ObjectId.isValid(presenterId)) supervisorPresenterIds.push(presenterId);
        } else if (e.type === "journal") {
          if (Types.ObjectId.isValid(presenterId)) candidatePresenterIds.push(presenterId);
        }
      }

      const uniqueSupervisorIds = [...new Set(supervisorPresenterIds.map((id) => id.toString()))].map(
        (id) => new Types.ObjectId(id)
      );
      const uniqueCandidateIds = [...new Set(candidatePresenterIds.map((id) => id.toString()))].map(
        (id) => new Types.ObjectId(id)
      );

      const [supervisors, candidates] = await Promise.all([
        uniqueSupervisorIds.length
          ? Supervisor.find({ _id: { $in: uniqueSupervisorIds } })
              .select("_id fullName email role position canValidate")
              .exec()
          : Promise.resolve([]),
        uniqueCandidateIds.length
          ? Cand.find({ _id: { $in: uniqueCandidateIds } })
              .select("_id fullName email role regNum")
              .exec()
          : Promise.resolve([]),
      ]);

      const supervisorMap = new Map<string, any>();
      for (const s of supervisors as any[]) {
        supervisorMap.set(s._id.toString(), s);
      }

      const candidateMap = new Map<string, any>();
      for (const c of candidates as any[]) {
        candidateMap.set(c._id.toString(), c);
      }

      const items: ICanceledEventReportItem[] = events.map((e: any) => {
        const presenterId = e.presenter?.toString();
        const presenter =
          e.type === "journal" ? candidateMap.get(presenterId) : supervisorMap.get(presenterId);

        // Resource metadata
        let resource: ICanceledEventReportItem["resource"] = null;
        if (e.type === "lecture" && e.lecture) {
          resource = {
            type: "lecture",
            title: e.lecture.lectureTitle,
            google_uid: e.lecture.google_uid,
          };
        } else if (e.type === "journal" && e.journal) {
          resource = {
            type: "journal",
            title: e.journal.journalTitle,
            google_uid: e.journal.google_uid,
          };
        } else if (e.type === "conf" && e.conf) {
          resource = {
            type: "conf",
            title: e.conf.confTitle,
            google_uid: e.conf.google_uid,
          };
        }

        return {
          event: e,
          presenter: presenter || null,
          resource,
        };
      });

      return items;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getEventCountsForPeriod(
    startDate?: Date,
    endDate?: Date
  ): Promise<{ total: number; canceled: number }> | never {
    try {
      const dateQuery: any = {};
      if (startDate) dateQuery.$gte = startDate;
      if (endDate) dateQuery.$lte = endDate;

      const baseQuery: any = {};
      if (Object.keys(dateQuery).length > 0) {
        baseQuery.dateTime = dateQuery;
      }

      const [total, canceled] = await Promise.all([
        this.eventModel.countDocuments(baseQuery).exec(),
        this.eventModel.countDocuments({ ...baseQuery, status: "canceled" }).exec(),
      ]);

      return { total, canceled };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

