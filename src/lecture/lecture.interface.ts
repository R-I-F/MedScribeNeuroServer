import { Types, Document } from "mongoose";

export type TLectureLevel = "msc" | "md";

export interface ILecture {
  lectureTitle: string;
  google_uid: string;
  mainTopic: string;
  level: TLectureLevel;
}

export interface ILectureDoc extends ILecture, Document {
  _id: Types.ObjectId;
}

// Derived types for input operations
export type ILectureInput = ILecture;
export type ILectureUpdateInput = Partial<ILecture> & { id: string };

