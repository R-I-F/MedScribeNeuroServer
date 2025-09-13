import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { DiagnosisService } from "./diagnosis.service";
import { IDiagnosis } from "./diagnosis.interface";
import { matchedData } from "express-validator";

injectable();
export class DiagnosisController {
  constructor(
    @inject(DiagnosisService) private diagnosisService: DiagnosisService
  )
  {}

  public async handlePostBulkDiagnosis(req: Request, res: Response) {
    try {
      const validatedReq: IDiagnosis[] = matchedData(req);
      const newDiagnoses = await this.diagnosisService.createBulkDiagnosis(validatedReq);
      return newDiagnoses;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
