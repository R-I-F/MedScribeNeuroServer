import { Model, Schema, model } from "mongoose";
import { IDiagnosis } from "./diagnosis.interface";

export const diagnosisSchema: Schema<IDiagnosis> = new Schema(
  {
    icdCode: {
      type: String,
      required: true
    },
    icdName: {
      type: String,
      required: true,
    },
    neuroLogName: {
      type: [String],
      required: false,
    }
  },
  {
    timestamps: true,
  }
);

export const Diagnosis: Model<IDiagnosis> = model("Diagnosis", diagnosisSchema);
