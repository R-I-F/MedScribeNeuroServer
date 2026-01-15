import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { ConfController } from "./conf.controller";
import { createConfValidator } from "../validators/createConf.validator";
import { getConfByIdValidator } from "../validators/getConfById.validator";
import { updateConfValidator } from "../validators/updateConf.validator";
import { deleteConfValidator } from "../validators/deleteConf.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin, requireInstituteAdmin } from "../middleware/authorize.middleware";

@injectable()
export class ConfRouter {
  public router: Router;
  constructor(
    @inject(ConfController) private confController: ConfController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public async initRoutes() {
    // Create conf
    this.router.post(
      "/",
      extractJWT,
      requireSuperAdmin,
      createConfValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.confController.handlePostConf(req, res);
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Get all confs
    this.router.get(
      "/",
      extractJWT,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.confController.handleGetAllConfs(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Get conf by ID
    this.router.get(
      "/:id",
      extractJWT,
      requireSuperAdmin,
      getConfByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.confController.handleGetConfById(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Conf not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Update conf
    this.router.patch(
      "/:id",
      extractJWT,
      requireSuperAdmin,
      updateConfValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.confController.handleUpdateConf(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Conf not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Delete conf
    this.router.delete(
      "/:id",
      extractJWT,
      requireSuperAdmin,
      deleteConfValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.confController.handleDeleteConf(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json({ message: "Conf deleted successfully" });
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Conf not found" });
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

