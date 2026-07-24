import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { matchedData, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { PublicSearchController } from "./publicSearch.controller";
import {
  publicSearchSessionValidator,
  publicSearchVerifyValidator,
  publicSearchResendValidator,
  publicSearchQueryValidator,
  publicSearchExplainValidator,
} from "../validators/publicSearch.validator";
import { publicSearchRateLimiter, strictRateLimiter } from "../middleware/rateLimiter.middleware";
import { AppDataSource, initializeDatabase } from "../config/database.config";

/**
 * PUBLIC semantic-search tool (docs/PUBLIC_SEMANTIC_SEARCH_TOOL_PLAN.md).
 * No auth (no extractJWT). Soft-registration gate: email -> OTP -> a small per-email quota.
 *
 * ANTI-ORACLE: POST /session always answers the identical generic shape (a sessionId +
 * expiry) whether accepted or silently discarded (honeypot/timing/caps), so a bot cannot
 * enumerate emails. Only validator errors return 400 and the limiter returns 429.
 */
@injectable()
export class PublicSearchRouter {
  public router: Router;
  constructor(
    @inject(PublicSearchController) private controller: PublicSearchController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private async getDataSource(): Promise<DataSource | undefined> {
    try {
      if (!AppDataSource.isInitialized) await initializeDatabase();
      return AppDataSource;
    } catch (error) {
      console.error("[PublicSearchRouter] DataSource error:", error);
      return undefined;
    }
  }

  private initRoutes() {
    // 1) Request an access code (anti-oracle).
    this.router.post(
      "/session",
      publicSearchRateLimiter,
      publicSearchSessionValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        // Generic fallback keeps the shape identical if anything goes wrong (no oracle).
        const fallback = {
          sessionId: "00000000-0000-0000-0000-000000000000",
          expiresAt: new Date(Date.now() + 15 * 60 * 1000).toISOString(),
          email: String((req.body?.email ?? "")).trim().toLowerCase(),
        };
        try {
          const payload = matchedData(req, { locations: ["body"] }) as any;
          const ds = await this.getDataSource();
          if (!ds) return res.status(StatusCodes.OK).json(fallback);
          const resp = await this.controller.handleStartSession(
            payload,
            { ip: req.ip ?? "unknown", userAgent: req.headers["user-agent"] },
            ds
          );
          return res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          console.error("[PublicSearchRouter] session error:", err?.message ?? err);
          return res.status(StatusCodes.OK).json(fallback);
        }
      }
    );

    // 2) Verify the code.
    this.router.post(
      "/verify",
      strictRateLimiter,
      publicSearchVerifyValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        try {
          const { sessionId, code } = matchedData(req, { locations: ["body"] }) as any;
          const ds = await this.getDataSource();
          if (!ds) return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Unavailable" });
          const resp = await this.controller.handleVerify(sessionId, code, ds);
          return res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // 3) Resend the code.
    this.router.post(
      "/resend",
      strictRateLimiter,
      publicSearchResendValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        try {
          const { sessionId } = matchedData(req, { locations: ["body"] }) as any;
          const ds = await this.getDataSource();
          if (!ds) return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Unavailable" });
          const resp = await this.controller.handleResend(sessionId, ds);
          return res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // 4) Run a search (quota-checked).
    this.router.post(
      "/query",
      strictRateLimiter,
      publicSearchQueryValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        try {
          const { sessionId, query, type, deptCodes } = matchedData(req, { locations: ["body"] }) as any;
          const ds = await this.getDataSource();
          if (!ds) return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Unavailable" });
          const resp = await this.controller.handleQuery(sessionId, { query, type, deptCodes }, ds);
          return res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // 5) Opt-in AI explanation of a result (DB-fields-only).
    this.router.post(
      "/explain",
      strictRateLimiter,
      publicSearchExplainValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        try {
          const { sessionId, kind, name, description, code, departmentName, language } = matchedData(req, { locations: ["body"] }) as any;
          const ds = await this.getDataSource();
          if (!ds) return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Unavailable" });
          const resp = await this.controller.handleExplain(sessionId, { kind, name, description, code, departmentName, language }, ds);
          return res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );
  }
}
