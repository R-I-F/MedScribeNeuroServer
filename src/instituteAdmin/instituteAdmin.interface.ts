import { User } from "../user/user.interface";
import { Types } from "mongoose";
import { TUserRole } from "../types/role.types";

export interface IInstituteAdmin extends User {
  role: TUserRole;
  termsAcceptedAt?: Date;
  // InstituteAdmin can have additional fields if needed in the future
  // e.g., instituteId, permissions, etc.
}

export interface IInstituteAdminDoc extends IInstituteAdmin {
  _id: Types.ObjectId;
}

