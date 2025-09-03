import { Request, Response } from "express";
import { inject, injectable } from "inversify";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";
import { ExternalService } from "../externalService/external.service";
import { ICalSurg } from "./calSurg.interface";
import { UtilService } from "../utils/utils.service";
import { Hospital } from "../hospital/hospital.schema";
import { Document, Model } from "mongoose";
import { IHospitalDoc } from "../hospital/hospital.interface";
import { IArabProc, IArabProcDoc } from "../arabProc/arabProc.interface";
import { ArabProc } from "../arabProc/arabProc.schema";
import { CalSurg } from "./calSurg.schema";

injectable();
export class CalSurgService {
  constructor(
    @inject(ExternalService) private externalService: ExternalService,
    @inject(UtilService) private utilService: UtilService
  ) {}

  private calSurgModel: Model<ICalSurg> = CalSurg

  public async createCalSurg(calSurgData: ICalSurg){
    try {
      const newCalSurg = await new this.calSurgModel(calSurgData).save();
      return newCalSurg;
    } catch (err: any) {
      throw new Error(err);
    }
  }

    public async createBulkCalSurg(calSurgData: ICalSurg[]){
    try {
      const newCalSurgArr = await this.calSurgModel.insertMany(calSurgData);
      return newCalSurgArr;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createCalSurgFromExternal(validatedReq: Partial<IExternalRow>) {
    try {
      let apiString;
      if(validatedReq.row){
        apiString=`${process.env.GETTER_API_ENDPOINT}?spreadsheetName=calSurgLogSheet&sheetName=Form%20Responses%201&row=${validatedReq.row}`
      } else {
        apiString=`${process.env.GETTER_API_ENDPOINT}?spreadsheetName=calSurgLogSheet&sheetName=Form%20Responses%201`
      }
      const externalData = await this.externalService.fetchExternalData(apiString);
      const items: ICalSurg[] = []
      if(externalData.success){
        const hospitals: IHospitalDoc[] = await Hospital.find({});
        const hospitalsMap = new Map(hospitals.map(h=>[h.engName, h]));

        const arabicProcs: IArabProcDoc[] = await ArabProc.find({});
        const arabicProcsMap = await new Map(arabicProcs.map(p => [p.title, p]));

        for (let i: number = 0; i < externalData.data.data.length; i++) {
          const rawItem = externalData.data.data[i]
          const sanPatientName = this.utilService.sanitizeName(rawItem["Patient Name"]);
          const location: IHospitalDoc | undefined = hospitalsMap.get(rawItem["Location"]);
          const arabicProc: IArabProcDoc | undefined = arabicProcsMap.get(rawItem["Procedure"]);
          if(location && arabicProc){
            const normalizedItem: ICalSurg = {
                timeStamp: this.utilService.stringToDateConverter(rawItem["Timestamp"]),
                patientName: sanPatientName,
                patientDob: rawItem["Patient DOB"],
                gender: rawItem["Gender"],
                hospital: location._id,
                arabProc: arabicProc._id,
                procDate: this.utilService.stringToDateConverter(rawItem["Operation Date"]),
                google_uid: rawItem["uid"],
                formLink: rawItem["Link"]
              }
              items.push(normalizedItem)
          }  
        }
        const newCalSurArr = await this.createBulkCalSurg(items)
        return newCalSurArr;
      } else return externalData
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
