import { inject, injectable } from "inversify";
import { ArabProcService } from "./arabProc.service";
import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { Document } from "mongoose";
import { IArabProc } from "./arabProc.interface";
import { IExternalRow } from "./interfaces/IExternalRow.interface";

injectable();
export class ArabProcController {
  constructor(
    @inject(ArabProcService) private arabProcService: ArabProcService
  ) {}

  public async handleGetAllArabProcs(req: Request, res: Response) {
    try {
      return await this.arabProcService.getAllArabProcs();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostArabProc(
    req: Request<{}, {}, IArabProc>,
    res: Response
  ): Promise<Document> {
    const validatedReq: IArabProc = matchedData(req);
    try {
      return await this.arabProcService.createArabProc(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostArabProcFromExternal(
    req: Request<{}, {}, Partial<IExternalRow>>,
    res: Response
  ) {
    const validatedReq: Partial<IExternalRow> = matchedData(req);
    try {
      return await this.arabProcService.createArabProcsFromExternal(
        validatedReq
      );
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
