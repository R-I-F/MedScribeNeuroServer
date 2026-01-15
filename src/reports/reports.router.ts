import { injectable, inject } from "inversify";
import express, { Router, Request, Response } from "express";
import { StatusCodes } from "http-status-codes";
import { ReportsController } from "./reports.controller";
import { extractJWT } from "../middleware/extractJWT";
import { requireInstituteAdmin } from "../middleware/authorize.middleware";
import { validationResult } from "express-validator";
import { getCanceledEventsPdfValidator } from "../validators/getCanceledEventsPdf.validator";

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
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
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
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else if (err.message.includes("Forbidden")) {
            res.status(StatusCodes.FORBIDDEN).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
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
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
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
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else if (err.message.includes("Forbidden")) {
            res.status(StatusCodes.FORBIDDEN).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
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
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
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
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else if (err.message.includes("Forbidden")) {
            res.status(StatusCodes.FORBIDDEN).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ 
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
      requireInstituteAdmin,
      getCanceledEventsPdfValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          return res.status(StatusCodes.BAD_REQUEST).json(result.array());
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
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else if (err.message.includes("Forbidden")) {
            res.status(StatusCodes.FORBIDDEN).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
              error: `Failed to generate PDF report: ${err.message || err}`,
            });
          }
        }
      }
    );
  }
}

