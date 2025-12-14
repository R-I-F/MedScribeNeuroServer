import express, { Request, Response, Router } from "express";
import { inject, injectable } from "inversify";
import { SubController } from "./sub.controller";
import { createFromExternalValidator } from "../validators/createFromExternal.validator";
import { getSubmissionByIdValidator } from "../validators/getSubmissionById.validator";
import { reviewSubmissionValidator } from "../validators/reviewSubmission.validator";
import { validationResult } from "express-validator";
import { StatusCodes } from "http-status-codes";
import extractJWT from "../middleware/extractJWT";
import { requireCandidate, requireSuperAdmin, requireSupervisor, requireInstituteAdmin } from "../middleware/authorize.middleware";
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
    this.router.post(
      "/postAllFromExternal",
      extractJWT,
      requireSuperAdmin,
      createFromExternalValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if(result.isEmpty()){
          try{
            const newSubs = await this.subController.handlePostSubFromExternal(req, res);
            res.status(StatusCodes.CREATED).json(newSubs);
          }
          catch(err: any){ 
            throw new Error(err) 
          }
        } else {
          res.status(StatusCodes.BAD_REQUEST).json(result.array());
        }
      }
    )
    this.router.patch(
      "/updateStatusFromExternal",
      extractJWT,
      requireSuperAdmin,
      createFromExternalValidator,
      async (req: Request, res: Response) => {
        const result = validationResult(req);
        if(result.isEmpty()){
          try{
            const updatedSubs = await this.subController.handleUpdateStatusFromExternal(req, res);
            res.status(StatusCodes.OK).json(updatedSubs);
          }
          catch(err: any){
            throw new Error(err)
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

    // Get single candidate submission by ID (requires candidate authentication)
    this.router.get(
      "/candidate/submissions/:id",
      extractJWT,
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

    // Get single supervisor submission by ID (requires supervisor authentication)
    this.router.get(
      "/supervisor/submissions/:id",
      extractJWT,
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

    // Review submission (approve/reject) - requires supervisor authentication
    this.router.patch(
      "/supervisor/submissions/:id/review",
      extractJWT,
      requireSupervisor,
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

    // Generate surgical notes using AI - accessible only to institute admins
    this.router.post(
      "/submissions/:id/generateSurgicalNotes",
      extractJWT,
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
  }
}