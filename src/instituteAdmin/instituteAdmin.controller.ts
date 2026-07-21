import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { InstituteAdminService } from "./instituteAdmin.service";
import { IInstituteAdmin } from "./instituteAdmin.interface";
import { AuthTokenService } from "../auth/authToken.service";
import { UserRole } from "../types/role.types";
import { JwtPayload } from "../middleware/authorize.middleware";
import { setAuthCookies } from "../utils/cookie.utils";

@injectable()
export class InstituteAdminController {
  constructor(
    @inject(InstituteAdminService) private instituteAdminService: InstituteAdminService,
    @inject(AuthTokenService) private authTokenService: AuthTokenService
  ) {}

  /** Reject department ids that don't exist in the mirror `departments` table. */
  private async assertDepartmentExists(departmentId: string, dataSource: any): Promise<void> {
    const rows = await dataSource.query(`SELECT 1 FROM "departments" WHERE "id" = $1`, [departmentId]);
    if (!rows.length) {
      throw new Error(`Unknown departmentId: ${departmentId}`);
    }
  }

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
      const admin = await this.instituteAdminService.getInstituteAdminById(validatedReq, dataSource);
      if (!admin) return admin;
      // Never ship the bcrypt hash to the client
      const { password: _omit, ...safe } = admin as any;
      return safe;
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
      const switchingDept = validatedReq.departmentId !== undefined;
      if (switchingDept) {
        await this.assertDepartmentExists(validatedReq.departmentId as string, dataSource);
      }
      // Hash password if it's being updated
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      const updated = await this.instituteAdminService.updateInstituteAdmin(validatedReq, dataSource);

      // Self-service department switch: the departmentId JWT claim drives dept-scoped reads
      // (events, calSurg, references) — re-issue BOTH tokens so the switch takes effect
      // immediately. extractJWT prefers the auth_token COOKIE over the Authorization header,
      // and the refresh flow re-signs from the refresh token's claims, so both cookies must
      // be replaced or the old department would keep winning/resurface.
      const jwtPayload = res.locals.jwt as JwtPayload | undefined;
      const callerId = jwtPayload?.id ?? jwtPayload?._id;
      const isSelfSwitch =
        updated && switchingDept && jwtPayload?.role === UserRole.INSTITUTE_ADMIN && callerId === validatedReq.id;
      if (!updated) return updated;
      // Never ship the bcrypt hash to the client
      const { password: _omit, ...safe } = updated as any;
      if (isSelfSwitch) {
        const signPayload = {
          email: updated.email,
          role: UserRole.INSTITUTE_ADMIN,
          id: validatedReq.id,
          departmentId: (updated as any).departmentId ?? undefined,
        };
        const token = await this.authTokenService.sign(signPayload);
        const refreshToken = await this.authTokenService.signRefreshToken(signPayload);
        setAuthCookies(res, token, refreshToken);
        return { ...safe, token } as any;
      }
      return safe;
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

  /**
   * Department scope for the calling admin, resolved from their DB row (the JWT departmentId
   * claim can go stale after a department change). Null = institution-wide access (admin row
   * without a department, or a super admin — no institute_admins row at all).
   */
  private async getAdminDepartmentScope(res: Response, dataSource: any): Promise<string | null> {
    const jwtPayload = res.locals.jwt as { id?: string; _id?: string } | undefined;
    return this.instituteAdminService.getAdminDepartmentScope(jwtPayload?.id || jwtPayload?._id, dataSource);
  }

  // Dashboard endpoints
  public async handleGetAllSupervisors(req: Request, res: Response) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const departmentId = await this.getAdminDepartmentScope(res, dataSource);
      return await this.instituteAdminService.getAllSupervisors(dataSource, departmentId);
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
      const departmentId = await this.getAdminDepartmentScope(res, dataSource);
      return await this.instituteAdminService.getSupervisorSubmissions(validatedReq.supervisorId, validatedReq.status, dataSource, departmentId);
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
      const departmentId = await this.getAdminDepartmentScope(res, dataSource);
      const { buffer: pdfBuffer, suggestedFilename } = await this.instituteAdminService.generateSupervisorReportPdf(
        validatedReq.supervisorId,
        dataSource,
        institution,
        departmentId
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
      const departmentId = await this.getAdminDepartmentScope(res, dataSource);
      const { buffer: pdfBuffer, suggestedFilename } = await this.instituteAdminService.generateSupervisorsReportPdf(
        dataSource,
        institution,
        departmentId
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
      const departmentId = await this.getAdminDepartmentScope(res, dataSource);
      return await this.instituteAdminService.getAllCandidates(dataSource, departmentId);
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
      const departmentId = await this.getAdminDepartmentScope(res, dataSource);
      return await this.instituteAdminService.getCandidateDashboards({ page, pageSize }, dataSource, institution, departmentId);
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
      const departmentId = await this.getAdminDepartmentScope(res, dataSource);
      return await this.instituteAdminService.getCandidateSummaryList(
        { search: validatedReq.search },
        dataSource,
        institution,
        departmentId
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
      const departmentId = await this.getAdminDepartmentScope(res, dataSource);
      return await this.instituteAdminService.getCandidateDashboardByCandidateId(
        validatedReq.candidateId,
        dataSource,
        institution,
        departmentId
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
      const departmentId = await this.getAdminDepartmentScope(res, dataSource);
      const { buffer: pdfBuffer, suggestedFilename } = await this.instituteAdminService.generateCandidateReportPdf(
        validatedReq.candidateId,
        dataSource,
        institution,
        departmentId
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
      const departmentId = await this.getAdminDepartmentScope(res, dataSource);
      const { buffer: pdfBuffer, suggestedFilename } = await this.instituteAdminService.generateSubmissionReportPdf(
        validatedReq.submissionId,
        dataSource,
        institution,
        departmentId
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
      const departmentId = await this.getAdminDepartmentScope(res, dataSource);
      return await this.instituteAdminService.getCandidateSubmissions(validatedReq.candidateId, dataSource, departmentId);
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
      const departmentId = await this.getAdminDepartmentScope(res, dataSource);
      return await this.instituteAdminService.getCandidateSubmissionById(
        validatedReq.candidateId,
        validatedReq.submissionId,
        dataSource,
        departmentId
      );
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCalendarProcedures(req: Request, res: Response) {
    const validatedReq = matchedData(req) as {
      hospitalId?: string;
      procTitle?: string;
      procNumCode?: string;
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
        procTitle: validatedReq.procTitle,
        procNumCode: validatedReq.procNumCode,
        month: validatedReq.month,
        year: validatedReq.year
      };

      if (validatedReq.startDate) {
        filters.startDate = new Date(validatedReq.startDate);
      }
      if (validatedReq.endDate) {
        filters.endDate = new Date(validatedReq.endDate);
      }

      const departmentId = await this.getAdminDepartmentScope(res, dataSource);
      return await this.instituteAdminService.getCalendarProcedures(filters, dataSource, departmentId);
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

      const departmentId = await this.getAdminDepartmentScope(res, dataSource);
      return await this.instituteAdminService.getHospitalAnalysis(filters, dataSource, departmentId);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

