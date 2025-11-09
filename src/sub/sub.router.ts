import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { SubController } from "./sub.controller";
import { createFromExternalValidator } from "../validators/createFromExternal.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
@injectable()
export class SubRouter {

  public router: Router;

  constructor(
    @inject(SubController) private subController: SubController
  )
  {
    this.router = express.Router();
    this.initRoutes();
  }
  private async initRoutes(){
    this.router.post(
      "/postAllFromExternal",
      createFromExternalValidator,
      async (req: Request, res: Response) => {
        console.log("Router hit");
        const result = validationResult(req);
        if(result.isEmpty()){
          try{
            const newSubs = await this.subController.handlePostSubFromExternal(req, res);
            res.status(StatusCodes.CREATED).json(newSubs);
          }
          catch(err: any){ 
            throw new Error(err) 
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    )
    this.router.patch(
      "/updateStatusFromExternal",
      createFromExternalValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if(result.isEmpty()){
          try{
            const updatedSubs = await this.subController.handleUpdateStatusFromExternal(req, res);
            res.status(StatusCodes.OK).json(updatedSubs);
          }
          catch(err: any){
            throw new Error(err)
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    )
  }
}