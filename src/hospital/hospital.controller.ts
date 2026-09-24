import { inject, injectable } from "inversify";
import { HospitalService } from "./hospital.service";
import { IHospital, IHospitalDoc } from "./hospital.interface";
import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { DataSource } from "typeorm";
import { AppDataSource } from "../config/database.config";
import { UserRole } from "../types/role.types";

@injectable()
export class HospitalController {
  constructor(
    @inject(HospitalService) private hospitalService: HospitalService
  ) {}
  
  public async handlePostHospital(
    req: Request,
    res: Response
  ): Promise<IHospitalDoc> | never {
    try {
      const validatedReq = matchedData(req) as IHospital;
      const dataSource = (req as any).institutionDataSource || AppDataSource;
      const newHospital = await this.hospitalService.createHospital(validatedReq, dataSource);
      return newHospital;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /** Default department (REF_DEPT_CODE, NS) resolved against the mirror. */
  private async getDefaultDepartmentId(dataSource: DataSource): Promise<string | null> {
    const code = process.env.REF_DEPT_CODE || "NS";
    const rows = await dataSource.query(`SELECT "id" FROM "departments" WHERE "code" = $1`, [code]);
    return rows[0]?.id ?? null;
  }

  /**
   * Department resolution for the hospital list, mirroring the calSurg surfaces:
   * the caller's JWT department claim → an explicit deptCode → the NS default.
   */
  private async resolveDepartmentId(
    dataSource: DataSource,
    jwtDepartmentId?: string,
    deptCode?: string
  ): Promise<string | null> {
    let departmentId = jwtDepartmentId ?? null;
    if (!departmentId && deptCode) {
      const rows = await dataSource.query(`SELECT "id" FROM "departments" WHERE "code" = $1`, [deptCode]);
      departmentId = rows[0]?.id ?? null;
    }
    if (!departmentId) departmentId = await this.getDefaultDepartmentId(dataSource);
    return departmentId;
  }

  public async handleGetAllHospitals(
    req: Request,
    res: Response
  ): Promise<IHospitalDoc[]> | never {
    try {
      const dataSource = (req as any).institutionDataSource || AppDataSource;
      const jwt = (res as any).locals?.jwt as { role?: string; departmentId?: string } | undefined;

      // The super admin provisions hospitals for every department, so the management list
      // stays institution-wide. Everyone else picks from their own department only.
      if (jwt?.role === UserRole.SUPER_ADMIN) {
        return await this.hospitalService.getAllHospitals(dataSource);
      }

      const deptCode = (req.query.deptCode as string) || undefined;
      const departmentId = await this.resolveDepartmentId(dataSource, jwt?.departmentId, deptCode);
      return await this.hospitalService.getAllHospitals(dataSource, departmentId);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetHospitalById(
    req: Request,
    res: Response
  ): Promise<IHospitalDoc | null> | never {
    try {
      const { id } = matchedData(req) as { id: string };
      const dataSource = (req as any).institutionDataSource || AppDataSource;
      return await this.hospitalService.getHospitalById(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePutHospital(
    req: Request,
    res: Response
  ): Promise<IHospitalDoc | null> | never {
    const id = req.params.id;
    const dataSource = (req as any).institutionDataSource || AppDataSource;
    const validatedReq = matchedData(req) as Partial<IHospital>;
    return await this.hospitalService.updateHospital(id, validatedReq, dataSource);
  }

  public async handleDeleteHospital(
    req: Request,
    res: Response
  ): Promise<{ message: string }> | never {
    const { id } = matchedData(req) as { id: string };
    try {
      const dataSource = (req as any).institutionDataSource || AppDataSource;
      const deleted = await this.hospitalService.deleteHospital(id, dataSource);
      if (!deleted) {
        throw new Error("Hospital not found");
      }
      return { message: "Hospital deleted successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
