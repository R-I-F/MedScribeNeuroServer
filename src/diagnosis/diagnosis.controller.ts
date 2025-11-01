import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { DiagnosisProvider } from "./diagnosis.provider";
import { IDiagnosis } from "./diagnosis.interface";
import { matchedData } from "express-validator";

@injectable()
export class DiagnosisController {
  constructor(
    @inject(DiagnosisProvider) private diagnosisProvider: DiagnosisProvider
  )
  {}

  public async handlePostBulkDiagnosis(req: Request, res: Response) {
    try {
      const validatedReq: { diagnoses: IDiagnosis[] } = matchedData(req);
      const newDiagnoses = await this.diagnosisProvider.createBulkDiagnosis(validatedReq.diagnoses);
      return newDiagnoses;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostDiagnosis(req: Request, res: Response) {
    try {
      const validatedReq: IDiagnosis = matchedData(req);
      const newDiagnosis = await this.diagnosisProvider.createDiagnosis(validatedReq);
      return newDiagnosis;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
