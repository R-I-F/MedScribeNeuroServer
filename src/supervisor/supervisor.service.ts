import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { ISupervisor, ISupervisorDoc } from "./supervisor.interface";
import { SupervisorEntity } from "./supervisor.mDbSchema";
import { SupervisorProvider } from "./supervisor.provider";

@injectable()
export class SupervisorService {
  constructor(@inject(SupervisorProvider) private supervisorProvider: SupervisorProvider) {}

  public async createSupervisor(validatedReq: Partial<ISupervisor>, dataSource: DataSource): Promise<ISupervisorDoc> | never {
    try {
      return await this.supervisorProvider.createSupervisor(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllSupervisors(dataSource: DataSource): Promise<ISupervisorDoc[]> | never {
    try {
      return await this.supervisorProvider.getAllSupervisors(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorById(validatedReq: { id: string }, dataSource: DataSource): Promise<ISupervisorDoc | null> | never {
    try {
      return await this.supervisorProvider.getSupervisorById(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorsByIds(ids: string[], dataSource: DataSource): Promise<ISupervisorDoc[]> | never {
    try {
      return await this.supervisorProvider.getSupervisorsByIds(ids, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorByEmail(email: string, dataSource: DataSource): Promise<ISupervisorDoc | null> | never {
    try {
      return await this.supervisorProvider.getSupervisorByEmail(email, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateSupervisor(validatedReq: Partial<ISupervisor> & { id: string }, dataSource: DataSource): Promise<ISupervisorDoc | null> | never {
    try {
      return await this.supervisorProvider.updateSupervisor(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteSupervisor(validatedReq: { id: string }, dataSource: DataSource): Promise<boolean> | never {
    try {
      return await this.supervisorProvider.deleteSupervisor(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async resetAllSupervisorPasswords(
    hashedPassword: string,
    dataSource: DataSource
  ): Promise<number> | never {
    try {
      const supervisorRepository = dataSource.getRepository(SupervisorEntity);
      const result = await supervisorRepository.update({}, { password: hashedPassword });
      return result.affected ?? 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisedCandidates(supervisorId: string, dataSource: DataSource) {
    try {
      return await this.supervisorProvider.getSupervisedCandidates(supervisorId, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

}
