import { inject, injectable } from "inversify";
import { IHospital, IHospitalDoc } from "./hospital.interface";
import { AppDataSource } from "../config/database.config";
import { HospitalEntity } from "./hospital.mDbSchema";
import { Repository } from "typeorm";

@injectable()
export class HospitalService {
  private hospitalRepository: Repository<HospitalEntity>;

  constructor() {
    this.hospitalRepository = AppDataSource.getRepository(HospitalEntity);
  }

  public async createHospital(hospitalData: IHospital): Promise<IHospitalDoc> | never {
    try {
      const newHospital = this.hospitalRepository.create(hospitalData);
      const savedHospital = await this.hospitalRepository.save(newHospital);
      return savedHospital as unknown as IHospitalDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllHospitals(): Promise<IHospitalDoc[]> | never {
    try {
      const allHospitals = await this.hospitalRepository.find({
        order: { createdAt: "DESC" },
      });
      return allHospitals as unknown as IHospitalDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteHospital(id: string): Promise<boolean> | never {
    try {
      const result = await this.hospitalRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
