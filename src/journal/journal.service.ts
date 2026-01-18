import { inject, injectable } from "inversify";
import { IJournal, IJournalDoc } from "./journal.interface";
import { AppDataSource } from "../config/database.config";
import { JournalEntity } from "./journal.mDbSchema";
import { Repository, In, Not } from "typeorm";

@injectable()
export class JournalService {
  private journalRepository: Repository<JournalEntity>;

  constructor() {
    this.journalRepository = AppDataSource.getRepository(JournalEntity);
  }

  public async createJournal(journalData: IJournal): Promise<IJournalDoc> | never {
    try {
      const newJournal = this.journalRepository.create(journalData);
      const savedJournal = await this.journalRepository.save(newJournal);
      return savedJournal as unknown as IJournalDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllJournals(): Promise<IJournalDoc[]> | never {
    try {
      const allJournals = await this.journalRepository.find({
        order: { createdAt: "DESC" },
      });
      return allJournals as unknown as IJournalDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getJournalById(id: string): Promise<IJournalDoc | null> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid journal ID format");
      }
      const journal = await this.journalRepository.findOne({
        where: { id },
      });
      return journal as unknown as IJournalDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateJournal(id: string, updateData: Partial<IJournal>): Promise<IJournalDoc | null> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid journal ID format");
      }
      await this.journalRepository.update(id, updateData);
      const updatedJournal = await this.journalRepository.findOne({
        where: { id },
      });
      return updatedJournal as unknown as IJournalDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteJournal(id: string): Promise<boolean> | never {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid journal ID format");
      }
      const result = await this.journalRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findByGoogleUid(google_uid: string, excludeId?: string): Promise<IJournalDoc | null> | never {
    try {
      const where: any = { google_uid };
      if (excludeId) {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(excludeId)) {
          where.id = Not(excludeId);
        }
      }
      const journal = await this.journalRepository.findOne({
        where,
      });
      return journal as unknown as IJournalDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkJournals(journalDataArray: IJournal[]): Promise<IJournalDoc[]> | never {
    try {
      const journals = this.journalRepository.create(journalDataArray);
      const savedJournals = await this.journalRepository.save(journals);
      return savedJournals as unknown as IJournalDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findJournalsByGoogleUids(google_uids: string[]): Promise<IJournalDoc[]> | never {
    try {
      const uniqueUids = [...new Set(google_uids.filter(uid => uid && uid.trim() !== ""))];
      if (uniqueUids.length === 0) {
        return [];
      }
      const journals = await this.journalRepository.find({
        where: { google_uid: In(uniqueUids) },
      });
      return journals as unknown as IJournalDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
