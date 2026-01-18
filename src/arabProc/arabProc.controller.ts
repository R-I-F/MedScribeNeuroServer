import { inject, injectable } from "inversify";
import { ArabProcService } from "./arabProc.service";
import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { IArabProc, IArabProcDoc } from "./arabProc.interface";
import { IExternalRow } from "./interfaces/IExternalRow.interface";

@injectable()
export class ArabProcController {
  constructor(
    @inject(ArabProcService) private arabProcService: ArabProcService
  ) {}

  public async handleGetAllArabProcs(req: Request, res: Response): Promise<IArabProcDoc[]> | never {
    try {
      return await this.arabProcService.getAllArabProcs();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostArabProc(
    req: Request<{}, {}, IArabProc>,
    res: Response
  ): Promise<IArabProcDoc> | never {
    const validatedReq: IArabProc = matchedData(req) as IArabProc;
    try {
      return await this.arabProcService.createArabProc(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostArabProcFromExternal(
    req: Request<{}, {}, Partial<IExternalRow>>,
    res: Response
  ): Promise<IArabProcDoc[]> | never {
    const validatedReq: Partial<IExternalRow> = matchedData(req) as Partial<IExternalRow>;
    try {
      return await this.arabProcService.createArabProcsFromExternal(
        validatedReq
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
    try {
      const deleted = await this.arabProcService.deleteArabProc(id);
      if (!deleted) {
        throw new Error("ArabProc not found");
      }
      return { message: "ArabProc deleted successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
