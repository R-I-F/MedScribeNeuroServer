import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { CalSurgController } from "./calSurg.controller";
import { createFromExternalValidator } from "../validators/createFromExternal.validator";
import { getCalSurgByIdValidator } from "../validators/getCalSurgById.validator";
import { getCalSurgWithFiltersValidator } from "../validators/getCalSurgWithFilters.validator";
import { updateCalSurgValidator } from "../validators/updateCalSurg.validator";
import { deleteCalSurgValidator } from "../validators/deleteCalSurg.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin, requireCandidate, authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";

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

    // Create calSurg from external source
    this.router.post(
      "/postAllFromExternal",
      userBasedStrictRateLimiter,
      extractJWT,
      requireSuperAdmin,
      createFromExternalValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req)
        if(result.isEmpty()){
          try {
            const newCalSurgs = await this.calSurgController.handlePostCalSurgFromExternal(req, res);
            res.status(StatusCodes.CREATED).json(newCalSurgs);
          } catch (err: any) {
            throw new Error(err)
          }
        } else{
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Get calSurg by ID
    // Accessible to: superAdmin, instituteAdmin, clerk, supervisor, candidate
    this.router.get(
      "/getById",
      userBasedRateLimiter,
      extractJWT,
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

    // Get all calSurgs with optional filters
    // Accessible to: superAdmin, instituteAdmin, clerk, supervisor, candidate
    this.router.get(
      "/getAll",
      userBasedRateLimiter,
      extractJWT,
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
      userBasedStrictRateLimiter,
      extractJWT,
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
      userBasedStrictRateLimiter,
      extractJWT,
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
