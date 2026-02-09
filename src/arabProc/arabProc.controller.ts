import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { ArabProcService } from "./arabProc.service";
import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { IArabProc, IArabProcDoc } from "./arabProc.interface";
import { IExternalRow } from "./interfaces/IExternalRow.interface";
import { AppDataSource } from "../config/database.config";

@injectable()
export class ArabProcController {
  constructor(
    @inject(ArabProcService) private arabProcService: ArabProcService
  ) {}

  public async handleGetAllArabProcs(req: Request, res: Response): Promise<IArabProcDoc[]> | never {
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      return await this.arabProcService.getAllArabProcs(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostArabProc(
    req: Request<{}, {}, IArabProc>,
    res: Response
  ): Promise<IArabProcDoc> | never {
    const validatedReq: IArabProc = matchedData(req) as IArabProc;
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      return await this.arabProcService.createArabProc(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostArabProcFromExternal(
    req: Request<{}, {}, Partial<IExternalRow>>,
    res: Response
  ): Promise<IArabProcDoc[]> | never {
    const validatedReq: Partial<IExternalRow> = matchedData(req) as Partial<IExternalRow>;
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      return await this.arabProcService.createArabProcsFromExternal(
        validatedReq,
        dataSource
      );
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteArabProc(
    req: Request,
    res: Response
  ): Promise<{ message: string }> | never {
    const id = req.params.id;
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const deleted = await this.arabProcService.deleteArabProc(id, dataSource);
      if (!deleted) {
        throw new Error("ArabProc not found");
      }
      return { message: "ArabProc deleted successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
