import { Types } from "mongoose";

export interface ICalSurg {
  timeStamp: Date;
  patientName: string;
  patientDob: Date;
  gender: "male" | "female";
  hospital: Types.ObjectId; // mongoDb object / model -> hospital
  arabProc?: Types.ObjectId; // mongoDb object / model -> arabProc
  procDate: Date;
  google_uid?: string; //opt
  formLink?: string
}

export interface ICalSurgDoc extends ICalSurg {
  _id: Types.ObjectId;
  __v?: number;
  createdAt?: Date;
  updatedAt?: Date;
}