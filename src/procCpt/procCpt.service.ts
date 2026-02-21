import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";
import { ExternalService } from "../externalService/external.service";
import { IProcCpt, IProcCptDoc } from "./procCpt.interface";
import { UtilService } from "../utils/utils.service";
import { ProcCptEntity } from "./procCpt.mDbSchema";
import { Repository, In } from "typeorm";

@injectable()
export class ProcCptService {
  constructor(
    @inject(ExternalService) private externalService: ExternalService,
    @inject(UtilService) private utilService: UtilService
  ) {}

  public async getAllProcCpts(dataSource: DataSource): Promise<IProcCptDoc[]> | never {
    try {
      const procCptRepository = dataSource.getRepository(ProcCptEntity);
      const allProcCpts = await procCptRepository.find({
        order: { createdAt: "DESC" },
      });
      return allProcCpts as unknown as IProcCptDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findByNumCode(data: Pick<IProcCpt, "numCode">, dataSource: DataSource): Promise<IProcCptDoc | null> | never {
    try {
      const procCptRepository = dataSource.getRepository(ProcCptEntity);
      const foundProcCpt = await procCptRepository.findOne({
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

  public async findByNumCodes(numCodes: string[], dataSource: DataSource): Promise<IProcCptDoc[]> | never {
    try {
      const procCptRepository = dataSource.getRepository(ProcCptEntity);
      const foundProcCpts = await procCptRepository.find({
        where: { numCode: In(numCodes) },
      });
      return foundProcCpts as unknown as IProcCptDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createProcCpt(procCptData: IProcCpt, dataSource: DataSource): Promise<IProcCptDoc> | never {
    try {
      const procCptRepository = dataSource.getRepository(ProcCptEntity);
      const newProcCpt = procCptRepository.create(procCptData);
      const savedProcCpt = await procCptRepository.save(newProcCpt);
      return savedProcCpt as unknown as IProcCptDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /** Create only: throws if a procedure with the same numCode already exists. */
  public async createProcCptStrict(procCptData: IProcCpt, dataSource: DataSource): Promise<IProcCptDoc> | never {
    const existing = await this.findByNumCode({ numCode: procCptData.numCode }, dataSource);
    if (existing) {
      throw new Error("CPT with this code already exists");
    }
    return this.createProcCpt(procCptData, dataSource);
  }

  /** Update only by id: throws if not found. */
  public async updateProcCpt(
    id: string,
    updateData: Partial<IProcCpt>,
    dataSource: DataSource
  ): Promise<IProcCptDoc> | never {
    const procCptRepository = dataSource.getRepository(ProcCptEntity);
    const existing = await procCptRepository.findOne({ where: { id } });
    if (!existing) {
      throw new Error("ProcCpt not found");
    }
    procCptRepository.merge(existing as any, updateData);
    const updated = await procCptRepository.save(existing as any);
    return updated as unknown as IProcCptDoc;
  }

  public async upsertProcCpt(procCptData: IProcCpt, dataSource: DataSource): Promise<IProcCptDoc> | never {
    try {
      const procCptRepository = dataSource.getRepository(ProcCptEntity);
      // Check if ProcCpt exists by numCode
      const existingProcCpt = await this.findByNumCode({ numCode: procCptData.numCode }, dataSource);
      
      if (existingProcCpt) {
        // Update existing record
        procCptRepository.merge(existingProcCpt as any, procCptData);
        const updatedProcCpt = await procCptRepository.save(existingProcCpt as any);
        return updatedProcCpt as unknown as IProcCptDoc;
      } else {
        // Create new record
        const newProcCpt = procCptRepository.create(procCptData);
        const savedProcCpt = await procCptRepository.save(newProcCpt);
        return savedProcCpt as unknown as IProcCptDoc;
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkProcCpt(procCptData: IProcCpt[], dataSource: DataSource): Promise<IProcCptDoc[]> | never {
    try {
      const procCptRepository = dataSource.getRepository(ProcCptEntity);
      const newProcCpts = procCptRepository.create(procCptData);
      const savedProcCpts = await procCptRepository.save(newProcCpts);
      return savedProcCpts as unknown as IProcCptDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createProcCptFromExternal(validatedReq: Partial<IExternalRow>, dataSource: DataSource): Promise<IProcCptDoc[] | any> | never {
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
        const newProcCptArr = await this.createBulkProcCpt(items, dataSource);
        return newProcCptArr;
      } else {
        return externalData;
      }
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteProcCpt(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const procCptRepository = dataSource.getRepository(ProcCptEntity);
      const result = await procCptRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
