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
import { EventService } from "../event/event.service";
import { ICanceledEventReportItem } from "./reports.interface";
import { DataSource } from "typeorm";

@injectable()
export class ReportsService {
  constructor(
    @inject(SubService) private subService: SubService,
    @inject(SupervisorService) private supervisorService: SupervisorService,
    @inject(CandService) private candService: CandService,
    @inject(CalSurgService) private calSurgService: CalSurgService,
    @inject(HospitalService) private hospitalService: HospitalService,
    @inject(EventService) private eventService: EventService
  ) {}

  public async getAllSupervisors(dataSource?: DataSource): Promise<ISupervisorDoc[]> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for reports operations");
      }
      return await this.supervisorService.getAllSupervisors(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllCandidates(dataSource?: DataSource): Promise<ICandDoc[]> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for reports operations");
      }
      return await this.candService.getAllCandidates(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSubmissionsBySupervisorId(
    supervisorId: string,
    startDate?: Date,
    endDate?: Date,
    dataSource?: DataSource
  ): Promise<ISubDoc[]> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for reports operations");
      }
      const allSubs = await this.subService.getSubsBySupervisorId(supervisorId, dataSource);
      
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
    endDate?: Date,
    dataSource?: DataSource
  ): Promise<ISubDoc[]> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for reports operations");
      }
      const allSubs = await this.subService.getSubsByCandidateId(candidateId, dataSource);
      
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
  }, dataSource?: DataSource): Promise<ICalSurgDoc[]> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for reports operations");
      }
      return await this.calSurgService.getCalSurgWithFilters(filters, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllHospitals(dataSource?: DataSource): Promise<IHospitalDoc[]> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for reports operations");
      }
      return await this.hospitalService.getAllHospitals(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllSubmissions(dataSource?: DataSource): Promise<ISubDoc[]> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for reports operations");
      }
      return await this.subService.getAllSubs(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCanceledEventsReportData(
    startDate?: Date,
    endDate?: Date,
    dataSource?: DataSource
  ): Promise<ICanceledEventReportItem[]> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for reports operations");
      }
      // Get all events using EventService (now using MariaDB)
      const allEvents = await this.eventService.getAllEvents(dataSource);

      // Filter for canceled events and date range
      let events: IEventDoc[] = allEvents.filter((e) => e.status === "canceled");

      if (startDate || endDate) {
        events = events.filter((e) => {
          const eventDate = e.dateTime;
          if (!eventDate) return false;
          if (startDate && eventDate < startDate) return false;
          if (endDate && eventDate > endDate) return false;
          return true;
        });
      }

      // Sort by dateTime descending
      events.sort((a, b) => {
        const dateA = a.dateTime?.getTime() || 0;
        const dateB = b.dateTime?.getTime() || 0;
        return dateB - dateA;
      });

      if (!events || events.length === 0) {
        return [];
      }

      // Batch fetch presenters (supervisors for lecture/conf, candidates for journal)
      const supervisorPresenterIds: string[] = [];
      const candidatePresenterIds: string[] = [];

      for (const e of events) {
        const presenterId = e.presenterId || (e.presenter as any)?.id || (e.presenter as any)?._id;
        if (!presenterId) continue;
        const presenterIdStr = typeof presenterId === "string" ? presenterId : presenterId.toString();
        if (e.type === "lecture" || e.type === "conf") {
          supervisorPresenterIds.push(presenterIdStr);
        } else if (e.type === "journal") {
          candidatePresenterIds.push(presenterIdStr);
        }
      }

      const uniqueSupervisorIds = [...new Set(supervisorPresenterIds)];
      const uniqueCandidateIds = [...new Set(candidatePresenterIds)];

      // Fetch supervisors and candidates (using MariaDB UUIDs)
      const [supervisors, candidates] = await Promise.all([
        uniqueSupervisorIds.length
          ? this.supervisorService.getAllSupervisors(dataSource!).then(allSupervisors => 
              allSupervisors.filter((s: any) => {
                const sId = s.id || s._id?.toString();
                return uniqueSupervisorIds.includes(sId);
              })
            )
          : Promise.resolve([]),
        uniqueCandidateIds.length
          ? this.candService.getAllCandidates(dataSource!).then(allCandidates =>
              allCandidates.filter((c: any) => {
                const cId = c.id || c._id?.toString();
                return uniqueCandidateIds.includes(cId);
              })
            )
          : Promise.resolve([]),
      ]);

      const supervisorMap = new Map<string, any>();
      for (const s of supervisors as any[]) {
        const sId = s.id || s._id?.toString();
        supervisorMap.set(sId, s);
      }

      const candidateMap = new Map<string, any>();
      for (const c of candidates as any[]) {
        const cId = c.id || c._id?.toString();
        candidateMap.set(cId, c);
      }

      const items: ICanceledEventReportItem[] = events.map((e: any) => {
        const presenterId = e.presenterId || e.presenter?.id || e.presenter?._id?.toString() || e.presenter?.toString();
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
    endDate?: Date,
    dataSource?: DataSource
  ): Promise<{ total: number; canceled: number }> | never {
    try {
      if (!dataSource) {
        throw new Error("DataSource is required for reports operations");
      }
      // Get all events using EventService (now using MariaDB)
      let allEvents = await this.eventService.getAllEvents(dataSource);

      // Filter by date range if provided
      if (startDate || endDate) {
        allEvents = allEvents.filter((e) => {
          const eventDate = e.dateTime;
          if (!eventDate) return false;
          if (startDate && eventDate < startDate) return false;
          if (endDate && eventDate > endDate) return false;
          return true;
        });
      }

      const total = allEvents.length;
      const canceled = allEvents.filter((e) => e.status === "canceled").length;

      return { total, canceled };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

