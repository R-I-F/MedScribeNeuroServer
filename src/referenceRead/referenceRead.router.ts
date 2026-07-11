import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import { ReferenceReadController } from "./referenceRead.controller";
import extractJWT from "../middleware/extractJWT";
import { requireCandidate, requireSuperAdmin, authorize } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import { userBasedRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";
import { getMainDiagByIdValidator } from "../validators/getMainDiagById.validator";
import { getLectureByIdValidator } from "../validators/getLectureById.validator";

/**
 * Read-only reference routes, mounted at the app root so they answer the ORIGINAL paths
 * (`/mainDiag`, `/diagnosis`, `/procCpt`, `/lecture`) with the ORIGINAL middleware chains and
 * role gates. Writes on these paths no longer exist → 404.
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

    // GET /mainDiag , /mainDiag/:id  — candidate and up
    this.router.get(
      "/mainDiag",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      async (req: Request, res: Response) => {
        try {
          res.status(StatusCodes.OK).json(await this.ctrl.getAllMainDiags(req, res));
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
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
      async (req: Request, res: Response) => {
        try {
          res.status(StatusCodes.OK).json(await this.ctrl.getAllDiagnoses(req, res));
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // GET /procCpt — superAdmin only (unchanged from legacy)
    this.router.get(
      "/procCpt",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdmin,
      async (req: Request, res: Response) => {
        try {
          res.status(StatusCodes.OK).json(await this.ctrl.getAllProcCpts(req, res));
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // GET /lecture , /lecture/:id — supervisor/clerk/instituteAdmin/superAdmin
    this.router.get(
      "/lecture",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSupervisorOrClerk,
      async (req: Request, res: Response) => {
        try {
          res.status(StatusCodes.OK).json(await this.ctrl.getAllLectures(req, res));
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
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
