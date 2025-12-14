import { injectable } from "inversify";
import { Model } from "mongoose";
import { PasswordResetToken } from "./passwordReset.schema";
import { IPasswordResetToken, IPasswordResetTokenDoc } from "./passwordReset.interface";

@injectable()
export class PasswordResetService {
  private passwordResetModel: Model<IPasswordResetToken> = PasswordResetToken;

  public async createPasswordResetToken(
    data: Omit<IPasswordResetToken, "_id" | "createdAt" | "updatedAt">
  ): Promise<IPasswordResetTokenDoc> | never {
    try {
      const tokenDoc = new this.passwordResetModel(data);
      return await tokenDoc.save();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async findTokenByValue(token: string): Promise<IPasswordResetTokenDoc | null> | never {
    try {
      return await this.passwordResetModel.findOne({ token }).exec();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async markTokenAsUsed(token: string): Promise<IPasswordResetTokenDoc | null> | never {
    try {
      return await this.passwordResetModel
        .findOneAndUpdate(
          { token },
          { used: true },
          { new: true }
        )
        .exec();
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async countTokensByEmail(email: string, timeWindowMs: number): Promise<number> | never {
    try {
      const cutoffTime = new Date(Date.now() - timeWindowMs);
      // We need to check tokens by userId, but we don't have email in token model
      // This will be handled in the provider layer
      return 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }

  public async deleteExpiredTokens(): Promise<number> | never {
    try {
      const result = await this.passwordResetModel.deleteMany({
        expiresAt: { $lt: new Date() },
      }).exec();
      return (result as { deletedCount?: number }).deletedCount ?? 0;
    } catch (error: any) {
      throw new Error(error.message);
    }
  }
}

