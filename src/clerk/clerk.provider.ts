import { injectable } from "inversify";
import { DataSource } from "typeorm";
import { IClerk, IClerkDoc } from "./clerk.interface";
import { ClerkEntity } from "./clerk.mDbSchema";

@injectable()
export class ClerkProvider {
  private readonly uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  public async createClerk(validatedReq: Partial<IClerk>, dataSource: DataSource): Promise<IClerkDoc> | never {
    try {
      const clerkRepository = dataSource.getRepository(ClerkEntity);
      const newClerk = clerkRepository.create(validatedReq);
      const savedClerk = await clerkRepository.save(newClerk);
      return savedClerk as unknown as IClerkDoc;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getAllClerks(dataSource: DataSource): Promise<IClerkDoc[]> | never {
    try {
      const clerkRepository = dataSource.getRepository(ClerkEntity);
      const clerks = await clerkRepository.find({
        order: { createdAt: "DESC" },
      });
      return clerks as unknown as IClerkDoc[];
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async getClerkById(id: string, dataSource: DataSource): Promise<IClerkDoc | null> | never {
    try {
      const clerkRepository = dataSource.getRepository(ClerkEntity);
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid clerk ID format");
      }
      const clerk = await clerkRepository.findOne({
        where: { id },
      });
      return clerk as unknown as IClerkDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  /** Canonical email: lowercase, trim, dots removed from local part (Gmail-style equivalence). */
  private static canonicalEmail(email: string): string {
    const n = (email || "").trim().toLowerCase();
    const at = n.indexOf("@");
    if (at <= 0) return n;
    return n.slice(0, at).replace(/\./g, "") + n.slice(at);
  }

  public async getClerkByEmail(email: string, dataSource: DataSource): Promise<IClerkDoc | null> | never {
    try {
      const clerkRepository = dataSource.getRepository(ClerkEntity);
      const normalized = (email || "").trim().toLowerCase();
      if (!normalized) return null;
      const canonical = ClerkProvider.canonicalEmail(email);
      const clerk = await clerkRepository
        .createQueryBuilder("c")
        .where(
          "LOWER(TRIM(c.email)) = :normalized OR (CONCAT(REPLACE(SUBSTRING_INDEX(LOWER(TRIM(c.email)), '@', 1), '.', ''), '@', SUBSTRING_INDEX(LOWER(TRIM(c.email)), '@', -1)) = :canonical)",
          { normalized, canonical }
        )
        .getOne();
      return clerk as unknown as IClerkDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async updateClerk(validatedReq: Partial<IClerk> & { id: string }, dataSource: DataSource): Promise<IClerkDoc | null> | never {
    try {
      const clerkRepository = dataSource.getRepository(ClerkEntity);
      const { id, ...updateData } = validatedReq;
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid clerk ID format");
      }
      await clerkRepository.update(id, updateData);
      const updatedClerk = await clerkRepository.findOne({
        where: { id },
      });
      return updatedClerk as unknown as IClerkDoc | null;
    } catch (err: any) {
      throw new Error(err);
    }
  }

  public async deleteClerk(id: string, dataSource: DataSource): Promise<boolean> | never {
    try {
      const clerkRepository = dataSource.getRepository(ClerkEntity);
      if (!this.uuidRegex.test(id)) {
        throw new Error("Invalid clerk ID format");
      }
      const result = await clerkRepository.delete(id);
      return (result.affected ?? 0) > 0;
    } catch (err: any) {
      throw new Error(err);
    }
  }
}
