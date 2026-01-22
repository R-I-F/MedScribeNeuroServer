import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { CandController } from "./cand.controller";
import { createFromExternalValidator } from "../validators/createFromExternal.validator";
import { resetCandidatePasswordValidator } from "../validators/resetCandidatePassword.validator";
import { getCandByIdValidator } from "../validators/getCandById.validator";
import { deleteCandValidator } from "../validators/deleteCand.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin, requireInstituteAdmin, authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";

@injectable()
export class CandRouter{
  public router: Router;
  constructor(
    @inject(CandController) private candController: CandController
  ){
    this.router = express.Router();
    this.initRoutes()
  }

  public async initRoutes(
  ){
    // Custom authorization for GET: allows superAdmin and instituteAdmin
    const requireSuperAdminOrInstituteAdmin = authorize(
      UserRole.SUPER_ADMIN,
      UserRole.INSTITUTE_ADMIN
    );

    // Get all candidates
    // Accessible to: superAdmin, instituteAdmin
    this.router.get(
      "/",
      userBasedRateLimiter,
      extractJWT,
      requireSuperAdminOrInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.candController.handleGetAllCands(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Get candidate by ID
    // Accessible to: superAdmin, instituteAdmin
    this.router.get(
      "/:id",
      userBasedRateLimiter,
      extractJWT,
      requireSuperAdminOrInstituteAdmin,
      getCandByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.candController.handleGetCandById(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Candidate not found" });
            }
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

    // Create candidates from external source
    this.router.post(
      "/createCandsFromExternal",
      userBasedStrictRateLimiter,
      extractJWT,
      requireSuperAdmin,
      createFromExternalValidator,
      async (req: Request, res: Response)=>{
        const result = validationResult(req);
        if(result.isEmpty()){
          try {
            const resp = await this.candController.handlePostCandFromExternal(req, res);
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            throw new Error(err);
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Reset candidate password
    this.router.patch(
      "/:id/resetPassword",
      userBasedStrictRateLimiter,
      extractJWT,
      requireSuperAdmin,
      resetCandidatePasswordValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.candController.handleResetCandidatePassword(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Delete candidate
    this.router.delete(
      "/:id",
      userBasedStrictRateLimiter,
      extractJWT,
      requireSuperAdmin,
      deleteCandValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.candController.handleDeleteCand(req, res);
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