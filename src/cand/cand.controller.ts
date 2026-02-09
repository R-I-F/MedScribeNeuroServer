import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { CandService } from "./cand.service";
import { ICandDoc, ICandCensoredDoc } from "./cand.interface";
import { AppDataSource } from "../config/database.config";
import { toCensoredCand } from "../utils/censored.mapper";
import { UserRole } from "../types/role.types";
import { JwtPayload } from "../middleware/authorize.middleware";

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
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      return await this.candService.createCandsFromExternal(validatedReq, dataSource);
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
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const candidate = await this.candService.getCandById(validatedReq.id, dataSource);
      if (!candidate) {
        throw new Error("Candidate not found");
      }
      const updatedCandidate = await this.candService.resetCandidatePassword(validatedReq.id, dataSource);
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
  ): Promise<ICandDoc[] | ICandCensoredDoc[]> | never {
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    const jwtPayload = res.locals.jwt as JwtPayload | undefined;
    const role = jwtPayload?.role;
    const censored = role === UserRole.CLERK || role === UserRole.SUPERVISOR || role === UserRole.CANDIDATE;
    try {
      const candidates = await this.candService.getAllCandidates(dataSource);
      if (censored) {
        return candidates.map(toCensoredCand);
      }
      return candidates;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandById(
    req: Request,
    res: Response
  ): Promise<ICandDoc | ICandCensoredDoc> | never {
    const id = req.params.id;
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    const jwtPayload = res.locals.jwt as JwtPayload | undefined;
    const role = jwtPayload?.role;
    const censored = role === UserRole.CLERK || role === UserRole.SUPERVISOR || role === UserRole.CANDIDATE;
    try {
      const candidate = await this.candService.getCandById(id, dataSource);
      if (!candidate) {
        throw new Error("Candidate not found");
      }
      if (censored) {
        return toCensoredCand(candidate);
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
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const deleted = await this.candService.deleteCand(id, dataSource);
      if (!deleted) {
        throw new Error("Candidate not found");
      }
      return { message: "Candidate deleted successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}