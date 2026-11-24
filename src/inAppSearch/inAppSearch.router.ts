import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { matchedData, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { InAppSearchController } from "./inAppSearch.controller";
import { inAppSearchQueryValidator, inAppSearchOutcomeValidator } from "../validators/inAppSearch.validator";
import extractJWT from "../middleware/extractJWT";
import institutionResolver from "../middleware/institutionResolver.middleware";
import { userBasedRateLimiter } from "../middleware/rateLimiter.middleware";
import { requireCandidate } from "../middleware/authorize.middleware";

/**
 * Authenticated in-form semantic search (docs/IN_FORM_SEMANTIC_SEARCH_PLAN.md and
 * docs/OTHER_FIELD_SEMANTIC_SEARCH_PLAN.md).
 * `requireCandidate` is hierarchical, so it admits candidates AND supervisors (and admins).
 * Department + userId come from the JWT (never the body); daily quotas are enforced per purpose.
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

  private actorFrom(res: Response) {
    const jwt = (res.locals as any).jwt ?? {};
    return {
      userId: jwt.id || jwt._id,
      userRole: jwt.role,
      departmentId: jwt.departmentId ?? null,
    };
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
          const { query, type, purpose, mainDiagId } = matchedData(req, { locations: ["body"] }) as any;
          const ds = (req as any).institutionDataSource;
          if (!ds) return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Unavailable" });
          const actor = this.actorFrom(res);
          if (!actor.userId) return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
          const resp = await this.controller.handleQuery(
            actor,
            { query, type, purpose, mainDiagId: mainDiagId ?? null },
            ds
          );
          return res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // What the user did after a search: picked a result, or pressed "None of these".
    // Fire-and-forget from the form; only the caller's own events can be updated.
    this.router.post(
      "/events/:id/outcome",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      inAppSearchOutcomeValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        try {
          const { id, outcome, pickedCode } = matchedData(req) as any;
          const ds = (req as any).institutionDataSource;
          if (!ds) return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Unavailable" });
          const actor = this.actorFrom(res);
          if (!actor.userId) return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
          const ok = await this.controller.handleOutcome(actor, id, outcome, pickedCode ?? null, ds);
          if (!ok) return res.status(StatusCodes.NOT_FOUND).json({ error: "Search not found" });
          return res.status(StatusCodes.OK).json({ ok: true });
        } catch (err: any) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );
  }
}
