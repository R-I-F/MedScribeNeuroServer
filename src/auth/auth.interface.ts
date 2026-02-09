import { Rank, RegDegree } from "../cand/cand.interface";

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
  regDeg: RegDegree;
}