import { inject, injectable } from "inversify";
import { ISupervisor, ISupervisorDoc } from "./supervisor.interface";
import { AppDataSource } from "../config/database.config";
import { SupervisorEntity } from "./supervisor.mDbSchema";
import { SupervisorProvider } from "./supervisor.provider";
import { Repository } from "typeorm";

@injectable()
export class SupervisorService {
  private supervisorRepository: Repository<SupervisorEntity>;

  constructor(@inject(SupervisorProvider) private supervisorProvider: SupervisorProvider) {
    this.supervisorRepository = AppDataSource.getRepository(SupervisorEntity);
  }

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
      const result = await this.supervisorRepository.update({}, { password: hashedPassword });
      return result.affected ?? 0;
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
