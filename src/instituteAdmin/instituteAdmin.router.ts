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
import { getCalendarProceduresValidator } from "../validators/getCalendarProcedures.validator";
import { getArabicProceduresValidator } from "../validators/getArabicProcedures.validator";
import { getHospitalAnalysisValidator } from "../validators/getHospitalAnalysis.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireSuperAdmin, requireInstituteAdmin } from "../middleware/authorize.middleware";
import { userBasedRateLimiter, userBasedStrictRateLimiter } from "../middleware/rateLimiter.middleware";

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
      userBasedStrictRateLimiter,
      extractJWT,
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
      userBasedRateLimiter,
      extractJWT,
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
      userBasedRateLimiter,
      extractJWT,
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

    // Dashboard endpoints - Get supervisor submissions (MUST be before /:id route)
    this.router.get(
      "/supervisors/:supervisorId/submissions",
      userBasedRateLimiter,
      extractJWT,
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
      userBasedRateLimiter,
      extractJWT,
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

    // Dashboard endpoints - Get candidate submissions (MUST be before /:id route)
    this.router.get(
      "/candidates/:candidateId/submissions",
      userBasedRateLimiter,
      extractJWT,
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
      userBasedRateLimiter,
      extractJWT,
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
      userBasedRateLimiter,
      extractJWT,
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
      userBasedRateLimiter,
      extractJWT,
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
      userBasedRateLimiter,
      extractJWT,
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

    // Dashboard endpoints - Get Arabic procedures with optional search (MUST be before /:id route)
    this.router.get(
      "/arabicProcedures",
      userBasedRateLimiter,
      extractJWT,
      requireInstituteAdmin,
      getArabicProceduresValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.instituteAdminController.handleGetArabicProcedures(req, res);
            res.status(StatusCodes.OK).json(resp);
          } catch (err: any) {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
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
      userBasedRateLimiter,
      extractJWT,
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
      userBasedStrictRateLimiter,
      extractJWT,
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
      userBasedStrictRateLimiter,
      extractJWT,
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

