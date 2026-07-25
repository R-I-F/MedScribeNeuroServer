import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { SearchAnalyticsService } from "./searchAnalytics.service";
import { Granularity, Scope, UsageWindow } from "./searchAnalytics.provider";

const GRANULARITIES: Granularity[] = ["daily", "weekly", "monthly", "quarterly"];
const WINDOWS: UsageWindow[] = ["today", "week", "month", "quarter"];

/**
 * AI Search Usage analytics controller (docs/SEARCH_USAGE_ANALYTICS_PLAN.md).
 * Super-admin only (enforced by the router's requireSuperAdmin chain).
 */
@injectable()
export class SearchAnalyticsController {
  constructor(
    @inject(SearchAnalyticsService) private service: SearchAnalyticsService
  ) {}

  public async handleGetAnalytics(req: Request, _res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");

    const gRaw = typeof req.query.granularity === "string" ? req.query.granularity : "";
    const granularity: Granularity = GRANULARITIES.includes(gRaw as Granularity)
      ? (gRaw as Granularity)
      : "monthly";
    const scope: Scope = req.query.scope === "department" ? "department" : "institution";
    const deptCode = typeof req.query.deptCode === "string" ? req.query.deptCode : undefined;

    return await this.service.getAnalytics(dataSource, { granularity, scope, deptCode });
  }

  /** Drill-down: the list of distinct users who searched in the window. */
  public async handleGetList(req: Request, _res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");

    const wRaw = typeof req.query.window === "string" ? req.query.window : "";
    const window: UsageWindow = WINDOWS.includes(wRaw as UsageWindow)
      ? (wRaw as UsageWindow)
      : "quarter";
    const scope: Scope = req.query.scope === "department" ? "department" : "institution";
    const deptCode = typeof req.query.deptCode === "string" ? req.query.deptCode : undefined;

    return await this.service.getList(dataSource, { window, scope, deptCode });
  }

  /** Per-user drill-down: one user's search breakdown + timeline in the window. */
  public async handleGetUser(req: Request, _res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");

    const actorId = typeof req.query.actorId === "string" ? req.query.actorId : "";
    if (!actorId) throw new Error("actorId is required");
    const role = typeof req.query.role === "string" ? req.query.role : undefined;
    const wRaw = typeof req.query.window === "string" ? req.query.window : "";
    const window: UsageWindow = WINDOWS.includes(wRaw as UsageWindow)
      ? (wRaw as UsageWindow)
      : "quarter";

    return await this.service.getUser(dataSource, { actorId, role, window });
  }
}
