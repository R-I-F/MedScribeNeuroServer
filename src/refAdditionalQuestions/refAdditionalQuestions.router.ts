import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { RefAdditionalQuestionsController } from "./refAdditionalQuestions.controller";
import { getRefQuestionsByDeptCodeValidator } from "../validators/getRefQuestionsByDeptCode.validator";
import { getRefQuestionsByMainDiagIdValidator } from "../validators/getRefQuestionsByMainDiagId.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { userBasedRateLimiter } from "../middleware/rateLimiter.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";

/**
 * Read-only API over the scaled additional-questions framework in defaultdb
 * (shared reference data — no institutionResolver needed; queries go through
 * ReferenceDataSource, not a tenant DataSource).
 */
@injectable()
export class RefAdditionalQuestionsRouter {
  public router: Router;
  constructor(
    @inject(RefAdditionalQuestionsController) private refAdditionalQuestionsController: RefAdditionalQuestionsController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public async initRoutes() {
    // All question definitions (+ options) for a department, by dept code (e.g. NS, CTS)
    this.router.get(
      "/department/:deptCode",
      extractJWT,
      userBasedRateLimiter,
      authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.SUPERVISOR, UserRole.CANDIDATE),
      getRefQuestionsByDeptCodeValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.refAdditionalQuestionsController.handleGetByDepartmentCode(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Questions (+ narrowed options) attached to a specific main_diag
    this.router.get(
      "/main-diag/:mainDiagId",
      extractJWT,
      userBasedRateLimiter,
      authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.SUPERVISOR, UserRole.CANDIDATE),
      getRefQuestionsByMainDiagIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.refAdditionalQuestionsController.handleGetByMainDiagId(req, res);
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
