import express, { Request, Response, Router } from "express";
import { ArabProcController } from "./arabProc.controller";
import { inject, injectable } from "inversify";
import { StatusCodes } from "http-status-codes";
import { createArabProcValidator } from "../validators/createArabProc.validators";
import { validationResult } from "express-validator";
import { createFromExternalValidator } from "../validators/createFromExternal.validator";
import { deleteArabProcValidator } from "../validators/deleteArabProc.validator";
import { updateArabProcValidator } from "../validators/updateArabProc.validator";
import { getArabProcByIdValidator } from "../validators/getArabProcById.validator";
import extractJWT from "../middleware/extractJWT";
import { authorize } from "../middleware/authorize.middleware";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";
import { UserRole } from "../types/role.types";
import institutionResolver from "../middleware/institutionResolver.middleware";

@injectable()
export class ArabProcRouter {
  public router: Router;
  constructor(
    @inject(ArabProcController) private arabProcController: ArabProcController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    // All CRUD: Super Admin, Institute Admin, Clerk
    const requireSuperAdminOrInstituteAdminOrClerk = authorize(
      UserRole.SUPER_ADMIN,
      UserRole.INSTITUTE_ADMIN,
      UserRole.CLERK
    );

    this.router.get(
      "/getAllArabProcs",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdminOrInstituteAdminOrClerk,
      async (req: Request, res: Response) => {
        try {
          const allArabProcs =
            await this.arabProcController.handleGetAllArabProcs(req, res);
          res.status(StatusCodes.OK).json(allArabProcs);
        } catch (err: any) {
          throw new Error(err);
        }
      }
    );

    this.router.get(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSuperAdminOrInstituteAdminOrClerk,
      getArabProcByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const arabProc = await this.arabProcController.handleGetArabProcById(req, res);
            if (arabProc) {
              res.status(StatusCodes.OK).json(arabProc);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "ArabProc not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    this.router.post(
      "/createArabProc",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdminOrInstituteAdminOrClerk,
      createArabProcValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const newArabProc =
              await this.arabProcController.handlePostArabProc(req, res);
            res.status(StatusCodes.CREATED).json(newArabProc);
          } catch (err: any) {
            throw new Error(err);
          }
        } else res.status(StatusCodes.BAD_REQUEST).json(result.array());
      }
    );

    this.router.post(
      "/createArabProcFromExternal",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdminOrInstituteAdminOrClerk,
      createFromExternalValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp =
              await this.arabProcController.handlePostArabProcFromExternal(
                req,
                res
              );
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            throw new Error(err);
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    this.router.put(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdminOrInstituteAdminOrClerk,
      updateArabProcValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const updated = await this.arabProcController.handlePutArabProc(req, res);
            if (updated) {
              res.status(StatusCodes.OK).json(updated);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "ArabProc not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    this.router.delete(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdminOrInstituteAdminOrClerk,
      deleteArabProcValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.arabProcController.handleDeleteArabProc(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            if (err.message.includes("not found")) {
              res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );
  }
}
