import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { PositionsController } from "./positions.controller";
import { getPositionByIdValidator } from "../validators/getPositionById.validator";
import { createPositionValidator } from "../validators/createPosition.validator";
import { updatePositionValidator } from "../validators/updatePosition.validator";
import { deletePositionValidator } from "../validators/deletePosition.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";
import { authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import institutionResolver from "../middleware/institutionResolver.middleware";

@injectable()
export class PositionsRouter {
  public router: Router;
  constructor(
    @inject(PositionsController) private positionsController: PositionsController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private requireSuperAdminOrInstituteAdmin = authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN);

  public async initRoutes() {
    this.router.get(
      "/",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.SUPERVISOR, UserRole.CANDIDATE),
      async (req: Request, res: Response) => {
        try {
          const resp = await this.positionsController.handleGetAll(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    this.router.get(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.SUPERVISOR, UserRole.CANDIDATE),
      getPositionByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.positionsController.handleGetById(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Position not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    this.router.post(
      "/",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      this.requireSuperAdminOrInstituteAdmin,
      createPositionValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.positionsController.handlePost(req, res);
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    this.router.put(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      this.requireSuperAdminOrInstituteAdmin,
      updatePositionValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.positionsController.handlePut(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Position not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    this.router.delete(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      this.requireSuperAdminOrInstituteAdmin,
      deletePositionValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.positionsController.handleDelete(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            if (err.message?.includes("not found")) {
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
