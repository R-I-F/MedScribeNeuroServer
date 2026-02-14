import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { StatusCodes } from "http-status-codes";
import { getInstitutionById } from "../institution/institution.service";
import { BundlerService } from "./bundler.service";
import { IBundlerDoc, ICandidateDashboardDoc, IPracticalCandidateDashboardDoc } from "./bundler.interface";

@injectable()
export class BundlerController {
  constructor(@inject(BundlerService) private bundlerService: BundlerService) {}

  public async handleGetAll(req: Request, res: Response): Promise<IBundlerDoc> | never {
    const dataSource = (req as any).institutionDataSource;
    const institutionId = (req as any).institutionId;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    if (!institutionId) {
      throw new Error("Institution ID not resolved");
    }
    return await this.bundlerService.getAll(dataSource, institutionId);
  }

  public async handleGetCandidateDashboard(
    req: Request,
    res: Response
  ): Promise<ICandidateDashboardDoc | IPracticalCandidateDashboardDoc | void> {
    const institutionId = (req as any).institutionId as string | undefined;
    if (!institutionId) {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Institution ID not resolved" });
      return;
    }
    const institution = await getInstitutionById(institutionId);
    if (!institution) {
      res.status(StatusCodes.NOT_FOUND).json({ error: "Institution not found" });
      return;
    }
    if (!institution.isActive) {
      res.status(StatusCodes.FORBIDDEN).json({ error: "Institution is not active" });
      return;
    }
    if (!institution.isPractical) {
      res.status(StatusCodes.FORBIDDEN).json({
        error:
          "Dashboard bundle is only available for institutions with practical training. Use the individual endpoints instead.",
      });
      return;
    }
    return await this.bundlerService.getCandidateDashboard(req, res, institution);
  }
}
