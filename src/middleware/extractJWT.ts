import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { StatusCodes } from "http-status-codes";
import config from "../config/server.config";

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
    res.locals.jwtError = error?.message ?? "Unauthorized";
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: error?.message ?? "Unauthorized: Invalid or expired token"
    });
  }
};

export default extractJWT;