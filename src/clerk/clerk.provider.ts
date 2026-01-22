import { injectable } from "inversify";
import { IClerk, IClerkDoc } from "./clerk.interface";
import { AppDataSource } from "../config/database.config";
import { ClerkEntity } from "./clerk.mDbSchema";
import { Repository } from "typeorm";

@injectable()
export class ClerkProvider {
  private clerkRepository: Repository<ClerkEntity>;
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  constructor() {
    this.clerkRepository = AppDataSource.getRepository(ClerkEntity);
  }

  public async createClerk(validatedReq: Partial<IClerk>): Promise<IClerkDoc> | never {
    try {
      const newClerk = this.clerkRepository.create(validatedReq);
      const savedClerk = await this.clerkRepository.save(newClerk);
      return savedClerk as unknown as IClerkDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllClerks(): Promise<IClerkDoc[]> | never {
    try {
      const clerks = await this.clerkRepository.find({
        order: { createdAt: "DESC" },
      });
      return clerks as unknown as IClerkDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getClerkById(id: string): Promise<IClerkDoc | null> | never {
    try {
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid clerk ID format");
      }
      const clerk = await this.clerkRepository.findOne({
        where: { id },
      });
      return clerk as unknown as IClerkDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getClerkByEmail(email: string): Promise<IClerkDoc | null> | never {
    try {
      const clerk = await this.clerkRepository.findOne({
        where: { email },
      });
      return clerk as unknown as IClerkDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateClerk(validatedReq: Partial<IClerk> & { id: string }): Promise<IClerkDoc | null> | never {
    try {
      const { id, ...updateData } = validatedReq;
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid clerk ID format");
      }
      await this.clerkRepository.update(id, updateData);
      const updatedClerk = await this.clerkRepository.findOne({
        where: { id },
      });
      return updatedClerk as unknown as IClerkDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteClerk(id: string): Promise<boolean> | never {
    try {
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid clerk ID format");
      }
      const result = await this.clerkRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
