import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { CalSurgController } from "./calSurg.controller";
import { createFromExternalValidator } from "../validators/createArabProcFromExternal.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";

injectable()
export class CalSurgRouter {
  public router: Router;

  constructor(
    @inject(CalSurgController) private calSurgController: CalSurgController
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
            const newCalSurgs = await this.calSurgController.handlePostCalSurgFromExternal(req, res);
            res.status(StatusCodes.CREATED).json(newCalSurgs);
          } catch (err: any) {
            throw new Error(err)
          }
        } else{
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
  }
}
