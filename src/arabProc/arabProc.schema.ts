import { Model, Schema, model } from "mongoose";
import { IArabProc } from "./arabProc.interface";

export const arabProcSchema: Schema<IArabProc> = new Schema({
  title: {
    type: String,
    required: [true, "Arabic Procedure title is required"],
    maxlength: [100, "Title cannot be more than 100 characters"],
    trim: true,
  },
  alphaCode: {
    type: String,
    required: [true, "ALPHA Code is required"],
    maxlength: [10, "ALPHA Code cannot be more than 10 characters"],
    trim: true,
  },
  numCode: {
    type: String,
    required: [true, "Numerical Code is required"],
  },
  description: {
    type: String,
    required: [true, "Description is required"],
  },
});

export const ArabProc: Model<IArabProc> = model("ArabProc", arabProcSchema);
