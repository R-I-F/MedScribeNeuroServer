import express, { Request, Response, Router, NextFunction } from "express";
import { inject, injectable } from "inversify";
import { AuthController } from "./auth.controller";
import { createCandValidator } from "../validators/createCand.validator";
import { matchedData, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { loginValidator } from "../validators/login.validator";
import { changePasswordValidator } from "../validators/changePassword.validator";
import { forgotPasswordValidator } from "../validators/forgotPassword.validator";
import { resetPasswordValidator } from "../validators/resetPassword.validator";
import extractJWT from "../middleware/extractJWT";
import IAuth, { IRegisterCandPayload } from "./auth.interface";
import { setAuthCookies, clearAuthCookies } from "../utils/cookie.utils";
import { AuthTokenService } from "./authToken.service";
import { PasswordResetController } from "../passwordReset/passwordReset.controller";

@injectable()
export class AuthRouter {
  public router: Router;
  constructor(
    @inject(AuthController) private authController: AuthController,
    @inject(AuthTokenService) private authTokenService: AuthTokenService,
    @inject(PasswordResetController) private passwordResetController: PasswordResetController
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

    // Request password change email endpoint (requires authentication)
    this.router.post(
      "/requestPasswordChangeEmail",
      extractJWT,
      async (req: Request, res: Response) => {
        try {
          const response = await this.passwordResetController.handleRequestPasswordChangeEmail(req, res);
          res.status(StatusCodes.OK).json(response);
        } catch (err: any) {
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
              error: err?.message ?? "Failed to send password change email" 
            });
          }
        }
      }
    );

    // Change password endpoint (requires authentication)
    this.router.patch(
      "/changePassword",
      extractJWT,
      changePasswordValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const response = await this.passwordResetController.handleChangePassword(req, res);
            res.status(StatusCodes.OK).json(response);
          } catch (err: any) {
            if (err.message.includes("Unauthorized")) {
              res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
            } else if (err.message.includes("incorrect") || err.message.includes("different") || err.message.includes("Token does not belong")) {
              res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
            } else if (err.message.includes("Invalid") || err.message.includes("expired") || err.message.includes("already been used")) {
              res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
                error: err?.message ?? "Failed to change password" 
              });
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Forgot password endpoint (no authentication required)
    this.router.post(
      "/forgotPassword",
      forgotPasswordValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const response = await this.passwordResetController.handleForgotPassword(req, res);
            res.status(StatusCodes.OK).json(response);
          } catch (err: any) {
            // Always return success to prevent email enumeration
            res.status(StatusCodes.OK).json({
              message: "If an account with that email exists, a password reset link has been sent"
            });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Reset password endpoint (no authentication required, uses token)
    this.router.post(
      "/resetPassword",
      resetPasswordValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const response = await this.passwordResetController.handleResetPassword(req, res);
            res.status(StatusCodes.OK).json(response);
          } catch (err: any) {
            if (err.message.includes("Invalid") || err.message.includes("expired") || err.message.includes("already been used")) {
              res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
                error: err?.message ?? "Failed to reset password" 
              });
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
  }
}