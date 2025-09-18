import { inject, injectable } from "inversify";
import { IDiagnosis, IDiagnosisDoc } from "./diagnosis.interface";
import { Model } from "mongoose";
import { Diagnosis } from "./diagnosis.schema";

injectable();
export class DiagnosisService {
  constructor() {}

  private diagnosisModel: Model<IDiagnosis> = Diagnosis

  public async createDiagnosis(diagnosisData: IDiagnosis){
    try {
      const newDiagnosis = await new this.diagnosisModel(diagnosisData).save();
      return newDiagnosis;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkDiagnosis(diagnosisData: IDiagnosis[]){
    try {
      const newDiagnosisArr = await this.diagnosisModel.insertMany(diagnosisData);
      return newDiagnosisArr;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findExistingDiagnosis(icdCode: string, icdName: string): Promise<IDiagnosis | null> {
    try {
      const existingDiagnosis = await this.diagnosisModel.findOne({
        $or: [
          { icdCode: icdCode },
          { icdName: icdName }
        ]
      });
      return existingDiagnosis;
    } catch (err: any) {
      throw new Error(`Failed to check for existing diagnosis: ${err.message}`);
    }
  }

  public async findByIcdCodes(icdCodes: string[]): Promise<IDiagnosisDoc[]> | never {
    try {
      const foundDiagnoses = await this.diagnosisModel.find({ icdCode: { $in: icdCodes } }).exec();
      return foundDiagnoses;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  // Additional service methods will be added here as needed
}
