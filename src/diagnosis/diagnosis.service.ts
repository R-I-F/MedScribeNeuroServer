import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IDiagnosis, IDiagnosisDoc } from "./diagnosis.interface";
import { DiagnosisEntity } from "./diagnosis.mDbSchema";
import { Repository, In, Or } from "typeorm";

@injectable()
export class DiagnosisService {
  public async getAllDiagnoses(dataSource: DataSource): Promise<IDiagnosisDoc[]> | never {
    try {
      const diagnosisRepository = dataSource.getRepository(DiagnosisEntity);
      const allDiagnoses = await diagnosisRepository.find({
        order: { createdAt: "DESC" },
      });
      return allDiagnoses as unknown as IDiagnosisDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createDiagnosis(diagnosisData: IDiagnosis, dataSource: DataSource): Promise<IDiagnosisDoc> | never {
    try {
      const diagnosisRepository = dataSource.getRepository(DiagnosisEntity);
      const newDiagnosis = diagnosisRepository.create(diagnosisData);
      const savedDiagnosis = await diagnosisRepository.save(newDiagnosis);
      return savedDiagnosis as unknown as IDiagnosisDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkDiagnosis(diagnosisData: IDiagnosis[], dataSource: DataSource): Promise<IDiagnosisDoc[]> | never {
    try {
      const diagnosisRepository = dataSource.getRepository(DiagnosisEntity);
      const newDiagnoses = diagnosisRepository.create(diagnosisData);
      const savedDiagnoses = await diagnosisRepository.save(newDiagnoses);
      return savedDiagnoses as unknown as IDiagnosisDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findExistingDiagnosis(icdCode: string, icdName: string, dataSource: DataSource): Promise<IDiagnosisDoc | null> | never {
    try {
      const diagnosisRepository = dataSource.getRepository(DiagnosisEntity);
      const existingDiagnosis = await diagnosisRepository.findOne({
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

  public async findByIcdCodes(icdCodes: string[], dataSource: DataSource): Promise<IDiagnosisDoc[]> | never {
    try {
      const diagnosisRepository = dataSource.getRepository(DiagnosisEntity);
      const foundDiagnoses = await diagnosisRepository.find({
        where: { icdCode: In(icdCodes) },
      });
      return foundDiagnoses as unknown as IDiagnosisDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getDiagnosisById(id: string, dataSource: DataSource): Promise<IDiagnosisDoc | null> | never {
    try {
      const diagnosisRepository = dataSource.getRepository(DiagnosisEntity);
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid diagnosis ID format");
      }
      const diagnosis = await diagnosisRepository.findOne({
        where: { id },
      });
      return diagnosis as unknown as IDiagnosisDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateDiagnosis(id: string, updateData: Partial<IDiagnosis>, dataSource: DataSource): Promise<IDiagnosisDoc | null> | never {
    try {
      const diagnosisRepository = dataSource.getRepository(DiagnosisEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid diagnosis ID format");
      }
      await diagnosisRepository.update(id, updateData);
      const updatedDiagnosis = await diagnosisRepository.findOne({
        where: { id },
      });
      return updatedDiagnosis as unknown as IDiagnosisDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteDiagnosis(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const diagnosisRepository = dataSource.getRepository(DiagnosisEntity);
      const result = await diagnosisRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  // Additional service methods will be added here as needed
}
