import { Request, Response, NextFunction } from "express";
import jwt, { TokenExpiredError } from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import config from "../config/server.config";
import { clearAuthCookies } from "../utils/cookie.utils";

const NAMESPACE = "Auth";

export const extractJWT = (req: Request, res: Response, next: NextFunction) => {
  // Try to get token from cookie first (preferred method)
  let token = req.cookies?.auth_token;
  
  // Fallback to Authorization header (for backward compatibility)
  if (!token) {
    const authHeader = req.headers.authorization;
    if (authHeader) {
      token = authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : authHeader;
    }
  }

  if (!token) {
    res.locals.jwtError = "Unauthorized: No token provided";
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: "Unauthorized: No token provided"
    });
  }

  try {
    const decoded = jwt.verify(token, config.server.token.secret, {
      issuer: config.server.token.issuer,
    }) as any;

    if (res.locals.jwtError) {
      delete res.locals.jwtError;
    }
    res.locals.jwt = decoded;
    return next();
  } catch (error: any) {
    // Check if token is expired
    if (error instanceof TokenExpiredError || error?.name === "TokenExpiredError" || error?.message?.includes("expired")) {
      // Clear cookies when token is expired
      clearAuthCookies(res);
      
      // Try to extract user info from expired token for logging
      let userInfo = "unknown";
      try {
        const decoded = jwt.decode(token) as any;
        if (decoded) {
          userInfo = `Email: ${decoded.email || "unknown"}, Role: ${decoded.role || "unknown"}, UserId: ${decoded._id || "unknown"}`;
        }
      } catch (decodeError) {
        // If decode fails, just use token info
        userInfo = "Token decode failed";
      }
      
      // Log token expiration
      console.log(`[${NAMESPACE}] Token expired - ${userInfo}, IP: ${req.ip || req.socket.remoteAddress || "unknown"}, Path: ${req.path}, Timestamp: ${new Date().toISOString()}`);
      
      res.locals.jwtError = "Token expired";
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Token expired",
        code: "TOKEN_EXPIRED"
      });
    }
    
    res.locals.jwtError = error?.message ?? "Unauthorized";
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: error?.message ?? "Unauthorized: Invalid token"
    });
  }
};

export default extractJWT;