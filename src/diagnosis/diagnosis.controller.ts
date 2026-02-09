import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { DiagnosisProvider } from "./diagnosis.provider";
import { IDiagnosis, IDiagnosisDoc, IDiagnosisUpdateInput } from "./diagnosis.interface";
import { matchedData } from "express-validator";
import { AppDataSource } from "../config/database.config";

@injectable()
export class DiagnosisController {
  constructor(
    @inject(DiagnosisProvider) private diagnosisProvider: DiagnosisProvider
  ) {}

  public async handleGetAllDiagnoses(req: Request, res: Response): Promise<IDiagnosisDoc[]> | never {
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      return await this.diagnosisProvider.getAllDiagnoses(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostBulkDiagnosis(req: Request, res: Response): Promise<IDiagnosisDoc[]> | never {
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const validatedReq: { diagnoses: IDiagnosis[] } = matchedData(req) as { diagnoses: IDiagnosis[] };
      const newDiagnoses = await this.diagnosisProvider.createBulkDiagnosis(validatedReq.diagnoses, dataSource);
      return newDiagnoses;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostDiagnosis(req: Request, res: Response): Promise<IDiagnosisDoc> | never {
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const validatedReq: IDiagnosis = matchedData(req) as IDiagnosis;
      const newDiagnosis = await this.diagnosisProvider.createDiagnosis(validatedReq, dataSource);
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
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      return await this.diagnosisProvider.updateDiagnosis(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteDiagnosis(
    req: Request,
    res: Response
  ): Promise<{ message: string }> | never {
    const id = req.params.id;
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const deleted = await this.diagnosisProvider.deleteDiagnosis(id, dataSource);
      if (!deleted) {
        throw new Error("Diagnosis not found");
      }
      return { message: "Diagnosis deleted successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
