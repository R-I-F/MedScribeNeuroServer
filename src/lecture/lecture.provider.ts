import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { LectureService } from "./lecture.service";
import { ILectureDoc } from "./lecture.interface";

/**
 * Read-only lecture provider. Lectures are hub-owned reference data (LibelusRefApi) mirrored into
 * the spoke; the legacy create/update/delete/bulk-import subsystem was removed. Reads are served
 * via `referenceRead` (`GET /lecture`, `/lecture/:id`).
 */
@injectable()
export class LectureProvider {
  constructor(
    @inject(LectureService) private lectureService: LectureService
  ) {}

  public async getAllLectures(dataSource: DataSource): Promise<ILectureDoc[]> | never {
    try {
      return await this.lectureService.getAllLectures(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getLectureById(id: string, dataSource: DataSource): Promise<ILectureDoc | null> | never {
    try {
      return await this.lectureService.getLectureById(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
