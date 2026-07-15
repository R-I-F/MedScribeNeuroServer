import express, { Request, Response, Router } from "express";
import { ExternalController } from "./external.controller";
import { inject, injectable } from "inversify";
import { getSheetDataValidator } from "../validators/getSheetData.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";

@injectable()
export class ExternalRouter {
  public router: Router;
  constructor(
    @inject(ExternalController) private externalController: ExternalController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    // GET external sheet data (generic Google-sheet proxy: ?spreadsheetName=&sheetName=[&row=])
    this.router.get(
      "",
      getSheetDataValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          const data = await this.externalController.getSheetData(req, res);
          res.json(data);
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
  }
}
