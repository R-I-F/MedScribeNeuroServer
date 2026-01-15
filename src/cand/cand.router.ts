import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { CandController } from "./cand.controller";
import { createFromExternalValidator } from "../validators/createFromExternal.validator";
import { resetCandidatePasswordValidator } from "../validators/resetCandidatePassword.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin } from "../middleware/authorize.middleware";

injectable()
export class CandRouter{
  public router: Router;
  constructor(
    @inject(CandController) private candController: CandController
  ){
    this.router = express.Router();
    this.initRoutes()
  }

  public async initRoutes(
  ){
    this.router.post(
      "/createCandsFromExternal",
      extractJWT,
      requireSuperAdmin,
      createFromExternalValidator,
      async (req: Request, res: Response)=>{
        const result = validationResult(req);
        if(result.isEmpty()){
          try {
            const resp = await this.candController.handlePostCandFromExternal(req, res);
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            throw new Error(err);
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    this.router.patch(
      "/:id/resetPassword",
      extractJWT,
      requireSuperAdmin,
      resetCandidatePasswordValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.candController.handleResetCandidatePassword(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
  }
}