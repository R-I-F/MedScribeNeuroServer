import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { ActiveUsersController } from "./activeUsers.controller";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin } from "../middleware/authorize.middleware";
import { userBasedRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

/**
 * Active-Users analytics router (docs/ACTIVE_USERS_ANALYTICS_PLAN.md, Stage C).
 * Mounted at /activeUsers. Every route is super-admin only (same chain as superAdmin.router):
 *   extractJWT -> institutionResolver -> userBasedRateLimiter -> requireSuperAdmin.
 */
@injectable()
export class ActiveUsersRouter {
  public router: Router;
  constructor(
    @inject(ActiveUsersController) private activeUsersController: ActiveUsersController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public initRoutes() {
    // GET /activeUsers/analytics?granularity=&scope=&deptCode=
    this.router.get(
      "/analytics",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.activeUsersController.handleGetAnalytics(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // GET /activeUsers/list?window=today|week|month|quarter&scope=&deptCode=
    this.router.get(
      "/list",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.activeUsersController.handleGetList(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // GET /activeUsers/user?actorId=&role=&window=  (per-user drill-down)
    this.router.get(
      "/user",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.activeUsersController.handleGetUserActivity(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // PATCH /activeUsers/cap  body: { maxActiveUsers: number | null }
    this.router.patch(
      "/cap",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.activeUsersController.handleSetCap(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
        }
      }
    );
  }
}
