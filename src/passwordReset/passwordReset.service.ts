import { injectable } from "inversify";
import { AppDataSource } from "../config/database.config";
import { PasswordResetTokenEntity } from "./passwordReset.mDbSchema";
import { IPasswordResetToken, IPasswordResetTokenDoc } from "./passwordReset.interface";
import { Repository, LessThan, MoreThanOrEqual } from "typeorm";

@injectable()
export class PasswordResetService {
  private passwordResetRepository: Repository<PasswordResetTokenEntity>;

  constructor() {
    this.passwordResetRepository = AppDataSource.getRepository(PasswordResetTokenEntity);
  }

  public async createPasswordResetToken(
    data: IPasswordResetToken
  ): Promise<IPasswordResetTokenDoc> | never {
    try {
      const tokenDoc = this.passwordResetRepository.create(data);
      const savedToken = await this.passwordResetRepository.save(tokenDoc);
      return savedToken as unknown as IPasswordResetTokenDoc;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async findTokenByValue(token: string): Promise<IPasswordResetTokenDoc | null> | never {
    try {
      const tokenDoc = await this.passwordResetRepository.findOne({
        where: { token },
      });
      return tokenDoc as unknown as IPasswordResetTokenDoc | null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async markTokenAsUsed(token: string): Promise<IPasswordResetTokenDoc | null> | never {
    try {
      await this.passwordResetRepository.update(
        { token },
        { used: true }
      );
      const updatedToken = await this.passwordResetRepository.findOne({
        where: { token },
      });
      return updatedToken as unknown as IPasswordResetTokenDoc | null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async countTokensByEmail(email: string, timeWindowMs: number): Promise<number> | never {
    try {
      // This method is not fully implemented as it requires finding user by email first
      // The provider layer handles this by finding the user first, then counting tokens
      // For now, return 0 as placeholder
      return 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async countTokensByUserId(userId: string, timeWindowMs: number): Promise<number> | never {
    try {
      const cutoffTime = new Date(Date.now() - timeWindowMs);
      // Count tokens created AFTER the cutoff time (within the time window)
      const count = await this.passwordResetRepository.count({
        where: {
          userId,
          createdAt: MoreThanOrEqual(cutoffTime),
        },
      });
      return count;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async deleteExpiredTokens(): Promise<number> | never {
    try {
      const now = new Date();
      const result = await this.passwordResetRepository.delete({
        expiresAt: LessThan(now),
      });
      return result.affected ?? 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
