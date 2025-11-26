import express, { Request, Response, Router, NextFunction } from "express";
import { inject, injectable } from "inversify";
import { AuthController } from "./auth.controller";
import { createCandValidator } from "../validators/createCand.validator";
import { matchedData, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { loginValidator } from "../validators/login.validator";
import extractJWT from "../middleware/extractJWT";
import IAuth, { IRegisterCandPayload } from "./auth.interface";

@injectable()
export class AuthRouter {
  public router: Router;
  constructor(@inject(AuthController) private authController: AuthController){
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes(){
    
    this.router.get(
      "/validate",
      extractJWT,
      async (req: Request, res: Response) => {
        if (res.locals.jwtError) {
          return res
            .status(StatusCodes.UNAUTHORIZED)
            .json({ message: res.locals.jwtError });
        }

        const validation = this.authController.validationToken(res.locals.jwt);
        return res.status(StatusCodes.OK).json(validation);
      }
    );
    this.router.post(
      "/registerCand",
      createCandValidator,
      async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if(result.isEmpty()){
          try {
            const payload = matchedData(req, {
              locations: ["body"],
            }) as IRegisterCandPayload;
            const resp = await this.authController.registerCand(payload);
            res.status(StatusCodes.CREATED).json(resp);
          } catch(err: any){
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
        else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
    this.router.post(
      "/loginCand",
      loginValidator,
      async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if(result.isEmpty()){
          try {
            const payload = matchedData(req, {
              locations: ["body"],
            }) as IAuth;
            const resp = await this.authController.login(payload);
            res.status(StatusCodes.OK).json(resp);
          } catch(err: any){
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
        else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
    this.router.post(
      "/resetCandPass",
      async (req: Request, res: Response) => {
        try {
          const resp = await this.authController.resetCandidatePasswords();
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res
            .status(StatusCodes.INTERNAL_SERVER_ERROR)
            .json({ error: err?.message ?? "Failed to reset candidate passwords" });
        }
      }
    );
    this.router.get(
      "/get/all",
      async (req: Request, res: Response, next: NextFunction) => {
        return this.authController.getAllUsers();
      }
    );
  }
}