import { injectable, inject } from "inversify";
import express, { Router, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ReportsController } from "./reports.controller";
import extractJWT from "../middleware/extractJWT";
import { requireInstituteAdmin } from "../middleware/authorize.middleware";
import { validationResult } from "express-validator";
import { getCanceledEventsPdfValidator } from "../validators/getCanceledEventsPdf.validator";
import { getSupervisorsSubmissionCountValidator } from "../validators/getSupervisorsSubmissionCount.validator";
import { getCandidatesSubmissionCountValidator } from "../validators/getCandidatesSubmissionCount.validator";
import { getHospitalAnalysisReportValidator } from "../validators/getHospitalAnalysisReport.validator";
import { userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

@injectable()
export class ReportsRouter {
  public router: Router;

  constructor(@inject(ReportsController) private reportsController: ReportsController) {
    this.router = express.Router();
    this.initRoutes();
  }

  private initRoutes() {
    // Supervisors Submission Count Report
    this.router.get(
      "/supervisors/submission-count",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireInstituteAdmin,
      getSupervisorsSubmissionCountValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            status: "error",
            statusCode: StatusCodes.BAD_REQUEST,
            message: "Bad Request",
            error: result.array()
          });
        }

        try {
          const pdfBuffer = await this.reportsController.handleGetSupervisorsSubmissionCountReport(req, res);
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const filename = `supervisors-submission-count-${timestamp}.pdf`;

          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
          res.status(StatusCodes.OK);
          res.send(pdfBuffer);
        } catch (err: any) {
          console.error("PDF Generation Error:", err);
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({
              status: "error",
              statusCode: StatusCodes.UNAUTHORIZED,
              message: "Unauthorized",
              error: err.message
            });
          } else if (err.message.includes("Forbidden")) {
            res.status(StatusCodes.FORBIDDEN).json({
              status: "error",
              statusCode: StatusCodes.FORBIDDEN,
              message: "Forbidden",
              error: err.message
            });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              status: "error",
              statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
              message: "Internal Server Error",
              error: `Failed to generate PDF report: ${err.message || err}`
            });
          }
        }
      }
    );

    // Candidates Submission Count Report
    this.router.get(
      "/candidates/submission-count",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireInstituteAdmin,
      getCandidatesSubmissionCountValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            status: "error",
            statusCode: StatusCodes.BAD_REQUEST,
            message: "Bad Request",
            error: result.array()
          });
        }

        try {
          const pdfBuffer = await this.reportsController.handleGetCandidatesSubmissionCountReport(req, res);
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const filename = `candidates-submission-count-${timestamp}.pdf`;

          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
          res.status(StatusCodes.OK);
          res.send(pdfBuffer);
        } catch (err: any) {
          console.error("PDF Generation Error:", err);
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({
              status: "error",
              statusCode: StatusCodes.UNAUTHORIZED,
              message: "Unauthorized",
              error: err.message
            });
          } else if (err.message.includes("Forbidden")) {
            res.status(StatusCodes.FORBIDDEN).json({
              status: "error",
              statusCode: StatusCodes.FORBIDDEN,
              message: "Forbidden",
              error: err.message
            });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              status: "error",
              statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
              message: "Internal Server Error",
              error: `Failed to generate PDF report: ${err.message || err}`
            });
          }
        }
      }
    );

    // Calendar Procedures Hospital Analysis Report
    this.router.get(
      "/calendar-procedures/hospital-analysis",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireInstituteAdmin,
      getHospitalAnalysisReportValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            status: "error",
            statusCode: StatusCodes.BAD_REQUEST,
            message: "Bad Request",
            error: result.array()
          });
        }

        try {
          const pdfBuffer = await this.reportsController.handleGetHospitalAnalysisReport(req, res);
          
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const filename = `calendar-procedures-hospital-analysis-${timestamp}.pdf`;

          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
          res.status(StatusCodes.OK);
          res.send(pdfBuffer);
        } catch (err: any) {
          console.error("PDF Generation Error:", err);
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({
              status: "error",
              statusCode: StatusCodes.UNAUTHORIZED,
              message: "Unauthorized",
              error: err.message
            });
          } else if (err.message.includes("Forbidden")) {
            res.status(StatusCodes.FORBIDDEN).json({
              status: "error",
              statusCode: StatusCodes.FORBIDDEN,
              message: "Forbidden",
              error: err.message
            });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              status: "error",
              statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
              message: "Internal Server Error",
              error: `Failed to generate PDF report: ${err.message || err}`
            });
          }
        }
      }
    );

    // Canceled Events PDF Report
    this.router.get(
      "/events/canceled/pdf",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireInstituteAdmin,
      getCanceledEventsPdfValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json({
            status: "error",
            statusCode: StatusCodes.BAD_REQUEST,
            message: "Bad Request",
            error: result.array()
          });
        }

        try {
          const pdfBuffer = await this.reportsController.handleGetCanceledEventsReport(req, res);

          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const filename = `canceled-events-${timestamp}.pdf`;

          res.setHeader("Content-Type", "application/pdf");
          res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
          res.status(StatusCodes.OK);
          res.send(pdfBuffer);
        } catch (err: any) {
          console.error("PDF Generation Error:", err);
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({
              status: "error",
              statusCode: StatusCodes.UNAUTHORIZED,
              message: "Unauthorized",
              error: err.message
            });
          } else if (err.message.includes("Forbidden")) {
            res.status(StatusCodes.FORBIDDEN).json({
              status: "error",
              statusCode: StatusCodes.FORBIDDEN,
              message: "Forbidden",
              error: err.message
            });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              status: "error",
              statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
              message: "Internal Server Error",
              error: `Failed to generate PDF report: ${err.message || err}`
            });
          }
        }
      }
    );
  }
}

