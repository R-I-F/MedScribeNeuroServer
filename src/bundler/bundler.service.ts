import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { Request, Response } from "express";
import { IInstitution } from "../institution/institution.service";
import { IBundlerDoc, ICandidateDashboardDoc, IPracticalCandidateDashboardDoc } from "./bundler.interface";
import { BundlerProvider } from "./bundler.provider";

@injectable()
export class BundlerService {
  constructor(@inject(BundlerProvider) private bundlerProvider: BundlerProvider) {}

  public async getAll(dataSource: DataSource, institutionId: string): Promise<IBundlerDoc> {
    return await this.bundlerProvider.getAll(dataSource, institutionId);
  }

  public async getCandidateDashboard(
    req: Request,
    res: Response,
    institution: IInstitution
  ): Promise<ICandidateDashboardDoc | IPracticalCandidateDashboardDoc> {
    if (institution.isAcademic && institution.isPractical) {
      return await this.bundlerProvider.getCandidateDashboard(req, res, institution);
    }
    if (institution.isPractical && !institution.isAcademic) {
      return await this.bundlerProvider.getCandidateDashboardPractical(req, res);
    }
    throw new Error("Dashboard bundle is only available for practical or academic-and-practical institutions.");
  }
}
