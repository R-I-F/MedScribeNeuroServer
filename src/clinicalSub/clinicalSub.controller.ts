import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { ClinicalSubProvider } from "./clinicalSub.provider";
import { IClinicalSubInput, IClinicalSubUpdateInput } from "./clinicalSub.interface";
import { JwtPayload } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";

@injectable()
export class ClinicalSubController {
  constructor(
    @inject(ClinicalSubProvider) private clinicalSubProvider: ClinicalSubProvider
  ) {}

  /**
   * GET /clinicalSub/super — clinical subs in the resolved institution.
   * Supervisor: only subs where supervisorDocId = signed-in supervisor.
   * Institute admin / superadmin: all subs in the institution.
   * Response includes censored candidate and supervisor (no password, email, phone).
   */
  public async handleGetAssigned(req: Request, res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    const jwtPayload = res.locals.jwt as JwtPayload | undefined;
    if (!jwtPayload || !jwtPayload.role) {
      throw new Error("Unauthorized: No role found in token");
    }
    const callerId = jwtPayload.id ?? (jwtPayload as any)._id;
    const callerRole = jwtPayload.role as UserRole;
    const callerSupervisorId =
      callerRole === UserRole.SUPERVISOR ? callerId : undefined;
    if (callerRole === UserRole.SUPERVISOR && !callerSupervisorId) {
      throw new Error("Unauthorized: No supervisor ID found in token");
    }
    return await this.clinicalSubProvider.getAssignedToSupervisorOrAll(dataSource, {
      callerSupervisorId: callerSupervisorId ?? undefined,
    });
  }

  /**
   * GET /clinicalSub/cand — clinical subs in the resolved institution for the signed-in candidate.
   * Candidate: only subs where candDocId = signed-in candidate.
   * Institute admin / superadmin: all subs in the institution.
   * Response includes censored candidate and supervisor (no password, email, phone).
   */
  public async handleGetMine(req: Request, res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    const jwtPayload = res.locals.jwt as JwtPayload | undefined;
    if (!jwtPayload || !jwtPayload.role) {
      throw new Error("Unauthorized: No role found in token");
    }
    const callerId = jwtPayload.id ?? (jwtPayload as any)._id;
    const callerRole = jwtPayload.role as UserRole;
    const callerCandidateId =
      callerRole === UserRole.CANDIDATE ? callerId : undefined;
    if (callerRole === UserRole.CANDIDATE && !callerCandidateId) {
      throw new Error("Unauthorized: No candidate ID found in token");
    }
    return await this.clinicalSubProvider.getMineOrAll(dataSource, {
      callerCandidateId: callerCandidateId ?? undefined,
    });
  }

  public async handleCreate(req: Request, res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    const institutionId = (req as any).institutionId as string | undefined;
    const validated = matchedData(req) as IClinicalSubInput;
    return await this.clinicalSubProvider.create(validated, dataSource, institutionId);
  }

  public async handleGetAll(req: Request, res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    return await this.clinicalSubProvider.getAll(dataSource);
  }

  public async handleGetById(req: Request, res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    const id = req.params.id;
    return await this.clinicalSubProvider.getById(id, dataSource);
  }

  public async handleUpdate(req: Request, res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    const matched = matchedData(req) as IClinicalSubUpdateInput;
    matched.id = req.params.id;
    return await this.clinicalSubProvider.update(matched, dataSource);
  }
}
