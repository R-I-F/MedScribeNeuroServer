import { inject, injectable } from "inversify";
import { IHospital } from "./hospital.interface";
import { Hospital } from "./hospital.schema";
import { Model } from "mongoose";

@injectable()
export class HospitalService {
  private hospitalModel: Model<IHospital> = Hospital;

  public async createHospital(hospitalData: IHospital) {
    const newHospital = await new this.hospitalModel(hospitalData).save();
    return newHospital;
  }
}
