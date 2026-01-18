import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { ProcCptService } from "./procCpt.service";
import { matchedData } from "express-validator";
import { IProcCpt, IProcCptDoc } from "./procCpt.interface";

@injectable()
export class ProcCptController {
  constructor(
    @inject(ProcCptService) private procCptService: ProcCptService
  ) {}

  public async handlePostProcCptFromExternal(req: Request, res: Response): Promise<IProcCptDoc[] | any> | never {
    try {
      const validatedReq = matchedData(req) as Partial<any>;
      const newProcCpts = await this.procCptService.createProcCptFromExternal(validatedReq);
      return newProcCpts;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpsertProcCpt(req: Request, res: Response): Promise<IProcCptDoc> | never {
    try {
      const validatedReq = matchedData(req) as IProcCpt;
      const result = await this.procCptService.upsertProcCpt(validatedReq);
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
    try {
      const deleted = await this.procCptService.deleteProcCpt(id);
      if (!deleted) {
        throw new Error("ProcCpt not found");
      }
      return { message: "ProcCpt deleted successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
