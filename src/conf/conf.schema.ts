import { Model, Schema, model } from "mongoose";
import { IConf } from "./conf.interface";

export const confSchema: Schema<IConf> = new Schema(
  {
    confTitle: {
      type: String,
      required: [true, "confTitle is required"],
      trim: true,
    },
    google_uid: {
      type: String,
      required: [true, "google_uid is required"],
      trim: true,
      unique: true,
    },
    presenter: {
      type: Schema.Types.ObjectId,
      ref: "Supervisor",
      required: [true, "presenter is required"],
    },
    date: {
      type: Date,
      required: [true, "date is required"],
    },
  },
  { timestamps: true }
);

export const Conf: Model<IConf> = model("Conf", confSchema);

