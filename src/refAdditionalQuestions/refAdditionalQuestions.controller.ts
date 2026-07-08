import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { RefAdditionalQuestionsService } from "./refAdditionalQuestions.service";
import { IRefQuestion } from "./refAdditionalQuestions.interface";

@injectable()
export class RefAdditionalQuestionsController {
  constructor(
    @inject(RefAdditionalQuestionsService) private refAdditionalQuestionsService: RefAdditionalQuestionsService
  ) {}

  public async handleGetByDepartmentCode(req: Request, res: Response): Promise<IRefQuestion[]> | never {
    const validatedReq = matchedData(req) as { deptCode: string };
    try {
      return await this.refAdditionalQuestionsService.getByDepartmentCode(validatedReq.deptCode);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetByMainDiagId(req: Request, res: Response): Promise<IRefQuestion[]> | never {
    const validatedReq = matchedData(req) as { mainDiagId: string };
    try {
      return await this.refAdditionalQuestionsService.getByMainDiagId(validatedReq.mainDiagId);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
