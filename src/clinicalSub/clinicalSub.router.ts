import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { ClinicalSubController } from "./clinicalSub.controller";
import { createClinicalSubValidator } from "../validators/createClinicalSub.validator";
import { getClinicalSubByIdValidator } from "../validators/getClinicalSubById.validator";
import { updateClinicalSubValidator } from "../validators/updateClinicalSub.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

@injectable()
export class ClinicalSubRouter {
  public router: Router;

  constructor(
    @inject(ClinicalSubController) private clinicalSubController: ClinicalSubController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    const allowedRoles = [
      UserRole.CANDIDATE,
      UserRole.SUPERVISOR,
      UserRole.INSTITUTE_ADMIN,
      UserRole.SUPER_ADMIN,
    ];

    const supervisorAndAdminRoles = [
      UserRole.SUPERVISOR,
      UserRole.INSTITUTE_ADMIN,
      UserRole.SUPER_ADMIN,
    ];

    const candidateAndAdminRoles = [
      UserRole.CANDIDATE,
      UserRole.INSTITUTE_ADMIN,
      UserRole.SUPER_ADMIN,
    ];

    this.router.get(
      "/",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      authorize(...allowedRoles),
      async (req: Request, res: Response) => {
        try {
          const list = await this.clinicalSubController.handleGetAll(req, res);
          res.status(StatusCodes.OK).json(list);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    this.router.get(
      "/super",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      authorize(...supervisorAndAdminRoles),
      async (req: Request, res: Response) => {
        try {
          const list = await this.clinicalSubController.handleGetAssigned(req, res);
          res.status(StatusCodes.OK).json(list);
        } catch (err: any) {
          if (err.message?.includes("Unauthorized")) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          }
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    this.router.get(
      "/cand",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      authorize(...candidateAndAdminRoles),
      async (req: Request, res: Response) => {
        try {
          const list = await this.clinicalSubController.handleGetMine(req, res);
          res.status(StatusCodes.OK).json(list);
        } catch (err: any) {
          if (err.message?.includes("Unauthorized")) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          }
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    this.router.get(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      authorize(...allowedRoles),
      getClinicalSubByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
        try {
          const item = await this.clinicalSubController.handleGetById(req, res);
          if (item) {
            res.status(StatusCodes.OK).json(item);
          } else {
            res.status(StatusCodes.NOT_FOUND).json({ error: "Clinical sub not found" });
          }
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    this.router.post(
      "/",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      authorize(...allowedRoles),
      createClinicalSubValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
        try {
          const created = await this.clinicalSubController.handleCreate(req, res);
          res.status(StatusCodes.CREATED).json(created);
        } catch (err: any) {
          if (err.message?.includes("not found")) {
            res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    );

    this.router.put(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      authorize(...allowedRoles),
      updateClinicalSubValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
        try {
          const updated = await this.clinicalSubController.handleUpdate(req, res);
          if (updated) {
            res.status(StatusCodes.OK).json(updated);
          } else {
            res.status(StatusCodes.NOT_FOUND).json({ error: "Clinical sub not found" });
          }
        } catch (err: any) {
          if (err.message?.includes("not found")) {
            res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    );
  }
}
