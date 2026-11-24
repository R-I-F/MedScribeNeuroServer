import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { SearchAnalyticsController } from "./searchAnalytics.controller";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin } from "../middleware/authorize.middleware";
import { userBasedRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

/**
 * AI Search Usage analytics router (docs/SEARCH_USAGE_ANALYTICS_PLAN.md).
 * Mounted at /searchAnalytics. Every route is super-admin only (same chain as activeUsers):
 *   extractJWT -> institutionResolver -> userBasedRateLimiter -> requireSuperAdmin.
 * Reads only in_app_search_events; never touches activity_read_model or the signup cap.
 */
@injectable()
export class SearchAnalyticsRouter {
  public router: Router;
  constructor(
    @inject(SearchAnalyticsController) private controller: SearchAnalyticsController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public initRoutes() {
    // GET /searchAnalytics/analytics?granularity=&scope=&deptCode=
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

    // GET /searchAnalytics/list?window=today|week|month|quarter&scope=&deptCode=
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

    // GET /searchAnalytics/user?actorId=&role=&window=  (per-user drill-down)
    this.router.get(
      "/user",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.controller.handleGetUser(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // GET /searchAnalytics/queries?window=&deptCode=&type=&purpose=&outcome=&limit=
    // What users typed (docs/OTHER_FIELD_SEMANTIC_SEARCH_PLAN.md J5b). Super admin only: queries
    // can carry clinical detail or a patient name.
    this.router.get(
      "/queries",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.controller.handleGetQueries(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          const status = /^Unknown deptCode/.test(err?.message ?? "") ? StatusCodes.NOT_FOUND : StatusCodes.INTERNAL_SERVER_ERROR;
          res.status(status).json({ error: err.message });
        }
      }
    );
  }
}
