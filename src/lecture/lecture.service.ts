import { inject, injectable } from "inversify";
import { ILecture, ILectureDoc } from "./lecture.interface";
import { Model, Types } from "mongoose";
import { Lecture } from "./lecture.schema";

@injectable()
export class LectureService {
  private lectureModel: Model<ILecture> = Lecture;

  public async createLecture(lectureData: ILecture): Promise<ILectureDoc> | never {
    try {
      const newLecture = new this.lectureModel(lectureData);
      return await newLecture.save();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllLectures(): Promise<ILectureDoc[]> | never {
    try {
      return await this.lectureModel.find().exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getLectureById(id: string): Promise<ILectureDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid lecture ID");
      }
      return await this.lectureModel.findById(id).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateLecture(id: string, updateData: Partial<ILecture>): Promise<ILectureDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid lecture ID");
      }
      return await this.lectureModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteLecture(id: string): Promise<boolean> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid lecture ID");
      }
      const result = await this.lectureModel.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findByGoogleUid(google_uid: string, excludeId?: string): Promise<ILectureDoc | null> | never {
    try {
      const query: any = { google_uid };
      if (excludeId && Types.ObjectId.isValid(excludeId)) {
        query._id = { $ne: excludeId };
      }
      return await this.lectureModel.findOne(query).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkLectures(lectureDataArray: ILecture[]): Promise<ILectureDoc[]> | never {
    try {
      return await this.lectureModel.insertMany(lectureDataArray);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findLecturesByGoogleUids(google_uids: string[]): Promise<ILectureDoc[]> | never {
    try {
      const uniqueUids = [...new Set(google_uids.filter(uid => uid && uid.trim() !== ""))];
      if (uniqueUids.length === 0) {
        return [];
      }
      return await this.lectureModel.find({ google_uid: { $in: uniqueUids } }).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

