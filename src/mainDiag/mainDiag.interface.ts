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

// Input interface for updating mainDiag with codes (appends to existing arrays)
export interface IMainDiagUpdateInput {
  id: string;
  title?: string;
  procs?: string[]; // Array of numCodes to append
  diagnosis?: string[]; // Array of icdCodes to append
}