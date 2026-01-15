import { ISupervisorDoc } from "../supervisor/supervisor.interface";
import { ICandDoc } from "../cand/cand.interface";
import { ICalSurgDoc } from "../calSurg/calSurg.interface";
import { IHospitalDoc } from "../hospital/hospital.interface";
import { IEventDoc } from "../event/event.interface";

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

export interface ICanceledEventReportItem {
  event: IEventDoc;
  presenter?: {
    _id: any;
    fullName?: string;
    email?: string;
    role?: string;
  } | null;
  resource?: {
    type: "lecture" | "journal" | "conf";
    title?: string;
    google_uid?: string;
  } | null;
}

