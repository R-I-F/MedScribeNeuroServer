import { inject, injectable } from "inversify";
import { ISupervisor, ISupervisorDoc } from "./supervisor.interface";
import { AppDataSource } from "../config/database.config";
import { SupervisorEntity } from "./supervisor.mDbSchema";
import { Repository } from "typeorm";
import { SubService } from "../sub/sub.service";
import { ISubDoc } from "../sub/interfaces/sub.interface";
import { ICandDoc } from "../cand/cand.interface";

@injectable()
export class SupervisorProvider {
  private supervisorRepository: Repository<SupervisorEntity>;

  constructor(
    @inject(SubService) private subService: SubService
  ) {
    this.supervisorRepository = AppDataSource.getRepository(SupervisorEntity);
  }

  public async createSupervisor(validatedReq: Partial<ISupervisor>): Promise<ISupervisorDoc> | never {
    try {
      const newSupervisor = this.supervisorRepository.create(validatedReq);
      const savedSupervisor = await this.supervisorRepository.save(newSupervisor);
      return savedSupervisor as unknown as ISupervisorDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllSupervisors(): Promise<ISupervisorDoc[]> | never {
    try {
      const supervisors = await this.supervisorRepository.find({
        order: { createdAt: "DESC" },
      });
      return supervisors as unknown as ISupervisorDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorById(id: string): Promise<ISupervisorDoc | null> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid supervisor ID format");
      }
      const supervisor = await this.supervisorRepository.findOne({
        where: { id },
      });
      return supervisor as unknown as ISupervisorDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorByEmail(email: string): Promise<ISupervisorDoc | null> | never {
    try {
      const supervisor = await this.supervisorRepository.findOne({
        where: { email },
      });
      return supervisor as unknown as ISupervisorDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateSupervisor(validatedReq: Partial<ISupervisor> & { id: string }): Promise<ISupervisorDoc | null> | never {
    try {
      const { id, ...updateData } = validatedReq;
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid supervisor ID format");
      }
      await this.supervisorRepository.update(id, updateData);
      const updatedSupervisor = await this.supervisorRepository.findOne({
        where: { id },
      });
      return updatedSupervisor as unknown as ISupervisorDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteSupervisor(id: string): Promise<boolean> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid supervisor ID format");
      }
      const result = await this.supervisorRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisedCandidates(supervisorId: string): Promise<Array<ICandDoc & { submissionStats: { total: number; approved: number; pending: number; rejected: number } }>> | never {
    try {
      // Validate UUID format (supervisor now uses MariaDB UUID)
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(supervisorId)) {
        throw new Error("Invalid supervisor ID format");
      }
      
      // Get all submissions for this supervisor
      const submissions = await this.subService.getSubsBySupervisorId(supervisorId);
      
      // Extract unique candidates and calculate statistics
      const candidateMap = new Map<string, {
        candidate: ICandDoc;
        stats: { total: number; approved: number; pending: number; rejected: number };
      }>();
      
      submissions.forEach((sub: ISubDoc) => {
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
