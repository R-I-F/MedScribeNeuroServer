import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { ActiveUsersService } from "./activeUsers.service";
import { Granularity, Scope, ActiveWindow } from "./activeUsers.provider";

const GRANULARITIES: Granularity[] = ["daily", "weekly", "monthly", "quarterly"];
const WINDOWS: ActiveWindow[] = ["today", "week", "month", "quarter"];

/**
 * Active-Users analytics controller (docs/ACTIVE_USERS_ANALYTICS_PLAN.md, Stage C).
 * Super-admin only (enforced by the router's requireSuperAdmin chain).
 */
@injectable()
export class ActiveUsersController {
  constructor(
    @inject(ActiveUsersService) private activeUsersService: ActiveUsersService
  ) {}

  public async handleGetAnalytics(req: Request, res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }

    const gRaw = typeof req.query.granularity === "string" ? req.query.granularity : "";
    const granularity: Granularity = GRANULARITIES.includes(gRaw as Granularity)
      ? (gRaw as Granularity)
      : "monthly";

    const scope: Scope = req.query.scope === "department" ? "department" : "institution";
    const deptCode =
      typeof req.query.deptCode === "string" ? req.query.deptCode : undefined;

    return await this.activeUsersService.getAnalytics(dataSource, {
      granularity,
      scope,
      deptCode,
    });
  }

  /** Drill-down: the list of distinct active users for a window (today/week/month/quarter). */
  public async handleGetList(req: Request, res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    const wRaw = typeof req.query.window === "string" ? req.query.window : "";
    const window: ActiveWindow = WINDOWS.includes(wRaw as ActiveWindow)
      ? (wRaw as ActiveWindow)
      : "quarter";
    const scope: Scope = req.query.scope === "department" ? "department" : "institution";
    const deptCode = typeof req.query.deptCode === "string" ? req.query.deptCode : undefined;
    return await this.activeUsersService.getList(dataSource, { window, scope, deptCode });
  }

  /** Per-user drill-down: one user's activity breakdown + recent timeline in the window. */
  public async handleGetUserActivity(req: Request, res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    const actorId = typeof req.query.actorId === "string" ? req.query.actorId : "";
    if (!actorId) throw new Error("actorId is required");
    const role = typeof req.query.role === "string" ? req.query.role : undefined;
    const wRaw = typeof req.query.window === "string" ? req.query.window : "";
    const window: ActiveWindow = WINDOWS.includes(wRaw as ActiveWindow)
      ? (wRaw as ActiveWindow)
      : "quarter";
    return await this.activeUsersService.getUserActivity(dataSource, { actorId, role, window });
  }

  /**
   * Set (or clear with null) the max-active-users cap. Body: { maxActiveUsers: number|null }.
   * Returns the resulting gate state. Super-admin only (router chain).
   */
  public async handleSetCap(req: Request, res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    const raw = (req.body ?? {}).maxActiveUsers;
    let value: number | null;
    if (raw === null || raw === undefined || raw === "") {
      value = null; // clear the cap (unlimited)
    } else {
      const n = Number(raw);
      if (!Number.isInteger(n) || n < 0) {
        throw new Error("maxActiveUsers must be a non-negative integer or null");
      }
      value = n;
    }
    return await this.activeUsersService.setCap(dataSource, value);
  }
}
