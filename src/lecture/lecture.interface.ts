// Removed: import { Types, Document } from "mongoose"; - Now using UUIDs directly for MariaDB

export type TLectureLevel = "msc" | "md";

export interface ILecture {
  lectureTitle: string;
  google_uid: string;
  mainTopic: string;
  level: TLectureLevel;
}

export interface ILectureDoc extends ILecture {
  id: string; // UUID (replaces _id from MongoDB Document)
  createdAt: Date;
  updatedAt: Date;
}

// Derived types for input operations
export type ILectureInput = ILecture;
export type ILectureUpdateInput = Partial<ILecture> & { id: string };

