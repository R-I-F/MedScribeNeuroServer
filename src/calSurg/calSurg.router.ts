import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { CalSurgController } from "./calSurg.controller";
import { createFromExternalValidator } from "../validators/createFromExternal.validator";
import { getCalSurgByIdValidator } from "../validators/getCalSurgById.validator";
import { getCalSurgWithFiltersValidator } from "../validators/getCalSurgWithFilters.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin } from "../middleware/authorize.middleware";

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
      extractJWT,
      requireSuperAdmin,
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

    this.router.get(
      "/getById",
      getCalSurgByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const calSurg = await this.calSurgController.handleGetCalSurgById(req, res);
            res.status(StatusCodes.OK).json(calSurg);
          } catch (err: any) {
            res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    this.router.get(
      "/getAll",
      getCalSurgWithFiltersValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const calSurgs = await this.calSurgController.handleGetAllCalSurg(req, res);
            res.status(StatusCodes.OK).json(calSurgs);
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
