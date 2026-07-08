import { inject, injectable } from "inversify";
import { IRefQuestion } from "./refAdditionalQuestions.interface";
import { RefAdditionalQuestionsProvider } from "./refAdditionalQuestions.provider";

@injectable()
export class RefAdditionalQuestionsService {
  constructor(
    @inject(RefAdditionalQuestionsProvider) private refAdditionalQuestionsProvider: RefAdditionalQuestionsProvider
  ) {}

  public async getByDepartmentCode(deptCode: string): Promise<IRefQuestion[]> | never {
    try {
      return await this.refAdditionalQuestionsProvider.getByDepartmentCode(deptCode);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getByMainDiagId(mainDiagId: string): Promise<IRefQuestion[]> | never {
    try {
      return await this.refAdditionalQuestionsProvider.getByMainDiagId(mainDiagId);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
