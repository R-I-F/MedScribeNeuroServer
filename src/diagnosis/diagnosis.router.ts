import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { DiagnosisController } from "./diagnosis.controller";
import { createBulkDiagnosisValidator } from "../validators/createBulkDiagnosis.validator";
import { createDiagnosisValidator } from "../validators/createDiagnosis.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin } from "../middleware/authorize.middleware";

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

    this.router.post(
      "/post",
      extractJWT,
      requireSuperAdmin,
      createDiagnosisValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const newDiagnosis = await this.diagnosisController.handlePostDiagnosis(req, res);
            res.status(StatusCodes.CREATED).json(newDiagnosis);
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
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.diagnosisController.handleDeleteDiagnosis(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          if (err.message.includes("not found")) {
            res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    );
  }
}
