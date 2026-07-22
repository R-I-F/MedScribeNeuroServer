import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { matchedData, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { DemoRequestController } from "./demoRequest.controller";
import { requestDemoValidator } from "../validators/requestDemo.validator";
import { demoRequestRateLimiter } from "../middleware/rateLimiter.middleware";
import { AppDataSource, initializeDatabase } from "../config/database.config";
import { IDemoRequestInput } from "./demoRequest.provider";

/**
 * Public landing-page "Book a demo" endpoint (docs/BOOK_A_DEMO_PLAN.md).
 *
 * ANTI-ORACLE RULE: whether the request was stored+emailed, stored without
 * email, or silently discarded (honeypot / timing / caps / internal error),
 * the response is the IDENTICAL generic 201 - bots learn nothing. Only
 * validator format errors return 400 and the rate limiter returns 429.
 */
const GENERIC_SUCCESS = { message: "Thanks! We'll be in touch soon." };

@injectable()
export class DemoRequestRouter {
  public router: Router;
  constructor(
    @inject(DemoRequestController) private demoRequestController: DemoRequestController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private async getDataSource(): Promise<DataSource | undefined> {
    try {
      if (!AppDataSource.isInitialized) {
        await initializeDatabase();
      }
      return AppDataSource;
    } catch (error) {
      console.error("[DemoRequestRouter] Error getting DataSource:", error);
      return undefined;
    }
  }

  private initRoutes() {
    this.router.post(
      "/",
      demoRequestRateLimiter,
      requestDemoValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
        try {
          const payload = matchedData(req, { locations: ["body"] }) as IDemoRequestInput;
          const ds = await this.getDataSource();
          if (ds) {
            await this.demoRequestController.handleSubmit(
              payload,
              {
                ip: req.ip ?? "unknown",
                userAgent: req.headers["user-agent"],
              },
              ds
            );
          } else {
            // DB unavailable: still no oracle - log and return the generic success.
            console.error("[DemoRequestRouter] DataSource unavailable; request dropped");
          }
        } catch (err: any) {
          // Provider never throws for business reasons; this is an unexpected error.
          console.error("[DemoRequestRouter] Unexpected error:", err?.message ?? err);
        }
        return res.status(StatusCodes.CREATED).json(GENERIC_SUCCESS);
      }
    );
  }
}
