import { Request, Response } from "express";
import { injectable, inject } from "inversify";
import { SubProvider } from "./sub.provider";
import { matchedData } from "express-validator";
import { toCandidateSubmissionResponse, toCandidateSubmissionsResponse, toSupervisorSubmissionResponse, toSupervisorSubmissionsResponse } from "./sub.mapper";


@injectable()
export class SubController {
  constructor(
    @inject(SubProvider) private subProvider: SubProvider
  ){}

  public async handlePostSubFromExternal(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const matched = matchedData(req)
      const newSubs = await this.subProvider.createSubFromExternal(matched, dataSource)
      return newSubs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateStatusFromExternal(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const matched = matchedData(req)
      const updatedSubs = await this.subProvider.updateStatusFromExternal(matched, dataSource)
      return updatedSubs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleCreateSubmission(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const jwtPayload = res.locals.jwt as { _id?: string; id?: string; email: string; role: string } | undefined;
      const candidateId = jwtPayload?.id ?? jwtPayload?._id;
      if (!candidateId) {
        throw new Error("Unauthorized: No candidate ID found in token");
      }
      const matched = matchedData(req) as Parameters<SubProvider["createSubmissionByCandidate"]>[1];
      const institutionId = (req as any).institutionId as string | undefined;
      const submission = await this.subProvider.createSubmissionByCandidate(candidateId, matched, dataSource, institutionId);
      return toCandidateSubmissionResponse(submission as unknown as Record<string, unknown>);
    } catch (err: any) {
      throw new Error(err.message ?? err);
    }
  }

  public async handleCreateSupervisorSubmission(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const jwtPayload = res.locals.jwt as { _id?: string; id?: string; email: string; role: string } | undefined;
      const supervisorId = jwtPayload?.id ?? jwtPayload?._id;
      if (!supervisorId) {
        throw new Error("Unauthorized: No supervisor ID found in token");
      }
      const matched = matchedData(req) as Omit<
        Parameters<SubProvider["createSubmissionBySupervisor"]>[1],
        never
      >;
      const submission = await this.subProvider.createSubmissionBySupervisor(supervisorId, matched, dataSource);
      return toCandidateSubmissionResponse(submission as unknown as Record<string, unknown>);
    } catch (err: any) {
      throw new Error(err.message ?? err);
    }
  }

  public async handleGetCandidateSubmissionsStats(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const jwtPayload = res.locals.jwt as { _id: string; email: string; role: string } | undefined;
      if (!jwtPayload || !jwtPayload._id) {
        throw new Error("Unauthorized: No candidate ID found in token");
      }
      const stats = await this.subProvider.getCandidateSubmissionsStats(jwtPayload._id, dataSource);
      return stats;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCptAnalytics(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const jwtPayload = res.locals.jwt as { id?: string; _id?: string; email: string; role: string } | undefined;
      if (!jwtPayload || (!jwtPayload.id && !jwtPayload._id)) {
        throw new Error("Unauthorized: No user ID found in token");
      }
      const userId = jwtPayload.id ?? jwtPayload._id!;
      const result = await this.subProvider.getCptAnalytics(userId, jwtPayload.role, dataSource);
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetIcdAnalytics(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const jwtPayload = res.locals.jwt as { id?: string; _id?: string; email: string; role: string } | undefined;
      if (!jwtPayload || (!jwtPayload.id && !jwtPayload._id)) {
        throw new Error("Unauthorized: No user ID found in token");
      }
      const userId = jwtPayload.id ?? jwtPayload._id!;
      const result = await this.subProvider.getIcdAnalytics(userId, jwtPayload.role, dataSource);
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetSupervisorAnalytics(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const jwtPayload = res.locals.jwt as { id?: string; _id?: string; email: string; role: string } | undefined;
      if (!jwtPayload || (!jwtPayload.id && !jwtPayload._id)) {
        throw new Error("Unauthorized: No user ID found in token");
      }
      const userId = jwtPayload.id ?? jwtPayload._id!;
      const result = await this.subProvider.getSupervisorAnalytics(userId, jwtPayload.role, dataSource);
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetSubmissionRanking(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const jwt = res.locals.jwt as { id?: string; _id?: string; role?: string } | undefined;
      const userId = jwt?.id ?? jwt?._id;
      const role = jwt?.role;
      return await this.subProvider.getSubmissionRanking(dataSource, userId, role);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandidateSubmissions(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const jwtPayload = res.locals.jwt as { _id: string; email: string; role: string } | undefined;
      if (!jwtPayload || !jwtPayload._id) {
        throw new Error("Unauthorized: No candidate ID found in token");
      }
      const submissions = await this.subProvider.getCandidateSubmissions(jwtPayload._id, dataSource);
      return toCandidateSubmissionsResponse(submissions as unknown as Record<string, unknown>[]);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetSupervisorSubmissions(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const jwtPayload = res.locals.jwt as { _id: string; email: string; role: string } | undefined;
      if (!jwtPayload || !jwtPayload._id) {
        throw new Error("Unauthorized: No supervisor ID found in token");
      }
      const status = req.query.status as "approved" | "pending" | "rejected" | undefined;
      const submissions = await this.subProvider.getSupervisorSubmissions(jwtPayload._id, status, dataSource);
      return toSupervisorSubmissionsResponse(submissions as unknown as Record<string, unknown>[]);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetSupervisorOwnSubmissions(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const jwtPayload = res.locals.jwt as { _id?: string; id?: string; email: string; role: string } | undefined;
      const userId = jwtPayload?.id ?? jwtPayload?._id;
      if (!jwtPayload || !userId) {
        throw new Error("Unauthorized: No user ID found in token");
      }
      const status = req.query.status as "approved" | "pending" | "rejected" | undefined;
      const submissions = await this.subProvider.getSupervisorOwnSubmissions(userId, status, dataSource);
      return toSupervisorSubmissionsResponse(submissions as unknown as Record<string, unknown>[]);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetSupervisorSubmissionById(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const jwtPayload = res.locals.jwt as { _id: string; email: string; role: string } | undefined;

      if (!jwtPayload || !jwtPayload._id) {
        throw new Error("Unauthorized: No supervisor ID found in token");
      }

      const submissionId = req.params.id;
      if (!submissionId) {
        throw new Error("Submission ID is required");
      }

      const submission = await this.subProvider.getSupervisorSubmissionById(jwtPayload._id, submissionId, dataSource);

      if (!submission) {
        throw new Error("Submission not found");
      }

      return toSupervisorSubmissionResponse(submission as unknown as Record<string, unknown>);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandidateSubmissionById(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const jwtPayload = res.locals.jwt as { _id: string; email: string; role: string } | undefined;

      if (!jwtPayload || !jwtPayload._id) {
        throw new Error("Unauthorized: No candidate ID found in token");
      }

      const submissionId = req.params.id;
      if (!submissionId) {
        throw new Error("Submission ID is required");
      }

      const submission = await this.subProvider.getCandidateSubmissionById(jwtPayload._id, submissionId, dataSource);

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
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
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
        getAll,
        dataSource
      );

      return submissions;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleReviewSubmission(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
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
        review,
        dataSource
      );

      return updatedSubmission;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGenerateSurgicalNotes(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const submissionId = req.params.id;
      if (!submissionId) {
        throw new Error("Submission ID is required");
      }

      const result = await this.subProvider.generateSurgicalNotesForSubmission(submissionId, dataSource);
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteSub(
    req: Request,
    res: Response
  ): Promise<{ message: string }> | never {
    const id = req.params.id;
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const deleted = await this.subProvider.deleteSub(id, dataSource);
      if (!deleted) {
        throw new Error("Submission not found");
      }
      return { message: "Submission deleted successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}