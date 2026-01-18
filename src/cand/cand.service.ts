import { inject, injectable } from "inversify";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";
import { ICand, ICandDoc } from "./cand.interface";
import { AppDataSource } from "../config/database.config";
import { CandidateEntity } from "./cand.mDbSchema";
import { CandProvider } from "./cand.provider";
import bcryptjs from "bcryptjs";
import { Repository, In } from "typeorm";

@injectable()
export class CandService {
  private candRepository: Repository<CandidateEntity>;

  constructor(@inject(CandProvider) private candProvider: CandProvider) {
    this.candRepository = AppDataSource.getRepository(CandidateEntity);
  }

  public async createBulkCands(candData: ICand[]): Promise<ICandDoc[]> | never {
    try {
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
      const newCands = this.candRepository.create(hashedCandData);
      const savedCands = await this.candRepository.save(newCands);
      return savedCands as unknown as ICandDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createCandsFromExternal(validatedReq: Partial<IExternalRow>) {
    const items = await this.candProvider.provideCandsFromExternal(
      validatedReq
    );
    const newCandArr = await this.createBulkCands(items);
    return newCandArr;
  }

  public async createCand(candData: ICand): Promise<ICandDoc> | never {
    try {
      const newCand = this.candRepository.create(candData);
      const savedCand = await this.candRepository.save(newCand);
      return savedCand as unknown as ICandDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandByEmail(email: string): Promise<ICandDoc | null> | never {
    try {
      const cand = await this.candRepository.findOne({
        where: { email },
      });
      return cand as unknown as ICandDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findCandidatesByEmails(emails: string[]): Promise<ICandDoc[]> | never {
    try {
      const uniqueEmails = [...new Set(emails.filter(email => email && email.trim() !== ""))];
      if (uniqueEmails.length === 0) {
        return [];
      }
      const candidates = await this.candRepository.find({
        where: { email: In(uniqueEmails) },
      });
      return candidates as unknown as ICandDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async resetAllCandidatePasswords(
    hashedPassword: string
  ): Promise<number> | never {
    try {
      const result = await this.candRepository.update({}, { password: hashedPassword });
      return result.affected ?? 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllCandidates(): Promise<ICandDoc[]> | never {
    try {
      const allCandidates = await this.candRepository.find({
        order: { createdAt: "DESC" },
      });
      return allCandidates as unknown as ICandDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getCandById(id: string): Promise<ICandDoc | null> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid candidate ID format");
      }
      const candidate = await this.candRepository.findOne({
        where: { id },
      });
      return candidate as unknown as ICandDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async resetCandidatePassword(id: string): Promise<ICandDoc | null> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid candidate ID format");
      }
      const defaultPassword = "MEDscrobe01$";
      const hashedPassword = await bcryptjs.hash(defaultPassword, 10);
      await this.candRepository.update(id, { password: hashedPassword });
      const updatedCandidate = await this.candRepository.findOne({
        where: { id },
      });
      return updatedCandidate as unknown as ICandDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteCand(id: string): Promise<boolean> | never {
    try {
      const result = await this.candRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
