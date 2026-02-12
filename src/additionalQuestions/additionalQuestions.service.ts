import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IAdditionalQuestionDoc } from "./additionalQuestions.interface";
import { AdditionalQuestionsProvider } from "./additionalQuestions.provider";

@injectable()
export class AdditionalQuestionsService {
  constructor(
    @inject(AdditionalQuestionsProvider) private additionalQuestionsProvider: AdditionalQuestionsProvider
  ) {}

  public async getAll(dataSource: DataSource): Promise<IAdditionalQuestionDoc[]> | never {
    try {
      return await this.additionalQuestionsProvider.getAll(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getByMainDiagDocId(
    mainDiagDocId: string,
    dataSource: DataSource
  ): Promise<IAdditionalQuestionDoc | null> | never {
    try {
      return await this.additionalQuestionsProvider.getByMainDiagDocId(mainDiagDocId, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
