import { User } from "../user/user.interface";
import { TUserRole } from "../types/role.types";
import { TSupervisorPosition } from "../types/supervisorPosition.types";

export interface ISupervisor extends User {
  role?: TUserRole;
  canValidate?: boolean; // true = validator supervisor (can validate submissions), false = academic supervisor (events only)
  position?: TSupervisorPosition; // Supervisor's academic position
  termsAcceptedAt?: Date;
}

export interface ISupervisorDoc extends ISupervisor {
  id: string; // UUID (replaces _id from MongoDB)
  createdAt: Date;
  updatedAt: Date;
}

// Input types for create/update operations
export type ISupervisorInput = ISupervisor;
export type ISupervisorUpdateInput = Partial<ISupervisor> & { id: string };
