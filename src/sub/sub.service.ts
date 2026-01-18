import { injectable, inject } from "inversify";
import { ISub, ISubDoc } from "./interfaces/sub.interface";
import { AppDataSource } from "../config/database.config";
import { SubmissionEntity } from "./sub.mDbSchema";
import { Repository, In } from "typeorm";
import { ProcCptEntity } from "../procCpt/procCpt.mDbSchema";
import { DiagnosisEntity } from "../diagnosis/diagnosis.mDbSchema";

@injectable()
export class SubService {
  private subRepository: Repository<SubmissionEntity>;
  private procCptRepository: Repository<ProcCptEntity>;
  private diagnosisRepository: Repository<DiagnosisEntity>;

  constructor() {
    this.subRepository = AppDataSource.getRepository(SubmissionEntity);
    this.procCptRepository = AppDataSource.getRepository(ProcCptEntity);
    this.diagnosisRepository = AppDataSource.getRepository(DiagnosisEntity);
  }

  public async createBulkSub(subData: ISub[]): Promise<ISubDoc[]> {
    try {
      const savedSubs: ISubDoc[] = [];
      
      for (const sub of subData) {
        const submission = this.subRepository.create(sub as any) as unknown as SubmissionEntity;
        
        // Load and assign procCpts if provided
        if (sub.procCptDocId && sub.procCptDocId.length > 0) {
          const procCpts = await this.procCptRepository.find({
            where: { id: In(sub.procCptDocId) },
          });
          submission.procCpts = procCpts;
        }
        
        // Load and assign icds if provided
        if (sub.icdDocId && sub.icdDocId.length > 0) {
          const icds = await this.diagnosisRepository.find({
            where: { id: In(sub.icdDocId) },
          });
          submission.icds = icds;
        }
        
        const savedSub = await this.subRepository.save(submission);
        savedSubs.push(savedSub as unknown as ISubDoc);
      }
      
      return savedSubs;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getAllSubs(): Promise<ISubDoc[]> {
    try {
      const allSubs = await this.subRepository.find({
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
        order: { createdAt: "DESC" },
      });
      return allSubs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getSubsByCandidateId(candidateId: string): Promise<ISubDoc[]> | never {
    try {
      const subs = await this.subRepository.find({
        where: { candDocId: candidateId },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
        order: { createdAt: "DESC" },
      });
      return subs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getSubsByCandidateIdAndStatus(
    candidateId: string,
    status: "approved" | "pending" | "rejected"
  ): Promise<ISubDoc[]> | never {
    try {
      const subs = await this.subRepository.find({
        where: { candDocId: candidateId, subStatus: status },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
        order: { createdAt: "DESC" },
      });
      return subs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getSubsBySupervisorId(supervisorId: string): Promise<ISubDoc[]> | never {
    try {
      const subs = await this.subRepository.find({
        where: { supervisorDocId: supervisorId },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
        order: { createdAt: "DESC" },
      });
      return subs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getSubsBySupervisorIdAndStatus(
    supervisorId: string,
    status: "approved" | "pending" | "rejected"
  ): Promise<ISubDoc[]> | never {
    try {
      const subs = await this.subRepository.find({
        where: { supervisorDocId: supervisorId, subStatus: status },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
        order: { createdAt: "DESC" },
      });
      return subs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async getSubById(subId: string): Promise<ISubDoc | null> | never {
    try {
      const sub = await this.subRepository.findOne({
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
    candidateId: string
  ): Promise<ISubDoc[]> | never {
    try {
      const subs = await this.subRepository.find({
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
    candidateId: string
  ): Promise<boolean> | never {
    try {
      const count = await this.subRepository.count({
        where: { supervisorDocId: supervisorId, candDocId: candidateId },
      });
      return count > 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async updateSubmissionStatus(
    submissionId: string,
    status: "approved" | "rejected"
  ): Promise<ISubDoc | null> | never {
    try {
      await this.subRepository.update(submissionId, { subStatus: status });
      const updatedSub = await this.subRepository.findOne({
        where: { id: submissionId },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
      });
      return updatedSub as unknown as ISubDoc | null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async findSubBySubGoogleUid(subGoogleUid: string): Promise<ISubDoc | null> | never {
    try {
      if (!subGoogleUid || subGoogleUid.trim() === "") {
        return null;
      }
      const sub = await this.subRepository.findOne({
        where: { subGoogleUid: subGoogleUid.trim() },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
      });
      return sub as unknown as ISubDoc | null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async findSubsBySubGoogleUids(subGoogleUids: string[]): Promise<ISubDoc[]> | never {
    try {
      const uniqueUids = [...new Set(subGoogleUids.filter(uid => uid && uid.trim() !== ""))];
      if (uniqueUids.length === 0) {
        return [];
      }
      const subs = await this.subRepository.find({
        where: { subGoogleUid: In(uniqueUids) },
        relations: ["candidate", "calSurg", "calSurg.hospital", "calSurg.arabProc", "supervisor", "mainDiag", "procCpts", "icds"],
      });
      return subs as unknown as ISubDoc[];
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async deleteSub(id: string): Promise<boolean> | never {
    try {
      const result = await this.subRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
