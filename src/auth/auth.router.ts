import express, { Request, Response, Router, NextFunction } from "express";
import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";
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
            
            // Log successful login with request details
            console.log(`[AuthRouter] User login successful - Email: ${payload.email}, Role: candidate, UserId: ${resp.user.id || resp.user._id}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, Method: ${req.method}, Path: ${req.path}, Timestamp: ${new Date().toISOString()}`);
            
            // Set httpOnly cookies
            setAuthCookies(res, resp.token, resp.refreshToken);
            
            // Return user, role, and token (token included for testing purposes only)
            res.status(StatusCodes.OK).json({
              user: resp.user,
              role: resp.role,
              token: resp.token  // TEMPORARY: For testing token generation
            });
          } catch(err: any){
            // Log failed login attempt with request details
            const email = (req.body as IAuth)?.email || "unknown";
            console.error(`[AuthRouter] User login failed - Email: ${email}, Role: candidate, Error: ${err.message}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, Method: ${req.method}, Path: ${req.path}, Timestamp: ${new Date().toISOString()}`);
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
            
            // Log successful login with request details
            console.log(`[AuthRouter] User login successful - Email: ${payload.email}, Role: supervisor, UserId: ${resp.user.id || resp.user._id}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, Method: ${req.method}, Path: ${req.path}, Timestamp: ${new Date().toISOString()}`);
            
            // Set httpOnly cookies
            setAuthCookies(res, resp.token, resp.refreshToken);
            
            // Return user, role, and token (token included for testing purposes only)
            res.status(StatusCodes.OK).json({
              user: resp.user,
              role: resp.role,
              token: resp.token  // TEMPORARY: For testing token generation
            });
          } catch(err: any){
            // Log failed login attempt with request details
            const email = (req.body as IAuth)?.email || "unknown";
            console.error(`[AuthRouter] User login failed - Email: ${email}, Role: supervisor, Error: ${err.message}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, Method: ${req.method}, Path: ${req.path}, Timestamp: ${new Date().toISOString()}`);
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
            
            // Log successful login with request details
            console.log(`[AuthRouter] User login successful - Email: ${payload.email}, Role: superAdmin, UserId: ${resp.user.id || resp.user._id}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, Method: ${req.method}, Path: ${req.path}, Timestamp: ${new Date().toISOString()}`);
            
            // Set httpOnly cookies
            setAuthCookies(res, resp.token, resp.refreshToken);
            
            // Return user, role, and token (token included for testing purposes only)
            res.status(StatusCodes.OK).json({
              user: resp.user,
              role: resp.role,
              token: resp.token  // TEMPORARY: For testing token generation
            });
          } catch(err: any){
            // Log failed login attempt with request details
            const email = (req.body as IAuth)?.email || "unknown";
            console.error(`[AuthRouter] User login failed - Email: ${email}, Role: superAdmin, Error: ${err.message}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, Method: ${req.method}, Path: ${req.path}, Timestamp: ${new Date().toISOString()}`);
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
            
            // Log successful login with request details
            console.log(`[AuthRouter] User login successful - Email: ${payload.email}, Role: instituteAdmin, UserId: ${resp.user.id || resp.user._id}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, Method: ${req.method}, Path: ${req.path}, Timestamp: ${new Date().toISOString()}`);
            
            // Set httpOnly cookies
            setAuthCookies(res, resp.token, resp.refreshToken);
            
            // Return user, role, and token (token included for testing purposes only)
            res.status(StatusCodes.OK).json({
              user: resp.user,
              role: resp.role,
              token: resp.token  // TEMPORARY: For testing token generation
            });
          } catch(err: any){
            // Log failed login attempt with request details
            const email = (req.body as IAuth)?.email || "unknown";
            console.error(`[AuthRouter] User login failed - Email: ${email}, Role: instituteAdmin, Error: ${err.message}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, Method: ${req.method}, Path: ${req.path}, Timestamp: ${new Date().toISOString()}`);
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
        const refreshToken = req.cookies?.refresh_token;
        
        try {
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
          
          // Log successful token refresh
          console.log(`[AuthRouter] Token refresh successful - Email: ${decoded.email || "unknown"}, Role: ${decoded.role || "unknown"}, UserId: ${decoded.id || decoded._id || "unknown"}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, Timestamp: ${new Date().toISOString()}`);
          
          return res.status(StatusCodes.OK).json({ 
            success: true 
          });
        } catch (err: any) {
          // If refresh token is expired, clear cookies
          if (err?.message?.includes("expired") || err?.message?.includes("jwt expired")) {
            clearAuthCookies(res);
            
            // Try to extract user info from expired refresh token for logging
            let userInfo = "unknown";
            if (refreshToken) {
              try {
                const decoded = jwt.decode(refreshToken) as any;
                if (decoded) {
                  userInfo = `Email: ${decoded.email || "unknown"}, Role: ${decoded.role || "unknown"}, UserId: ${decoded.id || decoded._id || "unknown"}`;
                }
              } catch (decodeError) {
                userInfo = "Token decode failed";
              }
            }
            
            // Log refresh token expiration
            console.log(`[AuthRouter] Refresh token expired - ${userInfo}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, Timestamp: ${new Date().toISOString()}`);
            
            return res.status(StatusCodes.UNAUTHORIZED).json({ 
              error: "Refresh token expired",
              code: "REFRESH_TOKEN_EXPIRED"
            });
          }
          
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