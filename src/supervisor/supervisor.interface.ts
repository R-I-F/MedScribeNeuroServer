import { User } from "../user/user.interface";
import { TUserRole } from "../types/role.types";
import { TSupervisorPosition } from "../types/supervisorPosition.types";

export interface ISupervisor extends User {
  role?: TUserRole;
  canValidate?: boolean; // true = validator supervisor (can validate submissions), false = academic supervisor (events only)
  canValClin?: boolean; // true = can validate clinical submissions (clinical sub), false = cannot
  position?: TSupervisorPosition; // Supervisor's academic position
  termsAcceptedAt?: Date;
}

export interface ISupervisorDoc extends ISupervisor {
  id: string; // UUID (replaces _id from MongoDB)
  createdAt: Date;
  updatedAt: Date;
}

/** Censored supervisor view: no email, phone, password, or PII beyond what's needed for display. */
export interface ISupervisorCensoredDoc {
  id: string;
  fullName: string;
  position?: TSupervisorPosition;
  canValidate?: boolean; // true = validator (can review submissions), false = academic (events only)
  canValClin?: boolean; // true = can validate clinical submissions (clinical sub)
  approved: boolean;
  role?: TUserRole;
}

// Input types for create/update operations
export type ISupervisorInput = ISupervisor;
export type ISupervisorUpdateInput = Partial<ISupervisor> & { id: string };
