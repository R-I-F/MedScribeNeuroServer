import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { RefLecturesController } from "./refLectures.controller";
import { getRefLecturesByDeptCodeValidator } from "../validators/getRefLecturesByDeptCode.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { userBasedRateLimiter } from "../middleware/rateLimiter.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";

/**
 * Read-only API over the scaled lectures framework in defaultdb (shared reference data — no
 * institutionResolver; queries go through ReferenceDataSource, not a tenant DataSource).
 */
@injectable()
export class RefLecturesRouter {
  public router: Router;
  constructor(
    @inject(RefLecturesController) private refLecturesController: RefLecturesController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public async initRoutes() {
    // All curriculum topics (+ ordered lectures) for a department, by dept code; optional ?level=msc|md
    this.router.get(
      "/department/:deptCode",
      extractJWT,
      userBasedRateLimiter,
      authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.SUPERVISOR, UserRole.CANDIDATE),
      getRefLecturesByDeptCodeValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.refLecturesController.handleGetByDepartmentCode(req, res);
            res.status(StatusCodes.OK).json(resp);
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
