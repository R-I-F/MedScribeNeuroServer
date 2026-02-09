import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { CalSurgController } from "./calSurg.controller";
import { createFromExternalValidator } from "../validators/createFromExternal.validator";
import { createCalSurgValidator } from "../validators/createCalSurg.validator";
import { getCalSurgByIdValidator } from "../validators/getCalSurgById.validator";
import { getCalSurgWithFiltersValidator } from "../validators/getCalSurgWithFilters.validator";
import { updateCalSurgValidator } from "../validators/updateCalSurg.validator";
import { deleteCalSurgValidator } from "../validators/deleteCalSurg.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireCandidate, authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import { userBasedRateLimiter, userBasedStrictRateLimiter, strictRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

@injectable()
export class CalSurgRouter {
  public router: Router;

  constructor(
    @inject(CalSurgController) private calSurgController: CalSurgController
  ) 
  {
    this.router = express.Router();
    this.initRoutes();
  }

  private async initRoutes() {
    // Custom authorization for DELETE: allows superAdmin, instituteAdmin, and clerk
    const requireSuperAdminOrInstituteAdminOrClerk = authorize(
      UserRole.SUPER_ADMIN,
      UserRole.INSTITUTE_ADMIN,
      UserRole.CLERK
    );

    // Dashboard: candidate, supervisor, clerk, instituteAdmin, superAdmin
    const requireDashboardRoles = authorize(
      UserRole.CANDIDATE,
      UserRole.SUPERVISOR,
      UserRole.CLERK,
      UserRole.INSTITUTE_ADMIN,
      UserRole.SUPER_ADMIN
    );

    // Create one calSurg (webapp); clerk, instituteAdmin, superAdmin
    this.router.post(
      "/",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdminOrInstituteAdminOrClerk,
      createCalSurgValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const newCalSurg = await this.calSurgController.handlePostCalSurg(req, res);
            res.status(StatusCodes.CREATED).json(newCalSurg);
          } catch (err: any) {
            throw new Error(err);
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // DISABLED: See docs/DISABLED_ROUTES.md. Create calSurg from external (no auth; X-Institution-Id).
    this.router.post(
      "/postAllFromExternal",
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

    // Get calSurg by ID
    // Accessible to: superAdmin, instituteAdmin, clerk, supervisor, candidate
    this.router.get(
      "/getById",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      getCalSurgByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const calSurg = await this.calSurgController.handleGetCalSurgById(req, res);
            res.status(StatusCodes.OK).json(calSurg);
          } catch (err: any) {
            res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Dashboard: calSurg within last 60 days, stripped of formLink and google_uid
    // Accessible to: candidate, supervisor, clerk, instituteAdmin, superAdmin
    this.router.get(
      "/dashboard",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireDashboardRoles,
      async (req: Request, res: Response) => {
        try {
          const calSurgs = await this.calSurgController.handleGetCalSurgDashboard(req, res);
          res.status(StatusCodes.OK).json(calSurgs);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Get all calSurgs with optional filters
    // Accessible to: superAdmin, instituteAdmin, clerk, supervisor, candidate
    this.router.get(
      "/getAll",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      getCalSurgWithFiltersValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const calSurgs = await this.calSurgController.handleGetAllCalSurg(req, res);
            res.status(StatusCodes.OK).json(calSurgs);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Update calSurg
    // Accessible to: superAdmin, instituteAdmin, clerk
    this.router.patch(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdminOrInstituteAdminOrClerk,
      updateCalSurgValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.calSurgController.handleUpdateCalSurg(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "CalSurg not found" });
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

    // Delete calSurg
    // Accessible to: superAdmin, instituteAdmin, clerk
    this.router.delete(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdminOrInstituteAdminOrClerk,
      deleteCalSurgValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.calSurgController.handleDeleteCalSurg(req, res);
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
