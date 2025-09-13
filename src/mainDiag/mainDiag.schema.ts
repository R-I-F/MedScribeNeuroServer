import { Model, Schema, model } from "mongoose";
import { IMainDiag } from "./mainDiag.interface";

export const mainDiagSchema: Schema<IMainDiag> = new Schema({
  title: {
    type: String,
  },
  diagnosis: [
    {
      type: Schema.Types.ObjectId,
      ref: "Diagnosis"
  },],
  procs: [
    {
      type: Schema.Types.ObjectId,
      ref: "ProcCpt",
    },
  ],
});

export const MainDiag: Model<IMainDiag> = model("MainDiag", mainDiagSchema);
