import { IArabProc } from "../arabProc/arabProc.interface";
import { IHospital } from "../hospital/hospital.interface";

export interface IProc {
  timeStamp: Date;
  patientName: string;
  nationalId?: string;
  patientDob: Date;
  gender: "male" | "female";
  mrn?: number;
  hospital: IHospital;
  arabProc?: IArabProc;
  procDate: Date;
  googleUid?: string;
}
