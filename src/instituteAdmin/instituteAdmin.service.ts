import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IInstituteAdmin, IInstituteAdminDoc } from "./instituteAdmin.interface";
import { InstituteAdminProvider } from "./instituteAdmin.provider";

@injectable()
export class InstituteAdminService {
  constructor(@inject(InstituteAdminProvider) private instituteAdminProvider: InstituteAdminProvider) {}

  public async createInstituteAdmin(validatedReq: Partial<IInstituteAdmin>, dataSource: DataSource): Promise<IInstituteAdminDoc> | never {
    try {
      return await this.instituteAdminProvider.createInstituteAdmin(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllInstituteAdmins(dataSource: DataSource): Promise<IInstituteAdminDoc[]> | never {
    try {
      return await this.instituteAdminProvider.getAllInstituteAdmins(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getInstituteAdminById(validatedReq: { id: string }, dataSource: DataSource): Promise<IInstituteAdminDoc | null> | never {
    try {
      return await this.instituteAdminProvider.getInstituteAdminById(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getInstituteAdminByEmail(email: string, dataSource: DataSource): Promise<IInstituteAdminDoc | null> | never {
    try {
      return await this.instituteAdminProvider.getInstituteAdminByEmail(email, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateInstituteAdmin(validatedReq: Partial<IInstituteAdmin> & { id: string }, dataSource: DataSource): Promise<IInstituteAdminDoc | null> | never {
    try {
      return await this.instituteAdminProvider.updateInstituteAdmin(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteInstituteAdmin(validatedReq: { id: string }, dataSource: DataSource): Promise<boolean> | never {
    try {
      return await this.instituteAdminProvider.deleteInstituteAdmin(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  // Dashboard endpoints
  public async getAllSupervisors(dataSource: DataSource) {
    try {
      return await this.instituteAdminProvider.getAllSupervisors(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorSubmissions(supervisorId: string, status: "approved" | "pending" | "rejected" | undefined, dataSource: DataSource) {
    try {
      return await this.instituteAdminProvider.getSupervisorSubmissions(supervisorId, status, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllCandidates(dataSource: DataSource) {
    try {
      return await this.instituteAdminProvider.getAllCandidates(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissions(candidateId: string, dataSource: DataSource) {
    try {
      return await this.instituteAdminProvider.getCandidateSubmissions(candidateId, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissionById(candidateId: string, submissionId: string, dataSource: DataSource) {
    try {
      return await this.instituteAdminProvider.getCandidateSubmissionById(candidateId, submissionId, dataSource);
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
  }, dataSource: DataSource) {
    try {
      return await this.instituteAdminProvider.getCalendarProcedures(filters, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllHospitals(dataSource: DataSource) {
    try {
      return await this.instituteAdminProvider.getAllHospitals(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getArabicProcedures(search: string | undefined, dataSource: DataSource) {
    try {
      return await this.instituteAdminProvider.getArabicProcedures(search, dataSource);
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
  }, dataSource: DataSource) {
    try {
      return await this.instituteAdminProvider.getHospitalAnalysis(filters, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

