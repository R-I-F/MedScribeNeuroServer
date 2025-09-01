import { injectable } from "inversify";
import { IExternal } from "./external.interface";
import axios, { AxiosResponse } from "axios";
import { IGoogleRes } from "./interfaces/IGoogleRes.interface";

@injectable()
export class ExternalService implements IExternal {
  async fetchExternalData(endpoint: string): Promise<IGoogleRes> | never {
    console.log(`endpoint is ${endpoint}`);
    try {
      const response: AxiosResponse = await axios.get(endpoint);
      if (response.status < 200 || response.status >= 300) {
        throw new Error("failed request");
      }
    //   console.log(`axios res data = ${response.data}`);
      console.log(response.data)
      return response.data;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
