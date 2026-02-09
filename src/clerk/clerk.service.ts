import { inject, injectable } from "inversify";
import { DataSource } from "typeorm";
import { IClerk, IClerkDoc } from "./clerk.interface";
import { ClerkProvider } from "./clerk.provider";

@injectable()
export class ClerkService {
  constructor(@inject(ClerkProvider) private clerkProvider: ClerkProvider) {}

  public async createClerk(validatedReq: Partial<IClerk>, dataSource: DataSource): Promise<IClerkDoc> | never {
    try {
      return await this.clerkProvider.createClerk(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllClerks(dataSource: DataSource): Promise<IClerkDoc[]> | never {
    try {
      return await this.clerkProvider.getAllClerks(dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getClerkById(validatedReq: { id: string }, dataSource: DataSource): Promise<IClerkDoc | null> | never {
    try {
      return await this.clerkProvider.getClerkById(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getClerkByEmail(email: string, dataSource: DataSource): Promise<IClerkDoc | null> | never {
    try {
      return await this.clerkProvider.getClerkByEmail(email, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateClerk(validatedReq: Partial<IClerk> & { id: string }, dataSource: DataSource): Promise<IClerkDoc | null> | never {
    try {
      return await this.clerkProvider.updateClerk(validatedReq, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteClerk(validatedReq: { id: string }, dataSource: DataSource): Promise<boolean> | never {
    try {
      return await this.clerkProvider.deleteClerk(validatedReq.id, dataSource);
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
