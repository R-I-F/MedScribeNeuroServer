import { inject, injectable } from "inversify";
import { HospitalService } from "./hospital.service";
import { IHospital } from "./hospital.interface";
import { Request, Response } from "express";

@injectable()
export class HospitalController {
  constructor(
    @inject(HospitalService) private hospitalService: HospitalService
  ) {}
  public async handlePostHospital(
    req: Request<{}, {}, IHospital>,
    res: Response
  ) {
    try {
      const newHospital = await this.hospitalService.createHospital(req.body);
      return newHospital;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
