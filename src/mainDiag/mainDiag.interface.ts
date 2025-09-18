import { Types } from "mongoose";
import { IProcCptDoc } from "../procCpt/procCpt.interface";

export interface IMainDiag {
  title: string;
  procs: Types.ObjectId[];
  diagnosis: Types.ObjectId[];
}

export interface IMainDiagDoc extends IMainDiag {
  _id: Types.ObjectId;
}

// Input interface for creating mainDiag with codes
export interface IMainDiagInput {
  title: string;
  procsArray?: string[]; // Array of numCodes
  diagnosis?: string[]; // Array of icdCodes
}