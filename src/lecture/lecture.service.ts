import { inject, injectable } from "inversify";
import { ILecture, ILectureDoc } from "./lecture.interface";
import { AppDataSource } from "../config/database.config";
import { LectureEntity } from "./lecture.mDbSchema";
import { Repository, In, Not } from "typeorm";

@injectable()
export class LectureService {
  private lectureRepository: Repository<LectureEntity>;

  constructor() {
    this.lectureRepository = AppDataSource.getRepository(LectureEntity);
  }

  public async createLecture(lectureData: ILecture): Promise<ILectureDoc> | never {
    try {
      const newLecture = this.lectureRepository.create(lectureData);
      const savedLecture = await this.lectureRepository.save(newLecture);
      return savedLecture as unknown as ILectureDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllLectures(): Promise<ILectureDoc[]> | never {
    try {
      const allLectures = await this.lectureRepository.find({
        order: { createdAt: "DESC" },
      });
      return allLectures as unknown as ILectureDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getLectureById(id: string): Promise<ILectureDoc | null> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid lecture ID format");
      }
      const lecture = await this.lectureRepository.findOne({
        where: { id },
      });
      return lecture as unknown as ILectureDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateLecture(id: string, updateData: Partial<ILecture>): Promise<ILectureDoc | null> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid lecture ID format");
      }
      await this.lectureRepository.update(id, updateData);
      const updatedLecture = await this.lectureRepository.findOne({
        where: { id },
      });
      return updatedLecture as unknown as ILectureDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteLecture(id: string): Promise<boolean> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid lecture ID format");
      }
      const result = await this.lectureRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findByGoogleUid(google_uid: string, excludeId?: string): Promise<ILectureDoc | null> | never {
    try {
      const where: any = { google_uid };
      if (excludeId) {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(excludeId)) {
          where.id = Not(excludeId);
        }
      }
      const lecture = await this.lectureRepository.findOne({
        where,
      });
      return lecture as unknown as ILectureDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkLectures(lectureDataArray: ILecture[]): Promise<ILectureDoc[]> | never {
    try {
      const lectures = this.lectureRepository.create(lectureDataArray);
      const savedLectures = await this.lectureRepository.save(lectures);
      return savedLectures as unknown as ILectureDoc[];
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
      const lectures = await this.lectureRepository.find({
        where: { google_uid: In(uniqueUids) },
      });
      return lectures as unknown as ILectureDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
