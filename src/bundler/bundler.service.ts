import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { Request, Response } from "express";
import { IBundlerDoc, ICandidateDashboardDoc } from "./bundler.interface";
import { BundlerProvider } from "./bundler.provider";

@injectable()
export class BundlerService {
  constructor(@inject(BundlerProvider) private bundlerProvider: BundlerProvider) {}

  public async getAll(dataSource: DataSource, institutionId: string): Promise<IBundlerDoc> {
    return await this.bundlerProvider.getAll(dataSource, institutionId);
  }

  public async getCandidateDashboard(req: Request, res: Response): Promise<ICandidateDashboardDoc> {
    return await this.bundlerProvider.getCandidateDashboard(req, res);
  }
}
