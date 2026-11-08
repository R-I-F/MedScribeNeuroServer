import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { RankChangeRequestController } from "./rankChangeRequest.controller";
import extractJWT from "../middleware/extractJWT";
import { requireCandidate, requireInstituteAdmin } from "../middleware/authorize.middleware";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

const STATUS_BY_CODE: Record<string, number> = {
  not_candidate: StatusCodes.FORBIDDEN,
  invalid_rank: StatusCodes.BAD_REQUEST,
  same_rank: StatusCodes.BAD_REQUEST,
  invalid_status: StatusCodes.BAD_REQUEST,
  invalid_decision: StatusCodes.BAD_REQUEST,
  already_pending: StatusCodes.CONFLICT,
  not_pending: StatusCodes.CONFLICT,
  not_found: StatusCodes.NOT_FOUND,
};

/**
 * Candidate rank change requests (docs/RANK_CHANGE_REQUEST_PLAN.md). Mounted at /rankChangeRequest.
 *
 * Candidate (self only, resolved from the JWT): GET /me, POST /, DELETE /me.
 * Institute admin (own department; superAdmin institution-wide): GET /admin, GET /admin/pendingCount,
 * PATCH /admin/:id { decision: "approve" | "reject", note? }. Only an approval changes candidates.rank.
 */
@injectable()
export class RankChangeRequestRouter {
  public router: Router;

  constructor(@inject(RankChangeRequestController) private controller: RankChangeRequestController) {
    this.router = express.Router();
    this.initRoutes();
  }

  private static send(res: Response, status: number, work: Promise<unknown>) {
    work
      .then((body) => res.status(status).json(body ?? {}))
      .catch((err: any) => {
        const code = err?.code;
        const http = (code && STATUS_BY_CODE[code]) || StatusCodes.INTERNAL_SERVER_ERROR;
        res.status(http).json({ error: String(err?.message ?? "Request failed"), ...(code ? { code } : {}) });
      });
  }

  public initRoutes() {
    const candidateChain = [extractJWT, institutionResolver, userBasedRateLimiter, requireCandidate];
    const adminChain = [extractJWT, institutionResolver, userBasedRateLimiter, requireInstituteAdmin];

    this.router.get("/me", ...candidateChain, (req: Request, res: Response) =>
      RankChangeRequestRouter.send(res, StatusCodes.OK, this.controller.handleGetMine(req, res))
    );

    this.router.post(
      "/",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireCandidate,
      (req: Request, res: Response) =>
        RankChangeRequestRouter.send(res, StatusCodes.CREATED, this.controller.handleCreate(req, res))
    );

    this.router.delete("/me", ...candidateChain, (req: Request, res: Response) =>
      RankChangeRequestRouter.send(res, StatusCodes.OK, this.controller.handleCancelMine(req, res))
    );

    this.router.get("/admin/pendingCount", ...adminChain, (req: Request, res: Response) =>
      RankChangeRequestRouter.send(res, StatusCodes.OK, this.controller.handlePendingCount(req, res))
    );

    this.router.get("/admin", ...adminChain, (req: Request, res: Response) =>
      RankChangeRequestRouter.send(res, StatusCodes.OK, this.controller.handleList(req, res))
    );

    this.router.patch(
      "/admin/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireInstituteAdmin,
      (req: Request, res: Response) =>
        RankChangeRequestRouter.send(res, StatusCodes.OK, this.controller.handleReview(req, res))
    );
  }
}
