import { Types, Document } from "mongoose";

export interface IConf {
  confTitle: string;
  google_uid: string;
  presenter: Types.ObjectId; // Reference to Supervisor - MUST be a valid Supervisor ObjectId (enforced in schema with ref: "Supervisor" and validated in provider)
  date: Date;
}

export interface IConfDoc extends IConf, Document {
  _id: Types.ObjectId;
}

// Derived types for input operations
export type IConfInput = IConf;
export type IConfUpdateInput = Partial<IConf> & { id: string };

