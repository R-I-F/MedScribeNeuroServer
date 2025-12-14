import { inject, injectable } from "inversify";
import { ISupervisor, ISupervisorDoc } from "./supervisor.interface";
import { Model } from "mongoose";
import { Supervisor } from "./supervisor.schema";
import { SupervisorProvider } from "./supervisor.provider";

@injectable()
export class SupervisorService {
  constructor(@inject(SupervisorProvider) private supervisorProvider: SupervisorProvider) {}
  private supervisorModel: Model<ISupervisor> = Supervisor;

  public async createSupervisor(validatedReq: Partial<ISupervisor>): Promise<ISupervisorDoc> | never {
    try {
      return await this.supervisorProvider.createSupervisor(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllSupervisors(): Promise<ISupervisorDoc[]> | never {
    try {
      return await this.supervisorProvider.getAllSupervisors();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorById(validatedReq: { id: string }): Promise<ISupervisorDoc | null> | never {
    try {
      return await this.supervisorProvider.getSupervisorById(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorByEmail(email: string): Promise<ISupervisorDoc | null> | never {
    try {
      return await this.supervisorProvider.getSupervisorByEmail(email);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateSupervisor(validatedReq: Partial<ISupervisor> & { id: string }): Promise<ISupervisorDoc | null> | never {
    try {
      return await this.supervisorProvider.updateSupervisor(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteSupervisor(validatedReq: { id: string }): Promise<boolean> | never {
    try {
      return await this.supervisorProvider.deleteSupervisor(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async resetAllSupervisorPasswords(
    hashedPassword: string
  ): Promise<number> | never {
    try {
      const result = await this.supervisorModel.updateMany({}, { $set: { password: hashedPassword } });
      return (result as { modifiedCount?: number }).modifiedCount ?? 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisedCandidates(supervisorId: string) {
    try {
      return await this.supervisorProvider.getSupervisedCandidates(supervisorId);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
