import { inject, injectable } from "inversify";
import { IDiagnosis } from "./diagnosis.interface";
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

  // Additional service methods will be added here as needed
}
