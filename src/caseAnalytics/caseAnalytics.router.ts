import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { StatusCodes } from "http-status-codes";
import { CaseAnalyticsController } from "./caseAnalytics.controller";
import extractJWT from "../middleware/extractJWT";
import { requireInstituteAdmin } from "../middleware/authorize.middleware";
import { userBasedRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

/**
 * Case Analytics router (docs/CASE_ANALYTICS_TOOL_PLAN.md).
 * Mounted at /caseAnalytics. Every route is institute-admin (superAdmin admitted hierarchically):
 *   extractJWT -> institutionResolver -> userBasedRateLimiter -> requireInstituteAdmin.
 *
 * Read-only throughout. The department is auto-locked in the controller from the admin's DB row.
 */
@injectable()
export class CaseAnalyticsRouter {
  public router: Router;

  constructor(@inject(CaseAnalyticsController) private controller: CaseAnalyticsController) {
    this.router = express.Router();
    this.initRoutes();
  }

  /**
   * A rejected filter is the caller's mistake, not a server fault, so it must not read as a 500.
   * Unknown ids and malformed dates come back as 400; an unknown deptCode as 404.
   */
  private static sendError(res: Response, err: any) {
    const msg = String(err?.message ?? "Request failed");
    if (/^Unknown deptCode/.test(msg)) {
      res.status(StatusCodes.NOT_FOUND).json({ error: msg });
      return;
    }
    if (
      /^Invalid |^Dates must|^from must|^Unknown age band|^gender must/.test(msg)
    ) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: msg });
      return;
    }
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: msg });
  }

  public initRoutes() {
    // GET /caseAnalytics/filters
    // Option lists for the filter panel, scoped to the caller's locked department.
    this.router.get(
      "/filters",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          res.status(StatusCodes.OK).json(await this.controller.handleGetFilters(req, res));
        } catch (err: any) {
          CaseAnalyticsRouter.sendError(res, err);
        }
      }
    );

    // GET /caseAnalytics/summary?from=&to=&hospitalId=&procCptId=&alphaCode=&mainDiagId=&ageBand=&gender=
    this.router.get(
      "/summary",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          res.status(StatusCodes.OK).json(await this.controller.handleGetSummary(req, res));
        } catch (err: any) {
          CaseAnalyticsRouter.sendError(res, err);
        }
      }
    );

    // GET /caseAnalytics/export.xlsx?...&lang=en|ar
    // Streams the workbook directly, so it is NOT wrapped by the global response formatter.
    this.router.get(
      "/export.xlsx",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          await this.controller.handleExportXlsx(req, res);
        } catch (err: any) {
          CaseAnalyticsRouter.sendError(res, err);
        }
      }
    );

    // GET /caseAnalytics/export.pdf?...&lang=en|ar
    this.router.get(
      "/export.pdf",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          await this.controller.handleExportPdf(req, res);
        } catch (err: any) {
          CaseAnalyticsRouter.sendError(res, err);
        }
      }
    );

    // GET /caseAnalytics/cases?...&page=&pageSize=
    this.router.get(
      "/cases",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          res.status(StatusCodes.OK).json(await this.controller.handleGetCases(req, res));
        } catch (err: any) {
          CaseAnalyticsRouter.sendError(res, err);
        }
      }
    );
  }
}
