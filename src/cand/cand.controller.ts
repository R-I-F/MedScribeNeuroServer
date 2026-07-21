import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import bcryptjs from "bcryptjs";
import { CandService } from "./cand.service";
import { ICand, ICandDoc, ICandCensoredDoc } from "./cand.interface";
import { AppDataSource } from "../config/database.config";
import { toCensoredCand } from "../utils/censored.mapper";
import { stripPassword } from "../utils/stripPassword";
import { UserRole } from "../types/role.types";
import { JwtPayload } from "../middleware/authorize.middleware";
import { AuthTokenService } from "../auth/authToken.service";
import { setAuthCookies } from "../utils/cookie.utils";

@injectable()
export class CandController {
  constructor(
    @inject(CandService) private candService: CandService,
    @inject(AuthTokenService) private authTokenService: AuthTokenService
  ) {}

  /** Reject department ids that don't exist in the mirror `departments` table. */
  private async assertDepartmentExists(departmentId: string, dataSource: DataSource): Promise<void> {
    const rows = await dataSource.query(`SELECT 1 FROM "departments" WHERE "id" = $1`, [departmentId]);
    if (!rows.length) {
      throw new Error(`Unknown departmentId: ${departmentId}`);
    }
  }

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
      return stripPassword(candidates);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Update candidate approved status. Only super admin and institute admin.
   * Institution-scoped: dataSource is the institution's DB from JWT/context.
   */
  public async handleUpdateCandidateApproved(
    req: Request,
    res: Response
  ): Promise<ICandDoc | null> | never {
    const id = req.params.id;
    const validatedReq = matchedData(req) as { approved: boolean };
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const updated = await this.candService.updateCand(
        { id, approved: validatedReq.approved },
        dataSource
      );
      return stripPassword(updated);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateCand(
    req: Request,
    res: Response
  ): Promise<ICandDoc | null> | never {
    const validatedReq = matchedData(req) as Partial<ICand> & { id: string };
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    const jwtPayload = res.locals.jwt as JwtPayload | undefined;
    const callerRole = jwtPayload?.role as UserRole | undefined;
    const callerId = jwtPayload?.id ?? jwtPayload?._id;
    const targetId = req.params.id || validatedReq.id;

    try {
      // Candidates may only update their own profile, and only regDeg, regNum, phoneNum,
      // and their department (self-service department switch).
      if (callerRole === UserRole.CANDIDATE) {
        if (callerId !== targetId) {
          throw new Error("Forbidden: Candidates can only update their own profile");
        }
        const switchingDept = validatedReq.departmentId !== undefined;
        if (switchingDept) {
          await this.assertDepartmentExists(validatedReq.departmentId as string, dataSource);
        }
        const restrictedPayload: Partial<ICand> & { id: string } = {
          id: targetId,
          ...(validatedReq.regDeg !== undefined && { regDeg: validatedReq.regDeg }),
          ...(validatedReq.regNum !== undefined && { regNum: validatedReq.regNum }),
          ...(validatedReq.phoneNum !== undefined && { phoneNum: validatedReq.phoneNum }),
          ...(switchingDept && { departmentId: validatedReq.departmentId }),
        };
        const updated = await this.candService.updateCand(restrictedPayload, dataSource);
        // The departmentId JWT claim drives dept-scoped reads — re-issue BOTH tokens so the
        // switch takes effect immediately. extractJWT prefers the auth_token COOKIE over the
        // Authorization header, and the refresh flow re-signs from the refresh token's claims,
        // so both cookies must be replaced or the old department would keep winning/resurface.
        if (updated && switchingDept) {
          const signPayload = {
            email: updated.email,
            role: UserRole.CANDIDATE,
            id: targetId,
            departmentId: updated.departmentId,
          };
          const token = await this.authTokenService.sign(signPayload);
          const refreshToken = await this.authTokenService.signRefreshToken(signPayload);
          setAuthCookies(res, token, refreshToken);
          return { ...stripPassword(updated as object), token } as unknown as ICandDoc;
        }
        return stripPassword(updated);
      }

      // Only institute admins and super admins may edit an arbitrary candidate with full
      // field access. The route's role gate admits clerk/supervisor too (hierarchical
      // authorize), so reject them here — otherwise a clerk or supervisor could overwrite
      // any candidate's password/email/approved and take over the account.
      if (callerRole !== UserRole.INSTITUTE_ADMIN && callerRole !== UserRole.SUPER_ADMIN) {
        throw new Error("Forbidden: You are not allowed to update candidate accounts");
      }
      // Institute admin and super admin: allow all fields
      if (validatedReq.departmentId !== undefined) {
        await this.assertDepartmentExists(validatedReq.departmentId as string, dataSource);
      }
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return stripPassword(await this.candService.updateCand(validatedReq, dataSource));
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
      return stripPassword(candidate);
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