import express, { Request, Response, Router, NextFunction } from "express";
import { inject, injectable } from "inversify";
import { AuthController } from "./auth.controller";
import { createCandValidator } from "../validators/createCand.validator";
import { matchedData, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { loginValidator } from "../validators/login.validator";
import extractJWT from "../middleware/extractJWT";
import IAuth, { IRegisterCandPayload } from "./auth.interface";
import { setAuthCookies, clearAuthCookies } from "../utils/cookie.utils";
import { AuthTokenService } from "./authToken.service";

@injectable()
export class AuthRouter {
  public router: Router;
  constructor(
    @inject(AuthController) private authController: AuthController,
    @inject(AuthTokenService) private authTokenService: AuthTokenService
  ){
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
            const resp = await this.authController.login({ ...payload, role: "candidate" as any });
            
            // Set httpOnly cookies
            setAuthCookies(res, resp.token, resp.refreshToken);
            
            // Return only user and role (not tokens)
            res.status(StatusCodes.OK).json({
              user: resp.user,
              role: resp.role
            });
          } catch(err: any){
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          }
        }
        else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
    this.router.post(
      "/loginSupervisor",
      loginValidator,
      async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if(result.isEmpty()){
          try {
            const payload = matchedData(req, {
              locations: ["body"],
            }) as IAuth;
            const resp = await this.authController.login({ ...payload, role: "supervisor" as any });
            
            // Set httpOnly cookies
            setAuthCookies(res, resp.token, resp.refreshToken);
            
            // Return only user and role (not tokens)
            res.status(StatusCodes.OK).json({
              user: resp.user,
              role: resp.role
            });
          } catch(err: any){
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          }
        }
        else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
    this.router.post(
      "/loginSuperAdmin",
      loginValidator,
      async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if(result.isEmpty()){
          try {
            const payload = matchedData(req, {
              locations: ["body"],
            }) as IAuth;
            const resp = await this.authController.login({ ...payload, role: "superAdmin" as any });
            
            // Set httpOnly cookies
            setAuthCookies(res, resp.token, resp.refreshToken);
            
            // Return only user and role (not tokens)
            res.status(StatusCodes.OK).json({
              user: resp.user,
              role: resp.role
            });
          } catch(err: any){
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          }
        }
        else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
    this.router.post(
      "/loginInstituteAdmin",
      loginValidator,
      async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if(result.isEmpty()){
          try {
            const payload = matchedData(req, {
              locations: ["body"],
            }) as IAuth;
            const resp = await this.authController.login({ ...payload, role: "instituteAdmin" as any });
            
            // Set httpOnly cookies
            setAuthCookies(res, resp.token, resp.refreshToken);
            
            // Return only user and role (not tokens)
            res.status(StatusCodes.OK).json({
              user: resp.user,
              role: resp.role
            });
          } catch(err: any){
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
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

    // Refresh token endpoint
    this.router.post(
      "/refresh",
      async (req: Request, res: Response) => {
        try {
          const refreshToken = req.cookies?.refresh_token;
          
          if (!refreshToken) {
            return res.status(StatusCodes.UNAUTHORIZED).json({ 
              error: "Refresh token not found" 
            });
          }

          // Verify refresh token
          const decoded = await this.authTokenService.verifyRefreshToken(refreshToken);
          
          // Generate new tokens
          const newTokens = await this.authController.refreshToken(decoded);
          
          // Set new cookies
          setAuthCookies(res, newTokens.token, newTokens.refreshToken);
          
          return res.status(StatusCodes.OK).json({ 
            success: true 
          });
        } catch (err: any) {
          return res.status(StatusCodes.UNAUTHORIZED).json({ 
            error: err?.message ?? "Invalid refresh token" 
          });
        }
      }
    );

    // Logout endpoint
    this.router.post(
      "/logout",
      async (req: Request, res: Response) => {
        try {
          // Clear cookies
          clearAuthCookies(res);
          
          return res.status(StatusCodes.OK).json({ 
            success: true,
            message: "Logged out successfully"
          });
        } catch (err: any) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
            error: err?.message ?? "Failed to logout" 
          });
        }
      }
    );
  }
}