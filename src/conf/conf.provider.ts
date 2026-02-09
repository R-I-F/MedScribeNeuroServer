import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { ConfService } from "./conf.service";
import { IConf, IConfDoc, IConfInput, IConfUpdateInput } from "./conf.interface";
import { UtilService } from "../utils/utils.service";
import { SupervisorService } from "../supervisor/supervisor.service";
// Removed: import { Types } from "mongoose"; - Now using UUIDs directly for MariaDB

@injectable()
export class ConfProvider {
  constructor(
    @inject(ConfService) private confService: ConfService,
    @inject(UtilService) private utilService: UtilService,
    @inject(SupervisorService) private supervisorService: SupervisorService
  ) {}

  public async createConf(validatedReq: IConfInput, dataSource: DataSource): Promise<IConfDoc> | never {
    try {
      // Handle both 'presenter' (input) and 'presenterId' (internal) formats
      const presenterId = (validatedReq as any).presenter || (validatedReq as any).presenterId;
      
      // Validate that presenter is a valid Supervisor
      await this.validateSupervisorExists(presenterId, dataSource);

      // Business logic: Process and transform data
      const processedData: IConf = {
        confTitle: this.utilService.stringToLowerCaseTrim(validatedReq.confTitle),
        google_uid: validatedReq.google_uid.trim(),
        presenterId: presenterId, // Use presenterId for MariaDB
        date: validatedReq.date,
      };

      // Check for duplicate google_uid
      await this.checkForDuplicateGoogleUid(processedData.google_uid, dataSource);

      // Call service to create conf
      return await this.confService.createConf(processedData, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllConfs(dataSource: DataSource): Promise<IConfDoc[]> | never {
    try {
      return await this.confService.getAllConfs(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getConfById(id: string, dataSource: DataSource): Promise<IConfDoc | null> | never {
    try {
      return await this.confService.getConfById(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateConf(validatedReq: IConfUpdateInput, dataSource: DataSource): Promise<IConfDoc | null> | never {
    try {
      const { id, ...updateData } = validatedReq;

      // Build update fields object
      const updateFields: Partial<IConf> = {};

      if (updateData.confTitle !== undefined) {
        updateFields.confTitle = this.utilService.stringToLowerCaseTrim(updateData.confTitle);
      }

      if (updateData.google_uid !== undefined) {
        updateFields.google_uid = updateData.google_uid.trim();
        // Check for duplicate google_uid if it's being updated
        await this.checkForDuplicateGoogleUid(updateFields.google_uid, dataSource, id);
      }

      // Handle both 'presenter' (input) and 'presenterId' (internal) formats
      if (updateData.presenter !== undefined || (updateData as any).presenterId !== undefined) {
        const presenterId = updateData.presenter || (updateData as any).presenterId;
        // Validate that presenter is a valid Supervisor
        await this.validateSupervisorExists(presenterId, dataSource);
        updateFields.presenterId = presenterId; // Use presenterId for MariaDB
      }

      if (updateData.date !== undefined) {
        updateFields.date = updateData.date;
      }

      return await this.confService.updateConf(id, updateFields, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteConf(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      return await this.confService.deleteConf(id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Validates that the presenter UUID exists in the Supervisor collection
   * @param presenterId - Supervisor UUID to validate
   * @param dataSource - DataSource instance
   * @throws Error if supervisor not found
   */
  private async validateSupervisorExists(presenterId: string, dataSource: DataSource): Promise<void> {
    try {
      // Validate UUID format
      const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(presenterId)) {
        throw new Error("Invalid presenter ID format");
      }

      const supervisor = await this.supervisorService.getSupervisorById({ id: presenterId }, dataSource);
      if (!supervisor) {
        throw new Error(`Supervisor with ID '${presenterId}' not found`);
      }
    } catch (err: any) {
      // If it's already our custom error, re-throw it
      if (err.message && (err.message.includes("not found") || err.message.includes("Invalid"))) {
        throw err;
      }
      throw new Error(`Failed to validate supervisor: ${err.message}`);
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
      const existingConf = await this.confService.findByGoogleUid(google_uid, dataSource, excludeId);
      
      if (existingConf) {
        throw new Error(`Conf with google_uid '${google_uid}' already exists`);
      }
    } catch (err: any) {
      // If it's already our custom error, re-throw it
      if (err.message && err.message.includes("already exists")) {
        throw err;
      }
      // If it's a duplicate key error from database, throw a more user-friendly message
      if (err.message && err.message.includes("duplicate key")) {
        throw new Error(`Conf with google_uid '${google_uid}' already exists`);
      }
      throw err;
    }
  }
}

