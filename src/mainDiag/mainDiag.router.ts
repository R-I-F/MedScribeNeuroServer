import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { MainDiagController } from "./mainDiag.controller";
import { createMainDiagValidator } from "../validators/createMainDiag.validator";
import { getMainDiagByIdValidator } from "../validators/getMainDiagById.validator";
import { updateMainDiagValidator } from "../validators/updateMainDiag.validator";
import { deleteMainDiagValidator } from "../validators/deleteMainDiag.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin } from "../middleware/authorize.middleware";

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
    // Create mainDiag
    this.router.post(
      "/",
      extractJWT,
      requireSuperAdmin,
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
    this.router.get(
      "/",
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
    this.router.get(
      "/:id",
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

    // Update mainDiag
    this.router.put(
      "/:id",
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

    // Delete mainDiag
    this.router.delete(
      "/:id",
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