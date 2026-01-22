import { inject, injectable } from "inversify";
import { IDiagnosis, IDiagnosisDoc } from "./diagnosis.interface";
import { AppDataSource } from "../config/database.config";
import { DiagnosisEntity } from "./diagnosis.mDbSchema";
import { Repository, In, Or } from "typeorm";

@injectable()
export class DiagnosisService {
  private diagnosisRepository: Repository<DiagnosisEntity>;

  constructor() {
    this.diagnosisRepository = AppDataSource.getRepository(DiagnosisEntity);
  }

  public async getAllDiagnoses(): Promise<IDiagnosisDoc[]> | never {
    try {
      const allDiagnoses = await this.diagnosisRepository.find({
        order: { createdAt: "DESC" },
      });
      return allDiagnoses as unknown as IDiagnosisDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createDiagnosis(diagnosisData: IDiagnosis): Promise<IDiagnosisDoc> | never {
    try {
      const newDiagnosis = this.diagnosisRepository.create(diagnosisData);
      const savedDiagnosis = await this.diagnosisRepository.save(newDiagnosis);
      return savedDiagnosis as unknown as IDiagnosisDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkDiagnosis(diagnosisData: IDiagnosis[]): Promise<IDiagnosisDoc[]> | never {
    try {
      const newDiagnoses = this.diagnosisRepository.create(diagnosisData);
      const savedDiagnoses = await this.diagnosisRepository.save(newDiagnoses);
      return savedDiagnoses as unknown as IDiagnosisDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findExistingDiagnosis(icdCode: string, icdName: string): Promise<IDiagnosisDoc | null> | never {
    try {
      const existingDiagnosis = await this.diagnosisRepository.findOne({
        where: [
          { icdCode: icdCode },
          { icdName: icdName }
        ]
      });
      return existingDiagnosis as unknown as IDiagnosisDoc | null;
    } catch (err: any) {
      throw new Error(`Failed to check for existing diagnosis: ${err.message}`);
    }
  }

  public async findByIcdCodes(icdCodes: string[]): Promise<IDiagnosisDoc[]> | never {
    try {
      const foundDiagnoses = await this.diagnosisRepository.find({
        where: { icdCode: In(icdCodes) },
      });
      return foundDiagnoses as unknown as IDiagnosisDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getDiagnosisById(id: string): Promise<IDiagnosisDoc | null> | never {
    try {
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid diagnosis ID format");
      }
      const diagnosis = await this.diagnosisRepository.findOne({
        where: { id },
      });
      return diagnosis as unknown as IDiagnosisDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateDiagnosis(id: string, updateData: Partial<IDiagnosis>): Promise<IDiagnosisDoc | null> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid diagnosis ID format");
      }
      await this.diagnosisRepository.update(id, updateData);
      const updatedDiagnosis = await this.diagnosisRepository.findOne({
        where: { id },
      });
      return updatedDiagnosis as unknown as IDiagnosisDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteDiagnosis(id: string): Promise<boolean> | never {
    try {
      const result = await this.diagnosisRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  // Additional service methods will be added here as needed
}
