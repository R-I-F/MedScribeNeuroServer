import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { ClerkService } from "./clerk.service";
import { IClerk } from "./clerk.interface";
import bcryptjs from "bcryptjs";
import { stripPassword } from "../utils/stripPassword";

@injectable()
export class ClerkController {
  constructor(
    @inject(ClerkService) private clerkService: ClerkService
  ) {}

  /** Reject department ids that don't exist in the mirror `departments` table. */
  private async assertDepartmentExists(departmentId: string, dataSource: any): Promise<void> {
    const rows = await dataSource.query(`SELECT 1 FROM "departments" WHERE "id" = $1`, [departmentId]);
    if (!rows.length) {
      throw new Error(`Unknown departmentId: ${departmentId}`);
    }
  }

  public async handlePostClerk(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as Partial<IClerk>;
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      if (validatedReq.departmentId) {
        await this.assertDepartmentExists(validatedReq.departmentId, dataSource);
      }
      // Hash password before saving
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return stripPassword(await this.clerkService.createClerk(validatedReq, dataSource));
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllClerks(
    req: Request, 
    res: Response
  ) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return stripPassword(await this.clerkService.getAllClerks(dataSource));
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetClerkById(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return stripPassword(await this.clerkService.getClerkById(validatedReq, dataSource));
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateClerk(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as Partial<IClerk> & { id: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      // Hash password if it's being updated
      if (validatedReq.password) {
        validatedReq.password = await bcryptjs.hash(validatedReq.password, 10);
      }
      return stripPassword(await this.clerkService.updateClerk(validatedReq, dataSource));
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteClerk(
    req: Request, 
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const deleted = await this.clerkService.deleteClerk(validatedReq, dataSource);
      return { message: "Clerk deleted successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
