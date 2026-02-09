import bcryptjs from "bcryptjs";
import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { SuperAdminService } from "./superAdmin.service";
import { ISuperAdmin } from "./superAdmin.interface";

@injectable()
export class SuperAdminController {
  constructor(
    @inject(SuperAdminService) private superAdminService: SuperAdminService
  ) {}

  public async handlePostSuperAdmin(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as Partial<ISuperAdmin>;
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      // Hash password before saving
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return await this.superAdminService.createSuperAdmin(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllSuperAdmins(
    req: Request, 
    res: Response
  ) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.superAdminService.getAllSuperAdmins(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetSuperAdminById(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.superAdminService.getSuperAdminById(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateSuperAdmin(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as Partial<ISuperAdmin> & { id: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      // Hash password if it's being updated
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return await this.superAdminService.updateSuperAdmin(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteSuperAdmin(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.superAdminService.deleteSuperAdmin(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

