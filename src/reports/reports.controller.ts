import { injectable, inject } from "inversify";
import { Request, Response } from "express";
import { ReportsProvider } from "./reports.provider";
import { IReportFilters } from "./reports.interface";

@injectable()
export class ReportsController {
  constructor(@inject(ReportsProvider) private reportsProvider: ReportsProvider) {}

  public async handleGetSupervisorsSubmissionCountReport(
    req: Request,
    res: Response
  ): Promise<Buffer> | never {
    try {
      const filters: IReportFilters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const pdfBuffer = await this.reportsProvider.generateSupervisorsSubmissionCountReport(filters);
      return pdfBuffer;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetCandidatesSubmissionCountReport(
    req: Request,
    res: Response
  ): Promise<Buffer> | never {
    try {
      const filters: IReportFilters = {
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
      };

      const pdfBuffer = await this.reportsProvider.generateCandidatesSubmissionCountReport(filters);
      return pdfBuffer;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetHospitalAnalysisReport(
    req: Request,
    res: Response
  ): Promise<Buffer> | never {
    try {
      const filters: IReportFilters = {
        hospitalId: req.query.hospitalId as string | undefined,
        month: req.query.month ? parseInt(req.query.month as string) : undefined,
        year: req.query.year ? parseInt(req.query.year as string) : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        groupBy: (req.query.groupBy as "title" | "alphaCode") || "title",
      };

      const pdfBuffer = await this.reportsProvider.generateHospitalAnalysisReport(filters);
      return pdfBuffer;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

