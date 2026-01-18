import { User } from "../user/user.interface";
import { TUserRole } from "../types/role.types";

export interface ISuperAdmin extends User {
  role: TUserRole;
  // SuperAdmin can have additional fields if needed in the future
}

export interface ISuperAdminDoc extends ISuperAdmin {
  id: string; // UUID (replaces _id from MongoDB)
  createdAt: Date;
  updatedAt: Date;
}

// Input types for create/update operations
export type ISuperAdminInput = ISuperAdmin;
export type ISuperAdminUpdateInput = Partial<ISuperAdmin> & { id: string };
