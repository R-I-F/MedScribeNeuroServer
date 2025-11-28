import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { SuperAdminController } from "./superAdmin.controller";
import { createSuperAdminValidator } from "../validators/createSuperAdmin.validator";
import { getSuperAdminByIdValidator } from "../validators/getSuperAdminById.validator";
import { updateSuperAdminValidator } from "../validators/updateSuperAdmin.validator";
import { deleteSuperAdminValidator } from "../validators/deleteSuperAdmin.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin } from "../middleware/authorize.middleware";

@injectable()
export class SuperAdminRouter {
  public router: Router;
  constructor(
    @inject(SuperAdminController) private superAdminController: SuperAdminController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public async initRoutes() {
    // Create super admin (only super admins can create other super admins)
    this.router.post(
      "/",
      extractJWT,
      requireSuperAdmin,
      createSuperAdminValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.superAdminController.handlePostSuperAdmin(req, res);
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Get all super admins (only super admins)
    this.router.get(
      "/",
      extractJWT,
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.superAdminController.handleGetAllSuperAdmins(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Get super admin by ID (only super admins)
    this.router.get(
      "/:id",
      extractJWT,
      requireSuperAdmin,
      getSuperAdminByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.superAdminController.handleGetSuperAdminById(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Super admin not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Update super admin (only super admins)
    this.router.put(
      "/:id",
      extractJWT,
      requireSuperAdmin,
      updateSuperAdminValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.superAdminController.handleUpdateSuperAdmin(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Super admin not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Delete super admin (only super admins)
    this.router.delete(
      "/:id",
      extractJWT,
      requireSuperAdmin,
      deleteSuperAdminValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.superAdminController.handleDeleteSuperAdmin(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json({ message: "Super admin deleted successfully" });
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Super admin not found" });
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

