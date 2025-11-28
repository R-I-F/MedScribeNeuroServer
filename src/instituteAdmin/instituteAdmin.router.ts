import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { InstituteAdminController } from "./instituteAdmin.controller";
import { createInstituteAdminValidator } from "../validators/createInstituteAdmin.validator";
import { getInstituteAdminByIdValidator } from "../validators/getInstituteAdminById.validator";
import { updateInstituteAdminValidator } from "../validators/updateInstituteAdmin.validator";
import { deleteInstituteAdminValidator } from "../validators/deleteInstituteAdmin.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin, requireInstituteAdmin } from "../middleware/authorize.middleware";

@injectable()
export class InstituteAdminRouter {
  public router: Router;
  constructor(
    @inject(InstituteAdminController) private instituteAdminController: InstituteAdminController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public async initRoutes() {
    // Create institute admin (only super admins can create)
    this.router.post(
      "/",
      extractJWT,
      requireSuperAdmin,
      createInstituteAdminValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handlePostInstituteAdmin(req, res);
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Get all institute admins (only institute admins and super admins)
    this.router.get(
      "/",
      extractJWT,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.instituteAdminController.handleGetAllInstituteAdmins(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Get institute admin by ID (only institute admins and super admins)
    this.router.get(
      "/:id",
      extractJWT,
      requireInstituteAdmin,
      getInstituteAdminByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleGetInstituteAdminById(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Institute admin not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Update institute admin (only institute admins and super admins)
    this.router.put(
      "/:id",
      extractJWT,
      requireInstituteAdmin,
      updateInstituteAdminValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleUpdateInstituteAdmin(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Institute admin not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Delete institute admin (only institute admins and super admins)
    this.router.delete(
      "/:id",
      extractJWT,
      requireInstituteAdmin,
      deleteInstituteAdminValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleDeleteInstituteAdmin(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json({ message: "Institute admin deleted successfully" });
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Institute admin not found" });
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

