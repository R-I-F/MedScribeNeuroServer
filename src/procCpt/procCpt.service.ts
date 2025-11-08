import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";
import { ExternalService } from "../externalService/external.service";
import { IProcCpt, IProcCptDoc } from "./procCpt.interface";
import { UtilService } from "../utils/utils.service";
import { Model } from "mongoose";
import { ProcCpt } from "./procCpt.schema";

injectable();
export class ProcCptService {
  constructor(
    @inject(ExternalService) private externalService: ExternalService,
    @inject(UtilService) private utilService: UtilService
  ) {}

  private procCptModel: Model<IProcCpt> = ProcCpt;

  public async findByNumCode(data: Pick<IProcCpt, "numCode">): Promise<IProcCptDoc | null> | never{
    try {
      const foundProcCpt: IProcCptDoc | null = await ProcCpt.findOne({numCode: data.numCode})
      if(foundProcCpt){
        return foundProcCpt
      } 
      return null
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findByNumCodes(numCodes: string[]): Promise<IProcCptDoc[]> | never {
    try {
      const foundProcCpts: IProcCptDoc[] = await ProcCpt.find({ numCode: { $in: numCodes } }).exec();
      return foundProcCpts;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createProcCpt(procCptData: IProcCpt) {
    try {
      const newProcCpt = await new this.procCptModel(procCptData).save();
      return newProcCpt;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async upsertProcCpt(procCptData: IProcCpt): Promise<IProcCptDoc> {
    try {
      // Check if ProcCpt exists by numCode
      const existingProcCpt = await this.findByNumCode({ numCode: procCptData.numCode });
      
      if (existingProcCpt) {
        // Update existing record
        const updatedProcCpt = await this.procCptModel.findByIdAndUpdate(
          existingProcCpt._id,
          procCptData,
          { new: true, runValidators: true }
        ).exec();
        return updatedProcCpt as IProcCptDoc;
      } else {
        // Create new record
        const newProcCpt = await new this.procCptModel(procCptData).save();
        return newProcCpt;
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkProcCpt(procCptData: IProcCpt[]) {
    try {
      const newProcCptArr = await this.procCptModel.insertMany(procCptData);
      return newProcCptArr;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createProcCptFromExternal(validatedReq: Partial<IExternalRow>) {
    try {
      let apiString;
      if (validatedReq.row) {
        apiString = `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=procListSheet&sheetName=aggProcSheet&row=${validatedReq.row}`;
      } else {
        apiString = `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=procListSheet&sheetName=aggProcSheet`;
      }
      const externalData = await this.externalService.fetchExternalData(
        apiString
      );
      const items: IProcCpt[] = [];
      if (externalData.success) {
        for (let i: number = 0; i < externalData.data.data.length; i++) {
          const rawItem = externalData.data.data[i];
          const normalizedItem: IProcCpt = {
            title: this.utilService.stringToLowerCaseTrim(
              rawItem["Procedure Name"]
            ) as string,
            alphaCode: this.utilService
              .stringToLowerCaseTrim(rawItem["Alpha Code"]) 
              .toUpperCase() as string,
            numCode: this.utilService.stringToLowerCaseTrim(
              rawItem["Num Code"]
            ) as string,
            description: this.utilService.stringToLowerCaseTrim(
              rawItem["Description"]
            ) as string,
          };
          items.push(normalizedItem);
        }
        const newProcCptArr = await this.createBulkProcCpt(items);
        return newProcCptArr;
      } else {
        return externalData;
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
