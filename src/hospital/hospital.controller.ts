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

  public async handleDeleteHospital(
    req: Request,
    res: Response
  ): Promise<{ message: string }> | never {
    const id = req.params.id;
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
