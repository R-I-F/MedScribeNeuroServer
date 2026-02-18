import { TClinicalActivityType, TClinicalSubStatus } from "./clinicalSub.mDbSchema";
import { ICandCensoredDoc } from "../cand/cand.interface";
import { ISupervisorCensoredDoc } from "../supervisor/supervisor.interface";

export interface IClinicalSub {
  candDocId: string;
  supervisorDocId: string;
  dateCA: Date;
  typeCA: TClinicalActivityType;
  subStatus: TClinicalSubStatus;
  description: string;
}

export interface IClinicalSubDoc extends IClinicalSub {
  id: string;
  review?: string | null;
  reviewedAt?: Date | null;
  createdAt: Date;
  updatedAt: Date;
  candidate?: unknown;
  supervisor?: unknown;
}

export interface IClinicalSubInput {
  candDocId: string;
  supervisorDocId: string;
  dateCA: string;
  typeCA: TClinicalActivityType;
  description: string;
}

export interface IClinicalSubUpdateInput {
  id: string;
  candDocId?: string;
  supervisorDocId?: string;
  dateCA?: string;
  typeCA?: TClinicalActivityType;
  subStatus?: TClinicalSubStatus;
  description?: string;
  review?: string | null;
  reviewedAt?: Date | null;
}

/** Response for assigned clinical subs: candidate and supervisor are censored (no password, email, phone, etc.). */
export interface IClinicalSubAssignedDoc extends Omit<IClinicalSubDoc, "candidate" | "supervisor"> {
  candidate?: ICandCensoredDoc;
  supervisor?: ISupervisorCensoredDoc;
}
