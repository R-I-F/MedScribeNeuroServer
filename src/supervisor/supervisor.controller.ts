import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { SupervisorService } from "./supervisor.service";
import { ISupervisor, ISupervisorDoc, ISupervisorCensoredDoc } from "./supervisor.interface";
import bcryptjs from "bcryptjs";
import { AppDataSource } from "../config/database.config";
import { toCensoredSupervisor } from "../utils/censored.mapper";
import { UserRole } from "../types/role.types";
import { JwtPayload } from "../middleware/authorize.middleware";
import { AuthTokenService } from "../auth/authToken.service";
import { setAuthCookies } from "../utils/cookie.utils";

@injectable()
export class SupervisorController {
  constructor(
    @inject(SupervisorService) private supervisorService: SupervisorService,
    @inject(AuthTokenService) private authTokenService: AuthTokenService
  ) {}

  /** Reject department ids that don't exist in the mirror `departments` table. */
  private async assertDepartmentExists(departmentId: string, dataSource: DataSource): Promise<void> {
    const rows = await dataSource.query(`SELECT 1 FROM "departments" WHERE "id" = $1`, [departmentId]);
    if (!rows.length) {
      throw new Error(`Unknown departmentId: ${departmentId}`);
    }
  }

  /** Department resolution for the /supervisor pickers: JWT claim → ?deptCode → NS default. */
  private async resolveDepartmentId(req: Request, res: Response, dataSource: DataSource): Promise<string | null> {
    const jwt = res.locals.jwt as JwtPayload | undefined;
    let departmentId = (jwt as { departmentId?: string } | undefined)?.departmentId ?? null;
    const deptCode = typeof req.query.deptCode === "string" ? req.query.deptCode : undefined;
    if (!departmentId && deptCode) {
      const rows = await dataSource.query(`SELECT "id" FROM "departments" WHERE "code" = $1`, [deptCode]);
      departmentId = rows[0]?.id ?? null;
    }
    if (!departmentId) {
      const code = process.env.REF_DEPT_CODE || "NS";
      const rows = await dataSource.query(`SELECT "id" FROM "departments" WHERE "code" = $1`, [code]);
      departmentId = rows[0]?.id ?? null;
    }
    return departmentId;
  }

  public async handlePostSupervisor(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as Partial<ISupervisor>;
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      // Hash password before saving
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return await this.supervisorService.createSupervisor(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllSupervisors(
    req: Request, 
    res: Response
  ): Promise<ISupervisorDoc[] | ISupervisorCensoredDoc[]> {
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    const jwtPayload = res.locals.jwt as JwtPayload | undefined;
    const role = jwtPayload?.role;
    const censored = role === UserRole.CLERK || role === UserRole.SUPERVISOR || role === UserRole.CANDIDATE;
    try {
      // Dept-scoped: the supervisor pickers (candidate submission form, CM event
      // presenter) should only offer the caller's department's supervisors.
      const departmentId = await this.resolveDepartmentId(req, res, dataSource);
      const list = await this.supervisorService.getAllSupervisors(dataSource, departmentId);
      if (censored) {
        return list.map(toCensoredSupervisor);
      }
      return list.map(({ createdAt, updatedAt, password, ...rest }) => rest);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetSupervisorById(
    req: Request, 
    res: Response
  ): Promise<ISupervisorDoc | ISupervisorCensoredDoc | null> {
    const validatedReq = matchedData(req) as { id: string };
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    const jwtPayload = res.locals.jwt as JwtPayload | undefined;
    const role = jwtPayload?.role;
    const censored = role === UserRole.CLERK || role === UserRole.SUPERVISOR || role === UserRole.CANDIDATE;
    try {
      const supervisor = await this.supervisorService.getSupervisorById(validatedReq, dataSource);
      if (!supervisor) return null;
      if (censored) {
        return toCensoredSupervisor(supervisor);
      }
      const { password, ...rest } = supervisor;
      return rest as ISupervisorDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Update supervisor approved status. Only super admin and institute admin.
   * Institution-scoped: dataSource is the institution's DB from JWT/context.
   */
  public async handleUpdateSupervisorApproved(
    req: Request,
    res: Response
  ): Promise<ISupervisorDoc | null> {
    const id = req.params.id;
    const validatedReq = matchedData(req) as { approved: boolean };
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const updated = await this.supervisorService.updateSupervisor(
        { id, approved: validatedReq.approved },
        dataSource
      );
      return updated;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateSupervisor(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as Partial<ISupervisor> & { id: string };
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    const jwtPayload = res.locals.jwt as JwtPayload | undefined;
    const callerRole = jwtPayload?.role as UserRole | undefined;
    const callerId = jwtPayload?.id ?? jwtPayload?._id;
    const targetId = req.params.id || validatedReq.id;

    try {
      // Supervisors may only update their own profile, and only phoneNum, position,
      // and their department (self-service department switch).
      if (callerRole === UserRole.SUPERVISOR) {
        if (callerId !== targetId) {
          throw new Error("Forbidden: Supervisors can only update their own profile");
        }
        const switchingDept = validatedReq.departmentId !== undefined;
        if (switchingDept) {
          await this.assertDepartmentExists(validatedReq.departmentId as string, dataSource);
        }
        const restrictedPayload: Partial<ISupervisor> & { id: string } = {
          id: targetId,
          ...(validatedReq.phoneNum !== undefined && { phoneNum: validatedReq.phoneNum }),
          ...(validatedReq.position !== undefined && { position: validatedReq.position }),
          ...(switchingDept && { departmentId: validatedReq.departmentId }),
        };
        const updated = await this.supervisorService.updateSupervisor(restrictedPayload, dataSource);
        // The departmentId JWT claim drives dept-scoped reads — re-issue BOTH tokens so the
        // switch takes effect immediately. extractJWT prefers the auth_token COOKIE over the
        // Authorization header, and the refresh flow re-signs from the refresh token's claims,
        // so both cookies must be replaced or the old department would keep winning/resurface.
        if (updated && switchingDept) {
          const signPayload = {
            email: updated.email,
            role: UserRole.SUPERVISOR,
            id: targetId,
            departmentId: updated.departmentId,
          };
          const token = await this.authTokenService.sign(signPayload);
          const refreshToken = await this.authTokenService.signRefreshToken(signPayload);
          setAuthCookies(res, token, refreshToken);
          return { ...(updated as object), token } as unknown as ISupervisorDoc;
        }
        return updated;
      }

      // Institute admin and super admin: allow all fields
      if (validatedReq.departmentId !== undefined) {
        await this.assertDepartmentExists(validatedReq.departmentId as string, dataSource);
      }
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return await this.supervisorService.updateSupervisor(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteSupervisor(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      return await this.supervisorService.deleteSupervisor(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleResetAllSupervisorPasswords(
    req: Request,
    res: Response
  ) {
    const defaultPassword = process.env.BASE_SUPER_PASSWORD;
    if (!defaultPassword) {
      throw new Error("BASE_SUPER_PASSWORD environment variable is not set");
    }
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const hashedPassword = await bcryptjs.hash(defaultPassword, 10);
      const modifiedCount = await this.supervisorService.resetAllSupervisorPasswords(
        hashedPassword,
        dataSource
      );
      return {
        modifiedCount,
        defaultPassword,
      };
    } catch (err: any) {
      throw new Error(err?.message ?? "Failed to reset supervisor passwords");
    }
  }

  public async handleGetSupervisedCandidates(
    req: Request,
    res: Response
  ): Promise<Array<any>> | never {
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    try {
      const jwtPayload = res.locals.jwt as { _id: string; id?: string; email: string; role: string } | undefined;

      if (!jwtPayload || (!jwtPayload._id && !jwtPayload.id)) {
        throw new Error("Unauthorized: No supervisor ID found in token");
      }

      // Use id (MariaDB UUID) if available, otherwise fall back to _id (MongoDB ObjectId)
      const supervisorId = jwtPayload.id || jwtPayload._id;
      const candidates = await this.supervisorService.getSupervisedCandidates(supervisorId, dataSource);

      return candidates;
    } catch (err: any) {
      throw new Error(err);
    }
  }

}
