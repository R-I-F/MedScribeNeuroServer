import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { ProcCptController } from "./procCpt.controller";
import { createFromExternalValidator } from "../validators/createFromExternal.validator";
import { upsertProcCptValidator } from "../validators/upsertProcCpt.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";

injectable()
export class ProcCptRouter {
  public router: Router;

  constructor(
    @inject(ProcCptController) private procCptController: ProcCptController
  ) 
  {
    this.router = express.Router();
    this.initRoutes();
  }

  private async initRoutes() {
    this.router.post(
      "/postAllFromExternal",
      createFromExternalValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req)
        if(result.isEmpty()){
          try {
            const newProcCpts = await this.procCptController.handlePostProcCptFromExternal(req, res);
            res.status(StatusCodes.CREATED).json(newProcCpts);
          } catch (err: any) {
            throw new Error(err)
          }
        } else{
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    this.router.post(
      "/upsert",
      upsertProcCptValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const procCpt = await this.procCptController.handleUpsertProcCpt(req, res);
            res.status(StatusCodes.OK).json(procCpt);
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
