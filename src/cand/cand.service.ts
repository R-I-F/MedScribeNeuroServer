import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";
import { ICand, ICandDoc } from "./cand.interface";
import { AppDataSource } from "../config/database.config";
import { CandidateEntity } from "./cand.mDbSchema";
import { CandProvider } from "./cand.provider";
import bcryptjs from "bcryptjs";
import { Repository, In } from "typeorm";

@injectable()
export class CandService {
  constructor(@inject(CandProvider) private candProvider: CandProvider) {}

  public async createBulkCands(candData: ICand[], dataSource: DataSource): Promise<ICandDoc[]> | never {
    try {
      const candRepository = dataSource.getRepository(CandidateEntity);
      // Hash passwords before inserting (for bulk operations from external sources)
      const hashedCandData = await Promise.all(
        candData.map(async (cand) => {
          if (cand.password) {
            const hashedPassword = await bcryptjs.hash(cand.password, 10);
            return { ...cand, password: hashedPassword };
          }
          return cand;
        })
      );
      const newCands = candRepository.create(hashedCandData);
      const savedCands = await candRepository.save(newCands);
      return savedCands as unknown as ICandDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createCandsFromExternal(validatedReq: Partial<IExternalRow>, dataSource: DataSource) {
    const items = await this.candProvider.provideCandsFromExternal(
      validatedReq
    );
    if (items.length === 0) {
      return [];
    }
    const maxBatchSize = 1000;
    if (items.length > maxBatchSize) {
      throw new Error(`Bulk import exceeds maximum batch size of ${maxBatchSize}`);
    }
    const emails = items.map((c) => c.email).filter((e) => e && e.trim() !== "");
    const existing = await this.findCandidatesByEmails(emails, dataSource);
    const existingEmails = new Set(existing.map((c) => c.email.toLowerCase().trim()));
    const toInsert = items.filter((c) => !existingEmails.has((c.email || "").toLowerCase().trim()));
    if (toInsert.length === 0) {
      return [];
    }
    const newCandArr = await this.createBulkCands(toInsert, dataSource);
    return newCandArr;
  }

  public async createCand(candData: ICand, dataSource: DataSource): Promise<ICandDoc> | never {
    try {
      const candRepository = dataSource.getRepository(CandidateEntity);
      const newCand = candRepository.create(candData);
      const savedCand = await candRepository.save(newCand);
      return savedCand as unknown as ICandDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandByEmail(email: string, dataSource: DataSource): Promise<ICandDoc | null> | never {
    try {
      const candRepository = dataSource.getRepository(CandidateEntity);
      const cand = await candRepository.findOne({
        where: { email },
      });
      return cand as unknown as ICandDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findCandidatesByEmails(emails: string[], dataSource: DataSource): Promise<ICandDoc[]> | never {
    try {
      const candRepository = dataSource.getRepository(CandidateEntity);
      const uniqueEmails = [...new Set(emails.filter(email => email && email.trim() !== ""))];
      if (uniqueEmails.length === 0) {
        return [];
      }
      const candidates = await candRepository.find({
        where: { email: In(uniqueEmails) },
      });
      return candidates as unknown as ICandDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async resetAllCandidatePasswords(
    hashedPassword: string,
    dataSource: DataSource
  ): Promise<number> | never {
    try {
      const candRepository = dataSource.getRepository(CandidateEntity);
      const result = await candRepository
        .createQueryBuilder()
        .update(CandidateEntity)
        .set({ password: hashedPassword })
        .execute();
      return result.affected ?? 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllCandidates(dataSource: DataSource): Promise<ICandDoc[]> | never {
    try {
      const candRepository = dataSource.getRepository(CandidateEntity);
      const allCandidates = await candRepository.find({
        order: { createdAt: "DESC" },
      });
      return allCandidates as unknown as ICandDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandById(id: string, dataSource: DataSource): Promise<ICandDoc | null> | never {
    try {
      const candRepository = dataSource.getRepository(CandidateEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid candidate ID format");
      }
      const candidate = await candRepository.findOne({
        where: { id },
      });
      return candidate as unknown as ICandDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async resetCandidatePassword(id: string, dataSource: DataSource): Promise<ICandDoc | null> | never {
    try {
      const candRepository = dataSource.getRepository(CandidateEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid candidate ID format");
      }
      const defaultPassword = process.env.BASE_CAND_PASSWORD;
      if (!defaultPassword) {
        throw new Error("BASE_CAND_PASSWORD environment variable is not set");
      }
      const hashedPassword = await bcryptjs.hash(defaultPassword, 10);
      await candRepository.update(id, { password: hashedPassword });
      const updatedCandidate = await candRepository.findOne({
        where: { id },
      });
      return updatedCandidate as unknown as ICandDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteCand(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const candRepository = dataSource.getRepository(CandidateEntity);
      const result = await candRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
