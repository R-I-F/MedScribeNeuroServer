import { Model, Schema, model } from "mongoose";
import { ISub } from "./interfaces/sub.interface";

export const subSchema: Schema<ISub> = new Schema({
  timeStamp: {
    type: Date,
    required: true,
  },
  candDocId: {
    type: Schema.Types.ObjectId,
    ref: "Cand",
    required: true,
  },
  procDocId: {
    type: Schema.Types.ObjectId,
    ref: "ProcCpt",
    required: true,
  },
  supervisorDocId: {
    type: Schema.Types.ObjectId,
    ref: "Supervisor",
    required: true,
  },
  roleInSurg: {
    type: String,
    required: true,
  },
  assRoleDesc: {
    type: String,
    required: false,
  },
  otherSurgRank: {
    type: String,
    required: true,
  },
  otherSurgName: {
    type: String,
    required: true,
  },
  isItRevSurg: {
    type: Boolean,
    required: true,
  },
  preOpClinCond: {
    type: String,
    required: false,
  },
  insUsed: {
    type: String,
    required: true,
  },
  consUsed: {
    type: String,
    required: true,
  },
  consDetails: {
    type: String,
    required: false,
  },
  mainDiagDocId: {
    type: Schema.Types.ObjectId,
    ref: "MainDiag",
    required: true,
  },
  subGoogleUid: {
    type: String,
    required: true,
  },
  subStatus: {
    type: String,
    required: true,
  },
  procCptDocId: {
    type: [Schema.Types.ObjectId],
    ref: "ProcCpt",
    required: true,
  },
  icdDocId: {
    type: [Schema.Types.ObjectId],
    ref: "Diagnosis",
    required: true,
  },
  diagnosisName: {
    type: [String],
    required: true,
  },
  procedureName: {
    type: [String],
    required: true,
  },
  surgNotes: {
    type: String,
    required: false,
  },
  IntEvents: {
    type: String,
    required: false,
  },
  spOrCran: {
    type: String,
    required: false,
  },
  pos: {
    type: String,
    required: false,
  },
  approach: {
    type: String,
    required: false,
  },
  clinPres: {
    type: String,
    required: false,
  },
  region: {
    type: String,
    required: false,
  },
}, {
  timestamps: true,
});

export const Sub: Model<ISub> = model("Sub", subSchema);

export default Sub;