import { inject, injectable } from "inversify";
import { ISuperAdmin, ISuperAdminDoc } from "./superAdmin.interface";
import { SuperAdminProvider } from "./superAdmin.provider";

@injectable()
export class SuperAdminService {
  constructor(@inject(SuperAdminProvider) private superAdminProvider: SuperAdminProvider) {}

  public async createSuperAdmin(validatedReq: Partial<ISuperAdmin>): Promise<ISuperAdminDoc> | never {
    try {
      return await this.superAdminProvider.createSuperAdmin(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllSuperAdmins(): Promise<ISuperAdminDoc[]> | never {
    try {
      return await this.superAdminProvider.getAllSuperAdmins();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSuperAdminById(validatedReq: { id: string }): Promise<ISuperAdminDoc | null> | never {
    try {
      return await this.superAdminProvider.getSuperAdminById(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSuperAdminByEmail(email: string): Promise<ISuperAdminDoc | null> | never {
    try {
      return await this.superAdminProvider.getSuperAdminByEmail(email);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateSuperAdmin(validatedReq: Partial<ISuperAdmin> & { id: string }): Promise<ISuperAdminDoc | null> | never {
    try {
      return await this.superAdminProvider.updateSuperAdmin(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteSuperAdmin(validatedReq: { id: string }): Promise<boolean> | never {
    try {
      return await this.superAdminProvider.deleteSuperAdmin(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

