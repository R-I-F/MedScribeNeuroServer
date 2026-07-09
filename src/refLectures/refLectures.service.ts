import { inject, injectable } from "inversify";
import { IRefLectureTopic } from "./refLectures.interface";
import { RefLecturesProvider } from "./refLectures.provider";

@injectable()
export class RefLecturesService {
  constructor(
    @inject(RefLecturesProvider) private refLecturesProvider: RefLecturesProvider
  ) {}

  public async getByDepartmentCode(
    deptCode: string,
    level?: "msc" | "md"
  ): Promise<IRefLectureTopic[]> | never {
    try {
      return await this.refLecturesProvider.getByDepartmentCode(deptCode, level);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
