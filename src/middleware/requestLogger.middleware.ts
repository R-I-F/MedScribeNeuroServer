import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";

/**
 * Logs each request: timestamp, method + path, identity (from JWT or anonymous), IP.
 * Uses jwt.decode only (no verify) so logging does not affect auth flow.
 */
export function requestLogger(req: Request, _res: Response, next: NextFunction): void {
  const at = new Date().toISOString();
  const path = (req.originalUrl || req.url || "").split("?")[0];
  const method = req.method;
  const ip = req.ip || req.socket?.remoteAddress || "unknown";

  let identity = "anonymous";
  const token = req.cookies?.auth_token || (req.headers.authorization?.startsWith("Bearer ")
    ? req.headers.authorization.split(" ")[1]
    : req.headers.authorization);
  if (token) {
    try {
      const decoded = jwt.decode(token) as { email?: string; role?: string } | null;
      if (decoded?.email) {
        identity = decoded.role ? `${decoded.email} (${decoded.role})` : decoded.email;
      }
    } catch {
      // leave identity as anonymous
    }
  }

  console.log(`[REQ] ${at} | ${method} ${path} | ${identity} | ${ip}`);
  next();
}
