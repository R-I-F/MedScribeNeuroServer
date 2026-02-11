import express, { Request, Response, Router, NextFunction } from "express";
import { inject, injectable } from "inversify";
import jwt from "jsonwebtoken";
import { DataSource } from "typeorm";
import { AuthController } from "./auth.controller";
import { createCandValidator } from "../validators/createCand.validator";
import { matchedData, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { loginValidator } from "../validators/login.validator";
import { superAdminLoginValidator } from "../validators/superAdminLogin.validator";
import { instituteAdminLoginValidator } from "../validators/instituteAdminLogin.validator";
import { clerkLoginValidator } from "../validators/clerkLogin.validator";
import { changePasswordValidator } from "../validators/changePassword.validator";
import { forgotPasswordValidator } from "../validators/forgotPassword.validator";
import { resetPasswordValidator } from "../validators/resetPassword.validator";
import extractJWT from "../middleware/extractJWT";
import IAuth, { IRegisterCandPayload } from "./auth.interface";
import { setAuthCookies, clearAuthCookies } from "../utils/cookie.utils";
import { AuthTokenService } from "./authToken.service";
import { UserRole } from "../types/role.types";
import { PasswordResetController } from "../passwordReset/passwordReset.controller";
import { userBasedStrictRateLimiter, strictRateLimiter } from "../middleware/rateLimiter.middleware";
import { DataSourceManager } from "../config/datasource.manager";
import { getInstitutionById } from "../institution/institution.service";
import institutionResolver from "../middleware/institutionResolver.middleware";

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

  /**
   * Helper function to get DataSource for institution from request
   * Returns DataSource if institutionId is valid, undefined otherwise
   */
  private async getDataSourceFromRequest(req: Request): Promise<DataSource | undefined> {
    try {
      // Try to get institutionId from body, query, or header
      const institutionId = (req.body as any)?.institutionId || 
                           req.query.institutionId as string || 
                           req.get("X-Institution-Id");

      if (!institutionId) {
        return undefined;
      }

      // Validate institution
      const institution = await getInstitutionById(institutionId as string);
      if (!institution || !institution.isActive) {
        return undefined;
      }

      // Get DataSource
      const dataSourceManager = DataSourceManager.getInstance();
      return await dataSourceManager.getDataSource(institutionId as string);
    } catch (error) {
      console.error("[AuthRouter] Error getting DataSource:", error);
      return undefined;
    }
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
            
            // Get DataSource for institution if provided
            const dataSource = await this.getDataSourceFromRequest(req);
            
            const resp = await this.authController.registerCand(payload, dataSource);
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
    // Shared login endpoint for candidates and supervisors
    // Requires institutionId since each institution has its own candidates and supervisors
    this.router.post(
      "/login",
      loginValidator,
      async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if(result.isEmpty()){
          try {
            const payload = matchedData(req, {
              locations: ["body"],
            }) as IAuth;
            
            // Validate that institutionId is provided (required)
            if (!payload.institutionId) {
              return res.status(StatusCodes.BAD_REQUEST).json({
                error: "institutionId is required for login"
              });
            }
            
            // Get DataSource for institution (required)
            const dataSource = await this.getDataSourceFromRequest(req);
            if (!dataSource) {
              return res.status(StatusCodes.BAD_REQUEST).json({
                error: "Invalid or inactive institution. Please provide a valid institutionId."
              });
            }
            
            // Log login attempt
            console.log(`[AuthRouter] 🔐 LOGIN ATTEMPT - Email: ${payload.email}, InstitutionId: ${payload.institutionId}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, Timestamp: ${new Date().toISOString()}`);
            
            const resp = await (this.authController as any).candidateSupervisorLogin(payload, dataSource);
            
            // Log successful login with comprehensive user details
            console.log(`[AuthRouter] ✅ LOGIN SUCCESS - User: ${resp.user.fullName || "N/A"} (${payload.email}), Role: ${resp.role}, UserId: ${resp.user.id || resp.user._id}, InstitutionId: ${payload.institutionId || "none"}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, User-Agent: ${req.get("user-agent") || "unknown"}, Timestamp: ${new Date().toISOString()}`);
            
            // Set httpOnly cookies
            setAuthCookies(res, resp.token, resp.refreshToken);

            // Base response; add role-specific extra data
            const loginResponse: Record<string, unknown> = {
              user: resp.user,
              role: resp.role,
              token: resp.token,  // TEMPORARY: For testing token generation
            };
            if (resp.role === UserRole.CANDIDATE) {
              loginResponse.regDeg = resp.user.regDeg;
              loginResponse.rank = resp.user.rank;
            } else if (resp.role === UserRole.SUPERVISOR) {
              loginResponse.position = resp.user.position;
            }

            res.status(StatusCodes.OK).json(loginResponse);
          } catch(err: any){
            // Log failed login attempt with request details
            const email = (req.body as IAuth)?.email || "unknown";
            console.error(`[AuthRouter] ❌ LOGIN FAILED - Email: ${email}, Error: ${err.message}, InstitutionId: ${(req.body as IAuth)?.institutionId || "none"}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, User-Agent: ${req.get("user-agent") || "unknown"}, Timestamp: ${new Date().toISOString()}`);
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          }
        }
        else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
    // Super Admin login endpoint - isolated from other endpoints
    // Requires institutionId since each institution has its own super admins
    this.router.post(
      "/superAdmin/login",
      superAdminLoginValidator,
      async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if(result.isEmpty()){
          try {
            const payload = matchedData(req, {
              locations: ["body"],
            }) as IAuth;
            
            // Validate that institutionId is provided (required)
            if (!payload.institutionId) {
              return res.status(StatusCodes.BAD_REQUEST).json({
                error: "institutionId is required for super admin login"
              });
            }
            
            // Get DataSource for institution (required)
            const dataSource = await this.getDataSourceFromRequest(req);
            if (!dataSource) {
              return res.status(StatusCodes.BAD_REQUEST).json({
                error: "Invalid or inactive institution. Please provide a valid institutionId."
              });
            }
            
            const resp = await (this.authController as any).superAdminLogin(payload, dataSource);
            
            // Log successful login with comprehensive user details
            console.log(`[AuthRouter] ✅ LOGIN SUCCESS - Super Admin: ${resp.user.fullName || "N/A"} (${payload.email}), Role: ${resp.role}, UserId: ${resp.user.id || resp.user._id}, InstitutionId: ${payload.institutionId || "none"}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, User-Agent: ${req.get("user-agent") || "unknown"}, Timestamp: ${new Date().toISOString()}`);
            
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
            console.error(`[AuthRouter] ❌ LOGIN FAILED - Super Admin Email: ${email}, Error: ${err.message}, InstitutionId: ${(req.body as IAuth)?.institutionId || "none"}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, User-Agent: ${req.get("user-agent") || "unknown"}, Timestamp: ${new Date().toISOString()}`);
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          }
        }
        else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
    // Institute Admin login endpoint - isolated from other endpoints
    // Requires institutionId since each institution has its own institute admins
    this.router.post(
      "/instituteAdmin/login",
      instituteAdminLoginValidator,
      async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if(result.isEmpty()){
          try {
            const payload = matchedData(req, {
              locations: ["body"],
            }) as IAuth;
            
            // Validate that institutionId is provided (required)
            if (!payload.institutionId) {
              return res.status(StatusCodes.BAD_REQUEST).json({
                error: "institutionId is required for institute admin login"
              });
            }
            
            // Get DataSource for institution (required)
            const dataSource = await this.getDataSourceFromRequest(req);
            if (!dataSource) {
              return res.status(StatusCodes.BAD_REQUEST).json({
                error: "Invalid or inactive institution. Please provide a valid institutionId."
              });
            }
            
            const resp = await (this.authController as any).instituteAdminLogin(payload, dataSource);
            
            // Log successful login with comprehensive user details
            console.log(`[AuthRouter] ✅ LOGIN SUCCESS - Institute Admin: ${resp.user.fullName || "N/A"} (${payload.email}), Role: ${resp.role}, UserId: ${resp.user.id || resp.user._id}, InstitutionId: ${payload.institutionId || "none"}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, User-Agent: ${req.get("user-agent") || "unknown"}, Timestamp: ${new Date().toISOString()}`);
            
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
            console.error(`[AuthRouter] ❌ LOGIN FAILED - Institute Admin Email: ${email}, Error: ${err.message}, InstitutionId: ${(req.body as IAuth)?.institutionId || "none"}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, User-Agent: ${req.get("user-agent") || "unknown"}, Timestamp: ${new Date().toISOString()}`);
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          }
        }
        else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
    // Clerk login endpoint - separate from regular user login for security
    // Requires institutionId since each institution has its own clerks
    this.router.post(
      "/clerk/login",
      clerkLoginValidator,
      async (req: Request, res: Response, next: NextFunction) => {
        const result = validationResult(req);
        if(result.isEmpty()){
          try {
            const payload = matchedData(req, {
              locations: ["body"],
            }) as IAuth;
            
            // Validate that institutionId is provided (required for clerk login)
            if (!payload.institutionId) {
              return res.status(StatusCodes.BAD_REQUEST).json({
                error: "institutionId is required for clerk login"
              });
            }
            
            // Get DataSource for institution (required for clerk login)
            const dataSource = await this.getDataSourceFromRequest(req);
            if (!dataSource) {
              return res.status(StatusCodes.BAD_REQUEST).json({
                error: "Invalid or inactive institution. Please provide a valid institutionId."
              });
            }
            
            const resp = await (this.authController as any).clerkLogin(payload, dataSource);
            
            // Log successful login with comprehensive user details
            console.log(`[AuthRouter] ✅ LOGIN SUCCESS - Clerk: ${resp.user.fullName || "N/A"} (${payload.email}), Role: ${resp.role}, UserId: ${resp.user.id || resp.user._id}, InstitutionId: ${payload.institutionId || "none"}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, User-Agent: ${req.get("user-agent") || "unknown"}, Timestamp: ${new Date().toISOString()}`);
            
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
            console.error(`[AuthRouter] ❌ LOGIN FAILED - Clerk Email: ${email}, Error: ${err.message}, InstitutionId: ${(req.body as IAuth)?.institutionId || "none"}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, User-Agent: ${req.get("user-agent") || "unknown"}, Timestamp: ${new Date().toISOString()}`);
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          }
        }
        else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
    // DISABLED: See docs/DISABLED_ROUTES.md. To re-enable, restore the handler below.
    this.router.post(
      "/resetCandPass",
      institutionResolver,
      strictRateLimiter,
      async (req: Request, res: Response) => {
        return res.status(StatusCodes.GONE).json({
          error: "This endpoint is disabled.",
          code: "ENDPOINT_DISABLED",
          reference: "docs/DISABLED_ROUTES.md",
        });
        // try {
        //   const resp = await (this.authController as any).resetCandidatePasswords(req, res);
        //   res.status(StatusCodes.OK).json(resp);
        // } catch (err: any) {
        //   res
        //     .status(StatusCodes.INTERNAL_SERVER_ERROR)
        //     .json({ error: err?.message ?? "Failed to reset candidate passwords" });
        // }
      }
    );
    // DISABLED: See docs/DISABLED_ROUTES.md. To re-enable, restore the handler below.
    this.router.get(
      "/get/all",
      async (req: Request, res: Response, next: NextFunction) => {
        return res.status(StatusCodes.GONE).json({
          error: "This endpoint is disabled.",
          code: "ENDPOINT_DISABLED",
          reference: "docs/DISABLED_ROUTES.md",
        });
        // return this.authController.getAllUsers();
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
      institutionResolver,
      userBasedStrictRateLimiter,
      async (req: Request, res: Response) => {
        try {
          const response = await this.passwordResetController.handleRequestPasswordChangeEmail(req, res);
          res.status(StatusCodes.OK).json(response);
        } catch (err: any) {
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({
              status: "error",
              statusCode: StatusCodes.UNAUTHORIZED,
              message: "Unauthorized",
              error: err.message
            });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              status: "error",
              statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
              message: "Internal Server Error",
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
      institutionResolver,
      userBasedStrictRateLimiter,
      changePasswordValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const response = await this.passwordResetController.handleChangePassword(req, res);
            res.status(StatusCodes.OK).json(response);
          } catch (err: any) {
            if (err.message.includes("Unauthorized")) {
              res.status(StatusCodes.UNAUTHORIZED).json({
                status: "error",
                statusCode: StatusCodes.UNAUTHORIZED,
                message: "Unauthorized",
                error: err.message
              });
            } else if (err.message.includes("incorrect") || err.message.includes("different") || err.message.includes("Token does not belong")) {
              res.status(StatusCodes.BAD_REQUEST).json({
                status: "error",
                statusCode: StatusCodes.BAD_REQUEST,
                message: "Bad Request",
                error: err.message
              });
            } else if (err.message.includes("Invalid") || err.message.includes("expired") || err.message.includes("already been used")) {
              res.status(StatusCodes.BAD_REQUEST).json({
                status: "error",
                statusCode: StatusCodes.BAD_REQUEST,
                message: "Bad Request",
                error: err.message
              });
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
                status: "error",
                statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
                message: "Internal Server Error",
                error: err?.message ?? "Failed to change password"
              });
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json({
            status: "error",
            statusCode: StatusCodes.BAD_REQUEST,
            message: "Bad Request",
            error: result.array()
          });
        }
      }
    );

    // Forgot password (no auth, rate limited). Requires institutionId or X-Institution-Id for multi-tenancy.
    this.router.post(
      "/forgotPassword",
      strictRateLimiter,
      institutionResolver,
      forgotPasswordValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
        try {
          const response = await this.passwordResetController.handleForgotPassword(req, res);
          return res.status(StatusCodes.OK).json(response);
        } catch (err: any) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: err?.message ?? "Failed to process forgot password request",
          });
        }
      }
    );

    // Reset password (no auth, uses token from email). Requires institutionId or X-Institution-Id for multi-tenancy.
    this.router.post(
      "/resetPassword",
      strictRateLimiter,
      institutionResolver,
      resetPasswordValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
        try {
          const response = await this.passwordResetController.handleResetPassword(req, res);
          return res.status(StatusCodes.OK).json(response);
        } catch (err: any) {
          const msg = err?.message ?? "";
          if (
            msg.includes("Invalid") ||
            msg.includes("expired") ||
            msg.includes("already been used") ||
            msg.includes("Token")
          ) {
            return res.status(StatusCodes.BAD_REQUEST).json({
              error: msg,
            });
          }
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            error: err?.message ?? "Failed to reset password",
          });
        }
      }
    );
  }
}