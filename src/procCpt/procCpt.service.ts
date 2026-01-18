import { inject, injectable } from "inversify";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";
import { ExternalService } from "../externalService/external.service";
import { IProcCpt, IProcCptDoc } from "./procCpt.interface";
import { UtilService } from "../utils/utils.service";
import { AppDataSource } from "../config/database.config";
import { ProcCptEntity } from "./procCpt.mDbSchema";
import { Repository, In } from "typeorm";

@injectable()
export class ProcCptService {
  private procCptRepository: Repository<ProcCptEntity>;

  constructor(
    @inject(ExternalService) private externalService: ExternalService,
    @inject(UtilService) private utilService: UtilService
  ) {
    this.procCptRepository = AppDataSource.getRepository(ProcCptEntity);
  }

  public async getAllProcCpts(): Promise<IProcCptDoc[]> | never {
    try {
      const allProcCpts = await this.procCptRepository.find({
        order: { createdAt: "DESC" },
      });
      return allProcCpts as unknown as IProcCptDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findByNumCode(data: Pick<IProcCpt, "numCode">): Promise<IProcCptDoc | null> | never {
    try {
      const foundProcCpt = await this.procCptRepository.findOne({
        where: { numCode: data.numCode },
      });
      if (foundProcCpt) {
        return foundProcCpt as unknown as IProcCptDoc;
      }
      return null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findByNumCodes(numCodes: string[]): Promise<IProcCptDoc[]> | never {
    try {
      const foundProcCpts = await this.procCptRepository.find({
        where: { numCode: In(numCodes) },
      });
      return foundProcCpts as unknown as IProcCptDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createProcCpt(procCptData: IProcCpt): Promise<IProcCptDoc> | never {
    try {
      const newProcCpt = this.procCptRepository.create(procCptData);
      const savedProcCpt = await this.procCptRepository.save(newProcCpt);
      return savedProcCpt as unknown as IProcCptDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async upsertProcCpt(procCptData: IProcCpt): Promise<IProcCptDoc> | never {
    try {
      // Check if ProcCpt exists by numCode
      const existingProcCpt = await this.findByNumCode({ numCode: procCptData.numCode });
      
      if (existingProcCpt) {
        // Update existing record
        this.procCptRepository.merge(existingProcCpt as any, procCptData);
        const updatedProcCpt = await this.procCptRepository.save(existingProcCpt as any);
        return updatedProcCpt as unknown as IProcCptDoc;
      } else {
        // Create new record
        const newProcCpt = this.procCptRepository.create(procCptData);
        const savedProcCpt = await this.procCptRepository.save(newProcCpt);
        return savedProcCpt as unknown as IProcCptDoc;
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkProcCpt(procCptData: IProcCpt[]): Promise<IProcCptDoc[]> | never {
    try {
      const newProcCpts = this.procCptRepository.create(procCptData);
      const savedProcCpts = await this.procCptRepository.save(newProcCpts);
      return savedProcCpts as unknown as IProcCptDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createProcCptFromExternal(validatedReq: Partial<IExternalRow>): Promise<IProcCptDoc[] | any> | never {
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

  public async deleteProcCpt(id: string): Promise<boolean> | never {
    try {
      const result = await this.procCptRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
