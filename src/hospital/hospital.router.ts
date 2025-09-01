import { inject, injectable } from "inversify";
import { validationResult } from "express-validator";
import { HospitalController } from "./hospital.controller";
import express, { Request, Response, NextFunction, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { createHospitalValidator } from "../validators/createHospital.validator";

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
    // post hospital route
    this.router.post(
      "/create",
      createHospitalValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          const newHospital = await this.hospitalController.handlePostHospital(
            req,
            res
          );
          res.status(StatusCodes.CREATED).json(newHospital);
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
  }
}
