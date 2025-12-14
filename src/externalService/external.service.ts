import { injectable } from "inversify";
import { IExternal } from "./external.interface";
import axios, { AxiosResponse } from "axios";
import { IGoogleRes } from "./interfaces/IGoogleRes.interface";

@injectable()
export class ExternalService implements IExternal {
  async fetchExternalData(endpoint: string): Promise<IGoogleRes> | never {
    try {
      const response: AxiosResponse = await axios.get(endpoint);
      if (response.status < 200 || response.status >= 300) {
        throw new Error("failed request");
      }
      return response.data;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  async updateGoogleSheetReview(data: { googleUid: string; status: string }): Promise<any> | never {
    try {
      const apiUrl = process.env.SUB_REVIEW_PATCHER_API_URL;
      const apiPassword = process.env.SUB_REVIEW_PATCHER_API_PASSWORD;

      if (!apiUrl) {
        throw new Error("SUB_REVIEW_PATCHER_API_URL is not configured");
      }

      if (!apiPassword) {
        throw new Error("SUB_REVIEW_PATCHER_API_PASSWORD is not configured");
      }

      const response: AxiosResponse = await axios.post(apiUrl, {
        action: "updateSubmissionReview",
        password: apiPassword,
        googleUid: data.googleUid,
        status: data.status
      });

      if (response.status < 200 || response.status >= 300) {
        throw new Error("Failed to update Google Sheet");
      }

      if (!response.data.success) {
        throw new Error(response.data.error || "Failed to update Google Sheet");
      }

      return response.data;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
