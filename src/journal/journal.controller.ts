import { Request, Response } from "express";
import { matchedData } from "express-validator";
import { inject, injectable } from "inversify";
import { JournalProvider } from "./journal.provider";
import { IJournalInput, IJournalUpdateInput } from "./journal.interface";

@injectable()
export class JournalController {
  constructor(
    @inject(JournalProvider) private journalProvider: JournalProvider
  ) {}

  public async handlePostJournal(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as IJournalInput;
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.journalProvider.createJournal(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetAllJournals(
    req: Request,
    res: Response
  ) {
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      const list = await this.journalProvider.getAllJournals(dataSource);
      return list.map(({ createdAt, updatedAt, google_uid, ...rest }) => rest);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleGetJournalById(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    // Ensure id is extracted from params
    validatedReq.id = req.params.id;
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.journalProvider.getJournalById(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleUpdateJournal(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as IJournalUpdateInput;
    // Merge id from params into validatedReq
    validatedReq.id = req.params.id;
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.journalProvider.updateJournal(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handleDeleteJournal(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as { id: string };
    // Ensure id is extracted from params
    validatedReq.id = req.params.id;
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.journalProvider.deleteJournal(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async handlePostBulkJournalsFromExternal(
    req: Request,
    res: Response
  ) {
    const validatedReq = matchedData(req) as { 
      spreadsheetName?: string; 
      sheetName?: string; 
      row?: number; 
    };
    try {
      const dataSource = (req as any).institutionDataSource;
      if (!dataSource) {
        throw new Error("Institution DataSource not resolved");
      }
      return await this.journalProvider.createJournalsFromExternal(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

