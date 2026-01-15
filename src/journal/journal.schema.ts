import { Model, Schema, model } from "mongoose";
import { IJournal } from "./journal.interface";

export const journalSchema: Schema<IJournal> = new Schema(
  {
    journalTitle: {
      type: String,
      required: [true, "journalTitle is required"],
      trim: true,
    },
    pdfLink: {
      type: String,
      required: [true, "pdfLink is required"],
      trim: true,
    },
    google_uid: {
      type: String,
      required: [true, "google_uid is required"],
      trim: true,
      unique: true,
    },
  },
  { timestamps: true }
);

export const Journal: Model<IJournal> = model("Journal", journalSchema);

