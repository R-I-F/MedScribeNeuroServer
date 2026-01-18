import { IArabProc, IArabProcDoc } from "./arabProc.interface";
import { inject, injectable } from "inversify";
import { ExternalService } from "../externalService/external.service";
import { IExternalRow } from "./interfaces/IExternalRow.interface";
import { AppDataSource } from "../config/database.config";
import { ArabProcEntity } from "./arabProc.mDbSchema";
import { Repository, Like } from "typeorm";

@injectable()
export class ArabProcService {
  private arabProcRepository: Repository<ArabProcEntity>;

  constructor(
    @inject(ExternalService) private externalService: ExternalService
  ) {
    this.arabProcRepository = AppDataSource.getRepository(ArabProcEntity);
  }

  public async getAllArabProcs(): Promise<IArabProcDoc[]> | never {
    try {
      const allArabProcs = await this.arabProcRepository.find({
        order: { createdAt: "DESC" },
      });
      return allArabProcs as unknown as IArabProcDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getArabProcsWithSearch(search?: string): Promise<IArabProcDoc[]> | never {
    try {
      if (search) {
        const arabProcs = await this.arabProcRepository.find({
          where: [
            { title: Like(`%${search}%`) },
            { numCode: Like(`%${search}%`) },
          ],
          order: { createdAt: "DESC" },
        });
        return arabProcs as unknown as IArabProcDoc[];
      } else {
        return await this.getAllArabProcs();
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createArabProc(arabProcData: IArabProc): Promise<IArabProcDoc> | never {
    try {
      const newArabProc = this.arabProcRepository.create(arabProcData);
      const savedArabProc = await this.arabProcRepository.save(newArabProc);
      return savedArabProc as unknown as IArabProcDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createArabProcsFromExternal(
    validatedReq: Partial<IExternalRow>
  ): Promise<IArabProcDoc[]> | never {
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
      } else {
        throw new Error("Failed to fetch external data");
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteArabProc(id: string): Promise<boolean> | never {
    try {
      const result = await this.arabProcRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
