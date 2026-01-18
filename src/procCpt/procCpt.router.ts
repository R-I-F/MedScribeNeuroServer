import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { ProcCptController } from "./procCpt.controller";
import { createFromExternalValidator } from "../validators/createFromExternal.validator";
import { upsertProcCptValidator } from "../validators/upsertProcCpt.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin } from "../middleware/authorize.middleware";

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
      extractJWT,
      requireSuperAdmin,
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
      extractJWT,
      requireSuperAdmin,
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

    this.router.delete(
      "/:id",
      extractJWT,
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.procCptController.handleDeleteProcCpt(req, res);
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
