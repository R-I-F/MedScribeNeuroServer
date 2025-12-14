import { ISupervisorDoc } from "../supervisor/supervisor.interface";
import { ICandDoc } from "../cand/cand.interface";
import { ICalSurgDoc } from "../calSurg/calSurg.interface";
import { IHospitalDoc } from "../hospital/hospital.interface";

export interface ISupervisorSubmissionStats {
  supervisor: ISupervisorDoc;
  approved: number;
  pending: number;
  rejected: number;
  total: number;
}

export interface ICandidateSubmissionStats {
  candidate: ICandDoc;
  approved: number;
  pending: number;
  rejected: number;
  total: number;
}

export interface IHospitalProcedureStats {
  hospital: IHospitalDoc;
  procedures: Array<{
    title?: string;
    alphaCode?: string;
    frequency: number;
  }>;
}

export interface IReportFilters {
  startDate?: Date;
  endDate?: Date;
  hospitalId?: string;
  month?: number;
  year?: number;
  groupBy?: "title" | "alphaCode";
}

