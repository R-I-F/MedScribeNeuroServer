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

  public async handleResetCandidatePassword(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    try {
      const candidate = await this.candService.getCandById(validatedReq.id);
      if (!candidate) {
        throw new Error("Candidate not found");
      }
      const updatedCandidate = await this.candService.resetCandidatePassword(validatedReq.id);
      if (!updatedCandidate) {
        throw new Error("Failed to reset candidate password");
      }
      return { message: "Candidate password reset successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}