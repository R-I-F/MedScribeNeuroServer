import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { InstituteAdminService } from "./instituteAdmin.service";
import { IInstituteAdmin } from "./instituteAdmin.interface";

@injectable()
export class InstituteAdminController {
  constructor(
    @inject(InstituteAdminService) private instituteAdminService: InstituteAdminService
  ) {}

  public async handlePostInstituteAdmin(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as Partial<IInstituteAdmin>;
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      // Hash password before saving
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return await this.instituteAdminService.createInstituteAdmin(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllInstituteAdmins(
    req: Request, 
    res: Response
  ) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.instituteAdminService.getAllInstituteAdmins(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetInstituteAdminById(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.instituteAdminService.getInstituteAdminById(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateInstituteAdmin(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as Partial<IInstituteAdmin> & { id: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      // Hash password if it's being updated
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return await this.instituteAdminService.updateInstituteAdmin(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteInstituteAdmin(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.instituteAdminService.deleteInstituteAdmin(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  // Dashboard endpoints
  public async handleGetAllSupervisors(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.instituteAdminService.getAllSupervisors(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetSupervisorSubmissions(req: Request, res: Response) {
    const validatedReq = matchedData(req) as { supervisorId: string; status?: "approved" | "pending" | "rejected" };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.instituteAdminService.getSupervisorSubmissions(validatedReq.supervisorId, validatedReq.status, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGenerateSupervisorReportPdf(req: Request, res: Response) {
    const validatedReq = matchedData(req) as { supervisorId: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      const institution = (req as any).institution as import("../institution/institution.service").IInstitution | undefined;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      if (!institution) {
        throw new Error("Institution not resolved");
      }
      const { buffer: pdfBuffer, suggestedFilename } = await this.instituteAdminService.generateSupervisorReportPdf(
        validatedReq.supervisorId,
        dataSource,
        institution
      );
      res.setHeader("Content-Type", "application/pdf");
      const safeName = suggestedFilename.replace(/[\r\n"]/g, "").trim() || "Supervisor-Ecertificate.pdf";
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`
      );
      res.send(pdfBuffer);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGenerateSupervisorsReportPdf(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      const institution = (req as any).institution as import("../institution/institution.service").IInstitution | undefined;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      if (!institution) {
        throw new Error("Institution not resolved");
      }
      const { buffer: pdfBuffer, suggestedFilename } = await this.instituteAdminService.generateSupervisorsReportPdf(
        dataSource,
        institution
      );
      res.setHeader("Content-Type", "application/pdf");
      const safeName = suggestedFilename.replace(/[\r\n"]/g, "").trim() || "Supervisors-Ecertificate.pdf";
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`);
      res.send(pdfBuffer);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllCandidates(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.instituteAdminService.getAllCandidates(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandidateDashboards(req: Request, res: Response) {
    const validatedReq = matchedData(req) as { page?: number; pageSize?: number };
    try {
      const dataSource = (req as any).institutionDataSource;
      const institution = (req as any).institution as import("../institution/institution.service").IInstitution | undefined;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      if (!institution) {
        throw new Error("Institution not resolved");
      }
      const page = validatedReq.page && validatedReq.page > 0 ? validatedReq.page : 1;
      const pageSize = validatedReq.pageSize && validatedReq.pageSize > 0 ? validatedReq.pageSize : 20;
      return await this.instituteAdminService.getCandidateDashboards({ page, pageSize }, dataSource, institution);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandidateSummaryList(req: Request, res: Response) {
    const validatedReq = matchedData(req) as { search?: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      const institution = (req as any).institution as import("../institution/institution.service").IInstitution | undefined;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      if (!institution) {
        throw new Error("Institution not resolved");
      }
      return await this.instituteAdminService.getCandidateSummaryList(
        { search: validatedReq.search },
        dataSource,
        institution
      );
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandidateDashboardByCandidateId(req: Request, res: Response) {
    const validatedReq = matchedData(req) as { candidateId: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      const institution = (req as any).institution as import("../institution/institution.service").IInstitution | undefined;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      if (!institution) {
        throw new Error("Institution not resolved");
      }
      return await this.instituteAdminService.getCandidateDashboardByCandidateId(
        validatedReq.candidateId,
        dataSource,
        institution
      );
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGenerateCandidateReportPdf(req: Request, res: Response) {
    const validatedReq = matchedData(req) as { candidateId: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      const institution = (req as any).institution as import("../institution/institution.service").IInstitution | undefined;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      if (!institution) {
        throw new Error("Institution not resolved");
      }
      const { buffer: pdfBuffer, suggestedFilename } = await this.instituteAdminService.generateCandidateReportPdf(
        validatedReq.candidateId,
        dataSource,
        institution
      );
      res.setHeader("Content-Type", "application/pdf");
      const safeName = suggestedFilename.replace(/[\r\n"]/g, "").trim() || "Ecertificate.pdf";
      res.setHeader("Content-Disposition", `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`);
      res.send(pdfBuffer);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetSubmissionReportPdf(req: Request, res: Response) {
    const validatedReq = matchedData(req) as { submissionId: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      const institution = (req as any).institution as import("../institution/institution.service").IInstitution | undefined;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      if (!institution) {
        throw new Error("Institution not resolved");
      }
      const { buffer: pdfBuffer, suggestedFilename } = await this.instituteAdminService.generateSubmissionReportPdf(
        validatedReq.submissionId,
        dataSource,
        institution
      );
      res.setHeader("Content-Type", "application/pdf");
      const safeName = suggestedFilename.replace(/[\r\n"]/g, "").trim() || "Submission-Report.pdf";
      const inline = req.query?.inline === "1" || req.query?.view === "1";
      res.setHeader(
        "Content-Disposition",
        inline
          ? `inline; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`
          : `attachment; filename="${safeName}"; filename*=UTF-8''${encodeURIComponent(safeName)}`
      );
      res.send(pdfBuffer);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandidateSubmissions(req: Request, res: Response) {
    const validatedReq = matchedData(req) as { candidateId: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.instituteAdminService.getCandidateSubmissions(validatedReq.candidateId, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandidateSubmissionById(req: Request, res: Response) {
    const validatedReq = matchedData(req) as { candidateId: string; submissionId: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.instituteAdminService.getCandidateSubmissionById(
        validatedReq.candidateId,
        validatedReq.submissionId,
        dataSource
      );
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCalendarProcedures(req: Request, res: Response) {
    const validatedReq = matchedData(req) as {
      hospitalId?: string;
      arabProcTitle?: string;
      arabProcNumCode?: string;
      month?: number;
      year?: number;
      startDate?: string;
      endDate?: string;
    };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const filters: any = {
        hospitalId: validatedReq.hospitalId,
        arabProcTitle: validatedReq.arabProcTitle,
        arabProcNumCode: validatedReq.arabProcNumCode,
        month: validatedReq.month,
        year: validatedReq.year
      };

      if (validatedReq.startDate) {
        filters.startDate = new Date(validatedReq.startDate);
      }
      if (validatedReq.endDate) {
        filters.endDate = new Date(validatedReq.endDate);
      }

      return await this.instituteAdminService.getCalendarProcedures(filters, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllHospitals(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.instituteAdminService.getAllHospitals(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetArabicProcedures(req: Request, res: Response) {
    const validatedReq = matchedData(req) as { search?: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.instituteAdminService.getArabicProcedures(validatedReq.search, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetHospitalAnalysis(req: Request, res: Response) {
    const validatedReq = matchedData(req) as {
      hospitalId?: string;
      month?: number;
      year?: number;
      startDate?: string;
      endDate?: string;
      groupBy?: "title" | "alphaCode";
    };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const filters: any = {
        hospitalId: validatedReq.hospitalId,
        month: validatedReq.month,
        year: validatedReq.year,
        groupBy: validatedReq.groupBy || "title"
      };

      if (validatedReq.startDate) {
        filters.startDate = new Date(validatedReq.startDate);
      }
      if (validatedReq.endDate) {
        filters.endDate = new Date(validatedReq.endDate);
      }

      return await this.instituteAdminService.getHospitalAnalysis(filters, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

