import { inject, injectable } from "inversify";
import { LectureService } from "./lecture.service";
import { ILecture, ILectureDoc, ILectureInput, ILectureUpdateInput, TLectureLevel } from "./lecture.interface";
import { UtilService } from "../utils/utils.service";
import { ExternalService } from "../externalService/external.service";
import { IExternalRow } from "../arabProc/interfaces/IExternalRow.interface";

@injectable()
export class LectureProvider {
  constructor(
    @inject(LectureService) private lectureService: LectureService,
    @inject(UtilService) private utilService: UtilService,
    @inject(ExternalService) private externalService: ExternalService
  ) {}

  public async createLecture(validatedReq: ILectureInput): Promise<ILectureDoc> | never {
    try {
      // Business logic: Process and transform data
      const processedData: ILecture = {
        lectureTitle: this.utilService.stringToLowerCaseTrim(validatedReq.lectureTitle),
        google_uid: validatedReq.google_uid.trim(),
        mainTopic: this.utilService.stringToLowerCaseTrim(validatedReq.mainTopic),
        level: validatedReq.level,
      };

      // Check for duplicate google_uid
      await this.checkForDuplicateGoogleUid(processedData.google_uid);

      // Call service to create lecture
      return await this.lectureService.createLecture(processedData);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllLectures(): Promise<ILectureDoc[]> | never {
    try {
      return await this.lectureService.getAllLectures();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getLectureById(id: string): Promise<ILectureDoc | null> | never {
    try {
      return await this.lectureService.getLectureById(id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateLecture(validatedReq: ILectureUpdateInput): Promise<ILectureDoc | null> | never {
    try {
      const { id, ...updateData } = validatedReq;

      // Build update fields object
      const updateFields: Partial<ILecture> = {};

      if (updateData.lectureTitle !== undefined) {
        updateFields.lectureTitle = this.utilService.stringToLowerCaseTrim(updateData.lectureTitle);
      }

      if (updateData.google_uid !== undefined) {
        updateFields.google_uid = updateData.google_uid.trim();
        // Check for duplicate google_uid if it's being updated
        await this.checkForDuplicateGoogleUid(updateFields.google_uid, id);
      }

      if (updateData.mainTopic !== undefined) {
        updateFields.mainTopic = this.utilService.stringToLowerCaseTrim(updateData.mainTopic);
      }

      if (updateData.level !== undefined) {
        updateFields.level = updateData.level;
      }

      return await this.lectureService.updateLecture(id, updateFields);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteLecture(id: string): Promise<boolean> | never {
    try {
      return await this.lectureService.deleteLecture(id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Checks for duplicate google_uid
   * @param google_uid - Google UID to check
   * @param excludeId - Optional ID to exclude from check (for updates)
   * @throws Error if duplicate found
   */
  private async checkForDuplicateGoogleUid(google_uid: string, excludeId?: string): Promise<void> {
    try {
      const existingLecture = await this.lectureService.findByGoogleUid(google_uid, excludeId);
      
      if (existingLecture) {
        throw new Error(`Lecture with google_uid '${google_uid}' already exists`);
      }
    } catch (err: any) {
      // If it's already our custom error, re-throw it
      if (err.message && err.message.includes("already exists")) {
        throw err;
      }
      // If it's a duplicate key error from database, throw a more user-friendly message
      if (err.message && err.message.includes("duplicate key")) {
        throw new Error(`Lecture with google_uid '${google_uid}' already exists`);
      }
      throw err;
    }
  }

  /**
   * Creates lectures from external spreadsheet data
   * @param validatedReq - External request with spreadsheet info and mainTopic
   * @returns Promise<ILectureDoc[]>
   */
  public async createLecturesFromExternal(
    validatedReq: Partial<IExternalRow> & { mainTopic: string }
  ): Promise<ILectureDoc[]> | never {
    try {
      // Build API string
      const apiString = this.buildExternalApiString(validatedReq);
      
      // Fetch external data
      const externalData = await this.externalService.fetchExternalData(apiString);
      
      if (!externalData.success) {
        throw new Error("Failed to fetch external data");
      }

      // Process external data
      const processedLectures = await this.processExternalData(
        externalData,
        validatedReq.mainTopic
      );

      // Filter out duplicates before bulk creation
      const uniqueLectures = await this.filterDuplicateLectures(processedLectures);

      // Create bulk lectures (only new ones)
      if (uniqueLectures.length === 0) {
        return [];
      }
      return await this.lectureService.createBulkLectures(uniqueLectures);
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
    const spreadsheetName = validatedReq.spreadsheetName || "lectureSheet";
    const sheetName = validatedReq.sheetName || "Sheet1";
    
    if (validatedReq.row) {
      return `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=${encodeURIComponent(spreadsheetName)}&sheetName=${encodeURIComponent(sheetName)}&row=${validatedReq.row}`;
    } else {
      return `${process.env.GETTER_API_ENDPOINT}?spreadsheetName=${encodeURIComponent(spreadsheetName)}&sheetName=${encodeURIComponent(sheetName)}`;
    }
  }

  /**
   * Processes external data and converts it to lecture format
   * Column A (index 0) = lectureTitle
   * Column B (index 1) = ignore
   * Column C (index 2) = google_uid
   * @param externalData - External data from API
   * @param mainTopic - Main topic for all lectures
   * @returns Array of processed lecture items
   */
  private async processExternalData(
    externalData: any,
    mainTopic: string
  ): Promise<ILecture[]> {
    const items: ILecture[] = [];

    // Process each external data item
    for (let i: number = 0; i < externalData.data.data.length; i++) {
      const rawItem = externalData.data.data[i];
      
      // Column A (index 0) = lectureTitle
      // Column B (index 1) = ignore
      // Column C (index 2) = google_uid
      // Handle both array format [colA, colB, colC] and object format
      let lectureTitle: string | undefined;
      let google_uid: string | undefined;

      if (Array.isArray(rawItem)) {
        // Array format: [colA, colB, colC]
        lectureTitle = rawItem[0]?.trim();
        google_uid = rawItem[2]?.trim();
      } else {
        // Object format: check headers or use first three properties
        const headers = externalData.data.headers || [];
        if (headers.length >= 3) {
          lectureTitle = rawItem[headers[0]]?.trim();
          google_uid = rawItem[headers[2]]?.trim();
        } else {
          // Fallback: use first and third properties
          const keys = Object.keys(rawItem);
          if (keys.length >= 3) {
            lectureTitle = rawItem[keys[0]]?.trim();
            google_uid = rawItem[keys[2]]?.trim();
          }
        }
      }

      // Skip if required fields are missing
      if (!lectureTitle || !google_uid) {
        continue;
      }

      // Auto-detect level from title pattern: digit1.digit2.digit3: title
      const level: TLectureLevel = this.detectLevelFromTitle(lectureTitle);

      const processedLecture: ILecture = {
        lectureTitle: this.utilService.stringToLowerCaseTrim(lectureTitle),
        google_uid: google_uid,
        mainTopic: this.utilService.stringToLowerCaseTrim(mainTopic),
        level: level,
      };

      items.push(processedLecture);
    }

    return items;
  }

  /**
   * Auto-detects lecture level from title pattern
   * Pattern: digit1.digit2.digit3[letter]: title or digit1.digit2.digit3[letter] title
   * - If digit3 is 0, 1, or 2 → msc level
   * - If digit3 is 3 or 4 → md level
   * - If no pattern → defaults to msc
   * @param title - Lecture title
   * @returns Detected level
   */
  private detectLevelFromTitle(title: string): TLectureLevel {
    // Pattern: digit1.digit2.digit3[optional letter][optional colon or space]: title
    // Matches patterns like: "1.2.2:", "1.2.2b:", "1.2.2b ", "1.2.2 ", "3.00.0:"
    const pattern = /^(\d+)\.(\d+)\.(\d+)([a-zA-Z])?[\s:]/;
    const match = title.match(pattern);

    if (match) {
      const digit3 = parseInt(match[3]);
      if (digit3 === 0 || digit3 === 1 || digit3 === 2) {
        return "msc";
      } else if (digit3 === 3 || digit3 === 4) {
        return "md";
      }
    }

    // Default to msc if no pattern matches
    return "msc";
  }

  /**
   * Filters out lectures that already exist in the database (by google_uid)
   * @param lectures - Array of lectures to check
   * @returns Array of unique lectures that don't exist yet
   */
  private async filterDuplicateLectures(lectures: ILecture[]): Promise<ILecture[]> {
    try {
      const uniqueLectures: ILecture[] = [];

      for (const lecture of lectures) {
        const existingLecture = await this.lectureService.findByGoogleUid(lecture.google_uid);
        if (!existingLecture) {
          // Only add if it doesn't already exist
          uniqueLectures.push(lecture);
        }
      }

      return uniqueLectures;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}

