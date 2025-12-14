import { inject, injectable } from "inversify";
import { ISupervisor, ISupervisorDoc } from "./supervisor.interface";
import { Supervisor } from "./supervisor.schema";
import { Types } from "mongoose";
import { SubService } from "../sub/sub.service";
import { ISubDoc } from "../sub/interfaces/sub.interface";
import { ICandDoc } from "../cand/cand.interface";

@injectable()
export class SupervisorProvider {
  constructor(@inject(SubService) private subService: SubService) {}
  public async createSupervisor(validatedReq: Partial<ISupervisor>): Promise<ISupervisorDoc> | never {
    try {
      const supervisor = new Supervisor(validatedReq);
      return await supervisor.save();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllSupervisors(): Promise<ISupervisorDoc[]> | never {
    try {
      return await Supervisor.find().exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorById(id: string): Promise<ISupervisorDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid supervisor ID");
      }
      return await Supervisor.findById(id).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorByEmail(email: string): Promise<ISupervisorDoc | null> | never {
    try {
      return await Supervisor.findOne({ email }).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateSupervisor(validatedReq: Partial<ISupervisor> & { id: string }): Promise<ISupervisorDoc | null> | never {
    try {
      const { id, ...updateData } = validatedReq;
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid supervisor ID");
      }
      return await Supervisor.findByIdAndUpdate(id, updateData, { new: true }).exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteSupervisor(id: string): Promise<boolean> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid supervisor ID");
      }
      const result = await Supervisor.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisedCandidates(supervisorId: string): Promise<Array<ICandDoc & { submissionStats: { total: number; approved: number; pending: number; rejected: number } }>> | never {
    try {
      if (!Types.ObjectId.isValid(supervisorId)) {
        throw new Error("Invalid supervisor ID");
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
