import { Model, Schema, model } from "mongoose";
import { ISuperAdmin } from "./superAdmin.interface";
import { UserRole } from "../types/role.types";

export const superAdminSchema: Schema<ISuperAdmin> = new Schema<ISuperAdmin>(
  {
    email: {
      type: String,
      required: [true, "user email is required"],
      trim: true,
      unique: true,
    },
    password: {
      type: String,
      required: [true, "user password is required"],
      minLength: [8, "password must be 8 digits or more"],
      trim: true,
    },
    fullName: {
      type: String,
      required: [true, "user full name is required"],
      trim: true,
    },
    phoneNum: {
      type: String,
      required: [true, "user phone number is required"],
      minLength: [11, "phone number must be 11 digits or more"],
      trim: true,
    },
    approved: {
      type: Boolean,
      required: [true, "user approval status is required"],
      default: true, // SuperAdmins are auto-approved
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.SUPER_ADMIN,
      required: true,
    } as any,
  },
  { timestamps: true }
);

export const SuperAdmin: Model<ISuperAdmin> = model("SuperAdmin", superAdminSchema);

