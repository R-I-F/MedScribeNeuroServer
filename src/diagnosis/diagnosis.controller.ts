import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { DiagnosisProvider } from "./diagnosis.provider";
import { IDiagnosis, IDiagnosisDoc, IDiagnosisUpdateInput } from "./diagnosis.interface";
import { matchedData } from "express-validator";

@injectable()
export class DiagnosisController {
  constructor(
    @inject(DiagnosisProvider) private diagnosisProvider: DiagnosisProvider
  ) {}

  public async handleGetAllDiagnoses(req: Request, res: Response): Promise<IDiagnosisDoc[]> | never {
    try {
      return await this.diagnosisProvider.getAllDiagnoses();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostBulkDiagnosis(req: Request, res: Response): Promise<IDiagnosisDoc[]> | never {
    try {
      const validatedReq: { diagnoses: IDiagnosis[] } = matchedData(req) as { diagnoses: IDiagnosis[] };
      const newDiagnoses = await this.diagnosisProvider.createBulkDiagnosis(validatedReq.diagnoses);
      return newDiagnoses;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostDiagnosis(req: Request, res: Response): Promise<IDiagnosisDoc> | never {
    try {
      const validatedReq: IDiagnosis = matchedData(req) as IDiagnosis;
      const newDiagnosis = await this.diagnosisProvider.createDiagnosis(validatedReq);
      return newDiagnosis;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateDiagnosis(
    req: Request,
    res: Response
  ): Promise<IDiagnosisDoc | null> | never {
    const validatedReq = matchedData(req) as IDiagnosisUpdateInput;
    // Merge id from params into validatedReq
    validatedReq.id = req.params.id;
    try {
      return await this.diagnosisProvider.updateDiagnosis(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteDiagnosis(
    req: Request,
    res: Response
  ): Promise<{ message: string }> | never {
    const id = req.params.id;
    try {
      const deleted = await this.diagnosisProvider.deleteDiagnosis(id);
      if (!deleted) {
        throw new Error("Diagnosis not found");
      }
      return { message: "Diagnosis deleted successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
