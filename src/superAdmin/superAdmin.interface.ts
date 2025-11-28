import { User } from "../user/user.interface";
import { Types } from "mongoose";
import { TUserRole } from "../types/role.types";

export interface ISuperAdmin extends User {
  role: TUserRole;
  // SuperAdmin can have additional fields if needed in the future
}

export interface ISuperAdminDoc extends ISuperAdmin {
  _id: Types.ObjectId;
}

