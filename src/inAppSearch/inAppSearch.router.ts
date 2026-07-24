import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { matchedData, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { InAppSearchController } from "./inAppSearch.controller";
import { inAppSearchQueryValidator } from "../validators/inAppSearch.validator";
import extractJWT from "../middleware/extractJWT";
import institutionResolver from "../middleware/institutionResolver.middleware";
import { userBasedRateLimiter } from "../middleware/rateLimiter.middleware";
import { requireCandidate } from "../middleware/authorize.middleware";

/**
 * Authenticated in-form semantic search (docs/IN_FORM_SEMANTIC_SEARCH_PLAN.md).
 * `requireCandidate` is hierarchical, so it admits candidates AND supervisors (and admins).
 * Department + userId come from the JWT (never the body); a 5/user/UTC-day quota is enforced.
 */
@injectable()
export class InAppSearchRouter {
  public router: Router;
  constructor(
    @inject(InAppSearchController) private controller: InAppSearchController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.post(
      "/query",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      inAppSearchQueryValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        try {
          const { query, type } = matchedData(req, { locations: ["body"] }) as any;
          const ds = (req as any).institutionDataSource;
          if (!ds) return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Unavailable" });
          const jwt = (res.locals as any).jwt ?? {};
          const actor = {
            userId: jwt.id || jwt._id,
            userRole: jwt.role,
            departmentId: jwt.departmentId ?? null,
          };
          if (!actor.userId) return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
          const resp = await this.controller.handleQuery(actor, { query, type }, ds);
          return res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );
  }
}
