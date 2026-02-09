import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { JournalService } from "./journal.service";
import { IJournal, IJournalDoc, IJournalInput, IJournalUpdateInput } from "./journal.interface";
import { UtilService } from "../utils/utils.service";
import { ExternalService } from "../externalService/external.service";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";

@injectable()
export class JournalProvider {
  constructor(
    @inject(JournalService) private journalService: JournalService,
    @inject(UtilService) private utilService: UtilService,
    @inject(ExternalService) private externalService: ExternalService
  ) {}

  public async createJournal(validatedReq: IJournalInput, dataSource: DataSource): Promise<IJournalDoc> | never {
    try {
      // Business logic: Process and transform data
      const processedData: IJournal = {
        journalTitle: this.utilService.stringToLowerCaseTrim(validatedReq.journalTitle),
        pdfLink: validatedReq.pdfLink.trim(),
        google_uid: validatedReq.google_uid.trim(),
      };

      // Check for duplicate google_uid
      await this.checkForDuplicateGoogleUid(processedData.google_uid, dataSource);

      // Call service to create journal
      return await this.journalService.createJournal(processedData, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllJournals(dataSource: DataSource): Promise<IJournalDoc[]> | never {
    try {
      return await this.journalService.getAllJournals(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getJournalById(id: string, dataSource: DataSource): Promise<IJournalDoc | null> | never {
    try {
      return await this.journalService.getJournalById(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateJournal(validatedReq: IJournalUpdateInput, dataSource: DataSource): Promise<IJournalDoc | null> | never {
    try {
      const { id, ...updateData } = validatedReq;

      // Build update fields object
      const updateFields: Partial<IJournal> = {};

      if (updateData.journalTitle !== undefined) {
        updateFields.journalTitle = this.utilService.stringToLowerCaseTrim(updateData.journalTitle);
      }

      if (updateData.pdfLink !== undefined) {
        updateFields.pdfLink = updateData.pdfLink.trim();
      }

      if (updateData.google_uid !== undefined) {
        updateFields.google_uid = updateData.google_uid.trim();
        // Check for duplicate google_uid if it's being updated
        await this.checkForDuplicateGoogleUid(updateFields.google_uid, dataSource, id);
      }

      return await this.journalService.updateJournal(id, updateFields, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteJournal(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      return await this.journalService.deleteJournal(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Checks for duplicate google_uid
   * @param google_uid - Google UID to check
   * @param dataSource - DataSource instance
   * @param excludeId - Optional ID to exclude from check (for updates)
   * @throws Error if duplicate found
   */
  private async checkForDuplicateGoogleUid(google_uid: string, dataSource: DataSource, excludeId?: string): Promise<void> {
    try {
      const existingJournal = await this.journalService.findByGoogleUid(google_uid, dataSource, excludeId);
      
      if (existingJournal) {
        throw new Error(`Journal with google_uid '${google_uid}' already exists`);
      }
    } catch (err: any) {
      // If it's already our custom error, re-throw it
      if (err.message && err.message.includes("already exists")) {
        throw err;
      }
      // If it's a duplicate key error from database, throw a more user-friendly message
      if (err.message && err.message.includes("duplicate key")) {
        throw new Error(`Journal with google_uid '${google_uid}' already exists`);
      }
      throw err;
    }
  }

  /**
   * Creates journals from external spreadsheet data
   * @param validatedReq - External request with spreadsheet info
   * @param dataSource - DataSource instance
   * @returns Promise<IJournalDoc[]>
   */
  public async createJournalsFromExternal(
    validatedReq: Partial<IExternalRow>,
    dataSource: DataSource
  ): Promise<IJournalDoc[]> | never {
    try {
      // Build API string
      const apiString = this.buildExternalApiString(validatedReq);
      
      // Fetch external data
      const externalData = await this.externalService.fetchExternalData(apiString);
      
      if (!externalData.success) {
        throw new Error("Failed to fetch external data");
      }

      // Process external data
      const processedJournals = await this.processExternalData(externalData);

      // Filter out duplicates before bulk creation
      const uniqueJournals = await this.filterDuplicateJournals(processedJournals, dataSource);

      // Create bulk journals (only new ones)
      if (uniqueJournals.length === 0) {
        return [];
      }
      return await this.journalService.createBulkJournals(uniqueJournals, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Builds the external API string based on request parameters
   * @param validatedReq - Validated external request data
   * @returns API string
   */
  private buildExternalApiString(validatedReq: Partial<IExternalRow> & { spreadsheetName?: string; sheetName?: string }): string {
    const spreadsheetName = validatedReq.spreadsheetName || "journalSheet";
    const sheetName = validatedReq.sheetName || "Sheet1";
    
    if (validatedReq.row) {
      return `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=${encodeURIComponent(spreadsheetName)}&sheetName=${encodeURIComponent(sheetName)}&row=${validatedReq.row}`;
    } else {
      return `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=${encodeURIComponent(spreadsheetName)}&sheetName=${encodeURIComponent(sheetName)}`;
    }
  }

  /**
   * Processes external data and converts it to journal format
   * Column B (index 1) = journalTitle
   * Column C (index 2) = pdfLink
   * Column F (index 5) = google_uid
   * @param externalData - External data from API
   * @returns Array of processed journal items
   */
  private async processExternalData(
    externalData: any
  ): Promise<IJournal[]> {
    const items: IJournal[] = [];

    // Process each external data item
    for (let i: number = 0; i < externalData.data.data.length; i++) {
      const rawItem = externalData.data.data[i];
      
      // Column B (index 1) = journalTitle
      // Column C (index 2) = pdfLink
      // Column F (index 5) = google_uid
      // Handle both array format [colA, colB, colC, colD, colE, colF] and object format
      let journalTitle: string | undefined;
      let pdfLink: string | undefined;
      let google_uid: string | undefined;

      if (Array.isArray(rawItem)) {
        // Array format: [colA, colB, colC, colD, colE, colF]
        journalTitle = rawItem[1]?.trim();
        pdfLink = rawItem[2]?.trim();
        google_uid = rawItem[5]?.trim();
      } else {
        // Object format: check headers or use properties
        const headers = externalData.data.headers || [];
        if (headers.length >= 6) {
          journalTitle = rawItem[headers[1]]?.trim();
          pdfLink = rawItem[headers[2]]?.trim();
          google_uid = rawItem[headers[5]]?.trim();
        } else {
          // Fallback: use properties by index
          const keys = Object.keys(rawItem);
          if (keys.length >= 6) {
            journalTitle = rawItem[keys[1]]?.trim();
            pdfLink = rawItem[keys[2]]?.trim();
            google_uid = rawItem[keys[5]]?.trim();
          }
        }
      }

      // Skip if required fields are missing
      if (!journalTitle || !pdfLink || !google_uid) {
        continue;
      }

      const processedJournal: IJournal = {
        journalTitle: this.utilService.stringToLowerCaseTrim(journalTitle),
        pdfLink: pdfLink,
        google_uid: google_uid.trim(),
      };

      items.push(processedJournal);
    }

    return items;
  }

  /**
   * Filters out journals that already exist in the database (by google_uid)
   * @param journals - Array of journals to check
   * @param dataSource - DataSource instance
   * @returns Array of unique journals that don't exist yet
   */
  private async filterDuplicateJournals(journals: IJournal[], dataSource: DataSource): Promise<IJournal[]> {
    try {
      const uniqueJournals: IJournal[] = [];

      for (const journal of journals) {
        const existingJournal = await this.journalService.findByGoogleUid(journal.google_uid, dataSource);
        if (!existingJournal) {
          // Only add if it doesn't already exist
          uniqueJournals.push(journal);
        }
      }

      return uniqueJournals;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

