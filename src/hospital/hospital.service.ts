import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IHospital, IHospitalDoc } from "./hospital.interface";
import { AppDataSource } from "../config/database.config";
import { HospitalEntity } from "./hospital.mDbSchema";
import { Repository } from "typeorm";

@injectable()
export class HospitalService {
  public async createHospital(hospitalData: IHospital, dataSource: DataSource): Promise<IHospitalDoc> | never {
    try {
      const hospitalRepository = dataSource.getRepository(HospitalEntity);
      const newHospital = hospitalRepository.create(hospitalData);
      const savedHospital = await hospitalRepository.save(newHospital);
      return savedHospital as unknown as IHospitalDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllHospitals(dataSource: DataSource): Promise<IHospitalDoc[]> | never {
    try {
      const hospitalRepository = dataSource.getRepository(HospitalEntity);
      const allHospitals = await hospitalRepository.find({
        order: { createdAt: "DESC" },
      });
      return allHospitals as unknown as IHospitalDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getHospitalById(id: string, dataSource: DataSource): Promise<IHospitalDoc | null> | never {
    try {
      const hospitalRepository = dataSource.getRepository(HospitalEntity);
      const hospital = await hospitalRepository.findOne({ where: { id } });
      return hospital as unknown as IHospitalDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteHospital(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const hospitalRepository = dataSource.getRepository(HospitalEntity);
      const result = await hospitalRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
