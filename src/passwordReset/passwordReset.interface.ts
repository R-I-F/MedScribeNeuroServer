import { Types } from "mongoose";
import { TUserRole } from "../types/role.types";

export interface IPasswordResetToken {
  _id?: Types.ObjectId;
  userId: string;
  userRole: TUserRole;
  token: string;
  expiresAt: Date;
  used: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IPasswordResetTokenDoc extends IPasswordResetToken {
  _id: Types.ObjectId;
}

