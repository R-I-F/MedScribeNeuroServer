import { Types } from "mongoose";

export interface IDiagnosis {
  icdCode: string;
  icdName: string;
  neuroLogName?: string[];
}

export interface IDiagnosisDoc extends IDiagnosis {
  _id: Types.ObjectId;
}
