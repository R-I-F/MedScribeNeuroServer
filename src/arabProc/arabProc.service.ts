import { IArabProc } from "./arabProc.interface";
import { inject, injectable } from "inversify";
import { ArabProc } from "./arabProc.schema";
import { Model } from "mongoose";
import { ExternalService } from "../externalService/external.service";
import { IExternalRow } from "./interfaces/IExternalRow.interface";

@injectable()
export class ArabProcService {
  constructor(
    @inject(ExternalService) private externalService: ExternalService
  ) {}
  private arabProcModel: Model<IArabProc> = ArabProc;

  public async getAllArabProcs() {
    try {
      const allArabProcs = await this.arabProcModel.find();
      return allArabProcs;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getArabProcsWithSearch(search?: string) {
    try {
      if (search) {
        const searchRegex = new RegExp(search, 'i');
        const arabProcs = await this.arabProcModel.find({
          $or: [
            { title: searchRegex },
            { numCode: searchRegex }
          ]
        }).exec();
        return arabProcs;
      } else {
        return await this.getAllArabProcs();
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createArabProc(arabProcData: IArabProc) {
    try {
      const newArabProc = await new this.arabProcModel(arabProcData).save();
      return newArabProc;
      
    } catch (err: any) {
      throw new Error(err)
    }
  }

  public async createArabProcsFromExternal(
    validatedReq: Partial<IExternalRow>
  ) {
    try {
      let apiString;
      if (validatedReq.row) {
        apiString = `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=procListSheet&sheetName=arabProcList&row=${validatedReq.row}`;
      } else {
        apiString = `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=procListSheet&sheetName=arabProcList`;
      }
      const externalData = await this.externalService.fetchExternalData(
        apiString
      );
      const items: IArabProc[] = [];
      if (externalData.success) {
        for (let i: number = 0; i < externalData.data.data.length; i++) {
          const rawItem: any = externalData.data.data[i];
          // force it into string
          const normalizedItem: IArabProc = {
            title: rawItem["Procedure Name"],
            alphaCode: rawItem["Alpha Code"],
            numCode: String(rawItem["Num Code"]),
            description: rawItem["Description"],
          };
          items.push(normalizedItem);
        }
        const newArabProcs = await Promise.all(
          items.map((item) => {
            return this.createArabProc(item);
          })
        );
        return newArabProcs;
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
