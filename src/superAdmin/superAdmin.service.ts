import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { ISuperAdmin, ISuperAdminDoc } from "./superAdmin.interface";
import { SuperAdminProvider } from "./superAdmin.provider";

@injectable()
export class SuperAdminService {
  constructor(@inject(SuperAdminProvider) private superAdminProvider: SuperAdminProvider) {}

  public async createSuperAdmin(validatedReq: Partial<ISuperAdmin>, dataSource: DataSource): Promise<ISuperAdminDoc> | never {
    try {
      return await this.superAdminProvider.createSuperAdmin(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllSuperAdmins(dataSource: DataSource): Promise<ISuperAdminDoc[]> | never {
    try {
      return await this.superAdminProvider.getAllSuperAdmins(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSuperAdminById(validatedReq: { id: string }, dataSource: DataSource): Promise<ISuperAdminDoc | null> | never {
    try {
      return await this.superAdminProvider.getSuperAdminById(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSuperAdminByEmail(email: string, dataSource: DataSource): Promise<ISuperAdminDoc | null> | never {
    try {
      return await this.superAdminProvider.getSuperAdminByEmail(email, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateSuperAdmin(validatedReq: Partial<ISuperAdmin> & { id: string }, dataSource: DataSource): Promise<ISuperAdminDoc | null> | never {
    try {
      return await this.superAdminProvider.updateSuperAdmin(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteSuperAdmin(validatedReq: { id: string }, dataSource: DataSource): Promise<boolean> | never {
    try {
      return await this.superAdminProvider.deleteSuperAdmin(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

