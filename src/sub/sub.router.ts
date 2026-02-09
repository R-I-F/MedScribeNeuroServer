import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { SubController } from "./sub.controller";
import { createFromExternalValidator } from "../validators/createFromExternal.validator";
import { createSubmissionValidator } from "../validators/createSubmission.validator";
import { createSupervisorSubmissionValidator } from "../validators/createSupervisorSubmission.validator";
import { getSubmissionByIdValidator } from "../validators/getSubmissionById.validator";
import { reviewSubmissionValidator } from "../validators/reviewSubmission.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { authorize, requireCandidate, requireSuperAdmin, requireSupervisor, requireInstituteAdmin, requireValidatorSupervisor } from "../middleware/authorize.middleware";
import { UserRole } from "../types/role.types";
import { userBasedRateLimiter, userBasedStrictRateLimiter, strictRateLimiter } from "../middleware/rateLimiter.middleware";
import institutionResolver from "../middleware/institutionResolver.middleware";
@injectable()
export class SubRouter {

  public router: Router;

  constructor(
    @inject(SubController) private subController: SubController
  )
  {
    this.router = express.Router();
    this.initRoutes();
  }
  private async initRoutes(){
    // DISABLED: See docs/DISABLED_ROUTES.md. Import submissions from external (no auth; X-Institution-Id).
    this.router.post(
      "/postAllFromExternal",
      institutionResolver,
      strictRateLimiter,
      createFromExternalValidator,
      async (req: Request, res: Response) => {
        return res.status(StatusCodes.GONE).json({
          error: "This endpoint is disabled.",
          code: "ENDPOINT_DISABLED",
          reference: "docs/DISABLED_ROUTES.md",
        });
      }
    );
    // DISABLED: See docs/DISABLED_ROUTES.md. Update submission status from external (no auth; X-Institution-Id).
    this.router.patch(
      "/updateStatusFromExternal",
      institutionResolver,
      strictRateLimiter,
      createFromExternalValidator,
      async (req: Request, res: Response) => {
        return res.status(StatusCodes.GONE).json({
          error: "This endpoint is disabled.",
          code: "ENDPOINT_DISABLED",
          reference: "docs/DISABLED_ROUTES.md",
        });
      }
    );

    // Create submission (candidate only)
    this.router.post(
      "/candidate/submissions",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireCandidate,
      createSubmissionValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const submission = await this.subController.handleCreateSubmission(req, res);
            res.status(StatusCodes.CREATED).json(submission);
          } catch (err: any) {
            if (err.message?.includes("Unauthorized")) {
              res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
            } else if (err.message?.includes("not found") || err.message?.includes("Main diagnosis")) {
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

    // Create submission (supervisor only - auto-approved, no candidate)
    this.router.post(
      "/supervisor/submissions",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSupervisor,
      createSupervisorSubmissionValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const submission = await this.subController.handleCreateSupervisorSubmission(req, res);
            res.status(StatusCodes.CREATED).json(submission);
          } catch (err: any) {
            if (err.message?.includes("Unauthorized")) {
              res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
            } else if (err.message?.includes("not found") || err.message?.includes("Main diagnosis")) {
              res.status(StatusCodes.BAD_REQUEST).json({ error: err.message });
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    )

    // Get candidate submission statistics (requires authentication)
    this.router.get(
      "/candidate/stats",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      async (req: Request, res: Response) => {
        try {
          const stats = await this.subController.handleGetCandidateSubmissionsStats(req, res);
          res.status(StatusCodes.OK).json(stats);
        } catch (err: any) {
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    )

    // CPT analytics: approved submissions by CPT code (count, % of total). Candidates and supervisors (and admins).
    this.router.get(
      "/cptAnalytics",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      authorize(UserRole.CANDIDATE, UserRole.SUPERVISOR, UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN),
      async (req: Request, res: Response) => {
        try {
          const result = await this.subController.handleGetCptAnalytics(req, res);
          res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    )

    // ICD analytics: approved submissions by ICD code (count, % of total). Candidates and supervisors (and admins).
    this.router.get(
      "/icdAnalytics",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      authorize(UserRole.CANDIDATE, UserRole.SUPERVISOR, UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN),
      async (req: Request, res: Response) => {
        try {
          const result = await this.subController.handleGetIcdAnalytics(req, res);
          res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    )

    // Supervisor analytics: approved submissions by supervisor (count, % of total)
    this.router.get(
      "/supervisorAnalytics",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      async (req: Request, res: Response) => {
        try {
          const result = await this.subController.handleGetSupervisorAnalytics(req, res);
          res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    )

    // Submission (surgical experience) ranking: all candidates by approved count
    this.router.get(
      "/submissionRanking",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      async (req: Request, res: Response) => {
        try {
          const result = await this.subController.handleGetSubmissionRanking(req, res);
          res.status(StatusCodes.OK).json(result);
        } catch (err: any) {
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    )

    // Get single candidate submission by ID (requires candidate authentication)
    this.router.get(
      "/candidate/submissions/:id",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      getSubmissionByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const submission = await this.subController.handleGetCandidateSubmissionById(req, res);
            res.status(StatusCodes.OK).json(submission);
          } catch (err: any) {
            if (err.message.includes("Unauthorized")) {
              res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
            } else if (err.message.includes("not found") || err.message.includes("does not belong")) {
              res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    )

    // Get all candidate submissions with populated data (requires authentication)
    this.router.get(
      "/candidate/submissions",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireCandidate,
      async (req: Request, res: Response) => {
        try {
          const submissions = await this.subController.handleGetCandidateSubmissions(req, res);
          res.status(StatusCodes.OK).json(submissions);
        } catch (err: any) {
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    )

    // Get supervisor submissions (requires supervisor authentication)
    this.router.get(
      "/supervisor/submissions",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSupervisor,
      async (req: Request, res: Response) => {
        try {
          const submissions = await this.subController.handleGetSupervisorSubmissions(req, res);
          res.status(StatusCodes.OK).json(submissions);
        } catch (err: any) {
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    )

    // Get supervisor own submissions (submitted by supervisor, not candidate) - SUPERVISOR, INSADMIN, SUPERADMIN
    this.router.get(
      "/supervisor/own/submissions",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      authorize(UserRole.SUPERVISOR, UserRole.INSTITUTE_ADMIN, UserRole.SUPER_ADMIN),
      async (req: Request, res: Response) => {
        try {
          const submissions = await this.subController.handleGetSupervisorOwnSubmissions(req, res);
          res.status(StatusCodes.OK).json(submissions);
        } catch (err: any) {
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    )

    // Get single supervisor submission by ID (requires supervisor authentication)
    this.router.get(
      "/supervisor/submissions/:id",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSupervisor,
      getSubmissionByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const submission = await this.subController.handleGetSupervisorSubmissionById(req, res);
            res.status(StatusCodes.OK).json(submission);
          } catch (err: any) {
            if (err.message.includes("Unauthorized")) {
              res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
            } else if (err.message.includes("not found") || err.message.includes("does not belong")) {
              res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    )

    // Get candidate submissions by supervisor (requires supervisor authentication)
    this.router.get(
      "/supervisor/candidates/:candidateId/submissions",
      extractJWT,
      institutionResolver,
      userBasedRateLimiter,
      requireSupervisor,
      async (req: Request, res: Response) => {
        try {
          const submissions = await this.subController.handleGetCandidateSubmissionsBySupervisor(req, res);
          res.status(StatusCodes.OK).json(submissions);
        } catch (err: any) {
          if (err.message.includes("Unauthorized")) {
            res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
          } else {
            res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
          }
        }
      }
    )

    // Review submission (approve/reject) - requires validator supervisor authentication
    // Only supervisors with canValidate=true can review submissions
    // Academic supervisors (canValidate=false) can only participate in events
    this.router.patch(
      "/supervisor/submissions/:id/review",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSupervisor, // First check if user is supervisor
      requireValidatorSupervisor, // Then check if supervisor can validate
      reviewSubmissionValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const updatedSubmission = await this.subController.handleReviewSubmission(req, res);
            res.status(StatusCodes.OK).json(updatedSubmission);
          } catch (err: any) {
            if (err.message.includes("Unauthorized")) {
              res.status(StatusCodes.UNAUTHORIZED).json({ error: err.message });
            } else if (err.message.includes("not found") || err.message.includes("does not belong")) {
              res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    )

    // DISABLED: Generate surgical notes using AI - accessible only to institute admins
    // Temporarily disabled for security/maintenance reasons
    /*
    this.router.post(
      "/submissions/:id/generateSurgicalNotes",
      extractJWT,
      userBasedStrictRateLimiter,
      requireInstituteAdmin,
      getSubmissionByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const surgicalNotes = await this.subController.handleGenerateSurgicalNotes(req, res);
            res.status(StatusCodes.OK).json(surgicalNotes);
          } catch (err: any) {
            if (err.message.includes("not found")) {
              res.status(StatusCodes.NOT_FOUND).json({ error: err.message });
            } else if (err.message.includes("GEMINI_API_KEY")) {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "AI service is not configured" });
            } else {
              res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: err.message });
            }
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    )
    */

    this.router.delete(
      "/:id",
      extractJWT,
      institutionResolver,
      userBasedStrictRateLimiter,
      requireSuperAdmin,
      getSubmissionByIdValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if (result.isEmpty()) {
          try {
            const resp = await this.subController.handleDeleteSub(req, res);
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
    )
  }
}