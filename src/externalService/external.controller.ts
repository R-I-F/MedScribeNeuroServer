import { inject, injectable } from "inversify";
import { IExternal, IExternalQuery } from "./external.interface";
import { Request, Response } from "express";
import { ExternalService } from "./external.service";
import { StatusCodes } from "http-status-codes";
import { matchedData } from "express-validator";
import { IGoogleRes } from "./interfaces/IGoogleRes.interface";

@injectable()
export class ExternalController {
  constructor(
    @inject(ExternalService) private externalService: ExternalService
  ) {}
  async getArabProcData(req: Request, res: Response) {
    const validatedData: IExternalQuery = matchedData(req);
    let apiString: string
    if(validatedData.row){
        console.log(true)
        apiString = `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=${encodeURIComponent(validatedData.spreadsheetName)}&sheetName=${encodeURIComponent(validatedData.sheetName)}&row=${validatedData.row}`
    } else {
        apiString = `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=${encodeURIComponent(validatedData.spreadsheetName)}&sheetName=${encodeURIComponent(validatedData.sheetName)}`
    }
    try {
      const data = await this.externalService.fetchExternalData(apiString);
    //   console.log(`external controller return data: ${data}`)
        return data
    } catch (err: any) {
        throw new Error(err)
    }
  }
}
