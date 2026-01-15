import { Model, Schema, model } from "mongoose";
import { ILecture } from "./lecture.interface";

export const lectureSchema: Schema<ILecture> = new Schema(
  {
    lectureTitle: {
      type: String,
      required: [true, "lectureTitle is required"],
      trim: true,
    },
    google_uid: {
      type: String,
      required: [true, "google_uid is required"],
      trim: true,
      unique: true,
    },
    mainTopic: {
      type: String,
      required: [true, "mainTopic is required"],
      trim: true,
    },
    level: {
      type: String,
      required: [true, "level is required"],
      enum: {
        values: ["msc", "md"],
        message: "level must be one of: msc, md",
      },
    },
  },
  { timestamps: true }
);

export const Lecture: Model<ILecture> = model("Lecture", lectureSchema);

