import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { CandController } from "./cand.controller";
import { createFromExternalValidator } from "../validators/createFromExternal.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";

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
    )
  }
}