import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { PublicSearchAnalyticsService } from "./publicSearchAnalytics.service";
import { Granularity, UsageWindow } from "./publicSearchAnalytics.provider";

const GRANULARITIES: Granularity[] = ["daily", "weekly", "monthly", "quarterly"];
const WINDOWS: UsageWindow[] = ["today", "week", "month", "quarter"];

/**
 * Public Search Usage analytics controller (docs/PUBLIC_SEARCH_USAGE_ANALYTICS_PLAN.md).
 * Super-admin only (enforced by the router's requireSuperAdmin chain).
 */
@injectable()
export class PublicSearchAnalyticsController {
  constructor(
    @inject(PublicSearchAnalyticsService) private service: PublicSearchAnalyticsService
  ) {}

  public async handleGetAnalytics(req: Request, _res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");

    const gRaw = typeof req.query.granularity === "string" ? req.query.granularity : "";
    const granularity: Granularity = GRANULARITIES.includes(gRaw as Granularity)
      ? (gRaw as Granularity)
      : "monthly";

    return await this.service.getAnalytics(dataSource, { granularity });
  }

  public async handleGetList(req: Request, _res: Response) {
    const dataSource = (req as any).institutionDataSource;
    if (!dataSource) throw new Error("Institution DataSource not resolved");

    const wRaw = typeof req.query.window === "string" ? req.query.window : "";
    const window: UsageWindow = WINDOWS.includes(wRaw as UsageWindow)
      ? (wRaw as UsageWindow)
      : "quarter";

    return await this.service.getList(dataSource, { window });
  }
}
