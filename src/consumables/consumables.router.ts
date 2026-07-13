import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { ConsumablesController } from "./consumables.controller";
import { getConsumableByIdValidator } from "../validators/getConsumableById.validator";
import { query, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { userBasedRateLimiter } from "../middleware/rateLimiter.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import institutionResolver from "../middleware/institutionResolver.middleware";

/**
 * Read-only consumable routes over the hub-synced mirror (original paths + role gates).
 * List reads accept `?deptCode=XXX` (default: JWT department claim → REF_DEPT_CODE).
 * Writes no longer exist on this path — reference truth is owned by the hub → 404.
 */
@injectable()
export class ConsumablesRouter {
  public router: Router;
  constructor(
    @inject(ConsumablesController) private consumablesController: ConsumablesController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public async initRoutes() {
    const deptCodeQueryValidator = query("deptCode")
      .optional()
      .trim()
      .matches(/^[A-Za-z]{2,10}$/)
      .withMessage("deptCode must be 2-10 letters (e.g. NS, CTS, OBGYN)");

    this.router.get(
      "/",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.SUPERVISOR, UserRole.CANDIDATE),
      deptCodeQueryValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
        try {
          const resp = await this.consumablesController.handleGetAll(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          const status = err?.status ?? StatusCodes.INTERNAL_SERVER_ERROR;
          res.status(status).json({ error: err.message });
        }
      }
    );

    this.router.get(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.SUPERVISOR, UserRole.CANDIDATE),
      getConsumableByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.consumablesController.handleGetById(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Consumable not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
  }
}
