import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { ILectureDoc } from "./lecture.interface";
import { LectureEntity } from "./lecture.mDbSchema";

/**
 * Read-only lecture access over the hub-mirrored `lectures` table.
 * The spoke does not create/update/delete lectures — that is owned by the hub (LibelusRefApi)
 * and replicated by RefMirrorService.
 */
@injectable()
export class LectureService {
  public async getAllLectures(dataSource: DataSource): Promise<ILectureDoc[]> | never {
    try {
      const lectureRepository = dataSource.getRepository(LectureEntity);
      const allLectures = await lectureRepository.find({
        order: { topicId: "ASC", sortOrder: "ASC" },
      });
      return allLectures as unknown as ILectureDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getLectureById(id: string, dataSource: DataSource): Promise<ILectureDoc | null> | never {
    try {
      const lectureRepository = dataSource.getRepository(LectureEntity);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid lecture ID format");
      }
      const lecture = await lectureRepository.findOne({ where: { id } });
      return lecture as unknown as ILectureDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Resolve lectures for the bulk attendance import. Since hub lectures carry no `google_uid`,
   * a sheet identifier is matched against the lecture's `lectureNumber` (exact) OR its `title`
   * (case-insensitive) — both conventions accepted.
   */
  public async findLecturesByNumbersOrTitles(keys: string[], dataSource: DataSource): Promise<ILectureDoc[]> | never {
    try {
      const lectureRepository = dataSource.getRepository(LectureEntity);
      const norm = [...new Set(keys.filter((k) => k && k.trim() !== "").map((k) => k.trim()))];
      if (norm.length === 0) return [];
      const lower = norm.map((k) => k.toLowerCase());
      const lectures = await lectureRepository
        .createQueryBuilder("l")
        .where("l.lectureNumber IN (:...nums)", { nums: norm })
        .orWhere("LOWER(l.title) IN (:...titles)", { titles: lower })
        .getMany();
      return lectures as unknown as ILectureDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
