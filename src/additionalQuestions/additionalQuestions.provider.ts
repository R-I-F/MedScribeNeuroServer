import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { IAdditionalQuestionDoc } from "./additionalQuestions.interface";
import { AdditionalQuestionEntity } from "./additionalQuestions.mDbSchema";

@injectable()
export class AdditionalQuestionsProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  public async getAll(dataSource: DataSource): Promise<IAdditionalQuestionDoc[]> | never {
    try {
      const repo = dataSource.getRepository(AdditionalQuestionEntity);
      const rows = await repo.find();
      return rows as unknown as IAdditionalQuestionDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getByMainDiagDocId(
    mainDiagDocId: string,
    dataSource: DataSource
  ): Promise<IAdditionalQuestionDoc | null> | never {
    try {
      if (!this.uuidRegex.test(mainDiagDocId)) {
        throw new Error("Invalid mainDiagDocId format");
      }
      const repo = dataSource.getRepository(AdditionalQuestionEntity);
      const row = await repo.findOne({ where: { mainDiagDocId } });
      return row as unknown as IAdditionalQuestionDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
