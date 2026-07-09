import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { RefLecturesService } from "./refLectures.service";
import { IRefLectureTopic } from "./refLectures.interface";

@injectable()
export class RefLecturesController {
  constructor(
    @inject(RefLecturesService) private refLecturesService: RefLecturesService
  ) {}

  public async handleGetByDepartmentCode(req: Request, res: Response): Promise<IRefLectureTopic[]> | never {
    const validated = matchedData(req) as { deptCode: string; level?: "msc" | "md" };
    try {
      return await this.refLecturesService.getByDepartmentCode(validated.deptCode, validated.level);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
