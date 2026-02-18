import { Request, Response, NextFunction } from "express";
import { StatusCodes } from "http-status-codes";

const NAMESPACE = "GlobalErrorHandler";

/**
 * Global Express error middleware (4-arg).
 * Catches errors passed to next(err) or that escape route try/catch.
 * Sends the same response shape as routes: res.status(...).json({ error: message })
 * so responseFormatter wraps it as { status, statusCode, message, error: { error: "..." } }.
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

  console.error(`[${NAMESPACE}]`, err);

  res.status(status).json({ error: message });
}

export default globalErrorHandler;
