import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { DiagnosisController } from "./diagnosis.controller";
import { createBulkDiagnosisValidator } from "../validators/createBulkDiagnosis.validator";
import { createDiagnosisValidator } from "../validators/createDiagnosis.validator";
import { updateDiagnosisValidator } from "../validators/updateDiagnosis.validator";
import { deleteDiagnosisValidator } from "../validators/deleteDiagnosis.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin, authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

@injectable()
export class DiagnosisRouter {
  public router: Router;

  constructor(
    @inject(DiagnosisController) private diagnosisController: DiagnosisController
  ) 
  {
    this.router = express.Router();
    this.initRoutes();
  }

  private async initRoutes() {
    // Custom authorization for GET: allows superAdmin and instituteAdmin
    const requireSuperAdminOrInstituteAdmin = authorize(
      UserRole.SUPER_ADMIN,
      UserRole.INSTITUTE_ADMIN
    );

    // GET endpoint - Get all diagnoses
    this.router.get(
      "/",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdminOrInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          const allDiagnoses = await this.diagnosisController.handleGetAllDiagnoses(req, res);
          res.status(StatusCodes.OK).json(allDiagnoses);
        } catch (err: any) {
          throw new Error(err);
        }
      }
    );

    this.router.post(
      "/postBulk",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdmin,
      createBulkDiagnosisValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const newDiagnoses = await this.diagnosisController.handlePostBulkDiagnosis(req, res);
            res.status(StatusCodes.CREATED).json(newDiagnoses);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    this.router.post(
      "/post",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdmin,
      createDiagnosisValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const newDiagnosis = await this.diagnosisController.handlePostDiagnosis(req, res);
            res.status(StatusCodes.CREATED).json(newDiagnosis);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    this.router.patch(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdmin,
      updateDiagnosisValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.diagnosisController.handleUpdateDiagnosis(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Diagnosis not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    this.router.delete(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdmin,
      deleteDiagnosisValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.diagnosisController.handleDeleteDiagnosis(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            if (err.message.includes("not found")) {
              res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
  }
}
