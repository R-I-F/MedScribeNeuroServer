import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { CandController } from "./cand.controller";
import { createFromExternalValidator } from "../validators/createFromExternal.validator";
import { resetCandidatePasswordValidator } from "../validators/resetCandidatePassword.validator";
import { getCandByIdValidator } from "../validators/getCandById.validator";
import { deleteCandValidator } from "../validators/deleteCand.validator";
import { updateCandValidator } from "../validators/updateCand.validator";
import { updateCandidateApprovedValidator } from "../validators/updateCandidateApproved.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin, requireInstituteAdmin, authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import { userBasedRateLimiter, userBasedStrictRateLimiter, strictRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

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
    // Custom authorization for GET: allows superAdmin, instituteAdmin, clerk, supervisor, candidate
    // Full data for superAdmin, instituteAdmin; censored data for clerk, supervisor, candidate
    const requireAnyAuthenticatedForGetCands = authorize(
      UserRole.SUPER_ADMIN,
      UserRole.INSTITUTE_ADMIN,
      UserRole.CLERK,
      UserRole.SUPERVISOR,
      UserRole.CANDIDATE
    );

    // PUT /:id: allows superAdmin, instituteAdmin, candidate (candidate can only edit self; admins full control)
    const requireSuperAdminOrInstituteAdminOrCandidate = authorize(
      UserRole.SUPER_ADMIN,
      UserRole.INSTITUTE_ADMIN,
      UserRole.CANDIDATE
    );

    // PUT /:id/approved: only superAdmin, instituteAdmin (institution-scoped via dataSource)
    const requireSuperAdminOrInstituteAdmin = authorize(
      UserRole.SUPER_ADMIN,
      UserRole.INSTITUTE_ADMIN
    );

    // Get all candidates
    // Accessible to: superAdmin, instituteAdmin (full); clerk, supervisor, candidate (censored)
    this.router.get(
      "/",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireAnyAuthenticatedForGetCands,
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
    // Accessible to: superAdmin, instituteAdmin (full); clerk, supervisor, candidate (censored)
    this.router.get(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireAnyAuthenticatedForGetCands,
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

    // Update candidate approved status
    // Accessible to: superAdmin, instituteAdmin only. Institution-scoped (same institution as admin).
    this.router.put(
      "/:id/approved",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdminOrInstituteAdmin,
      updateCandidateApprovedValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.candController.handleUpdateCandidateApproved(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Candidate not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Update candidate
    // Accessible to: superAdmin, instituteAdmin (full control); candidate (own profile only: regDeg, regNum, phoneNum)
    this.router.put(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdminOrInstituteAdminOrCandidate,
      updateCandValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.candController.handleUpdateCand(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Candidate not found" });
            }
          } catch (err: any) {
            if (err?.message?.includes("Forbidden:")) {
              res.status(StatusCodes.FORBIDDEN).json({ error: err.message });
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // DISABLED: See docs/DISABLED_ROUTES.md. Create candidates from external (no auth; X-Institution-Id).
    this.router.post(
      "/createCandsFromExternal",
      institutionResolver,
      strictRateLimiter,
      createFromExternalValidator,
      async (req: Request, res: Response) => {
        return res.status(StatusCodes.GONE).json({
          error: "This endpoint is disabled.",
          code: "ENDPOINT_DISABLED",
          reference: "docs/DISABLED_ROUTES.md",
        });
      }
    );

    // Reset candidate password
    this.router.patch(
      "/:id/resetPassword",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
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
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
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