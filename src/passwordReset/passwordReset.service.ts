import { injectable } from "inversify";
import { AppDataSource } from "../config/database.config";
import { PasswordResetTokenEntity } from "./passwordReset.mDbSchema";
import { IPasswordResetToken, IPasswordResetTokenDoc } from "./passwordReset.interface";
import { Repository, LessThan, MoreThanOrEqual, DataSource } from "typeorm";

@injectable()
export class PasswordResetService {
  private getRepository(dataSource?: DataSource): Repository<PasswordResetTokenEntity> {
    return (dataSource || AppDataSource).getRepository(PasswordResetTokenEntity);
  }

  public async createPasswordResetToken(
    data: IPasswordResetToken,
    dataSource?: DataSource
  ): Promise<IPasswordResetTokenDoc> | never {
    try {
      const passwordResetRepository = this.getRepository(dataSource);
      const tokenDoc = passwordResetRepository.create(data);
      const savedToken = await passwordResetRepository.save(tokenDoc);
      return savedToken as unknown as IPasswordResetTokenDoc;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async findTokenByValue(token: string, dataSource?: DataSource): Promise<IPasswordResetTokenDoc | null> | never {
    try {
      const passwordResetRepository = this.getRepository(dataSource);
      const tokenDoc = await passwordResetRepository.findOne({
        where: { token },
      });
      return tokenDoc as unknown as IPasswordResetTokenDoc | null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async markTokenAsUsed(token: string, dataSource?: DataSource): Promise<IPasswordResetTokenDoc | null> | never {
    try {
      const passwordResetRepository = this.getRepository(dataSource);
      await passwordResetRepository.update(
        { token },
        { used: true }
      );
      const updatedToken = await passwordResetRepository.findOne({
        where: { token },
      });
      return updatedToken as unknown as IPasswordResetTokenDoc | null;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async countTokensByUserId(userId: string, timeWindowMs: number, dataSource?: DataSource): Promise<number> | never {
    try {
      const passwordResetRepository = this.getRepository(dataSource);
      const cutoffTime = new Date(Date.now() - timeWindowMs);
      // Count tokens created AFTER the cutoff time (within the time window)
      const count = await passwordResetRepository.count({
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

  public async deleteExpiredTokens(dataSource?: DataSource): Promise<number> | never {
    try {
      const passwordResetRepository = this.getRepository(dataSource);
      const now = new Date();
      const result = await passwordResetRepository.delete({
        expiresAt: LessThan(now),
      });
      return result.affected ?? 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}
