import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IJournal, IJournalDoc } from "./journal.interface";
import { JournalEntity } from "./journal.mDbSchema";
import { Repository, In, Not } from "typeorm";

@injectable()
export class JournalService {
  public async createJournal(journalData: IJournal, dataSource: DataSource): Promise<IJournalDoc> | never {
    try {
      const journalRepository = dataSource.getRepository(JournalEntity);
      const newJournal = journalRepository.create(journalData);
      const savedJournal = await journalRepository.save(newJournal);
      return savedJournal as unknown as IJournalDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllJournals(dataSource: DataSource): Promise<IJournalDoc[]> | never {
    try {
      const journalRepository = dataSource.getRepository(JournalEntity);
      const allJournals = await journalRepository.find({
        order: { createdAt: "DESC" },
      });
      return allJournals as unknown as IJournalDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getJournalById(id: string, dataSource: DataSource): Promise<IJournalDoc | null> | never {
    try {
      const journalRepository = dataSource.getRepository(JournalEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid journal ID format");
      }
      const journal = await journalRepository.findOne({
        where: { id },
      });
      return journal as unknown as IJournalDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateJournal(id: string, updateData: Partial<IJournal>, dataSource: DataSource): Promise<IJournalDoc | null> | never {
    try {
      const journalRepository = dataSource.getRepository(JournalEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid journal ID format");
      }
      await journalRepository.update(id, updateData);
      const updatedJournal = await journalRepository.findOne({
        where: { id },
      });
      return updatedJournal as unknown as IJournalDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteJournal(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const journalRepository = dataSource.getRepository(JournalEntity);
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(id)) {
        throw new Error("Invalid journal ID format");
      }
      const result = await journalRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findByGoogleUid(google_uid: string, dataSource: DataSource, excludeId?: string): Promise<IJournalDoc | null> | never {
    try {
      const journalRepository = dataSource.getRepository(JournalEntity);
      const where: any = { google_uid };
      if (excludeId) {
        // Validate UUID format
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(excludeId)) {
          where.id = Not(excludeId);
        }
      }
      const journal = await journalRepository.findOne({
        where,
      });
      return journal as unknown as IJournalDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async createBulkJournals(journalDataArray: IJournal[], dataSource: DataSource): Promise<IJournalDoc[]> | never {
    try {
      const journalRepository = dataSource.getRepository(JournalEntity);
      const journals = journalRepository.create(journalDataArray);
      const savedJournals = await journalRepository.save(journals);
      return savedJournals as unknown as IJournalDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async findJournalsByGoogleUids(google_uids: string[], dataSource: DataSource): Promise<IJournalDoc[]> | never {
    try {
      const journalRepository = dataSource.getRepository(JournalEntity);
      const uniqueUids = [...new Set(google_uids.filter(uid => uid && uid.trim() !== ""))];
      if (uniqueUids.length === 0) {
        return [];
      }
      const journals = await journalRepository.find({
        where: { google_uid: In(uniqueUids) },
      });
      return journals as unknown as IJournalDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
