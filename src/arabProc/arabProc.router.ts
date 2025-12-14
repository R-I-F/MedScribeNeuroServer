import express, { Request, Response, Router } from "express";
import { ArabProcController } from "./arabProc.controller";
import { inject, injectable } from "inversify";
import { StatusCodes } from "http-status-codes";
import { createArabProcValidator } from "../validators/createArabProc.validators";
import { validationResult } from "express-validator";
import { createFromExternalValidator } from "../validators/createFromExternal.validator";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin } from "../middleware/authorize.middleware";

@injectable()
export class ArabProcRouter {
  public router: Router;
  constructor(
    @inject(ArabProcController) private arabProcController: ArabProcController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    this.router.get("/getAllArabProcs", async (req: Request, res: Response) => {
      try {
        const allArabProcs =
          await this.arabProcController.handleGetAllArabProcs(req, res);
        res.status(StatusCodes.OK).json(allArabProcs);
      } catch (err: any) {
        throw new Error(err);
      }
    });
    this.router.post(
      "/createArabProc",
      extractJWT,
      requireSuperAdmin,
      createArabProcValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const newArabProc =
              await this.arabProcController.handlePostArabProc(req, res);
            res.status(StatusCodes.CREATED).json(newArabProc);
          } catch (err: any) {
            throw new Error(err);
          }
        } else res.status(StatusCodes.BAD_REQUEST).json(result.array());
      }
    );

    this.router.post(
      "/createArabProcFromExternal",
      extractJWT,
      requireSuperAdmin,
      createFromExternalValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp =
              await this.arabProcController.handlePostArabProcFromExternal(
                req,
                res
              );
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            throw new Error(err);
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
  }
}
