import { Model, Schema, model } from "mongoose";
import { ISupervisor } from "./supervisor.interface";
import { UserRole } from "../types/role.types";
import { SupervisorPosition } from "../types/supervisorPosition.types";

export const supervisorSchema: Schema<ISupervisor> = new Schema(
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
      trim: true,
    },
    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.SUPERVISOR,
      required: true,
    },
    canValidate: {
      type: Boolean,
      default: true, // Default to true for backward compatibility (existing supervisors are validators)
      required: false,
    },
    position: {
      type: String,
      enum: {
        values: Object.values(SupervisorPosition),
        message: "position must be one of: Professor, Assistant Professor, Lecturer, Assistant Lecturer, Guest Doctor, unknown",
      },
      default: SupervisorPosition.UNKNOWN, // Default to "unknown" for backward compatibility
      required: false,
      trim: true,
    },
  },
  { timestamps: true }
);

export const Supervisor: Model<ISupervisor> = model("Supervisor", supervisorSchema);
