import { inject, injectable } from "inversify";
import { validationResult } from "express-validator";
import { HospitalController } from "./hospital.controller";
import express, { Request, Response, NextFunction, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { createHospitalValidator } from "../validators/createHospital.validator";
import { deleteHospitalValidator } from "../validators/deleteHospital.validator";
import { getHospitalByIdValidator } from "../validators/getHospitalById.validator";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin, requireCandidate } from "../middleware/authorize.middleware";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

@injectable()
export class HospitalRouter {
  public router: Router;
  constructor(
    @inject(HospitalController) private hospitalController: HospitalController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }
  private initRoutes() {
    // Get all hospitals
    // Accessible to: superAdmin, instituteAdmin, supervisors, clerks, candidates
    this.router.get(
      "/",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      async (req: Request, res: Response) => {
        try {
          const hospitals = await this.hospitalController.handleGetAllHospitals(req, res);
          res.status(StatusCodes.OK).json(hospitals);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Get hospital by ID
    // Accessible to: superAdmin, instituteAdmin, supervisors, clerks, candidates
    this.router.get(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      getHospitalByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const hospital = await this.hospitalController.handleGetHospitalById(req, res);
            if (hospital) {
              res.status(StatusCodes.OK).json(hospital);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Hospital not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Create hospital
    // Accessible to: superAdmin only
    this.router.post(
      "/create",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdmin,
      createHospitalValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const newHospital = await this.hospitalController.handlePostHospital(
              req,
              res
            );
            res.status(StatusCodes.CREATED).json(newHospital);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Delete hospital
    // Accessible to: superAdmin only
    this.router.delete(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdmin,
      deleteHospitalValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.hospitalController.handleDeleteHospital(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            if (err.message.includes("not found")) {
              res.status(StatusCodes.NOT_FOUND).json({
                status: "error",
                statusCode: StatusCodes.NOT_FOUND,
                message: "Not Found",
                error: err.message
              });
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: "error",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: "Internal Server Error",
                error: err.message
              });
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
  }
}
