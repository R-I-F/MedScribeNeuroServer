import { inject, injectable } from "inversify";
import { UtilService } from "../utils/utils.service";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";
import { ExternalService } from "../externalService/external.service";
import { ICand, ICandDoc } from "./cand.interface";

@injectable()
export class CandProvider {
  constructor(
    @inject(UtilService) private utilsService: UtilService,
    @inject(ExternalService) private externalService: ExternalService
  ) {}

  public async provideCandsFromExternal(
    validatedReq: Partial<IExternalRow>
  ): Promise<ICand[]> | never {
    try {
      let apiString: string;
      if (validatedReq.row) {
        apiString = `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=candRegResponses&sheetName=Form%20Responses%201&row=${validatedReq.row}`;
      } else {
        apiString = `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=candRegResponses&sheetName=Form%20Responses%201`;
      }
      const externalData = await this.externalService.fetchExternalData(
        apiString
      );
      const items: ICand[] = [];
      if (externalData.success) {
        // console.log(externalData)
        for (let i: number = 0; i < externalData.data.data.length; i++) {
          const rawItem = externalData.data.data[i];
          const normalizedItem: ICand = {
            timeStamp: this.utilsService.stringToDateConverter(
              rawItem["Timestamp"]
            ),
            email: rawItem["Email Address"],
            password: `MEDscribe0${i + 1}$`,
            fullName: this.utilsService.stringToLowerCaseTrim(
              rawItem["Full Name (as per ID) "]
            ),
            regNum: this.utilsService.numToStringTrim(
              rawItem["Registry Number (Medical Committee or College ID)"]
            ),
            phoneNum: rawItem["Phone Number"],
            nationality: this.utilsService.stringToLowerCaseTrim(
              rawItem["Nationality"]
            ),
            rank: this.utilsService.returnRankEnum(rawItem["Rank"]),
            regDeg: this.utilsService.returnRegDegree(
              rawItem["Registered Degree  (Currently Enrolled Program) "]
            ),
            google_uid: rawItem["Uuid"].trim(),
            approved: this.utilsService.approvedToBoolean(rawItem["Approved"]),
          };
          items.push(normalizedItem);
        }
      }
      return items;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
