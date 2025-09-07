import { Model, Schema, model } from "mongoose";
import { IProcCpt } from "./procCpt.interface";

export const procCptSchema: Schema<IProcCpt> = new Schema({
  title: {
    type: String,
    required: [true, "Procedure title is required"],
    maxlength: [100, "Title cannot be more than 100 characters"],
    trim: true
  },
  alphaCode: {
    type: String,
    rrequired: [true, "ALPHA Code is required"],
    maxlength: [10, "ALPHA Code cannot be more than 10 characters"],
    trim: true
  },
  numCode: {
    type: String,
    required: [true, "Numerical Code is required"],
    maxlength: [10, "Numerical Code cannot be more than 10 characters"],
    trim: true
  },
  description: {
    type: String,
    required: true,
    maxlength: [500, "description cannot be more than 500 characters"],
    trim: true
  },
});

export const ProcCpt: Model<IProcCpt> = model("ProcCpt", procCptSchema);
