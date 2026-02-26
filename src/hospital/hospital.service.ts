import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IHospital, IHospitalDoc } from "./hospital.interface";
import { HospitalEntity } from "./hospital.mDbSchema";
import { UtilService } from "../utils/utils.service";

@injectable()
export class HospitalService {
  constructor(@inject(UtilService) private utilService: UtilService) {}

  public async createHospital(hospitalData: IHospital, dataSource: DataSource): Promise<IHospitalDoc> | never {
    try {
      const hospitalRepository = dataSource.getRepository(HospitalEntity);
      const sanitized = {
        ...hospitalData,
        arabName: this.utilService.sanitizeLabel(hospitalData.arabName),
        engName: this.utilService.sanitizeLabel(hospitalData.engName),
      };
      const newHospital = hospitalRepository.create(sanitized);
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

  public async updateHospital(
    id: string,
    updateData: Partial<IHospital>,
    dataSource: DataSource
  ): Promise<IHospitalDoc | null> | never {
    try {
      const hospitalRepository = dataSource.getRepository(HospitalEntity);
      const existing = await hospitalRepository.findOne({ where: { id } });
      if (!existing) return null;
      if (updateData.arabName !== undefined) existing.arabName = this.utilService.sanitizeLabel(updateData.arabName);
      if (updateData.engName !== undefined) existing.engName = this.utilService.sanitizeLabel(updateData.engName);
      if (updateData.location !== undefined) {
        existing.location = { ...(existing.location || {}), ...updateData.location };
      }
      const saved = await hospitalRepository.save(existing);
      return saved as unknown as IHospitalDoc;
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
