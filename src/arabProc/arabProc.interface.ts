import { Types } from "mongoose";

export interface IArabProc {
  title: string;
  alphaCode: string;
  numCode: string;
  description: string;
}

export interface IArabProcDoc extends IArabProc {
  _id: Types.ObjectId
}
