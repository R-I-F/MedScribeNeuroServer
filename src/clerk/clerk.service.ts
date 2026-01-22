import { inject, injectable } from "inversify";
import { IClerk, IClerkDoc } from "./clerk.interface";
import { AppDataSource } from "../config/database.config";
import { ClerkEntity } from "./clerk.mDbSchema";
import { ClerkProvider } from "./clerk.provider";
import { Repository } from "typeorm";

@injectable()
export class ClerkService {
  private clerkRepository: Repository<ClerkEntity>;

  constructor(@inject(ClerkProvider) private clerkProvider: ClerkProvider) {
    this.clerkRepository = AppDataSource.getRepository(ClerkEntity);
  }

  public async createClerk(validatedReq: Partial<IClerk>): Promise<IClerkDoc> | never {
    try {
      return await this.clerkProvider.createClerk(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllClerks(): Promise<IClerkDoc[]> | never {
    try {
      return await this.clerkProvider.getAllClerks();
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getClerkById(validatedReq: { id: string }): Promise<IClerkDoc | null> | never {
    try {
      return await this.clerkProvider.getClerkById(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getClerkByEmail(email: string): Promise<IClerkDoc | null> | never {
    try {
      return await this.clerkProvider.getClerkByEmail(email);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateClerk(validatedReq: Partial<IClerk> & { id: string }): Promise<IClerkDoc | null> | never {
    try {
      return await this.clerkProvider.updateClerk(validatedReq);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteClerk(validatedReq: { id: string }): Promise<boolean> | never {
    try {
      return await this.clerkProvider.deleteClerk(validatedReq.id);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
