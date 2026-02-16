import { Rank, RegDegree } from "../cand/cand.interface";
import { TSupervisorPosition } from "../types/supervisorPosition.types";

export default interface IAuth {
  email: string;
  password: string;
  institutionId?: string; // Optional for multi-tenant support
}

export interface IRegisterCandPayload extends IAuth {
  fullName: string;
  phoneNum: string;
  regNum: string;
  nationality: string;
  rank: Rank;
  regDeg?: RegDegree | null; // Optional for non-academic institutions
}

export interface IRegisterSupervisorPayload extends IAuth {
  fullName: string;
  phoneNum: string;
  position?: TSupervisorPosition | null; // Optional; when provided, must be one of the accepted position types
}