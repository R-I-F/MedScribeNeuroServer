import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { AdditionalQuestionsService } from "./additionalQuestions.service";
import { IAdditionalQuestionDoc } from "./additionalQuestions.interface";

@injectable()
export class AdditionalQuestionsController {
  constructor(
    @inject(AdditionalQuestionsService) private additionalQuestionsService: AdditionalQuestionsService
  ) {}

  public async handleGetAll(req: Request, res: Response): Promise<IAdditionalQuestionDoc[]> | never {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.additionalQuestionsService.getAll(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetByMainDiagDocId(
    req: Request,
    res: Response
  ): Promise<IAdditionalQuestionDoc | null> | never {
    const validatedReq = matchedData(req) as { mainDiagDocId: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.additionalQuestionsService.getByMainDiagDocId(
        validatedReq.mainDiagDocId,
        dataSource
      );
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdate(req: Request, res: Response): Promise<IAdditionalQuestionDoc | null> | never {
    const validated = matchedData(req) as { mainDiagDocId: string; spOrCran?: number; pos?: number; approach?: number; region?: number; clinPres?: number; intEvents?: number };
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    const { mainDiagDocId, ...updateData } = validated;
    return await this.additionalQuestionsService.updateByMainDiagDocId(mainDiagDocId, dataSource, updateData);
  }
}
