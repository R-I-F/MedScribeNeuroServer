import { Model, Schema, model } from "mongoose";
import { ISupervisor } from "./supervisor.interface";

export const supervisorSchema: Schema<ISupervisor> = new Schema(
  {
    email: {
      type: String,
      required: [true, "user email is required"],
      trim: true,
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
    approvedSubs: [{
      type: Schema.Types.ObjectId,
      ref: "Component", // Reference to the component that's still under development
    }],
    pendingSubs: [{
      type: Schema.Types.ObjectId,
      ref: "Component", // Reference to the component that's still under development
    }],
    rejectedSubs: [{
      type: Schema.Types.ObjectId,
      ref: "Component", // Reference to the component that's still under development
    }],
  },
  { timestamps: true }
);

export const Supervisor: Model<ISupervisor> = model("Supervisor", supervisorSchema);
