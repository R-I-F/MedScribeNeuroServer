import { inject, injectable } from "inversify";
import { HospitalService } from "./hospital.service";
import { IHospital, IHospitalDoc } from "./hospital.interface";
import { Request, Response } from "express";
import { matchedData } from "express-validator";

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
      const newHospital = await this.hospitalService.createHospital(validatedReq);
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
      return await this.hospitalService.getAllHospitals();
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
      return await this.hospitalService.getHospitalById(id);
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
      const deleted = await this.hospitalService.deleteHospital(id);
      if (!deleted) {
        throw new Error("Hospital not found");
      }
      return { message: "Hospital deleted successfully" };
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
