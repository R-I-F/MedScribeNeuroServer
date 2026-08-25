import express, { Request, Response, Router, NextFunction } from "express";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { matchedData, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { EliminatorController } from "./eliminator.controller";
import { eliminatorReserveValidator } from "../validators/eliminatorReserve.validator";
import { apiRateLimiter, eliminatorReserveRateLimiter } from "../middleware/rateLimiter.middleware";
import { AppDataSource, initializeDatabase } from "../config/database.config";
import { EliminatorConflictError, IEliminatorReserveInput } from "./eliminator.interface";

/**
 * Public, no-login lecture-eliminator booking surface. Reachable only by
 * knowing the campaign's (unguessable) UUID - by design there is no auth here,
 * see the campaign's own doc/plan for the accepted risk tradeoff.
 */
@injectable()
export class EliminatorRouter {
  public router: Router;
  constructor(@inject(EliminatorController) private eliminatorController: EliminatorController) {
    this.router = express.Router();
    this.initRoutes();
  }

  private async getDataSource(): Promise<DataSource> {
    if (!AppDataSource.isInitialized) {
      await initializeDatabase();
    }
    return AppDataSource;
  }

  private initRoutes() {
    // The pool (open lectures/dates/cap) changes with every submission and must never be served
    // stale from any cache layer - a stale read could show a supervisor a slot as open when it's
    // already full. (Lesson learned the hard way elsewhere in this codebase: a missing
    // Cache-Control on a similar read endpoint let Chrome serve a day-old body from disk.)
    this.router.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Cache-Control", "no-store");
      next();
    });

    // Open pool: topics/lectures (minus reserved) + dates (minus full).
    this.router.get("/:campaignId/state", apiRateLimiter, async (req: Request, res: Response) => {
      try {
        const ds = await this.getDataSource();
        const state = await this.eliminatorController.handleGetState(req.params.campaignId, ds);
        res.status(StatusCodes.OK).json(state);
      } catch (err: any) {
        this.handleError(err, res);
      }
    });

    // Searchable supervisor picker (id + name only).
    this.router.get("/:campaignId/supervisors", apiRateLimiter, async (req: Request, res: Response) => {
      try {
        const ds = await this.getDataSource();
        const supervisors = await this.eliminatorController.handleGetSupervisors(req.params.campaignId, ds);
        res.status(StatusCodes.OK).json(supervisors);
      } catch (err: any) {
        this.handleError(err, res);
      }
    });

    // A returning supervisor's existing reservations + remaining cap.
    this.router.get(
      "/:campaignId/supervisor/:supervisorId/status",
      apiRateLimiter,
      async (req: Request, res: Response) => {
        try {
          const ds = await this.getDataSource();
          const status = await this.eliminatorController.handleGetSupervisorStatus(
            req.params.campaignId,
            req.params.supervisorId,
            ds
          );
          res.status(StatusCodes.OK).json(status);
        } catch (err: any) {
          this.handleError(err, res);
        }
      }
    );

    // Confirm & save: creates the reservations + the matching NS calendar events.
    this.router.post(
      "/:campaignId/reservations",
      eliminatorReserveRateLimiter,
      eliminatorReserveValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
        try {
          const payload = matchedData(req, { locations: ["body"] }) as IEliminatorReserveInput;
          const ds = await this.getDataSource();
          const outcome = await this.eliminatorController.handleReserve(req.params.campaignId, payload, ds);
          res.status(StatusCodes.CREATED).json(outcome);
        } catch (err: any) {
          this.handleError(err, res);
        }
      }
    );
  }

  private handleError(err: any, res: Response) {
    if (err instanceof EliminatorConflictError) {
      const notFoundCodes = ["SUPERVISOR_NOT_FOUND", "LECTURE_NOT_FOUND", "SLOT_NOT_FOUND"];
      const status = notFoundCodes.includes(err.code) ? StatusCodes.NOT_FOUND : StatusCodes.CONFLICT;
      return res.status(status).json({
        error: err.message,
        code: err.code,
        lectureId: err.lectureId,
        slotId: err.slotId,
      });
    }
    if (err?.message === "Campaign not found") {
      return res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
    }
    console.error("[Eliminator] error:", err?.message ?? err);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err?.message ?? "Internal Server Error" });
  }
}
