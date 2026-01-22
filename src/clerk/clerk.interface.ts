import { User } from "../user/user.interface";
import { TUserRole } from "../types/role.types";

export interface IClerk extends User {
  role?: TUserRole;
  termsAcceptedAt?: Date;
}

export interface IClerkDoc extends IClerk {
  id: string; // UUID (replaces _id from MongoDB)
  createdAt: Date;
  updatedAt: Date;
}

// Input types for create/update operations
export type IClerkInput = IClerk;
export type IClerkUpdateInput = Partial<IClerk> & { id: string };
