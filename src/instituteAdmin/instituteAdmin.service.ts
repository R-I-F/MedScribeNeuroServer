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

  /** Department scope of the calling admin (DB row, not JWT claim); null = institution-wide. */
  public async getAdminDepartmentScope(adminId: string | undefined, dataSource: DataSource): Promise<string | null> {
    try {
      return await this.instituteAdminProvider.getAdminDepartmentScope(adminId, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  // Dashboard endpoints
  public async getAllSupervisors(dataSource: DataSource, departmentId?: string | null) {
    try {
      return await this.instituteAdminProvider.getAllSupervisors(dataSource, departmentId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getSupervisorSubmissions(supervisorId: string, status: "approved" | "pending" | "rejected" | undefined, dataSource: DataSource, departmentId?: string | null) {
    try {
      return await this.instituteAdminProvider.getSupervisorSubmissions(supervisorId, status, dataSource, departmentId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async generateSupervisorReportPdf(
    supervisorId: string,
    dataSource: DataSource,
    institution: import("../institution/institution.service").IInstitution,
    departmentId?: string | null
  ): Promise<{ buffer: Buffer; suggestedFilename: string }> {
    try {
      return await this.instituteAdminProvider.generateSupervisorReportPdf(supervisorId, dataSource, institution, departmentId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async generateSupervisorsReportPdf(
    dataSource: DataSource,
    institution: import("../institution/institution.service").IInstitution,
    departmentId?: string | null
  ): Promise<{ buffer: Buffer; suggestedFilename: string }> {
    try {
      return await this.instituteAdminProvider.generateSupervisorsReportPdf(dataSource, institution, departmentId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllCandidates(dataSource: DataSource, departmentId?: string | null) {
    try {
      return await this.instituteAdminProvider.getAllCandidates(dataSource, departmentId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissions(candidateId: string, dataSource: DataSource, departmentId?: string | null) {
    try {
      return await this.instituteAdminProvider.getCandidateSubmissions(candidateId, dataSource, departmentId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSubmissionById(candidateId: string, submissionId: string, dataSource: DataSource, departmentId?: string | null) {
    try {
      return await this.instituteAdminProvider.getCandidateSubmissionById(candidateId, submissionId, dataSource, departmentId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCalendarProcedures(filters: {
    hospitalId?: string;
    procTitle?: string;
    procNumCode?: string;
    month?: number;
    year?: number;
    startDate?: Date;
    endDate?: Date;
  }, dataSource: DataSource, departmentId?: string | null) {
    try {
      return await this.instituteAdminProvider.getCalendarProcedures(filters, dataSource, departmentId);
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

  public async getHospitalAnalysis(filters: {
    hospitalId?: string;
    month?: number;
    year?: number;
    startDate?: Date;
    endDate?: Date;
    groupBy?: "title" | "alphaCode";
  }, dataSource: DataSource, departmentId?: string | null) {
    try {
      return await this.instituteAdminProvider.getHospitalAnalysis(filters, dataSource, departmentId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateDashboards(
    params: { page: number; pageSize: number },
    dataSource: DataSource,
    institution: import("../institution/institution.service").IInstitution,
    departmentId?: string | null
  ) {
    try {
      return await this.instituteAdminProvider.getCandidateDashboards(params, dataSource, institution, departmentId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateSummaryList(
    params: { search?: string },
    dataSource: DataSource,
    institution: import("../institution/institution.service").IInstitution,
    departmentId?: string | null
  ) {
    try {
      return await this.instituteAdminProvider.getCandidateSummaryList(params, dataSource, institution, departmentId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandidateDashboardByCandidateId(
    candidateId: string,
    dataSource: DataSource,
    institution: import("../institution/institution.service").IInstitution,
    departmentId?: string | null
  ) {
    try {
      return await this.instituteAdminProvider.getCandidateDashboardByCandidateId(
        candidateId,
        dataSource,
        institution,
        departmentId
      );
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async generateCandidateReportPdf(
    candidateId: string,
    dataSource: DataSource,
    institution: import("../institution/institution.service").IInstitution,
    departmentId?: string | null
  ): Promise<{ buffer: Buffer; suggestedFilename: string }> {
    try {
      return await this.instituteAdminProvider.generateCandidateReportPdf(
        candidateId,
        dataSource,
        institution,
        departmentId
      );
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async generateSubmissionReportPdf(
    submissionId: string,
    dataSource: DataSource,
    institution: import("../institution/institution.service").IInstitution,
    departmentId?: string | null
  ): Promise<{ buffer: Buffer; suggestedFilename: string }> {
    try {
      return await this.instituteAdminProvider.generateSubmissionReportPdf(
        submissionId,
        dataSource,
        institution,
        departmentId
      );
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

