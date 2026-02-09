import { inject, injectable } from "inversify";
import { HospitalService } from "./hospital.service";
import { IHospital, IHospitalDoc } from "./hospital.interface";
import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { DataSource } from "typeorm";
import { AppDataSource } from "../config/database.config";

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

  public async handleGetAllHospitals(
    req: Request,
    res: Response
  ): Promise<IHospitalDoc[]> | never {
    try {
      const dataSource = (req as any).institutionDataSource || AppDataSource;
      return await this.hospitalService.getAllHospitals(dataSource);
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
