import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { StatusCodes } from "http-status-codes";
import { getInstitutionById } from "../institution/institution.service";
import { BundlerService } from "./bundler.service";
import { ReferenceReadProvider } from "../referenceRead/referenceRead.provider";
import { IBundlerDoc, ICandidateDashboardDoc, IPracticalCandidateDashboardDoc } from "./bundler.interface";

@injectable()
export class BundlerController {
  constructor(
    @inject(BundlerService) private bundlerService: BundlerService,
    @inject(ReferenceReadProvider) private refReadProvider: ReferenceReadProvider
  ) {}

  public async handleGetAll(req: Request, res: Response): Promise<IBundlerDoc> | never {
    const dataSource = (req as any).institutionDataSource;
    const institutionId = (req as any).institutionId;
    if (!dataSource) {
      throw new Error("Institution DataSource not resolved");
    }
    if (!institutionId) {
      throw new Error("Institution ID not resolved");
    }

    // Equipment/consumables in the bundle are department-scoped mirror reads:
    // JWT departmentId claim → REF_DEPT_CODE (the institute's default department).
    let departmentId = (res.locals as any)?.jwt?.departmentId as string | undefined;
    if (!departmentId || !(await this.refReadProvider.departmentExists(dataSource, departmentId))) {
      const code = process.env.REF_DEPT_CODE || "NS";
      const resolved = await this.refReadProvider.resolveDepartmentId(dataSource, code);
      if (!resolved) {
        throw new Error(`Default department code not in mirror: ${code}`);
      }
      departmentId = resolved;
    }

    return await this.bundlerService.getAll(dataSource, institutionId, departmentId);
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
