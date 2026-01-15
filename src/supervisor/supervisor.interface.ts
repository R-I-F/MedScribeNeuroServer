import { User } from "../user/user.interface";
import { Types } from "mongoose";
import { TUserRole } from "../types/role.types";
import { TSupervisorPosition } from "../types/supervisorPosition.types";

export interface ISupervisor extends User {
  role?: TUserRole;
  canValidate?: boolean; // true = validator supervisor (can validate submissions), false = academic supervisor (events only)
  position?: TSupervisorPosition; // Supervisor's academic position
  termsAcceptedAt?: Date;
}

export interface ISupervisorDoc extends ISupervisor {
  _id: Types.ObjectId;
}
