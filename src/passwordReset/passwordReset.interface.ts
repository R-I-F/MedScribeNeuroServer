// Removed: import { Types } from "mongoose"; - Now using UUIDs directly for MariaDB
import { TUserRole } from "../types/role.types";

export interface IPasswordResetToken {
  userId: string; // UUID reference to user
  userRole: TUserRole;
  token: string;
  expiresAt: Date;
  used: boolean;
}

export interface IPasswordResetTokenDoc extends IPasswordResetToken {
  id: string; // UUID (replaces _id from MongoDB Document)
  createdAt: Date;
  updatedAt: Date;
}

