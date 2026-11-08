import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { AppDataSource } from "../config/database.config";
import { JwtPayload } from "../middleware/authorize.middleware";
import { InstituteAdminService } from "../instituteAdmin/instituteAdmin.service";
import { RankChangeRequestProvider } from "./rankChangeRequest.provider";

const dsOf = (req: Request): DataSource => (req as any).institutionDataSource || AppDataSource;

const callerOf = (res: Response) => {
  const jwt = res.locals.jwt as JwtPayload | undefined;
  return { id: (jwt?.id ?? jwt?._id) as string | undefined, role: jwt?.role as string | undefined };
};

/**
 * Candidate rank change requests (docs/RANK_CHANGE_REQUEST_PLAN.md).
 * The candidate is always the JWT subject (no candidate id is ever taken from the client), and an
 * admin's department scope is read from their DB row, never the JWT claim.
 */
@injectable()
export class RankChangeRequestController {
  constructor(
    @inject(RankChangeRequestProvider) private provider: RankChangeRequestProvider,
    @inject(InstituteAdminService) private instituteAdminService: InstituteAdminService
  ) {}

  /** NULL = institution-wide (super admin has no admin row; an admin row may have no department). */
  private async adminScope(req: Request, res: Response): Promise<string | null> {
    const { id } = callerOf(res);
    return this.instituteAdminService.getAdminDepartmentScope(id, dsOf(req));
  }

  public handleGetMine(req: Request, res: Response) {
    const { id, role } = callerOf(res);
    return this.provider.getMine(id, role, dsOf(req));
  }

  public handleCreate(req: Request, res: Response) {
    const { id, role } = callerOf(res);
    return this.provider.create(id, role, req.body?.requestedRank, dsOf(req));
  }

  public handleCancelMine(req: Request, res: Response) {
    const { id, role } = callerOf(res);
    return this.provider.cancelMine(id, role, dsOf(req));
  }

  public async handleList(req: Request, res: Response) {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    return this.provider.listForAdmin(await this.adminScope(req, res), status, dsOf(req));
  }

  public async handlePendingCount(req: Request, res: Response) {
    const pending = await this.provider.countPending(await this.adminScope(req, res), dsOf(req));
    return { pending };
  }

  public async handleReview(req: Request, res: Response) {
    const { id, role } = callerOf(res);
    const departmentId = await this.adminScope(req, res);
    return this.provider.review(
      String(req.params.id),
      req.body?.decision,
      req.body?.note,
      { id, role, departmentId },
      dsOf(req)
    );
  }
}
