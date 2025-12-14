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

  // Dashboard endpoints
  public async getAllSupervisors() {
    try {
      return await this.instituteAdminProvider.getAllSupervisors();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorSubmissions(supervisorId: string, status?: "approved" | "pending" | "rejected") {
    try {
      return await this.instituteAdminProvider.getSupervisorSubmissions(supervisorId, status);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllCandidates() {
    try {
      return await this.instituteAdminProvider.getAllCandidates();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissions(candidateId: string) {
    try {
      return await this.instituteAdminProvider.getCandidateSubmissions(candidateId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissionById(candidateId: string, submissionId: string) {
    try {
      return await this.instituteAdminProvider.getCandidateSubmissionById(candidateId, submissionId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalendarProcedures(filters: {
    hospitalId?: string;
    arabProcTitle?: string;
    arabProcNumCode?: string;
    month?: number;
    year?: number;
    startDate?: Date;
    endDate?: Date;
  }) {
    try {
      return await this.instituteAdminProvider.getCalendarProcedures(filters);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllHospitals() {
    try {
      return await this.instituteAdminProvider.getAllHospitals();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getArabicProcedures(search?: string) {
    try {
      return await this.instituteAdminProvider.getArabicProcedures(search);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getHospitalAnalysis(filters: {
    hospitalId?: string;
    month?: number;
    year?: number;
    startDate?: Date;
    endDate?: Date;
    groupBy?: "title" | "alphaCode";
  }) {
    try {
      return await this.instituteAdminProvider.getHospitalAnalysis(filters);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

