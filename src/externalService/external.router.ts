import express, { Request, Response, Router } from "express";
import { ExternalController } from "./external.controller";
import { inject, injectable } from "inversify";
import { getArabProcDataValidator } from "../validators/getArabProcData.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";

injectable();
export class ExternalRouter {
  public router: Router;
  constructor(
    @inject(ExternalController) private externalController: ExternalController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    //GET ArabProcList
    this.router.get(
      "",
      getArabProcDataValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          const data = await this.externalController.getArabProcData(req, res);
          res.json(data);
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
  }
}
