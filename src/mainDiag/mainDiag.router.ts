import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { MainDiagController } from "./mainDiag.controller";
import { createMainDiagValidator } from "../validators/createMainDiag.validator";
import { getMainDiagByIdValidator } from "../validators/getMainDiagById.validator";
import { updateMainDiagValidator } from "../validators/updateMainDiag.validator";
import { deleteMainDiagValidator } from "../validators/deleteMainDiag.validator";
import { removeMainDiagProcsValidator } from "../validators/removeMainDiagProcs.validator";
import { removeMainDiagDiagnosisValidator } from "../validators/removeMainDiagDiagnosis.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireCandidate, authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

@injectable()
export class MainDiagRouter {
  public router: Router;
  constructor(
    @inject(MainDiagController) private mainDiagController: MainDiagController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public async initRoutes() {
    // Create mainDiag - superAdmin, instituteAdmin
    const requireSuperAdminOrInstituteAdmin = authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN);
    this.router.post(
      "/",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdminOrInstituteAdmin,
      createMainDiagValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.mainDiagController.handlePostMainDiag(req, res);
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Get all mainDiags
    // Accessible to: superAdmin, instituteAdmin, supervisors, candidates
    this.router.get(
      "/",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.mainDiagController.handleGetAllMainDiags(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Get mainDiag by ID
    // Accessible to: superAdmin, instituteAdmin, supervisors, candidates
    this.router.get(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      getMainDiagByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.mainDiagController.handleGetMainDiagById(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "MainDiag not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Update mainDiag - superAdmin, instituteAdmin
    this.router.put(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdminOrInstituteAdmin,
      updateMainDiagValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.mainDiagController.handleUpdateMainDiag(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "MainDiag not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Remove CPT (proc) links from mainDiag - superAdmin, instituteAdmin
    this.router.post(
      "/:id/procs/remove",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdminOrInstituteAdmin,
      removeMainDiagProcsValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.mainDiagController.handleRemoveProcsFromMainDiag(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "MainDiag not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Remove diagnosis (ICD) links from mainDiag - superAdmin, instituteAdmin
    this.router.post(
      "/:id/diagnosis/remove",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdminOrInstituteAdmin,
      removeMainDiagDiagnosisValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.mainDiagController.handleRemoveDiagnosisFromMainDiag(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "MainDiag not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Delete mainDiag - superAdmin, instituteAdmin
    this.router.delete(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdminOrInstituteAdmin,
      deleteMainDiagValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.mainDiagController.handleDeleteMainDiag(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json({ message: "MainDiag deleted successfully" });
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "MainDiag not found" });
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