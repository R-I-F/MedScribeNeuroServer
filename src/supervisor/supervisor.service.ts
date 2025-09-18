import { inject, injectable } from "inversify";
import { ISupervisor, ISupervisorDoc } from "./supervisor.interface";
import { Model } from "mongoose";
import { Supervisor } from "./supervisor.schema";
import { SupervisorProvider } from "./supervisor.provider";

@injectable()
export class SupervisorService {
  constructor(@inject(SupervisorProvider) private supervisorProvider: SupervisorProvider) {}

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
}
