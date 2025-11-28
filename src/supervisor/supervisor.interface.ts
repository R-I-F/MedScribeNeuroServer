import { User } from "../user/user.interface";
import { Types } from "mongoose";
import { TUserRole } from "../types/role.types";

export interface ISupervisor extends User {
  approvedSubs?: Types.ObjectId[];
  pendingSubs?: Types.ObjectId[];
  rejectedSubs?: Types.ObjectId[];
  role?: TUserRole;
}

export interface ISupervisorDoc extends ISupervisor {
  _id: Types.ObjectId;
}
