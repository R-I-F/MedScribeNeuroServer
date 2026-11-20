import { inject, injectable } from "inversify";
import express, { Request, Response, Router } from "express";
import { InstituteAdminController } from "./instituteAdmin.controller";
import { createInstituteAdminValidator } from "../validators/createInstituteAdmin.validator";
import { getInstituteAdminByIdValidator } from "../validators/getInstituteAdminById.validator";
import { updateInstituteAdminValidator } from "../validators/updateInstituteAdmin.validator";
import { deleteInstituteAdminValidator } from "../validators/deleteInstituteAdmin.validator";
import { getSupervisorSubmissionsValidator } from "../validators/getSupervisorSubmissions.validator";
import { getCandidateSubmissionsValidator } from "../validators/getCandidateSubmissions.validator";
import { getCandidateSubmissionByIdValidator } from "../validators/getCandidateSubmissionById.validator";
import { getSubmissionReportValidator } from "../validators/getSubmissionReport.validator";
import { getCalendarProceduresValidator } from "../validators/getCalendarProcedures.validator";
import { getHospitalAnalysisValidator } from "../validators/getHospitalAnalysis.validator";
import { getCandidateDashboardsValidator } from "../validators/getCandidateDashboards.validator";
import { getCandidateSummaryValidator } from "../validators/getCandidateSummary.validator";
import { getCandidateDashboardByIdValidator } from "../validators/getCandidateDashboardById.validator";
import { body, param, validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin, requireInstituteAdmin } from "../middleware/authorize.middleware";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";

@injectable()
export class InstituteAdminRouter {
  public router: Router;
  constructor(
    @inject(InstituteAdminController) private instituteAdminController: InstituteAdminController
  ) {
    this.router = express.Router();
    this.initRoutes();
  }

  public async initRoutes() {
    // Create institute admin (only super admins can create)
    this.router.post(
      "/",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdmin,
      createInstituteAdminValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handlePostInstituteAdmin(req, res);
            res.status(StatusCodes.CREATED).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Get all institute admins (only institute admins and super admins)
    this.router.get(
      "/",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.instituteAdminController.handleGetAllInstituteAdmins(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Dashboard endpoints - Get all supervisors (MUST be before /:id route)
    this.router.get(
      "/supervisors",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.instituteAdminController.handleGetAllSupervisors(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Dashboard endpoints - Generate PDF report for one supervisor
    this.router.get(
      "/supervisors/:supervisorId/report",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      getSupervisorSubmissionsValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            await this.instituteAdminController.handleGenerateSupervisorReportPdf(req, res);
          } catch (err: any) {
            if (err.message === "Invalid supervisor ID") {
              res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
            } else if (err.message === "Supervisor not found or does not belong to the requested institution") {
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

    // Dashboard endpoints - Download PDF of all supervisors (same style as candidate report)
    this.router.get(
      "/supervisors/report",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          await this.instituteAdminController.handleGenerateSupervisorsReportPdf(req, res);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Dashboard endpoints - Get supervisor submissions (MUST be before /:id route)
    this.router.get(
      "/supervisors/:supervisorId/submissions",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      getSupervisorSubmissionsValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleGetSupervisorSubmissions(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            if (err.message === "Supervisor not found") {
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

    // Dashboard endpoints - Get all candidates (MUST be before /:id route)
    this.router.get(
      "/candidates",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.instituteAdminController.handleGetAllCandidates(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // Dashboard endpoints - Get candidate summary list (lightweight, full list, optional search)
    this.router.get(
      "/candidates/summary",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      getCandidateSummaryValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleGetCandidateSummaryList(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Dashboard endpoints - Get candidate dashboards (paginated, MUST be before /:id route)
    this.router.get(
      "/candidates/dashboard",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      getCandidateDashboardsValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleGetCandidateDashboards(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Dashboard endpoints - Get full dashboard snapshot for one candidate (MUST be before /candidates/:candidateId/submissions)
    this.router.get(
      "/candidates/:candidateId/dashboard",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      getCandidateDashboardByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleGetCandidateDashboardByCandidateId(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            if (err.message === "Invalid candidate ID") {
              res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
            } else if (err.message === "Candidate not found or does not belong to the requested institution") {
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

    // Certificates issued for one candidate (Stage B)
    this.router.get(
      "/candidates/:candidateId/certificates",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      getCandidateDashboardByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
          return;
        }
        try {
          res.status(StatusCodes.OK).json(await this.instituteAdminController.handleListCandidateCertificates(req, res));
        } catch (err: any) {
          const msg = String(err?.message ?? err);
          if (msg.includes("not found")) res.status(StatusCodes.NOT_FOUND).json({ error: "Candidate not found" });
          else res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Could not list certificates" });
        }
      }
    );

    // Revoke a certificate: the public verify page then shows it as revoked.
    this.router.patch(
      "/certificates/:certificateId/revoke",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      param("certificateId").isUUID().withMessage("certificateId must be a valid UUID"),
      body("reason").isString().trim().isLength({ min: 3, max: 500 }).withMessage("reason must be 3 to 500 characters"),
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
          return;
        }
        try {
          res.status(StatusCodes.OK).json(await this.instituteAdminController.handleRevokeCertificate(req, res));
        } catch (err: any) {
          const msg = String(err?.message ?? err);
          if (msg.includes("already revoked")) res.status(StatusCodes.CONFLICT).json({ error: "Certificate already revoked" });
          else if (msg.includes("not found") || msg.includes("Invalid")) res.status(StatusCodes.NOT_FOUND).json({ error: "Certificate not found" });
          else res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Could not revoke the certificate" });
        }
      }
    );

    // Logbook Record PDF for one candidate (long landscape document, every entry)
    this.router.get(
      "/candidates/:candidateId/logbook-record",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      getCandidateDashboardByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (!result.isEmpty()) {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
          return;
        }
        try {
          await this.instituteAdminController.handleGenerateCandidateLogbookRecordPdf(req, res);
        } catch (err: any) {
          const msg = String(err?.message ?? err);
          if (msg.includes("Invalid candidate ID")) {
            res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid candidate ID" });
          } else if (msg.includes("Candidate not found")) {
            res.status(StatusCodes.NOT_FOUND).json({ error: "Candidate not found" });
          } else {
            console.error("[logbook-record]", msg);
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "Could not generate the logbook record" });
          }
        }
      }
    );

    // Dashboard endpoints - Generate PDF report for one candidate
    this.router.get(
      "/candidates/:candidateId/report",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      getCandidateDashboardByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            await this.instituteAdminController.handleGenerateCandidateReportPdf(req, res);
          } catch (err: any) {
            if (err.message === "Invalid candidate ID") {
              res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
            } else if (err.message === "Candidate not found or does not belong to the requested institution") {
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

    // Dashboard endpoints - Get candidate submissions (MUST be before /:id route)
    this.router.get(
      "/candidates/:candidateId/submissions",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      getCandidateSubmissionsValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleGetCandidateSubmissions(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            if (err.message === "Invalid candidate ID") {
              res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Dashboard endpoints - Get candidate submission by ID (MUST be before /:id route)
    this.router.get(
      "/candidates/:candidateId/submissions/:submissionId",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      getCandidateSubmissionByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleGetCandidateSubmissionById(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ 
                error: "Submission not found or does not belong to the specified candidate" 
              });
            }
          } catch (err: any) {
            if (err.message.includes("not found") || err.message.includes("does not belong")) {
              res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
            } else if (err.message.includes("Invalid")) {
              res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Dashboard endpoints - Get calendar procedures with filters (MUST be before /:id route)
    this.router.get(
      "/calendarProcedures",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      getCalendarProceduresValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleGetCalendarProcedures(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Dashboard endpoints - Get hospital-based analysis (MUST be before /:id route)
    this.router.get(
      "/calendarProcedures/analysis/hospital",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      getHospitalAnalysisValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleGetHospitalAnalysis(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Dashboard endpoints - Get all hospitals (MUST be before /:id route)
    this.router.get(
      "/hospitals",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      async (req: Request, res: Response) => {
        try {
          const resp = await this.instituteAdminController.handleGetAllHospitals(req, res);
          res.status(StatusCodes.OK).json(resp);
        } catch (err: any) {
          res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
        }
      }
    );

    // NB: /arabicProcedures retired 2026-07-15 with arab_procs (procedures now = proc_cpts).

    // Submission case report PDF (institute admin only) — single submission by ID
    this.router.get(
      "/submissions/:submissionId/report",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireInstituteAdmin,
      getSubmissionReportValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            await this.instituteAdminController.handleGetSubmissionReportPdf(req, res);
          } catch (err: any) {
            if (err.message === "Invalid submission ID" || err.message === "Invalid submission ID format") {
              res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
            } else if (err.message === "Submission not found") {
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

    // Get institute admin by ID (only institute admins and super admins)
    // MUST be after all specific routes to avoid route conflicts
    this.router.get(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireInstituteAdmin,
      getInstituteAdminByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleGetInstituteAdminById(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Institute admin not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Update institute admin (only institute admins and super admins)
    this.router.put(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireInstituteAdmin,
      updateInstituteAdminValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleUpdateInstituteAdmin(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json(resp);
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Institute admin not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

    // Delete institute admin (only super admins)
    this.router.delete(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdmin,
      deleteInstituteAdminValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleDeleteInstituteAdmin(req, res);
            if (resp) {
              res.status(StatusCodes.OK).json({ message: "Institute admin deleted successfully" });
            } else {
              res.status(StatusCodes.NOT_FOUND).json({ error: "Institute admin not found" });
            }
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    );

  }
}

