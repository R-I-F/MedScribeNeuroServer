import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { StatusCodes } from "http-status-codes";
import { ActivityTimelineController } from "./activityTimeline.controller";
import extractJWT from "../middleware/extractJWT";
import { requireCandidate } from "../middleware/authorize.middleware";
import { userBasedRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

@injectable()
export class ActivityTimelineRouter {
  public router: Router;

  constructor(
    @inject(ActivityTimelineController) private activityTimelineController: ActivityTimelineController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get(
      "/",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      async (req: Request, res: Response) => {
        try {
          const result = await this.activityTimelineController.handleGetActivityTimeline(req, res);
          res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    );
  }
}
