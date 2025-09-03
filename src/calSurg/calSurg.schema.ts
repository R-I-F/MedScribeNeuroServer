import { Model, Schema, model } from "mongoose";
import { ICalSurg } from "./calSurg.interface";

export const calSurgSchema: Schema<ICalSurg> = new Schema(
  {
    timeStamp: {
      type: Date,
      required: true,
    },
    patientName: {
      type: String,
      required: true,
    },
    patientDob: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["male", "female"],
      required: true,
    },
    hospital: {
      type: Schema.Types.ObjectId,
      ref: "Hospital",
      required: true,
    },
    arabProc: {
      type: Schema.Types.ObjectId,
      ref: "ArabProc",
      required: false,
    }, //opt
    procDate: {
      type: Date,
      required: true,
    },
    google_uid: {
      type: String,
      required: false,
    }, //opt
    formLink: {
      type: String,
      required: false 
    }
  },
  {
    timestamps: true,
  }
);

export const CalSurg: Model<ICalSurg> = model("CalSurg", calSurgSchema);
