import { User } from "../user/user.interface";
import { Types } from "mongoose";

export enum Rank {
  Professor = "professor",
  AssistantProfessor = "assistant professor",
  Lecturer = "lecturer",
  AssistantLecturer = "assistant lecturer",
  Resident = "resident",
  Guest = "guest",
  Other = "other",
  None = "none",
}

export enum RegDegree {
  Msc = "msc",
  DoctorOfMedicine = "doctor of medicine (md)",
  EgyptianFellowship = "egyptian fellowship",
  SelfRegistration = "self registration",
  Other = "other",
}
export interface ICand extends User {
  timeStamp?: Date;
  regNum: string;
  nationality: string;
  rank: Rank;
  regDeg: RegDegree;  
  google_uid?: string;
}

export interface ICandDoc extends ICand {
  _id: Types.ObjectId
}