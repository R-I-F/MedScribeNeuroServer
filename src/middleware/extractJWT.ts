import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import config from "../config/server.config";

const NAMESPACE = "Auth";

export const extractJWT = (req: Request, res: Response, next: NextFunction) => {
  console.log(NAMESPACE, "Validating Token");
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    res.locals.jwtError = "Unauthorized";
    return next();
  }

  const token = authHeader.startsWith("Bearer ")
    ? authHeader.split(" ")[1]
    : authHeader;

  try {
    const decoded = jwt.verify(token, config.server.token.secret, {
      issuer: config.server.token.issuer,
    });

    if (res.locals.jwtError) {
      delete res.locals.jwtError;
    }
    res.locals.jwt = decoded;
    return next();
  } catch (error: any) {
    res.locals.jwtError = error?.message ?? "Unauthorized";
    return next();
  }
};

export default extractJWT;