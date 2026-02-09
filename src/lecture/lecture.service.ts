import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { ILecture, ILectureDoc } from "./lecture.interface";
import { LectureEntity } from "./lecture.mDbSchema";
import { Repository, In, Not } from "typeorm";

@injectable()
export class LectureService {
  public async createLecture(lectureData: ILecture, dataSource: DataSource): Promise<ILectureDoc> | never {
    try {
      const lectureRepository = dataSource.getRepository(LectureEntity);
      const newLecture = lectureRepository.create(lectureData);
      const savedLecture = await lectureRepository.save(newLecture);
      return savedLecture as unknown as ILectureDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllLectures(dataSource: DataSource): Promise<ILectureDoc[]> | never {
    try {
      const lectureRepository = dataSource.getRepository(LectureEntity);
      const allLectures = await lectureRepository.find({
        order: { createdAt: "DESC" },
      });
      return allLectures as unknown as ILectureDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getLectureById(id: string, dataSource: DataSource): Promise<ILectureDoc | null> | never {
    try {
      const lectureRepository = dataSource.getRepository(LectureEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid lecture ID format");
      }
      const lecture = await lectureRepository.findOne({
        where: { id },
      });
      return lecture as unknown as ILectureDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateLecture(id: string, updateData: Partial<ILecture>, dataSource: DataSource): Promise<ILectureDoc | null> | never {
    try {
      const lectureRepository = dataSource.getRepository(LectureEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid lecture ID format");
      }
      await lectureRepository.update(id, updateData);
      const updatedLecture = await lectureRepository.findOne({
        where: { id },
      });
      return updatedLecture as unknown as ILectureDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteLecture(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const lectureRepository = dataSource.getRepository(LectureEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid lecture ID format");
      }
      const result = await lectureRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findByGoogleUid(google_uid: string, dataSource: DataSource, excludeId?: string): Promise<ILectureDoc | null> | never {
    try {
      const lectureRepository = dataSource.getRepository(LectureEntity);
      const where: any = { google_uid };
      if (excludeId) {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(excludeId)) {
          where.id = Not(excludeId);
        }
      }
      const lecture = await lectureRepository.findOne({
        where,
      });
      return lecture as unknown as ILectureDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkLectures(lectureDataArray: ILecture[], dataSource: DataSource): Promise<ILectureDoc[]> | never {
    try {
      const lectureRepository = dataSource.getRepository(LectureEntity);
      const lectures = lectureRepository.create(lectureDataArray);
      const savedLectures = await lectureRepository.save(lectures);
      return savedLectures as unknown as ILectureDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findLecturesByGoogleUids(google_uids: string[], dataSource: DataSource): Promise<ILectureDoc[]> | never {
    try {
      const lectureRepository = dataSource.getRepository(LectureEntity);
      const uniqueUids = [...new Set(google_uids.filter(uid => uid && uid.trim() !== ""))];
      if (uniqueUids.length === 0) {
        return [];
      }
      const lectures = await lectureRepository.find({
        where: { google_uid: In(uniqueUids) },
      });
      return lectures as unknown as ILectureDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
