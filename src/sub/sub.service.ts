import { injectable, inject } from "inversify";
import { DataSource } from "typeorm";
import { ISub, ISubDoc } from "./interfaces/sub.interface";
import { SubmissionEntity } from "./sub.mDbSchema";
import { Repository, In } from "typeorm";
import { ProcCptEntity } from "../procCpt/procCpt.mDbSchema";
import { DiagnosisEntity } from "../diagnosis/diagnosis.mDbSchema";

@injectable()
export class SubService {
  public async createBulkSub(subData: ISub[], dataSource: DataSource): Promise<ISubDoc[]> {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const procCptRepository = dataSource.getRepository(ProcCptEntity);
      const diagnosisRepository = dataSource.getRepository(DiagnosisEntity);
      const savedSubs: ISubDoc[] = [];

      for (const sub of subData) {
        const savedSub = await this.saveOneSub(sub, subRepository, procCptRepository, diagnosisRepository);
        savedSubs.push(savedSub);
      }

      return savedSubs;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Creates a single submission. Used by candidate submit and by bulk import.
   * Returns the saved submission with populated relations (procedure/calSurg, supervisor, mainDiag, etc.).
   */
  public async createOneSub(sub: ISub, dataSource: DataSource): Promise<ISubDoc> {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const procCptRepository = dataSource.getRepository(ProcCptEntity);
      const diagnosisRepository = dataSource.getRepository(DiagnosisEntity);
      const savedSub = await this.saveOneSub(sub, subRepository, procCptRepository, diagnosisRepository);
      // Re-fetch with populated relations for consistent response shape (procedure, supervisor, mainDiag)
      const populated = await this.getSubById(savedSub.id, dataSource);
      if (!populated) throw new Error("Failed to fetch created submission");
      return populated;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  private async saveOneSub(
    sub: ISub,
    subRepository: Repository<SubmissionEntity>,
    procCptRepository: Repository<ProcCptEntity>,
    diagnosisRepository: Repository<DiagnosisEntity>
  ): Promise<ISubDoc> {
    const submission = subRepository.create(sub as any) as unknown as SubmissionEntity;

    if (sub.procCptDocId && sub.procCptDocId.length > 0) {
      const procCpts = await procCptRepository.find({
        where: { id: In(sub.procCptDocId) },
      });
      submission.procCpts = procCpts;
    }

    if (sub.icdDocId && sub.icdDocId.length > 0) {
      const icds = await diagnosisRepository.find({
        where: { id: In(sub.icdDocId) },
      });
      submission.icds = icds;
    }

    const savedSub = await subRepository.save(submission);
    return savedSub as unknown as ISubDoc;
  }

  public async getAllSubs(dataSource: DataSource): Promise<ISubDoc[]> {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const allSubs = await subRepository.find({
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
        order: { createdAt: "DESC" },
      });
      return allSubs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getSubsByCandidateId(candidateId: string, dataSource: DataSource): Promise<ISubDoc[]> | never {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const subs = await subRepository.find({
        where: { candDocId: candidateId },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
        order: { createdAt: "DESC" },
      });
      return subs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Approved/pending/rejected submissions for a candidate. Only submissions with
   * candDocId = candidateId and submissionType = 'candidate' (excludes supervisor-type submissions).
   */
  public async getSubsByCandidateIdAndStatus(
    candidateId: string,
    status: "approved" | "pending" | "rejected",
    dataSource: DataSource
  ): Promise<ISubDoc[]> | never {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const subs = await subRepository.find({
        where: { candDocId: candidateId, subStatus: status, submissionType: "candidate" },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
        order: { createdAt: "DESC" },
      });
      return subs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Candidate submissions for a given procedure (procDocId). Used for submission limits per procedure.
   * Only submissions with candDocId = candidateId, procDocId, submissionType = 'candidate'.
   * Rejected submissions are excluded from the count (only pending and approved count).
   */
  public async getSubsByCandidateIdAndProcDocId(
    candidateId: string,
    procDocId: string,
    dataSource: DataSource
  ): Promise<ISubDoc[]> | never {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const subs = await subRepository.find({
        where: {
          candDocId: candidateId,
          procDocId,
          submissionType: "candidate",
          subStatus: In(["pending", "approved"]),
        },
      });
      return subs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getSubsBySupervisorId(supervisorId: string, dataSource: DataSource): Promise<ISubDoc[]> | never {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const subs = await subRepository.find({
        where: { supervisorDocId: supervisorId },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
        order: { createdAt: "DESC" },
      });
      return subs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Candidate submissions where supervisor is the approver (submissionType = 'candidate').
   * Optionally filter by status.
   */
  public async getSubsBySupervisorIdCandidateOnly(
    supervisorId: string,
    dataSource: DataSource,
    status?: "approved" | "pending" | "rejected"
  ): Promise<ISubDoc[]> | never {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const where: Record<string, unknown> = { supervisorDocId: supervisorId, submissionType: "candidate" };
      if (status) {
        where.subStatus = status;
      }
      const subs = await subRepository.find({
        where,
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
        order: { createdAt: "DESC" },
      });
      return subs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Approved/pending/rejected submissions for a supervisor. Only submissions with
   * supervisorDocId = supervisorId and submissionType = 'supervisor' (excludes candidate-type submissions).
   */
  public async getSubsBySupervisorIdAndStatus(
    supervisorId: string,
    status: "approved" | "pending" | "rejected",
    dataSource: DataSource
  ): Promise<ISubDoc[]> | never {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const subs = await subRepository.find({
        where: { supervisorDocId: supervisorId, subStatus: status, submissionType: "supervisor" },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
        order: { createdAt: "DESC" },
      });
      return subs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Submissions submitted by the supervisor (submissionType = 'supervisor').
   * Optionally filter by status.
   */
  public async getSubsBySupervisorOwned(
    supervisorId: string,
    dataSource: DataSource,
    status?: "approved" | "pending" | "rejected"
  ): Promise<ISubDoc[]> | never {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const where: Record<string, unknown> = { supervisorDocId: supervisorId, submissionType: "supervisor" };
      if (status) {
        where.subStatus = status;
      }
      const subs = await subRepository.find({
        where,
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
        order: { createdAt: "DESC" },
      });
      return subs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  /**
   * Returns approved submission count per candidate (candDocId -> count) for ranking.
   * Only counts candidate submissions (submissionType = 'candidate'), not supervisor submissions.
   */
  public async getApprovedCountsPerCandidate(dataSource: DataSource): Promise<Map<string, number>> {
    const subRepository = dataSource.getRepository(SubmissionEntity);
    const rows = await subRepository
      .createQueryBuilder("s")
      .select("s.candDocId", "candDocId")
      .addSelect("COUNT(*)", "cnt")
      .where("s.subStatus = :status", { status: "approved" })
      .andWhere("s.submissionType = :type", { type: "candidate" })
      .andWhere("s.candDocId IS NOT NULL")
      .groupBy("s.candDocId")
      .getRawMany<{ candDocId: string; cnt: string }>();
    const map = new Map<string, number>();
    for (const r of rows) {
      map.set(r.candDocId, parseInt(r.cnt, 10) || 0);
    }
    return map;
  }

  public async getSubById(subId: string, dataSource: DataSource): Promise<ISubDoc | null> | never {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const sub = await subRepository.findOne({
        where: { id: subId },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
      });
      return sub as unknown as ISubDoc | null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getSubsBySupervisorIdAndCandidateId(
    supervisorId: string,
    candidateId: string,
    dataSource: DataSource
  ): Promise<ISubDoc[]> | never {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const subs = await subRepository.find({
        where: { supervisorDocId: supervisorId, candDocId: candidateId },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
        order: { createdAt: "DESC" },
      });
      return subs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async hasSupervisorCandidateRelationship(
    supervisorId: string,
    candidateId: string,
    dataSource: DataSource
  ): Promise<boolean> | never {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const count = await subRepository.count({
        where: { supervisorDocId: supervisorId, candDocId: candidateId },
      });
      return count > 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async updateSubmissionStatus(
    submissionId: string,
    status: "approved" | "rejected",
    dataSource: DataSource,
    options?: { review?: string; reviewedBy?: string }
  ): Promise<ISubDoc | null> | never {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const updateData: Partial<SubmissionEntity> = { subStatus: status };
      // When options provided (supervisor review flow), also store review metadata
      if (options !== undefined) {
        updateData.reviewedAt = new Date();
        updateData.review = options.review ?? null;
        updateData.reviewedBy = options.reviewedBy ?? null;
      }
      await subRepository.update(submissionId, updateData);
      const updatedSub = await subRepository.findOne({
        where: { id: submissionId },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
      });
      return updatedSub as unknown as ISubDoc | null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async findSubBySubGoogleUid(subGoogleUid: string, dataSource: DataSource): Promise<ISubDoc | null> | never {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      if (!subGoogleUid || subGoogleUid.trim() === "") {
        return null;
      }
      const sub = await subRepository.findOne({
        where: { subGoogleUid: subGoogleUid.trim() },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
      });
      return sub as unknown as ISubDoc | null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async findSubsBySubGoogleUids(subGoogleUids: string[], dataSource: DataSource): Promise<ISubDoc[]> | never {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const uniqueUids = [...new Set(subGoogleUids.filter(uid => uid && uid.trim() !== ""))];
      if (uniqueUids.length === 0) {
        return [];
      }
      const subs = await subRepository.find({
        where: { subGoogleUid: In(uniqueUids) },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
      });
      return subs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async deleteSub(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const subRepository = dataSource.getRepository(SubmissionEntity);
      const result = await subRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
