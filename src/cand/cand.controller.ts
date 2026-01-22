import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { CandService } from "./cand.service";
import { ICandDoc } from "./cand.interface";

@injectable()
export class CandController {
  constructor(
    @inject(CandService) private candService: CandService
  ) {}

  public async handlePostCandFromExternal(
    req: Request, 
    res: Response
  ): Promise<ICandDoc[] | any> | never {
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
  ): Promise<{ message: string }> | never {
    const validatedReq = matchedData(req) as { id: string };
    // Merge id from params into validatedReq
    validatedReq.id = req.params.id;
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

  public async handleGetAllCands(
    req: Request,
    res: Response
  ): Promise<ICandDoc[]> | never {
    try {
      const candidates = await this.candService.getAllCandidates();
      return candidates;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandById(
    req: Request,
    res: Response
  ): Promise<ICandDoc> | never {
    const id = req.params.id;
    try {
      const candidate = await this.candService.getCandById(id);
      if (!candidate) {
        throw new Error("Candidate not found");
      }
      return candidate;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteCand(
    req: Request,
    res: Response
  ): Promise<{ message: string }> | never {
    const id = req.params.id;
    try {
      const deleted = await this.candService.deleteCand(id);
      if (!deleted) {
        throw new Error("Candidate not found");
      }
      return { message: "Candidate deleted successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}