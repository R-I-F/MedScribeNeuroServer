import { inject, injectable } from "inversify";
import { ConfService } from "./conf.service";
import { IConf, IConfDoc, IConfInput, IConfUpdateInput } from "./conf.interface";
import { UtilService } from "../utils/utils.service";
import { SupervisorService } from "../supervisor/supervisor.service";
import { Types } from "mongoose";

@injectable()
export class ConfProvider {
  constructor(
    @inject(ConfService) private confService: ConfService,
    @inject(UtilService) private utilService: UtilService,
    @inject(SupervisorService) private supervisorService: SupervisorService
  ) {}

  public async createConf(validatedReq: IConfInput): Promise<IConfDoc> | never {
    try {
      // Validate that presenter is a valid Supervisor
      await this.validateSupervisorExists(validatedReq.presenter.toString());

      // Business logic: Process and transform data
      const processedData: IConf = {
        confTitle: this.utilService.stringToLowerCaseTrim(validatedReq.confTitle),
        google_uid: validatedReq.google_uid.trim(),
        presenter: validatedReq.presenter,
        date: validatedReq.date,
      };

      // Check for duplicate google_uid
      await this.checkForDuplicateGoogleUid(processedData.google_uid);

      // Call service to create conf
      return await this.confService.createConf(processedData);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllConfs(): Promise<IConfDoc[]> | never {
    try {
      return await this.confService.getAllConfs();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getConfById(id: string): Promise<IConfDoc | null> | never {
    try {
      return await this.confService.getConfById(id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateConf(validatedReq: IConfUpdateInput): Promise<IConfDoc | null> | never {
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
        await this.checkForDuplicateGoogleUid(updateFields.google_uid, id);
      }

      if (updateData.presenter !== undefined) {
        // Validate that presenter is a valid Supervisor
        await this.validateSupervisorExists(updateData.presenter.toString());
        updateFields.presenter = updateData.presenter;
      }

      if (updateData.date !== undefined) {
        updateFields.date = updateData.date;
      }

      return await this.confService.updateConf(id, updateFields);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteConf(id: string): Promise<boolean> | never {
    try {
      return await this.confService.deleteConf(id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /**
   * Validates that the presenter ObjectId exists in the Supervisor collection
   * @param presenterId - Supervisor ObjectId to validate
   * @throws Error if supervisor not found
   */
  private async validateSupervisorExists(presenterId: string): Promise<void> {
    try {
      if (!Types.ObjectId.isValid(presenterId)) {
        throw new Error("Invalid presenter ID format");
      }

      const supervisor = await this.supervisorService.getSupervisorById({ id: presenterId });
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
   * @param excludeId - Optional ID to exclude from check (for updates)
   * @throws Error if duplicate found
   */
  private async checkForDuplicateGoogleUid(google_uid: string, excludeId?: string): Promise<void> {
    try {
      const existingConf = await this.confService.findByGoogleUid(google_uid, excludeId);
      
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

