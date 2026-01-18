import { User } from "../user/user.interface";
import { TUserRole } from "../types/role.types";

export interface IInstituteAdmin extends User {
  role: TUserRole;
  termsAcceptedAt?: Date;
  // InstituteAdmin can have additional fields if needed in the future
  // e.g., instituteId, permissions, etc.
}

export interface IInstituteAdminDoc extends IInstituteAdmin {
  id: string; // UUID (replaces _id from MongoDB)
  createdAt: Date;
  updatedAt: Date;
}

// Input types for create/update operations
export type IInstituteAdminInput = IInstituteAdmin;
export type IInstituteAdminUpdateInput = Partial<IInstituteAdmin> & { id: string };
