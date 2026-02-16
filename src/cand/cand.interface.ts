import { User } from "../user/user.interface";
import { TUserRole } from "../types/role.types";

export enum Rank {
  Professor = "professor",
  AssistantProfessor = "assistant professor",
  Lecturer = "lecturer",
  AssistantLecturer = "assistant lecturer",
  Resident = "resident",
  Guest = "guest",
  Specialist = "specialist",
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
  regDeg?: RegDegree | null; // Optional for non-academic institutions
  google_uid?: string;
  role?: TUserRole;
  termsAcceptedAt?: Date;
}

export interface ICandDoc extends ICand {
  id: string; // UUID (replaces _id from MongoDB)
  createdAt: Date;
  updatedAt: Date;
}

/** Censored candidate view: no email, phone, password, or PII beyond what's needed for display. */
export interface ICandCensoredDoc {
  id: string;
  fullName: string;
  regNum: string;
  rank: Rank;
  regDeg?: RegDegree | null;
  approved: boolean;
  role?: TUserRole;
}

// Input types for create/update operations
export type ICandInput = ICand;
export type ICandUpdateInput = Partial<ICand> & { id: string };