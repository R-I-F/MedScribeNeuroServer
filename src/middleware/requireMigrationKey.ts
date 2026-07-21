import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";
import crypto from "crypto";

/**
 * Guards the operator-only data-migration endpoints (the "*FromExternal" bulk imports and
 * the Google-sheet read proxy). These are run by the maintainer's own scripts, not by the
 * app UI, so they are authenticated with a shared secret header instead of a user JWT.
 *
 * Fail-closed: if `MIGRATION_API_KEY` is unset the endpoints are disabled entirely (503),
 * so a forgotten config can never leave them open. The header is compared in constant time.
 */
export const requireMigrationKey = (req: Request, res: Response, next: NextFunction) => {
  const expected = process.env.MIGRATION_API_KEY;
  if (!expected) {
    return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
      error: "Migration endpoints are disabled (MIGRATION_API_KEY not configured).",
    });
  }

  const provided = req.header("X-Migration-Key") || "";
  const a = Buffer.from(provided, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(StatusCodes.UNAUTHORIZED).json({
      error: "Invalid or missing migration key.",
    });
  }

  return next();
};

export default requireMigrationKey;
