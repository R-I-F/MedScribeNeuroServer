import express, { Request, Response, Router, NextFunction } from "express";
import { inject, injectable } from "inversify";
import { matchedData, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { JournalEliminatorController } from "./journalEliminator.controller";
import {
  journalOpenValidator,
  journalReserveValidator,
} from "../validators/journalReserve.validator";
import extractJWT from "../middleware/extractJWT";
import institutionResolver from "../middleware/institutionResolver.middleware";
import { requireCandidate, requireSuperAdmin } from "../middleware/authorize.middleware";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";
import {
  IJournalReserveInput,
  JournalEliminatorConflictError,
} from "./journalEliminator.interface";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Candidate journal-club booking (authenticated), plus the super-admin open/close
 * switch. Unlike the supervisor lecture eliminator this is NOT a public link: the
 * candidate is identified from their JWT, so nothing here takes a user id from the
 * request body or the URL.
 *
 * `requireCandidate` is hierarchical and admits supervisors and admins; the provider
 * narrows to an actual candidate row, since only a candidate can present a journal.
 */
@injectable()
export class JournalEliminatorRouter {
  public router: Router;

  constructor(
    @inject(JournalEliminatorController) private controller: JournalEliminatorController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    // The pool shrinks with every booking, so it must never be served from any cache.
    // (A missing Cache-Control on a similar read endpoint once let Chrome serve a
    // day-old body from disk for 24h.)
    this.router.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Cache-Control", "no-store");
      next();
    });

    // Whether the round is open, the candidate's own booking, and what is still free.
    this.router.get(
      "/state",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      async (req: Request, res: Response) => {
        try {
          const ds = (req as any).institutionDataSource;
          if (!ds) return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Unavailable" });
          const candidateId = this.getUserId(res);
          if (!candidateId) return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
          const state = await this.controller.handleGetState(candidateId, ds);
          return res.status(StatusCodes.OK).json(state);
        } catch (err: any) {
          return this.handleError(err, res);
        }
      }
    );

    // Confirm: claims the journal + the date and creates the real calendar event.
    this.router.post(
      "/reservation",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireCandidate,
      journalReserveValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
        try {
          const ds = (req as any).institutionDataSource;
          if (!ds) return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Unavailable" });
          const candidateId = this.getUserId(res);
          if (!candidateId) return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
          const payload = matchedData(req, { locations: ["body"] }) as IJournalReserveInput;
          const reservation = await this.controller.handleReserve(candidateId, payload, ds);
          return res.status(StatusCodes.CREATED).json(reservation);
        } catch (err: any) {
          return this.handleError(err, res);
        }
      }
    );

    // Super-admin: see every campaign's journal round and how full it is.
    this.router.get(
      "/admin/campaigns",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          const ds = (req as any).institutionDataSource;
          if (!ds) return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Unavailable" });
          const rows = await this.controller.handleListCampaigns(ds);
          return res.status(StatusCodes.OK).json(rows);
        } catch (err: any) {
          return this.handleError(err, res);
        }
      }
    );

    // Super-admin: open or close journal booking for everyone in that campaign.
    this.router.patch(
      "/admin/campaigns/:campaignId/open",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      journalOpenValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
        if (!UUID_RE.test(req.params.campaignId)) {
          return res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid campaignId" });
        }
        try {
          const ds = (req as any).institutionDataSource;
          if (!ds) return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Unavailable" });
          const { open } = matchedData(req, { locations: ["body"] }) as { open: boolean };
          const row = await this.controller.handleSetOpen(req.params.campaignId, open, ds);
          return res.status(StatusCodes.OK).json(row);
        } catch (err: any) {
          return this.handleError(err, res);
        }
      }
    );
  }

  private getUserId(res: Response): string | undefined {
    const jwt = (res.locals as any).jwt ?? {};
    return jwt.id || jwt._id;
  }

  private handleError(err: any, res: Response) {
    if (err instanceof JournalEliminatorConflictError) {
      if (err.code === "CANDIDATE_NOT_FOUND") {
        return res.status(StatusCodes.FORBIDDEN).json({ error: err.message, code: err.code });
      }
      const notFoundCodes = ["JOURNAL_NOT_FOUND", "SLOT_NOT_FOUND", "NO_CAMPAIGN"];
      const status = notFoundCodes.includes(err.code) ? StatusCodes.NOT_FOUND : StatusCodes.CONFLICT;
      return res.status(status).json({
        error: err.message,
        code: err.code,
        journalId: err.journalId,
        slotId: err.slotId,
      });
    }
    console.error("[JournalEliminator] error:", err?.message ?? err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: err?.message ?? "Internal Server Error" });
  }
}
