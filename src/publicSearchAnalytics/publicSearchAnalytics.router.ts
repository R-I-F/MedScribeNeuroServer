import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { PublicSearchAnalyticsController } from "./publicSearchAnalytics.controller";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin } from "../middleware/authorize.middleware";
import { userBasedRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

/**
 * Public Search Usage analytics router (docs/PUBLIC_SEARCH_USAGE_ANALYTICS_PLAN.md).
 * Mounted at /publicSearchAnalytics. Every route is super-admin only (same chain as activeUsers):
 *   extractJWT -> institutionResolver -> userBasedRateLimiter -> requireSuperAdmin.
 * Read-only over public_search_sessions; the public /explore tool is never touched.
 */
@injectable()
export class PublicSearchAnalyticsRouter {
  public router: Router;
  constructor(
    @inject(PublicSearchAnalyticsController) private controller: PublicSearchAnalyticsController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public initRoutes() {
    // GET /publicSearchAnalytics/analytics?granularity=
    this.router.get(
      "/analytics",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.controller.handleGetAnalytics(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // GET /publicSearchAnalytics/list?window=today|week|month|quarter
    this.router.get(
      "/list",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.controller.handleGetList(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );
  }
}
