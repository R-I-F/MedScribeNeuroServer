import express, { NextFunction, Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { matchedData, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { AiOfficeController } from "./aiOffice.controller";
import {
  aiOfficeAccessRequestsQueryValidator,
  aiOfficeActivityIdValidator,
  aiOfficeActivityValidator,
  aiOfficeAdminActivitiesQueryValidator,
  aiOfficeAdminUsersQueryValidator,
  aiOfficeSetMemberValidator,
  aiOfficeSignupValidator,
} from "../validators/aiOffice.validator";
import extractJWT from "../middleware/extractJWT";
import institutionResolver from "../middleware/institutionResolver.middleware";
import { requireCandidate, requireSuperAdmin } from "../middleware/authorize.middleware";
import {
  strictRateLimiter,
  userBasedRateLimiter,
  userBasedStrictRateLimiter,
} from "../middleware/rateLimiter.middleware";
import { AppDataSource, initializeDatabase } from "../config/database.config";
import {
  AiOfficeError,
  IAiOfficeActivityInput,
  IAiOfficeAdminActivitiesQuery,
  IAiOfficeAdminUsersQuery,
  IAiOfficeSignupInput,
  TAiOfficeErrorCode,
} from "./aiOffice.interface";
import { AiOfficeMemberRole } from "./aiOffice.types";

const ERROR_STATUS: Record<TAiOfficeErrorCode, number> = {
  NOT_AI_OFFICE_MEMBER: StatusCodes.FORBIDDEN,
  ACTIVITY_NOT_FOUND: StatusCodes.NOT_FOUND,
  USER_NOT_FOUND: StatusCodes.NOT_FOUND,
  INVALID_ACTIVITY: StatusCodes.BAD_REQUEST,
  UNKNOWN_DEPARTMENT: StatusCodes.BAD_REQUEST,
  DEPARTMENTLESS_MEMBER: StatusCodes.CONFLICT,
};

type Identity = { ds: DataSource; id: string; role: string };

/**
 * AI Office (docs/AI_OFFICE_PLAN.md).
 *
 * - `POST /signup` is public (the hidden AI Office signup link) and rate limited like the normal
 *   registration.
 * - Member routes identify the caller from the JWT only; no id is ever taken from the body or URL.
 *   `requireCandidate` is hierarchical (admits supervisors and admins), so membership itself is
 *   decided in the provider from the caller's DB row.
 * - `/admin/*` is super-admin only.
 */
@injectable()
export class AiOfficeRouter {
  public router: Router;

  constructor(@inject(AiOfficeController) private controller: AiOfficeController) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    // Membership, entries and statistics change with every write and with the super-admin's toggles.
    this.router.use((req: Request, res: Response, next: NextFunction) => {
      res.setHeader("Cache-Control", "no-store");
      next();
    });

    // ── public: hidden signup ──────────────────────────────────────────────

    this.router.post("/signup", strictRateLimiter, aiOfficeSignupValidator, async (req: Request, res: Response) => {
      const result = validationResult(req);
      if (!result.isEmpty()) {
        return res.status(StatusCodes.BAD_REQUEST).json(result.array());
      }
      try {
        const ds = await this.getPublicDataSource();
        if (!ds) {
          return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
            error: "Database connection unavailable. Please try again later.",
          });
        }
        const payload = matchedData(req, { locations: ["body"] }) as IAiOfficeSignupInput;
        const resp = await this.controller.handleSignup(
          payload,
          { ip: req.ip ?? "unknown", userAgent: req.headers["user-agent"] },
          ds
        );
        switch (resp.status) {
          case "started":
            return res.status(StatusCodes.CREATED).json({
              signupId: resp.signupId,
              expiresAt: resp.expiresAt,
              email: resp.email,
            });
          case "email_exists":
            return res.status(StatusCodes.CONFLICT).json({
              error:
                "An account with this email already exists. The platform admins have been notified and can add the AI Office role to it.",
              code: "EMAIL_EXISTS",
            });
          case "phone_exists":
            return res.status(StatusCodes.CONFLICT).json({
              error: "This phone number is already used by another account.",
              code: "PHONE_EXISTS",
            });
          case "signups_closed":
          default:
            return res.status(StatusCodes.FORBIDDEN).json({
              error: "Registrations are currently closed. Please check back later.",
              code: "SIGNUPS_CLOSED",
            });
        }
      } catch (err: any) {
        return this.handleError(err, res);
      }
    });

    // ── member ─────────────────────────────────────────────────────────────

    this.router.get("/me", extractJWT, institutionResolver, userBasedRateLimiter, requireCandidate, (req, res) =>
      this.withIdentity(req, res, StatusCodes.OK, ({ ds, id, role }) => this.controller.handleGetMe(id, role, ds))
    );

    this.router.get(
      "/activities/stats",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      (req, res) =>
        this.withIdentity(req, res, StatusCodes.OK, ({ ds, id, role }) => this.controller.handleGetMyStats(id, role, ds))
    );

    this.router.get("/activities", extractJWT, institutionResolver, userBasedRateLimiter, requireCandidate, (req, res) =>
      this.withIdentity(req, res, StatusCodes.OK, ({ ds, id, role }) =>
        this.controller.handleListMyActivities(id, role, ds)
      )
    );

    this.router.post(
      "/activities",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireCandidate,
      aiOfficeActivityValidator,
      (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        const input = matchedData(req, { locations: ["body"] }) as IAiOfficeActivityInput;
        return this.withIdentity(req, res, StatusCodes.CREATED, ({ ds, id, role }) =>
          this.controller.handleCreateActivity(id, role, input, ds)
        );
      }
    );

    this.router.patch(
      "/activities/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireCandidate,
      aiOfficeActivityIdValidator,
      aiOfficeActivityValidator,
      (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        const input = matchedData(req, { locations: ["body"] }) as IAiOfficeActivityInput;
        return this.withIdentity(req, res, StatusCodes.OK, ({ ds, id, role }) =>
          this.controller.handleUpdateActivity(id, role, req.params.id, input, ds)
        );
      }
    );

    // ── super-admin ────────────────────────────────────────────────────────

    this.router.get(
      "/admin/users",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      aiOfficeAdminUsersQueryValidator,
      (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        const q = matchedData(req, { locations: ["query"] }) as IAiOfficeAdminUsersQuery;
        return this.withIdentity(req, res, StatusCodes.OK, ({ ds }) => this.controller.handleListUsers(q, ds));
      }
    );

    this.router.patch(
      "/admin/users/:role/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdmin,
      aiOfficeSetMemberValidator,
      (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        const role = req.params.role as AiOfficeMemberRole;
        const value = req.body.aiOfficeMember === true;
        return this.withIdentity(req, res, StatusCodes.OK, ({ ds }) =>
          this.controller.handleSetAiOfficeMember(role, req.params.id, value, ds)
        );
      }
    );

    this.router.get(
      "/admin/activities",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      aiOfficeAdminActivitiesQueryValidator,
      (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        const q = matchedData(req, { locations: ["query"] }) as IAiOfficeAdminActivitiesQuery;
        return this.withIdentity(req, res, StatusCodes.OK, ({ ds }) => this.controller.handleListActivities(q, ds));
      }
    );

    this.router.get(
      "/admin/stats",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      aiOfficeAdminActivitiesQueryValidator,
      (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        const q = matchedData(req, { locations: ["query"] }) as IAiOfficeAdminActivitiesQuery;
        return this.withIdentity(req, res, StatusCodes.OK, ({ ds }) => this.controller.handleGetAdminStats(q, ds));
      }
    );

    this.router.get(
      "/admin/access-requests",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      aiOfficeAccessRequestsQueryValidator,
      (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        const q = matchedData(req, { locations: ["query"] }) as { page?: number; pageSize?: number };
        return this.withIdentity(req, res, StatusCodes.OK, ({ ds }) =>
          this.controller.handleListAccessRequests(q.page ?? 1, q.pageSize ?? 25, ds)
        );
      }
    );
  }

  /** Resolves the datasource and the JWT identity, runs `fn`, and maps its errors. */
  private async withIdentity(
    req: Request,
    res: Response,
    successStatus: number,
    fn: (identity: Identity) => Promise<unknown>
  ) {
    const ds = (req as any).institutionDataSource as DataSource | undefined;
    if (!ds) return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({ error: "Unavailable" });
    const jwt = ((res.locals as any).jwt ?? {}) as { id?: string; _id?: string; role?: string };
    const id = jwt.id || jwt._id;
    if (!id || !jwt.role) return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Unauthorized" });
    try {
      const body = await fn({ ds, id, role: jwt.role });
      return res.status(successStatus).json(body);
    } catch (err: any) {
      return this.handleError(err, res);
    }
  }

  private async getPublicDataSource(): Promise<DataSource | undefined> {
    try {
      if (!AppDataSource.isInitialized) {
        await initializeDatabase();
      }
      return AppDataSource;
    } catch (error) {
      console.error("[AiOfficeRouter] Error getting DataSource:", error);
      return undefined;
    }
  }

  private handleError(err: any, res: Response) {
    if (err instanceof AiOfficeError) {
      return res.status(ERROR_STATUS[err.code]).json({ error: err.message, code: err.code });
    }
    console.error("[AiOffice] error:", err?.message ?? err);
    return res
      .status(StatusCodes.INTERNAL_SERVER_ERROR)
      .json({ error: err?.message ?? "Internal Server Error" });
  }
}
