import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { userBasedRateLimiter } from "../middleware/rateLimiter.middleware";
import { authorize, requireCandidate } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import institutionResolver from "../middleware/institutionResolver.middleware";
import { BundlerController } from "./bundler.controller";

@injectable()
export class BundlerRouter {
  public router: Router;
  constructor(
    @inject(BundlerController) private bundlerController: BundlerController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public initRoutes() {
    // GET /references (when mounted at /references)
    this.router.get(
      "/",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.SUPERVISOR, UserRole.CANDIDATE),
      async (req: Request, res: Response) => {
        try {
          const resp = await this.bundlerController.handleGetAll(req, res);
          // no-cache = browser MUST revalidate (ETag 304 keeps it cheap). The old
          // `max-age=86400` let browsers serve stale bodies for 24h WITHOUT contacting
          // the server — deploys/restarts that changed the shape never reached clients.
          res.setHeader("Cache-Control", "private, no-cache");
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // GET /candidate/dashboard (when mounted at /candidate)
    this.router.get(
      "/dashboard",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      async (req: Request, res: Response) => {
        try {
          const result = await this.bundlerController.handleGetCandidateDashboard(req, res);
          if (result !== undefined) {
            res.status(StatusCodes.OK).json(result);
          }
        } catch (err: any) {
          if (err.message?.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    );
  }
}
