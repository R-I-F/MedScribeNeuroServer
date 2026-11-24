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

  /** What users typed into the in-app search (J5b). Unknown filter values are ignored. */
  public async handleGetQueries(req: Request, _res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");
    const str = (v: unknown) => (typeof v === "string" && v.trim() ? v.trim() : null);
    const pick = (v: unknown, allowed: string[]) => {
      const s = str(v);
      return s && allowed.includes(s) ? s : null;
    };
    const wRaw = str(req.query.window) ?? "";
    const window: UsageWindow = WINDOWS.includes(wRaw as UsageWindow) ? (wRaw as UsageWindow) : "month";
    const limitRaw = Number(req.query.limit);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 500) : 200;
    return await this.service.getQueries(dataSource, {
      window,
      deptCode: str(req.query.deptCode),
      type: pick(req.query.type, ["procedure", "diagnosis"]),
      purpose: pick(req.query.purpose, ["assist", "missing"]),
      outcome: pick(req.query.outcome, ["picked", "none", "open", "empty"]),
      limit,
    });
  }
}
