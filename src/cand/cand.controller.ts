import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { CandService } from "./cand.service";

injectable()
export class CandController{
  constructor(
    @inject(CandService) private candService: CandService
  ){}

  public async handlePostCandFromExternal(
    req: Request, 
    res: Response
  ){
    const validatedReq = matchedData(req);
    try {
      return await this.candService.createCandsFromExternal(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}