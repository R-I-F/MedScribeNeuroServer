import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { SupervisorController } from "./supervisor.controller";
import { createSupervisorValidator } from "../validators/createSupervisor.validator";
import { getSupervisorByIdValidator } from "../validators/getSupervisorById.validator";
import { updateSupervisorValidator } from "../validators/updateSupervisor.validator";
import { updateSupervisorApprovedValidator } from "../validators/updateSupervisorApproved.validator";
import { deleteSupervisorValidator } from "../validators/deleteSupervisor.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin, requireSupervisor, requireCandidate, authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

@injectable()
export class SupervisorRouter {
  public router: Router;
  constructor(
    @inject(SupervisorController) private supervisorController: SupervisorController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public async initRoutes() {
    // Custom authorization for GET: allows superAdmin, instituteAdmin, supervisors, candidates
    const requireSuperAdminOrInstituteAdminOrSupervisorOrCandidate = requireCandidate; // Hierarchical: allows all roles

    // Custom authorization for PUT: allows superAdmin, instituteAdmin, supervisor
    const requireSuperAdminOrInstituteAdminOrSupervisor = authorize(
      UserRole.SUPER_ADMIN,
      UserRole.INSTITUTE_ADMIN,
      UserRole.SUPERVISOR
    );

    // PUT /:id/approved: only superAdmin, instituteAdmin (institution-scoped via dataSource)
    const requireSuperAdminOrInstituteAdmin = authorize(
      UserRole.SUPER_ADMIN,
      UserRole.INSTITUTE_ADMIN
    );

    // Create supervisor
    // Accessible to: superAdmin only
    this.router.post(
      "/",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdmin,
      createSupervisorValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.supervisorController.handlePostSupervisor(req, res);
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Get all supervisors
    // Accessible to: superAdmin, instituteAdmin, supervisors, candidates
    this.router.get(
      "/",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdminOrInstituteAdminOrSupervisorOrCandidate,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.supervisorController.handleGetAllSupervisors(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Get supervised candidates (requires supervisor authentication)
    // IMPORTANT: This route must come before /:id to avoid route conflicts
    // Accessible to: supervisors (and higher roles)
    this.router.get(
      "/candidates",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSupervisor,
      async (req: Request, res: Response) => {
        try {
          const candidates = await this.supervisorController.handleGetSupervisedCandidates(req, res);
          res.status(StatusCodes.OK).json(candidates);
        } catch (err: any) {
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    );

    // Get supervisor by ID
    // Accessible to: superAdmin, instituteAdmin, supervisors, candidates
    this.router.get(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdminOrInstituteAdminOrSupervisorOrCandidate,
      getSupervisorByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.supervisorController.handleGetSupervisorById(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Supervisor not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Update supervisor approved status
    // Accessible to: superAdmin, instituteAdmin only. Institution-scoped (same institution as admin).
    this.router.put(
      "/:id/approved",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdminOrInstituteAdmin,
      updateSupervisorApprovedValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.supervisorController.handleUpdateSupervisorApproved(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Supervisor not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Update supervisor
    // Accessible to: superAdmin, instituteAdmin, supervisor
    this.router.put(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdminOrInstituteAdminOrSupervisor,
      updateSupervisorValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.supervisorController.handleUpdateSupervisor(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Supervisor not found" });
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

    // Delete supervisor
    // Accessible to: superAdmin only
    this.router.delete(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdmin,
      deleteSupervisorValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.supervisorController.handleDeleteSupervisor(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json({ message: "Supervisor deleted successfully" });
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Supervisor not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Reset all supervisor passwords
    // Accessible to: superAdmin only
    this.router.post(
      "/resetPasswords",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.supervisorController.handleResetAllSupervisorPasswords(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err?.message ?? "Failed to reset supervisor passwords" });
        }
      }
    );

  }
}
