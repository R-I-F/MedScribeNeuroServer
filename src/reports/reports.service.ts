import { injectable, inject } from "inversify";
import { ISubDoc } from "../sub/interfaces/sub.interface";
import { ISupervisorDoc } from "../supervisor/supervisor.interface";
import { ICandDoc } from "../cand/cand.interface";
import { ICalSurgDoc } from "../calSurg/calSurg.interface";
import { IHospitalDoc } from "../hospital/hospital.interface";
import { SubService } from "../sub/sub.service";
import { SupervisorService } from "../supervisor/supervisor.service";
import { CandService } from "../cand/cand.service";
import { CalSurgService } from "../calSurg/calSurg.service";
import { HospitalService } from "../hospital/hospital.service";
import { Types } from "mongoose";

@injectable()
export class ReportsService {
  constructor(
    @inject(SubService) private subService: SubService,
    @inject(SupervisorService) private supervisorService: SupervisorService,
    @inject(CandService) private candService: CandService,
    @inject(CalSurgService) private calSurgService: CalSurgService,
    @inject(HospitalService) private hospitalService: HospitalService
  ) {}

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
}

