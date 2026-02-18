import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

const NAMESPACE = "GlobalErrorHandler";

/**
 * Global Express error middleware (4-arg).
 * Catches errors passed to next(err) or that escape route try/catch.
 * Sends the same response shape as routes: res.status(...).json({ error: message })
 * so responseFormatter wraps it as { status, statusCode, message, error: { error: "..." } }.
 * Best practice: 404 (e.g. bots hitting unknown paths) logged at warn level; no stack or internal details in response.
 */
export function globalErrorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (res.headersSent) {
    return next(err);
  }

  const status =
    err?.status ?? err?.statusCode ?? StatusCodes.INTERNAL_SERVER_ERROR;
  const message = err?.message ?? "Internal Server Error";

  if (status === 404) {
    // Bots/scanners hit unknown paths; log briefly, no stack
    console.warn(`[${NAMESPACE}] 404 ${req.method} ${req.path}`);
  } else {
    console.error(`[${NAMESPACE}]`, err);
  }

  res.status(status).json({ error: message });
}

export default globalErrorHandler;
