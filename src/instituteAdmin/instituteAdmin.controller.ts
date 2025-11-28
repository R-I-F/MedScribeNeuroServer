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
      // Hash password before saving
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return await this.instituteAdminService.createInstituteAdmin(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllInstituteAdmins(
    req: Request, 
    res: Response
  ) {
    try {
      return await this.instituteAdminService.getAllInstituteAdmins();
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
      return await this.instituteAdminService.getInstituteAdminById(validatedReq);
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
      // Hash password if it's being updated
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return await this.instituteAdminService.updateInstituteAdmin(validatedReq);
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
      return await this.instituteAdminService.deleteInstituteAdmin(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

