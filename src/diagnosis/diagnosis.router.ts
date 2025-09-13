import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { DiagnosisController } from "./diagnosis.controller";
import { createBulkDiagnosisValidator } from "../validators/createBulkDiagnosis.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";

injectable()
export class DiagnosisRouter {
  public router: Router;

  constructor(
    @inject(DiagnosisController) private diagnosisController: DiagnosisController
  ) 
  {
    this.router = express.Router();
    this.initRoutes();
  }

  private async initRoutes() {
    this.router.post(
      "/postBulk",
      createBulkDiagnosisValidator,
      async (req: Request, res: Response) => {
        console.log("req.body", req.body);
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const newDiagnoses = await this.diagnosisController.handlePostBulkDiagnosis(req, res);
            res.status(StatusCodes.CREATED).json(newDiagnoses);
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
