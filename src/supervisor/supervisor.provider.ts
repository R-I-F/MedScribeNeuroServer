import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { ISupervisor, ISupervisorDoc } from "./supervisor.interface";
import { SupervisorEntity } from "./supervisor.mDbSchema";
import { Repository } from "typeorm";
import { SubService } from "../sub/sub.service";
import { ISubDoc } from "../sub/interfaces/sub.interface";
import { ICandDoc } from "../cand/cand.interface";

@injectable()
export class SupervisorProvider {
  constructor(
    @inject(SubService) private subService: SubService
  ) {}

  public async createSupervisor(validatedReq: Partial<ISupervisor>, dataSource: DataSource): Promise<ISupervisorDoc> | never {
    try {
      const supervisorRepository = dataSource.getRepository(SupervisorEntity);
      const newSupervisor = supervisorRepository.create(validatedReq);
      const savedSupervisor = await supervisorRepository.save(newSupervisor);
      return savedSupervisor as unknown as ISupervisorDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllSupervisors(dataSource: DataSource): Promise<ISupervisorDoc[]> | never {
    try {
      const supervisorRepository = dataSource.getRepository(SupervisorEntity);
      const supervisors = await supervisorRepository.find({
        order: { createdAt: "DESC" },
      });
      return supervisors as unknown as ISupervisorDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorById(id: string, dataSource: DataSource): Promise<ISupervisorDoc | null> | never {
    try {
      const supervisorRepository = dataSource.getRepository(SupervisorEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid supervisor ID format");
      }
      const supervisor = await supervisorRepository.findOne({
        where: { id },
      });
      return supervisor as unknown as ISupervisorDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /** Canonical email for lookup: lowercase, trim, dots removed from local part (Gmail-style equivalence). */
  private static canonicalEmail(email: string): string {
    const n = (email || "").trim().toLowerCase();
    const at = n.indexOf("@");
    if (at <= 0) return n;
    return n.slice(0, at).replace(/\./g, "") + n.slice(at);
  }

  public async getSupervisorByEmail(email: string, dataSource: DataSource): Promise<ISupervisorDoc | null> | never {
    try {
      const supervisorRepository = dataSource.getRepository(SupervisorEntity);
      const normalized = (email || "").trim().toLowerCase();
      if (!normalized) return null;
      const canonical = SupervisorProvider.canonicalEmail(email);
      const supervisor = await supervisorRepository
        .createQueryBuilder("s")
        .where(
          "LOWER(TRIM(s.email)) = :normalized OR (CONCAT(REPLACE(SUBSTRING_INDEX(LOWER(TRIM(s.email)), '@', 1), '.', ''), '@', SUBSTRING_INDEX(LOWER(TRIM(s.email)), '@', -1)) = :canonical)",
          { normalized, canonical }
        )
        .getOne();
      return supervisor as unknown as ISupervisorDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateSupervisor(validatedReq: Partial<ISupervisor> & { id: string }, dataSource: DataSource): Promise<ISupervisorDoc | null> | never {
    try {
      const supervisorRepository = dataSource.getRepository(SupervisorEntity);
      const { id, ...updateData } = validatedReq;
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid supervisor ID format");
      }
      await supervisorRepository.update(id, updateData);
      const updatedSupervisor = await supervisorRepository.findOne({
        where: { id },
      });
      return updatedSupervisor as unknown as ISupervisorDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteSupervisor(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const supervisorRepository = dataSource.getRepository(SupervisorEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid supervisor ID format");
      }
      const result = await supervisorRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisedCandidates(supervisorId: string, dataSource: DataSource): Promise<Array<ICandDoc & { submissionStats: { total: number; approved: number; pending: number; rejected: number } }>> | never {
    try {
      // Validate UUID format (supervisor now uses MariaDB UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(supervisorId)) {
        throw new Error("Invalid supervisor ID format");
      }
      
      // Get all submissions for this supervisor
      const submissions = await this.subService.getSubsBySupervisorId(supervisorId, dataSource);
      
      // Extract unique candidates and calculate statistics
      const candidateMap = new Map<string, {
        candidate: ICandDoc;
        stats: { total: number; approved: number; pending: number; rejected: number };
      }>();
      
      submissions.forEach((sub: ISubDoc) => {
        // Only process candidate submissions (supervisor submissions have candDocId = null)
        if ((sub as any).submissionType === "supervisor" || !sub.candDocId) return;
        // candDocId is populated, so it's an object
        const candidate = sub.candDocId as any;
        const candidateId = candidate._id ? candidate._id.toString() : candidate.toString();
        
        if (!candidateMap.has(candidateId)) {
          candidateMap.set(candidateId, {
            candidate: candidate as ICandDoc,
            stats: { total: 0, approved: 0, pending: 0, rejected: 0 }
          });
        }
        
        const entry = candidateMap.get(candidateId)!;
        entry.stats.total++;
        
        if (sub.subStatus === "approved") {
          entry.stats.approved++;
        } else if (sub.subStatus === "pending") {
          entry.stats.pending++;
        } else if (sub.subStatus === "rejected") {
          entry.stats.rejected++;
        }
      });
      
      // Convert map to array and add stats to candidate objects
      const result = Array.from(candidateMap.values()).map(entry => ({
        ...entry.candidate,
        submissionStats: entry.stats
      }));
      
      return result;
    } catch (err: any) {
      throw new Error(err);
    }
  }

}
