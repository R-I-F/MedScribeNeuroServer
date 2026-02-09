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
      if (!externalData?.success) {
        const message = (externalData?.data as { error?: string } | undefined)?.error ?? "External data fetch failed";
        throw new Error(message);
      }
      const rows = externalData?.data?.data;
      if (!Array.isArray(rows)) {
        return [];
      }
      const items: ICand[] = [];
      for (let i: number = 0; i < rows.length; i++) {
        const rawItem = rows[i];
        try {
          const normalizedItem: ICand = {
            timeStamp: this.utilsService.stringToDateConverter(
              rawItem["Timestamp"]
            ),
            email: String(rawItem["Email Address"] ?? "").trim(),
            password: `MEDscrobe01$`,
            fullName: this.utilsService.stringToLowerCaseTrim(
              rawItem["Full Name (as per ID)"]
            ),
            regNum: this.utilsService.numToStringTrim(
              rawItem["Registry Number (Medical Committee or College ID)"]
            ),
            phoneNum: rawItem["Phone Number"],
            nationality: this.utilsService.stringToLowerCaseTrim(
              rawItem["Nationality"]
            ),
            rank: this.utilsService.returnRankEnum(
              rawItem["Rank"]
            ),
            regDeg: this.utilsService.returnRegDegree(
              rawItem["Registered Degree  (Currently Enrolled Program)"]
            ),
            google_uid: (() => {
              const value = rawItem["Uuid"];
              if (!value || typeof value !== "string") {
                throw new Error(`Uuid is not a string. Value: ${value}, Type: ${typeof value}`);
              }
              return value.trim();
            })(),
            approved: this.utilsService.approvedToBoolean(
              rawItem["Approved"]
            ),
          };
          items.push(normalizedItem);
        } catch (fieldError: any) {
          console.error(`\n❌ [Row ${i + 1}] ERROR processing field:`, fieldError.message);
          console.error(`[Row ${i + 1}] Error stack:`, fieldError.stack);
          console.error(`[Row ${i + 1}] Full raw item that caused error:`, JSON.stringify(rawItem, null, 2));
          throw new Error(`Error processing row ${i + 1}: ${fieldError.message}`);
        }
      }
      return items;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
