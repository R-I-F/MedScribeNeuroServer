import { Model, Schema, model } from "mongoose";
import { IMainDiag } from "./mainDiag.interface";

export const mainDiagSchema: Schema<IMainDiag> = new Schema(
  {
    title: {
      type: String,
      required: [true, "mainDiag title is required"],
      trim: true,
      maxLength: [200, "title should have a maximum of 200 characters"],
    },
    diagnosis: [
      {
        type: Schema.Types.ObjectId,
        ref: "Diagnosis",
      },
    ],
    procs: [
      {
        type: Schema.Types.ObjectId,
        ref: "ProcCpt",
      },
    ],
  },
  { timestamps: true }
);

export const MainDiag: Model<IMainDiag> = model("MainDiag", mainDiagSchema);
