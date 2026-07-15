import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { query, param, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { ReferenceReadController } from "./referenceRead.controller";
import extractJWT from "../middleware/extractJWT";
import { requireCandidate, requireSuperAdmin, authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import { userBasedRateLimiter, apiRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";
import { getMainDiagByIdValidator } from "../validators/getMainDiagById.validator";
import { getLectureByIdValidator } from "../validators/getLectureById.validator";

/**
 * Read-only reference routes, mounted at the app root so they answer the ORIGINAL paths
 * (`/mainDiag`, `/diagnosis`, `/procCpt`, `/lecture`) with the ORIGINAL middleware chains and
 * role gates. List reads accept `?deptCode=XXX` (default REF_DEPT_CODE) — the mirror carries
 * all departments. Writes on these paths no longer exist → 404.
 */
@injectable()
export class ReferenceReadRouter {
  public router: Router;

  constructor(@inject(ReferenceReadController) private ctrl: ReferenceReadController) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    const requireSupervisorOrClerk = authorize(
      UserRole.SUPERVISOR,
      UserRole.CLERK,
      UserRole.INSTITUTE_ADMIN,
      UserRole.SUPER_ADMIN
    );

    const deptCodeQueryValidator = query("deptCode")
      .optional()
      .trim()
      .matches(/^[A-Za-z]{2,10}$/)
      .withMessage("deptCode must be 2-10 letters (e.g. NS, CTS, OBGYN)");

    const listHandler =
      (fn: (req: Request, res: Response) => Promise<unknown>) =>
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
        try {
          res.status(StatusCodes.OK).json(await fn(req, res));
        } catch (err: any) {
          const status = err?.status ?? StatusCodes.INTERNAL_SERVER_ERROR;
          res.status(status).json({ error: err.message });
        }
      };

    // GET /departments — public list of the mirrored departments (for signup/pickers),
    // same trust level as the public GET /institutions.
    this.router.get("/departments", apiRateLimiter, async (req: Request, res: Response) => {
      try {
        res.status(StatusCodes.OK).json(await this.ctrl.getDepartments(req, res));
      } catch (err: any) {
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
      }
    });

    // GET /mainDiag , /mainDiag/:id  — candidate and up
    this.router.get(
      "/mainDiag",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      deptCodeQueryValidator,
      listHandler((req, res) => this.ctrl.getAllMainDiags(req, res))
    );

    // GET /mainDiag/:mainDiagId/questions — dynamic additional questions (+ options) from the mirror
    this.router.get(
      "/mainDiag/:mainDiagId/questions",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      param("mainDiagId").isUUID().withMessage("mainDiagId must be a UUID"),
      listHandler((req, res) => this.ctrl.getQuestionsByMainDiag(req, res))
    );
    this.router.get(
      "/mainDiag/:id",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      getMainDiagByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
        try {
          const resp = await this.ctrl.getMainDiagById(req, res);
          if (resp) res.status(StatusCodes.OK).json(resp);
          else res.status(StatusCodes.NOT_FOUND).json({ error: "MainDiag not found" });
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // GET /diagnosis — superAdmin only (unchanged from legacy)
    this.router.get(
      "/diagnosis",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      deptCodeQueryValidator,
      listHandler((req, res) => this.ctrl.getAllDiagnoses(req, res))
    );

    // GET /procCpt — superAdmin (legacy) + instituteAdmin/clerk (calendar-form procedure
    // picker; replaced the retired GET /arabProc list, 2026-07-15).
    this.router.get(
      "/procCpt",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      authorize(UserRole.SUPER_ADMIN, UserRole.INSTITUTE_ADMIN, UserRole.CLERK),
      deptCodeQueryValidator,
      listHandler((req, res) => this.ctrl.getAllProcCpts(req, res))
    );

    // GET /lecture , /lecture/:id — supervisor/clerk/instituteAdmin/superAdmin
    this.router.get(
      "/lecture",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSupervisorOrClerk,
      deptCodeQueryValidator,
      listHandler((req, res) => this.ctrl.getAllLectures(req, res))
    );
    this.router.get(
      "/lecture/:id",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSupervisorOrClerk,
      getLectureByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
        try {
          const resp = await this.ctrl.getLectureById(req, res);
          if (resp) res.status(StatusCodes.OK).json(resp);
          else res.status(StatusCodes.NOT_FOUND).json({ error: "Lecture not found" });
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );
  }
}
