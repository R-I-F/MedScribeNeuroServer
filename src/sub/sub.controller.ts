import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { SubProvider } from "./sub.provider";
import { matchedData } from "express-validator";


@injectable()
export class SubController {
  constructor(
    @inject(SubProvider) private subProvider: SubProvider
  ){}

  public async handlePostSubFromExternal(req: Request, res: Response) {
    try {
      const matched = matchedData(req)
      const newSubs = await this.subProvider.createSubFromExternal(matched)
      return newSubs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateStatusFromExternal(req: Request, res: Response) {
    try {
      const matched = matchedData(req)
      const updatedSubs = await this.subProvider.updateStatusFromExternal(matched)
      return updatedSubs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandidateSubmissionsStats(req: Request, res: Response) {
    try {
      const jwtPayload = res.locals.jwt as { _id: string; email: string; role: string } | undefined;
      if (!jwtPayload || !jwtPayload._id) {
        throw new Error("Unauthorized: No candidate ID found in token");
      }
      const stats = await this.subProvider.getCandidateSubmissionsStats(jwtPayload._id);
      return stats;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandidateSubmissions(req: Request, res: Response) {
    try {
      const jwtPayload = res.locals.jwt as { _id: string; email: string; role: string } | undefined;
      if (!jwtPayload || !jwtPayload._id) {
        throw new Error("Unauthorized: No candidate ID found in token");
      }
      const submissions = await this.subProvider.getCandidateSubmissions(jwtPayload._id);
      return submissions;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetSupervisorSubmissions(req: Request, res: Response) {
    try {
      const jwtPayload = res.locals.jwt as { _id: string; email: string; role: string } | undefined;
      if (!jwtPayload || !jwtPayload._id) {
        throw new Error("Unauthorized: No supervisor ID found in token");
      }
      const status = req.query.status as "approved" | "pending" | "rejected" | undefined;
      const submissions = await this.subProvider.getSupervisorSubmissions(jwtPayload._id, status);
      return submissions;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetSupervisorSubmissionById(req: Request, res: Response) {
    try {
      const jwtPayload = res.locals.jwt as { _id: string; email: string; role: string } | undefined;

      if (!jwtPayload || !jwtPayload._id) {
        throw new Error("Unauthorized: No supervisor ID found in token");
      }

      const submissionId = req.params.id;
      if (!submissionId) {
        throw new Error("Submission ID is required");
      }

      const submission = await this.subProvider.getSupervisorSubmissionById(jwtPayload._id, submissionId);

      if (!submission) {
        throw new Error("Submission not found");
      }

      return submission;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandidateSubmissionById(req: Request, res: Response) {
    try {
      const jwtPayload = res.locals.jwt as { _id: string; email: string; role: string } | undefined;

      if (!jwtPayload || !jwtPayload._id) {
        throw new Error("Unauthorized: No candidate ID found in token");
      }

      const submissionId = req.params.id;
      if (!submissionId) {
        throw new Error("Submission ID is required");
      }

      const submission = await this.subProvider.getCandidateSubmissionById(jwtPayload._id, submissionId);

      if (!submission) {
        throw new Error("Submission not found");
      }

      return submission;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandidateSubmissionsBySupervisor(req: Request, res: Response) {
    try {
      const jwtPayload = res.locals.jwt as { _id: string; email: string; role: string } | undefined;
      
      // Check if 'all=true' query parameter is provided
      const getAll = String(req.query.all) === 'true';

      if (!jwtPayload || !jwtPayload._id) {
        throw new Error("Unauthorized: No supervisor ID found in token");
      }

      const candidateId = req.params.candidateId;
      if (!candidateId) {
        throw new Error("Candidate ID is required");
      }

      const submissions = await this.subProvider.getCandidateSubmissionsBySupervisor(
        jwtPayload._id,
        candidateId,
        getAll
      );

      return submissions;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleReviewSubmission(req: Request, res: Response) {
    try {
      const jwtPayload = res.locals.jwt as { _id: string; email: string; role: string } | undefined;

      if (!jwtPayload || !jwtPayload._id) {
        throw new Error("Unauthorized: No supervisor ID found in token");
      }

      const validatedReq = matchedData(req) as { id: string; status: "approved" | "rejected"; review?: string };
      const submissionId = validatedReq.id;
      const status = validatedReq.status;
      const review = validatedReq.review;

      const updatedSubmission = await this.subProvider.reviewSubmission(
        jwtPayload._id,
        submissionId,
        status,
        review
      );

      return updatedSubmission;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGenerateSurgicalNotes(req: Request, res: Response) {
    try {
      const submissionId = req.params.id;
      if (!submissionId) {
        throw new Error("Submission ID is required");
      }

      const result = await this.subProvider.generateSurgicalNotesForSubmission(submissionId);
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}