import { inject, injectable } from "inversify";
import { IMainDiag, IMainDiagDoc, IMainDiagInput } from "./mainDiag.interface";
import { MainDiag } from "./mainDiag.schema";
import { ProcCptService } from "../procCpt/procCpt.service";
import { DiagnosisService } from "../diagnosis/diagnosis.service";
import { UtilService } from "../utils/utils.service";
import { Types } from "mongoose";

@injectable()
export class MainDiagProvider {
  constructor(
    @inject(ProcCptService) private procCptService: ProcCptService,
    @inject(DiagnosisService) private diagnosisService: DiagnosisService,
    @inject(UtilService) private utilService: UtilService
  ) {}
  public async createMainDiag(validatedReq: IMainDiagInput): Promise<IMainDiagDoc> | never {
    try {
      // Convert procsArray (numCodes) to ObjectIds using ProcCpt service
      let procObjectIds: Types.ObjectId[] = [];
      if (validatedReq.procsArray && validatedReq.procsArray.length > 0) {
        const procDocs = await this.procCptService.findByNumCodes(validatedReq.procsArray);
        procObjectIds = procDocs.map(doc => doc._id);
        
        // Check if all requested numCodes were found
        const foundNumCodes = procDocs.map(doc => doc.numCode);
        const missingNumCodes = validatedReq.procsArray.filter(code => !foundNumCodes.includes(code));
        if (missingNumCodes.length > 0) {
          throw new Error(`The following numCodes were not found: ${missingNumCodes.join(', ')}`);
        }
      }

      // Convert diagnosis (icdCodes) to ObjectIds using Diagnosis service
      let diagnosisObjectIds: Types.ObjectId[] = [];
      if (validatedReq.diagnosis && validatedReq.diagnosis.length > 0) {
        const diagnosisDocs = await this.diagnosisService.findByIcdCodes(validatedReq.diagnosis);
        diagnosisObjectIds = diagnosisDocs.map(doc => doc._id);
        
        // Check if all requested icdCodes were found
        const foundIcdCodes = diagnosisDocs.map(doc => doc.icdCode);
        const missingIcdCodes = validatedReq.diagnosis.filter(code => !foundIcdCodes.includes(code));
        if (missingIcdCodes.length > 0) {
          throw new Error(`The following icdCodes were not found: ${missingIcdCodes.join(', ')}`);
        }
      }

      // Create mainDiag with converted ObjectIds and sanitized title
      const mainDiagData: Partial<IMainDiag> = {
        title: this.utilService.stringToLowerCaseTrim(validatedReq.title),
        procs: procObjectIds,
        diagnosis: diagnosisObjectIds
      };

      const mainDiag = new MainDiag(mainDiagData);
      return await mainDiag.save();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllMainDiags(): Promise<IMainDiagDoc[]> | never {
    try {
      return await MainDiag.find().populate('procs').populate('diagnosis').exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getMainDiagById(id: string): Promise<IMainDiagDoc | null> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid mainDiag ID");
      }
      return await MainDiag.findById(id).populate('procs').populate('diagnosis').exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateMainDiag(validatedReq: Partial<IMainDiag> & { id: string }): Promise<IMainDiagDoc | null> | never {
    try {
      const { id, ...updateData } = validatedReq;
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid mainDiag ID");
      }
      
      // Sanitize title if it's being updated
      if (updateData.title) {
        updateData.title = this.utilService.stringToLowerCaseTrim(updateData.title);
      }
      
      return await MainDiag.findByIdAndUpdate(id, updateData, { new: true }).populate('procs').populate('diagnosis').exec();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteMainDiag(id: string): Promise<boolean> | never {
    try {
      if (!Types.ObjectId.isValid(id)) {
        throw new Error("Invalid mainDiag ID");
      }
      const result = await MainDiag.findByIdAndDelete(id).exec();
      return result !== null;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
