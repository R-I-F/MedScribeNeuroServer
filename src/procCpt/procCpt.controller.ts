import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { ProcCptService } from "./procCpt.service";
import { matchedData } from "express-validator";

injectable();
export class ProcCptController {
  constructor(
    @inject(ProcCptService) private procCptService: ProcCptService
  )
  {}

  public async handlePostProcCptFromExternal(req: Request, res: Response) {
    try {    
      const newProcCpts = await this.procCptService.createProcCptFromExternal(matchedData(req))
      return newProcCpts;     
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
