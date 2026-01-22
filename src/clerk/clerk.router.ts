import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { ClerkController } from "./clerk.controller";
import { createClerkValidator } from "../validators/createClerk.validator";
import { getClerkByIdValidator } from "../validators/getClerkById.validator";
import { updateClerkValidator } from "../validators/updateClerk.validator";
import { deleteClerkValidator } from "../validators/deleteClerk.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin, requireInstituteAdmin } from "../middleware/authorize.middleware";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";

@injectable()
export class ClerkRouter {
  public router: Router;
  constructor(
    @inject(ClerkController) private clerkController: ClerkController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public async initRoutes() {
    // Create clerk (super admins and institute admins can create)
    this.router.post(
      "/",
      userBasedStrictRateLimiter,
      extractJWT,
      authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN),
      createClerkValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.clerkController.handlePostClerk(req, res);
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Get all clerks (super admins and institute admins only)
    this.router.get(
      "/",
      userBasedRateLimiter,
      extractJWT,
      authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN),
      async (req: Request, res: Response) => {
        try {
          const resp = await this.clerkController.handleGetAllClerks(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Get clerk by ID (super admins and institute admins only)
    this.router.get(
      "/:id",
      userBasedRateLimiter,
      extractJWT,
      authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN),
      getClerkByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.clerkController.handleGetClerkById(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Clerk not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Update clerk (super admins and institute admins only)
    this.router.put(
      "/:id",
      userBasedStrictRateLimiter,
      extractJWT,
      authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN),
      updateClerkValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.clerkController.handleUpdateClerk(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Clerk not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Delete clerk (super admins and institute admins only)
    this.router.delete(
      "/:id",
      userBasedStrictRateLimiter,
      extractJWT,
      authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN),
      deleteClerkValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.clerkController.handleDeleteClerk(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json({ message: "Clerk deleted successfully" });
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Clerk not found" });
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
