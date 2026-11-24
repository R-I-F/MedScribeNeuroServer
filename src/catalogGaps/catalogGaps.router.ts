import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { CatalogGapsController } from "./catalogGaps.controller";
import extractJWT from "../middleware/extractJWT";
import { requireInstituteAdmin } from "../middleware/authorize.middleware";
import { userBasedRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

/**
 * "Not in catalogue" list (docs/OTHER_FIELD_SEMANTIC_SEARCH_PLAN.md, J5). Mounted at /catalogGaps.
 * Institute admin (superAdmin admitted hierarchically); department locked in the controller.
 */
@injectable()
export class CatalogGapsRouter {
  public router: Router;

  constructor(@inject(CatalogGapsController) private controller: CatalogGapsController) {
    this.router = express.Router();
    this.initRoutes();
  }

  private static sendError(res: Response, err: any) {
    const msg = String(err?.message ?? "Request failed");
    if (msg === "Not found" || /^Unknown deptCode/.test(msg)) {
      res.status(StatusCodes.NOT_FOUND).json({ error: msg });
    } else if (/^Invalid /.test(msg)) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: msg });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: msg });
    }
  }

  public initRoutes() {
    // GET /catalogGaps?status=open|reported|dismissed&kind=procedure|diagnosis&deptCode=
    this.router.get(
      "/",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          res.status(StatusCodes.OK).json(await this.controller.handleList(req, res));
        } catch (err: any) {
          CatalogGapsRouter.sendError(res, err);
        }
      }
    );

    // PATCH /catalogGaps/status { kind, mainDiagId, normalizedText, status, deptCode? }
    this.router.patch(
      "/status",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          res.status(StatusCodes.OK).json(await this.controller.handleSetStatus(req, res));
        } catch (err: any) {
          CatalogGapsRouter.sendError(res, err);
        }
      }
    );
  }
}
