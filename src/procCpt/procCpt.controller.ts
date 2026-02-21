import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { ProcCptService } from "./procCpt.service";
import { matchedData } from "express-validator";
import { IProcCpt, IProcCptDoc } from "./procCpt.interface";
import { AppDataSource } from "../config/database.config";

@injectable()
export class ProcCptController {
  constructor(
    @inject(ProcCptService) private procCptService: ProcCptService
  ) {}

  public async handleGetAllProcCpts(req: Request, res: Response): Promise<IProcCptDoc[]> | never {
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      return await this.procCptService.getAllProcCpts(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostProcCptFromExternal(req: Request, res: Response): Promise<IProcCptDoc[] | any> | never {
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const validatedReq = matchedData(req) as Partial<any>;
      const newProcCpts = await this.procCptService.createProcCptFromExternal(validatedReq, dataSource);
      return newProcCpts;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostProcCpt(req: Request, res: Response): Promise<IProcCptDoc> | never {
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    const validatedReq = matchedData(req) as IProcCpt;
    const result = await this.procCptService.createProcCptStrict(validatedReq, dataSource);
    return result;
  }

  public async handlePutProcCpt(req: Request, res: Response): Promise<IProcCptDoc> | never {
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    const id = req.params.id;
    const validatedReq = matchedData(req) as Partial<IProcCpt>;
    const result = await this.procCptService.updateProcCpt(id, validatedReq, dataSource);
    return result;
  }

  public async handleUpsertProcCpt(req: Request, res: Response): Promise<IProcCptDoc> | never {
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const validatedReq = matchedData(req) as IProcCpt;
      const result = await this.procCptService.upsertProcCpt(validatedReq, dataSource);
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteProcCpt(
    req: Request,
    res: Response
  ): Promise<{ message: string }> | never {
    const id = req.params.id;
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const deleted = await this.procCptService.deleteProcCpt(id, dataSource);
      if (!deleted) {
        throw new Error("ProcCpt not found");
      }
      return { message: "ProcCpt deleted successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
