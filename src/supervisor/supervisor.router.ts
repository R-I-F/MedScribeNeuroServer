import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { SupervisorController } from "./supervisor.controller";
import { createSupervisorValidator } from "../validators/createSupervisor.validator";
import { getSupervisorByIdValidator } from "../validators/getSupervisorById.validator";
import { updateSupervisorValidator } from "../validators/updateSupervisor.validator";
import { deleteSupervisorValidator } from "../validators/deleteSupervisor.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin, requireSupervisor } from "../middleware/authorize.middleware";

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
    // Create supervisor
    this.router.post(
      "/",
      extractJWT,
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
    this.router.get(
      "/",
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
    this.router.get(
      "/candidates",
      extractJWT,
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
    this.router.get(
      "/:id",
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

    // Update supervisor
    this.router.put(
      "/:id",
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
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Delete supervisor
    this.router.delete(
      "/:id",
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
    this.router.post(
      "/resetPasswords",
      extractJWT,
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
