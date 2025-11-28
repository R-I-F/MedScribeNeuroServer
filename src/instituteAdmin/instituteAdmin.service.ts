import { inject, injectable } from "inversify";
import { IInstituteAdmin, IInstituteAdminDoc } from "./instituteAdmin.interface";
import { InstituteAdminProvider } from "./instituteAdmin.provider";

@injectable()
export class InstituteAdminService {
  constructor(@inject(InstituteAdminProvider) private instituteAdminProvider: InstituteAdminProvider) {}

  public async createInstituteAdmin(validatedReq: Partial<IInstituteAdmin>): Promise<IInstituteAdminDoc> | never {
    try {
      return await this.instituteAdminProvider.createInstituteAdmin(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllInstituteAdmins(): Promise<IInstituteAdminDoc[]> | never {
    try {
      return await this.instituteAdminProvider.getAllInstituteAdmins();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getInstituteAdminById(validatedReq: { id: string }): Promise<IInstituteAdminDoc | null> | never {
    try {
      return await this.instituteAdminProvider.getInstituteAdminById(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getInstituteAdminByEmail(email: string): Promise<IInstituteAdminDoc | null> | never {
    try {
      return await this.instituteAdminProvider.getInstituteAdminByEmail(email);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateInstituteAdmin(validatedReq: Partial<IInstituteAdmin> & { id: string }): Promise<IInstituteAdminDoc | null> | never {
    try {
      return await this.instituteAdminProvider.updateInstituteAdmin(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteInstituteAdmin(validatedReq: { id: string }): Promise<boolean> | never {
    try {
      return await this.instituteAdminProvider.deleteInstituteAdmin(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

