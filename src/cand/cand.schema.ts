import { Model, Schema, model } from "mongoose";
import { ICand, Rank, RegDegree } from "./cand.interface";

export const candSchema: Schema<ICand> = new Schema(
  {
    timeStamp: {
      type: Date,
    },
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
    regNum: {
      type: String,
      required: [true, "user registry number is required"],
    },
    phoneNum: {
      type: String,
      required: [true, "user phone number is required"],
      minLength: [11, "phone number must be 11 digits or more"],
      trim: true,
    },
    nationality: {
      type: String,
      required: [true, "user nationality is required"],
    },
    rank: {
      type: String,
      required: [true, "user rank is required"],
      enum: Object.values(Rank),
    },
    regDeg: {
      type: String,
      required: [true, "user registered degree is required"],
      enum: Object.values(RegDegree),
    },
    google_uid: {
      type: String,
      trim: true,
    },
    approved: {
      type: Boolean,
      required: [true, "user approval status is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

export const Cand: Model<ICand> = model("Cand", candSchema);
